import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LibraryBrowser, type CatalogRow } from "./library-browser";

export const metadata: Metadata = { title: "Library" };

export default async function LibraryPage() {
  await requireUser("/library");
  const supabase = await createClient();
  const { data } = await supabase.rpc("library_catalog");
  const rows = (data ?? []) as CatalogRow[];
  return (
    <>
      <PageHeader
        title="Library"
        description="Concise, high-yield chapters written from the explanations in the bank, organized by the USMLE content outline."
      />
      <LibraryBrowser rows={rows} />
    </>
  );
}
