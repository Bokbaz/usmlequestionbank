import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Argonaut USMLE",
    short_name: "Argonaut",
    description: "USMLE Step 1 and Step 2 CK question bank with ARGO adaptive analytics.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f4f7f8",
    theme_color: "#015c61",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
