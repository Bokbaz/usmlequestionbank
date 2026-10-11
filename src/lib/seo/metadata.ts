import type { Metadata } from "next";

export const SITE_NAME = "Argonaut USMLE";

export const DEFAULT_TITLE = "USMLE Question Bank for Step 1 & Step 2 CK | Argonaut USMLE";
export const DEFAULT_DESCRIPTION =
  "Prepare for USMLE Step 1 and Step 2 CK with exam-style questions, every answer choice explained and ARGO weak-area practice. Try free questions, then $48 once.";

type PageMeta = {
  /** Shown as "<title> | Argonaut USMLE". Pass { absolute } for a title without the suffix. */
  title: string | { absolute: string };
  description: string;
  /** Canonical path, such as "/pricing". Each indexable page points at itself. */
  path: string;
  noindex?: boolean;
  type?: "website" | "article";
  modifiedTime?: string;
  /** The route has its own opengraph-image file. (Images set here would override it.) */
  ownImage?: boolean;
};

// The site-wide social card (app/opengraph-image.tsx). A page's openGraph object replaces the
// layout's, so pages without their own opengraph-image file name it explicitly.
const DEFAULT_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Argonaut USMLE: the USMLE question bank for Step 1 and Step 2 CK",
};

// Page metadata with a self-referencing canonical and matching social tags.
export function pageMetadata({ title, description, path, noindex, type = "website", modifiedTime, ownImage }: PageMeta): Metadata {
  const full = typeof title === "string" ? `${title} | ${SITE_NAME}` : title.absolute;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      url: path,
      siteName: SITE_NAME,
      locale: "en_US",
      title: full,
      description,
      ...(ownImage ? {} : { images: [DEFAULT_IMAGE] }),
      ...(type === "article" && modifiedTime ? { modifiedTime } : {}),
    },
    twitter: { card: "summary_large_image", title: full, description },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

// Utility pages (sign-in, account, private study areas): keep them out of search results, but
// let crawlers follow their links and see the directive.
export const NOINDEX: Metadata["robots"] = { index: false, follow: true };
