/**
 * People already in Jerri's LinkedIn network (owner, November 12, 2026). Two ways in:
 * - "Already connected" on an invitation card: that one person.
 * - Her LinkedIn connections export (Settings → Data privacy → Get a copy of your data → Connections),
 *   uploaded on the page: everyone it matches, by profile address first, then by name and company.
 * Either way the person is marked connected here, today's invitation to them is skipped, and the
 * connection goes to KADE's contact history (contact.ts) as connect_accepted. A connection that was
 * not one of our invitations carries a note, and KADE's results count only accepted invitations.
 * The export is the member's own data, downloaded by her; nothing reads LinkedIn automatically.
 */
import { flushTouches, touchStatement, type ContactEnv } from "./contact";

export const ALREADY_CONNECTED_NOTE = "Already connected before outreach";
const IMPORT_NOTE = "From the LinkedIn connections export";

export interface Connection { name: string; company: string; position: string; url: string | null; connectedOn: string | null }

/** Rows of a CSV file (quoted fields, doubled quotes, commas and line breaks inside quotes). */
export function csvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
  const s = text.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]!;
    if (quoted) {
      if (ch === '"' && s[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && s[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const MONTHS: Record<string, string> = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };

/** "12 Nov 2026" (LinkedIn's format) or an ISO date, as YYYY-MM-DD; null if neither. */
export function exportDate(v: string): string | null {
  const t = v.trim();
  const m = /^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})$/.exec(t);
  if (m && MONTHS[m[2]!.toLowerCase()]) return `${m[3]}-${MONTHS[m[2]!.toLowerCase()]}-${m[1]!.padStart(2, "0")}`;
  return /^\d{4}-\d{2}-\d{2}/.test(t) ? t.slice(0, 10) : null;
}

/** LinkedIn's Connections.csv: a few lines of notes, then "First Name,Last Name,URL,Email Address,Company,Position,Connected On". */
export function parseConnections(text: string): Connection[] {
  const rows = csvRows(text);
  const h = rows.findIndex((r) => r[0]?.trim().toLowerCase() === "first name");
  if (h < 0) throw new Error("This isn't LinkedIn's connections file: no \"First Name\" column. Upload Connections.csv from LinkedIn's data export.");
  const head = rows[h]!.map((c) => c.trim().toLowerCase());
  const col = (name: string) => head.indexOf(name);
  const [fn, ln, url, company, position, on] = ["first name", "last name", "url", "company", "position", "connected on"].map(col);
  const out: Connection[] = [];
  for (const r of rows.slice(h + 1)) {
    const name = [r[fn!] ?? "", r[ln!] ?? ""].join(" ").replace(/\s+/g, " ").trim();
    if (!name) continue;
    out.push({ name, company: (r[company!] ?? "").trim(), position: (r[position!] ?? "").trim(),
      url: url! >= 0 && r[url!]?.trim() ? r[url!]!.trim() : null, connectedOn: on! >= 0 ? exportDate(r[on!] ?? "") : null });
  }
  return out;
}

/** The profile's slug ("jane-doe-123"), however the address was written; null if it isn't a profile address. */
export function profileSlug(url: string | null): string | null {
  if (!url) return null;
  const m = /linkedin\.com\/in\/([^/?#\s]+)/i.exec(url);
  if (!m) return null;
  try { return decodeURIComponent(m[1]!).toLowerCase(); } catch { return m[1]!.toLowerCase(); }
}

/** A name for matching: no credentials after a comma, no punctuation, no middle initials. */
export function nameKey(name: string): string {
  return name.split(",")[0]!.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z\s'-]/g, " ").replace(/['-]/g, "").split(/\s+/).filter((w) => w.length > 1).join(" ");
}

const ORG_FILLER = new Set(["the", "of", "and", "at", "inc", "llc", "co", "corp", "corporation", "company", "group", "ltd"]);
const orgWords = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 1 && !ORG_FILLER.has(w));

/** Same organization, loosely: every word of the shorter name appears in the longer. */
export function sameOrg(a: string | null, b: string | null): boolean {
  const x = orgWords(a ?? ""), y = orgWords(b ?? "");
  if (!x.length || !y.length) return false;
  const [short, long] = x.length <= y.length ? [x, new Set(y)] : [y, new Set(x)];
  return short.every((w) => long.has(w));
}

interface PersonRow { id: string; full_name: string; organization: string | null; linkedin_url: string | null; connection_status: string }

