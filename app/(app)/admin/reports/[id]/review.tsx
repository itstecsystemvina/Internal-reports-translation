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
import { useT } from "@/components/lang";

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
  const t = useT();
  const [mode, setMode] = useState<Mode>("view");
  const [draft, setDraft] = useState<ReportContent>(content);
  const [pending, start] = useTransition();

  // While a translation is running in the background, check back every few seconds.
  useEffect(() => {
    if (status !== "pending" || mode !== "view") return;
    const timer = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(timer);
  }, [status, mode, router]);

  const edit = (m: Mode) => {
    setDraft(m === "ko" ? (translation ?? content) : content);
    setMode(m);
  };

  const save = () => {
    if (hasInvalidDate(draft)) return void toast.error(t.common.invalidDate);
    start(async () => {
      const res = mode === "vi" ? await saveOriginal(reportId, draft) : await saveTranslation(reportId, draft);
      if ("error" in res) return void toast.error(res.error);
      toast.success(mode === "vi" ? t.review.savedOriginal : t.review.savedTranslation);
      setMode("view");
      router.refresh();
    });
  };

  const redo = () =>
    start(async () => {
      const res = await retranslate(reportId);
      if ("error" in res) toast.error(t.review.failed(res.error));
      else toast.success(t.review.retranslated);
      router.refresh();
    });

  if (mode !== "view") {
    return (
      <div className="pb-24">
        <div className="mb-5 flex items-center gap-3">
          <Badge tone="brand">{mode === "vi" ? t.review.editingOriginal : t.review.editingTranslation}</Badge>
          {mode === "vi" && <span className="text-sm text-muted">{t.review.willRetranslate}</span>}
        </div>
        <ReportEditor value={draft} onChange={setDraft} lang={mode === "ko" ? "ko" : "vi"} />
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/75 backdrop-blur-xl backdrop-saturate-180">
          <div className="mx-auto flex max-w-6xl justify-end gap-2 px-4 py-3 sm:px-6">
            <Button variant="outline" onClick={() => setMode("view")} disabled={pending}>{t.common.cancel}</Button>
            <Button onClick={save} disabled={pending}>{pending ? t.common.saving : t.common.save}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Pane
        title={t.review.original}
        tag={t.review.viTag}
        actions={<Button variant="ghost" size="sm" onClick={() => edit("vi")}><Pencil className="size-3.5" /> {t.common.edit}</Button>}
      >
        <ReportView content={content} lang="vi" />
      </Pane>

      <Pane
        title={t.review.translation}
        tag={t.review.koTag}
        status={
          status === "done" ? (
            <span className="text-xs text-muted">{t.review.translatedAt} {translatedAt}</span>
          ) : status === "pending" ? (
            <Badge tone="wait">{t.review.translating}</Badge>
          ) : (
            <Badge tone="stop">{t.review.translateError}</Badge>
          )
        }
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={redo} disabled={pending}>
              <RefreshCw className={`size-3.5 ${pending ? "animate-spin" : ""}`} /> {t.review.retranslate}
            </Button>
            {translation && (
              <Button variant="ghost" size="sm" onClick={() => edit("ko")}><Pencil className="size-3.5" /> {t.common.edit}</Button>
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
            {status === "pending" ? t.review.translatingKo : t.review.noTranslation}
          </div>
        )}
      </Pane>
    </div>
  );
}

function Pane({ title, tag, status, actions, children }: { title: string; tag: string; status?: React.ReactNode; actions: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-surface shadow-card">
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
