import "server-only";
import { drizzle as drizzleNeon, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type DB = NeonHttpDatabase<typeof schema>;

function createDb(): DB {
  if (process.env.DATABASE_URL) {
    return drizzleNeon(process.env.DATABASE_URL, { schema });
  }
  // Local development without a Postgres URL: file-based Postgres in .pglite/.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PGlite } = require("@electric-sql/pglite");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require("drizzle-orm/pglite");
  return drizzle(new PGlite(".pglite"), { schema }) as unknown as DB;
}

// Connects on first use, so importing this module (e.g. during `next build`) opens nothing.
const g = globalThis as unknown as { __db?: DB };
export const db = new Proxy({} as DB, {
  get(_, prop) {
    const real = (g.__db ??= createDb());
    return Reflect.get(real, prop, real);
  },
});
export { schema };
