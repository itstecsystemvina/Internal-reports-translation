"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { saveSettings, testTranslation } from "@/app/actions/admin";
import { Badge, Button, Card, Field, Input, inputClass } from "@/components/ui";
import { DEFAULT_SYSTEM_PROMPT, type AppSettings } from "@/lib/defaults";
import { weekdayName } from "@/lib/week";
import { useLang, useT } from "@/components/lang";

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
  const lang = useLang();
  const t = useT();
  const [s, setS] = useState(initial);
  const [pending, start] = useTransition();
  const [testing, startTest] = useTransition();

  const save = () =>
    start(async () => {
      const res = await saveSettings(s);
      if ("error" in res) return void toast.error(res.error);
      toast.success(t.settings.saved);
      router.refresh();
    });

  const test = () =>
    startTest(async () => {
      const res = await testTranslation();
      if ("error" in res) toast.error(t.settings.testFailed(res.error));
      else toast.success(t.settings.testOk(res.sample));
    });

  const dayOrder = (d: number) => DAYS.indexOf(d);
  const daySelect = (value: number, onChange: (d: number) => void) => (
    <select className={inputClass} value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {DAYS.map((d) => <option key={d} value={d}>{weekdayName(d, lang)}</option>)}
    </select>
  );

  return (
    <div className="space-y-5 pb-24">
      <Section title={t.settings.deadlineTitle} desc={t.settings.deadlineDesc}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.settings.openDay}>
            {daySelect(s.deadline.openDay, (d) => setS({ ...s, deadline: { ...s.deadline, openDay: d } }))}
          </Field>
          <Field label={t.settings.dueDay}>
            <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-2">
              {daySelect(s.deadline.dueDay, (d) => setS({ ...s, deadline: { ...s.deadline, dueDay: d } }))}
              <input
                type="time"
                required
                aria-label={t.settings.dueTime}
                value={s.deadline.dueTime}
                onChange={(e) => setS({ ...s, deadline: { ...s.deadline, dueTime: e.target.value } })}
                className={`${inputClass} tabular-nums`}
              />
            </div>
          </Field>
        </div>
        {dayOrder(s.deadline.openDay) > dayOrder(s.deadline.dueDay) && (
          <p className="text-sm text-stop">{t.settings.orderError}</p>
        )}
      </Section>

      <Section title={t.settings.categoriesTitle} desc={t.settings.categoriesDesc}>
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
            <Button variant="ghost" size="icon" aria-label={t.settings.removeGroup} title={t.settings.removeGroup} className="shrink-0 hover:bg-stop-soft hover:text-stop" onClick={() => setS({ ...s, defaultCategories: s.defaultCategories.filter((_, j) => j !== i) })}>
              <X className="size-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setS({ ...s, defaultCategories: [...s.defaultCategories, ""] })}>
          <Plus className="size-4" /> {t.settings.addGroup}
        </Button>
      </Section>

      <Section title={t.settings.passwordTitle} desc={t.settings.passwordDesc}>
        <Field label={t.settings.password} hint={t.settings.passwordHint}>
          <Input value={s.defaultPassword} onChange={(e) => setS({ ...s, defaultPassword: e.target.value })} />
        </Field>
      </Section>

      <Section title={t.settings.translateTitle} desc={t.settings.translateDesc}>
        <div className="flex flex-wrap items-center gap-3">
          {hasKey ? <Badge tone="go">{t.settings.hasKey}</Badge> : <Badge tone="stop">{t.settings.noKey}</Badge>}
          <Button variant="outline" size="sm" onClick={test} disabled={testing || !hasKey}>
            {testing ? t.settings.testing : t.settings.test}
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
          <Field label={t.settings.model} hint={t.settings.modelHint}>
            <Input value={s.translation.model} onChange={(e) => setS({ ...s, translation: { ...s.translation, model: e.target.value } })} />
          </Field>
          <Field label={t.settings.creativity(s.translation.temperature)} hint={t.settings.creativityHint}>
            <input
              type="range" min={0} max={1} step={0.05} value={s.translation.temperature}
              onChange={(e) => setS({ ...s, translation: { ...s.translation, temperature: Number(e.target.value) } })}
              className="mt-3 w-full accent-brand"
            />
          </Field>
        </div>
        <Field label={t.settings.prompt}>
          <textarea
            rows={9}
            value={s.translation.systemPrompt}
            onChange={(e) => setS({ ...s, translation: { ...s.translation, systemPrompt: e.target.value } })}
            className={`${inputClass} h-auto py-2 font-mono text-xs leading-relaxed`}
          />
        </Field>
        <Button variant="ghost" size="sm" onClick={() => setS({ ...s, translation: { ...s.translation, systemPrompt: DEFAULT_SYSTEM_PROMPT } })}>
          {t.settings.restorePrompt}
        </Button>
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/75 backdrop-blur-xl backdrop-saturate-180">
        <div className="mx-auto flex max-w-6xl justify-end px-4 py-3 sm:px-6">
          <Button onClick={save} disabled={pending || !s.deadline.dueTime || dayOrder(s.deadline.openDay) > dayOrder(s.deadline.dueDay)}>
            {pending ? t.common.saving : t.settings.save}
          </Button>
        </div>
      </div>
    </div>
  );
}
