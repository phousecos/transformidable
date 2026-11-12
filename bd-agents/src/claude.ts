/**
 * Drafts LinkedIn text with Claude. Every draft is a proposal: it is shown in the review
 * queue, edited or approved by a person, and sent by hand. Without an API key, or if the
 * call fails, a plain template is used so the daily list still works.
 */
import { VOICE } from "./voice";

export interface ClaudeEnv {
  ANTHROPIC_API_KEY?: string;
  AI_MODEL?: string;
}

export type DraftKind = "connection_note" | "follow_up";

export interface DraftSubject {
  firstName: string;
  title: string | null;
  organization: string | null;
  /** KADE's screening summary. Internal: used for relevance only, never quoted or named. */
  context: string | null;
}

/** LinkedIn's limit for a connection note on a free account is 200 characters. */
export const LIMITS: Record<DraftKind, number> = { connection_note: 200, follow_up: 600 };

const SYSTEM = `You draft short LinkedIn messages for Dr. Jerri Bland to send from her own account. She is a governance advisor (ERP and core systems, IT controls, AI governance, M&A technology integration) with 25 years of enterprise IT leadership, including Deputy CIO at Columbia University and leading enterprise applications at UNC-Chapel Hill. She writes peer to peer: plain, warm, specific, brief.

${VOICE}

In a short LinkedIn message, use only the plain, direct sentences and the habit of asking a good question; no hypotheticals, no hashtags.

Rules:
- Never pitch, name a service, mention pricing, or ask for a meeting or call.
- Never claim to know anything about their internal situation, and never diagnose a problem.
- The context you are given is internal research. Use it only to choose a relevant topic. Never quote it, never mention signals, scores, research, screening, data, tools or how you found them. If the context is unclear or sensitive (layoffs, lawsuits, failures), stay general.
- No flattery, no "I came across your profile", no "hope this finds you well", no emojis, no em dashes, no hashtags.
- Write only the message text. No subject line, no signature, no quotation marks.`;

function prompt(kind: DraftKind, s: DraftSubject): string {
  const who = [s.firstName, s.title, s.organization].filter(Boolean).join(", ");
  const ctx = s.context ? `\nInternal context (do not quote): ${s.context.slice(0, 1200)}` : "";
  if (kind === "connection_note") {
    return `Write a LinkedIn connection request note to ${who}. At most ${LIMITS.connection_note} characters including spaces. One or two sentences: a reason to connect grounded in their role and a governance topic relevant to their organization.${ctx}`;
  }
  return `${who} just accepted Jerri's LinkedIn connection request. Write a short thank-you message (at most ${LIMITS.follow_up} characters) that offers one useful governance thought or question relevant to their role, with no ask.${ctx}`;
}

export function template(kind: DraftKind, s: DraftSubject): string {
  if (kind === "connection_note") {
    return `Hi ${s.firstName}, I work with executive teams on governing ERP and AI programs and would value connecting.`.slice(0, LIMITS.connection_note);
  }
  return `Thanks for connecting, ${s.firstName}. I write about how leadership teams keep technology programs governable as they grow. Glad to be connected and happy to share anything useful along the way.`;
}

export async function draft(env: ClaudeEnv, kind: DraftKind, s: DraftSubject): Promise<{ text: string; by: string }> {
  if (!env.ANTHROPIC_API_KEY) return { text: template(kind, s), by: "template" };
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: env.AI_MODEL || "claude-sonnet-5-5", max_tokens: 400, system: SYSTEM, messages: [{ role: "user", content: prompt(kind, s) }] }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    const body = await res.json<{ content: { type: string; text?: string }[] }>();
    let text = body.content.filter((c) => c.type === "text").map((c) => c.text ?? "").join("").trim().replace(/^"|"$/g, "");
    if (!text) throw new Error("empty draft");
    if (text.length > LIMITS[kind]) text = text.slice(0, LIMITS[kind]).replace(/\s+\S*$/, "").replace(/[,;:]$/, "") + ".";
    return { text, by: env.AI_MODEL || "claude-sonnet-5-5" };
  } catch (e) {
    console.log(JSON.stringify({ level: "warn", job: "draft", kind, error: String(e) }));
    return { text: template(kind, s), by: "template" };
  }
}
