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

```sh
cd "BD Agents"
npx wrangler secret put KADE_ACCESS_CLIENT_SECRET   # the bd-agents service token's Client Secret
npx wrangler deploy
```

Then run it once from the dashboard (Workers → bd-agents → Settings → Trigger events, or the cron's "Run now") and check `SELECT value FROM sync_state WHERE key = 'people:last_run'`. KADE must have `BD_SERVICE_CLIENT_ID` set and the Service Auth policy in place, or KADE answers 503 or Access answers with a redirect.

## Rules the code must enforce

- **No LinkedIn automation.** LinkedIn connections, DMs and comments are never sent by code. The Worker only prepares `actions` with copy-ready text and a profile link. Posts publish only through an official-API scheduler, after approval.
- **Approval:** either approver can approve outreach. Items with `needs_jerri = 1` need Jerri.
- **Daily LinkedIn mix (about 30 min):** about 5 follow-ups, about 7 comments (posts under 48 h old), about 9 connection requests, and about 1 reshare.
- **Connection slots:** about 4 cohort targets (at most 2 people per account per week), 2 warm signals, 2 influencers or partners, and 1 public official.
- **Touch rules:** one touch per person per day, and never LinkedIn and email on the same day.
- **Invites:** a request with no accept after 14 days moves to the email lane. Invites still pending after 3 weeks get a `withdraw_invite` action.
- **Content:** connection notes and comments never pitch. Officials get Academy and education framing only.

## Build order (for Claude Code)

1. **KADE read API:** **built** in KADE (PR #21): `/api/integrations/bd/people`, `/signals`, `/pursuits`, behind the `bd-agents` Access service token.
2. **Sync** (`src/sync.ts`): **built.** Weekday mornings it pulls everyone at KADE's open pursuits and active hot/warm prospects (scope `hot_warm`) and upserts them into `people` by `kade_contact_id`, with tier, heat and pursued. Anyone no longer returned is marked `in_kade_scope = 0`, not deleted. The last run's summary is in `sync_state` under `people:last_run`. The uploaded-list pool in KADE is never copied.
3. **Review queue page:** list, approve, edit and reject `review_queue` items. Record the approver, and write a `touches` row when an item is marked sent.
4. **Results intake:** manual and CSV entry first (LinkedIn analytics, webinar attendance, booked calls), then integrations.
5. **Agents:** research and outreach drafting, reviewer, engagement engine, then the content, Academy, media and strategist agents.

Scheduled work runs from the weekday cron in `wrangler.jsonc`.
