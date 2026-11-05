import { requireAdmin } from "@/lib/auth";
import { exportWeekDocx } from "@/lib/export";
import { isValidWeekStart } from "@/lib/week";
import { getT } from "@/lib/lang";

export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const week = url.searchParams.get("week");
  const lang = url.searchParams.get("lang") === "ko" ? "ko" : "vi";
  if (!isValidWeekStart(week)) return new Response((await getT()).common.invalidWeek, { status: 400 });
  return exportWeekDocx(week, lang);
}
