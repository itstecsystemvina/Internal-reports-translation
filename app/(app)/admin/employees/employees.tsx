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

type Row = {
  id: string; email: string; name: string; role: Role;
  department: string | null; position: string | null; tracked: boolean; active: boolean;
};

const blank: EmployeeInput = { email: "", name: "", role: "employee", department: "", position: "", tracked: true, active: true };

export function Employees({ rows, meId, defaultPassword }: { rows: Row[]; meId: string; defaultPassword: string }) {
  const router = useRouter();
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
    run(() => saveOrder(ids), "Đã đổi thứ tự");
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
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên, email, phòng ban" className="pl-9" />
        </div>
        <div className="flex gap-2">
          <ImportStaff defaultPassword={defaultPassword} />
          <Button onClick={() => open()}>
            <Plus className="size-4" /> Thêm nhân viên
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-surface shadow-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-line bg-sunken/70 text-left text-[11px] font-semibold uppercase tracking-wider text-faint">
              <th className="w-16 px-3 py-3" title="Thứ tự trên bảng theo dõi và file xuất">Thứ tự</th>
              <th className="px-3 py-3">Nhân viên</th>
              <th className="px-3 py-3">Phòng ban</th>
              <th className="px-3 py-3">Vai trò</th>
              <th className="px-3 py-3">Theo dõi nộp</th>
              <th className="px-3 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shown.map(({ r, i }) => (
              <tr key={r.id} className={cn("transition-colors hover:bg-sunken/60", !r.active && "opacity-55")}>
                <td className="px-3 py-2">
                  <div className="flex">
                    <button aria-label="Lên" disabled={i === 0 || pending || !!needle} onClick={() => move(i, -1)} className="grid size-7 place-items-center rounded text-faint hover:bg-sunken hover:text-ink disabled:opacity-30">
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button aria-label="Xuống" disabled={i === rows.length - 1 || pending || !!needle} onClick={() => move(i, 1)} className="grid size-7 place-items-center rounded text-faint hover:bg-sunken hover:text-ink disabled:opacity-30">
                      <ArrowDown className="size-3.5" />
                    </button>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium">{r.name} {!r.active && <Badge className="ml-1">Đã khoá</Badge>}</div>
                  <div className="text-xs text-muted">{r.email}</div>
                </td>
                <td className="min-w-40 px-3 py-2 text-muted">
                  {r.department || "—"}
                  {r.position && <div className="text-xs text-faint">{r.position}</div>}
                </td>
                <td className="px-3 py-2">{r.role === "admin" ? <Badge tone="brand">Admin</Badge> : <Badge>Nhân viên</Badge>}</td>
                <td className="px-3 py-2">{r.tracked ? <Badge tone="go">Có</Badge> : <span className="text-faint">Không</span>}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => open(r)}><Pencil className="size-3.5" /> Sửa</Button>
                    <Button
                      variant="ghost" size="sm" disabled={pending}
                      onClick={() => confirm(`Đặt lại mật khẩu của ${r.name} về "${defaultPassword}"?`) && run(() => resetPassword(r.id), "Đã đặt lại mật khẩu")}
                    >
                      <KeyRound className="size-3.5" /> Đặt lại MK
                    </Button>
                    {r.id === meId ? (
                      // Keeps the other buttons aligned with rows that have a delete button.
                      <span aria-hidden className="size-8 shrink-0" />
                    ) : (
                      <Button
                        variant="ghost" size="icon-sm" disabled={pending} aria-label="Xoá" className="hover:bg-stop-soft hover:text-stop"
                        onClick={() => confirm(`Xoá ${r.name}? Toàn bộ báo cáo của người này cũng sẽ bị xoá.`) && run(() => deleteEmployee(r.id), "Đã xoá nhân viên")}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-10 text-center text-muted">Không tìm thấy nhân viên phù hợp.</td></tr>
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
              run(() => (id ? updateEmployee(id, data) : createEmployee(data)), id ? "Đã lưu thay đổi" : "Đã thêm nhân viên", close);
            }}
          >
            <h2 className="text-lg font-bold">{editing.id ? "Sửa nhân viên" : "Thêm nhân viên"}</h2>
            {(
              [
                ["name", "Họ tên", "text"],
                ["email", "Email công ty (tên đăng nhập)", "email"],
                ["department", "Phòng ban", "text"],
                ["position", "Chức vụ", "text"],
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
            <Field label="Vai trò">
              <select
                className={inputClass}
                value={editing.data.role}
                onChange={(e) => setEditing({ ...editing, data: { ...editing.data, role: e.target.value as Role } })}
              >
                <option value="employee">Nhân viên</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.data.tracked} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, tracked: e.target.checked } })} className="size-4 accent-brand" />
              Cần nộp báo cáo hằng tuần (hiện trên bảng theo dõi)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.data.active} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, active: e.target.checked } })} className="size-4 accent-brand" />
              Cho phép đăng nhập
            </label>
            {!editing.id && <p className="text-xs text-muted">Mật khẩu ban đầu: <b>{defaultPassword}</b>. Nhân viên có thể tự đổi sau khi đăng nhập.</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={close}>Huỷ</Button>
              <Button type="submit" disabled={pending}>{editing.id ? "Lưu thay đổi" : "Thêm nhân viên"}</Button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
