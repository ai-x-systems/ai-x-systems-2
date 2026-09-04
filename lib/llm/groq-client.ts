import "server-only";

/**
 * lib/llm/groq-client.ts
 * ------------------------------------------------------------------------
 * THE single entry point for every LLM request in this project. No other
 * file should call an LLM provider directly.
 *
 * MODEL: configurable via GROQ_MODEL env var, defaulting to
 * "openai/gpt-oss-120b" — Groq's own documented replacement for the
 * deprecated llama-3.3-70b-versatile (fully decommissioned as of this
 * fix; requests to it now 404 with "model_not_found"). Making this an
 * env var, not just a hardcoded string, means a future Groq deprecation
 * can be worked around with a Vercel environment variable change and a
 * redeploy — no code change needed — since this exact failure mode has
 * now happened once for real.
 * ------------------------------------------------------------------------
 */

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export const LLM_DEFAULTS = {
  model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
  temperature: 0.4,
  maxTokens: 1024,
};

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type LlmRole = "system" | "user" | "assistant" | "tool";

export interface LlmToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface LlmMessage {
  role: LlmRole;
  content: string;
  tool_call_id?: string;
  tool_calls?: LlmToolCall[];
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ChatCompletionOptions {
  systemPrompt?: string;
  messages: LlmMessage[];
  tools?: ToolDefinition[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatCompletionSuccess {
  success: true;
  message: {
    role: "assistant";
    content: string;
    toolCalls?: LlmToolCall[];
  };
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export type LlmErrorCode =
  | "missing_api_key"
  | "request_failed"
  | "invalid_response"
  | "unknown";

export interface ChatCompletionFailure {
  success: false;
  error: {
    code: LlmErrorCode;
    message: string;
  };
}

export type ChatCompletionResult = ChatCompletionSuccess | ChatCompletionFailure;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getChatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: {
        code: "missing_api_key",
        message: "The LLM provider is not configured (missing API key).",
      },
    };
  }

  const messages: LlmMessage[] = options.systemPrompt
    ? [{ role: "system", content: options.systemPrompt }, ...options.messages]
    : options.messages;

  try {
    return await callGroq(apiKey, {
      messages,
      tools: options.tools,
      model: options.model ?? LLM_DEFAULTS.model,
      temperature: options.temperature ?? LLM_DEFAULTS.temperature,
      maxTokens: options.maxTokens ?? LLM_DEFAULTS.maxTokens,
    });
  } catch (err) {
    console.error("[llm] unexpected error calling Groq:", err);
    return {
      success: false,
      error: {
        code: "unknown",
        message: "The AI service is temporarily unavailable. Please try again.",
      },
    };
  }
}

// ---------------------------------------------------------------------------
// Groq-specific implementation
// ---------------------------------------------------------------------------

interface CallGroqParams {
  messages: LlmMessage[];
  tools?: ToolDefinition[];
  model: string;
  temperature: number;
  maxTokens: number;
}

async function callGroq(
  apiKey: string,
  { messages, tools, model, temperature, maxTokens }: CallGroqParams
): Promise<ChatCompletionResult> {
  console.log("[GROQ REQUEST]", { model, toolCount: tools?.length ?? 0 });
  const res = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      tools,
      tool_choice: "auto",
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    console.error(`[llm] Groq request failed: ${res.status} ${bodyText}`);
    return {
      success: false,
      error: {
        code: "request_failed",
        message: "The AI service returned an error. Please try again.",
      },
    };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch (err) {
    console.error("[llm] Groq response was not valid JSON:", err);
    return {
      success: false,
      error: { code: "invalid_response", message: "Received an invalid response from the AI service." },
    };
  }

  const parsed = parseGroqResponse(json);
  if (!parsed) {
    console.error("[llm] Groq response did not match expected shape:", json);
    return {
      success: false,
      error: { code: "invalid_response", message: "Received an unexpected response from the AI service." },
    };
  }

  return parsed;
}

function parseGroqResponse(json: unknown): ChatCompletionSuccess | null {
  if (typeof json !== "object" || json === null) return null;
  const choices = (json as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;

  const message = (choices[0] as { message?: unknown }).message;
  if (typeof message !== "object" || message === null) return null;

  const content = (message as { content?: unknown }).content;
  const toolCalls = (message as { tool_calls?: unknown }).tool_calls;

  const usageRaw = (json as { usage?: unknown }).usage;
  const usage =
    typeof usageRaw === "object" && usageRaw !== null
      ? {
          promptTokens: Number((usageRaw as Record<string, unknown>).prompt_tokens ?? 0),
          completionTokens: Number((usageRaw as Record<string, unknown>).completion_tokens ?? 0),
          totalTokens: Number((usageRaw as Record<string, unknown>).total_tokens ?? 0),
        }
      : undefined;

  return {
    success: true,
    message: {
      role: "assistant",
      content: typeof content === "string" ? content : "",
      toolCalls: Array.isArray(toolCalls) ? (toolCalls as LlmToolCall[]) : undefined,
    },
    usage,
  };
}
