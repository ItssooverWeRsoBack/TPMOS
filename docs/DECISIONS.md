# DECISIONS.md

> Append-only architecture decision log. Each entry has an immutable ID. Decisions can be superseded by later entries but not edited or deleted.

**Format for new entries:**
```
## DEC-NNNN — Title
**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Superseded by DEC-XXXX
**Context:** What problem are we solving?
**Decision:** What did we decide?
**Consequences:** What are the downstream effects, good and bad?
**Reversibility:** High | Medium | Low — how hard is this to undo?
```

---

## DEC-0001 — Build TPMOS as a separate product from the existing concept site
**Date:** 2026-04-10
**Status:** Accepted
**Context:** The owner has an existing Cloudflare-deployed Next.js site (`systems-design-interview` repo, served at `torfinn.xyz`) that is a static content site for systems design interview prep. TPMOS is fundamentally different: an authenticated multi-user app with database, drag-and-drop, charts, and AI integration.
**Decision:** Build TPMOS as a distinct product. The two share a domain but are different things conceptually.
**Consequences:** TPMOS gets its own brand and IA freedom. Owner can position the two as separate products on the same personal domain.
**Reversibility:** High at this stage — no code committed yet.

---

## DEC-0002 — Static SPA + Cloudflare Pages Functions architecture
**Date:** 2026-04-10
**Status:** Accepted
**Context:** The existing concept site uses `output: "export"` in `next.config.ts`. CLAUDE.md flags it as protected. We need a backend with database for TPMOS but cannot remove static export from the concept site.
**Decision:** TPMOS is built as a static SPA (also `output: "export"`) plus Cloudflare Pages Functions in a `functions/` directory. Pages Functions coexist natively with static assets in Cloudflare Pages and provide Workers-style request handlers without ejecting from static export.
**Consequences:**
- TPMOS pages have no SSR — slightly slower first paint, fine for an authenticated app
- One deploy pipeline (Cloudflare Pages auto-builds both static and functions)
- Native D1 binding via wrangler
- Easier local dev via `wrangler pages dev`
**Reversibility:** Medium — could move to full SSR via @opennextjs/cloudflare later if SEO becomes a concern, but TPMOS is auth-gated so SEO is moot.

---

## DEC-0003 — Modular monolith on Pages Functions, NOT k8s microservices
**Date:** 2026-04-10
**Status:** Accepted
**Context:** Original brief mentioned "k8s microservices" for backend. At MVP scale (~5–50 users) and post-MVP target (~1000 users), microservices are 100x operational overhead for zero benefit. A single Worker handles 10K+ RPS comfortably.
**Decision:** Implement as a modular monolith — single Pages Functions project with strict domain folder boundaries (`functions/_lib/domain/{teams,quarters,epics,voting,capacity,auth}/`). Future microservice extraction is a copy-paste of any folder if it ever becomes warranted.
**Consequences:**
- Massively lower ops cost
- Faster MVP delivery
- Domain boundaries inside the monolith mean extraction is cheap if needed
- Loses microservice resume bling — explicit pushback on the original brief, accepted by owner
**Reversibility:** High — domain folders are extraction-ready by design.

---

## DEC-0004 — Cloudflare Access for production auth, signed dev cookie for local
**Date:** 2026-04-10
**Status:** Accepted
**Context:** Need authentication for a multi-user app with a free demo target. Options compared: Cloudflare Access, Lucia, Auth.js, WorkOS, Clerk, magic links via Resend.
**Decision:** Use Cloudflare Access in production. Free up to 50 users. Zero auth code — Pages Functions read `Cf-Access-Authenticated-User-Email`. For local development, a signed HMAC cookie via `/api/tpmos/dev/login`. The dev route is hard-gated by `env.ENV === 'local'` (the repo is public, so this gate is critical).
**Consequences:**
- Zero lines of production auth code
- Free for demo
- Cost ramps at 50+ users (Cloudflare Zero Trust ~$3/user/month) — migration to magic-link via Resend is a single-file change in `_middleware.ts`
**Reversibility:** High — single file controls auth boundary.

---

## DEC-0005 — Cloudflare D1 (SQLite) for MVP
**Date:** 2026-04-10
**Status:** Accepted
**Context:** Need a database that is free, edge-fit, has good local dev, and supports relational modeling. Options compared: D1, Turso, Supabase, Neon, KV, SQLite file.
**Decision:** Cloudflare D1. Native binding to Pages Functions, free tier of 5GB storage / 5M reads-day / 100K writes-day, schema migrations via wrangler, excellent local dev via wrangler.
**Consequences:**
- $0 demo cost
- Single-region writes (D1 has read replicas; writes go to one region)
- No JSONB, no full-text search, no extensions
- Schema-portable SQL allows migration to Turso or Postgres-via-Hyperdrive if D1 limits become real
**Reversibility:** Medium — schema is portable, but query layer would need a small rewrite for Postgres.

---

## DEC-0006 — Separate repo at `~/src/TPMOS/`, deployed to `tpmos.torfinn.xyz`
**Date:** 2026-04-10
**Status:** Accepted (supersedes earlier colocation plan)
**Context:** Initial recommendation was to colocate TPMOS routes inside the existing concept site repo. Owner challenged this. After further analysis, separation is cleaner because: (1) different dependency profiles, (2) different iteration cadences, (3) avoids touching CLAUDE.md-protected files, (4) cleaner auth scoping at subdomain level, (5) future stack flexibility.
**Decision:** TPMOS lives at `~/src/TPMOS/` as its own repo, deployed as its own Cloudflare Pages project on `tpmos.torfinn.xyz`. The concept site gets a single sidebar nav link to TPMOS in M1.10.
**Consequences:**
- Two repos to manage (acceptable for one author)
- Two Cloudflare Pages projects
- Brand consistency via copy-pasted design tokens (acceptable until a `@torfinn/design-tokens` package is warranted)
- Concept site stays a pure static export forever
**Reversibility:** Medium — could merge later but no plausible reason to.

