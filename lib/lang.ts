import "server-only";
import { cookies } from "next/headers";
import { LANG_COOKIE, dictionaries, isLang, type Lang } from "@/lib/i18n";

/** Interface language chosen with the VI | 한 switch (cookie), Vietnamese by default. */
export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(v) ? v : "vi";
}

export async function getT() {
  return dictionaries[await getLang()];
}
