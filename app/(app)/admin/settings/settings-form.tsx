"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { saveSettings, testTranslation } from "@/app/actions/admin";
import { Badge, Button, Card, Field, Input, inputClass } from "@/components/ui";
import { DEFAULT_SYSTEM_PROMPT, type AppSettings } from "@/lib/defaults";
import { WEEKDAYS_VI } from "@/lib/week";

const DAYS = [1, 2, 3, 4, 5, 6, 0]; // Monday first

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <Card className="grid gap-5 p-6 md:grid-cols-[240px_1fr]">
      <div>
        <h2 className="font-display font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted">{desc}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

export function SettingsForm({ initial, hasKey }: { initial: AppSettings; hasKey: boolean }) {
  const router = useRouter();
  const [s, setS] = useState(initial);
  const [pending, start] = useTransition();
  const [testing, startTest] = useTransition();

  const save = () =>
    start(async () => {
      const res = await saveSettings(s);
      if ("error" in res) return void toast.error(res.error);
      toast.success("Đã lưu cài đặt");
      router.refresh();
    });

  const test = () =>
    startTest(async () => {
      const res = await testTranslation();
      if ("error" in res) toast.error(`Dịch thử thất bại: ${res.error}`);
      else toast.success(`Dịch thử: ${res.sample}`);
    });

  const dayOrder = (d: number) => DAYS.indexOf(d);
  const daySelect = (value: number, onChange: (d: number) => void) => (
    <select className={inputClass} value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {DAYS.map((d) => <option key={d} value={d}>{WEEKDAYS_VI[d]}</option>)}
    </select>
  );

  return (
    <div className="space-y-5 pb-24">
      <Section title="Hạn nộp báo cáo" desc="Nhân viên nộp báo cáo của tuần trong khoảng ngày này. Bảng theo dõi dùng ngày hạn chót.">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Bắt đầu nộp">
            {daySelect(s.deadline.openDay, (d) => setS({ ...s, deadline: { ...s.deadline, openDay: d } }))}
          </Field>
          <Field label="Hạn chót (hết ngày)">
            {daySelect(s.deadline.dueDay, (d) => setS({ ...s, deadline: { ...s.deadline, dueDay: d } }))}
          </Field>
        </div>
        {dayOrder(s.deadline.openDay) > dayOrder(s.deadline.dueDay) && (
          <p className="text-sm text-stop">Ngày bắt đầu phải trước hoặc trùng hạn chót.</p>
        )}
      </Section>

      <Section title="Nhóm công việc mặc định" desc="Các nhóm có sẵn khi nhân viên bắt đầu một báo cáo mới. Nhân viên vẫn có thể thêm hoặc đổi tên.">
        {s.defaultCategories.map((c, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={c}
              onChange={(e) => {
                const next = [...s.defaultCategories];
                next[i] = e.target.value;
                setS({ ...s, defaultCategories: next });
              }}
            />
            <Button variant="ghost" size="icon" aria-label="Xoá nhóm" className="shrink-0 hover:bg-stop-soft hover:text-stop" onClick={() => setS({ ...s, defaultCategories: s.defaultCategories.filter((_, j) => j !== i) })}>
              <X className="size-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setS({ ...s, defaultCategories: [...s.defaultCategories, ""] })}>
          <Plus className="size-4" /> Thêm nhóm
        </Button>
      </Section>

      <Section title="Mật khẩu mặc định" desc="Dùng cho tài khoản mới và khi đặt lại mật khẩu. Không ảnh hưởng mật khẩu nhân viên đã đổi.">
        <Field label="Mật khẩu" hint="Ít nhất 6 ký tự.">
          <Input value={s.defaultPassword} onChange={(e) => setS({ ...s, defaultPassword: e.target.value })} />
        </Field>
      </Section>

      <Section title="Dịch tiếng Hàn" desc="Báo cáo được tự động dịch bằng Google Gemini ngay sau khi nhân viên nộp.">
        <div className="flex flex-wrap items-center gap-3">
          {hasKey ? <Badge tone="go">Đã có API key</Badge> : <Badge tone="stop">Chưa có GEMINI_API_KEY</Badge>}
          <Button variant="outline" size="sm" onClick={test} disabled={testing || !hasKey}>
            {testing ? "Đang dịch thử…" : "Dịch thử"}
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
          <Field label="Model" hint="Ví dụ: gemini-flash-latest, gemini-pro-latest">
            <Input value={s.translation.model} onChange={(e) => setS({ ...s, translation: { ...s.translation, model: e.target.value } })} />
          </Field>
          <Field label={`Độ sáng tạo: ${s.translation.temperature}`} hint="Thấp = dịch sát nghĩa hơn">
            <input
              type="range" min={0} max={1} step={0.05} value={s.translation.temperature}
              onChange={(e) => setS({ ...s, translation: { ...s.translation, temperature: Number(e.target.value) } })}
              className="mt-3 w-full accent-brand"
            />
          </Field>
        </div>
        <Field label="Hướng dẫn dịch (system prompt)">
          <textarea
            rows={9}
            value={s.translation.systemPrompt}
            onChange={(e) => setS({ ...s, translation: { ...s.translation, systemPrompt: e.target.value } })}
            className={`${inputClass} h-auto py-2 font-mono text-xs leading-relaxed`}
          />
        </Field>
        <Button variant="ghost" size="sm" onClick={() => setS({ ...s, translation: { ...s.translation, systemPrompt: DEFAULT_SYSTEM_PROMPT } })}>
          Khôi phục hướng dẫn mặc định
        </Button>
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/75 backdrop-blur-xl backdrop-saturate-180">
        <div className="mx-auto flex max-w-6xl justify-end px-4 py-3 sm:px-6">
          <Button onClick={save} disabled={pending || dayOrder(s.deadline.openDay) > dayOrder(s.deadline.dueDay)}>
            {pending ? "Đang lưu…" : "Lưu cài đặt"}
          </Button>
        </div>
      </div>
    </div>
  );
}
