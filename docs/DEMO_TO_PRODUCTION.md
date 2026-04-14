# DEMO_TO_PRODUCTION.md — Moving TPMOS from Demo to Production

**Last updated:** 2026-04-14

> This guide walks through every step of transitioning TPMOS from a seeded demo environment to a clean production deployment with real users. Follow the steps in order.

---

## Prerequisites

- Cloudflare account with `torfinn.xyz` zone
- `wrangler` CLI authenticated (`npx wrangler login`)
- TPMOS repo cloned locally (`~/src/TPMOS`)
- Cloudflare Pages project already created and building from GitHub

---

## Phase 1: Clean the Database

The demo database contains seed data (fake users, teams, epics, interviews). Production needs a clean start with only your real admin account.

### Option A: Delete and recreate (recommended)

This gives you a completely fresh database with no migration history artifacts.

```bash
# 1. Delete the demo database
npx wrangler d1 delete tpmos-prod

# 2. Create a fresh production database
#    Do this in the Cloudflare Dashboard:
#    Storage & Databases → D1 SQL Database → Create Database → name: tpmos-prod
#    Copy the new Database ID.

# 3. Update wrangler.toml with the new database_id
#    Edit the [[d1_databases]] section:
#    database_id = "<your-new-database-id>"

# 4. Commit and push the updated wrangler.toml
git add wrangler.toml
git commit -m "Update D1 database ID for production"
git push

# 5. Apply ONLY the schema migrations (no seed data)
npx wrangler d1 execute tpmos-prod --remote --file=migrations/0001_init.sql
npx wrangler d1 execute tpmos-prod --remote --file=migrations/0002_capacity.sql
npx wrangler d1 execute tpmos-prod --remote --file=migrations/0003_epics.sql
npx wrangler d1 execute tpmos-prod --remote --file=migrations/0004_intake.sql
npx wrangler d1 execute tpmos-prod --remote --file=migrations/0005_audit.sql

# 6. Verify tables exist
npx wrangler d1 execute tpmos-prod --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
```

Expected tables: `audit_log`, `capacity_plans`, `epic_votes`, `epics`, `interview_theme_tags`, `interview_themes`, `interviews`, `orgs`, `quarters`, `team_members`, `teams`, `users` (plus `d1_migrations` and `sqlite_sequence`).

### Option B: Delete seed data in place

Use this only if you've already mixed real data with seed data and can't recreate.

```sql
-- Run each line via: npx wrangler d1 execute tpmos-prod --remote --command "<sql>"

DELETE FROM interview_theme_tags;
DELETE FROM interview_themes;
DELETE FROM interviews;
DELETE FROM epic_votes;
DELETE FROM epics;
DELETE FROM capacity_plans;
DELETE FROM team_members;
DELETE FROM teams;
DELETE FROM quarters;
DELETE FROM users WHERE email LIKE '%@example.com';
-- The default org stays (it's needed)
```

---

## Phase 2: Seed Your Real Admin User

The first user must be inserted manually because no one can log in until at least one admin exists.

```bash
npx wrangler d1 execute tpmos-prod --remote --command \
  "INSERT INTO users (id, org_id, email, display_name, role) \
   VALUES ('admin-1', 'default', 'YOUR_EMAIL_HERE', 'Your Name', 'admin')"
```

Replace `YOUR_EMAIL_HERE` with the email you'll use to log in via Cloudflare Access (e.g., `torfinnolsen@proton.me`).

**This email must match the identity provider you configure in Cloudflare Access** (Google, GitHub, or email OTP).

---

## Phase 3: Configure Cloudflare Access

Cloudflare Access is what protects TPMOS from unauthorized access. Without it, anyone who knows the URL can hit the API.

### 3.1 Create an Access Application

1. Go to **Cloudflare Dashboard → Zero Trust → Access → Applications**
2. Click **Add an Application → Self-hosted**
3. Configure:
   - **Application name:** TPMOS
   - **Session duration:** 24 hours
   - **Application domain:** `tpmos.torfinn.xyz`
   - **Path:** leave blank (protects all paths)

### 3.2 Add an Access Policy

1. **Policy name:** Allowed Users
2. **Action:** Allow
3. **Include rule:** Emails — add your email and any collaborators
4. **Identity providers:** Enable at least one of:
   - Google (if your email is Gmail/Workspace)
   - GitHub (if you want GitHub login)
   - One-time PIN (works with any email)

### 3.3 Verify Access is working

```bash
# Should return 302 redirect to Access login page
curl -I https://tpmos.torfinn.xyz

# After authenticating in browser, the app should load
```

---

## Phase 4: Set Up the Custom Domain

If not already done:

1. **Pages project → Settings → Custom Domains → Add Domain**
2. Enter: `tpmos.torfinn.xyz`
3. Cloudflare auto-creates the DNS record if `torfinn.xyz` is in the same account
4. Wait ~1 minute for SSL certificate provisioning

