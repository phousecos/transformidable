/**
 * Client for KADE's BD integration API (KADE docs/bd-agents-integration.md).
 * KADE sits behind Cloudflare Access; the service token's Client ID and Secret go in
 * the CF-Access-Client-* headers, and Access hands KADE the signed token it verifies.
 */
export interface KadeEnv {
  /** Signals over a service binding in the KADE account (KADE docs/platform-apps.md): no token, no public internet. */
  SIGNALS?: Fetcher;
  KADE_API_URL: string;
  /** The Access service token, used only without the binding (before the move). */
  KADE_ACCESS_CLIENT_ID?: string;
  KADE_ACCESS_CLIENT_SECRET?: string;
}

/**
 * One way to call Signals' BD routes: the service binding when there is one, otherwise the public address with
 * the Access service token. Access answers a bad token with a redirect to its login page, treated as a failure.
 */
async function signals(env: KadeEnv, path: string, init: { method?: string; body?: string; query?: URLSearchParams } = {}): Promise<Response> {
  const url = new URL(`/api/integrations/bd/${path}`, env.KADE_API_URL || "https://signals.internal");
  if (init.query) url.search = init.query.toString();
  const headers: Record<string, string> = { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}) };
  if (env.SIGNALS) return env.SIGNALS.fetch(new Request(url, { method: init.method ?? "GET", headers, body: init.body }));
  if (!env.KADE_ACCESS_CLIENT_SECRET || !env.KADE_ACCESS_CLIENT_ID) throw new KadeError(0, "Signals is not connected: no service binding and no Access service token");
  headers["CF-Access-Client-Id"] = env.KADE_ACCESS_CLIENT_ID;
  headers["CF-Access-Client-Secret"] = env.KADE_ACCESS_CLIENT_SECRET;
  return fetch(url, { method: init.method ?? "GET", headers, body: init.body, redirect: "manual" });
}

export interface KadePerson {
  person_id: string;
  full_name: string;
  linkedin_url: string | null;
  organization_id: string;
  organization_name: string;
  entity_type: string | null;
  subtype: string | null;
  state_province: string | null;
  role_category: string | null;
  title: string;
  tier: string | null;
  heat: number | null;
  /** Why the organization scored as it did (KADE screening summary). */
  summary: string | null;
  pursued: number;
  /** Where contact stands in KADE: open, in_conversation, paused (until paused_until) or stopped. */
  contact_state?: string;
  paused_until?: string | null;
  updated_at: string;
}

export interface KadeGap {
  organization_id: string;
  organization_name: string;
  entity_type: string | null;
  state_province: string | null;
  tier: string | null;
  heat: number | null;
  summary: string | null;
  pursued: number;
}

export type PeopleScope = "pursued" | "hot" | "hot_warm";

export class KadeError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

async function get<T>(env: KadeEnv, path: string, params: Record<string, string | number | undefined>): Promise<T> {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") query.set(k, String(v));
  const res = await signals(env, path, { query });
  if (res.status !== 200) {
    const body = await res.text();
    throw new KadeError(res.status, `KADE ${path}: HTTP ${res.status} ${body.slice(0, 300)}`);
  }
  return res.json<T>();
}

export interface ContactWrite {
  personId: string;
  kind: string;
  channel: string;
  occurredAt: string;
  externalId: string;
  recordedBy: string | null;
  note: string | null;
}
export interface ContactWriteResult { id: string; duplicate: boolean; state: { state: string; paused_until: string | null } }

