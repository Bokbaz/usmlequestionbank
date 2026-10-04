import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { PlanEditor } from "./plan-editor";

export const metadata: Metadata = { title: "Users" };

type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  username: string | null;
  role: "user" | "admin";
  plan: "free" | "core" | "argo";
  plan_expires_at: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  attempts: number;
};

const date = (s: string | null) => (s ? new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "–");

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_users", { p_search: q || null, p_limit: 100 });
  const users = (data ?? []) as UserRow[];
  return (
    <>
      <PageHeader title="Users" description="Search accounts and grant access manually (scholarships, partners). Stripe purchases and refunds update access on their own." />
      <form className="mb-4 flex gap-2" action="/admin/users">
        <Input name="q" defaultValue={q} placeholder="Email, name or username" className="h-9 w-72 text-[14px]" />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>
      <div className="overflow-x-auto rounded-[10px] border border-border bg-surface">
        <table className="w-full min-w-[900px] text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-border bg-panel text-[12.5px] text-muted">
              <th className="px-4 py-2.5 font-semibold">User</th>
              <th className="px-2 py-2.5 font-semibold">Joined</th>
              <th className="px-2 py-2.5 font-semibold">Last sign-in</th>
              <th className="px-2 py-2.5 text-right font-semibold">Answers</th>
              <th className="px-4 py-2.5 font-semibold">Plan</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border align-top last:border-0">
                <td className="px-4 py-3">
                  <p className="font-semibold">
                    {u.display_name || u.username || "No name"}
                    {u.role === "admin" && (
                      <Badge tone="brand" className="ml-2">
                        Admin
                      </Badge>
                    )}
                  </p>
                  <p className="text-[12.5px] text-muted">
                    {u.email}
                    {u.username ? ` · @${u.username}` : ""}
                  </p>
                </td>
                <td className="whitespace-nowrap px-2 py-3 text-muted">{date(u.created_at)}</td>
                <td className="whitespace-nowrap px-2 py-3 text-muted">{date(u.last_sign_in_at)}</td>
                <td className="tabular px-2 py-3 text-right">{u.attempts.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <PlanEditor userId={u.id} plan={u.plan} expires={u.plan_expires_at} />
                </td>
              </tr>
            ))}
            {!users.length && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
