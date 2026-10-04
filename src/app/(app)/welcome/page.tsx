import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { WelcomeForm } from "./welcome-form";

export const metadata: Metadata = { title: "Welcome" };

export default async function WelcomePage() {
  const { profile } = await requireUser("/welcome");
  return (
    <div className="max-w-[640px]">
      <p className="eyebrow text-brand">Welcome aboard</p>
      <h1 className="mt-3 text-[32px] font-[750] leading-tight tracking-[-0.02em]">Set your course</h1>
      <p className="mt-2 text-[15.5px] text-muted">Two quick details so ARGO can pace your preparation. You can change them anytime.</p>
      <div className="mt-8 rounded-[12px] border border-border bg-surface p-6 md:p-8">
        <WelcomeForm
          initial={{
            display_name: profile.display_name ?? "",
            username: profile.username ?? "",
            country: profile.country,
            target_exam: profile.target_exam,
            exam_date: profile.exam_date,
          }}
        />
      </div>
    </div>
  );
}
