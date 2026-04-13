# API_DESIGN.md — TPMOS API Design Rationale

**Version:** 1.0
**Status:** Active for MVP
**Last updated:** 2026-04-13

> This document is a first-class design artifact alongside [PRD.md](PRD.md) and [ARD.md](ARD.md). It explains **why** the API is shaped the way it is, not just what the endpoints are. Changes to the API contract require a `DEC-XXXX` entry in [DECISIONS.md](DECISIONS.md).

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        tpmos.torfinn.xyz                         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   Cloudflare Access                          │ │
│  │     (JWT verification · Google/GitHub/OTP identity)          │ │
│  └────────────────────────┬────────────────────────────────────┘ │
│                           │                                      │
│           ┌───────────────┴───────────────┐                      │
│           │                               │                      │
│           ▼                               ▼                      │
│  ┌─────────────────┐           ┌────────────────────────┐        │
│  │  Static Assets   │           │   Pages Functions       │        │
│  │  (Next.js /out)  │           │   (functions/api/tpmos)  │        │
│  │                  │           │                          │        │
│  │  SPA shell       │  fetch()  │  _middleware.ts          │        │
│  │  React 19        │ ───────► │    ↓ auth + user lookup  │        │
│  │  TanStack Query  │  JSON    │  Route handlers          │        │
│  │                  │ ◄─────── │    ↓ can() authz check   │        │
│  └─────────────────┘           │  D1 prepared statements  │        │
│                                │    ↓                      │        │
│                                │  ┌─────────┐ ┌────────┐ │        │
│                                │  │   D1    │ │ AI     │ │        │
│                                │  │ (SQLite)│ │(Workers│ │        │
│                                │  │         │ │  AI)   │ │        │
│                                │  └─────────┘ └────────┘ │        │
│                                └────────────────────────────┘        │
└──────────────────────────────────────────────────────────────────┘
```

## Request flow (every API call)

```
Client (React)
  │
  │ 1. fetch("/api/tpmos/epics", { headers: { "If-Match": "3" } })
  │    Cookie: CF_Authorization=<jwt>
  │
  ▼
Cloudflare Access
  │
  │ 2. Validates JWT, injects Cf-Access-Authenticated-User-Email header
  │
  ▼
_middleware.ts
  │
  │ 3. Reads email from header (prod) or HMAC cookie (dev)
  │ 4. SELECT * FROM users WHERE email = ?
  │ 5. Attaches user to context.data.user
  │ 6. Rejects with 401 if user not found or role = 'pending'
  │
  ▼
Route handler (e.g., functions/api/tpmos/epics/index.ts)
  │
  │ 7. Parses body with Zod schema (shared with client)
  │ 8. Calls can(user, 'createEpic', { teamId }) → 403 if denied
  │ 9. Executes D1 prepared statement
  │ 10. Returns JSON response with appropriate status code
  │
  ▼
Client (TanStack Query)
  │
  │ 11. Receives typed response
  │ 12. Invalidates relevant query keys
  │ 13. Updates UI optimistically
```

---

## Why REST over tRPC, GraphQL, or RPC

This is a real design decision that warrants explicit justification.

### Options evaluated

| Approach | Pros | Cons | Fit for TPMOS |
|---|---|---|---|
| **REST (JSON)** | Universal, debuggable with curl, cacheable, stateless, zero build tooling | Overfetching, no type safety across the wire without effort, multiple round-trips | **Best fit** |
| **tRPC** | End-to-end type safety, zero code duplication, great DX | Requires a compatible server runtime; static export complicates setup; debugging is harder (binary protocol); tight coupling to TypeScript ecosystem | Rejected for MVP |
| **GraphQL** | Flexible queries, avoid overfetching, strong typing via schema | Massive overhead for 24 endpoints; caching is hard; N+1 problems; needs a gateway | Grossly over-engineered |
| **Cloudflare RPC** | Native for Workers Service Bindings | Only works between Workers; no client-side support | Wrong layer |

### Why REST wins here

1. **Cloudflare Pages Functions are HTTP handlers.** They receive a `Request` and return a `Response`. REST is their native language. tRPC or GraphQL would add a translation layer that serves no purpose.

2. **Static export means no server-side tRPC router.** tRPC needs a server-side router to generate type-safe client hooks. With `output: "export"`, there's no Next.js server to host it. We'd need a separate tRPC server — which is just REST with extra steps.

3. **Debugging with curl.** When a production issue surfaces, `curl -H "Cookie: ..." https://tpmos.torfinn.xyz/api/tpmos/epics?team=platform&quarter=2026Q2` gives you the answer in seconds. tRPC requires decoding an encoded procedure call. GraphQL requires constructing a query. REST is immediately legible.

