"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Languages, Pencil, RefreshCw } from "lucide-react";
import { retranslate, saveOriginal, saveTranslation } from "@/app/actions/admin";
import { ReportEditor } from "@/components/report-editor";
import { ReportView } from "@/components/report-view";
import { Badge, Button } from "@/components/ui";
import type { ReportContent, TranslationStatus } from "@/lib/types";
import { hasInvalidDate } from "@/lib/day-month";

type Mode = "view" | "vi" | "ko";

export function Review({
  reportId,
  content,
  translation,
  status,
  error,
  translatedAt,
}: {
  reportId: string;
  content: ReportContent;
  translation: ReportContent | null;
  status: TranslationStatus;
  error: string | null;
  translatedAt: string | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("view");
  const [draft, setDraft] = useState<ReportContent>(content);
  const [pending, start] = useTransition();

  // While a translation is running in the background, check back every few seconds.
  useEffect(() => {
    if (status !== "pending" || mode !== "view") return;
    const t = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(t);
  }, [status, mode, router]);

  const edit = (m: Mode) => {
    setDraft(m === "ko" ? (translation ?? content) : content);
    setMode(m);
  };

  const save = () => {
    if (hasInvalidDate(draft)) return void toast.error("Có ngày chưa đúng định dạng DD/MM (ô viền đỏ).");
    start(async () => {
      const res = mode === "vi" ? await saveOriginal(reportId, draft) : await saveTranslation(reportId, draft);
      if ("error" in res) return void toast.error(res.error);
      toast.success(mode === "vi" ? "Đã lưu bản gốc · đang dịch lại" : "Đã lưu bản dịch");
      setMode("view");
      router.refresh();
    });
  };

  const redo = () =>
    start(async () => {
      const res = await retranslate(reportId);
      if ("error" in res) toast.error(`Dịch thất bại: ${res.error}`);
      else toast.success("Đã dịch lại");
      router.refresh();
    });

  if (mode !== "view") {
    return (
      <div className="pb-24">
        <div className="mb-5 flex items-center gap-3">
          <Badge tone="brand">{mode === "vi" ? "Đang sửa bản gốc (Tiếng Việt)" : "Đang sửa bản dịch (한국어)"}</Badge>
          {mode === "vi" && <span className="text-sm text-muted">Lưu xong sẽ tự dịch lại sang tiếng Hàn.</span>}
        </div>
        <ReportEditor value={draft} onChange={setDraft} lang={mode === "ko" ? "ko" : "vi"} />
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl justify-end gap-2 px-4 py-3 sm:px-6">
            <Button variant="outline" onClick={() => setMode("view")} disabled={pending}>Huỷ</Button>
            <Button onClick={save} disabled={pending}>{pending ? "Đang lưu…" : "Lưu thay đổi"}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Pane
        title="Bản gốc"
        tag="Tiếng Việt"
        actions={<Button variant="ghost" size="sm" onClick={() => edit("vi")}><Pencil className="size-3.5" /> Sửa</Button>}
      >
        <ReportView content={content} lang="vi" />
      </Pane>

      <Pane
        title="Bản dịch"
        tag="한국어"
        status={
          status === "done" ? (
            <span className="text-xs text-muted">Dịch lúc {translatedAt}</span>
          ) : status === "pending" ? (
            <Badge tone="wait">Đang dịch…</Badge>
          ) : (
            <Badge tone="stop">Lỗi dịch</Badge>
          )
        }
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={redo} disabled={pending}>
              <RefreshCw className={`size-3.5 ${pending ? "animate-spin" : ""}`} /> Dịch lại
            </Button>
            {translation && (
              <Button variant="ghost" size="sm" onClick={() => edit("ko")}><Pencil className="size-3.5" /> Sửa</Button>
            )}
          </>
        }
      >
        {status === "error" && (
          <p className="mb-4 rounded-lg bg-stop-soft px-3 py-2 text-sm text-stop">{error}</p>
        )}
        {translation ? (
          <ReportView content={translation} lang="ko" />
        ) : (
          <div className="grid place-items-center gap-2 py-16 text-center text-sm text-muted">
            <Languages className="size-6 text-faint" />
            {status === "pending" ? "Đang dịch sang tiếng Hàn…" : "Chưa có bản dịch. Bấm “Dịch lại” để thử lại."}
          </div>
        )}
      </Pane>
    </div>
  );
}

function Pane({ title, tag, status, actions, children }: { title: string; tag: string; status?: React.ReactNode; actions: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
        <div className="flex items-center gap-2.5">
          <h2 className="font-display font-semibold">{title}</h2>
          <span className="rounded bg-sunken px-1.5 py-0.5 text-xs text-muted">{tag}</span>
          {status}
        </div>
        <div className="flex gap-1">{actions}</div>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}
