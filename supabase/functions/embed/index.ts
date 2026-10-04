// Text embeddings with Supabase's built-in gte-small model (384 dims, normalized).
// The Nugget index was embedded with the same model, so vectors are comparable.
// verify_jwt is on: callers send a user access token or the service-role JWT.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const session = new Supabase.ai.Session("gte-small");
const MAX_INPUTS = 32;
const MAX_CHARS = 2000;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });

  let body: { input?: string | string[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400, headers: cors });
  }
  const inputs = Array.isArray(body.input) ? body.input : body.input ? [body.input] : [];
  if (!inputs.length || inputs.length > MAX_INPUTS || inputs.some((t) => typeof t !== "string")) {
    return Response.json({ error: `Send 1-${MAX_INPUTS} strings in "input"` }, { status: 400, headers: cors });
  }

  const embeddings: number[][] = [];
  for (const text of inputs) {
    const vector = (await session.run(text.slice(0, MAX_CHARS), { mean_pool: true, normalize: true })) as number[];
    embeddings.push(vector);
  }
  return Response.json({ embeddings }, { headers: cors });
});
