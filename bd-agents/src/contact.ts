/**
 * Contact history goes to KADE (KADE docs/contact-history.md): one record per person, kept there.
 * Each touch or outcome is written to `touches` first (the outbox) and then sent; anything KADE
 * did not take (offline, a person KADE no longer has) stays unsent and is retried by the cron.
 */
import { KadeError, recordContact, type KadeEnv } from "./kade";

export interface ContactEnv extends KadeEnv {
  DB: D1Database;
}

/** Touch types on the daily list, as KADE's contact kinds. */
export const KIND_BY_ACTION: Record<string, string> = {
  connect: "connect_sent",
  follow_up: "message_sent",
  withdraw_invite: "connect_withdrawn",
  comment: "comment",
  reshare: "reshare",
};
/** Outcomes the page can record, and what each does to the person here until KADE answers. */
/** A null state leaves the person's state as it is (a referral is not a reply). */
export const OUTCOMES: Record<string, { state: string | null; label: string }> = {
  reply: { state: "in_conversation", label: "Replied" },
  meeting_booked: { state: "in_conversation", label: "Meeting booked" },
  not_interested: { state: "paused", label: "Not interested" },
  stop_request: { state: "stopped", label: "Asked to stop" },
  conversation_closed: { state: "open", label: "Conversation closed" },
  // Partners (KADE docs/partners.md): referrals both ways.
  referral_received: { state: null, label: "Referred a client to me" },
  referral_given: { state: null, label: "I referred a client to them" },
};

export function touchStatement(db: D1Database, t: { id: string; personId: string; kind: string; queueId?: string | null; at: string; by: string; note?: string | null }) {
  return db.prepare(
    `INSERT INTO touches (id, person_id, channel, touch_type, queue_id, occurred_at, by_user, kade_kind, note) VALUES (?1, ?2, 'linkedin', ?3, ?4, ?5, ?6, ?3, ?7)`,
  ).bind(t.id, t.personId, t.kind, t.queueId ?? null, t.at, t.by, t.note ?? null);
}

interface Unsent { id: string; person_id: string; kade_contact_id: string | null; kade_kind: string; occurred_at: string; by_user: string | null; note: string | null }

/** Sends unsent touches to KADE, oldest first; `onlyIds` limits it to the ones just recorded. */
export async function flushTouches(env: ContactEnv, onlyIds?: string[], limit = 200) {
  const filter = onlyIds?.length ? `AND t.id IN (${onlyIds.map((_, i) => `?${i + 1}`).join(", ")})` : "";
  const rows = (await env.DB.prepare(
    `SELECT t.id, t.person_id, p.kade_contact_id, t.kade_kind, t.occurred_at, t.by_user, t.note FROM touches t JOIN people p ON p.id = t.person_id
     WHERE t.kade_sent_at IS NULL AND t.kade_kind IS NOT NULL ${filter} ORDER BY t.occurred_at LIMIT ${limit}`,
  ).bind(...(onlyIds ?? [])).all<Unsent>()).results;
  let sent = 0, failed = 0;
  for (const t of rows) {
    if (!t.kade_contact_id) {
      await env.DB.prepare("UPDATE touches SET kade_error = 'Not a KADE person', kade_sent_at = ?2 WHERE id = ?1").bind(t.id, new Date().toISOString()).run();
      continue;
    }
    try {
      const r = await recordContact(env, {
        personId: t.kade_contact_id, kind: t.kade_kind, channel: "linkedin",
        occurredAt: t.occurred_at.includes("T") ? t.occurred_at : `${t.occurred_at.replace(" ", "T")}Z`,
        externalId: t.id, recordedBy: t.by_user, note: t.note,
      });
      await env.DB.batch([
        env.DB.prepare("UPDATE touches SET kade_sent_at = ?2, kade_error = NULL WHERE id = ?1").bind(t.id, new Date().toISOString()),
        env.DB.prepare("UPDATE people SET contact_state = ?2, paused_until = ?3, do_not_contact = CASE WHEN ?2 = 'stopped' THEN 1 ELSE do_not_contact END, updated_at = ?4 WHERE id = ?1")
          .bind(t.person_id, r.state.state, r.state.paused_until, new Date().toISOString()),
      ]);
      sent++;
    } catch (e) {
      failed++;
      // KADE refused it (422: an unknown person or kind): recorded as not sendable, so it is not retried forever.
      const refused = e instanceof KadeError && e.status === 422;
      await env.DB.prepare("UPDATE touches SET kade_error = ?2, kade_sent_at = ?3 WHERE id = ?1").bind(t.id, String(e).slice(0, 300), refused ? new Date().toISOString() : null).run();
    }
  }
  return { sent, failed, waiting: rows.length - sent };
}
