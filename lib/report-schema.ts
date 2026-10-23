import { z } from "zod";
import type { ReportContent } from "@/lib/types";
import { padDayMonth } from "@/lib/day-month";

const task = z.object({
  name: z.string().max(2000),
  date: z.string().max(50),
  assignee: z.string().max(200),
  completion: z.coerce.number().int().min(0).max(100),
});
const section = z.object({ category: z.string().max(300), tasks: z.array(task).max(100) });
export const contentSchema = z.object({ currentWeek: z.array(section).max(30), nextWeek: z.array(section).max(30) });

/** Validates and drops task rows left blank. */
export function cleanContent(input: unknown): ReportContent {
  const c = contentSchema.parse(input);
  const tidy = (sections: ReportContent["currentWeek"]) =>
    sections.map((s) => ({
      category: s.category.trim(),
      tasks: s.tasks
        .map((t) => ({ ...t, name: t.name.trim(), date: padDayMonth(t.date.trim()), assignee: t.assignee.trim() }))
        .filter((t) => t.name),
    }));
  return { currentWeek: tidy(c.currentWeek), nextWeek: tidy(c.nextWeek) };
}

export function isEmptyContent(c: ReportContent) {
  return [...c.currentWeek, ...c.nextWeek].every((s) => s.tasks.length === 0);
}

/** A fresh report with one blank row per default category. */
export function emptyContent(categories: string[], assignee = ""): ReportContent {
  const blank = () => categories.map((category) => ({ category, tasks: [{ name: "", date: "", assignee, completion: 0 }] }));
  return { currentWeek: blank(), nextWeek: blank() };
}
