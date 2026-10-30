"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import type { ReportContent, Section, Task } from "@/lib/types";
import { cn } from "@/lib/cn";
import { formatDayMonth, isValidDayMonth, padDayMonth } from "@/lib/day-month";
import { useT } from "@/components/lang";

type Side = keyof ReportContent;
const SIDES: Side[] = ["currentWeek", "nextWeek"];

const field =
  "h-9 w-full rounded-lg border border-transparent bg-fill px-2.5 text-sm text-ink transition placeholder:text-faint focus:border-brand focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand/15";
const COLS = "md:grid-cols-[minmax(0,1fr)_92px_170px_84px_32px]";

/** Editable report: groups of tasks for this week and next week. `lang` is the language of the content. */
export function ReportEditor({
  value,
  onChange,
  defaultAssignee = "",
  lang = "vi",
}: {
  value: ReportContent;
  onChange: (next: ReportContent) => void;
  defaultAssignee?: string;
  lang?: "vi" | "ko";
}) {
  const edit = (fn: (draft: ReportContent) => void) => {
    const draft = structuredClone(value);
    fn(draft);
    onChange(draft);
  };
  const t = useT();
  const newTask = (): Task => ({ name: "", date: "", assignee: defaultAssignee, completion: 0 });

  return (
    <div className={cn("space-y-10", lang === "ko" && "font-kr")}>
      {SIDES.map((side) => (
        <section key={side}>
          <h2 className="mb-3 text-base font-bold">{side === "currentWeek" ? t.editor.thisWeek : t.editor.nextWeek}</h2>
          <div className="space-y-4">
            {value[side].map((sec, si) => (
              <SectionCard
                key={si}
                section={sec}
                onCategory={(v) => edit((d) => void (d[side][si].category = v))}
                onRemove={() => edit((d) => void d[side].splice(si, 1))}
                onTask={(ti, patch) => edit((d) => void Object.assign(d[side][si].tasks[ti], patch))}
                onAddTask={() => edit((d) => void d[side][si].tasks.push(newTask()))}
                onRemoveTask={(ti) => edit((d) => void d[side][si].tasks.splice(ti, 1))}
              />
            ))}
            <button
              type="button"
              onClick={() => edit((d) => void d[side].push({ category: "", tasks: [newTask()] }))}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
            >
              <Plus className="size-4" /> {t.editor.addGroup}
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}

function SectionCard({
  section,
  onCategory,
  onRemove,
  onTask,
  onAddTask,
  onRemoveTask,
}: {
  section: Section;
  onCategory: (v: string) => void;
  onRemove: () => void;
  onTask: (ti: number, patch: Partial<Task>) => void;
  onAddTask: () => void;
  onRemoveTask: (ti: number) => void;
}) {
  const L = useT();
  return (
    <div className="overflow-hidden rounded-2xl bg-surface shadow-card">
      <div className="flex items-center gap-2 border-b border-line bg-sunken px-3 py-2">
        <input
          value={section.category}
          onChange={(e) => onCategory(e.target.value)}
          placeholder={L.editor.groupName}
          aria-label={L.editor.groupName}
          className={cn(field, "bg-transparent! font-semibold hover:bg-fill! focus:bg-surface!")}
        />
        <button type="button" onClick={onRemove} title={L.editor.removeGroup} aria-label={L.editor.removeGroup} className="grid size-8 shrink-0 place-items-center rounded-lg text-faint transition hover:bg-stop-soft hover:text-stop active:scale-95">
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className={cn("hidden gap-2 px-3 pt-3 pb-1 text-xs font-medium text-muted md:grid", COLS)}>
        <span>{L.editor.task}</span>
        <span>{L.editor.date}</span>
        <span>{L.editor.who}</span>
        <span>{L.editor.done}</span>
      </div>

      <div className="space-y-3 px-3 py-2 md:space-y-2">
        {section.tasks.map((t, ti) => (
          <div key={ti} className={cn("grid grid-cols-[minmax(0,1fr)_32px] gap-2 border-b border-line pb-3 last:border-0 last:pb-0 md:items-start md:border-0 md:pb-0", COLS)}>
            <textarea
              rows={1}
              value={t.name}
              onChange={(e) => onTask(ti, { name: e.target.value })}
              placeholder={L.editor.taskPlaceholder}
              aria-label={L.editor.task}
              className={cn(field, "field-sizing-content min-h-9 resize-none py-[7px] leading-5")}
            />
            <button type="button" onClick={() => onRemoveTask(ti)} title={L.editor.removeRow} aria-label={L.editor.removeRow} className="col-start-2 row-start-1 grid size-9 place-items-center rounded-lg text-faint transition hover:bg-stop-soft hover:text-stop active:scale-95 md:col-start-5">
              <X className="size-4" />
            </button>
            <div className="col-span-2 grid grid-cols-[92px_minmax(0,1fr)_84px] gap-2 md:contents">
              <input
                value={t.date}
                onChange={(e) => onTask(ti, { date: formatDayMonth(e.target.value) })}
                onBlur={(e) => onTask(ti, { date: padDayMonth(e.target.value) })}
                inputMode="numeric"
                placeholder="DD/MM"
                aria-label={L.editor.dateAria}
                aria-invalid={!isValidDayMonth(t.date)}
                className={cn(field, "tabular-nums md:col-start-2 md:row-start-1", !isValidDayMonth(t.date) && "border-stop! focus:ring-stop/15")}
              />
              <input
                value={t.assignee}
                onChange={(e) => onTask(ti, { assignee: e.target.value })}
                placeholder={L.editor.whoPlaceholder}
                aria-label={L.editor.who}
                className={cn(field, "md:col-start-3 md:row-start-1")}
              />
              <label className="relative md:col-start-4 md:row-start-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={5}
                  value={t.completion}
                  onChange={(e) => onTask(ti, { completion: Math.max(0, Math.min(100, Math.round(Number(e.target.value) || 0))) })}
                  aria-label={L.editor.pctAria}
                  className={cn(field, "pr-7 text-right tabular-nums", t.completion === 100 && "font-semibold text-go")}
                />
                <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-sm text-faint">%</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={onAddTask} className="flex w-full items-center gap-1.5 border-t border-line px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-brand-soft/50 hover:text-brand">
        <Plus className="size-4" /> {L.editor.addTask}
      </button>
    </div>
  );
}

export function useReportDraft(initial: ReportContent) {
  const [draft, setDraft] = useState(initial);
  const [dirty, setDirty] = useState(false);
  return {
    draft,
    dirty,
    setDraft: (next: ReportContent) => {
      setDraft(next);
      setDirty(true);
    },
    markSaved: () => setDirty(false),
  };
}
