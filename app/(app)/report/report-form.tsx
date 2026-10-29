"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { submitReport } from "@/app/actions/report";
import { ReportEditor, useReportDraft } from "@/components/report-editor";
import { Lamp } from "@/components/traffic-light";
import { Button } from "@/components/ui";
import type { AppSettings } from "@/lib/defaults";
import type { ReportContent } from "@/lib/types";
import { DeadlineText } from "@/components/deadline";
import { deadlineAt, formatSubmitted } from "@/lib/week";
import { hasInvalidDate } from "@/lib/day-month";

export function ReportForm({
  week,
  initial,
  submittedAt: initialSubmitted,
  updatedAt: initialUpdated,
  deadline,
  assignee,
}: {
  week: string;
  initial: ReportContent;
  submittedAt: string | null;
  updatedAt: string | null;
  deadline: AppSettings["deadline"];
  assignee: string;
}) {
  const { draft, dirty, setDraft, markSaved } = useReportDraft(initial);
  const [submittedAt, setSubmittedAt] = useState(initialSubmitted);
  const [updatedAt, setUpdatedAt] = useState(initialUpdated);
  const [pending, start] = useTransition();
  const submitted = !!submittedAt;
  const late = submitted && new Date(submittedAt!) > deadlineAt(week, deadline.dueDay, deadline.dueTime);

  const save = () => {
    if (hasInvalidDate(draft)) return void toast.error("Có ngày chưa đúng định dạng DD/MM (ô viền đỏ).");
    start(async () => {
      const res = await submitReport(week, draft);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      setSubmittedAt(res.submittedAt);
      setUpdatedAt(res.updatedAt);
      markSaved();
      toast.success(submitted ? "Đã cập nhật báo cáo" : "Đã nộp báo cáo");
    });
  };

  return (
    <div className="pb-24">
      <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold ${!submitted ? "bg-stop-soft text-stop" : late ? "bg-wait-soft text-wait" : "bg-go-soft text-go"}`}>
          <Lamp status={!submitted ? "missing" : late ? "late" : "on-time"} />
          {submitted ? `${late ? "Nộp trễ" : "Đã nộp"} · ${formatSubmitted(submittedAt!)}` : "Chưa nộp"}
        </span>
        <span className="text-muted">
          {submitted && updatedAt && updatedAt !== submittedAt ? (
            <>Cập nhật lần cuối {formatSubmitted(updatedAt)}</>
          ) : (
            <DeadlineText week={week} deadline={deadline} />
          )}
        </span>
      </div>

      <ReportEditor value={draft} onChange={setDraft} defaultAssignee={assignee} />

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/75 backdrop-blur-xl backdrop-saturate-180">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-3 px-4 py-3 sm:px-6">
          {dirty && <span className="text-sm text-muted">Có thay đổi chưa lưu</span>}
          <Button onClick={save} disabled={pending}>
            <Send className="size-4" />
            {pending ? "Đang lưu…" : submitted ? "Cập nhật báo cáo" : "Nộp báo cáo"}
          </Button>
        </div>
      </div>
    </div>
  );
}
