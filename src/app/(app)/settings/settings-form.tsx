"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { AlertDialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { SchoolSearch, type SchoolValue } from "@/components/ui/school-search";
import { Switch } from "@/components/ui/misc";
import { updateProfile } from "@/app/actions/profile";
import { deleteAccount } from "./actions";
import { COUNTRIES } from "@/lib/countries";

type Initial = {
  display_name: string;
  username: string;
  country: string | null;
  target_exam: "step1" | "step2ck" | "step3";
  exam_date: string | null;
  school: SchoolValue | null;
  confidence_prompt: boolean;
};

export function SettingsForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [form, setForm] = useState(initial);
  const [pending, start] = useTransition();
  const [deleting, setDeleting] = useState(false);

  function save() {
    start(async () => {
      const res = await updateProfile({
        display_name: form.display_name,
        username: form.username,
        country: form.country,
        target_exam: form.target_exam,
        exam_date: form.exam_date,
        school: form.school ? { id: form.school.id, name: form.school.name } : null,
        settings: { confidence_prompt: form.confidence_prompt },
      });
      if (res.error) toast.error(res.error);
      else {
        toast.success("Settings saved");
        router.refresh();
      }
    });
  }

  return (
    <div className="grid max-w-[760px] gap-6">
      <section className="rounded-[10px] border border-border bg-surface p-6">
        <h2 className="text-[16px] font-[700]">Profile</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Display name" htmlFor="dn">
            <Input id="dn" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
          </Field>
          <Field label="Leaderboard handle" htmlFor="un">
            <Input id="un" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </Field>
          <Field label="Country" htmlFor="ct">
            <select
              id="ct"
              value={form.country ?? ""}
              onChange={(e) => setForm({ ...form, country: e.target.value || null })}
              className="h-10 w-full rounded-[6px] border border-border bg-surface px-3 text-[15px]"
            >
              <option value="">Prefer not to say</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Exam date" htmlFor="ed">
            <Input id="ed" type="date" value={form.exam_date ?? ""} onChange={(e) => setForm({ ...form, exam_date: e.target.value || null })} />
          </Field>
        </div>
        <Field label="Medical school" htmlFor="school" className="mt-5">
          <SchoolSearch id="school" value={form.school} onChange={(school) => setForm({ ...form, school })} />
        </Field>
        <Field label="Target exam" className="mt-5">
          <Segmented
            value={form.target_exam}
            onChange={(v) => setForm({ ...form, target_exam: v })}
            options={[
              { value: "step1", label: "Step 1" },
              { value: "step2ck", label: "Step 2 CK" },
              { value: "step3", label: "Step 3" },
            ]}
          />
        </Field>
      </section>

      <section className="rounded-[10px] border border-border bg-surface p-6">
        <h2 className="text-[16px] font-[700]">Preferences</h2>
        <div className="mt-4 grid gap-4">
          <label className="flex items-center justify-between gap-6">
            <span>
              <span className="block text-[14.5px] font-semibold">Dark theme</span>
              <span className="text-[13px] text-muted">Easier on the eyes for late-night blocks.</span>
            </span>
            <Switch checked={resolvedTheme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
          </label>
          <label className="flex items-center justify-between gap-6">
            <span>
              <span className="block text-[14.5px] font-semibold">Ask how sure I am (tutor mode)</span>
              <span className="text-[13px] text-muted">Powers ARGO&apos;s calibration and misconception detection.</span>
            </span>
            <Switch checked={form.confidence_prompt} onCheckedChange={(v) => setForm({ ...form, confidence_prompt: v })} />
          </label>
        </div>
      </section>

      <div className="flex gap-2">
        <Button onClick={save} loading={pending} size="lg">
          Save changes
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="/forgot-password">Change password</Link>
        </Button>
      </div>

      <section className="rounded-[10px] border border-incorrect/30 bg-surface p-6">
        <h2 className="text-[16px] font-[700]">Delete account</h2>
        <p className="mt-1 text-[14px] text-muted">Permanently removes your account, answers, notes and leaderboard history. This cannot be undone.</p>
        <AlertDialog.Root>
          <AlertDialog.Trigger asChild>
            <Button variant="danger" className="mt-4">
              Delete my account
            </Button>
          </AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 z-50 bg-ink/50" />
            <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(440px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-[12px] border border-border bg-surface p-6 shadow-[var(--shadow-float)]">
              <AlertDialog.Title className="text-[18px] font-[700]">Delete your account?</AlertDialog.Title>
              <AlertDialog.Description className="mt-2 text-[14.5px] text-muted">
                All answers, notes, flashcards and ARGO history will be erased, and the question-writing add-on, if active, is canceled.
              </AlertDialog.Description>
              <div className="mt-6 flex justify-end gap-2">
                <AlertDialog.Cancel asChild>
                  <Button variant="secondary">Keep account</Button>
                </AlertDialog.Cancel>
                <Button
                  variant="danger"
                  loading={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    const res = await deleteAccount();
                    if (res?.error) {
                      setDeleting(false);
                      toast.error(res.error);
                    } else {
                      router.replace("/");
                      router.refresh();
                    }
                  }}
                >
                  Delete permanently
                </Button>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      </section>
    </div>
  );
}
