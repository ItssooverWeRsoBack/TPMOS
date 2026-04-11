# TPMOS — Technical Program Management Operating System

A Linear-quality operating environment for Technical Program Managers and engineering leaders to interview leads, run quarterly planning, model capacity, vote on epics, track execution, and map work to leadership goals.

**Live:** https://tpmos.torfinn.xyz *(after M0.10)*
**Status:** [STATUS.md](./STATUS.md) — current build state, always up to date
**Companion site:** https://torfinn.xyz (Systems Design Interview reference)

## What it does

| For | Value |
|---|---|
| **TPMs** | Land in a new org and become useful in 30 days. Structured lead intake, theme clustering, weekly leadership reports. |
| **Engineering Managers** | Run quarterly planning end-to-end. See what fits in 5 seconds via the above/below-the-line planner. |
| **Engineering ICs** | Vote on epics in 5 minutes. Update status in 30 seconds. |
| **Executives** | Goal coverage map. Cross-team progress. Risk concentration. |

## Stack

- **Frontend:** Next.js 16 (static export) + React 19 + TypeScript + Tailwind v4 + @base-ui/react
- **Backend:** Cloudflare Pages Functions
- **Database:** Cloudflare D1 (SQLite at the edge)
- **Auth:** Cloudflare Access (production) + signed dev cookie (local)
- **AI:** Cloudflare Workers AI (default, free) → Anthropic Claude Haiku via env var
- **Drag & drop:** dnd-kit
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod
- **Server state:** TanStack Query

See [`docs/ARD.md`](docs/ARD.md) for full architecture rationale.

## Quick start

```bash
git clone https://github.com/ItssooverWeRsoBack/TPMOS.git
cd TPMOS
npm install

# Local D1 database
wrangler d1 create tpmos-local
npm run db:migrate:local
npm run db:seed:local

# Dev (UI only, mock API)
npm run dev

# Dev (full stack with Pages Functions + D1)
npm run build && npm run pages:dev
```

Full setup in [`docs/DEV.md`](docs/DEV.md).

## Documentation

| Doc | Purpose |
|---|---|
| [`STATUS.md`](STATUS.md) | **Read first.** Current build state. |
| [`docs/AGENTS.md`](docs/AGENTS.md) | Briefing for LLM sessions picking up the project |
| [`docs/PRD.md`](docs/PRD.md) | Product Requirements |
| [`docs/ARD.md`](docs/ARD.md) | Architecture Requirements |
| [`docs/IMPLEMENTATION_PLAN_MVP.md`](docs/IMPLEMENTATION_PLAN_MVP.md) | MVP build plan with milestones M0–M11 |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Append-only architecture decision log |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | D1 schema with rationale |
| [`docs/AI_INTEGRATION.md`](docs/AI_INTEGRATION.md) | LLM provider abstraction + AI hook spec |
| [`docs/DEV.md`](docs/DEV.md) | Local development setup |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Production deployment guide |

## License

Personal project. License TBD.
