"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Languages } from "lucide-react";
import { translateReports } from "@/app/actions/admin";
import { Badge, Button } from "@/components/ui";
import { useT } from "@/components/lang";
import type { TranslationStatus } from "@/lib/types";

type Row = { id: string; name: string; status: TranslationStatus };
const tone = { done: "go", error: "stop", pending: "wait", queued: "neutral" } as const;
// Reports sent per server call; each one is still its own Gemini request.
const CHUNK = 3;

export function TranslateReports({ week, reports }: { week: number; reports: Row[] }) {
  const router = useRouter();
  const t = useT();
  const dialog = useRef<HTMLDialogElement>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<Record<string, TranslationStatus>>({});
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const running = progress !== null;

  const open = () => {
    setStatus(Object.fromEntries(reports.map((r) => [r.id, r.status])));
    setPicked(new Set(reports.filter((r) => r.status !== "done").map((r) => r.id)));
    dialog.current?.showModal();
  };
  const toggle = (id: string, on: boolean) => {
    const next = new Set(picked);
    if (on) next.add(id);
    else next.delete(id);
    setPicked(next);
  };

  const run = async () => {
    const ids = reports.map((r) => r.id).filter((id) => picked.has(id));
    const failed: string[] = [];
    setProgress({ done: 0, total: ids.length });
    for (let i = 0; i < ids.length; i += CHUNK) {
      const chunk = ids.slice(i, i + CHUNK);
      setStatus((s) => ({ ...s, ...Object.fromEntries(chunk.map((id) => [id, "pending"])) }));
      const results = await translateReports(chunk).catch(() => chunk.map((id) => ({ id, ok: false })));
      failed.push(...results.filter((r) => !r.ok).map((r) => r.id));
      setStatus((s) => ({ ...s, ...Object.fromEntries(results.map((r) => [r.id, r.ok ? "done" : "error"])) }));
      setProgress({ done: i + chunk.length, total: ids.length });
    }
    (failed.length ? toast.error : toast.success)(t.translator.result(ids.length - failed.length, failed.length));
    // Failed ones stay ticked so they can be retried in one click.
    setPicked(new Set(failed));
    setProgress(null);
    router.refresh();
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={open}>
        <Languages className="size-4" /> {t.translator.button}
      </Button>
      <dialog
        ref={dialog}
        onCancel={(e) => running && e.preventDefault()}
        className="m-auto w-[min(520px,calc(100vw-32px))] rounded-2xl bg-surface p-0 text-ink shadow-pop backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
      >
        <div className="space-y-4 p-6">
          <div>
            <h2 className="text-lg font-bold">{t.translator.title}</h2>
            <p className="mt-1 text-sm text-muted">{t.translator.desc(week)}</p>
          </div>
          <div className="max-h-[50vh] overflow-auto rounded-lg border border-line">
            <label className="flex items-center gap-3 border-b border-line bg-sunken px-3 py-2 text-xs font-medium text-muted">
              <input
                type="checkbox"
                className="size-4 accent-brand"
                disabled={running}
                checked={picked.size === reports.length}
                onChange={(e) => setPicked(new Set(e.target.checked ? reports.map((r) => r.id) : []))}
              />
              {t.translator.all}
            </label>
            <ul className="divide-y divide-line">
              {reports.map((r) => {
                const s = status[r.id] ?? r.status;
                return (
                  <li key={r.id}>
                    <label className="flex items-center gap-3 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        className="size-4 accent-brand"
                        disabled={running}
                        checked={picked.has(r.id)}
                        onChange={(e) => toggle(r.id, e.target.checked)}
                      />
                      <span className="min-w-0 flex-1 truncate font-medium">{r.name}</span>
                      <Badge tone={tone[s]}>{t.translator.status[s]}</Badge>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => dialog.current?.close()} disabled={running}>{t.translator.close}</Button>
            <Button onClick={run} disabled={running || picked.size === 0}>
              {running ? t.translator.running(progress.done, progress.total) : t.translator.run(picked.size)}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
