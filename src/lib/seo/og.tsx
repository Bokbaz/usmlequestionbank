import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Social cards (1200x630): deep teal, Geist, the Argo Navis "A" and a tick-mark ruler, like the
// hero. Colours are sRGB approximations of the DESIGN.md tokens (Satori has no OKLCH).
const TEAL = "#015c61";
const INK = "#0c1d22";
const AQUA = "#5ef0d7";
const LIGHT = "#f2fafa";
const MUTED = "#bfe0e0";

let fonts: Promise<{ name: string; data: Buffer; weight: 500 | 700; style: "normal" }[]> | undefined;

function loadFonts() {
  fonts ??= (async () => {
    const dir = join(process.cwd(), "src/assets/fonts");
    const [medium, bold, mono] = await Promise.all([
      readFile(join(dir, "Geist-500.ttf")),
      readFile(join(dir, "Geist-700.ttf")),
      readFile(join(dir, "GeistMono-500.ttf")),
    ]);
    return [
      { name: "Geist", data: medium, weight: 500 as const, style: "normal" as const },
      { name: "Geist", data: bold, weight: 700 as const, style: "normal" as const },
      { name: "Geist Mono", data: mono, weight: 500 as const, style: "normal" as const },
    ];
  })();
  return fonts;
}

export function ArgoMarkSvg({ size, ink, apex }: { size: number; ink: string; apex: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256">
      <path d="M48 214 L128 42 L208 214" fill="none" stroke={ink} strokeWidth="20" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M83 147 H173" fill="none" stroke={ink} strokeWidth="20" strokeLinecap="square" />
      <rect x="34" y="200" width="28" height="28" rx="2" fill={ink} />
      <rect x="194" y="200" width="28" height="28" rx="2" fill={ink} />
      <rect x="70" y="134" width="26" height="26" rx="2" fill={ink} />
      <rect x="160" y="134" width="26" height="26" rx="2" fill={ink} />
      <path d="M128 12 L136.5 33.5 L158 42 L136.5 50.5 L128 72 L119.5 50.5 L98 42 L119.5 33.5 Z" fill={apex} />
    </svg>
  );
}

export async function ogImage({
  eyebrow,
  title,
  subtitle,
  tone = "teal",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  tone?: "teal" | "ink";
}) {
  const bg = tone === "teal" ? TEAL : INK;
  const titleSize = title.length > 70 ? 56 : title.length > 44 ? 66 : 80;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          background: bg,
          color: LIGHT,
          fontFamily: "Geist",
          padding: "56px 72px 48px",
        }}
      >
        {/* 12-column hairline grid, as behind the hero */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex" }}>
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} style={{ flex: 1, borderLeft: i ? "1px solid rgba(242,250,250,0.07)" : "none" }} />
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <ArgoMarkSvg size={46} ink={LIGHT} apex={AQUA} />
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 27, fontWeight: 700, letterSpacing: 3.5 }}>ARGONAUT</span>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 4, color: MUTED }}>USMLE</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
          <div style={{ display: "flex", fontFamily: "Geist Mono", fontSize: 22, letterSpacing: 2.5, color: AQUA, textTransform: "uppercase" }}>
            {eyebrow}
          </div>
          <div style={{ display: "flex", marginTop: 18, maxWidth: 1040, fontSize: titleSize, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2.4 }}>
            {title}
          </div>
          {subtitle ? (
            <div style={{ display: "flex", marginTop: 22, maxWidth: 960, fontSize: 28, fontWeight: 500, lineHeight: 1.3, color: MUTED }}>
              {subtitle}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 40,
            paddingTop: 22,
            borderTop: "2px solid rgba(242,250,250,0.35)",
            fontSize: 23,
            fontWeight: 500,
          }}
        >
          <span>argonautusmle.com</span>
          <span style={{ fontFamily: "Geist Mono", color: AQUA }}>$48 once · Step 1 + Step 2 CK</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: await loadFonts() },
  );
}
