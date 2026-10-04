"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createTestFromIds } from "@/app/actions/tests";

export function DrillChapterButton({ ids, title }: { ids: string[]; title: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      className="mt-4 w-full"
      loading={pending}
      onClick={() =>
        start(async () => {
          const res = await createTestFromIds(ids, `Chapter · ${title}`);
          if (res.error || !res.id) toast.error(res.error ?? "Could not start the block");
          else router.push(`/test/${res.id}`);
        })
      }
    >
      <Play className="size-4" /> Drill this chapter
    </Button>
  );
}
