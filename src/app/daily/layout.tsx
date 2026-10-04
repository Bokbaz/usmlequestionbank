import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export default function DailyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader overHero={false} />
      <main className="min-h-svh bg-bg pt-16">
        <div className="mx-auto max-w-[1000px] px-5 py-10 md:px-8 md:py-14">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
