import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { requireUser } from "@/lib/auth";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { user, profile } = await requireUser("/settings");
  return (
    <>
      <PageHeader
        title="Settings"
        description={
          <>
            Signed in as {user.email}.{" "}
            <Link href="/settings/billing" className="font-semibold text-brand-strong hover:underline">
              Plan and billing
            </Link>
          </>
        }
      />
      <SettingsForm
        initial={{
          display_name: profile.display_name ?? "",
          username: profile.username ?? "",
          country: profile.country,
          target_exam: profile.target_exam,
          exam_date: profile.exam_date,
          school: profile.school_name ? { id: profile.school_id, name: profile.school_name } : null,
          confidence_prompt: (profile.settings?.confidence_prompt as boolean | undefined) ?? true,
        }}
      />
    </>
  );
}
