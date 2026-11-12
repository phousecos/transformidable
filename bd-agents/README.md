# BD Agent Team

Agents that research and draft business development work for Transformidable. Nothing is sent or posted until Jerri or her BD partner approves it.

This folder is its own Cloudflare Worker (`bd-agents`). It is separate from the `transformidable-cms` Worker at the repo root and is excluded from the root `tsconfig.json` so it never affects the Next.js build.

## Where things live

| Piece | Location |
|---|---|
| BD agent data | D1 database `bd-agents` (Transformidable Cloudflare account), binding `DB` |
| Signals, scored accounts, contacts | **KADE**, in its own Cloudflare account. Reached only through KADE's API (`KADE_API_URL` + `KADE_API_TOKEN`). Never copy KADE's database. |
| Schema | `migrations/` (0001 already applied in production) |
| Config | `wrangler.jsonc` |

## The four systems

1. **Advisory pipeline:** signal → research dossier → outreach drafts → engagement engine (daily LinkedIn action list).
2. **Academy enrollment:** civic signals, enrollment drafts, partner channels (CRI, associations).
3. **Media & events:** topic radar, production drafts, webinars and briefings.
4. **BD strategist:** reads `results` across systems against the goal of 3 executive conversations a week, and writes `recommendations` with drafted assets attached as `review_queue` items.

Shared services: the **reviewer** agent checks every draft, and **conversation support** writes meeting briefs, follow-ups and proposal outlines.

## Tables (migration 0001)

- `people`: a light copy of contacts being actively worked. It keeps `kade_contact_id` / `kade_account_id` and is refreshed from KADE's API.
- `review_queue`: every draft from every system. Status: `proposed → approved | edited | rejected → sent`. `needs_jerri = 1` for anything that uses Jerri's time.
- `recommendations`: the strategist's cards, with no more than about 5 `open` at a time.
- `actions`: the daily LinkedIn list, ranked, worked by hand.
- `touches`: every contact, per person and channel, which enforces the no-double-touch rules.
- `results`: metrics from every source, per system, track and day.

## Deploy

**Automatic:** Workers Builds deploys `bd-agents` on every merge to `main` that touches `bd-agents/` (root directory `bd-agents`, deploy command `npx wrangler deploy`, preview builds off: previews would share the live database). Secrets persist across deploys. Database migrations are applied separately, not by the build.

**By hand**, if ever needed:

```sh
cd bd-agents
npx wrangler secret put KADE_ACCESS_CLIENT_SECRET   # the bd-agents service token's Client Secret
npx wrangler deploy
```

