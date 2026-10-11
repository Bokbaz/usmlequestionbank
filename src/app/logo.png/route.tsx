import { ImageResponse } from "next/og";
import { ArgoMarkSvg } from "@/lib/seo/og";

// 512x512 PNG of the Argo Navis mark, the logo in Organization structured data.
export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f7f8" }}>
        <ArgoMarkSvg size={392} ink="#0a181d" apex="#015c61" />
      </div>
    ),
    { width: 512, height: 512 },
  );
}
