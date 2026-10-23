import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await getSettings();
  return (
    <>
      <PageHeader title="Cài đặt" sub="Áp dụng cho toàn bộ hệ thống" />
      <SettingsForm initial={settings} hasKey={!!process.env.GEMINI_API_KEY} />
    </>
  );
}
