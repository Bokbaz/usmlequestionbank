import type { Metadata, Viewport } from "next";
import { Archivo, Source_Serif_4 } from "next/font/google";
import { Providers } from "@/components/providers";
import { SITE_URL } from "@/lib/utils";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
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
    default: "Argonaut USMLE: the question bank that hunts your weaknesses",
    template: "%s · Argonaut USMLE",
  },
  description:
    "Exam-faithful USMLE Step 1 and Step 2 CK questions with explanations for every choice, a high-yield Library, and ARGO, the analytics engine that builds practice around your weakest concepts.",
  applicationName: "Argonaut USMLE",
  openGraph: {
    type: "website",
    siteName: "Argonaut USMLE",
    title: "Argonaut USMLE",
    description: "The USMLE question bank powered by ARGO, your personal weakness-hunting engine.",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9fafd" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1526" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${archivo.variable} ${sourceSerif.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