/** Records a touch or outcome on the person in KADE (the BD integration's only write). */
export async function recordContact(env: KadeEnv, body: ContactWrite): Promise<ContactWriteResult> {
  const res = await signals(env, "contact-activity", { method: "POST", body: JSON.stringify(body) });
  if (res.status !== 201) throw new KadeError(res.status, `KADE contact-activity: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  return res.json<ContactWriteResult>();
}

export const PAGE_SIZE = 500;

/** One page of people at pursued, hot or hot/warm organizations, oldest change first. */
export function peoplePage(env: KadeEnv, scope: PeopleScope, updatedSince: string | undefined, offset: number) {
  return get<{ people: KadePerson[] }>(env, "people", { scope, updated_since: updatedSince, limit: PAGE_SIZE, offset });
}

/** One page of organizations in the scope with no leadership contact in KADE, hottest first. */
export function gapsPage(env: KadeEnv, scope: PeopleScope, offset: number) {
  return get<{ organizations: KadeGap[] }>(env, "people-gaps", { scope, limit: PAGE_SIZE, offset });
}

/** Where a person or account opens in KADE's dashboard. */
export const kadeOrgUrl = (env: KadeEnv, organizationId: string) => new URL(`/#org/${encodeURIComponent(organizationId)}`, env.KADE_API_URL).toString();

export interface KadeSignal {
  event_type: string;
  trigger: string | null;
  entity_type: string | null;
  verdict_cause: string | null;
  verdict_effect_kind: string | null;
  areas: string[];
  services: string[];
  event_date: string | null;
  first_observed_at: string;
}

/** Recent business events. The content agent counts them into themes and never passes names on. */
export function recentSignals(env: KadeEnv, since: string) {
  return get<{ total: number; items: KadeSignal[] }>(env, "signals", { updated_since: since, limit: PAGE_SIZE });
}

export interface KadeResults {
  since: string;
  weeks: ({ week: string } & Record<string, number>)[];
  tracks: ({ track: string } & Record<string, number>)[];
  /** Partners (KADE docs/partners.md), counted apart from prospects. */
  partners?: {
    total: number; new: number; invited: number; connected: number; talking: number; met: number; referring: number; checkInsDue: number;
    referralsReceived: number; referralsGiven: number;
    weeks: ({ week: string } & Record<string, number>)[];
    types: ({ type: string; label: string } & Record<string, number>)[];
  };
}
/** Outreach results counted in KADE from its contact history and pursuits. */
export function results(env: KadeEnv, weeks: number) {
  return get<KadeResults>(env, "results", { weeks });
}

/** The weekly plan KADE writes each Monday (KADE docs/weekly-plan.md); null until the first one. */
export interface KadeWeekPlan {
  weekOf: string; generatedAt: string; emailedAt: string | null;
  decide: { pursuits: { organizationId: string; name: string; stage: string; nextStep: string | null; nextStepDate: string | null; quietDays: number; ask: string }[] };
  conversations: { personId: string; name: string; organization: string | null; lastReplyAt: string; waitingOnYou: boolean }[];
  inMotion: { invitesPending: number; firstEmailFollowUp: string | null; emailsSentLastWeek: number; draftsWaiting: number; draftsPerDay: number };
  market: { hotAccounts: number; touchedAccounts: number; researchedLastWeek: number; newSignals: number; mix: { label: string; n: number }[] };
  results: { lastWeek: Record<string, string | number> | null; weekBefore: Record<string, string | number> | null };
  suggestions: { title: string; why: string; hours: number }[];
  suggestionsError?: string;
}
export function weekPlan(env: KadeEnv) {
  return get<{ plan: KadeWeekPlan | null }>(env, "week", {});
}

/** KADE's events (KADE docs/events-agent.md): this month's proposals and the webinars ahead. */
export interface KadeEvents {
  month: string | null;
  proposals: { id: string; kind: string; title: string; angle: string; audience: string | null; why: string; suggested_date: string | null; week_of: string | null; status: string; webinar_id: string | null }[];
  upcoming: { id: string; title: string; starts_at: string | null; join_url: string | null; audience: string; status: string; in_drafts: number; sent: number; attended: number }[];
}
export function events(env: KadeEnv) {
  return get<KadeEvents>(env, "events", {});
}

/** A partner (KADE docs/partners.md): a person who serves the same buyers, with where the relationship stands. */
export interface KadePartner {
  person_id: string;
  full_name: string;
  title: string | null;
  firm: string | null;
  linkedin_url: string | null;
  partner_type: string;
  type_label: string;
  stage: string;
  check_in_on: string | null;
  referrals_in: number;
  referrals_out: number;
}

export function partners(env: KadeEnv) {
  return get<{ partners: KadePartner[]; types: Record<string, string> }>(env, "partners", {});
}

export interface PartnerAdd { linkedinUrl: string; name: string; title?: string | null; firm?: string | null; type: string; note?: string | null }

/** Adds a partner in KADE by LinkedIn URL; the next partner sync brings them here. */
export async function addPartner(env: KadeEnv, body: PartnerAdd): Promise<{ personId: string; created: boolean }> {
  const res = await signals(env, "partners", { method: "POST", body: JSON.stringify(body) });
  if (res.status !== 201) {
    const text = await res.text();
    let msg = text.slice(0, 300);
    try { msg = (JSON.parse(text) as { error?: string }).error ?? msg; } catch { /* not JSON */ }
    throw new KadeError(res.status, res.status === 422 ? msg : `KADE partners: HTTP ${res.status} ${msg}`);
  }
  return res.json();
}

export interface JobReport { job: string; ok: boolean; at: string; ms: number; detail: string }

/** The morning's steps, reported to KADE's system check (docs/system-check.md). */
export async function reportJobs(env: KadeEnv, jobs: JobReport[]) {
  const res = await signals(env, "job-reports", { method: "POST", body: JSON.stringify({ jobs }) });
  if (res.status !== 201) throw new KadeError(res.status, `KADE job-reports: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
}

/** A POST to KADE's BD routes; 422 answers carry KADE's own reason. */
async function kadePost<T>(env: KadeEnv, path: string, body: unknown): Promise<T> {
  const res = await signals(env, `${path}`, { method: "POST", body: JSON.stringify(body) });
  if (res.status !== 201) {
    const text = await res.text();
    let msg = text.slice(0, 300);
    try { msg = (JSON.parse(text) as { error?: string }).error ?? msg; } catch { /* not JSON */ }
    throw new KadeError(res.status, res.status === 422 ? msg : `KADE ${path}: HTTP ${res.status} ${msg}`);
  }
  return res.json<T>();
}

export interface KadeReply { id: string; person_id: string; full_name: string; organization: string | null; occurred_at: string; note: string | null; suggested_outcome: string; suggestion_note: string | null }
export interface KadeInbox {
  drafts: { waiting: number; sentThisWeek: number; requested: number; old: { id: string; full_name: string; organization: string | null; subject: string; created_at: string; removedOn: string }[] };
  replies: KadeReply[];
}
/** Email for the daily list (KADE docs/outreach-email.md): drafts waiting, and replies with a suggested outcome. */
export const inbox = (env: KadeEnv) => get<KadeInbox>(env, "inbox", {});
/** "Email instead": KADE drafts an email to this person tomorrow morning. */
export const requestEmail = (env: KadeEnv, personId: string) => kadePost<{ personId: string; email: string }>(env, "email-requests", { personId });
/** A reply's suggestion set aside. */
export const dismissReply = (env: KadeEnv, id: string) => kadePost<{ ok: boolean }>(env, "reply-dismissals", { id });

// ---- Influence's own routes on Signals (KADE docs/influence.md), through the InfluenceGateway binding ----

export interface SignalsPerson {
  person_id: string; merged_into: string | null; full_name: string; linkedin_url: string | null; title: string | null; organization: string | null;
  kinds: string[]; last_touch: string | null; comments: number; prospect: boolean; partner: boolean;
}

async function influenceCall<T>(env: KadeEnv, path: string, init: { method?: string; body?: unknown; ok?: number } = {}): Promise<T> {
  if (!env.SIGNALS) throw new KadeError(0, "Signals is not connected (no SIGNALS service binding)");
  const res = await env.SIGNALS.fetch(new Request(new URL(`/api/integrations/influence/${path}`, env.KADE_API_URL || "https://signals.internal"), {
    method: init.method ?? "GET",
    headers: { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}) },
    body: init.body ? JSON.stringify(init.body) : undefined,
  }));
  if (res.status !== (init.ok ?? 200)) {
    const text = await res.text();
    let msg = text.slice(0, 300);
    try { msg = (JSON.parse(text) as { error?: string }).error ?? msg; } catch { /* not JSON */ }
    throw new KadeError(res.status, res.status === 422 ? msg : `Signals ${path}: HTTP ${res.status} ${msg}`);
  }
  return res.json<T>();
}

/** The Signals person for a LinkedIn profile, created if Signals has none. */
export const signalsPerson = (env: KadeEnv, linkedinUrl: string, name: string) =>
  influenceCall<{ personId: string; created: boolean }>(env, "people", { method: "POST", body: { linkedinUrl, name }, ok: 201 });

/** What Signals knows about these people: contact history, role, prospect and partner marks. */
export async function signalsPeople(env: KadeEnv, ids: string[]): Promise<SignalsPerson[]> {
  const out: SignalsPerson[] = [];
  for (let i = 0; i < ids.length; i += 100) out.push(...(await influenceCall<{ people: SignalsPerson[] }>(env, `people?ids=${encodeURIComponent(ids.slice(i, i + 100).join(","))}`)).people);
  return out;
}

// ---- Research (KADE docs/influence-research.md): Influence asks; Signals researches within its queue and budget ----

export interface Appearance { url: string; title: string | null; kind: string; outlet: string | null; published_date: string | null; summary: string | null; confirmed: boolean; found_at: string }
export interface PersonResearch { person_id: string; researched_at: string | null; waiting: boolean; checking: number; appearances: Appearance[] }
export interface DiscoveryRequest {
  communities: { key: string; label: string; subjects?: string }[];
  types: { key: string; label: string }[];
  focus: string; count: number; exclude: string[];
}
export interface Candidate { personId: string; name: string; affiliation: string | null; linkedinUrl: string | null; community: string | null; type: string | null; why: string | null }

/** Queues footprint scans (and on Mondays the week's discovery). Signals skips anyone researched in the last six days. */
export const requestResearch = (env: KadeEnv, body: { footprint?: { personId: string; affiliation?: string | null }[]; discovery?: DiscoveryRequest | null }) =>
  influenceCall<{ queued: number; skipped: { personId: string; reason: string }[]; discovery: string | null }>(env, "research", { method: "POST", body, ok: 201 });

/** What research has found on these people. */
export async function signalsResearch(env: KadeEnv, ids: string[]): Promise<PersonResearch[]> {
  const out: PersonResearch[] = [];
  for (let i = 0; i < ids.length; i += 100) out.push(...(await influenceCall<{ people: PersonResearch[] }>(env, `appearances?ids=${encodeURIComponent(ids.slice(i, i + 100).join(","))}`)).people);
  return out;
}

/** Discovery candidates from scans finished after `since`. */
export const discoveries = (env: KadeEnv, since: string) =>
  influenceCall<{ scans: { scanId: string; finishedAt: string; candidates: Candidate[] }[] }>(env, `discoveries?since=${encodeURIComponent(since)}`);

/** Saves the LinkedIn profile she pastes for a discovered person, or names the Signals person who already has it. */
export const linkLinkedIn = (env: KadeEnv, personId: string, linkedinUrl: string) =>
  influenceCall<{ personId: string; linked: boolean }>(env, "people/linkedin", { method: "POST", body: { personId, linkedinUrl } });

// ---- Engagement (KADE docs/influence-engagement.md): the log is Signals' contact history ----

export interface Engagement { id: string; person_id: string; kind: string; occurred_at: string; source: string; note: string | null; detail: Record<string, unknown> | null }

export const recordEngagement = (env: KadeEnv, body: { personId: string; kind: string; postUrl?: string | null; topic?: string | null; approach?: string | null; text?: string | null; note?: string | null }) =>
  influenceCall<{ id: string; duplicate: boolean }>(env, "engagement", { method: "POST", body, ok: 201 });

export async function engagementLog(env: KadeEnv, ids: string[], since: string): Promise<Engagement[]> {
  const out: Engagement[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    out.push(...(await influenceCall<{ activity: Engagement[] }>(env, `engagement?ids=${encodeURIComponent(ids.slice(i, i + 100).join(","))}&since=${encodeURIComponent(since)}`)).activity);
  }
  return out;
}

/** An email to the owner from her connected Gmail, sent by Signals (KADE docs/influence-measurement.md). */
export const notifyOwner = (env: KadeEnv, subject: string, body: string) =>
  influenceCall<{ sent: boolean; to: string }>(env, "notify", { method: "POST", body: { subject, body }, ok: 201 });
