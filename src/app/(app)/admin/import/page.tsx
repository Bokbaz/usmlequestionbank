import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { aiEnabled } from "@/lib/ai/client";
import { createClient } from "@/lib/supabase/server";
import { Importer } from "./importer";

export const metadata: Metadata = { title: "Import" };

export default async function ImportPage() {
  const supabase = await createClient();
  const { data: batches } = await supabase
    .from("import_batches")
    .select("id, file_name, n_questions, n_created, n_updated, n_errors, created_at")
    .order("created_at", { ascending: false })
    .limit(8);
  return (
    <>
      <PageHeader
        title="Import questions"
        description="Upload the question file, check every item before it goes live, then commit. Questions update in place by ID, Nuggets are detected automatically and Library chapters are rebuilt."
      />
      <Importer ai={aiEnabled()} />
      {batches && batches.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-[16px] font-[700]">Recent imports</h2>
          <div className="overflow-x-auto rounded-[10px] border border-border bg-surface">
            <table className="w-full min-w-[560px] text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-border bg-panel text-[12.5px] text-muted">
                  <th className="px-4 py-2.5 font-semibold">File</th>
                  <th className="px-4 py-2.5 font-semibold">Date</th>
                  <th className="px-4 py-2.5 text-right font-semibold">New</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Updated</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Failed</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-semibold">{b.file_name ?? "Pasted text"}</td>
                    <td className="px-4 py-2.5 text-muted">{new Date(b.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td className="tabular px-4 py-2.5 text-right">{b.n_created}</td>
                    <td className="tabular px-4 py-2.5 text-right">{b.n_updated}</td>
                    <td className="tabular px-4 py-2.5 text-right">{b.n_errors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
