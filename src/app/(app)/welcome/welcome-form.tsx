"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { updateProfile } from "@/app/actions/profile";
import { COUNTRIES } from "@/lib/countries";

export function WelcomeForm({
  initial,
}: {
  initial: { display_name: string; username: string; country: string | null; target_exam: "step1" | "step2ck" | "step3"; exam_date: string | null };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initial);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await updateProfile({ ...form, onboarded: true });
      if (res.error) return setError(res.error);
      router.replace("/dashboard");
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-6">
      <Field label="Which exam are you preparing for?">
        <Segmented
          value={form.target_exam}
          onChange={(v) => setForm((f) => ({ ...f, target_exam: v }))}
          options={[
            { value: "step1", label: "Step 1" },
            { value: "step2ck", label: "Step 2 CK" },
            { value: "step3", label: "Step 3" },
          ]}
        />
      </Field>
      <Field label="Exam date" htmlFor="exam_date" hint="Optional. ARGO paces your plan to it.">
        <Input id="exam_date" type="date" value={form.exam_date ?? ""} onChange={(e) => setForm((f) => ({ ...f, exam_date: e.target.value || null }))} className="max-w-[220px]" />
      </Field>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Display name" htmlFor="display_name">
          <Input id="display_name" value={form.display_name} onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))} />
        </Field>
        <Field label="Leaderboard handle" htmlFor="username" hint="Letters, numbers, dots, dashes.">
          <Input id="username" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
        </Field>
      </div>
      <Field label="Country" htmlFor="country" hint="Shown as a flag on leaderboards.">
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
      {error && (
        <p className="rounded-[8px] bg-incorrect-soft px-3 py-2.5 text-[14px] font-medium text-incorrect" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <Button type="submit" size="lg" loading={pending}>
          Continue
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={() => start(async () => { await updateProfile({ onboarded: true }); router.replace("/dashboard"); })}>
          Skip for now
        </Button>
      </div>
    </form>
  );
}
