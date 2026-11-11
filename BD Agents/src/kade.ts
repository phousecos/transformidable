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
  updated_at: string;
}

export type PeopleScope = "pursued" | "watched";

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

export const PAGE_SIZE = 500;

/** One page of people at pursued or watched organizations, oldest change first. */
export function peoplePage(env: KadeEnv, scope: PeopleScope, updatedSince: string | undefined, offset: number) {
  return get<{ people: KadePerson[] }>(env, "people", { scope, updated_since: updatedSince, limit: PAGE_SIZE, offset });
}
