import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import { buildKnowledge, RECRUITER_INSTRUCTIONS } from "@/lib/recruiter/knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
// Models that accept server-side refusal fallbacks in the "default" form.
const FALLBACK_MODELS = new Set(["claude-fable-5-1", "claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5"]);

const MAX_MESSAGE_CHARS = 800;
const MAX_HISTORY_TURNS = 12;
const MAX_TURN_CHARS = 2400;

// Built once per server instance and identical on every request, so the prompt cache can hit.
const SYSTEM_PROMPT = `${RECRUITER_INSTRUCTIONS}\n\n<portfolio>\n${buildKnowledge()}\n</portfolio>`;

let client: Anthropic | null = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  client ??= new Anthropic({ timeout: 30_000, maxRetries: 1 });
  return client;
}

// --- Best-effort per-IP rate limit (per server instance; see README for production) ----------
const hits = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60 * 60_000);
  const lastMinute = recent.filter((t) => now - t < 60_000).length;
  if (lastMinute >= 8 || recent.length >= 60) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.delete(hits.keys().next().value!);
  return false;
}

function clientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

/** Only same-origin requests (plus any origins listed in RECRUITER_ALLOWED_ORIGINS). */
function originAllowed(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const allowed = (process.env.RECRUITER_ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (allowed.includes(origin)) return true;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

type Turn = { role: "user" | "assistant"; content: string };

function parseBody(body: unknown): { message: string; history: Turn[] } | null {
  if (!body || typeof body !== "object") return null;
  const { message, history = [] } = body as { message?: unknown; history?: unknown };
  if (typeof message !== "string") return null;
  const text = message.trim();
  if (!text || text.length > MAX_MESSAGE_CHARS) return null;
  if (!Array.isArray(history) || history.length > MAX_HISTORY_TURNS) return null;
  const turns: Turn[] = [];
  for (const [i, t] of history.entries()) {
    if (!t || typeof t !== "object") return null;
    const { role, content } = t as { role?: unknown; content?: unknown };
    const expected = i % 2 === 0 ? "user" : "assistant";
    if (role !== expected || typeof content !== "string" || !content.trim() || content.length > MAX_TURN_CHARS) return null;
    turns.push({ role: expected, content });
  }
  if (turns.length % 2 !== 0) return null; // must end with an assistant turn
  return { message: text, history: turns };
}

const error = (status: number, code: string, message: string) => NextResponse.json({ error: code, message }, { status });

/** Lets the chat UI show "not configured yet" up front. Reveals nothing but a boolean. */
export function GET() {
  return NextResponse.json({ configured: Boolean(process.env.ANTHROPIC_API_KEY) });
}

export async function POST(req: NextRequest) {
  if (!originAllowed(req)) return error(403, "forbidden", "Requests must come from this website.");

  const anthropic = getClient();
  if (!anthropic) {
    return error(503, "not_configured", "The AI Recruiter isn't configured yet. The site owner needs to add an API key.");
  }

  if (rateLimited(clientIp(req))) {
    return error(429, "rate_limited", "That's a lot of questions! Please wait a minute and try again.");
  }

  const raw = await req.text();
  if (raw.length > 40_000) return error(413, "too_large", "That message is too long.");
  let parsed: ReturnType<typeof parseBody>;
  try {
    parsed = parseBody(JSON.parse(raw));
  } catch {
    parsed = null;
  }
  if (!parsed) return error(400, "invalid_request", `Please send a question of up to ${MAX_MESSAGE_CHARS} characters.`);

  // History is plain text from the browser (no thinking blocks), rebuilt each request.
  const messages: Anthropic.Beta.Messages.BetaMessageParam[] = [...parsed.history, { role: "user", content: parsed.message }];

  const params: Anthropic.Beta.Messages.MessageCreateParamsNonStreaming = {
    model: MODEL,
    max_tokens: 2000,
    output_config: { effort: "low" },
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages,
  };
  if (FALLBACK_MODELS.has(MODEL)) {
    // If a safety classifier declines, the API retries on a permitted fallback model in the same call.
    params.betas = ["server-side-fallback-2026-07-01"];
    params.fallbacks = "default";
  }

  try {
    const response = await anthropic.beta.messages.create(params);

    if (response.stop_reason === "refusal") {
      return NextResponse.json({
        reply: "I can't help with that one, but I'm happy to answer questions about Kanasu's skills, projects, experience or achievements.",
      });
    }
    const reply = response.content
      .filter((b): b is Anthropic.Beta.Messages.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    if (!reply) return error(502, "empty_reply", "The assistant didn't return an answer. Please try again.");
    return NextResponse.json({ reply });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
      console.error("[ai-recruiter] API key rejected:", e.status);
      return error(503, "not_configured", "The AI Recruiter isn't available right now (configuration issue).");
    }
    if (e instanceof Anthropic.NotFoundError || e instanceof Anthropic.BadRequestError) {
      console.error("[ai-recruiter] Request rejected:", e.status, e.message);
      return error(502, "provider_error", "The AI Recruiter couldn't answer that. Please try again.");
    }
    if (e instanceof Anthropic.RateLimitError) {
      return error(429, "busy", "The assistant is busy right now. Please try again in a moment.");
    }
    if (e instanceof Anthropic.APIConnectionTimeoutError) {
      return error(504, "timeout", "The assistant took too long to answer. Please try again.");
    }
    if (e instanceof Anthropic.APIError) {
      console.error("[ai-recruiter] Provider error:", e.status, e.message);
      return error(502, "provider_error", "The assistant is having trouble right now. Please try again.");
    }
    console.error("[ai-recruiter] Unexpected error:", e);
    return error(500, "server_error", "Something went wrong. Please try again.");
  }
}
