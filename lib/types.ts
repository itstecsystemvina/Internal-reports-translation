export type Task = { name: string; date: string; assignee: string; completion: number };
export type Section = { category: string; tasks: Task[] };
export type ReportContent = { currentWeek: Section[]; nextWeek: Section[] };

export type Role = "admin" | "employee";
export type TranslationStatus = "pending" | "done" | "error";