4. **24 endpoints don't need GraphQL.** GraphQL solves a problem we don't have: deep, nested, variable-shape queries across many entities. TPMOS has flat, predictable queries. Each endpoint returns exactly what the UI needs because we control both sides.

5. **Type safety is solved at the boundary.** Shared Zod schemas between client and server give us validation at both ends. The client API wrapper (`src/lib/tpmos/api/epics.ts`) returns `Promise<Epic[]>` — fully typed. The handler parses input with the same Zod schema. This is the same type safety tRPC provides, achieved with ~10 lines of Zod per endpoint instead of a framework.

6. **Cacheability.** GET requests are naturally cacheable. TanStack Query handles client-side stale-while-revalidate. Future CDN caching for read-heavy endpoints (team lists, quarter metadata) is trivial with REST, hard with tRPC or GraphQL.

**DEC-0012: REST chosen over tRPC and GraphQL for API design. Justified by static-export constraint, Pages Functions HTTP-native model, debuggability, and the absence of a flexible-query problem that GraphQL would solve.**

---

## API design principles

### 1. Resource-oriented URLs

```
/api/tpmos/teams                    ← collection
/api/tpmos/teams/:id                ← instance
/api/tpmos/teams/:id/members        ← sub-resource
/api/tpmos/epics/:id/votes          ← sub-resource
```

URLs name **nouns** (resources), not verbs. The HTTP method supplies the verb:

| Method | Meaning | Idempotent | Safe |
|---|---|---|---|
| GET | Read | Yes | Yes |
| POST | Create (or action) | No | No |
| PATCH | Partial update | Yes* | No |
| PUT | Full replace (upsert) | Yes | No |
| DELETE | Remove / archive | Yes | No |

*PATCH is idempotent when combined with `If-Match` versioning.

**Exception: action endpoints** that don't fit CRUD use POST with a verb-noun path:

```
POST /api/tpmos/quarters/:id/lock
POST /api/tpmos/quarters/:id/close
POST /api/tpmos/quarters/:id/carry-forward
POST /api/tpmos/epics/reorder
POST /api/tpmos/ai/draft-epic
```

These are RPC-style operations on a resource, not resource creation. They use POST because they're not idempotent and have side effects.

### 2. Shared Zod schemas as the contract

```ts
// src/lib/tpmos/schemas/epic.ts — imported by BOTH client and server

import { z } from "zod";

export const CreateEpicSchema = z.object({
  teamId: z.string(),
  quarterId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  definitionOfDone: z.string().optional(),
  driUserId: z.string().optional(),
  driCommittedWeeks: z.number().min(0).default(0),
});

export type CreateEpicInput = z.infer<typeof CreateEpicSchema>;
```

**Client uses it** in the API wrapper:
```ts
// src/lib/tpmos/api/epics.ts
export async function createEpic(input: CreateEpicInput): Promise<Epic> {
  const body = CreateEpicSchema.parse(input); // validates before sending
  const res = await fetch("/api/tpmos/epics", { method: "POST", body: JSON.stringify(body) });
  // ...
}
```

**Server uses it** in the handler:
```ts
// functions/api/tpmos/epics/index.ts
const body = CreateEpicSchema.safeParse(await request.json());
if (!body.success) return Response.json({ error: body.error.flatten() }, { status: 400 });
```

This eliminates the "API contract drift" problem without tRPC's machinery.

### 3. Optimistic concurrency via `version` + `If-Match`

Every mutable entity has a `version INTEGER` column that increments on every write. Clients send the current version in the `If-Match` header:

```
PATCH /api/tpmos/epics/abc123
If-Match: 3
Content-Type: application/json

{ "title": "Updated title" }
```

Server response:

- **200 OK** — update succeeded, response includes `version: 4`
- **409 Conflict** — version mismatch, response includes the current entity state so the client can resolve

```json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "Entity was modified by another user",
    "currentVersion": 5,
    "currentState": { ... }
  }
}
```

