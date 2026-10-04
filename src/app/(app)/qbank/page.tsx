import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { getTaxonomy } from "@/lib/argo/data";
import { effectivePlan, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CreateTestForm, type Counts } from "./create-test-form";

export const metadata: Metadata = { title: "Create test" };

export default async function QbankPage({ searchParams }: PageProps<"/qbank">) {
  const { profile } = await requireUser("/qbank");
  const sp = await searchParams;
  const supabase = await createClient();
  const [taxonomy, counts] = await Promise.all([
    getTaxonomy(),
    supabase.rpc("count_questions", { p_pool: ["unused"] }),
  ]);
  const plan = effectivePlan(profile);
  return (
    <>
      <PageHeader
        title="Create test"
        description="Build a block the way the exam serves it, or narrow it to exactly what you need."
      />
      {plan === "free" && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-border bg-brand-soft px-5 py-3.5">
          <p className="text-[14px] text-brand-strong">
            <strong>Free plan:</strong> you are drawing from the free sample questions. Every question unlocks with Full access, $48 once.
          </p>
          <Link href="/pricing" className="text-[14px] font-semibold text-brand-strong underline underline-offset-2">
            Unlock
          </Link>
        </div>
      )}
      <CreateTestForm
        taxonomy={{ systems: taxonomy.systems, disciplines: taxonomy.disciplines, competencies: taxonomy.competencies }}
        initialCounts={(counts.data as Counts) ?? null}
        defaultExam={profile?.target_exam ?? null}
        initialError={typeof sp.error === "string" ? sp.error : null}
      />
    </>
  );
}
