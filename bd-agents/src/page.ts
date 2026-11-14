/**
 * Transformidable Daily: the BD review page (design: the "Transformidable Daily redesign" canvas,
 * November 12, 2026). Tabs (November 14): This week, Prospecting, Partners, Email, Posts and Results
 * (weekly numbers), with a status line on top. One self-contained page; all data via /api/*.
 * Text from the database is only ever set with textContent or value, never as HTML. (No template
 * literals inside the script below, because this whole page is itself a template literal.)
 */
export const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Transformidable Daily</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root { --bg:#F6F5F1; --card:#FFFFFF; --ink:#1C1B19; --muted:#5E5A53; --line:#E4E1DA; --soft:#F0EDE7; --field:#FCFBF9; --fieldline:#D6D2C9;
  --accent:#9A3F14; --accent-ink:#FFFFFF; --accent-soft:#F1E6DF; --accent-text:#6E2C0C; --ok:#1E5A3B; --ok-soft:#E8F2EC; --ok-line:#C9E0D2;
  --warn:#8A5300; --warn-soft:#FBF0DC; --chip:#F3F1EC; --chip-ink:#3F3C37; --visual:#F7F1EC; --visual-line:#EADBD0; --bad:#B42318; }
@media (prefers-color-scheme: dark) { :root { --bg:#161614; --card:#1F1F1C; --ink:#ECEBE7; --muted:#A8A59E; --line:#34332F; --soft:#2A2926; --field:#191917; --fieldline:#45433E;
  --accent:#E58A5A; --accent-ink:#1C1B19; --accent-soft:#3A2A21; --accent-text:#F2B08C; --ok:#8FD0A2; --ok-soft:#1D2B22; --ok-line:#2E4536;
  --warn:#F0C27A; --warn-soft:#2F2617; --chip:#2A2926; --chip-ink:#D8D6D0; --visual:#2A231E; --visual-line:#45362B; --bad:#FF8A80; } }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--ink); font:15px/1.45 Inter, -apple-system, "Segoe UI", system-ui, sans-serif; }
a { color:var(--accent); }
button, input, select, textarea { font:inherit; color:inherit; }
button { cursor:pointer; }
.wrap { max-width:1200px; margin:0 auto; padding:0 24px; }
header { background:var(--card); border-bottom:1px solid var(--line); }
.top { display:flex; flex-wrap:wrap; align-items:baseline; justify-content:space-between; gap:8px; padding-top:18px; }
.brand { display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; }
h1 { margin:0; font-size:22px; font-weight:700; letter-spacing:-.01em; }
.muted { color:var(--muted); }
.small { font-size:13px; }
nav { display:flex; gap:4px; flex-wrap:wrap; margin-top:12px; }
nav a { padding:10px 14px; border-bottom:3px solid transparent; color:var(--muted); text-decoration:none; }
nav a[aria-current="page"] { border-bottom-color:var(--accent); color:var(--ink); font-weight:600; }
.badge { background:var(--accent-soft); color:var(--accent-text); border-radius:10px; padding:1px 7px; font-size:12px; font-weight:600; }
.page { padding-top:20px; padding-bottom:48px; display:flex; flex-direction:column; gap:20px; }
.status { display:flex; flex-wrap:wrap; gap:8px; }
.pill { background:var(--card); border:1px solid var(--line); border-radius:8px; padding:8px 12px; font-size:13px; }
.pill.ok { background:var(--ok-soft); border-color:var(--ok-line); color:var(--ok); }
.pill.warn { background:var(--warn-soft); border-color:var(--warn-soft); color:var(--warn); }
.split { display:flex; flex-wrap:wrap; gap:24px; align-items:flex-start; }
.main { flex:999 1 560px; min-width:0; display:flex; flex-direction:column; gap:16px; }
.side { flex:1 1 320px; min-width:0; display:flex; flex-direction:column; gap:16px; }
h2 { margin:0; font-size:17px; font-weight:600; }
h3.group { margin:4px 0 0; font-size:12px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:var(--muted); }
.bar { height:6px; background:var(--line); border-radius:3px; overflow:hidden; }
.bar > div { height:6px; background:var(--accent); }
.card { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:16px 18px; display:flex; flex-direction:column; gap:10px; }
.card.done { opacity:.7; }
.panel { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:16px 18px; display:flex; flex-direction:column; gap:12px; }
.panel p { margin:4px 0 0; }
.item { border-top:1px solid var(--soft); padding-top:12px; display:flex; flex-direction:column; gap:8px; }
.head { display:flex; flex-wrap:wrap; align-items:center; gap:8px 10px; }
.name { font-weight:600; font-size:16px; }
.tags { margin-left:auto; display:flex; gap:6px; }
.tag { background:var(--chip); color:var(--chip-ink); border-radius:6px; padding:2px 8px; font-size:12px; font-weight:600; }
.tag.accent { background:var(--accent-soft); color:var(--accent-text); }
.tag.ok { background:var(--ok-soft); color:var(--ok); }
.tag.warn { background:var(--warn-soft); color:var(--warn); }
label.field { font-size:12px; color:var(--muted); display:flex; flex-direction:column; gap:4px; }
textarea { width:100%; border:1px solid var(--fieldline); border-radius:8px; padding:10px 12px; resize:vertical; background:var(--field); min-height:72px; }
.count { font-size:12px; color:var(--muted); text-align:right; }
.count.over { color:var(--bad); font-weight:600; }
.actions { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
.btn { min-height:44px; padding:0 14px; border-radius:8px; border:1px solid var(--fieldline); background:var(--card); display:inline-flex; align-items:center; justify-content:center; text-decoration:none; color:var(--chip-ink); }
.btn.primary { background:var(--accent); border-color:var(--accent); color:var(--accent-ink); font-weight:600; padding:0 18px; }
.btn.outline { border-color:var(--accent); color:var(--accent); font-weight:600; }
.btn.quiet { border-color:transparent; background:transparent; color:var(--muted); }
.btn.small { min-height:40px; padding:0 12px; }
.btn:disabled { opacity:.5; cursor:not-allowed; }
.respond { margin-left:auto; display:flex; align-items:center; gap:6px; font-size:13px; color:var(--muted); }
select { min-height:44px; border:1px solid var(--fieldline); border-radius:8px; padding:0 8px; background:var(--card); }
.ok-line { display:flex; align-items:center; gap:8px; color:var(--ok); font-weight:600; font-size:14px; }
.empty { color:var(--muted); font-style:italic; margin:0; }
.days { flex:1 1 300px; min-width:0; display:flex; flex-direction:column; gap:10px; }
.day { text-align:left; min-height:64px; padding:12px 14px; border-radius:10px; border:1px solid var(--line); background:var(--card); display:flex; flex-direction:column; gap:4px; width:100%; }
.day[aria-pressed="true"] { border:2px solid var(--accent); }
.day .line { display:flex; justify-content:space-between; gap:8px; width:100%; }
.visual { background:var(--visual); border:1px solid var(--visual-line); border-radius:10px; padding:14px 16px; display:flex; flex-direction:column; gap:6px; }
.visual .label { font-size:12px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:var(--accent-text); }
.tiles { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; }
.tile { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:16px 18px; display:flex; flex-direction:column; gap:4px; }
.tile .big { font-size:30px; font-weight:700; letter-spacing:-.02em; }
.scroll { overflow-x:auto; }
table { width:100%; border-collapse:collapse; font-size:14px; font-variant-numeric:tabular-nums; }
th, td { padding:8px 10px; border-bottom:1px solid var(--soft); text-align:right; white-space:nowrap; }
th:first-child, td:first-child { text-align:left; }
thead th { color:var(--muted); font-weight:600; border-bottom-color:var(--line); }
td.total { font-weight:600; }
.track .rate { height:8px; background:var(--soft); border-radius:4px; overflow:hidden; }
.track .rate > div { height:8px; background:var(--accent); }
form.stats { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:10px; }
form.stats label { display:flex; flex-direction:column; gap:4px; font-size:13px; }
form.stats input, form.stats select { min-height:44px; border:1px solid var(--fieldline); border-radius:8px; padding:0 10px; background:var(--card); }
form.stats .wide { grid-column:1 / -1; }
#toast { position:fixed; bottom:16px; left:50%; transform:translateX(-50%); background:var(--ink); color:var(--bg); padding:10px 16px; border-radius:8px; font-size:14px; display:none; max-width:90vw; }
[hidden] { display:none !important; }
@media (max-width: 640px) {
  .wrap { padding:0 16px; }
  nav a { flex:1; text-align:center; }
  .status { flex-wrap:nowrap; overflow-x:auto; }
  .pill { flex:none; }
  .respond { margin-left:0; width:100%; }
  .actions .btn { flex:1 1 auto; }
}
</style>
</head>
<body>
<header>
  <div class="wrap">
    <div class="top">
      <div class="brand"><h1>Transformidable Daily</h1><span class="muted" id="date"></span></div>
      <span class="muted small" id="me"></span>
    </div>
    <nav aria-label="Sections">
      <a href="#week" data-tab="week">This week</a>
      <a href="#prospecting" data-tab="prospecting">Prospecting</a>
      <a href="#partners" data-tab="partners">Partners</a>
      <a href="#email" data-tab="email">Email <span class="badge" id="emailbadge" hidden></span></a>
      <a href="#posts" data-tab="posts">Posts <span class="badge" id="postbadge" hidden></span></a>
      <a href="#results" data-tab="results">Results</a>
    </nav>
  </div>
</header>

<div class="wrap page">
  <div class="status" role="status" id="status"></div>

  <section id="tab-prospecting" class="split">
    <main class="main">
      <div style="display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap">
          <h2>Prospecting</h2><span class="muted small">Follow-ups first, then invitations. Anything not done stays for 7 days.</span>
        </div>
        <div class="bar" aria-hidden="true"><div id="progress" style="width:0%"></div></div>
      </div>
      <div id="list"></div>
    </main>
    <aside class="side">
      <section class="panel">
        <div><h2 style="font-size:16px">Replies and meetings</h2>
          <p class="muted small">Record a reply, meeting or no here; it goes on their record in KADE. Suggestions pause until you close the conversation; not interested pauses them for 12 months; asked to stop is permanent.</p></div>
        <div id="contacts"></div>
      </section>
      <section class="panel">
        <div style="display:flex;justify-content:space-between;align-items:baseline"><h2 style="font-size:16px">Your influencer list</h2><span class="muted small" id="influencercount"></span></div>
        <p class="muted small" style="margin:0">Two of them come up for a comment each day, and up to two get a connection request until you're connected.</p>
        <div id="influencers"></div>
        <form id="influencerform" style="display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--soft);padding-top:12px">
          <label class="field">Name <input name="name" required style="min-height:44px;border:1px solid var(--fieldline);border-radius:8px;padding:0 10px;background:var(--card)"></label>
          <label class="field">LinkedIn profile address <input name="linkedinUrl" type="url" required placeholder="https://www.linkedin.com/in/…" style="min-height:44px;border:1px solid var(--fieldline);border-radius:8px;padding:0 10px;background:var(--card)"></label>
          <label class="field">Title and organization (optional) <input name="title" style="min-height:44px;border:1px solid var(--fieldline);border-radius:8px;padding:0 10px;background:var(--card)"></label>
          <button class="btn outline">Add to list</button>
        </form>
      </section>
      <section class="panel">
        <div><h2 style="font-size:16px">Your LinkedIn connections</h2>
          <p class="muted small" style="margin:0">Upload Connections.csv from LinkedIn (Settings, Data privacy, Get a copy of your data, Connections) so the list stops suggesting people you already know. Repeat every few months.</p></div>
        <label class="btn outline" style="cursor:pointer;position:relative">Upload Connections.csv<input type="file" id="connfile" accept=".csv,text/csv" style="position:absolute;width:1px;height:1px;opacity:0"></label>
        <div class="muted small" id="connmsg" role="status"></div>
      </section>
      <section class="panel">
        <div style="display:flex;justify-content:space-between;align-items:baseline"><h2 style="font-size:16px">Pending invites</h2><span class="muted small" id="pendingcount"></span></div>
        <p class="muted small" style="margin:0">Mark accepted when LinkedIn shows it; a thank-you is drafted the next morning.</p>
        <div id="pending"></div>
      </section>
    </aside>
  </section>

  <section id="tab-partners" class="split" hidden>
    <main class="main">
      <div style="display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap">
          <h2>Partners</h2><span class="muted small">Invitations, call asks and check-ins. Anything not done stays for 7 days.</span>
        </div>
      </div>
      <div id="partnerlist"></div>
    </main>
    <aside class="side">
      <section class="panel">
        <div style="display:flex;justify-content:space-between;align-items:baseline"><h2 style="font-size:16px">Your partners</h2><span class="muted small" id="partnercount"></span></div>
        <p class="muted small" style="margin:0">Fractional CFOs and CHROs, deal advisors, ERP firms and recruiters who serve the same buyers. KADE finds some each Monday; add your own here. Up to five invitations a day, a call ask once they accept, and a check-in six weeks after you last talked.</p>
        <div id="partners"></div>
        <form id="partnerform" style="display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--soft);padding-top:12px">
          <label class="field">Name <input name="name" required style="min-height:44px;border:1px solid var(--fieldline);border-radius:8px;padding:0 10px;background:var(--card)"></label>
          <label class="field">LinkedIn profile address <input name="linkedinUrl" type="url" required placeholder="https://www.linkedin.com/in/…" style="min-height:44px;border:1px solid var(--fieldline);border-radius:8px;padding:0 10px;background:var(--card)"></label>
          <label class="field">Firm (optional) <input name="firm" style="min-height:44px;border:1px solid var(--fieldline);border-radius:8px;padding:0 10px;background:var(--card)"></label>
          <label class="field">Kind <select name="type" required style="min-height:44px;border:1px solid var(--fieldline);border-radius:8px;padding:0 10px;background:var(--card)">
            <option value="fractional_finance">Fractional CFO or controller</option>
            <option value="fractional_hr">Fractional CHRO</option>
            <option value="deal_advisor">M&amp;A, integration or audit advisor</option>
            <option value="erp_recruiter">ERP consultancy or executive recruiter</option>
          </select></label>
          <button class="btn outline">Add partner</button>
        </form>
      </section>
    </aside>
  </section>

  <section id="tab-email" hidden style="display:flex;flex-direction:column;gap:20px;max-width:760px">
      <section class="panel">
        <div><h2 style="font-size:16px">Email</h2>
          <p class="muted small" style="margin:0">Outreach drafts waiting in your Gmail Drafts, and email replies with what KADE thinks they mean. Confirm to record it, or set it aside.</p></div>
        <div id="inbox"><p class="muted small">Loading…</p></div>
      </section>
  </section>

  <section id="tab-posts" class="split" hidden>
    <div class="days">
      <div><h2>Upcoming posts</h2><p class="muted small" style="margin:4px 0 0">Company page Mon, Wed, Fri. Your profile Tue, Thu. A Transformidable Thinking short video each week.</p></div>
      <div id="days" style="display:flex;flex-direction:column;gap:10px"></div>
      <button type="button" class="btn" id="buildposts" style="border-style:dashed">Draft upcoming posts now</button>
    </div>
    <section class="main panel" id="postdetail"></section>
  </section>

  <section id="tab-week" hidden style="display:flex;flex-direction:column;gap:20px">
    <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:8px">
      <h2 id="weektitle">This week</h2><span class="muted small" id="weeknote">Written by KADE each Monday at 6:00 from its records.</span>
    </div>
    <div class="split">
      <section class="main" style="display:flex;flex-direction:column;gap:20px">
        <section class="panel"><h2 style="font-size:16px">Decide</h2><p class="muted small" style="margin:0">Only you can make these calls.</p><div id="wkdecide"></div></section>
        <section class="panel"><h2 style="font-size:16px">Suggested this week</h2><div id="wksuggest"></div></section>
        <section class="panel"><h2 style="font-size:16px">Where the market moved</h2><div id="wkmarket"></div></section>
      </section>
      <div class="side">
        <section class="panel"><h2 style="font-size:16px">In motion</h2><div id="wkmotion"></div></section>
        <section class="panel"><h2 style="font-size:16px">Events</h2><div id="wkevents"></div></section>
        <section class="panel"><h2 style="font-size:16px">Posts this week</h2><div id="wkposts"></div></section>
        <section class="panel"><h2 style="font-size:16px">Last week</h2><div id="wkresults"></div></section>
      </div>
    </div>
  </section>

  <section id="tab-results" hidden style="display:flex;flex-direction:column;gap:20px">
    <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:8px">
      <h2>Prospects: this week so far</h2><span class="muted small">Counted in KADE from the contact history. Weeks start Monday. Partners are counted separately below.</span>
    </div>
    <div class="tiles" id="tiles"></div>
    <div class="split">
      <section class="main panel"><h2 style="font-size:16px">Prospects by week</h2><div class="scroll" id="weektable"></div></section>
      <div class="side">
        <section class="panel"><h2 style="font-size:16px">By service track, 8 weeks</h2><div id="tracks"></div></section>
        <section class="panel">
          <div><h2 style="font-size:16px">LinkedIn numbers</h2><p class="muted small" id="statslast">From LinkedIn's analytics, once a week.</p></div>
          <form class="stats" id="statsform">
            <label class="wide">Week of <select name="week" id="statsweek"></select></label>
            <label>Followers, you <input name="followers_profile" type="number" min="0"></label>
            <label>Followers, page <input name="followers_page" type="number" min="0"></label>
            <label>Impressions, you <input name="impressions_profile" type="number" min="0"></label>
            <label>Impressions, page <input name="impressions_page" type="number" min="0"></label>
            <label>Profile views <input name="profile_views" type="number" min="0"></label>
            <div style="display:flex;align-items:flex-end"><button class="btn primary" style="width:100%">Save</button></div>
          </form>
        </section>
      </div>
    </div>
    <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:8px;margin-top:12px;border-top:1px solid var(--soft);padding-top:20px">
      <h2>Partners: this week so far</h2><span class="muted small">Fractional CFOs and CHROs, deal advisors, ERP firms and recruiters. Referrals both ways.</span>
    </div>
    <div class="tiles" id="ptiles"></div>
    <div id="pstages" class="muted small"></div>
    <div class="split">
      <section class="main panel"><h2 style="font-size:16px">Partners by week</h2><div class="scroll" id="pweektable"></div></section>
      <div class="side"><section class="panel"><h2 style="font-size:16px">By kind of partner, 8 weeks</h2><div id="ptypes"></div></section></div>
    </div>
  </section>
</div>
<div id="toast" role="status"></div>

<script>
var LIMITS = { connect: 200, follow_up: 600, comment: 1250, reshare: 3000 };
var GROUPS = [["follow_up", "Follow up", "Thank-you message"], ["comment", "Comment", "Your comment"], ["reshare", "Reshare", "Intro above the reshared post"],
  ["connect", "Connect", "Invitation note (200 characters)"], ["withdraw_invite", "Withdraw invite", ""]];
var OUTCOMES = [["reply", "Replied"], ["meeting_booked", "Meeting booked"], ["not_interested", "Not interested"], ["stop_request", "Asked to stop"],
  ["referral_received", "Referred a client to me"], ["referral_given", "I referred a client to them"]];
var VISUALS = { quote_graphic: "Quote graphic", carousel: "Carousel", short_video: "Video short", text_only: "Text only" };
// The weekly Transformidable Thinking short video sits with the posts; its text is the caption and its visual the script.
function postKind(p) { return p.item_type === "short_video" ? "Short video" : p.channel === "page" ? "Company page" : "Your profile"; }
var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var STATS = [["followers_profile", "Followers, you"], ["followers_page", "Followers, page"], ["impressions_profile", "Impressions, you"], ["impressions_page", "Impressions, page"], ["profile_views", "Profile views"]];
var ROWS = [["connect_sent", "Invites sent"], ["connect_accepted", "Accepted"], ["rate", "Accept rate"], ["message_sent", "Messages"], ["comment", "Comments"],
  ["reply", "Replies"], ["meeting_booked", "Meetings booked"], ["pursuits_opened", "Pursuits opened"], ["posts", "Posts published"]];
var state = { today: null, posts: [], picked: null, showAllPending: false, results: null, week: null };

function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function add(parent) { for (var i = 1; i < arguments.length; i++) if (arguments[i]) parent.appendChild(arguments[i]); return parent; }
function toast(msg) { var s = document.getElementById("toast"); s.textContent = msg; s.style.display = "block"; clearTimeout(toast.t); toast.t = setTimeout(function () { s.style.display = "none"; }, 6000); }
// Cloudflare Access answers an expired sign-in with a redirect to its login page, which a fetch cannot
// follow ("Failed to fetch"). Not followed here, so the page can say what happened.
var EXPIRED = "Your sign-in to this page has expired. Reload the page to sign in again; nothing was saved.";
function post(path, body) {
  return fetch(path, { method: "POST", redirect: "manual", headers: { "content-type": "application/json" }, body: JSON.stringify(body || {}) })
    .catch(function () { throw new Error("Could not reach the server. Check your connection and try again; nothing was saved."); })
    .then(function (r) {
      if (r.type === "opaqueredirect" || r.status === 401 || r.status === 403) throw new Error(EXPIRED);
      return r.text().then(function (t) {
        var j; try { j = JSON.parse(t); } catch (e) { throw new Error(r.ok ? "Unexpected reply from the server" : "Server error " + r.status + "; nothing was saved."); }
        if (!r.ok) throw new Error(j.error || r.status);
        return j;
      });
    });
}
function who(p) { return [p.title, p.organization].filter(Boolean).join(", "); }
function button(text, cls, onclick) { var b = el("button", "btn" + (cls ? " " + cls : ""), text); b.type = "button"; if (onclick) b.onclick = onclick; return b; }
function link(text, href, cls) { var a = el("a", "btn" + (cls ? " " + cls : ""), text); a.href = href; a.target = "_blank"; a.rel = "noopener"; return a; }
function nice(iso) { var d = new Date(iso + "T12:00:00Z"); return MONTHS[d.getUTCMonth()] + " " + d.getUTCDate(); }
function longDate(iso) { var d = new Date(iso + "T12:00:00Z"); return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getUTCDay()] + ", " + ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][d.getUTCMonth()] + " " + d.getUTCDate(); }
function check() {
  var ns = "http://www.w3.org/2000/svg", s = document.createElementNS(ns, "svg"), p = document.createElementNS(ns, "path");
  s.setAttribute("width", "18"); s.setAttribute("height", "18"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("fill", "none");
  s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "2.5"); s.setAttribute("aria-hidden", "true");
  p.setAttribute("d", "M5 12l5 5L20 7"); s.appendChild(p); return s;
}
function counter(ta, limit) {
  var c = el("div", "count");
  var upd = function () { c.textContent = ta.value.length + " / " + limit; c.className = "count" + (ta.value.length > limit ? " over" : ""); };
  ta.addEventListener("input", upd); upd(); return c;
}

// ---- Tabs ----
var TABS = ["week", "prospecting", "partners", "email", "posts", "results"];
function showTab() {
  var tab = (location.hash || "#prospecting").slice(1);
  if (tab === "today") tab = "prospecting";
  if (TABS.indexOf(tab) < 0) tab = "prospecting";
  TABS.forEach(function (t) {
    document.getElementById("tab-" + t).hidden = t !== tab;
    var a = document.querySelector('nav a[data-tab="' + t + '"]');
    if (t === tab) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  if (tab === "results" && !state.results) loadResults();
  if (tab === "week" && !state.week) loadWeek();
}
window.addEventListener("hashchange", showTab);

// ---- Outcomes ----
function outcomeMenu(personId) {
  var lab = el("label", "respond", "They responded");
  var sel = el("select");
  var first = el("option", "", "Choose…"); first.value = ""; sel.appendChild(first);
  OUTCOMES.forEach(function (o) { var op = el("option", "", o[1]); op.value = o[0]; sel.appendChild(op); });
  sel.onchange = function () {
    var kind = sel.value; if (!kind) return;
    if (kind === "stop_request" && !confirm("Asked to stop is permanent: they will never be suggested again, on any channel. Record it?")) { sel.value = ""; return; }
    var note = kind === "reply" || kind === "meeting_booked" ? (prompt("A short note (optional), e.g. what they said or the meeting date:") || "") : "";
    sel.disabled = true;
    post("/api/people/" + personId + "/outcome", { kind: kind, note: note }).then(function (r) {
      toast(r.kade && r.kade.sent ? "Recorded in KADE." : "Saved. It will reach KADE on the next retry.");
      return load();
    }).catch(function (e) { toast(e.message); sel.disabled = false; sel.value = ""; });
  };
  lab.appendChild(sel);
  return lab;
}

// ---- Today ----
function actionCard(a, draftLabel) {
  var c = el("article", "card" + (a.status !== "todo" ? " done" : ""));
  var head = a.action_type === "reshare"
    ? add(el("div", "head"), el("span", "name", a.post_title || "Company page post"), el("span", "muted", "from the company page"))
    : add(el("div", "head"), el("span", "name", a.full_name), el("span", "muted", who(a)));
  var tags = el("span", "tags");
  if (a.status === "todo" && state.today && a.action_date < state.today) tags.appendChild(el("span", "tag warn", "From " + nice(a.action_date)));
  if (a.segment === "influencer") tags.appendChild(el("span", "tag ok", "Influencer"));
  if (a.partner_type) tags.appendChild(el("span", "tag ok", "Partner"));
  if (a.pursued) tags.appendChild(el("span", "tag accent", "Pursuit"));
  if (a.kade_tier) tags.appendChild(el("span", "tag", a.kade_tier.charAt(0).toUpperCase() + a.kade_tier.slice(1)));
  head.appendChild(tags);
  add(c, head, el("div", "muted small", a.reason));
  if (a.action_type === "comment" && a.status === "todo" && a.text == null) return commentStart(c, a);
  if (a.status !== "todo") {
    var line = el("div", "ok-line"); line.appendChild(check());
    line.appendChild(document.createTextNode(a.status === "done" ? "Done · recorded in KADE" : "Skipped"));
    if (a.status !== "done") line.style.color = "var(--muted)";
    c.appendChild(line);
    return c;
  }
  var ta = null;
  if (a.text != null) {
    var id = "t-" + a.id;
    var lab = el("label", "field", draftLabel || "Draft"); lab.setAttribute("for", id);
    ta = el("textarea"); ta.id = id; ta.rows = 3; ta.value = a.text;
    add(c, lab, ta, counter(ta, LIMITS[a.action_type] || 600));
  }
  var bar = el("div", "actions");
  if (ta && a.target_url) {
    bar.appendChild(button(a.action_type === "comment" ? "Copy and open their activity" : a.action_type === "reshare" ? "Copy and open company page" : "Copy and open profile", "outline", function () {
      navigator.clipboard.writeText(ta.value).then(function () { toast("Copied. Paste it on LinkedIn."); }).catch(function () {});
      window.open(a.target_url, "_blank", "noopener");
    }));
  } else if (a.target_url) bar.appendChild(link("Open profile", a.target_url, "outline"));
  else if (ta) bar.appendChild(button("Copy text", "outline", function () { navigator.clipboard.writeText(ta.value).then(function () { toast("Copied"); }); }));
  var done = button("Done", "primary", function () {
    if (ta && ta.value.length > (LIMITS[a.action_type] || 600)) { toast("Too long for LinkedIn. Shorten it first."); return; }
    done.disabled = true;
    post("/api/actions/" + a.id, { status: "done", text: ta ? ta.value : undefined }).then(load).catch(function (e) { toast(e.message); done.disabled = false; });
  });
  bar.appendChild(done);
  bar.appendChild(button("Skip", "", function () { post("/api/actions/" + a.id, { status: "skipped" }).then(load).catch(function (e) { toast(e.message); }); }));
  if (a.action_type === "connect" && a.person_id && !a.partner_type && a.segment !== "influencer") {
    var ei = button("Email instead", "quiet", function () {
      ei.disabled = true;
      post("/api/actions/" + a.id + "/email-instead").then(function (r) { toast("KADE will draft an email to " + r.email + " tomorrow morning."); return load(); })
        .catch(function (e) { toast(e.message); ei.disabled = false; });
    });
    bar.appendChild(ei);
  }
  if (a.action_type === "connect" && a.person_id) {
    var ac = button("Already connected", "quiet", function () {
      ac.disabled = true;
      post("/api/people/" + a.person_id + "/already-connected").then(function () { toast("Marked connected. They move to follow-ups and comments."); return load(); })
        .catch(function (e) { toast(e.message); ac.disabled = false; });
    });
    bar.appendChild(ac);
  }
  if (ta) {
    var rd = button(a.drafted_by === "template" ? "Redraft with Claude" : "Redraft", "quiet", function () {
      rd.disabled = true; rd.textContent = "Drafting…";
      post("/api/actions/" + a.id + "/redraft").then(function (r) { ta.value = r.text; ta.dispatchEvent(new Event("input")); rd.disabled = false; rd.textContent = "Redraft"; toast("Redrafted"); })
        .catch(function (e) { toast(e.message); rd.disabled = false; rd.textContent = "Redraft"; });
    });
    bar.appendChild(rd);
  }
  if (a.kade_url) bar.appendChild(link("KADE", a.kade_url, "quiet"));
  if (a.action_type === "follow_up") bar.appendChild(outcomeMenu(a.person_id));
  c.appendChild(bar);
  return c;
}

// A comment starts with the post: open their activity, paste a post worth answering, then draft.
function commentStart(c, a) {
  var id = "p-" + a.id;
  var lab = el("label", "field", "Paste the post you want to comment on"); lab.setAttribute("for", id);
  var ta = el("textarea"); ta.id = id; ta.rows = 4; ta.placeholder = "Open their recent activity, pick a post from the last few weeks, and paste its text here.";
  add(c, lab, ta);
  var bar = el("div", "actions");
  if (a.target_url) bar.appendChild(link("Open their recent activity", a.target_url, "outline"));
  var go = button("Draft comment", "primary", function () {
    if (ta.value.trim().length < 20) { toast("Paste the post's text first."); return; }
    go.disabled = true; go.textContent = "Drafting…";
    post("/api/actions/" + a.id + "/comment-draft", { postText: ta.value }).then(function (r) {
      if (r.error) toast("Claude was unavailable; a simple draft is in. Edit it or press Redraft.");
      return load();
    }).catch(function (e) { toast(e.message); go.disabled = false; go.textContent = "Draft comment"; });
  });
  bar.appendChild(go);
  bar.appendChild(button("No recent post", "", function () { post("/api/actions/" + a.id, { status: "skipped" }).then(load).catch(function (e) { toast(e.message); }); }));
  c.appendChild(bar);
  return c;
}

function renderInfluencers(list) {
  var box = document.getElementById("influencers"); box.textContent = "";
  document.getElementById("influencercount").textContent = String(list.length);
  if (!list.length) box.appendChild(el("p", "empty", "No one yet. Add industry voices, partners and associations whose posts you want to engage with."));
  list.forEach(function (p) {
    var it = el("div", "item"); it.style.flexDirection = "row"; it.style.alignItems = "center"; it.style.gap = "10px";
    var txt = el("div"); txt.style.cssText = "flex:1;min-width:0";
    var nm = el("a", "name", p.full_name); nm.href = p.linkedin_url; nm.target = "_blank"; nm.rel = "noopener"; nm.style.cssText = "font-size:14px;color:var(--ink)";
    var sub = [who(p), p.last_comment ? "last comment " + nice(p.last_comment) : "no comment yet"].filter(Boolean).join(" · ");
    add(txt, nm, el("div", "muted small", sub));
    var rm = button("Remove", "quiet small", function () {
      if (!confirm("Remove " + p.full_name + " from your influencer list?")) return;
      post("/api/influencers/" + p.id + "/remove").then(loadInfluencers).catch(function (e) { toast(e.message); });
    });
    add(it, txt, rm); box.appendChild(it);
  });
}
function loadInfluencers() {
  return fetch("/api/influencers").then(function (r) { return r.json(); }).then(function (d) { renderInfluencers(d.influencers || []); })
    .catch(function (e) { document.getElementById("influencers").textContent = "Could not load: " + e.message; });
}
// The connections export: matched here, then sent to KADE a batch at a time.
document.getElementById("connfile").onchange = function (e) {
  var f = e.target.files && e.target.files[0]; if (!f) return;
  var msg = document.getElementById("connmsg");
  msg.textContent = "Reading " + f.name + "…";
  f.text().then(function (csv) { msg.textContent = "Matching your connections…"; return post("/api/connections/import", { csv: csv }); })
    .then(function (r) {
      msg.textContent = r.inFile + " connections in the file; " + r.matched + " matched people on the list (" + r.byProfile + " by profile address, " + r.byName + " by name and organization), " +
        r.acceptedInvites + " of them accepted invitations. Recording them in KADE…";
      var sent = 0;
      function next() {
        return post("/api/kade/flush?limit=40").then(function (x) {
          sent += x.sent || 0;
          if ((x.sent || 0) > 0) { msg.textContent = msg.textContent.replace(/ Recording them in KADE.*$/, "") + " Recording them in KADE… " + sent + " so far."; return next(); }
          msg.textContent = msg.textContent.replace(/ Recording them in KADE.*$/, "") + " Recorded in KADE: " + sent + (x.failed ? "; the rest retry each morning." : ".");
        });
      }
      return next().then(load);
    })
    .catch(function (err) { msg.textContent = err.message; })
    .then(function () { e.target.value = ""; });
};

// ---- Partners (KADE docs/partners.md) ----
var PARTNER_KINDS = { fractional_finance: "Fractional CFO or controller", fractional_hr: "Fractional CHRO", deal_advisor: "Deal advisor", erp_recruiter: "ERP or recruiter" };
var PARTNER_STAGES = { "new": "Not invited yet", invited: "Invited", connected: "Connected", talking: "Talking", met: "Met", referring: "Referring" };
function renderPartners(list) {
  var box = document.getElementById("partners"); box.textContent = "";
  document.getElementById("partnercount").textContent = String(list.length);
  if (!list.length) box.appendChild(el("p", "empty", "No partners yet. KADE's first search runs Monday morning."));
  list.slice(0, 30).forEach(function (p) {
    var it = el("div", "item");
    var nm = el("a", "name", p.full_name); nm.href = p.linkedin_url || "#"; nm.target = "_blank"; nm.rel = "noopener"; nm.style.cssText = "font-size:14px;color:var(--ink)";
    var sub = [PARTNER_KINDS[p.partner_type] || "Partner", p.organization, PARTNER_STAGES[p.partner_stage] || p.partner_stage,
      p.partner_check_in_on ? "check in " + nice(p.partner_check_in_on) : null].filter(Boolean).join(" · ");
    add(it, nm, el("div", "muted small", sub));
    box.appendChild(it);
  });
  if (list.length > 30) box.appendChild(el("p", "muted small", "And " + (list.length - 30) + " more."));
}
function loadPartners() {
  return fetch("/api/partners").then(function (r) { return r.json(); }).then(function (d) { renderPartners(d.partners || []); })
    .catch(function (e) { document.getElementById("partners").textContent = "Could not load: " + e.message; });
}
document.getElementById("partnerform").onsubmit = function (e) {
  e.preventDefault();
  var body = {}; new FormData(e.target).forEach(function (v, k) { body[k] = v; });
  post("/api/partners", body).then(function () { toast("Added in KADE. They come up for an invitation from tomorrow."); e.target.reset(); return loadPartners(); })
    .catch(function (err) { toast(err.message); });
};

// ---- Email (KADE docs/outreach-email.md) ----
var SUGGESTED = { meeting_booked: "Meeting booked", not_interested: "Not interested", stop_request: "Asked to stop", reply: "Just a reply" };
function renderInbox(d) {
  var box = document.getElementById("inbox"); box.textContent = "";
  var badge = document.getElementById("emailbadge");
  var n = d.replies.length + d.drafts.old.length;
  badge.hidden = !n; badge.textContent = String(n);
  var dr = d.drafts;
  box.appendChild(el("p", "small", dr.waiting + " in Gmail Drafts · " + dr.sentThisWeek + " sent this week" + (dr.requested ? " · " + dr.requested + " asked for tomorrow" : "")));
  if (dr.old.length) {
    var o = el("div", "item");
    o.appendChild(el("div", "small", "Waiting over 3 days (send or delete them; KADE removes them on the date shown):"));
    dr.old.forEach(function (x) { o.appendChild(el("div", "muted small", x.full_name + (x.organization ? ", " + x.organization : "") + " · removed " + nice(x.removedOn))); });
    box.appendChild(o);
  }
  d.replies.forEach(function (r) {
    var it = el("div", "item");
    add(it, add(el("div", "head"), el("span", "name", r.full_name), el("span", "muted small", (r.organization || "") + " · " + nice(r.occurred_at.slice(0, 10)))));
    if (r.note) it.appendChild(el("div", "small", r.note));
    it.appendChild(el("div", "muted small", "Suggested: " + (SUGGESTED[r.suggested_outcome] || r.suggested_outcome) + (r.suggestion_note ? ". " + r.suggestion_note : "")));
    var bar = el("div", "head");
    var setAside = function () { return post("/api/replies/" + encodeURIComponent(r.id) + "/dismiss").then(loadInbox); };
    if (r.suggested_outcome !== "reply" && r.local_person_id) {
      var ok = button("Confirm: " + SUGGESTED[r.suggested_outcome], "primary small", function () {
        ok.disabled = true;
        post("/api/people/" + r.local_person_id + "/outcome", { kind: r.suggested_outcome, note: "Confirmed from KADE's suggestion" })
          .then(function () { toast("Recorded."); return load(); }).then(loadInbox).catch(function (e) { toast(e.message); ok.disabled = false; });
      });
      bar.appendChild(ok);
    }
    bar.appendChild(button(r.suggested_outcome === "reply" ? "OK, nothing to record" : "Not that: set aside", "quiet small", function () { setAside().catch(function (e) { toast(e.message); }); }));
    it.appendChild(bar);
    if (r.local_person_id) it.appendChild(outcomeMenu(r.local_person_id));
    else it.appendChild(el("div", "muted small", "Not on the daily list: record an outcome in KADE."));
    box.appendChild(it);
  });
  if (!d.replies.length) box.appendChild(el("p", "empty", "No email replies waiting."));
}
function loadInbox() {
  return fetch("/api/inbox").then(function (r) { return r.json(); }).then(function (d) { if (d.error) throw new Error(d.error); renderInbox(d); })
    .catch(function (e) { document.getElementById("inbox").textContent = "Could not load: " + e.message; });
}

document.getElementById("influencerform").onsubmit = function (e) {
  e.preventDefault();
  var body = {}; new FormData(e.target).forEach(function (v, k) { body[k] = v; });
  post("/api/influencers", body).then(function () { toast("Added. They join the comment rotation from tomorrow."); e.target.reset(); return loadInfluencers(); })
    .catch(function (err) { toast(err.message); });
};

// Actions in groups (follow-ups, comments, reshares, invitations); carried-over items come first in each group.
function renderActions(box, actions) {
  GROUPS.forEach(function (g) {
    var items = actions.filter(function (a) { return a.action_type === g[0]; });
    if (!items.length) return;
    var sec = el("section"); sec.style.cssText = "display:flex;flex-direction:column;gap:10px;margin-bottom:16px";
    sec.appendChild(el("h3", "group", g[1] + " · " + items.length));
    items.forEach(function (a) { sec.appendChild(actionCard(a, g[2])); });
    box.appendChild(sec);
  });
}
function renderToday(d) {
  var box = document.getElementById("list"); box.textContent = "";
  // Partners have their own tab (KADE docs/partners.md); everything else is prospecting.
  var prospects = d.actions.filter(function (a) { return !a.partner_type; });
  var partners = d.actions.filter(function (a) { return a.partner_type; });
  var todo = prospects.filter(function (a) { return a.status === "todo"; }).length;
  var doneN = prospects.length - todo;
  document.getElementById("progress").style.width = (prospects.length ? Math.round(100 * doneN / prospects.length) : 0) + "%";
  var carried = prospects.filter(function (a) { return a.status === "todo" && a.action_date < d.date; }).length;
  if (carried) box.appendChild(el("p", "muted small", carried + " not done from earlier days (they stay for 7 days, oldest first)."));
  if (!d.actions.some(function (a) { return a.action_date === d.date; })) {
    var day = new Date(d.date + "T12:00:00Z").getUTCDay();
    box.appendChild(el("p", "empty", day === 0 || day === 6 ? "No new list on weekends." + (todo ? " Catch up on what's below if you like." : "") : "No list for today yet. It is built each weekday at 5 a.m. ET."));
    if (day !== 0 && day !== 6) {
      var b = button("Build today's list now", "primary", function () { b.disabled = true; b.textContent = "Drafting…"; post("/api/today/build").then(load).catch(function (e) { toast(e.message); b.disabled = false; }); });
      box.appendChild(b);
    }
  }
  renderActions(box, prospects);
  var pbox = document.getElementById("partnerlist"); pbox.textContent = "";
  if (!partners.length) pbox.appendChild(el("p", "empty", "No partner invitations or check-ins right now."));
  renderActions(pbox, partners);

  var cbox = document.getElementById("contacts"); cbox.textContent = "";
  if (!d.contacts.length) cbox.appendChild(el("p", "empty", "No conversations, and no one connected in the last 60 days."));
  d.contacts.forEach(function (p) {
    var it = el("div", "item");
    add(it, add(el("div", "head"), el("span", "name", p.full_name), el("span", "muted small", who(p))));
    var line = el("div", "head");
    line.appendChild(el("span", "tag " + (p.contact_state === "in_conversation" ? "ok" : ""), p.contact_state === "in_conversation" ? "In conversation" : "Connected " + nice((p.connected_at || "").slice(0, 10))));
    it.appendChild(line);
    var bar = el("div", "actions");
    if (p.linkedin_url) bar.appendChild(link("Open profile", p.linkedin_url, "small"));
    if (p.contact_state === "in_conversation") {
      var close = button("Close conversation", "small", function () { close.disabled = true; post("/api/people/" + p.person_id + "/outcome", { kind: "conversation_closed" }).then(load).catch(function (e) { toast(e.message); close.disabled = false; }); });
      bar.appendChild(close);
    }
    bar.appendChild(outcomeMenu(p.person_id));
    it.appendChild(bar);
    cbox.appendChild(it);
  });

  var pbox = document.getElementById("pending"); pbox.textContent = "";
  document.getElementById("pendingcount").textContent = String(d.pending.length);
  var shown = state.showAllPending ? d.pending : d.pending.slice(0, 4);
  if (!d.pending.length) pbox.appendChild(el("p", "empty", "No pending invites."));
  shown.forEach(function (p) {
    var it = el("div", "item"); it.style.flexDirection = "row"; it.style.alignItems = "center"; it.style.gap = "10px";
    var txt = el("div"); txt.style.cssText = "flex:1;min-width:0";
    add(txt, el("div", "name", p.full_name), el("div", "muted small", who(p) + " · invited " + nice((p.invited_at || "").slice(0, 10))));
    txt.firstChild.style.fontSize = "14px";
    var b = button("Accepted", "outline small", function () { b.disabled = true; post("/api/people/" + p.person_id + "/connected").then(load).catch(function (e) { toast(e.message); b.disabled = false; }); });
    add(it, txt, b);
    pbox.appendChild(it);
  });
  if (d.pending.length > 4) {
    var more = button(state.showAllPending ? "Show fewer" : "Show all " + d.pending.length, "quiet small", function () { state.showAllPending = !state.showAllPending; renderToday(d); });
    more.style.justifyContent = "flex-start"; more.style.padding = "0";
    pbox.appendChild(more);
  }
}

function renderStatus(d) {
  var s = document.getElementById("status"); s.textContent = "";
  var todo = d.actions.filter(function (a) { return a.status === "todo"; }).length;
  function pill(strong, rest, cls) { var p = el("span", "pill" + (cls ? " " + cls : "")); var b = el("b", "", strong); p.appendChild(b); p.appendChild(document.createTextNode(rest)); return p; }
  s.appendChild(pill((d.actions.length - todo) + " of " + d.actions.length, " done today"));
  s.appendChild(pill(String(d.pending.length), " invites pending"));
  var conv = d.contacts.filter(function (p) { return p.contact_state === "in_conversation"; }).length;
  s.appendChild(pill(String(conv), " in conversation"));
  s.appendChild(pill(String(d.openGaps), " hot accounts waiting for research in KADE"));
  if (d.unsentToKade) s.appendChild(pill(String(d.unsentToKade), " not yet in KADE (retried each morning)", "warn"));
  else s.appendChild(el("span", "pill ok", "All recorded in KADE"));
}

// ---- Posts ----
function renderPosts() {
  var days = document.getElementById("days"); days.textContent = "";
  var detail = document.getElementById("postdetail"); detail.textContent = "";
  var open = state.posts.filter(function (p) { return p.status === "proposed"; }).length;
  var badge = document.getElementById("postbadge"); badge.hidden = !open; badge.textContent = String(open);
  if (!state.posts.length) { days.appendChild(el("p", "empty", "No upcoming posts. Monday mornings fill the week.")); detail.appendChild(el("p", "empty", "Nothing to show.")); return; }
  if (!state.picked || !state.posts.some(function (p) { return p.id === state.picked; })) {
    var next = state.posts.filter(function (p) { return p.status === "proposed"; })[0] || state.posts[0];
    state.picked = next.id;
  }
  state.posts.forEach(function (p) {
    var d = new Date(p.due_date + "T12:00:00Z");
    var st = p.status === "sent" ? "Posted" : p.status === "rejected" ? "Skipped" : p.due_date === state.today ? "Today" : p.due_date < state.today ? "Not posted yet" : "Draft";
    var b = el("button", "day"); b.type = "button"; b.setAttribute("aria-pressed", p.id === state.picked ? "true" : "false");
    var line = el("span", "line");
    var s = el("span", "small", st); s.style.fontWeight = "600"; s.style.color = st === "Posted" ? "var(--ok)" : st === "Today" ? "var(--accent)" : st === "Not posted yet" ? "var(--warn)" : "var(--muted)";
    add(line, el("span", "name", DAYS[d.getUTCDay()] + " " + nice(p.due_date)), s);
    add(b, line, el("span", "muted small", postKind(p) + " · " + (p.title || "")));
    b.onclick = function () { state.picked = p.id; renderPosts(); };
    days.appendChild(b);
  });
  var p = state.posts.filter(function (x) { return x.id === state.picked; })[0];
  var head = el("div", "head");
  var t = el("h2", "", p.title || "Post"); t.style.fontSize = "18px";
  add(head, t, el("span", "tag", postKind(p)));
  if (p.context && p.context.source) head.appendChild(el("span", "muted small", "From: " + p.context.source));
  detail.appendChild(head);
  var lab = el("label", "field", p.item_type === "short_video" ? "Caption to post with the video" : "Post text"); lab.setAttribute("for", "posttext");
  var ta = el("textarea"); ta.id = "posttext"; ta.rows = 11; ta.value = p.text || ""; ta.disabled = p.status !== "proposed";
  add(detail, lab, ta, counter(ta, 3000));
  var v = p.context && p.context.visual;
  if (v && v.format && v.format !== "text_only") {
    var vb = el("div", "visual");
    var top = el("div", "head"); top.style.justifyContent = "space-between";
    top.appendChild(el("span", "label", p.item_type === "short_video" ? "Script to camera (30 to 45 seconds)" : "Suggested visual: " + (VISUALS[v.format] || v.format)));
    top.appendChild(button("Copy for Canva", "small", function () { navigator.clipboard.writeText([v.headline, v.notes].filter(Boolean).join("\\n\\n")).then(function () { toast("Copied"); }); }));
    vb.appendChild(top);
    if (v.headline) vb.appendChild(el("div", "name", v.headline));
    if (v.notes) { var nt = el("div", p.item_type === "short_video" ? "small" : "muted small", v.notes); nt.style.whiteSpace = "pre-wrap"; vb.appendChild(nt); }
    detail.appendChild(vb);
  }
  var bar = el("div", "actions");
  if (p.status === "proposed") {
    bar.appendChild(button("Copy text", "outline", function () { navigator.clipboard.writeText(ta.value).then(function () { toast("Copied"); }); }));
    if (p.context && p.context.link) bar.appendChild(link("Open link", p.context.link));
    var done = button("Posted", "primary", function () { done.disabled = true; post("/api/posts/" + p.id, { status: "posted", text: ta.value }).then(load).catch(function (e) { toast(e.message); done.disabled = false; }); });
    bar.appendChild(done);
    bar.appendChild(button("Skip", "", function () { post("/api/posts/" + p.id, { status: "skipped" }).then(load).catch(function (e) { toast(e.message); }); }));
  } else {
    bar.appendChild(el("span", "muted", p.status === "sent" ? "Posted" + (p.approved_by ? " by " + p.approved_by : "") : "Skipped"));
  }
  detail.appendChild(bar);
}
document.getElementById("buildposts").onclick = function () {
  var b = document.getElementById("buildposts");
  b.disabled = true; b.textContent = "Drafting… (up to a minute)";
  post("/api/posts/build").then(function (r) {
    if (r.skipped) toast("Not drafted: " + r.reason); else if (!r.posts) toast("Claude returned no posts. Try again."); else toast(r.posts + " posts drafted.");
    return load();
  }).catch(function (e) { toast(e.message); }).then(function () { b.disabled = false; b.textContent = "Draft upcoming posts now"; });
};

// ---- Results ----
function mondays(n) {
  var d = new Date(); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  var out = []; for (var i = 0; i < n; i++) { out.push(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() - 7); }
  return out;
}
function pct(a, b) { return b ? Math.round(100 * a / b) + "%" : "–"; }
// ---- This week (KADE's weekly plan, plus this week's posts and the LinkedIn numbers) ----
function loadWeek() {
  return fetch("/api/week").then(function (r) { return r.json(); }).then(function (d) { state.week = d; renderWeek(); })
    .catch(function (e) { document.getElementById("wkdecide").textContent = "Could not load the plan: " + e.message; });
}
function line(parent, text, cls) { return add(parent, el("p", cls || "", text)); }
function renderWeek() {
  var d = state.week, p = d.plan;
  ["wkdecide", "wksuggest", "wkmarket", "wkmotion", "wkposts", "wkresults", "wkevents"].forEach(function (id) { document.getElementById(id).textContent = ""; });
  var posts = document.getElementById("wkposts");
  if (!d.posts.length) line(posts, "No posts scheduled this week.", "empty");
  d.posts.forEach(function (x) {
    add(posts, add(el("p", "small"), el("b", "", nice(x.due_date) + " "), document.createTextNode(postKind(x) + ": " + (x.title || "Post") + " "), el("span", "muted", "(" + x.status + ")")));
  });
  var ev = document.getElementById("wkevents"), e = d.events;
  if (!e || e.error) line(ev, e && e.error ? "KADE's events are not available." : "No events yet.", "empty");
  else {
    var waiting = e.proposals.filter(function (x) { return x.status === "proposed"; }).length;
    if (waiting) { var wl = el("a", "", waiting + " proposals for this month to approve or decline in KADE"); wl.href = d.kadeEventsUrl; wl.target = "_blank"; wl.rel = "noopener"; add(ev, add(el("p", "small"), wl)); }
    e.upcoming.forEach(function (u) {
      line(ev, u.title + ": " + (u.starts_at && u.join_url ? new Date(u.starts_at).toLocaleDateString() + "; " + u.in_drafts + " invitations in Drafts, " + u.sent + " sent" : "set the date and registration link in KADE"), "small");
    });
    var sv = e.proposals.filter(function (x) { return x.kind === "short_video" && x.status === "approved"; });
    if (sv.length) line(ev, "Short videos approved: " + sv.map(function (x) { return x.title; }).join("; "), "small muted");
    if (!waiting && !e.upcoming.length && !sv.length) line(ev, "Nothing scheduled. Proposals come on the first Monday of the month.", "empty");
  }
  if (!p || p.error) {
    line(document.getElementById("wkdecide"), p && p.error ? "KADE's plan is not available: " + p.error : "No plan yet. KADE writes it Monday at 6:00 (or from KADE, Admin, Gmail: Write this week's plan now).", "empty");
    return;
  }
  document.getElementById("weektitle").textContent = "Week of " + nice(p.weekOf);
  document.getElementById("weeknote").textContent = "Written by KADE " + new Date(p.generatedAt).toLocaleString() + " from its records.";
  var decide = document.getElementById("wkdecide");
  var waiting = p.conversations.filter(function (c) { return c.waitingOnYou; });
  if (!p.decide.pursuits.length && !waiting.length) line(decide, "Nothing waiting on you.", "empty");
  p.decide.pursuits.forEach(function (x) {
    var a = el("a", "", x.name); a.href = x.kade_url; a.target = "_blank"; a.rel = "noopener";
    add(decide, add(el("div", "item"), add(el("p", ""), el("b", "", "Pursuit: "), a, el("span", "muted small", " · " + x.stage)), el("p", "small", x.ask)));
  });
  waiting.forEach(function (c) {
    var a = el("a", "", c.name); a.href = c.kade_url; a.target = "_blank"; a.rel = "noopener";
    add(decide, add(el("div", "item"), add(el("p", ""), el("b", "", "Reply to "), a, el("span", "muted small", c.organization ? " · " + c.organization : "")),
      el("p", "small muted", "They wrote " + new Date(c.lastReplyAt).toLocaleDateString() + "; nothing sent since.")));
  });
  var sug = document.getElementById("wksuggest");
  if (!p.suggestions.length) line(sug, p.suggestionsError ? "No suggestions this week (" + p.suggestionsError + ")." : "No suggestions this week.", "empty");
  p.suggestions.forEach(function (x) {
    add(sug, add(el("div", "item"), add(el("p", ""), el("b", "", x.title), el("span", "muted small", " · about " + x.hours + " h")), el("p", "small", x.why)));
  });
  var m = p.market, mk = document.getElementById("wkmarket");
  line(mk, m.newSignals.toLocaleString() + " new signals last week across " + m.hotAccounts.toLocaleString() + " hot accounts. " + m.touchedAccounts + " have had any contact; " + m.researchedLastWeek + " were researched last week.", "small");
  var ul = el("ul", "small");
  m.mix.forEach(function (x) { add(ul, el("li", "", x.label + ": " + x.n.toLocaleString())); });
  mk.appendChild(ul);
  var mo = p.inMotion, motion = document.getElementById("wkmotion");
  line(motion, mo.invitesPending + " LinkedIn invitations pending" + (mo.firstEmailFollowUp ? "; unanswered ones become email drafts from " + nice(mo.firstEmailFollowUp) : "") + ".", "small");
  line(motion, mo.draftsPerDay + " email drafts each weekday morning; " + mo.draftsWaiting + " waiting in your Drafts.", "small");
  line(motion, mo.emailsSentLastWeek + " emails sent last week.", "small");
  line(motion, p.conversations.length + " open conversation" + (p.conversations.length === 1 ? "" : "s") + ".", "small");
  var res = document.getElementById("wkresults"), lw = p.results.lastWeek || {}, wb = p.results.weekBefore || {};
  [["connect_sent", "Invites sent"], ["connect_accepted", "Accepted"], ["message_sent", "Messages and emails"], ["reply", "Replies"], ["meeting_booked", "Meetings"]].forEach(function (k) {
    line(res, k[1] + ": " + (lw[k[0]] || 0) + " (week before: " + (wb[k[0]] || 0) + ")", "small");
  });
  var mon = mondays(2)[1];
  line(res, d.linkedinLastEntered && d.linkedinLastEntered >= mon ? "LinkedIn numbers entered for the week of " + nice(d.linkedinLastEntered) + "." : "LinkedIn numbers for last week aren't entered yet (Results tab).", "small muted");
}

function loadResults() {
  return fetch("/api/results").then(function (r) { return r.json(); }).then(function (d) { state.results = d; renderResults(); renderPartnerResults(); })
    .catch(function (e) { document.getElementById("weektable").textContent = "Could not load results: " + e.message; });
}
function renderResults() {
  var d = state.results, weeks = mondays(4);
  var kadeOk = d.kade && !d.kade.error;
  var byWeek = {};
  if (kadeOk) d.kade.weeks.forEach(function (w) { byWeek[w.week] = w; });
  var posts = {}; d.posts.forEach(function (p) { posts[p.week] = (posts[p.week] || 0) + p.n; });
  function val(w, key) {
    if (key === "posts") return posts[w] || 0;
    var x = byWeek[w] || {};
    if (key === "rate") return pct(x.connect_accepted || 0, x.connect_sent || 0);
    return x[key] || 0;
  }
  function sum(key) {
    if (key === "posts") return d.posts.reduce(function (s, p) { return s + p.n; }, 0);
    if (!kadeOk) return 0;
    if (key === "rate") return pct(sum("connect_accepted"), sum("connect_sent"));
    return d.kade.weeks.reduce(function (s, w) { return s + (w[key] || 0); }, 0);
  }
  var tiles = document.getElementById("tiles"); tiles.textContent = "";
  [["connect_sent", "Invites sent", function () { return val(weeks[1], "connect_sent") + " last week"; }],
   ["rate", "Accept rate", function () { return val(weeks[1], "rate") + " last week"; }],
   ["reply", "Replies", function () { return sum("reply") + " in 8 weeks"; }],
   ["meeting_booked", "Meetings booked", function () { return sum("meeting_booked") + " in 8 weeks"; }]].forEach(function (t) {
    add(tiles, add(el("div", "tile"), el("span", "muted small", t[1]), el("span", "big", String(val(weeks[0], t[0]))), el("span", "muted small", t[2]())));
  });
  var box = document.getElementById("weektable"); box.textContent = "";
  if (!kadeOk) box.appendChild(el("p", "empty", "KADE results not available" + (d.kade && d.kade.error ? ": " + d.kade.error : "") + ". Posts and LinkedIn numbers are shown."));
  var table = el("table"), thead = el("thead"), hr = el("tr");
  hr.appendChild(el("th", "", ""));
  weeks.forEach(function (w) { var th = el("th", "", nice(w)); th.scope = "col"; hr.appendChild(th); });
  var th8 = el("th", "", "8 weeks"); th8.scope = "col"; hr.appendChild(th8);
  thead.appendChild(hr); table.appendChild(thead);
  var tb = el("tbody");
  ROWS.forEach(function (r) {
    if (!kadeOk && r[0] !== "posts") return;
    var tr = el("tr"), th = el("th", "", r[1]); th.scope = "row"; th.style.fontWeight = "500"; tr.appendChild(th);
    weeks.forEach(function (w) { tr.appendChild(el("td", "", String(val(w, r[0])))); });
    tr.appendChild(el("td", "total", String(sum(r[0]))));
    tb.appendChild(tr);
  });
  var stats = {}; d.linkedin.forEach(function (x) { (stats[x.week] = stats[x.week] || {})[x.metric] = x.value; });
  STATS.forEach(function (r) {
    var tr = el("tr"), th = el("th", "", r[1]); th.scope = "row"; th.style.fontWeight = "500"; tr.appendChild(th);
    weeks.forEach(function (w) { var v = (stats[w] || {})[r[0]]; tr.appendChild(el("td", "", v == null ? "–" : Number(v).toLocaleString())); });
    tr.appendChild(el("td", "", "")); tb.appendChild(tr);
  });
  table.appendChild(tb); box.appendChild(table);
  var entered = Object.keys(stats).sort().pop();
  document.getElementById("statslast").textContent = "From LinkedIn's analytics, once a week." + (entered ? " Last entered: week of " + nice(entered) + "." : "");
  var tr = document.getElementById("tracks"); tr.textContent = "";
  var tracks = kadeOk ? d.kade.tracks : [];
  if (!tracks.length) tr.appendChild(el("p", "empty", "No invitations in the last 8 weeks yet."));
  tracks.forEach(function (k) {
    var it = el("div", "item track");
    var head = el("div", "head"); head.style.justifyContent = "space-between";
    add(head, el("span", "name", k.track), el("span", "muted small", (k.connect_sent || 0) + " invites"));
    head.firstChild.style.fontSize = "15px";
    var rate = el("div", "rate"); rate.setAttribute("aria-hidden", "true");
    var fill = el("div"); fill.style.width = pct(k.connect_accepted || 0, k.connect_sent || 0).replace("–", "0%"); rate.appendChild(fill);
    add(it, head, rate, el("div", "small", (k.connect_accepted || 0) + " accepted (" + pct(k.connect_accepted || 0, k.connect_sent || 0) + ") · " + (k.reply || 0) + " replies · " + (k.meeting_booked || 0) + " meetings"));
    tr.appendChild(it);
  });
}
// Partners (KADE docs/partners.md), apart from prospects.
var PROWS = [["connect_sent", "Invites sent"], ["connect_accepted", "Accepted"], ["rate", "Accept rate"], ["message_sent", "Messages sent"],
  ["reply", "Replies"], ["meeting_booked", "Calls booked"], ["referral_received", "Referrals to you"], ["referral_given", "Referrals from you"]];
function renderPartnerResults() {
  var d = state.results, weeks = mondays(4);
  var p = d.kade && !d.kade.error ? d.kade.partners : null;
  var tiles = document.getElementById("ptiles"); tiles.textContent = "";
  var box = document.getElementById("pweektable"); box.textContent = "";
  var types = document.getElementById("ptypes"); types.textContent = "";
  var stages = document.getElementById("pstages"); stages.textContent = "";
  if (!p) { box.appendChild(el("p", "empty", "Partner results are not available yet.")); return; }
  var byWeek = {}; (p.weeks || []).forEach(function (w) { byWeek[w.week] = w; });
  function val(w, key) { var x = byWeek[w] || {}; return key === "rate" ? pct(x.connect_accepted || 0, x.connect_sent || 0) : (x[key] || 0); }
  function sum(key) {
    if (key === "rate") return pct(sum("connect_accepted"), sum("connect_sent"));
    return (p.weeks || []).reduce(function (s, w) { return s + (w[key] || 0); }, 0);
  }
  [["connect_sent", "Invites sent", function () { return val(weeks[1], "connect_sent") + " last week"; }],
   ["connect_accepted", "Accepted", function () { return val(weeks[1], "rate") + " accept rate last week"; }],
   ["meeting_booked", "Calls booked", function () { return sum("meeting_booked") + " in 8 weeks"; }],
   ["referral_received", "Referrals to you", function () { return sum("referral_received") + " in 8 weeks · " + sum("referral_given") + " from you"; }]].forEach(function (t) {
    add(tiles, add(el("div", "tile"), el("span", "muted small", t[1]), el("span", "big", String(val(weeks[0], t[0]))), el("span", "muted small", t[2]())));
  });
  stages.textContent = "Where they stand now: " + p.total + " partners · " + p.new + " not invited yet · " + p.invited + " invited · " + p.connected + " connected · "
    + p.talking + " talking · " + p.met + " met · " + p.referring + " referring" + (p.checkInsDue ? " · " + p.checkInsDue + " check-ins due" : "") + ".";
  var table = el("table"), thead = el("thead"), hr = el("tr");
  hr.appendChild(el("th", "", ""));
  weeks.forEach(function (w) { var th = el("th", "", nice(w)); th.scope = "col"; hr.appendChild(th); });
  var th8 = el("th", "", "8 weeks"); th8.scope = "col"; hr.appendChild(th8);
  thead.appendChild(hr); table.appendChild(thead);
  var tb = el("tbody");
  PROWS.forEach(function (r) {
    var tr = el("tr"), th = el("th", "", r[1]); th.scope = "row"; th.style.fontWeight = "500"; tr.appendChild(th);
    weeks.forEach(function (w) { tr.appendChild(el("td", "", String(val(w, r[0])))); });
    tr.appendChild(el("td", "total", String(sum(r[0]))));
    tb.appendChild(tr);
  });
  table.appendChild(tb); box.appendChild(table);
  var any = (p.types || []).filter(function (k) { return k.connect_sent || k.connect_accepted || k.meeting_booked || k.referral_received || k.referral_given; });
  if (!any.length) types.appendChild(el("p", "empty", "No partner invitations in the last 8 weeks yet."));
  any.forEach(function (k) {
    var it = el("div", "item track");
    var head = el("div", "head"); head.style.justifyContent = "space-between";
    add(head, el("span", "name", k.label), el("span", "muted small", (k.connect_sent || 0) + " invites"));
    head.firstChild.style.fontSize = "15px";
    var rate = el("div", "rate"); rate.setAttribute("aria-hidden", "true");
    var fill = el("div"); fill.style.width = pct(k.connect_accepted || 0, k.connect_sent || 0).replace("–", "0%"); rate.appendChild(fill);
    add(it, head, rate, el("div", "small", (k.connect_accepted || 0) + " accepted (" + pct(k.connect_accepted || 0, k.connect_sent || 0) + ") · " + (k.meeting_booked || 0) + " calls · "
      + (k.referral_received || 0) + " referrals to you · " + (k.referral_given || 0) + " from you"));
    types.appendChild(it);
  });
}
(function setupStats() {
  var sel = document.getElementById("statsweek");
  mondays(5).slice(1).forEach(function (w, i) { var o = el("option", "", "Week of " + nice(w)); o.value = w; if (i === 0) o.selected = true; sel.appendChild(o); });
  document.getElementById("statsform").onsubmit = function (e) {
    e.preventDefault();
    var body = {}; new FormData(e.target).forEach(function (v, k) { body[k] = v; });
    post("/api/results/linkedin", body).then(function () { toast("Saved."); e.target.reset(); sel.value = body.week; return loadResults(); }).catch(function (err) { toast(err.message); });
  };
})();

// ---- Load ----
function load() {
  return fetch("/api/today").then(function (r) { return r.json(); }).then(function (d) {
    if (d.error) { document.getElementById("date").textContent = d.error; return; }
    state.today = d.date;
    document.getElementById("date").textContent = longDate(d.date);
    document.getElementById("me").textContent = "Signed in as " + d.me;
    state.posts = d.posts;
    renderStatus(d);
    renderToday(d);
    renderPosts();
    if (state.results) loadResults();
  }).catch(function (e) { document.getElementById("date").textContent = "Could not load: " + e.message; });
}
showTab();
load();
loadInfluencers();
loadPartners();
loadInbox();
</script>
</body>
</html>`;
