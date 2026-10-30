"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, KeyRound, Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  createEmployee, deleteEmployee, resetPassword, saveOrder, updateEmployee, type EmployeeInput,
} from "@/app/actions/admin";
import { Badge, Button, Field, Input, inputClass } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ImportStaff } from "./import-staff";
import type { Role } from "@/lib/types";
import { useT } from "@/components/lang";

type Row = {
  id: string; email: string; name: string; role: Role;
  department: string | null; position: string | null; tracked: boolean; active: boolean;
};

const blank: EmployeeInput = { email: "", name: "", role: "employee", department: "", position: "", tracked: true, active: true };

export function Employees({ rows, meId, defaultPassword }: { rows: Row[]; meId: string; defaultPassword: string }) {
  const router = useRouter();
  const t = useT();
  const [pending, start] = useTransition();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<{ id: string | null; data: EmployeeInput } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const run = (fn: () => Promise<{ ok: true } | { error: string }>, success: string, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if ("error" in res) return void toast.error(res.error);
      toast.success(success);
      after?.();
      router.refresh();
    });

  const open = (row?: Row) => {
    setEditing(
      row
        ? { id: row.id, data: { ...row, department: row.department ?? "", position: row.position ?? "" } }
        : { id: null, data: blank },
    );
    dialog.current?.showModal();
  };
  const close = () => {
    dialog.current?.close();
    setEditing(null);
  };

  const move = (i: number, dir: -1 | 1) => {
    const ids = rows.map((r) => r.id);
    [ids[i], ids[i + dir]] = [ids[i + dir], ids[i]];
    run(() => saveOrder(ids), t.staff.reordered);
  };

  const needle = q.trim().toLowerCase();
  const shown = rows
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => !needle || [r.name, r.email, r.department ?? ""].some((v) => v.toLowerCase().includes(needle)));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.staff.search} className="pl-9" />
        </div>
        <div className="flex gap-2">
          <ImportStaff defaultPassword={defaultPassword} />
          <Button onClick={() => open()}>
            <Plus className="size-4" /> {t.staff.add}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-surface shadow-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-line bg-sunken/70 text-left text-[11px] font-semibold uppercase tracking-wider text-faint">
              <th className="w-16 px-3 py-3" title={t.staff.orderHint}>{t.staff.order}</th>
              <th className="px-3 py-3">{t.staff.employee}</th>
              <th className="px-3 py-3">{t.staff.department}</th>
              <th className="px-3 py-3">{t.staff.role}</th>
              <th className="px-3 py-3">{t.staff.tracked}</th>
              <th className="px-3 py-3 text-right">{t.staff.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shown.map(({ r, i }) => (
              <tr key={r.id} className={cn("transition-colors hover:bg-sunken/60", !r.active && "opacity-55")}>
                <td className="px-3 py-2">
                  <div className="flex">
                    <button aria-label={t.staff.up} disabled={i === 0 || pending || !!needle} onClick={() => move(i, -1)} className="grid size-7 place-items-center rounded text-faint hover:bg-sunken hover:text-ink disabled:opacity-30">
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button aria-label={t.staff.down} disabled={i === rows.length - 1 || pending || !!needle} onClick={() => move(i, 1)} className="grid size-7 place-items-center rounded text-faint hover:bg-sunken hover:text-ink disabled:opacity-30">
                      <ArrowDown className="size-3.5" />
                    </button>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium">{r.name} {!r.active && <Badge className="ml-1">{t.staff.locked}</Badge>}</div>
                  <div className="text-xs text-muted">{r.email}</div>
                </td>
                <td className="min-w-40 px-3 py-2 text-muted">
                  {r.department || "—"}
                  {r.position && <div className="text-xs text-faint">{r.position}</div>}
                </td>
                <td className="px-3 py-2">{r.role === "admin" ? <Badge tone="brand">{t.staff.admin}</Badge> : <Badge>{t.staff.employeeRole}</Badge>}</td>
                <td className="px-3 py-2">{r.tracked ? <Badge tone="go">{t.staff.yes}</Badge> : <span className="text-faint">{t.staff.no}</span>}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => open(r)}><Pencil className="size-3.5" /> {t.common.edit}</Button>
                    <Button
                      variant="ghost" size="sm" disabled={pending}
                      onClick={() => confirm(t.staff.confirmReset(r.name, defaultPassword)) && run(() => resetPassword(r.id), t.staff.passwordReset)}
                    >
                      <KeyRound className="size-3.5" /> {t.staff.resetPassword}
                    </Button>
                    {r.id === meId ? (
                      // Keeps the other buttons aligned with rows that have a delete button.
                      <span aria-hidden className="size-8 shrink-0" />
                    ) : (
                      <Button
                        variant="ghost" size="icon-sm" disabled={pending} aria-label={t.common.delete} title={t.common.delete} className="hover:bg-stop-soft hover:text-stop"
                        onClick={() => confirm(t.staff.confirmDelete(r.name)) && run(() => deleteEmployee(r.id), t.staff.deleted)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-10 text-center text-muted">{t.staff.notFound}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <dialog ref={dialog} onClose={() => setEditing(null)} className="m-auto w-[min(480px,calc(100vw-32px))] rounded-2xl bg-surface p-0 text-ink shadow-pop backdrop:bg-black/40 backdrop:backdrop-blur-[2px]">
        {editing && (
          <form
            className="space-y-4 p-6"
            onSubmit={(e) => {
              e.preventDefault();
              const { id, data } = editing;
              run(() => (id ? updateEmployee(id, data) : createEmployee(data)), id ? t.staff.saved : t.staff.added, close);
            }}
          >
            <h2 className="text-lg font-bold">{editing.id ? t.staff.editTitle : t.staff.addTitle}</h2>
            {(
              [
                ["name", t.staff.name, "text"],
                ["email", t.staff.email, "email"],
                ["department", t.staff.department, "text"],
                ["position", t.staff.position, "text"],
              ] as const
            ).map(([k, label, type]) => (
              <Field key={k} label={label}>
                <Input
                  type={type}
                  required={k === "name" || k === "email"}
                  value={editing.data[k] ?? ""}
                  onChange={(e) => setEditing({ ...editing, data: { ...editing.data, [k]: e.target.value } })}
                />
              </Field>
            ))}
            <Field label={t.staff.role}>
              <select
                className={inputClass}
                value={editing.data.role}
                onChange={(e) => setEditing({ ...editing, data: { ...editing.data, role: e.target.value as Role } })}
              >
                <option value="employee">{t.staff.employeeRole}</option>
                <option value="admin">{t.staff.admin}</option>
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.data.tracked} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, tracked: e.target.checked } })} className="size-4 accent-brand" />
              {t.staff.trackedLabel}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.data.active} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, active: e.target.checked } })} className="size-4 accent-brand" />
              {t.staff.active}
            </label>
            {!editing.id && <p className="text-xs text-muted">{t.staff.initialPwBefore}<b>{defaultPassword}</b>{t.staff.initialPwAfter}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={close}>{t.common.cancel}</Button>
              <Button type="submit" disabled={pending}>{editing.id ? t.common.save : t.staff.add}</Button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
