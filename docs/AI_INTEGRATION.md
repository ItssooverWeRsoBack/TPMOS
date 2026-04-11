# AI_INTEGRATION.md

> AI hooks in TPMOS are designed to multiply TPM productivity, not replace human judgment. Every AI feature must degrade gracefully to "no AI" when disabled, and human review is required before any AI-generated content is saved.

## Core principles

1. **Human in the loop, always.** AI suggests; human decides. Drafted content is shown with an explicit "Drafted by AI — please review" indicator.
2. **Optional everywhere.** Setting `AI_PROVIDER=none` makes all AI features hide. The product must work fully without AI.
3. **One abstraction layer.** All LLM calls go through `functions/_lib/ai/provider.ts`. Swapping providers is one env var.
4. **Cheap by default.** Free Cloudflare Workers AI is the production default. Anthropic Claude Haiku is the upgrade path.
5. **Never authoritative.** AI never votes, never declares capacity, never sets status. AI only drafts content for humans to review.
6. **Cost-bounded.** Each AI call has a max input token limit. Long inputs are truncated with a warning.
7. **No PII in tests.** Test prompts use synthetic data only.

## Provider abstraction

```ts
// functions/_lib/ai/provider.ts

export interface AIProvider {
  /** Generate text completion. Used for drafting and synthesis. */
  draft(messages: AIMessage[], opts?: AIDraftOptions): Promise<string>;

  /** Generate an embedding vector for similarity/clustering. */
  embed(text: string): Promise<number[]>;

  /** Returns true if this provider is enabled and configured. */
  isAvailable(): boolean;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIDraftOptions {
  maxTokens?: number;       // default 512
  temperature?: number;     // default 0.7
  format?: 'text' | 'json'; // default 'text'
}

export function getProvider(env: Env): AIProvider {
  switch (env.AI_PROVIDER) {
    case 'workers-ai':
      return new WorkersAIProvider(env.AI);
    case 'anthropic':
      return new AnthropicProvider(env.ANTHROPIC_API_KEY);
    case 'none':
    default:
      return new NullProvider();
  }
}
```

### Implementations

