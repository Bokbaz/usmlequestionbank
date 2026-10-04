import { redirect } from "next/navigation";
import { MobileTopbar, Sidebar } from "@/components/app/sidebar";
import { effectivePlan, getProfile, getUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");
  const profile = await getProfile();
  const shellUser = {
    name: profile?.display_name || user.email?.split("@")[0] || "Argonaut",
    email: user.email ?? "",
    plan: effectivePlan(profile),
    isAdmin: profile?.role === "admin",
    streak: profile?.daily_streak ?? 0,
  };
  return (
    <div className="flex min-h-svh bg-bg">
      <Sidebar user={shellUser} />
      <div className="min-w-0 flex-1">
        <MobileTopbar user={shellUser} />
        <main className="mx-auto w-full max-w-[1240px] px-5 pb-20 pt-8 md:px-8 lg:pt-10">{children}</main>
      </div>
    </div>
  );
}
