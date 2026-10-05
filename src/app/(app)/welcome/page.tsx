import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { WelcomeForm } from "./welcome-form";

export const metadata: Metadata = { title: "Welcome" };

export default async function WelcomePage() {
  const { profile } = await requireUser("/welcome");
  return (
    <div className="max-w-[720px]">
      <p className="eyebrow text-brand-strong">Welcome to the team</p>
      <h1 className="display mt-4 text-[clamp(34px,4vw,48px)] font-bold">Set up your race plan.</h1>
      <p className="mt-3 max-w-[52ch] text-[16px] text-muted">Thirty seconds, and ARGO knows what to aim at. You can change any of this later in Settings.</p>
      <div className="mt-10">
        <WelcomeForm
          initial={{
            display_name: profile.display_name ?? "",
            username: profile.username ?? "",
            country: profile.country,
            target_exam: profile.target_exam,
            exam_date: profile.exam_date,
            school: profile.school_name ? { id: profile.school_id, name: profile.school_name } : null,
          }}
        />
      </div>
    </div>
  );
}
