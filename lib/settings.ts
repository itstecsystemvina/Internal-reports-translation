import "server-only";
import { db, schema } from "@/lib/db";
import { DEFAULT_SETTINGS, type AppSettings } from "@/lib/defaults";

export async function getSettings(): Promise<AppSettings> {
  const rows = await db.select().from(schema.settings);
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    translation: { ...DEFAULT_SETTINGS.translation, ...(stored.translation as object) },
    defaultCategories: (stored.defaultCategories as string[]) ?? DEFAULT_SETTINGS.defaultCategories,
    // Kept out of the (public) code: set in Cài đặt, or the DEFAULT_PASSWORD env var until then.
    defaultPassword: (stored.defaultPassword as string) ?? process.env.DEFAULT_PASSWORD ?? DEFAULT_SETTINGS.defaultPassword,
    deadline: { ...DEFAULT_SETTINGS.deadline, ...(stored.deadline as object) },
  };
}

export async function saveSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
  await db
    .insert(schema.settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value } });
}
