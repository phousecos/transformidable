/**
 * Who is using the review page. Cloudflare Access (Transformidable account) sits in front of
 * the Worker and signs a JWT for every request it lets through; the identity comes only from
 * that verified token. Fails closed: without ACCESS_TEAM_DOMAIN and ACCESS_AUD nobody gets in.
 */
export interface AuthEnv {
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
  /** Comma-separated email domains allowed in (a second check on top of the Access policy). */
  ALLOWED_EMAIL_DOMAINS?: string;
}

export class AuthError extends Error {
  constructor(readonly status: 401 | 403 | 503, message: string) {
    super(message);
  }
}

const keyCache = new Map<string, { keys: Map<string, CryptoKey>; at: number }>();
const b64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), (c) => c.charCodeAt(0));

async function keys(team: string, force = false) {
  const hit = keyCache.get(team);
  if (hit && !force && Date.now() - hit.at < 3_600_000) return hit.keys;
  const res = await fetch(`${team}/cdn-cgi/access/certs`);
  if (!res.ok) throw new AuthError(503, `Could not fetch Access keys: HTTP ${res.status}`);
  const { keys: jwks } = await res.json<{ keys: (JsonWebKey & { kid: string })[] }>();
  const map = new Map<string, CryptoKey>();
  for (const k of jwks) map.set(k.kid, await crypto.subtle.importKey("jwk", k, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]));
  keyCache.set(team, { keys: map, at: Date.now() });
  return map;
}

export async function signedInEmail(req: Request, env: AuthEnv): Promise<string> {
  const team = env.ACCESS_TEAM_DOMAIN?.trim().replace(/\/$/, "");
  const aud = env.ACCESS_AUD?.trim();
  if (!team || !aud) throw new AuthError(503, "Cloudflare Access is not configured for this Worker yet");
  const token = req.headers.get("Cf-Access-Jwt-Assertion") ?? /(?:^|;\s*)CF_Authorization=([^;]+)/.exec(req.headers.get("Cookie") ?? "")?.[1];
  if (!token) throw new AuthError(401, "Not signed in");
  const [h, p, sig] = token.split(".");
  if (!h || !p || !sig) throw new AuthError(401, "Malformed token");
  const header = JSON.parse(new TextDecoder().decode(b64(h))) as { alg: string; kid: string };
  if (header.alg !== "RS256") throw new AuthError(401, "Unexpected token algorithm");
  const key = (await keys(team)).get(header.kid) ?? (await keys(team, true)).get(header.kid);
  if (!key || !(await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64(sig), new TextEncoder().encode(`${h}.${p}`)))) throw new AuthError(401, "Invalid token");
  const c = JSON.parse(new TextDecoder().decode(b64(p))) as { email?: string; aud: string | string[]; iss: string; exp: number };
  const now = Math.floor(Date.now() / 1000);
  if (c.iss !== team || !(Array.isArray(c.aud) ? c.aud : [c.aud]).includes(aud) || c.exp <= now) throw new AuthError(401, "Token not valid for this app");
  if (!c.email) throw new AuthError(403, "Service tokens cannot use the review page");
  const domains = (env.ALLOWED_EMAIL_DOMAINS ?? "").split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
  const domain = c.email.split("@")[1]?.toLowerCase() ?? "";
  if (domains.length && !domains.includes(domain)) throw new AuthError(403, `${c.email} is not allowed here`);
  return c.email.toLowerCase();
}