**Why not last-write-wins?** For epics and capacity plans, two users editing the same entity simultaneously would silently overwrite each other's changes. In a TPM tool where the EM and an IC might both be editing epic descriptions during planning, silent overwrites destroy trust. The 409 response gives the client a chance to show a merge dialog or retry.

**Why not full CRDTs or OT?** Overkill for the write frequency of a quarterly planning tool (~dozens of edits per day, not per second). Version-based optimistic concurrency is the right point on the complexity spectrum.

### 4. Consistent error shape

Every error response follows the same shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": {}
  }
}
```

Error codes are a closed enum:

| Code | HTTP Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body failed Zod parse |
| `UNAUTHORIZED` | 401 | No valid auth token |
| `FORBIDDEN` | 403 | `can()` check failed |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `VERSION_CONFLICT` | 409 | `If-Match` version mismatch |
| `QUARTER_LOCKED` | 409 | Attempting to mutate a closed quarter |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `AI_UNAVAILABLE` | 503 | AI provider failed or disabled |

The client API layer (`src/lib/tpmos/api/`) has a single `handleResponse<T>(res: Response): Promise<T>` helper that parses success or throws a typed `ApiError` with code and details.

### 5. Query parameter conventions for filtering

```
GET /api/tpmos/epics?team=platform&quarter=default:2026Q2&status=at_risk
GET /api/tpmos/risks?org=current
GET /api/tpmos/admin/users?role=pending
```

- Filter keys are entity field names (snake_case)
- Multiple values for the same key are comma-separated: `?status=at_risk,blocked`
- No pagination in MVP (max ~100 epics per team per quarter). Phase 2 adds `?cursor=` + `?limit=` if needed.
- Sorting: `?sort=wsjf_desc` or `?sort=sort_order_asc` (default varies by endpoint)

### 6. Bulk operations are explicit, not implicit

Two endpoints accept bulk input:

```
POST /api/tpmos/epics/reorder
{
  "epicIds": ["abc", "def", "ghi"],   // ordered array = new sort order
  "quarterId": "default:2026Q2"
}

