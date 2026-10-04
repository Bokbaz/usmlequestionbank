import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { WelcomeForm } from "./welcome-form";

export const metadata: Metadata = { title: "Welcome" };

export default async function WelcomePage() {
  const { profile } = await requireUser("/welcome");
  return (
    <div className="max-w-[640px]">
      <p className="eyebrow text-brand-strong">Welcome to the team</p>
      <h1 className="heading mt-3 text-[34px] font-[850] leading-tight">Two quick things</h1>
      <p className="mt-2 text-[15.5px] text-muted">So ARGO can pace your prep around your exam. You can change these anytime.</p>
      <div className="mt-8 rounded-[8px] border border-border bg-surface p-6 md:p-8">
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
