import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui";
import { SettingsForm } from "./settings-form";
import { getT } from "@/lib/lang";

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await getSettings();
  const t = await getT();
  return (
    <>
      <PageHeader title={t.settings.title} sub={t.settings.sub} />
      <SettingsForm initial={settings} hasKey={!!process.env.GEMINI_API_KEY} />
    </>
  );
}
