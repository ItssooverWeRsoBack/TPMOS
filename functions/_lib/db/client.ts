/**
 * D1 client helpers — typed wrappers around D1 prepared statements.
 * Never use string concatenation for SQL. Always use these helpers.
 */

/** Execute a query and return all matching rows, typed. */
export async function query<T>(
  db: D1Database,
  sql: string,
  ...params: unknown[]
): Promise<T[]> {
  const stmt = db.prepare(sql).bind(...params);
  const result = await stmt.all<T>();
  return result.results;
}

/** Execute a query and return the first matching row, or null. */
export async function first<T>(
  db: D1Database,
  sql: string,
  ...params: unknown[]
): Promise<T | null> {
  const stmt = db.prepare(sql).bind(...params);
  const result = await stmt.first<T>();
  return result ?? null;
}

/** Execute a write statement (INSERT/UPDATE/DELETE) and return metadata. */
export async function run(
  db: D1Database,
  sql: string,
  ...params: unknown[]
): Promise<D1Result> {
  const stmt = db.prepare(sql).bind(...params);
  return stmt.run();
}

/** Execute multiple statements in a batch (atomic). */
export async function batch(
  db: D1Database,
  statements: { sql: string; params: unknown[] }[]
): Promise<D1Result[]> {
  const prepared = statements.map((s) => db.prepare(s.sql).bind(...s.params));
  return db.batch(prepared);
}

/** Generate a nanoid-style short ID. */
export function generateId(prefix?: string): string {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  let id = "";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  for (const b of bytes) {
    id += chars[b % chars.length];
  }
  return prefix ? `${prefix}-${id}` : id;
}
