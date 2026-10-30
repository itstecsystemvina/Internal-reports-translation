"use client";

import { createContext, useContext } from "react";
import { dictionaries, type Lang } from "@/lib/i18n";

const LangContext = createContext<Lang>("vi");

/** Gives client components the language the server rendered with (see lib/lang.ts). */
export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
export const useT = () => dictionaries[useLang()];