- **`WorkersAIProvider`** — uses the `env.AI` binding from `wrangler.toml`. Default model: `@cf/meta/llama-3.1-8b-instruct`. Embedding model: `@cf/baai/bge-base-en-v1.5` (768d).
- **`AnthropicProvider`** — uses `https://api.anthropic.com/v1/messages` with model `claude-haiku-4-5`. Embeddings via Workers AI fallback (Anthropic doesn't ship embeddings).
- **`NullProvider`** — `isAvailable()` returns false; `draft()` and `embed()` throw. Frontend hides AI buttons when `useAIProvider().isAvailable === false`.

## Hook catalog

### Tier 1 — MVP (M9)

#### A1: Epic description + DoD drafting
- **Trigger:** User clicks "Draft with AI" button next to epic title in EpicForm
- **Endpoint:** `POST /api/tpmos/ai/draft-epic`
- **Input:** `{ title: string, teamContext?: string }`
- **Output:** `{ description: string, definitionOfDone: string }`
- **Prompt strategy:** Few-shot system prompt with 3 example (title → description+DoD) pairs. User message contains the title plus optional team context.
- **UX:** Loading spinner ≤3s, then populate the two textareas with editable content. User can accept, edit, or regenerate.
- **Cost:** ~500 input tokens, ~300 output tokens per call. Workers AI: ~1 Neuron. Anthropic Haiku: ~$0.0005.
- **Risk:** Low. Human always reviews. Never auto-saves.

#### A2: Weak DoD lint
- **Trigger:** User saves an epic with a DoD
- **Endpoint:** `POST /api/tpmos/ai/lint-dod`
- **Input:** `{ definitionOfDone: string }`
- **Output:** `{ issues: string[], suggestion?: string }`
- **Strategy:** Two-stage. First a fast regex check for obvious red flags ("ship feature", "complete X", "done when ready", no measurable criteria). Only call LLM if regex finds nothing — LLM checks for specificity and measurability.
- **UX:** Inline badge below the DoD field. Yellow "could be sharper" with expandable suggestions. Non-blocking — user can save anyway.
- **Cost:** Most epics never trigger the LLM call. ~200 input / ~100 output when they do.
- **Risk:** Very low. Suggestion only.

### Tier 2 — MVP (M10)

#### B1: Interview synthesis
- **Trigger:** TPM clicks "Synthesize with AI" on an interview detail page
- **Endpoint:** `POST /api/tpmos/ai/synthesize-interview`
- **Input:** `{ q1_scope, q2_challenges, q3_must_know, q4_blue_sky }`
- **Output:** `{ scopeSummary, topChallenges: string[], suggestedThemes: string[], recommendedActions: string[] }`
- **Strategy:** Single LLM call with structured output (JSON mode). System prompt explains TPM context. User message contains all 4 raw responses.
- **UX:** Side panel populates with the synthesis. TPM can accept tags, edit summary, add to themes. Synthesis is stored in `interviews.ai_synthesis` as JSON.
- **Cost:** ~1500 input / ~500 output tokens. Workers AI: ~3 Neurons. Anthropic: ~$0.002.
- **Risk:** Low. TPM reviews before tagging. Synthesis is a starting point, not a record of fact.

#### B2: Theme clustering
- **Trigger:** TPM opens the Themes view (`/intake/themes`) or after creating a new interview
- **Endpoint:** `POST /api/tpmos/ai/cluster-themes`
- **Input:** Server-side: all interviews for the org
- **Output:** `{ clusters: { label: string, interviewIds: string[], representativeText: string }[] }`
- **Strategy:**
  1. For each interview, embed each response (q1-q4) using `bge-base-en-v1.5`
  2. Run agglomerative clustering with cosine similarity threshold ~0.75
  3. For each cluster, use LLM to generate a canonical theme label and representative summary
  4. Persist clusters as `interview_themes` rows with the embedding stored
- **UX:** Force-directed bubble chart. Clicking a cluster shows the interviews and original text spans.
- **Cost:** Embeddings are nearly free on Workers AI. LLM call only for label generation per cluster.
- **Risk:** Low. Clustering can be re-run anytime; humans can rename or merge themes.

### Tier 3 — Phase 2 / 3 (deferred)

#### B3: Weekly leadership report generation
- Generate a polished narrative report from structured data + last week's snapshot
- Highest-value Phase 2 hook
- **Risk: medium** because the report goes to executives — TPM must explicitly approve before send

#### B4: Goal-to-epic mapping suggestions
- Embed each goal and each epic, find top-K most similar pairs, surface as mapping suggestions
- Reduces manual mapping by ~80%

#### B5: Risk narrative
- Scan at-risk epics + recent status updates, produce "what's slipping and why" narrative with risk-type clustering

#### C1: Estimate sanity-check vs historical similar epics
- Requires multi-quarter history; Phase 3+

#### C3: Standup voice-note → structured epic updates
- Voice → text → structured updates across multiple epics
- Big productivity win, complex UX

#### C4: TPM onboarding briefing from existing org docs
- Ingest Notion/Confluence (requires integrations layer)

#### C6: Vector search across all entities
- Embeddings already exist for interviews; extend to epics in Phase 3

## Where AI is explicitly off-limits

- **Voting.** Humans only. LLM "preferences" would taint the consensus signal.
- **Capacity declarations.** Humans only.
- **Authoritative status updates.** LLM may suggest based on linked tickets (Phase 3 integrations); human always confirms.
- **Permission/role decisions.** Humans only.
- **Auto-sending anything to leadership.** Human approval gate for every report.

## Prompt management

- Prompts live in `functions/_lib/ai/prompts/` as exported TypeScript constants
- Each prompt file has a header with the hook ID, version, and changelog
- Prompts are versioned: bumping a prompt requires a `DEC-XXXX` entry
- A simple eval harness in `functions/_lib/ai/__tests__/` runs prompts against synthetic inputs and asserts on output structure (not content)

Example:

```ts
// functions/_lib/ai/prompts/draft-epic.ts

export const DRAFT_EPIC_PROMPT_V1 = {
  hookId: 'A1',
  version: 1,
  system: `You are a senior engineering program manager helping draft an epic for a quarterly plan. ...`,
  examples: [
    {
      title: 'Migrate auth service to OAuth 2.0',
      description: '...',
      definitionOfDone: '...',
    },
    // ...
  ],
};
```

## Cost guardrails

| Provider | Free tier | MVP daily expected | Action if exceeded |
|---|---|---|---|
| Workers AI | 10,000 Neurons/day | ~100 Neurons (50 epic drafts + 10 interviews) | Negligible — extremely comfortable headroom |
| Anthropic Haiku | none | $0 if not enabled | N/A |

If the project ever ships at scale and uses Anthropic Haiku, expect:
- ~$0.001 per epic draft
- ~$0.002 per interview synthesis
- ~$5/month for an org with 100 active users using AI features daily

## Failure modes and graceful degradation

| Failure | Degradation |
|---|---|
| `AI_PROVIDER=none` | All AI buttons hidden. Manual workflows still work. |
| Workers AI rate limit hit | Show toast: "AI temporarily unavailable, please try again". User can still save manually. |
| Anthropic API timeout | Same toast. Endpoint returns 503. |
| LLM returns malformed JSON | Endpoint returns 502. Frontend shows toast. User can regenerate or write manually. |
| Embedding service down | Theme clustering skipped; raw tag-based grouping used as fallback. |

**Cardinal rule:** AI failure must never block a user from completing their task manually.

## Testing

- Unit tests for the provider abstraction use a `MockProvider` that returns canned responses
- Integration tests for handlers mock the provider entirely
- No real LLM calls in CI (cost + flakiness)
- A separate `npm run ai:eval` task (not in CI) runs synthetic eval scenarios against a real provider, gated by `AI_EVAL=true` env var
