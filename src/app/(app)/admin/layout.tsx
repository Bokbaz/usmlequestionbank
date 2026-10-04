import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { AdminTabs } from "./admin-tabs";

export const metadata: Metadata = { title: { template: "%s · Admin · Argonaut USMLE", default: "Admin" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <AdminTabs />
      {children}
    </>
  );
}