/** Which people each connection is: by profile address, else by name and organization when exactly one person fits. */
export function matchConnections(people: PersonRow[], conns: Connection[]) {
  const bySlug = new Map<string, PersonRow>();
  const byName = new Map<string, PersonRow[]>();
  for (const p of people) {
    const s = profileSlug(p.linkedin_url);
    if (s) bySlug.set(s, p);
    const k = nameKey(p.full_name);
    if (k) byName.set(k, [...(byName.get(k) ?? []), p]);
  }
  const matched = new Map<string, { person: PersonRow; conn: Connection; by: "profile" | "name" }>();
  for (const c of conns) {
    const s = profileSlug(c.url);
    const p = s ? bySlug.get(s) : undefined;
    if (p) { matched.set(p.id, { person: p, conn: c, by: "profile" }); continue; }
    const fits = (byName.get(nameKey(c.name)) ?? []).filter((q) => sameOrg(q.organization, c.company));
    if (fits.length === 1 && !matched.has(fits[0]!.id)) matched.set(fits[0]!.id, { person: fits[0]!, conn: c, by: "name" });
  }
  return [...matched.values()];
}

/** Marks people connected, skips today's invitations to them, and records each in the outbox for KADE. */
function connectStatements(env: ContactEnv, p: { id: string; wasPending: boolean; on: string | null; note: string | null }, who: string, now: string, today: string, touchId = crypto.randomUUID()) {
  const at = p.on ? `${p.on}T12:00:00.000Z` : now;
  return [
    // connected_at is when they connected; unknown stays empty, so no "thanks for connecting" follow-up is drafted for an old connection.
    env.DB.prepare(`UPDATE people SET connection_status = 'connected', connected_at = ?2, updated_at = ?3 WHERE id = ?1`)
      .bind(p.id, p.wasPending ? (p.on ?? now) : p.on, now),
    env.DB.prepare(`UPDATE actions SET status = 'skipped', done_at = ?2, outcome = 'already connected' WHERE person_id = ?1 AND action_type IN ('connect', 'withdraw_invite') AND status = 'todo' AND action_date >= ?3`)
      .bind(p.id, now, today),
    touchStatement(env.DB, { id: touchId, personId: p.id, kind: "connect_accepted", at, by: who, note: p.note }),
  ];
}

/** "Already connected" on an invitation card. */
export async function alreadyConnected(env: ContactEnv, personId: string, who: string) {
  const p = await env.DB.prepare("SELECT id, connection_status FROM people WHERE id = ?1").bind(personId).first<{ id: string; connection_status: string }>();
  if (!p) return { error: "No such person", status: 404 } as const;
  if (p.connection_status === "connected") return { ok: true, already: true } as const;
  const now = new Date().toISOString();
  const touchId = crypto.randomUUID();
  // Pending: our invitation was accepted (a real acceptance). Otherwise they were already in the network.
  const pending = p.connection_status === "pending";
  await env.DB.batch(connectStatements(env, { id: p.id, wasPending: pending, on: null, note: pending ? null : ALREADY_CONNECTED_NOTE }, who, now, now.slice(0, 10), touchId));
  const kade = await flushTouches(env, [touchId]).catch((e) => ({ error: String(e) }));
  return { ok: true, kade } as const;
}

/** The connections export, uploaded on the page. KADE hears about the matches as the page flushes the outbox. */
export async function importConnections(env: ContactEnv, csv: string, who: string) {
  const conns = parseConnections(csv);
  const people = (await env.DB.prepare("SELECT id, full_name, organization, linkedin_url, connection_status FROM people").all<PersonRow>()).results;
  const matches = matchConnections(people, conns).filter((m) => m.person.connection_status !== "connected");
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const stmts = matches.flatMap((m) => connectStatements(env, {
    id: m.person.id, wasPending: m.person.connection_status === "pending", on: m.conn.connectedOn,
    // An invitation of ours that they accepted is a real acceptance; anyone else was already in the network.
    note: m.person.connection_status === "pending" ? IMPORT_NOTE : `${ALREADY_CONNECTED_NOTE} (${IMPORT_NOTE.toLowerCase()})`,
  }, who, now, today));
  for (let i = 0; i < stmts.length; i += 90) await env.DB.batch(stmts.slice(i, i + 90));
  const already = people.filter((p) => p.connection_status === "connected").length;
  return {
    inFile: conns.length,
    matched: matches.length,
    byProfile: matches.filter((m) => m.by === "profile").length,
    byName: matches.filter((m) => m.by === "name").length,
    acceptedInvites: matches.filter((m) => m.person.connection_status === "pending").length,
    alreadyMarked: already,
  };
}