POST /api/tpmos/quarters/:id/carry-forward
{
  "epicIds": ["abc", "def"]            // which epics to carry forward
}
```

**Why explicit bulk endpoints instead of individual PATCH calls?**

1. **Atomicity.** Reordering 10 epics must be one atomic operation, not 10 individual updates that could partially fail and leave sort_order in an inconsistent state.
2. **Performance.** One D1 batch write is ~3ms. Ten sequential writes are ~30ms. For drag-and-drop that needs to feel instant, this matters.
3. **Simplicity.** The client sends the desired end-state (ordered array), not a series of deltas. Less error-prone.

---

## Endpoint catalog

### Core CRUD resources

```
┌─────────────────────────────────────┬────────┬──────┬──────────────────────────┐
│ Endpoint                            │ Method │ Auth │ Purpose                  │
├─────────────────────────────────────┼────────┼──────┼──────────────────────────┤
│ /api/tpmos/me                       │ GET    │ any  │ Current user + role       │
│ /api/tpmos/dev/login                │ POST   │ none │ Dev-only auth (gated)     │
├─────────────────────────────────────┼────────┼──────┼──────────────────────────┤
│ /api/tpmos/teams                    │ GET    │ any  │ List teams                │
│ /api/tpmos/teams                    │ POST   │ tpm+ │ Create team               │
│ /api/tpmos/teams/:id                │ GET    │ any  │ Team detail               │
│ /api/tpmos/teams/:id                │ PATCH  │ own+ │ Edit team                 │
│ /api/tpmos/teams/:id                │ DELETE │ tpm+ │ Archive team              │
│ /api/tpmos/teams/:id/members        │ GET    │ any  │ List members              │
│ /api/tpmos/teams/:id/members        │ POST   │ own+ │ Add member                │
│ /api/tpmos/teams/:id/members/:uid   │ DELETE │ own+ │ Remove member             │
├─────────────────────────────────────┼────────┼──────┼──────────────────────────┤
│ /api/tpmos/quarters                 │ GET    │ any  │ List quarters             │
│ /api/tpmos/quarters                 │ POST   │ tpm+ │ Create next quarter       │
│ /api/tpmos/quarters/:id             │ GET    │ any  │ Quarter detail            │
├─────────────────────────────────────┼────────┼──────┼──────────────────────────┤
│ /api/tpmos/capacity/:tid/:qid       │ GET    │ any  │ Read capacity plan        │
│ /api/tpmos/capacity/:tid/:qid       │ PUT    │ own+ │ Upsert capacity plan      │
├─────────────────────────────────────┼────────┼──────┼──────────────────────────┤
│ /api/tpmos/epics                    │ GET    │ any  │ List epics (filterable)   │
│ /api/tpmos/epics                    │ POST   │ own+ │ Create epic               │
│ /api/tpmos/epics/:id                │ GET    │ any  │ Epic detail               │
│ /api/tpmos/epics/:id                │ PATCH  │ own+ │ Edit epic                 │
│ /api/tpmos/epics/:id                │ DELETE │ own+ │ Delete epic               │
│ /api/tpmos/epics/:id/votes          │ POST   │ own+ │ Cast/update vote          │
│ /api/tpmos/epics/:id/status         │ POST   │ own+ │ Update status + %         │
├─────────────────────────────────────┼────────┼──────┼──────────────────────────┤
│ /api/tpmos/risks                    │ GET    │ tpm+ │ Cross-team risk feed      │
├─────────────────────────────────────┼────────┼──────┼──────────────────────────┤
│ /api/tpmos/interviews               │ GET    │ tpm+ │ List interviews           │
│ /api/tpmos/interviews               │ POST   │ tpm+ │ Create interview          │
│ /api/tpmos/interviews/:id           │ GET    │ tpm+ │ Interview detail          │
│ /api/tpmos/interviews/:id           │ PATCH  │ tpm+ │ Edit interview            │
│ /api/tpmos/interview-themes         │ GET    │ tpm+ │ List themes               │
│ /api/tpmos/interview-themes         │ POST   │ tpm+ │ Create theme              │
├─────────────────────────────────────┼────────┼──────┼──────────────────────────┤
│ /api/tpmos/admin/users              │ GET    │ admin│ List all users            │
│ /api/tpmos/admin/users              │ PATCH  │ admin│ Update user role          │
└─────────────────────────────────────┴────────┴──────┴──────────────────────────┘
```

### Action endpoints (not CRUD)

```
┌─────────────────────────────────────────────┬────────┬──────┬──────────────────────────────┐
│ Endpoint                                    │ Method │ Auth │ Purpose                      │
├─────────────────────────────────────────────┼────────┼──────┼──────────────────────────────┤
│ /api/tpmos/quarters/:id/lock                │ POST   │ own+ │ Lock plan for active quarter  │
│ /api/tpmos/quarters/:id/close               │ POST   │ tpm+ │ Close quarter (read-only)     │
│ /api/tpmos/quarters/:id/carry-forward       │ POST   │ own+ │ Bulk carry-forward epics      │
│ /api/tpmos/epics/reorder                    │ POST   │ own+ │ Bulk reorder (planner drag)   │
├─────────────────────────────────────────────┼────────┼──────┼──────────────────────────────┤
│ /api/tpmos/ai/draft-epic                    │ POST   │ any  │ AI: draft description + DoD   │
│ /api/tpmos/ai/lint-dod                      │ POST   │ any  │ AI: lint weak DoDs            │
│ /api/tpmos/ai/synthesize-interview          │ POST   │ tpm+ │ AI: extract themes from notes │
│ /api/tpmos/ai/cluster-themes               │ POST   │ tpm+ │ AI: cluster themes by embed   │
└─────────────────────────────────────────────┴────────┴──────┴──────────────────────────────┘
```

**Auth legend:** `any` = any authenticated user; `own+` = own team + TPM + admin; `tpm+` = TPM + admin; `admin` = admin only.

---

## Request/response contract examples

### Create an epic

```http
POST /api/tpmos/epics
Content-Type: application/json

{
  "teamId": "team-platform",
  "quarterId": "default:2026Q2",
  "title": "Migrate auth to OAuth 2.0",
  "description": "Replace legacy session tokens with...",
  "definitionOfDone": "All services authenticate via OAuth...",
  "driUserId": null,
  "driCommittedWeeks": 4
}
```

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "epic-a1b2c3d4",
  "teamId": "team-platform",
  "quarterId": "default:2026Q2",
  "title": "Migrate auth to OAuth 2.0",
  "description": "Replace legacy session tokens with...",
  "definitionOfDone": "All services authenticate via OAuth...",
  "driUserId": null,
  "driCommittedWeeks": 4,
  "status": "not_started",
  "percentComplete": 0,
  "atRisk": false,
  "sortOrder": 1000,
  "carriedFromEpicId": null,
  "createdAt": "2026-04-13T18:30:00Z",
  "updatedAt": "2026-04-13T18:30:00Z",
  "createdBy": "user-tpm1",
  "updatedBy": "user-tpm1",
  "version": 1
}
```

