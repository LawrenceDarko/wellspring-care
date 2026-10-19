import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createKeyring,
  decryptField,
  encryptField,
  FieldCryptoError,
  needsRotation,
  type EncryptedField,
} from "@/server/crypto/field";
import { startMongo, type TestMongo } from "../helpers/mongo";

const k1 = randomBytes(32).toString("base64");
const k2 = randomBytes(32).toString("base64");
const ring = createKeyring("k1", { k1 });
const SECRET = "Please pray for my brother's recovery";

describe("field encryption", () => {
  it("round trips and uses a fresh IV per call", () => {
    const a = encryptField(SECRET, undefined, ring);
    const b = encryptField(SECRET, undefined, ring);
    expect(a).toMatchObject({ v: 1, kid: "k1" });
    expect(Buffer.from(a.iv, "base64")).toHaveLength(12);
    expect(a.iv).not.toBe(b.iv);
    expect(a.ct).not.toBe(b.ct);
    expect(decryptField(a, undefined, ring)).toBe(SECRET);
    expect(decryptField(encryptField("", undefined, ring), undefined, ring)).toBe("");
  });

  it("fails on tampered ciphertext, tag or iv", () => {
    const enc = encryptField(SECRET, undefined, ring);
    const flip = (b64: string) => {
      const buf = Buffer.from(b64, "base64");
      buf[0] ^= 1;
      return buf.toString("base64");
    };
    for (const key of ["ct", "tag", "iv"] as const) {
      expect(() => decryptField({ ...enc, [key]: flip(enc[key]) }, undefined, ring)).toThrow(FieldCryptoError);
    }
  });

  it("fails with an unknown kid or the wrong key under the same kid", () => {
    const enc = encryptField(SECRET, undefined, ring);
    expect(() => decryptField({ ...enc, kid: "k2" }, undefined, ring)).toThrow(/Unknown field key id/);
    const wrongKey = createKeyring("k1", { k1: k2 });
    expect(() => decryptField(enc, undefined, wrongKey)).toThrow(FieldCryptoError);
  });

  it("binds ciphertext to its aad", () => {
    const enc = encryptField(SECRET, "pastoral_notes.body:1", ring);
    expect(decryptField(enc, "pastoral_notes.body:1", ring)).toBe(SECRET);
    expect(() => decryptField(enc, "pastoral_notes.body:2", ring)).toThrow(FieldCryptoError);
    expect(() => decryptField(enc, undefined, ring)).toThrow(FieldCryptoError);
  });

  it("supports rotation: old kid still decrypts, new writes use current kid", () => {
    const old = encryptField(SECRET, undefined, ring);
    const rotated = createKeyring("k2", { k1, k2 });
    expect(decryptField(old, undefined, rotated)).toBe(SECRET);
    expect(needsRotation(old, rotated)).toBe(true);
    const fresh = encryptField(SECRET, undefined, rotated);
    expect(fresh.kid).toBe("k2");
    expect(needsRotation(fresh, rotated)).toBe(false);
  });

  it("rejects invalid keys and error messages carry no plaintext", () => {
    expect(() => createKeyring("k1", { k1: randomBytes(16).toString("base64") })).toThrow(FieldCryptoError);
    expect(() => createKeyring("k9", { k1 })).toThrow(FieldCryptoError);
    const enc = encryptField(SECRET, undefined, ring);
    try {
      decryptField({ ...enc, tag: Buffer.alloc(16).toString("base64") }, undefined, ring);
      expect.unreachable();
    } catch (err) {
      expect(String((err as Error).message)).not.toContain(SECRET);
      expect(String((err as Error).message)).not.toContain(enc.ct);
    }
  });
});

describe("stored document", () => {
  let mongo: TestMongo;
  beforeAll(async () => {
    mongo = await startMongo("field_crypto_test");
  }, 120_000);
  afterAll(async () => {
    await mongo?.stop();
  });

  it("contains no plaintext and decrypts after a read", async () => {
    const _id = new ObjectId();
    const body = encryptField(SECRET, `private_reflections.body:${_id}`, ring);
    await mongo.db.collection("private_reflections").insertOne({ _id, ownerId: new ObjectId(), body });

    const raw = await mongo.db.collection("private_reflections").findOne({ _id });
    const serialized = JSON.stringify(raw);
    expect(serialized).not.toContain(SECRET);
    expect(serialized).not.toContain("brother");
    expect(serialized).not.toContain(Buffer.from(SECRET).toString("base64"));
    expect(decryptField(raw!.body as EncryptedField, `private_reflections.body:${_id}`, ring)).toBe(SECRET);
  });
});
