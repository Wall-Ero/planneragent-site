// src/sandbox/llm.ts
// ==========================================
// LLM Adapter (Workers) + Multi-LLM Parallel
// ==========================================

export type LlmProvider = "worker-ai" | "openai" | "anthropic";

export type LlmRole = "system" | "user" | "assistant";

export type LlmMessage = {
  role: LlmRole;
  content: string;
};

export type LlmCall = {
  callId: string;
  provider: LlmProvider;
  model: string;

  messages: LlmMessage[];

  // common knobs
  temperature?: number;
  maxTokens?: number;

  // optional: structured output (only where supported)
  responseFormat?:
    | { type: "text" }
    | {
        type: "json_schema";
        name: string;
        schema: Record<string, any>;
        strict?: boolean;
      };
};

export type LlmUsage = {
  inputTokens?: number;
  outputTokens?: number;
};

export type LlmResult =
  | {
      ok: true;
      callId: string;
      provider: LlmProvider;
      model: string;
      text: string;
      json?: any;
      usage?: LlmUsage;
      latencyMs: number;
    }
  | {
      ok: false;
      callId: string;
      provider: LlmProvider;
      model: string;
      error: string;
      latencyMs: number;
      status?: number;
    };

export type SandboxEnv = {
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
};

// ---------------------
// Public entrypoints
// ---------------------

export async function callManyLLMs(env: SandboxEnv, calls: LlmCall[]): Promise<LlmResult[]> {
  const tasks = calls.map((c) => callOneLLM(env, c));
  const settled = await Promise.allSettled(tasks);

  return settled.map((s, idx) => {
    const call = calls[idx];
    if (s.status === "fulfilled") return s.value;
    return {
      ok: false,
      callId: call.callId,
      provider: call.provider,
      model: call.model,
      error: s.reason?.message ?? String(s.reason ?? "Unknown error"),
      latencyMs: 0
    } satisfies LlmResult;
  });
}

export async function callOneLLM(env: SandboxEnv, call: LlmCall): Promise<LlmResult> {
  switch (call.provider) {
    case "openai":
      return callOpenAI(env, call);
    case "anthropic":
      return callAnthropic(env, call);
    default:
      return {
        ok: false,
        callId: call.callId,
        provider: call.provider,
        model: call.model,
        error: `Unsupported provider: ${String(call.provider)}`,
        latencyMs: 0
      };
  }
}

// ---------------------
// OpenAI (Responses API)
// ---------------------
// Docs: Responses endpoint + response_format json_schema. 0
async function callOpenAI(env: SandboxEnv, call: LlmCall): Promise<LlmResult> {
  const t0 = Date.now();
  if (!env.OPENAI_API_KEY) {
    return fail(call, "Missing OPENAI_API_KEY", Date.now() - t0);
  }

  const input = call.messages.map((m) => ({
    role: m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user",
    content: [{ type: "text", text: m.content }]
  }));

  const body: any = {
    model: call.model,
    input,
    temperature: call.temperature ?? 0.2
  };

  if (typeof call.maxTokens === "number") {
    body.max_output_tokens = call.maxTokens;
  }

  if (call.responseFormat?.type === "json_schema") {
    body.response_format = {
      type: "json_schema",
      json_schema: {
        name: call.responseFormat.name,
        schema: call.responseFormat.schema,
        strict: call.responseFormat.strict ?? true
      }
    };
  } else if (call.responseFormat?.type === "text") {
    // default anyway; no-op
  }

  const resp = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const latencyMs = Date.now() - t0;
  const raw = await safeJson(resp);

  if (!resp.ok) {
    return fail(call, extractError(raw) ?? `OpenAI error (${resp.status})`, latencyMs, resp.status);
  }

  // Prefer output_text if present; otherwise try to reconstruct.
  const text =
    raw?.output_text ??
    extractOpenAIText(raw) ??
    "";

  const json =
    call.responseFormat?.type === "json_schema"
      ? safeParseJson(text)
      : undefined;

  const usage: LlmUsage | undefined = raw?.usage
    ? {
        inputTokens: raw.usage?.input_tokens,
        outputTokens: raw.usage?.output_tokens
      }
    : undefined;

  return {
    ok: true,
    callId: call.callId,
    provider: "openai",
    model: call.model,
    text,
    json,
    usage,
    latencyMs
  };
}

