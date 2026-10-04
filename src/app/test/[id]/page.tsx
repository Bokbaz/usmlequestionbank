import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { TestPlayer } from "@/components/player/test-player";
import type { PlayerData } from "@/components/player/types";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Test" };

export default async function TestPage({ params, searchParams }: PageProps<"/test/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getUser();
  if (!user) redirect(`/login?next=/test/${id}`);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_test", { p_test: id });
  if (error || !data) notFound();
  const q = typeof sp.q === "string" ? Number(sp.q) - 1 : undefined;
  return <TestPlayer data={data as PlayerData} initialPosition={Number.isFinite(q) ? q : undefined} />;
}