Then run it once from the dashboard (Workers → bd-agents → Settings → Trigger events, or the cron's "Run now") and check `SELECT value FROM sync_state WHERE key = 'people:last_run'`. KADE must have `BD_SERVICE_CLIENT_ID` set and the Service Auth policy in place, or KADE answers 503 or Access answers with a redirect.

## Review page: Transformidable Daily (Today, Posts, Results)

The page is at **https://dash.betransformidable.com**, behind Cloudflare Access (Access cannot protect workers.dev, so the Worker uses this custom domain and has no workers.dev URL). Each weekday at 5 a.m. ET the cron syncs hot people from KADE, syncs hot organizations with no leadership contact (`research_gaps`), and builds the day's list:

- about 5 **follow-ups** (people marked accepted in the last 14 days) and about 9 **connection requests** (pursued accounts first, then buyer roles, then heat; at most 2 per account per week), each with a Claude draft in `review_queue`;
- **withdraw** actions for invites pending 21+ days.

On the page: copy the draft (edit it first if you like), open the profile, send it on LinkedIn yourself, then press **Done**; that records the touch and who sent it. Mark invites **Accepted** when LinkedIn shows them. **Research needed** links each organization to KADE; approving records the request, and the research itself runs in KADE. Comments and reshares are not on the list yet: they need post data from Sales Navigator alerts.

### Content agent (this week's posts)

Each Monday the cron drafts the week's LinkedIn posts: 3 for the Transformidable company page (Mon/Wed/Fri) and 2 for Jerri's profile (Tue/Thu), in the voice of *The Transformidable Leader*. Material: themes across KADE's business events from the last 14 days (counted only; no organization is ever named), the latest podcast episodes and Academy courses (CMS public API at `SITE_URL`), and upcoming briefing sessions (the `BRIEFINGS` service binding to the briefings Worker). Drafts are `review_queue` rows with `system = 'media'`; on the page you edit, copy, post on LinkedIn by hand, and press **Posted**. If Monday's run is missed, **Draft this week's posts now** does the same.

### Turning the page on

1. Deploy once (`npx wrangler deploy`); that creates `dash.betransformidable.com` and its certificate. Then in **Zero Trust → Access → Applications → Add an application → Self-hosted**, protect subdomain `dash` on `betransformidable.com` with an **Allow** policy for emails ending in `@jerribland.com` and `@jlynne.co`.
2. Copy the application's **AUD tag** and your Zero Trust **team domain** (`https://<team>.cloudflareaccess.com`) into `ACCESS_AUD` and `ACCESS_TEAM_DOMAIN` in `wrangler.jsonc`, and list the allowed email domains in `ALLOWED_EMAIL_DOMAINS`.
3. `npx wrangler secret put ANTHROPIC_API_KEY` (without it, drafts are plain templates), then `npx wrangler deploy`.

Until step 2 is done the page answers 503 to everyone.

## Rules the code must enforce

- **No LinkedIn automation.** LinkedIn connections, DMs and comments are never sent by code. The Worker only prepares `actions` with copy-ready text and a profile link. Posts publish only through an official-API scheduler, after approval.
- **Approval:** either approver can approve outreach. Items with `needs_jerri = 1` need Jerri.
- **Daily LinkedIn mix (about 30 min):** about 5 follow-ups, about 7 comments (posts under 48 h old), about 9 connection requests, and about 1 reshare.
- **Connection slots:** about 4 cohort targets (at most 2 people per account per week), 2 warm signals, 2 influencers or partners, and 1 public official.
- **Touch rules:** one touch per person per day, and never LinkedIn and email on the same day.
- **Invites:** a request with no accept after 14 days moves to the email lane. Invites still pending after 3 weeks get a `withdraw_invite` action.
- **Content:** connection notes and comments never pitch. Officials get Academy and education framing only.
- **One contact history, in KADE (November 12, 2026; KADE `docs/contact-history.md`).** Every action marked done, every accepted invite, and every outcome (replied, meeting booked, not interested, asked to stop, conversation closed) is written to `touches` first and then sent to KADE (`src/contact.ts`); anything KADE did not take is retried each morning. KADE decides what it means: a reply pauses suggestions until the conversation is closed, not interested pauses the person for 12 months, asked to stop is permanent. The sync brings KADE's `contact_state` back, and the daily list suggests only people whose state is open.

## Build order (for Claude Code)

1. **KADE read API:** **built** in KADE (PR #21): `/api/integrations/bd/people`, `/signals`, `/pursuits`, behind the `bd-agents` Access service token.
2. **Sync** (`src/sync.ts`): **built.** Weekday mornings it pulls everyone at KADE's open pursuits and active hot prospects (scope `hot`) and upserts them into `people` by `kade_contact_id`, with tier, heat and pursued. Anyone no longer returned is marked `in_kade_scope = 0`, not deleted. The last run's summary is in `sync_state` under `people:last_run`. The uploaded-list pool in KADE is never copied.
3. **Review queue page:** **built (v1)** as the daily LinkedIn list and research needed (above). The general approve/edit/reject queue for other systems comes later.
4. **Results intake:** manual and CSV entry first (LinkedIn analytics, webinar attendance, booked calls), then integrations.
5. **Agents:** research and outreach drafting, reviewer, engagement engine, then the content, Academy, media and strategist agents.

### Backlog

- ~~Hot organizations with no people~~ **Done (November 12, 2026):** KADE researches hot accounts automatically (deep research plus an AI Ark lookup for missing leaders); the page lists the ones still waiting, read-only. The approve/dismiss step and `/api/gaps/:id` are retired.
- **Academy feed.** No hot prospect is a government body (first hot-only sync: 0 officials of 1,495), so Academy enrollment needs its own feed from KADE's civic signals (board agendas, AI policy votes, new members).

Scheduled work runs from the weekday cron in `wrangler.jsonc`.