function extractOpenAIText(raw: any): string | null {
  // Best-effort for various shapes:
  // raw.output: [{content:[{type:"output_text", text:"..."}]}]
  const out = raw?.output;
  if (!Array.isArray(out)) return null;

  const chunks: string[] = [];
  for (const item of out) {
    const content = item?.content;
    if (!Array.isArray(content)) continue;
    for (const c of content) {
      if (typeof c?.text === "string") chunks.push(c.text);
      if (typeof c?.output_text === "string") chunks.push(c.output_text);
    }
  }
  return chunks.length ? chunks.join("") : null;
}

// ---------------------
// Anthropic (Messages API)
// ---------------------
// Docs: headers x-api-key + anthropic-version; endpoint /v1/messages. 1
async function callAnthropic(env: SandboxEnv, call: LlmCall): Promise<LlmResult> {
  const t0 = Date.now();
  if (!env.ANTHROPIC_API_KEY) {
    return fail(call, "Missing ANTHROPIC_API_KEY", Date.now() - t0);
  }

  // Anthropic doesn't accept system as a "message" the same way; we fold system into the first user msg.
  const systemParts = call.messages.filter((m) => m.role === "system").map((m) => m.content);
  const nonSystem = call.messages.filter((m) => m.role !== "system");

  const messages = nonSystem.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content
  }));

  if (systemParts.length) {
    const sys = systemParts.join("\n\n");
    if (messages.length && messages[0].role === "user") {
      messages[0].content = `${sys}\n\n${messages[0].content}`;
    } else {
      messages.unshift({ role: "user", content: sys });
    }
  }

  const body: any = {
    model: call.model,
    max_tokens: call.maxTokens ?? 700,
    temperature: call.temperature ?? 0.2,
    messages
  };

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const latencyMs = Date.now() - t0;
  const raw = await safeJson(resp);

  if (!resp.ok) {
    return fail(call, extractError(raw) ?? `Anthropic error (${resp.status})`, latencyMs, resp.status);
  }

  const text = extractAnthropicText(raw) ?? "";
  const usage: LlmUsage | undefined = raw?.usage
    ? {
        inputTokens: raw.usage?.input_tokens,
        outputTokens: raw.usage?.output_tokens
      }
    : undefined;

  return {
    ok: true,
    callId: call.callId,
    provider: "anthropic",
    model: call.model,
    text,
    usage,
    latencyMs
  };
}

function extractAnthropicText(raw: any): string | null {
  // raw.content: [{type:"text", text:"..."}]
  const content = raw?.content;
  if (!Array.isArray(content)) return null;
  const chunks = content
    .filter((c) => c?.type === "text" && typeof c?.text === "string")
    .map((c) => c.text);
  return chunks.length ? chunks.join("") : null;
}

// ---------------------
// Utilities
// ---------------------

function fail(call: LlmCall, error: string, latencyMs: number, status?: number): LlmResult {
  return {
    ok: false,
    callId: call.callId,
    provider: call.provider,
    model: call.model,
    error,
    latencyMs,
    status
  };
}

async function safeJson(resp: Response): Promise<any> {
  const txt = await resp.text();
  try {
    return JSON.parse(txt);
  } catch {
    return { _raw: txt };
  }
}

function extractError(raw: any): string | null {
  // OpenAI often: { error: { message } }
  const m1 = raw?.error?.message;
  if (typeof m1 === "string") return m1;

  // Anthropic often: { error: { message } } or top-level message
  const m2 = raw?.message;
  if (typeof m2 === "string") return m2;

  const fallback = raw?._raw;
  return typeof fallback === "string" ? fallback : null;
}

function safeParseJson(text: string): any | undefined {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}