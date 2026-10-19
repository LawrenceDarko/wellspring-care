import "server-only";
import type {
  Collection,
  Db,
  DeleteResult,
  Document,
  Filter,
  FindOptions,
  UpdateFilter,
  UpdateResult,
  WithId,
} from "mongodb";
import type { Capability } from "../auth/capabilities";
import type { AssignmentKind, AuthContext } from "../auth/context";

// PRD §13.1: MongoDB has no RLS, so this layer is the authorization boundary.
// Repositories never touch a raw Collection for reads/updates/deletes; they go
// through ScopedCollection, which ANDs a non-empty scope filter onto every
// query. A scope resolving to null means "no access": reads return
// null/[]/0 and writes match nothing.

export type ScopeFn<T extends Document> = (ctx: AuthContext) => Filter<T> | null;

export class UnscopedQueryError extends Error {
  constructor(collection: string) {
    super(`Refusing unscoped query on "${collection}"`);
    this.name = "UnscopedQueryError";
  }
}

const MAX_FIND_LIMIT = 500;

/** Records owned by the caller (`field` holds the owner's ObjectId). */
export function ownerScope<T extends Document>(field: string): ScopeFn<T> {
  return (ctx) => ({ [field]: ctx.userId }) as Filter<T>;
}

/** Records the caller is assigned to, only when they also hold `cap`. */
export function assignedScope<T extends Document>(
  cap: Capability,
  kind: AssignmentKind,
  field = "_id",
): ScopeFn<T> {
  return (ctx) => {
    if (!ctx.capabilities.has(cap)) return null;
    const ids = ctx.assignments[kind] ?? [];
    return ids.length ? ({ [field]: { $in: [...ids] } } as Filter<T>) : null;
  };
}

/** Every record, only for holders of `cap` (e.g. `bookings:manage`). Use sparingly. */
export function capabilityScope<T extends Document>(cap: Capability, filter: Filter<T>): ScopeFn<T> {
  return (ctx) => (ctx.capabilities.has(cap) ? filter : null);
}

/** Union of scopes; null when none grants access. */
export function anyScope<T extends Document>(...scopes: ScopeFn<T>[]): ScopeFn<T> {
  return (ctx) => {
    const parts = scopes.map((s) => s(ctx)).filter((f): f is Filter<T> => f !== null);
    if (parts.length === 0) return null;
    return parts.length === 1 ? parts[0] : ({ $or: parts } as Filter<T>);
  };
}

function isEmptyFilter(filter: Document): boolean {
  return Object.keys(filter).length === 0;
}

export class ScopedCollection<T extends Document> {
  private readonly coll: Collection<T>;

  constructor(
    db: Db,
    private readonly name: string,
    private readonly scope: ScopeFn<T>,
  ) {
    this.coll = db.collection<T>(name);
  }

  /** Scope AND caller filter, or null when the context has no access. */
  private scoped(ctx: AuthContext, filter: Filter<T>): Filter<T> | null {
    const scope = this.scope(ctx);
    if (scope === null) return null;
    if (isEmptyFilter(scope)) throw new UnscopedQueryError(this.name);
    return isEmptyFilter(filter) ? scope : ({ $and: [scope, filter] } as Filter<T>);
  }

  async findOne(ctx: AuthContext, filter: Filter<T>): Promise<WithId<T> | null> {
    const q = this.scoped(ctx, filter);
    return q ? this.coll.findOne(q) : null;
  }

  async find(
    ctx: AuthContext,
    filter: Filter<T>,
    options: Pick<FindOptions, "sort" | "skip" | "limit" | "projection"> = {},
  ): Promise<WithId<T>[]> {
    const q = this.scoped(ctx, filter);
    if (!q) return [];
    const limit = Math.min(options.limit || MAX_FIND_LIMIT, MAX_FIND_LIMIT);
    return this.coll.find(q, { ...options, limit }).toArray();
  }

  async countDocuments(ctx: AuthContext, filter: Filter<T>): Promise<number> {
    const q = this.scoped(ctx, filter);
    return q ? this.coll.countDocuments(q) : 0;
  }

  async updateOne(ctx: AuthContext, filter: Filter<T>, update: UpdateFilter<T>): Promise<UpdateResult<T>> {
    const q = this.scoped(ctx, filter);
    if (!q) return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedCount: 0, upsertedId: null };
    return this.coll.updateOne(q, update);
  }

  async deleteOne(ctx: AuthContext, filter: Filter<T>): Promise<DeleteResult> {
    const q = this.scoped(ctx, filter);
    if (!q) return { acknowledged: true, deletedCount: 0 };
    return this.coll.deleteOne(q);
  }
}

export function scopedCollection<T extends Document>(db: Db, name: string, scope: ScopeFn<T>): ScopedCollection<T> {
  return new ScopedCollection<T>(db, name, scope);
}