---

## DEC-0007 — Use dnd-kit for drag-and-drop
**Date:** 2026-04-10
**Status:** Accepted
**Context:** Need drag-and-drop for the above/below-the-line planner. react-beautiful-dnd is unmaintained and incompatible with React 19.
**Decision:** dnd-kit (@dnd-kit/core + @dnd-kit/sortable + @dnd-kit/utilities). Headless, accessible, React 19 compatible.
**Consequences:** Slightly more boilerplate than higher-level libraries, but full visual control matches the Linear-like brand requirement. Verified compat in M6.1 spike.
**Reversibility:** Medium — dnd layer is one component (`planner-board.tsx`).

---

## DEC-0008 — Pull TPM Intake into MVP because B1+B2 AI hooks add high value there
**Date:** 2026-04-11
**Status:** Accepted
**Context:** Initial MVP scope deferred TPM Intake to Phase 2. Owner approved expanding AI scope from A1+A2 (epic drafting + DoD lint) to A1+A2+B1+B2 (also interview synthesis + theme clustering). B1+B2 only make sense if interviews exist.
**Decision:** TPM Intake (surface 11) becomes a functional MVP surface, not a placeholder. Implemented in M10.
**Consequences:**
- 11 functional surfaces in MVP instead of 10
- One additional milestone of work (M10)
- AI value is concentrated where it matters most (interview workflows)
**Reversibility:** High — could revert to placeholder if scope pressure mounts.

---

## DEC-0009 — Scaffold all 15 surfaces in MVP; 11 functional + 4 placeholders
**Date:** 2026-04-11
**Status:** Accepted
**Context:** Owner wants the full information architecture present from day 1, with deferred surfaces as well-designed placeholders that link to PRD specs and a tracking issue. This locks the IA and makes Phase 2 a fill-in-pages exercise rather than an add-nav-items exercise.
**Decision:** Scaffold all 15 routes in M1. Build 11 functional through M10. Render placeholders for surfaces 8 (Goals), 9 (Initiatives), 10 (Visualizer), 12 (Reporting) using a `<PlaceholderSurface>` component with PRD links and a "Coming in Phase 2" badge.
**Consequences:**
- IA locked from MVP, predictable for users
- Phase 2 work is more contained
- Slightly more M1 work (15 routes vs 11)
**Reversibility:** High — placeholders are trivial to upgrade to functional pages.

---

## DEC-0010 — Workers AI as default LLM provider, Anthropic Claude Haiku via env-var swap
**Date:** 2026-04-11
**Status:** Accepted
**Context:** Need an AI provider for epic drafting, DoD lint, interview synthesis, and theme clustering. Options: Cloudflare Workers AI (free tier), Anthropic Claude API (paid, higher quality), OpenAI (paid).
**Decision:** Build a provider abstraction in `functions/_lib/ai/provider.ts` that supports `workers-ai`, `anthropic`, and `none`. Default to `workers-ai` (Llama 3.1 8B Instruct + bge-base-en for embeddings) for $0 demo. Production swap to Claude Haiku via `AI_PROVIDER=anthropic` env var. All AI features must hide gracefully when `AI_PROVIDER=none`.
**Consequences:**
- $0 to ship MVP demo
- Quality upgrade is one env var change
- AI features are gracefully optional, never required for core functionality
**Reversibility:** High — provider abstraction makes swapping trivial.

---

## DEC-0011 — Public GitHub repo, hard-gated dev login route
**Date:** 2026-04-11
**Status:** Accepted
**Context:** The repo at `ItssooverWeRsoBack/TPMOS` is public. The dev login route (`/api/tpmos/dev/login`) bypasses Cloudflare Access for local development. If this route were accessible in production, it would be an auth bypass.
**Decision:** The dev login route MUST check `env.ENV !== 'local'` and return 404 in production. This is enforced in code, not just by configuration. CI must verify the gate is present. Documented prominently in `AGENTS.md`.
**Consequences:**
- Public repo is safe
- Local dev remains frictionless
- Any future LLM session must respect this gate
**Reversibility:** High — gate is one line of code.
**Reversibility:** High — gate is one line of code.

---

## DEC-0014 — Flat routes with query params, no dynamic [slug] segments
**Date:** 2026-04-13
**Status:** Accepted
**Context:** Next.js `output: "export"` requires `generateStaticParams()` for dynamic `[slug]` routes. TPMOS slugs come from a D1 database that doesn't exist at build time, making static generation impossible. Options: (1) flatten routes and use query params, (2) add SPA fallback routing on Cloudflare, (3) eject from static export.
**Decision:** Flatten all routes. Remove `[slug]`, `[epicId]`, `[interviewId]`, `[goalId]` path segments. Use query params (`?team=slug&quarter=id`) for dynamic context. Team/epic/interview detail views render as sliding panels within their parent page (Linear-style), not as separate routes.
**Consequences:**
- All 17 routes are statically exportable — build passes cleanly
- URL structure is `/plan?team=platform&quarter=2026Q2` instead of `/teams/platform/plan`
- Detail views are panel-based (actually better UX — stays in context)
- No SPA fallback routing needed on Cloudflare
- Phase 2 could optionally re-add path segments via SSR migration, but likely unnecessary
**Reversibility:** Medium — route structure is set early, but the components are the same either way.
