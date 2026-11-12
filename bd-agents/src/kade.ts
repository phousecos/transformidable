/**
 * Client for KADE's BD integration API (KADE docs/bd-agents-integration.md).
 * KADE sits behind Cloudflare Access; the service token's Client ID and Secret go in
 * the CF-Access-Client-* headers, and Access hands KADE the signed token it verifies.
 */
export interface KadeEnv {
  KADE_API_URL: string;
  KADE_ACCESS_CLIENT_ID: string;
  KADE_ACCESS_CLIENT_SECRET: string;
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
  if (!env.KADE_ACCESS_CLIENT_SECRET) throw new KadeError(0, "KADE_ACCESS_CLIENT_SECRET is not set");
  const url = new URL(`/api/integrations/bd/${path}`, env.KADE_API_URL);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  const res = await fetch(url, {
    headers: {
      "CF-Access-Client-Id": env.KADE_ACCESS_CLIENT_ID,
      "CF-Access-Client-Secret": env.KADE_ACCESS_CLIENT_SECRET,
      Accept: "application/json",
    },
    redirect: "manual", // Access answers a bad token with a redirect to its login page; treat that as a failure.
  });
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
  if (!env.KADE_ACCESS_CLIENT_SECRET) throw new KadeError(0, "KADE_ACCESS_CLIENT_SECRET is not set");
  const res = await fetch(new URL("/api/integrations/bd/contact-activity", env.KADE_API_URL), {
    method: "POST",
    headers: {
      "CF-Access-Client-Id": env.KADE_ACCESS_CLIENT_ID,
      "CF-Access-Client-Secret": env.KADE_ACCESS_CLIENT_SECRET,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    redirect: "manual",
  });
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