### Cast a vote

```http
POST /api/tpmos/epics/epic-a1b2c3d4/votes
Content-Type: application/json

{
  "value": 8,
  "timeCriticality": 6,
  "riskReduction": 9,
  "durationEstimateWeeks": 5
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "epicId": "epic-a1b2c3d4",
  "userId": "user-ic1",
  "value": 8,
  "timeCriticality": 6,
  "riskReduction": 9,
  "durationEstimateWeeks": 5,
  "updatedAt": "2026-04-13T18:31:00Z",
  "aggregates": {
    "voteCount": 4,
    "avgValue": 7.25,
    "avgCriticality": 6.5,
    "avgRiskReduction": 7.75,
    "avgDurationEstimate": 4.5,
    "wsjf": 5.375,
    "varianceValue": 1.2,
    "varianceCriticality": 2.1,
    "varianceRiskReduction": 0.8
  }
}
```

Vote responses include the running aggregates so the UI can update immediately without a separate fetch.

### Reorder epics (planner drag)

```http
POST /api/tpmos/epics/reorder
Content-Type: application/json

{
  "quarterId": "default:2026Q2",
  "teamId": "team-platform",
  "epicIds": ["epic-3", "epic-1", "epic-5", "epic-2", "epic-4"]
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "reordered": 5,
  "aboveLineCount": 3,
  "belowLineCount": 2,
  "cumulativeWeeks": [4, 7, 12, 16, 20],
  "availableWeeks": 14
}
```

The response includes the computed line position so the client can verify its local state matches the server's.

### Version conflict (409)

```http
PATCH /api/tpmos/epics/epic-a1b2c3d4
If-Match: 3
Content-Type: application/json

{ "title": "Updated title" }
```

```http
HTTP/1.1 409 Conflict
Content-Type: application/json

{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "Epic was modified by user-em1 at 2026-04-13T18:32:00Z",
    "currentVersion": 5,
    "currentState": {
      "id": "epic-a1b2c3d4",
      "title": "Different title set by someone else",
      "version": 5
    }
  }
}
```

---

## Handler anatomy

Every handler follows this exact pattern:

```ts
// functions/api/tpmos/epics/[epicId].ts

import { CreateEpicSchema, UpdateEpicSchema } from "@/lib/tpmos/schemas/epic";
import { can } from "../../_lib/auth/can";
import { getEpicById, updateEpic } from "../../_lib/db/queries/epics";

interface Env {
  DB: D1Database;
  AI: Ai;
  ENV: string;
  AI_PROVIDER: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const user = context.data.user;          // set by _middleware.ts
  const epicId = context.params.epicId as string;

  const epic = await getEpicById(context.env.DB, epicId);
  if (!epic) return Response.json({ error: { code: "NOT_FOUND" } }, { status: 404 });

  return Response.json(epic);
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const user = context.data.user;
  const epicId = context.params.epicId as string;

  // 1. Parse
  const body = UpdateEpicSchema.safeParse(await context.request.json());
  if (!body.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", details: body.error.flatten() } },
      { status: 400 }
    );
  }

  // 2. Load + check exists
  const epic = await getEpicById(context.env.DB, epicId);
  if (!epic) return Response.json({ error: { code: "NOT_FOUND" } }, { status: 404 });

  // 3. Authorize
  if (!can(user, "editEpic", { teamId: epic.teamId })) {
    return Response.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
  }

  // 4. Version check
  const ifMatch = context.request.headers.get("If-Match");
  if (ifMatch && Number(ifMatch) !== epic.version) {
    return Response.json(
      { error: { code: "VERSION_CONFLICT", currentVersion: epic.version, currentState: epic } },
      { status: 409 }
    );
  }

  // 5. Write
  const updated = await updateEpic(context.env.DB, epicId, body.data, user.id);

  // 6. Return
  return Response.json(updated);
};
```

**Rules enforced by code review and AGENTS.md:**
- Handlers ≤ 80 lines
- No raw SQL — only prepared statements via query helpers
- No business logic in handlers — extract to `functions/_lib/domain/`
- Parse → Load → Authorize → Version check → Write → Return (always this order)

