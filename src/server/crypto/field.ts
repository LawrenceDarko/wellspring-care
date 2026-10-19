import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { getConfig } from "../config";

// PRD §13.3: AES-256-GCM, 96-bit random IV, key from FIELD_ENC_KEY with a
// `kid` for rotation. Stored shape per PRD §3.1: { v: 1, kid, iv, tag, ct } (base64).
// Protects against DB dumps and console browsing, not against env access.

export type EncryptedField = { v: 1; kid: string; iv: string; tag: string; ct: string };

export type FieldKeyring = {
  /** kid used for new encryptions. */
  readonly currentKid: string;
  /** All keys that may still decrypt (current + retired during rotation). */
  readonly keys: ReadonlyMap<string, Buffer>;
};

export class FieldCryptoError extends Error {
  constructor(message: string) {
    // Messages never include plaintext, ciphertext or key material.
    super(message);
    this.name = "FieldCryptoError";
  }
}

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

export function createKeyring(currentKid: string, keys: Record<string, string>): FieldKeyring {
  const map = new Map<string, Buffer>();
  for (const [kid, b64] of Object.entries(keys)) {
    const key = Buffer.from(b64, "base64");
    if (!kid || key.length !== 32) throw new FieldCryptoError(`Invalid field key for kid "${kid}"`);
    map.set(kid, key);
  }
  if (!map.has(currentKid)) throw new FieldCryptoError(`No key for current kid "${currentKid}"`);
  return { currentKid, keys: map };
}

let cached: FieldKeyring | undefined;

/** Keyring from FIELD_ENC_KEY / FIELD_ENC_KID, built once per process. */
export function getKeyring(): FieldKeyring {
  const { FIELD_ENC_KEY, FIELD_ENC_KID } = getConfig().env;
  cached ??= createKeyring(FIELD_ENC_KID, { [FIELD_ENC_KID]: FIELD_ENC_KEY });
  return cached;
}

/**
 * Encrypts `plaintext`. `aad` binds the ciphertext to its location
 * (e.g. "pastoral_notes.body:<docId>") so it cannot be moved to another record.
 */
export function encryptField(plaintext: string, aad?: string, keyring: FieldKeyring = getKeyring()): EncryptedField {
  const key = keyring.keys.get(keyring.currentKid);
  if (!key) throw new FieldCryptoError("Current field key missing");
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_BYTES });
  if (aad !== undefined) cipher.setAAD(Buffer.from(aad, "utf8"));
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    v: 1,
    kid: keyring.currentKid,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ct: ct.toString("base64"),
  };
}

/** Decrypts a stored field. Throws FieldCryptoError on unknown kid, tampering or wrong aad. */
export function decryptField(field: EncryptedField, aad?: string, keyring: FieldKeyring = getKeyring()): string {
  if (field?.v !== 1) throw new FieldCryptoError("Unsupported encrypted field version");
  const key = keyring.keys.get(field.kid);
  if (!key) throw new FieldCryptoError("Unknown field key id");
  const iv = Buffer.from(field.iv, "base64");
  const tag = Buffer.from(field.tag, "base64");
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) throw new FieldCryptoError("Malformed encrypted field");
  try {
    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_BYTES });
    if (aad !== undefined) decipher.setAAD(Buffer.from(aad, "utf8"));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(Buffer.from(field.ct, "base64")), decipher.final()]).toString("utf8");
  } catch {
    throw new FieldCryptoError("Encrypted field failed authentication");
  }
}

/** True when the field was written with a key other than the current one (re-encrypt on next write). */
export function needsRotation(field: EncryptedField, keyring: FieldKeyring = getKeyring()): boolean {
  return field.kid !== keyring.currentKid;
}
