import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { NOINDEX } from "@/lib/seo/metadata";

export const metadata = { robots: NOINDEX };

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-svh bg-bg">
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-4 px-5 py-5 md:px-8">
        <Link href="/" aria-label="Argonaut USMLE home"><Logo /></Link>
        <Link href="/pricing" className="text-[13px] font-semibold text-muted hover:text-text">Back to pricing</Link>
      </div>
    </header>
    <main className="mx-auto max-w-[1120px] px-5 py-10 md:px-8 md:py-14">{children}</main>
  </div>;
}
