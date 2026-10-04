import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Constellation } from "@/components/marketing/constellation";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1fr_1.05fr]">
      <aside className="relative hidden overflow-hidden bg-ink text-on-ink lg:block">
        <Constellation className="pointer-events-none absolute inset-0 h-full w-full text-on-ink/50" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" aria-label="Argonaut USMLE home">
            <Logo tone="inverse" />
          </Link>
          <div className="max-w-[440px]">
            <p className="display text-[52px] font-[800]">Every answer makes the next session smarter.</p>
            <p className="mt-5 text-[16px] leading-relaxed text-on-ink-muted">
              ARGO tracks how you answer, not just what you answer, and turns it into a plan you can act on today.
            </p>
          </div>
          <p className="text-[12.5px] text-on-ink-muted">Not affiliated with the FSMB or NBME.</p>
        </div>
      </aside>
      <main className="flex flex-col bg-surface">
        <div className="flex h-16 items-center px-6 lg:hidden">
          <Link href="/" aria-label="Argonaut USMLE home">
            <Logo />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
      </main>
    </div>
  );
}
