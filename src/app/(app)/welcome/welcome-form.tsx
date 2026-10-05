"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { SchoolSearch, type SchoolValue } from "@/components/ui/school-search";
import { updateProfile } from "@/app/actions/profile";
import { COUNTRIES } from "@/lib/countries";
import { claimGuestDaily } from "@/lib/daily/guest";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Exam = "step1" | "step2ck" | "step3";

const GOALS: { value: Exam; label: string; detail: string }[] = [
  { value: "step1", label: "Step 1", detail: "Pass/fail. Mechanisms, pathology, pharmacology." },
  { value: "step2ck", label: "Step 2 CK", detail: "Scored. Diagnosis, next best step, management." },
];

function Section({ n, title, hint, children }: { n: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-border pt-7 first:border-t-2 first:border-text md:grid-cols-[56px_1fr]">
      <span className="readout pt-1 text-[13px] text-brand-strong">{n}</span>
      <div className="min-w-0">
        <h2 className="text-[18px] font-semibold tracking-[-0.01em]">{title}</h2>
        {hint && <p className="mt-1 text-[14px] text-muted">{hint}</p>}
        <div className="mt-4">{children}</div>
      </div>
    </section>
  );
}

export function WelcomeForm({
  initial,
}: {
  initial: {
    display_name: string;
    username: string;
    country: string | null;
    target_exam: Exam;
    exam_date: string | null;
    school: SchoolValue | null;
  };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initial);

  // Students who confirmed by email arrive here straight from the link: attach any Daily played as a guest.
  useEffect(() => {
    claimGuestDaily(createClient()).then((claimed) => {
      if (claimed) toast.success("Your Daily Challenge result is now on your account.");
    });
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const { school, ...rest } = form;
      const res = await updateProfile({
        ...rest,
        school: school ? { id: school.id, name: school.name } : null,
        onboarded: true,
      });
      if (res.error) return setError(res.error);
      router.replace("/dashboard");
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-9">
      <Section n="01" title="What are you studying for?" hint="ARGO builds your sessions around this exam.">
        <div role="radiogroup" aria-label="Exam" className="grid gap-3 sm:grid-cols-2">
          {GOALS.map((g) => {
            const on = form.target_exam === g.value;
            return (
              <button
                key={g.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setForm((f) => ({ ...f, target_exam: g.value }))}
                className={cn(
                  "group relative flex flex-col items-start rounded-[8px] border p-5 text-left transition-[border-color,background-color,box-shadow] duration-200 ease-[var(--ease-out-quart)]",
                  on ? "border-brand bg-brand-soft shadow-[inset_0_0_0_1px_var(--brand)]" : "border-border bg-surface hover:border-border-strong",
                )}
              >
                <span
                  className={cn(
                    "absolute right-4 top-4 grid size-6 place-items-center rounded-full border transition-colors duration-200",
                    on ? "border-brand bg-brand text-on-brand" : "border-border-strong text-transparent",
                  )}
                  aria-hidden
                >
                  <Check className={cn("size-3.5", on && "motion-safe:animate-[chip-pop_320ms_var(--ease-out-quart)_both]")} strokeWidth={3} />
                </span>
                <span className="display text-[34px] font-bold">{g.label}</span>
                <span className="mt-2 max-w-[26ch] text-[14px] leading-snug text-muted">{g.detail}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section n="02" title="Where do you study medicine?" hint="Search the directory. If your school isn't listed, keep it as you typed it.">
        <SchoolSearch
          id="school"
          value={form.school}
          // A listed school's country fills in the leaderboard flag if none is set yet.
          onChange={(school) => setForm((f) => ({ ...f, school, country: f.country ?? school?.country ?? null }))}
        />
      </Section>

      <Section n="03" title="When is your exam?" hint="Optional. ARGO paces your plan to the date.">
        <Input
          id="exam_date"
          type="date"
          aria-label="Exam date"
          value={form.exam_date ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, exam_date: e.target.value || null }))}
          className="max-w-[220px]"
        />
      </Section>

      <Section n="04" title="How you show up on leaderboards">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Display name" htmlFor="display_name">
            <Input id="display_name" value={form.display_name} onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))} />
          </Field>
          <Field label="Leaderboard handle" htmlFor="username" hint="Letters, numbers, dots, dashes.">
            <Input id="username" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
          </Field>
          <Field label="Country" htmlFor="country" hint="Shown as a flag." className="sm:col-span-2">
            <select
              id="country"
              value={form.country ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value || null }))}
              className="h-10 w-full max-w-[320px] rounded-[6px] border border-border bg-surface px-3 text-[15px] text-text hover:border-border-strong focus:border-brand-strong focus:outline-none focus:ring-3 focus:ring-[var(--brand-ring)]"
            >
              <option value="">Prefer not to say</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      {error && (
        <p className="rounded-[8px] bg-incorrect-soft px-3 py-2.5 text-[14px] font-medium text-incorrect" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3 border-t border-border pt-7">
        <Button type="submit" size="lg" loading={pending}>
          Start studying
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() =>
            start(async () => {
              await updateProfile({ onboarded: true });
              router.replace("/dashboard");
            })
          }
        >
          Skip for now
        </Button>
      </div>
    </form>
  );
}
