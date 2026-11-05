import { exportWeekDocx } from "@/lib/export";
import { isValidWeekStart } from "@/lib/week";

// Same Word files as the admin export, for scheduled downloads (scripts/windows/).
// The caller sends "Authorization: Bearer $EXPORT_SECRET" instead of signing in.
export async function GET(request: Request) {
  const secret = process.env.EXPORT_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const url = new URL(request.url);
  const week = url.searchParams.get("week");
  const lang = url.searchParams.get("lang") === "ko" ? "ko" : "vi";
  if (!isValidWeekStart(week)) return new Response("Invalid week (use the Monday, YYYY-MM-DD)", { status: 400 });
  return exportWeekDocx(week, lang);
}
