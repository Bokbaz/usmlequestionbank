import { Skeleton } from "@/components/ui/misc";

// Shown the instant a sidebar link is clicked, while the page renders on the server. Without it,
// dynamic routes are not prefetched and navigation waits on the full render.
export default function AppLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div className="pb-8">
        <Skeleton className="h-9 w-[min(320px,70%)]" />
        <Skeleton className="mt-3 h-4 w-[min(520px,90%)]" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="mt-4 h-72" />
    </div>
  );
}
