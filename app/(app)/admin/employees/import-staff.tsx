"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileSpreadsheet } from "lucide-react";
import { importStaff, previewStaffImport, type ImportPreview } from "@/app/actions/admin";
import { Badge, Button, inputClass } from "@/components/ui";

export function ImportStaff({ defaultPassword }: { defaultPassword: string }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [sheets, setSheets] = useState<ImportPreview | null>(null);
  const [sheetIdx, setSheetIdx] = useState(0);
  const [picked, setPicked] = useState<Record<string, { include: boolean; tracked: boolean }>>({});
  const [pending, start] = useTransition();

  const rows = sheets?.[sheetIdx]?.rows ?? [];
  const choose = (s: ImportPreview, i: number) => {
    setSheetIdx(i);
    setPicked(Object.fromEntries(s[i].rows.map((r) => [r.email, { include: true, tracked: r.tracked }])));
  };

  const upload = (file: File | undefined) => {
    if (!file) return;
    const form = new FormData();
    form.set("file", file);
    start(async () => {
      const res = await previewStaffImport(form);
      if ("error" in res) return void toast.error(res.error);
      setSheets(res.sheets);
      choose(res.sheets, 0);
    });
  };

  const selected = rows.filter((r) => picked[r.email]?.include);
  const submit = () =>
    start(async () => {
      const res = await importStaff(selected.map((r) => ({ ...r, tracked: picked[r.email].tracked })));
      if ("error" in res) return void toast.error(res.error);
      toast.success(`Đã thêm ${res.added} và cập nhật ${res.updated} nhân viên`);
      close();
      router.refresh();
    });

  const close = () => {
    dialog.current?.close();
    setSheets(null);
  };

  return (
    <>
      <Button variant="outline" onClick={() => dialog.current?.showModal()}>
        <FileSpreadsheet className="size-4" /> Nhập từ Excel
      </Button>
      <dialog ref={dialog} onClose={() => setSheets(null)} className="m-auto w-[min(860px,calc(100vw-32px))] rounded-xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/40">
        <div className="space-y-4 p-6">
          <div>
            <h2 className="text-lg font-bold">Nhập nhân viên từ Excel</h2>
            <p className="mt-1 text-sm text-muted">
              Chỉ đọc các cột Họ tên, Email, Phòng ban, Chức vụ. Người mới có mật khẩu <b>{defaultPassword}</b>; người đã có tài khoản chỉ được cập nhật tên, phòng ban, chức vụ.
            </p>
          </div>

          {!sheets ? (
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-line px-6 py-10 text-center text-sm text-muted hover:border-brand hover:text-ink">
              <FileSpreadsheet className="size-6" />
              {pending ? "Đang đọc file…" : "Chọn file .xlsx"}
              <input type="file" accept=".xlsx" className="sr-only" disabled={pending} onChange={(e) => upload(e.target.files?.[0])} />
            </label>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium">Trang tính</span>
                <select className={`${inputClass} h-9 w-auto`} value={sheetIdx} onChange={(e) => choose(sheets, Number(e.target.value))}>
                  {sheets.map((s, i) => (
                    <option key={s.sheet} value={i}>{s.sheet} ({s.rows.length})</option>
                  ))}
                </select>
              </div>
              <div className="max-h-[50vh] overflow-auto rounded-lg border border-line">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="sticky top-0 bg-sunken text-left text-xs text-muted">
                    <tr>
                      <th className="w-10 px-3 py-2">Nhập</th>
                      <th className="px-3 py-2">Nhân viên</th>
                      <th className="px-3 py-2">Phòng ban · Chức vụ</th>
                      <th className="px-3 py-2">Cần nộp báo cáo</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {rows.map((r) => {
                      const p = picked[r.email];
                      const set = (patch: Partial<typeof p>) => setPicked({ ...picked, [r.email]: { ...p, ...patch } });
                      return (
                        <tr key={r.email} className={p?.include ? "" : "opacity-50"}>
                          <td className="px-3 py-2"><input type="checkbox" className="size-4 accent-brand" checked={!!p?.include} onChange={(e) => set({ include: e.target.checked })} /></td>
                          <td className="px-3 py-2"><div className="font-medium">{r.name}</div><div className="text-xs text-muted">{r.email}</div></td>
                          <td className="px-3 py-2 text-muted">{[r.department, r.position].filter(Boolean).join(" · ") || "—"}</td>
                          <td className="px-3 py-2"><input type="checkbox" className="size-4 accent-brand" checked={!!p?.tracked} onChange={(e) => set({ tracked: e.target.checked })} /></td>
                          <td className="px-3 py-2 text-right">{r.exists ? <Badge>Đã có</Badge> : <Badge tone="go">Mới</Badge>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={close}>Huỷ</Button>
            {sheets && (
              <Button onClick={submit} disabled={pending || selected.length === 0}>
                {pending ? "Đang nhập…" : `Nhập ${selected.length} nhân viên`}
              </Button>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
