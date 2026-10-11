import type { NextConfig } from "next";

// User agents that get page metadata in <head> instead of streamed into <body>: Next's default
// list, plus Googlebot, AI crawlers and SEO tools, which read the raw HTML. Public pages are
// prerendered anyway; this covers the dynamic ones.
const HTML_LIMITED_BOTS = new RegExp(
  [
    // Next.js defaults (next/dist/shared/lib/router/utils/html-bots)
    "[\\w-]+-Google", "Google-[\\w-]+", "Chrome-Lighthouse", "Slurp", "DuckDuckBot", "baiduspider", "yandex", "sogou",
    "bitlybot", "tumblr", "vkShare", "quora link preview", "redditbot", "ia_archiver", "Bingbot", "BingPreview", "applebot",
    "facebookexternalhit", "facebookcatalog", "Twitterbot", "LinkedInBot", "Slackbot", "Discordbot", "WhatsApp",
    "SkypeUriPreview", "Yeti", "googleweblight",
    // Search, AI assistants and crawlers that don't run JavaScript
    "Googlebot", "GoogleOther", "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot",
    "PerplexityBot", "Perplexity-User", "CCBot", "Amazonbot", "Bytespider", "meta-externalagent", "DuckAssistBot",
    "MistralAI-User", "cohere-ai",
    // Anything else that says it is a bot
    "bot\\b", "crawler", "spider",
  ].join("|"),
  "i",
);

const CANONICAL = "https://argonautusmle.com";

const nextConfig: NextConfig = {
  htmlLimitedBots: HTML_LIMITED_BOTS,
  async headers() {
    const policy = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === "development" ? "'unsafe-eval' " : ""}https://*.stripe.com`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.stripe.com",
      "font-src 'self' data:",
      "connect-src 'self' https://*.stripe.com https://*.stripe.network https://*.link.com https://*.supabase.co wss://*.supabase.co",
      "frame-src https://*.stripe.com https://*.link.com",
      "form-action 'self' https://*.stripe.com",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
    ].join("; ");
    return [{ source: "/checkout/:path*", headers: [{ key: "Content-Security-Policy", value: policy }] }];
  },
  // Social card routes read the Geist TTFs from disk at runtime.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./src/assets/fonts/*.ttf"],
    "/**/opengraph-image": ["./src/assets/fonts/*.ttf"],
  },
  async redirects() {
    return [
      // One preferred host: https://argonautusmle.com. (www needs a DNS record pointing at Vercel.)
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.argonautusmle.com" }],
        destination: `${CANONICAL}/:path*`,
        permanent: true,
      },
      // The vercel.app alias serves the same site. API routes are left alone so webhooks that
      // still point there keep working.
      {
        source: "/:path((?!api/).*)",
        has: [{ type: "host", value: "argonaut-usmle.vercel.app" }],
        destination: `${CANONICAL}/:path`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
