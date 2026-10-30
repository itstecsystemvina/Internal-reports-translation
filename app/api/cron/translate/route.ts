import { translateDueReports } from "@/lib/translate";

export const maxDuration = 300;

// Called by Vercel Cron (see vercel.json), which sends "Authorization: Bearer $CRON_SECRET".
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  return Response.json(await translateDueReports());
}
