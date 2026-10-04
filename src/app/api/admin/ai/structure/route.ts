import { NextResponse } from "next/server";
import * as z from "zod";
import { aiErrorResponse } from "@/lib/ai/http";
import { structureQuestion } from "@/lib/ai/importer";
import { getAdminClient } from "@/lib/auth";

export const maxDuration = 120;

const Body = z.object({ text: z.string().min(20).max(20_000) });

export async function POST(request: Request) {
  if (!(await getAdminClient())) return NextResponse.json({ error: "Admins only" }, { status: 403 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Send the question text (20 to 20,000 characters)" }, { status: 400 });
  try {
    const { data, usage } = await structureQuestion(parsed.data.text);
    return NextResponse.json({ question: data, usage });
  } catch (e) {
    return aiErrorResponse(e);
  }
}
