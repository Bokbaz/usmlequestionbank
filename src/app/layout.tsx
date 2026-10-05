import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import { Providers } from "@/components/providers";
import { SITE_URL } from "@/lib/utils";
import "./globals.css";

// Geist: a sharp neo-grotesque in the San Francisco mould, for display and text alike.
const geist = Geist({
  subsets: ["latin", "latin-ext"],
  variable: "--font-geist",
  display: "swap",
});

// Geist Mono: telemetry readouts only (codes, timings, deltas).
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
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
    default: "Argonaut USMLE: the USMLE Qbank that studies you",
    template: "%s · Argonaut USMLE",
  },
  description:
    "USMLE Step 1 and Step 2 CK questions written like the real exam. ARGO learns your weak spots and builds your questions around them. $48 for lifetime access.",
  applicationName: "Argonaut USMLE",
  openGraph: {
    type: "website",
    siteName: "Argonaut USMLE",
    title: "Argonaut USMLE",
    description: "The USMLE Qbank that studies you. $48 for lifetime access, never a subscription.",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1214" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable} ${sourceSerif.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
