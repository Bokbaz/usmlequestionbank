import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Science_Gothic, Source_Serif_4 } from "next/font/google";
import { Providers } from "@/components/providers";
import { SITE_URL } from "@/lib/utils";
import "./globals.css";

// Display: Science Gothic, a variable gothic with width and slant axes.
const gothic = Science_Gothic({
  subsets: ["latin"],
  axes: ["wdth", "slnt"],
  variable: "--font-gothic",
  display: "swap",
});

// Text: Atkinson Hyperlegible Next, built for legibility (slashed zero for lab values).
const text = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-text",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Argonaut USMLE: a question bank that runs like an F1 team",
    template: "%s · Argonaut USMLE",
  },
  description:
    "USMLE Step 1 and Step 2 CK questions with every answer choice explained, and analytics deep enough to show exactly where you're losing points. $48, once.",
  applicationName: "Argonaut USMLE",
  openGraph: {
    type: "website",
    siteName: "Argonaut USMLE",
    title: "Argonaut USMLE",
    description: "A USMLE question bank that runs like an F1 team. Big-bank quality for $48, once.",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f8" },
    { media: "(prefers-color-scheme: dark)", color: "#111419" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${gothic.variable} ${text.variable} ${sourceSerif.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
