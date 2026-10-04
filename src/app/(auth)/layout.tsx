import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1fr_1.05fr]">
      <aside className="on-signal relative hidden overflow-hidden bg-brand text-on-brand lg:block">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px)] [background-size:calc(100%/6)_100%]"
        />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" aria-label="Argonaut USMLE home">
            <Logo tone="signal" />
          </Link>
          <div className="max-w-[520px] border-t-2 border-on-brand pt-8">
            <p className="display slant text-[clamp(44px,4.6vw,68px)] font-[880]">Welcome to the team.</p>
            <p className="mt-6 max-w-[40ch] text-[18px] font-semibold leading-relaxed">
              Every answer you give makes the next session sharper. We&apos;ll do the math. You put in the reps.
            </p>
          </div>
          <p className="text-[13px] font-semibold text-on-brand-muted">Not affiliated with the FSMB or NBME.</p>
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
