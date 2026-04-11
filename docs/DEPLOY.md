# DEPLOY.md — Production Deployment

## One-time setup

### 1. Create Cloudflare Pages project

In the Cloudflare dashboard:

1. Workers & Pages → Create → Pages → Connect to Git
2. Select the `ItssooverWeRsoBack/TPMOS` repo
3. Build settings:
   - Framework preset: Next.js (Static HTML Export)
   - Build command: `npm run build`
   - Build output directory: `out`
   - Root directory: `/`
4. Environment variables (production):
   - `ENV=production`
   - `AI_PROVIDER=workers-ai` (or `anthropic` once you have an API key)
   - `AUTH_SECRET=<random 32-byte hex>` (for HMAC dev cookie signing — even though dev login is gated off in prod, the secret is required at boot)
5. Save and deploy

### 2. Create production D1 database

```bash
npx wrangler d1 create tpmos-prod
```

Copy the resulting `database_id` into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "tpmos-prod"
database_id = "<paste here>"
migrations_dir = "./migrations"
```

Commit and push.

### 3. Apply migrations to production

```bash
npm run db:migrate:prod
```

This runs against the remote D1 database.

### 4. Seed initial admin user

```bash
npx wrangler d1 execute tpmos-prod --remote --command \
  "INSERT INTO users (id, org_id, email, display_name, role) VALUES ('admin-1', 'default', '<your email>', 'Admin', 'admin')"
```

### 5. Configure custom domain

In Cloudflare Pages → Custom Domains → Add `tpmos.torfinn.xyz`. Cloudflare auto-creates the CNAME if `torfinn.xyz` is in the same Cloudflare account.

### 6. Set up Cloudflare Access

In Cloudflare dashboard → Zero Trust → Access → Applications → Add Application → Self-hosted:

- Application name: `TPMOS`
- Session duration: 24 hours
- Application domain: `tpmos.torfinn.xyz` (covers `/*`)
- Identity providers: Google + GitHub + One-time PIN
- Policies:
  - Name: `Allowed users`
  - Action: Allow
  - Include: Emails (your email + collaborators)

Save. Future visitors hit the Access login flow before reaching Pages Functions.

### 7. Verify the deploy

```bash
curl -I https://tpmos.torfinn.xyz
# Expect 302 redirect to Access login

# After authenticating in browser
curl -b "<access cookie>" https://tpmos.torfinn.xyz/api/tpmos/me
# Expect JSON with user object
```

## Subsequent deploys

Push to `main` → Cloudflare Pages auto-builds → deploys.

For migrations:

```bash
npm run db:migrate:prod
```

Run before the deploy if the migration removes a column or changes a constraint, otherwise after.

## Rollback

In Cloudflare Pages dashboard → Deployments → click the previous deployment → "Rollback to this deployment".

Database rollback is harder — D1 has time-travel within the last 30 days via `wrangler d1 time-travel`. Use it only in genuine emergencies.

## Security checklist (run before every production deploy)

- [ ] `ENV=production` is set in Pages env vars
- [ ] `AUTH_SECRET` is set and rotated annually
- [ ] Cloudflare Access policy is active and includes only authorized emails
- [ ] No `.dev.vars` files in the deployed bundle
- [ ] Dev login route returns 404 (verify with `curl https://tpmos.torfinn.xyz/api/tpmos/dev/login?email=test@test.com` — should be 404, not 200)
- [ ] Migrations applied before deploying schema-dependent code
- [ ] CI is green on the commit being deployed

## Cost monitoring

Cloudflare dashboard → Analytics & Logs → check daily:
- D1 reads/day vs 5M free tier
- D1 writes/day vs 100K free tier
- D1 storage vs 5GB free tier
- Pages Functions invocations
- Workers AI Neurons used vs 10K/day free tier

If any metric trends past 50% of the free tier consistently, plan migration:
- D1 reads: enable read replicas (D1 paid plan, $5/mo)
- D1 storage: migrate to Turso or Hyperdrive+Postgres
- Workers AI: switch `AI_PROVIDER` to `anthropic` and add API key as secret

## Adding the production Anthropic API key (optional, post-demo)

```bash
npx wrangler secret put ANTHROPIC_API_KEY
# paste the key when prompted
```

Then in Pages env vars set `AI_PROVIDER=anthropic`. The provider abstraction picks up the change on next deploy.
