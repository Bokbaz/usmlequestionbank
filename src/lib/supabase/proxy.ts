import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/qbank", "/tests", "/test/", "/performance", "/argo", "/notebook", "/flashcards", "/settings", "/admin", "/nuggets", "/study"];

// Same URL, two Libraries: signed-in students get the in-app Library (their unlocked chapters, drill
// buttons, sidebar) from /study/library; everyone else, crawlers included, gets the public
// catalogue prerendered at /library.
const isLibrary = (path: string) => (path === "/library" || path.startsWith("/library/")) && !path.includes("opengraph-image");

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value as string));
        },
      },
    },
  );

  // Do not run code between createServerClient and getClaims().
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  const path = request.nextUrl.pathname;
  if (!signedIn && PROTECTED.some((p) => path === p.replace(/\/$/, "") || path.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path + request.nextUrl.search);
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }
  if (signedIn && isLibrary(path)) {
    const url = request.nextUrl.clone();
    url.pathname = `/study${path}`;
    const rewrite = NextResponse.rewrite(url, { request });
    response.cookies.getAll().forEach((c) => rewrite.cookies.set(c));
    const cacheControl = response.headers.get("cache-control");
    if (cacheControl) rewrite.headers.set("cache-control", cacheControl);
    return rewrite;
  }
  if (signedIn && (path === "/login" || path === "/signup")) {
    const next = request.nextUrl.searchParams.get("next") ?? "/dashboard";
    const destination = new URL(next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/dashboard", request.nextUrl.origin);
    const url = request.nextUrl.clone();
    url.pathname = destination.pathname;
    url.search = destination.search;
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }
  return response;
}
