import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type * as z from "zod/v4";

// Claude powers three optional features: AI structuring and classification in the admin
// importer, and ARGO question writing. Everything else works without a key.
export const MODEL = "claude-opus-5-5";

export function aiEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

export class AiError extends Error {
  constructor(
    message: string,
    readonly kind: "unavailable" | "rate_limited" | "refused" | "truncated" | "invalid" | "upstream",
  ) {
    super(message);
  }
}

export type AiUsage = { input: number; output: number; cacheRead: number; cacheWrite: number };

type StructuredCall<T extends z.ZodType> = {
  system: string;
  user: string;
  schema: T;
  effort: "low" | "medium" | "high";
  maxTokens?: number;
  // Per-call budget; keep the sum of sequential calls inside the route's maxDuration.
  timeoutMs?: number;
};

// One structured request. The system prompt is frozen per feature and marked for caching;
// all request-specific material goes in the user turn after the cache breakpoint.
// Refusals are retried server-side on the fallback model chosen by the API. Transient
// failures (429, 5xx, dropped connections) get one retry while the call's budget allows;
// timeouts are not retried so a call never outlives timeoutMs.
export async function structured<T extends z.ZodType>(call: StructuredCall<T>): Promise<{ data: z.infer<T>; usage: AiUsage }> {
  if (!aiEnabled()) throw new AiError("ANTHROPIC_API_KEY is not configured", "unavailable");
  const deadline = Date.now() + (call.timeoutMs ?? 120_000);
  let message;
  for (let attempt = 0; ; attempt++) {
    try {
      message = await getClient().beta.messages.parse(
        {
          model: MODEL,
          max_tokens: call.maxTokens ?? 16000,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system: [{ type: "text", text: call.system, cache_control: { type: "ephemeral" } }],
          messages: [{ role: "user", content: call.user }],
          output_config: { effort: call.effort, format: betaZodOutputFormat(call.schema) },
        },
        { timeout: Math.max(5_000, deadline - Date.now()), maxRetries: 0 },
      );
      break;
    } catch (error) {
      const transient =
        error instanceof Anthropic.RateLimitError ||
        error instanceof Anthropic.InternalServerError ||
        (error instanceof Anthropic.APIConnectionError && !(error instanceof Anthropic.APIConnectionTimeoutError));
      if (transient && attempt === 0 && deadline - Date.now() > 30_000) {
        await new Promise((r) => setTimeout(r, 2_000));
        continue;
      }
      throw toAiError(error);
    }
  }

  const usage: AiUsage = {
    input: message.usage.input_tokens,
    output: message.usage.output_tokens,
    cacheRead: message.usage.cache_read_input_tokens ?? 0,
    cacheWrite: message.usage.cache_creation_input_tokens ?? 0,
  };
  if (message.stop_reason === "refusal") throw new AiError("Claude declined this request", "refused");
  if (message.stop_reason === "max_tokens") throw new AiError("Response was cut off before it finished", "truncated");
  if (message.parsed_output == null) throw new AiError("Response did not match the expected format", "invalid");
  return { data: message.parsed_output as z.infer<T>, usage };
}

export function addUsage(a: AiUsage, b: AiUsage): AiUsage {
  return { input: a.input + b.input, output: a.output + b.output, cacheRead: a.cacheRead + b.cacheRead, cacheWrite: a.cacheWrite + b.cacheWrite };
}

export const NO_USAGE: AiUsage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };

function toAiError(error: unknown): AiError {
  if (error instanceof Anthropic.RateLimitError) return new AiError("Claude is busy. Try again in a minute.", "rate_limited");
  if (error instanceof Anthropic.AuthenticationError) return new AiError("ANTHROPIC_API_KEY was rejected", "unavailable");
  if (error instanceof Anthropic.BadRequestError) return new AiError(`Claude rejected the request: ${error.message}`, "invalid");
  if (error instanceof Anthropic.APIConnectionTimeoutError) return new AiError("Claude took too long to respond", "upstream");
  if (error instanceof Anthropic.APIConnectionError) return new AiError("Could not reach Claude", "upstream");
  if (error instanceof Anthropic.APIError) return new AiError(`Claude error ${error.status ?? ""}: ${error.message}`, "upstream");
  // Anything else is the SDK failing to validate the response against the schema.
  return new AiError(error instanceof Error ? error.message : "Unreadable response", "invalid");
}
