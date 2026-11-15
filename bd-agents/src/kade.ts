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
/** Someone no longer in the role (KADE docs/role-changes.md): moved, retired, on leave, or no longer deciding. */
export const roleChange = (env: KadeEnv, body: { personId: string; organizationId?: string | null; reason: string; note?: string | null; returnOn?: string | null; newOrganization?: string | null; newTitle?: string | null }) =>
  kadePost<{ personId: string; reason: string; endedRoles?: number; seatsFlagged?: number; pausedUntil?: string; newOrganization?: { id: string | null; name: string; note?: string } }>(env, "role-change", body);
/** A reply's suggestion set aside. */
export const dismissReply = (env: KadeEnv, id: string) => kadePost<{ ok: boolean }>(env, "reply-dismissals", { id });
