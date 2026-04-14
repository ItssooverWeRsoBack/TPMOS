/**
 * AI provider abstraction — single interface, multiple implementations.
 * Swap providers via AI_PROVIDER env var: "workers-ai" | "anthropic" | "none"
 */

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIDraftOptions {
  maxTokens?: number;
  temperature?: number;
}

export interface AIProvider {
  draft(messages: AIMessage[], opts?: AIDraftOptions): Promise<string>;
  isAvailable(): boolean;
}

export function getProvider(env: {
  AI_PROVIDER: string;
  AI?: unknown;
  ANTHROPIC_API_KEY?: string;
}): AIProvider {
  switch (env.AI_PROVIDER) {
    case "workers-ai":
      return new WorkersAIProvider(env.AI);
    case "anthropic":
      return new AnthropicProvider(env.ANTHROPIC_API_KEY);
    case "none":
    default:
      return new NullProvider();
  }
}

class WorkersAIProvider implements AIProvider {
  constructor(private ai: unknown) {}

  isAvailable(): boolean {
    return !!this.ai;
  }

  async draft(messages: AIMessage[], opts?: AIDraftOptions): Promise<string> {
    if (!this.ai) throw new Error("Workers AI binding not available");

    // @ts-expect-error — AI binding is untyped in the shared context
    const result = await this.ai.run("@cf/meta/llama-3.1-8b-instruct", {
      messages,
      max_tokens: opts?.maxTokens ?? 512,
      temperature: opts?.temperature ?? 0.7,
    });

    return result?.response ?? "";
  }
}

class AnthropicProvider implements AIProvider {
  constructor(private apiKey: string | undefined) {}

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async draft(messages: AIMessage[], opts?: AIDraftOptions): Promise<string> {
    if (!this.apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    const systemMsg = messages.find((m) => m.role === "system")?.content ?? "";
    const userMsgs = messages.filter((m) => m.role !== "system");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: opts?.maxTokens ?? 512,
        system: systemMsg,
        messages: userMsgs.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error: ${res.status} ${err}`);
    }

    const body = (await res.json()) as { content: { text: string }[] };
    return body.content?.[0]?.text ?? "";
  }
}

class NullProvider implements AIProvider {
  isAvailable(): boolean {
    return false;
  }

  async draft(): Promise<string> {
    throw new Error("AI is disabled (AI_PROVIDER=none)");
  }
}