Verify: `curl -I https://tpmos.torfinn.xyz` returns 200 (or 302 if Access is active).

---

## Phase 5: Set Production Environment Variables

In the Cloudflare Pages project → **Settings → Environment Variables**, ensure:

| Variable | Value | Notes |
|---|---|---|
| `ENV` | `production` | **Critical.** This gates the dev login route. |
| `AI_PROVIDER` | `none` | Start with AI disabled. Switch to `workers-ai` when ready. |

**Verify the dev login route is gated:**

```bash
# This MUST return 404 in production
curl https://tpmos.torfinn.xyz/api/tpmos/dev/login?email=test@test.com
# Expected: 404 Not Found
```

If it returns 200, the `ENV` variable is not set correctly. Fix immediately.

---

## Phase 6: Verify the Deployment

### 6.1 Log in

1. Visit `https://tpmos.torfinn.xyz`
2. Cloudflare Access prompts you to authenticate
3. After auth, the app loads and your user (seeded in Phase 2) is recognized as admin

### 6.2 Verify admin access

- Navigate to **Admin** in the sidebar
- You should see your user listed with role `admin`

### 6.3 Create your first quarter

- Navigate to **Quarters**
- The current quarter should auto-create, or you can create one manually

### 6.4 Invite users

When team members visit `tpmos.torfinn.xyz`:

1. Cloudflare Access authenticates them (they must be in your Access policy)
2. The middleware auto-creates their user with `role=pending`
3. You (as admin) promote them to the correct role: `tpm`, `em`, `ic`, or `exec`

---

## Phase 7: Enable AI Features (Optional)

### Workers AI (free)

1. In Pages environment variables, set `AI_PROVIDER=workers-ai`
2. Push to trigger a redeploy
3. AI features (Draft with AI, DoD lint, interview synthesis) will use Cloudflare's free Llama 3.1 model

### Anthropic Claude Haiku (higher quality, paid)

1. Get an API key from `console.anthropic.com`
2. Set the secret: `npx wrangler secret put ANTHROPIC_API_KEY` (paste when prompted)
3. Set `AI_PROVIDER=anthropic` in environment variables
4. Push to trigger a redeploy

---

## Post-Launch Checklist

- [ ] Demo database deleted or cleaned (Phase 1)
- [ ] Real admin user seeded (Phase 2)
- [ ] Cloudflare Access configured and tested (Phase 3)
- [ ] Custom domain active with SSL (Phase 4)
- [ ] `ENV=production` set (Phase 5)
- [ ] Dev login route returns 404 (Phase 5)
- [ ] Admin can log in and see the admin panel (Phase 6)
- [ ] First quarter created (Phase 6)
- [ ] At least one team member invited and promoted (Phase 6)
- [ ] AI provider decision made (Phase 7)

---

## Ongoing Operations

### Adding new users

Users self-register by visiting the site (Cloudflare Access authenticates, middleware auto-creates with `role=pending`). Admin promotes them in the Admin page.

To add someone to Cloudflare Access: Zero Trust → Access → Applications → TPMOS → Edit Policy → add their email.

### Applying future schema migrations

When new migrations are added in future releases:

```bash
cd ~/src/TPMOS
git pull
npx wrangler d1 migrations apply tpmos-prod --remote
```

Run this **before** deploying code that depends on the new schema.

### Quarterly cadence

1. **T-3 weeks before quarter end:** EMs enter epics + capacity
2. **T-2 weeks:** Team votes and planning
3. **Quarter start:** Lock plans
4. **Mid-quarter:** Status updates, risk monitoring
5. **Quarter end:** Close quarter, carry-forward incomplete epics
6. **Repeat**

### Backups

D1 has built-in time-travel (last 30 days). For explicit backups:

```bash
npx wrangler d1 export tpmos-prod --remote --output=backup-$(date +%Y%m%d).sql
```

### Cost monitoring

Check monthly in Cloudflare Dashboard → Analytics:

| Resource | Free tier | When to upgrade |
|---|---|---|
| D1 reads | 5M/day | Unlikely to hit with < 1000 users |
| D1 writes | 100K/day | Unlikely with periodic planning cadence |
| D1 storage | 5GB | Monitor if you have 50+ teams over years |
| Workers AI | 10K Neurons/day | Unlikely with occasional AI drafting |
| Cloudflare Access | 50 users | Switch to magic-link auth or Access paid |

---

## Rollback Plan

If something goes wrong after go-live:

### Code rollback
Cloudflare Pages → Deployments → click the last working deployment → **Rollback to this deployment**

### Database rollback
```bash
# D1 time-travel: restore to a point in time within the last 30 days
npx wrangler d1 time-travel tpmos-prod --remote --timestamp="2026-04-14T12:00:00Z"
```

### Full reset
Delete the database, recreate, and re-apply migrations (Phase 1 of this guide). All data is lost — this is the nuclear option.
