// Creates/updates database tables and makes sure the default admin exists.
// Runs automatically on Vercel builds (vercel-build) and before `npm run dev`.
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import * as schema from "../lib/db/schema";
import { DEFAULT_ADMIN_EMAIL } from "../lib/defaults";

try {
  process.loadEnvFile(".env.local");
} catch {}

async function main() {
  const { drizzle: drizzleNeon } = await import("drizzle-orm/neon-http");
  let db: ReturnType<typeof drizzleNeon<typeof schema>>;
  if (process.env.DATABASE_URL) {
    const { migrate } = await import("drizzle-orm/neon-http/migrator");
    db = drizzleNeon(process.env.DATABASE_URL, { schema });
    await migrate(db, { migrationsFolder: "./drizzle" });
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    const pg = drizzle(new PGlite(".pglite"), { schema });
    await migrate(pg, { migrationsFolder: "./drizzle" });
    db = pg as unknown as typeof db;
  }
  console.log("✓ Database tables up to date");

  const existing = await db.select().from(schema.users).where(eq(schema.users.email, DEFAULT_ADMIN_EMAIL));
  if (existing.length === 0) {
    const password = process.env.DEFAULT_PASSWORD ?? "";
    if (password.length < 6) {
      throw new Error("Set DEFAULT_PASSWORD (at least 6 characters) so the first admin account can be created.");
    }
    await db.insert(schema.users).values({
      email: DEFAULT_ADMIN_EMAIL,
      name: "Trần Tùng Lâm",
      role: "admin",
      tracked: false,
      passwordHash: await bcrypt.hash(password, 10),
    });
    console.log(`✓ Created default admin ${DEFAULT_ADMIN_EMAIL}`);
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