---

## Client-side API layer

```ts
// src/lib/tpmos/api/epics.ts

import { CreateEpicInput, UpdateEpicInput, Epic } from "@/lib/tpmos/schemas/epic";

const BASE = "/api/tpmos";

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) return res.json();
  const error = await res.json();
  throw new ApiError(error.error.code, error.error.message, res.status, error.error);
}

export async function listEpics(teamId: string, quarterId: string): Promise<Epic[]> {
  const res = await fetch(`${BASE}/epics?team=${teamId}&quarter=${quarterId}`);
  return handleResponse<Epic[]>(res);
}

export async function createEpic(input: CreateEpicInput): Promise<Epic> {
  const res = await fetch(`${BASE}/epics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<Epic>(res);
}

export async function updateEpic(id: string, input: UpdateEpicInput, version: number): Promise<Epic> {
  const res = await fetch(`${BASE}/epics/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "If-Match": String(version),
    },
    body: JSON.stringify(input),
  });
  return handleResponse<Epic>(res);
}
```

TanStack Query hooks wrap these:

```ts
// src/lib/tpmos/hooks/use-epics.ts

export function useEpics(teamId: string, quarterId: string) {
  return useQuery({
    queryKey: ["epics", teamId, quarterId],
    queryFn: () => listEpics(teamId, quarterId),
    staleTime: 30_000,
  });
}

export function useCreateEpic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEpic,
    onSuccess: (epic) => {
      queryClient.invalidateQueries({ queryKey: ["epics", epic.teamId, epic.quarterId] });
    },
  });
}
```

---

## Versioning strategy

### MVP: No API versioning

With a single consumer (our own SPA) and a single deployment pipeline, API versioning adds complexity for zero benefit. The client and server deploy atomically from the same repo.

### Post-MVP: URL prefix if needed

If external consumers ever need to integrate:

```
/api/tpmos/v1/epics
/api/tpmos/v2/epics    (only if v1 breaks)
```

This is a one-line change in the `functions/` directory structure. The connector interface (Phase 2) would use a versioned URL.

**DEC-0013: No API versioning for MVP. Versioning via URL prefix if external consumers appear in Phase 2+.**

---

## Rate limiting

Not implemented in MVP. Cloudflare Workers has built-in rate limiting that can be activated per-route without code changes. If abuse appears:

1. Add `Rate-Limiting` rule in Cloudflare dashboard: 100 requests/minute per IP for `/api/tpmos/*`
2. Or add `Rate-Limit-*` headers to responses for client awareness

No code change needed. Just dashboard configuration.

---

## Future: webhook / event model

Currently all state changes are synchronous request-response. When integrations (GitHub, Linear, Slack) arrive in Phase 2, the API will emit events:

```ts
interface TpmosEvent {
  type: "epic.created" | "epic.statusChanged" | "quarter.locked" | "risk.flagged" | ...;
  timestamp: string;
  actor: { id: string; email: string };
  payload: Record<string, unknown>;
}
```

Events will be dispatched to a Cloudflare Queue (or Durable Object) that fans out to registered connectors. The REST API doesn't change — event emission is a side effect of successful writes, handled inside the handler after the response is sent.

This is designed for but not implemented in MVP.

---

## Summary: why this API design is right for TPMOS

| Principle | Choice | Justification |
|---|---|---|
| Protocol | REST (JSON) | Native to Pages Functions, debuggable, cacheable |
| Contract | Shared Zod schemas | Type safety without framework coupling |
| Concurrency | Version + If-Match | Prevents silent overwrites without CRDT complexity |
| Errors | Consistent shape + typed codes | Clients handle errors generically |
| Bulk ops | Explicit endpoints | Atomicity and performance for drag-and-drop |
| Auth flow | Middleware → can() | Single enforcement point, fully testable |
| Versioning | None (MVP) → URL prefix | Matches deployment model; no premature abstraction |
| AI endpoints | Separate `/ai/*` namespace | Clear separation, independently disableable |
| Handler pattern | Parse → Authorize → Write → Return | Predictable, auditable, ≤80 lines |

The API is optimized for **debuggability, predictability, and correctness** rather than flexibility. A TPM tool that loses data or silently overwrites changes destroys trust. Every design choice reflects that priority.
