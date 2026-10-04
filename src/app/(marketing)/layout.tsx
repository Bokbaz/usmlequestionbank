import { SmoothScroll } from "@/components/marketing/smooth-scroll";
import { SiteFooter } from "@/components/marketing/site-footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      {children}
      <SiteFooter />
    </SmoothScroll>
  );
}
