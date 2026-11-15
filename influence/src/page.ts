/**
 * Influence: the page (KADE docs/influence.md). The same look as Network and Signals. Tabs: Network (the influence
 * network) and Posts (moved from Network). Text from the database is only set with textContent or value.
 * (No template literals inside the script below, because this whole page is itself a template literal.)
 */
export const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Influence</title>
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
/* Review: plain tables. */
table.data { width:100%; border-collapse:collapse; font-size:13px; }
table.data th, table.data td { text-align:right; padding:6px 8px; border-bottom:1px solid var(--soft); white-space:nowrap; }
table.data th:first-child, table.data td:first-child { text-align:left; }
table.data th { color:var(--muted); font-weight:600; }
table.data tr.base td { background:var(--soft); font-style:italic; }
.scroll { overflow-x:auto; }
.bar { height:6px; background:var(--soft); border-radius:3px; overflow:hidden; }
.bar > span { display:block; height:100%; background:var(--accent); }
/* Influence: plain fields in forms match the selects. */
.field input, .field textarea, #detail input, #detail textarea { min-height:40px; border:1px solid var(--fieldline); border-radius:8px; padding:8px 10px; background:var(--card); font:inherit; color:inherit; width:100%; box-sizing:border-box; }
</style>
</head>
<body>
<header>
  <div class="wrap">
    <div class="top">
      <div class="brand"><h1>Influence</h1><span class="muted" id="date"></span></div>
      <span class="muted small" id="me"></span>
    </div>
    <nav aria-label="Sections">
      <a href="#today" data-tab="today">Today</a>
      <a href="#network" data-tab="network">Network</a>
      <a href="#posts" data-tab="posts">Posts <span class="badge" id="postbadge" hidden></span></a>
      <a href="#ideas" data-tab="ideas">Ideas <span class="badge" id="ideabadge" hidden></span></a>
      <a href="#review" data-tab="review">Review <span class="badge" id="reviewbadge" hidden></span></a>
    </nav>
  </div>
</header>

<div class="wrap page">
  <section id="tab-today" class="split">
    <main class="main">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap">
        <h2 id="todayfocus">Today</h2><span class="muted small">Comment, connect and message by hand; record it here.</span>
      </div>
      <div id="progress" class="tiles"></div>
      <div id="todaylist"></div>
      <div id="outcomes"></div>
    </main>
    <aside class="side">
      <section class="panel" id="composer"></section>
    </aside>
  </section>

  <section id="tab-ideas" class="split" hidden>
    <main class="main">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap">
        <h2>Ideas</h2><span class="muted small">Mark an idea ready and Monday's drafting gives it a post.</span>
      </div>
      <div id="idealist"></div>
    </main>
    <aside class="side">
      <section class="panel" id="ideaform"></section>
    </aside>
  </section>

  <section id="tab-review" class="split" hidden>
    <main class="main" id="reviewmain"></main>
    <aside class="side" id="reviewside"></aside>
  </section>

  <section id="tab-network" class="split" hidden>
    <main class="main">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap">
        <h2>Your influence network</h2><span class="muted small" id="netsummary"></span>
      </div>
      <p class="muted small" style="margin:4px 0 12px">People who shape the conversations you want to be part of. Research proposes their scores with evidence and the tier follows; change any score and yours stands. The stage comes from what actually happened.</p>
      <div id="suggested"></div>
      <div id="tiers"></div>
      <div id="netlist"></div>
    </main>
    <aside class="side">
      <section class="panel">
        <h2 style="font-size:16px">Add someone</h2>
        <form id="addform" style="display:flex;flex-direction:column;gap:8px">
          <label class="field">Name <input name="name" required></label>
          <label class="field">LinkedIn profile address <input name="linkedinUrl" type="url" required placeholder="https://www.linkedin.com/in/…"></label>
          <label class="field">Role and organization (optional) <input name="affiliation"></label>
          <label class="field">Community <select name="community" id="addcommunity"></select></label>
          <label class="field">Type <select name="type" id="addtype"></select></label>
          <button class="btn primary">Add to the network</button>
        </form>
      </section>
      <section class="panel" id="detail" hidden></section>
    </aside>
  </section>

  <section id="tab-posts" class="split" hidden>
    <div class="days">
      <div><h2>Upcoming posts</h2><p class="muted small" style="margin:4px 0 0">Company page Mon, Wed, Fri. Your profile Tue, Thu. A Transformidable Thinking short video each week.</p></div>
      <div id="days" style="display:flex;flex-direction:column;gap:10px"></div>
      <button type="button" class="btn" id="buildposts" style="border-style:dashed">Draft upcoming posts now</button>
    </div>
    <section class="main panel" id="postdetail"></section>
  </section>
</div>
<div id="toast" role="status"></div>

<script>
var state = { today: null, posts: [], picked: null };
var VISUALS = { quote_graphic: "Quote graphic", carousel: "Carousel", short_video: "Video short", text_only: "Text only" };
function postKind(p) { return p.item_type === "short_video" ? "Short video" : p.channel === "page" ? "Company page" : "Your profile"; }
var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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


// ---- Network (KADE docs/influence.md, docs/influence-research.md) ----
var net = { people: [], suggested: [], candidates: {}, settings: null, screening: [], stages: {}, open: null, research: {} };
function label(list, key) { var x = (list || []).filter(function (i) { return i.key === key; })[0]; return x ? x.label : ""; }
function option(sel, value, text, cur) { var o = el("option", "", text); o.value = value; if (String(cur || "") === String(value)) o.selected = true; sel.appendChild(o); }
function fillSelect(sel, list, cur, blank) { sel.textContent = ""; option(sel, "", blank, cur); list.forEach(function (i) { option(sel, i.key, i.label, cur); }); }
function met(p) { var n = 0; var sc = p.screening || {}; Object.keys(sc).forEach(function (k) { if (sc[k] === true) n++; }); return n; }
function tierOf(score) { var t = net.settings.tiers.slice().sort(function (a, b) { return b.min - a.min; }).filter(function (x) { return score != null && score >= x.min; })[0]; return t ? t.tier : null; }
var KINDS = { article: "Article", podcast_host: "Podcast (host)", podcast_guest: "Podcast (guest)", talk: "Talk", newsletter: "Newsletter", report: "Report", book: "Book", press: "Press", other: "Other" };
var PLAN = [["why", "Why they matter"], ["function", "Which function benefits"], ["topics", "Topics to contribute on"], ["collaboration", "Collaboration areas"], ["cadence", "Cadence"], ["competitive", "Competitive notes"], ["objective", "First objective"]];
function findPerson(id) { return net.people.concat(net.suggested).filter(function (x) { return x.person_id === id; })[0]; }
function renderNetwork() {
  var s = net.settings, list = document.getElementById("netlist"), tiers = document.getElementById("tiers"), sug = document.getElementById("suggested");
  list.textContent = ""; tiers.textContent = ""; sug.textContent = "";
  document.getElementById("netsummary").textContent = net.people.length + " people";
  fillSelect(document.getElementById("addcommunity"), s.communities, "", "Choose later");
  fillSelect(document.getElementById("addtype"), s.types, "", "Choose later");
  var c = net.candidates || {};
  if (net.suggested.length || c.screening || c.notQualified) {
    var box = el("section", "panel"); box.style.marginBottom = "14px";
    var hd = el("div", "head"); hd.style.justifyContent = "space-between";
    add(hd, el("h2", "", "Suggested (" + net.suggested.length + ")"), el("span", "muted small", [c.screening ? c.screening + " being researched" : null, c.notQualified ? c.notQualified + " did not qualify" : null].filter(Boolean).join(" · ")));
    box.appendChild(hd);
    box.appendChild(el("p", "muted small", "Found by research: they meet at least 3 of the 7 conditions and score 50 or more. Follow them on LinkedIn yourself, then click Follow; or pass and they will not come back."));
    if (!net.suggested.length) box.appendChild(el("p", "empty", "No one waiting. New candidates arrive each week."));
    net.suggested.forEach(function (p) { box.appendChild(personItem(p, true)); });
    sug.appendChild(box);
  }
  var tile = el("div", "tiles");
  s.tiers.forEach(function (t) {
    var n = net.people.filter(function (p) { return p.tier === t.tier; }).length;
    add(tile, add(el("div", "tile"), el("span", "muted small", "Tier " + t.tier + ": " + t.label), el("span", "big", String(n)), el("span", "muted small", "target " + t.target)));
  });
  var unscored = net.people.filter(function (p) { return !p.tier; }).length;
  add(tile, add(el("div", "tile"), el("span", "muted small", "Not yet tiered"), el("span", "big", String(unscored)), el("span", "muted small", "research scores them")));
  tiers.appendChild(tile);
  if (net.signalsError) list.appendChild(el("p", "muted small", "Signals could not be reached for stages and marks: " + net.signalsError));
  if (!net.people.length) list.appendChild(el("p", "empty", "No one yet. Add the people whose conversations you want to be part of."));
  net.people.forEach(function (p) { list.appendChild(personItem(p, false)); });
  var run = button("Run research steps now", "small", function () {
    run.disabled = true; run.textContent = "Running… (up to a minute)";
    post("/api/research/run").then(function (r) {
      toast("Research asked for " + r.requested.queued + " people" + (r.requested.skipped ? " (" + r.requested.skipped + " already in progress or recently researched)" : "") + (r.requested.discovery === "queued" ? ", plus this week's discovery" : r.requested.discovery ? "; this week's discovery is already running" : "") + ". " + r.taken.added + " new candidates; " + r.scored.scored + " scored.");
      return loadNetwork();
    }).catch(function (e) { toast(e.message); run.disabled = false; run.textContent = "Run research steps now"; });
  });
  run.style.marginTop = "12px"; list.appendChild(run);
  renderDetail();
}
function personItem(p, candidate) {
  var s = net.settings;
  var it = el("div", "item"); it.style.cursor = "pointer";
  var head = el("div", "head");
  var tags = el("span", "tags");
  if (candidate) tags.appendChild(el("span", "tag", "Would be Tier " + (tierOf(p.score) || "?") + " · " + met(p) + " of 7"));
  else tags.appendChild(el("span", "tag", p.tier ? "Tier " + p.tier : "Not tiered"));
  if (p.prospect) tags.appendChild(el("span", "tag warn", "Prospect"));
  if (p.partner) tags.appendChild(el("span", "tag ok", "Partner"));
  add(head, el("span", "name", p.full_name), tags);
  it.appendChild(head);
  it.appendChild(el("div", "muted small", [label(s.communities, p.community), label(s.types, p.type), candidate ? null : (net.stages[p.stage] || p.stage),
    p.score != null ? "score " + Math.round(p.score) : null].filter(Boolean).join(" · ")));
  if (p.affiliation || p.signals_role) it.appendChild(el("div", "small", p.affiliation || p.signals_role));
  if (candidate && p.why) it.appendChild(el("div", "small", p.why));
  if (!candidate && p.next_action) it.appendChild(el("div", "small", "Next: " + p.next_action));
  it.onclick = function () { net.open = p.person_id; renderDetail(); loadResearch(p.person_id); };
  return it;
}
function loadResearch(id) {
  return fetch("/api/network/" + encodeURIComponent(id) + "/research").then(function (r) { return r.json(); }).then(function (d) {
    if (d.error) throw new Error(d.error);
    net.research[id] = d; if (net.open === id) renderDetail();
  }).catch(function (e) { net.research[id] = { error: e.message }; if (net.open === id) renderDetail(); });
}
function researchBlock(p) {
  var wrap = el("div", ""); wrap.style.cssText = "display:flex;flex-direction:column;gap:6px;margin:10px 0";
  var r = net.research[p.person_id];
  var top = el("div", "head"); top.style.justifyContent = "space-between";
  top.appendChild(el("span", "label", "Research"));
  var again = button("Research now", "small", function () {
    again.disabled = true;
    post("/api/network/" + encodeURIComponent(p.person_id) + "/research").then(function (x) {
      toast(x.queued ? "Asked. Signals researches within the next few minutes; scores follow within the hour." : "Not asked: " + x.reason);
      return loadResearch(p.person_id);
    }).catch(function (e) { toast(e.message); again.disabled = false; });
  });
  top.appendChild(again);
  wrap.appendChild(top);
  if (!r) { wrap.appendChild(el("span", "muted small", "Loading…")); return wrap; }
  if (r.error) { wrap.appendChild(el("span", "muted small", "Could not load: " + r.error)); return wrap; }
  wrap.appendChild(el("span", "muted small", [r.researched_at ? "Last researched " + nice(r.researched_at.slice(0, 10)) : "Not researched yet", r.waiting ? "research in progress" : null, r.checking ? r.checking + (r.checking === 1 ? " page" : " pages") + " being checked" : null].filter(Boolean).join(" · ")));
  if (r.researched_at && !r.appearances.length) wrap.appendChild(el("span", "muted small", "No public work found."));
  r.appearances.slice(0, 12).forEach(function (a) {
    var row = el("div", "small");
    var t = el("a", "", a.title || a.url); t.href = a.url; t.target = "_blank"; t.rel = "noopener";
    add(row, t, el("div", "muted small", [a.published_date ? nice(a.published_date) : null, KINDS[a.kind] || a.kind, a.outlet, a.confirmed ? null : "unconfirmed"].filter(Boolean).join(" · ")));
    wrap.appendChild(row);
  });
  if (r.appearances.length > 12) wrap.appendChild(el("span", "muted small", (r.appearances.length - 12) + " more"));
  return wrap;
}
function screeningBlock(p) {
  if (!p.screening) return null;
  var wrap = el("div", ""); wrap.style.margin = "6px 0 10px";
  wrap.appendChild(el("div", "label", "Screening: " + met(p) + " of 7 met"));
  net.screening.forEach(function (c) {
    var v = p.screening[c.key];
    wrap.appendChild(el("div", "small", (v === true ? "Yes · " : v === false ? "No · " : "Unknown · ") + c.label));
  });
  return wrap;
}
function renderDetail() {
  var box = document.getElementById("detail"), s = net.settings;
  var p = findPerson(net.open);
  box.hidden = !p; box.textContent = "";
  if (!p) return;
  var candidate = p.status === "candidate";
  var head = el("div", "head"); head.style.justifyContent = "space-between";
  add(head, el("h2", "", p.full_name), p.linkedin_url ? link("LinkedIn", p.linkedin_url, "small") : null);
  box.appendChild(head);
  if (p.affiliation || p.signals_role) box.appendChild(el("div", "small", p.affiliation || p.signals_role));
  if (p.prospect) box.appendChild(el("p", "small", "A prospect in Signals: decide knowingly before featuring them publicly, and never make the connection identifiable."));
  if (candidate) {
    if (p.why) box.appendChild(el("p", "small", p.why));
    box.appendChild(el("div", "label", "Scores from research: " + (p.score != null ? Math.round(p.score) : "not enough known")));
    s.criteria.forEach(function (c) {
      var cur = p.scores[c.key] || {};
      box.appendChild(el("div", "small", c.label + ": " + (cur.score != null ? cur.score + " of 5" : "unknown")));
      if (cur.evidence) box.appendChild(el("div", "muted small", cur.evidence));
    });
    add(box, screeningBlock(p), researchBlock(p));
    var f = el("form"); f.style.cssText = "display:flex;flex-direction:column;gap:8px";
    var li = el("input"); li.type = "url"; li.placeholder = "https://www.linkedin.com/in/…"; li.value = p.linkedin_url || "";
    f.appendChild(add(el("label", "field", p.linkedin_url ? "LinkedIn profile" : "Their LinkedIn profile (research did not find it)"), li));
    var bar = el("div", "actions");
    var fol = button("Follow", "primary", function () {
      fol.disabled = true;
      post("/api/network/" + encodeURIComponent(p.person_id) + "/follow", { linkedinUrl: li.value }).then(function (r) { net.open = r.personId; toast("Added to your network."); return loadNetwork(); })
        .catch(function (e) { toast(e.message); fol.disabled = false; });
    });
    var pass = button("Pass", "", function () {
      post("/api/network/" + encodeURIComponent(p.person_id) + "/pass").then(function () { net.open = null; toast("Passed. They will not be suggested again."); return loadNetwork(); }).catch(function (e) { toast(e.message); });
    });
    add(bar, fol, pass); f.appendChild(bar);
    f.onsubmit = function (e) { e.preventDefault(); };
    box.appendChild(f);
    return;
  }
  var f = el("form"); f.style.cssText = "display:flex;flex-direction:column;gap:8px";
  var aff = el("input"); aff.name = "affiliation"; aff.value = p.affiliation || "";
  var com = el("select"); com.name = "community"; fillSelect(com, s.communities, p.community, "None");
  var typ = el("select"); typ.name = "type"; fillSelect(typ, s.types, p.type, "None");
  add(f, add(el("label", "field", "Role and organization"), aff), add(el("label", "field", "Primary community"), com), add(el("label", "field", "Type"), typ));
  f.appendChild(el("div", "label", "Scores, 1 to 5 (blank when unknown)"));
  var scoreInputs = {};
  s.criteria.forEach(function (c) {
    var cur = (p.scores[c.key] || {});
    var row = el("div", ""); row.style.cssText = "display:grid;grid-template-columns:1fr 64px;gap:8px;align-items:center";
    var inp = el("input"); inp.type = "number"; inp.min = "1"; inp.max = "5"; inp.value = cur.score != null ? cur.score : "";
    scoreInputs[c.key] = inp;
    add(row, el("span", "small", c.label + " (" + c.weight + ")" + (cur.by === "owner" ? " · yours" : cur.by === "research" ? " · research" : "")), inp);
    f.appendChild(row);
    if (cur.evidence) f.appendChild(el("div", "muted small", cur.evidence));
  });
  var sb = screeningBlock(p); if (sb) f.appendChild(sb);
  var tier = el("select"); tier.name = "tier";
  option(tier, "", "Follow the score" + (p.score != null ? " (" + Math.round(p.score) + ")" : ""), p.tier_set_by ? p.tier : "");
  s.tiers.forEach(function (t) { option(tier, t.tier, "Tier " + t.tier + ": " + t.label, p.tier_set_by ? p.tier : ""); });
  var stage = el("select"); stage.name = "stage";
  option(stage, "", "From what happened (" + (net.stages[p.stage] || p.stage) + ")", p.stage_override || "");
  ["dialogue", "collaboration", "active"].forEach(function (k) { option(stage, k, net.stages[k], p.stage_override || ""); });
  var next = el("input"); next.name = "next_action"; next.value = p.next_action || "";
  var notes = el("textarea"); notes.rows = 3; notes.value = p.notes || "";
  add(f, add(el("label", "field", "Tier"), tier), add(el("label", "field", "Stage"), stage), add(el("label", "field", "Next action"), next), add(el("label", "field", "Notes"), notes));
  var planInputs = null;
  if (p.tier === 1 || p.plan) {
    planInputs = {};
    f.appendChild(el("div", "label", "Relationship plan" + (p.plan && p.plan.auto ? " (drafted from research; edit it and it is yours)" : p.plan ? " (yours)" : " (drafted after the next research)")));
    PLAN.forEach(function (k) {
      var ta = el("textarea"); ta.rows = 2; ta.value = (p.plan && p.plan[k[0]]) || "";
      planInputs[k[0]] = ta;
      f.appendChild(add(el("label", "field", k[1]), ta));
    });
  }
  var bar = el("div", "actions");
  var save = button("Save", "primary", function () {
    var scores = {};
    s.criteria.forEach(function (c) { var v = scoreInputs[c.key].value; scores[c.key] = { score: v === "" ? null : Number(v) }; });
    var b = { affiliation: aff.value, community: com.value, type: typ.value, scores: scores, tier: tier.value, stage: stage.value, next_action: next.value, notes: notes.value };
    if (planInputs) {
      var changed = PLAN.some(function (k) { return (planInputs[k[0]].value || "") !== ((p.plan && p.plan[k[0]]) || ""); });
      if (changed) { var plan = {}; PLAN.forEach(function (k) { if (planInputs[k[0]].value.trim()) plan[k[0]] = planInputs[k[0]].value.trim(); }); b.plan = plan; }
    }
    save.disabled = true;
    post("/api/network/" + encodeURIComponent(p.person_id), b)
      .then(function (r) { toast(r.tier ? "Saved. Tier " + r.tier + "." : "Saved."); return loadNetwork(); })
      .catch(function (e) { toast(e.message); save.disabled = false; });
  });
  var rm = button("Remove", "", function () {
    post("/api/network/" + encodeURIComponent(p.person_id) + "/remove").then(function () { net.open = null; toast("Removed from the network."); return loadNetwork(); }).catch(function (e) { toast(e.message); });
  });
  add(bar, save, rm);
  f.appendChild(bar);
  f.onsubmit = function (e) { e.preventDefault(); };
  box.appendChild(f);
  box.appendChild(researchBlock(p));
}
function loadNetwork() {
  return fetch("/api/network").then(function (r) { return r.json(); }).then(function (d) {
    if (d.error) throw new Error(d.error);
    net.people = d.people; net.suggested = d.suggested || []; net.candidates = d.candidates || {}; net.settings = d.settings; net.screening = d.screening || [];
    net.stages = d.stages; net.signalsError = d.signalsError; renderNetwork();
  }).catch(function (e) { document.getElementById("netlist").textContent = "Could not load: " + e.message; });
}
document.getElementById("addform").onsubmit = function (e) {
  e.preventDefault();
  var b = {}; new FormData(e.target).forEach(function (v, k) { b[k] = v; });
  post("/api/network", b).then(function () { toast("Added. Research starts within the next few minutes."); e.target.reset(); return loadNetwork(); }).catch(function (err) { toast(err.message); });
};

// ---- Today (KADE docs/influence-engagement.md) ----
var today = { data: null, person: null, draft: null };
var STAGE_NAMES = { identified: "Identified", following: "Following", initial: "Initial engagement", recurring: "Recurring engagement", connected: "Connected", dialogue: "Professional dialogue", collaboration: "Collaboration opportunity", active: "Active relationship" };
function renderToday() {
  var d = today.data; if (!d) return;
  d.approaches.forEach(function (a) { APPROACH_NAMES[a.key] = a.label; });
  document.getElementById("todayfocus").textContent = d.focus ? "Today: " + d.focus : d.weekday === 0 || d.weekday === 6 ? "The weekend: this week so far" : "Today";
  var pr = document.getElementById("progress"); pr.textContent = "";
  var g = d.progress, t = g.targets;
  [["Comments", g.comments, t.commentsMin + " to " + t.commentsMax], ["People engaged", g.people, "at least " + t.people], ["Continued discussions", g.continued, t.continued + " a week"], ["Ideas captured", g.ideas, t.ideasMin + " to " + t.ideasMax]].forEach(function (x) {
    add(pr, add(el("div", "tile"), el("span", "muted small", x[0] + " this week"), el("span", "big", String(x[1])), el("span", "muted small", "target " + x[2])));
  });
  var list = document.getElementById("todaylist"); list.textContent = "";
  if (d.signalsError) list.appendChild(el("p", "muted small", "Signals could not be reached: " + d.signalsError));
  if (!d.people.length) list.appendChild(el("p", "empty", d.outcomesDay ? "Friday is for outcomes: close out the week's comments below and capture ideas." : d.weekday === 0 || d.weekday === 6 ? "No list on weekends." : "No one fits today's focus yet. As research tiers your network, they appear here."));
  d.people.forEach(function (p) {
    var it = el("div", "item");
    var head = el("div", "head"); var tags = el("span", "tags");
    tags.appendChild(el("span", "tag", p.tier ? "Tier " + p.tier : "Not tiered"));
    tags.appendChild(el("span", "tag", STAGE_NAMES[p.stage] || p.stage));
    if (p.prospect) tags.appendChild(el("span", "tag warn", "Prospect"));
    if (p.partner) tags.appendChild(el("span", "tag ok", "Partner"));
    if (p.commentedToday) tags.appendChild(el("span", "tag ok", "Commented today"));
    add(head, el("span", "name", p.full_name), tags);
    it.appendChild(head);
    it.appendChild(el("div", "muted small", [p.why, p.affiliation, p.last_touch ? "last engaged " + nice(p.last_touch.slice(0, 10)) : "not engaged yet"].filter(Boolean).join(" · ")));
    if (p.latest) {
      var lw = el("div", "small"); lw.appendChild(document.createTextNode("Latest public work: "));
      var a = el("a", "", p.latest.title || p.latest.url); a.href = p.latest.url; a.target = "_blank"; a.rel = "noopener";
      add(lw, a, el("span", "muted", p.latest.outlet ? " · " + p.latest.outlet : ""));
      it.appendChild(lw);
    }
    if (p.suggestConnect) it.appendChild(el("div", "small", "Engagement is recurring: this is the point to send a connection request, if it feels right."));
    var bar = el("div", "actions");
    if (p.activity_url) bar.appendChild(link("Their recent posts", p.activity_url, "small"));
    bar.appendChild(button("Draft a comment", "small primary", function () { today.person = p.person_id; today.draft = null; renderComposer(); document.getElementById("composer").scrollIntoView({ behavior: "smooth", block: "start" }); }));
    if (p.suggestConnect) bar.appendChild(button("Connection request sent", "small", function () { logKind(p.person_id, "connect_sent", "Recorded."); }));
    it.appendChild(bar);
    list.appendChild(it);
  });
  renderOutcomes();
  renderComposer();
}
function logKind(personId, kind, msg) {
  return post("/api/engagement", { personId: personId, kind: kind }).then(function () { toast(msg); return loadToday(); }).catch(function (e) { toast(e.message); });
}
function renderOutcomes() {
  var d = today.data, box = document.getElementById("outcomes"); box.textContent = "";
  if (!d.outcomes.length && !d.outcomesDay) return;
  var p = el("section", "panel");
  var head = el("div", "head"); head.style.justifyContent = "space-between";
  add(head, el("h2", "", "This week's comments"), button("Suggest ideas", "small", function (e) {
    var b = e.target; b.disabled = true; b.textContent = "Thinking…";
    post("/api/ideas/suggest").then(function (r) { toast(r.added ? r.added + " ideas added to Ideas, as new." : "No new ideas this time."); return loadIdeas(); })
      .catch(function (err) { toast(err.message); }).then(function () { b.disabled = false; b.textContent = "Suggest ideas"; });
  }));
  p.appendChild(head);
  if (!d.outcomes.length) p.appendChild(el("p", "empty", "No comments recorded this week."));
  d.outcomes.forEach(function (c) {
    var it = el("div", "item");
    var det = c.detail || {};
    add(it, el("span", "name", c.full_name), el("div", "muted small", [nice(c.occurred_at.slice(0, 10)), det.topic, det.approach ? APPROACH_NAMES[det.approach] : null].filter(Boolean).join(" · ")));
    if (det.text) { var tx = el("div", "small", det.text); tx.style.whiteSpace = "pre-wrap"; it.appendChild(tx); }
    var bar = el("div", "actions");
    if (det.postUrl) bar.appendChild(link("Open the post", det.postUrl, "small"));
    if (c.responded) bar.appendChild(el("span", "tag ok", "Author responded"));
    else bar.appendChild(button("Author responded", "small", function () { logKind(c.person_id, "reply", "Recorded: a continued discussion."); }));
    bar.appendChild(button("Make this an idea", "small", function () { editIdea({ kind: "topic", title: det.topic || "", person_id: c.person_id, source_url: det.postUrl || "", origin: "comment" }); location.hash = "#ideas"; }));
    it.appendChild(bar);
    p.appendChild(it);
  });
  box.appendChild(p);
}
var APPROACH_NAMES = {};
function renderComposer() {
  var box = document.getElementById("composer"); box.textContent = "";
  var d = today.data; if (!d) return;
  box.appendChild(el("h2", "", "Draft a comment"));
  box.appendChild(el("p", "muted small", "Paste the post, pick an approach, and edit the draft. It must add something: evidence, a question, a distinction or a governance implication."));
  var who = el("select");
  option(who, "", "Choose who wrote the post", today.person || "");
  (net.people || []).forEach(function (p) { option(who, p.person_id, p.full_name, today.person || ""); });
  who.onchange = function () { today.person = who.value; };
  var postText = el("textarea"); postText.rows = 6; postText.placeholder = "Paste the post's text"; postText.value = (today.draft && today.draft.post) || "";
  var appr = el("select");
  d.approaches.forEach(function (a) { option(appr, a.key, a.label, (today.draft && today.draft.approach) || d.approaches[0].key); });
  var hint = el("div", "muted small");
  var setHint = function () { var a = d.approaches.filter(function (x) { return x.key === appr.value; })[0]; hint.textContent = a ? a.hint : ""; };
  appr.onchange = setHint; setHint();
  add(box, add(el("label", "field", "Whose post"), who), add(el("label", "field", "The post"), postText), add(el("label", "field", "Approach"), appr), hint);
  var go = button(today.draft && today.draft.comment ? "Draft again" : "Draft", "primary", function () {
    go.disabled = true; go.textContent = "Drafting…";
    post("/api/comments/draft", { personId: who.value, post: postText.value, approach: appr.value }).then(function (r) {
      today.draft = { post: postText.value, approach: r.approach, comment: r.comment, topic: r.topic, url: (today.draft && today.draft.url) || "" }; renderComposer();
    }).catch(function (e) { toast(e.message); go.disabled = false; go.textContent = "Draft"; });
  });
  box.appendChild(add(el("div", "actions"), go));
  if (!today.draft || !today.draft.comment) return;
  var ta = el("textarea"); ta.rows = 7; ta.value = today.draft.comment;
  var url = el("input"); url.type = "url"; url.placeholder = "https://www.linkedin.com/feed/update/…"; url.value = today.draft.url || "";
  var topic = el("input"); topic.value = today.draft.topic || "";
  add(box, add(el("label", "field", "Your comment"), ta), counter(ta, 1250), add(el("label", "field", "Link to the post (optional; records it once)"), url), add(el("label", "field", "Topic"), topic));
  var bar = el("div", "actions");
  bar.appendChild(button("Copy", "outline", function () { navigator.clipboard.writeText(ta.value).then(function () { toast("Copied. Post it on LinkedIn, then click Commented."); }); }));
  var done = button("Commented", "primary", function () {
    if (!who.value) { toast("Choose whose post it was."); return; }
    done.disabled = true;
    post("/api/engagement", { personId: who.value, kind: "comment", postUrl: url.value, topic: topic.value, approach: appr.value, text: ta.value })
      .then(function (r) { toast(r.duplicate ? "Already recorded for that post." : "Recorded in their contact history."); today.draft = null; return loadToday(); })
      .catch(function (e) { toast(e.message); done.disabled = false; });
  });
  bar.appendChild(done);
  bar.appendChild(button("Save as an idea", "", function () { editIdea({ kind: "topic", title: topic.value, person_id: who.value || null, source_url: url.value, origin: "comment" }); location.hash = "#ideas"; }));
  box.appendChild(bar);
}
function loadToday() {
  return fetch("/api/today").then(function (r) { return r.json(); }).then(function (d) {
    if (d.error) throw new Error(d.error);
    today.data = d; renderToday();
  }).catch(function (e) { document.getElementById("todaylist").textContent = "Could not load: " + e.message; });
}

// ---- Ideas ----
var ideas = { list: [], functions: [], editing: null };
var IDEA_KINDS = [["topic", "Topic or governance question"], ["podcast_topic", "Podcast topic"], ["podcast_guest", "Podcast guest"]];
var IDEA_STATUS = { "new": "New", ready: "Ready for Monday", used: "Used", dropped: "Dropped" };
function renderIdeas() {
  var list = document.getElementById("idealist"); list.textContent = "";
  var fresh = ideas.list.filter(function (i) { return i.status === "new"; }).length;
  var badge = document.getElementById("ideabadge"); badge.hidden = !fresh; badge.textContent = String(fresh);
  if (!ideas.list.length) list.appendChild(el("p", "empty", "No ideas yet. Save one from a comment, add one here, or ask for suggestions on Friday."));
  ["new", "ready", "used", "dropped"].forEach(function (st) {
    var group = ideas.list.filter(function (i) { return i.status === st; });
    if (!group.length) return;
    var p = el("section", "panel");
    p.appendChild(el("h2", "", IDEA_STATUS[st] + " (" + group.length + ")"));
    group.forEach(function (i) {
      var it = el("div", "item");
      var head = el("div", "head"); var tags = el("span", "tags");
      tags.appendChild(el("span", "tag", (IDEA_KINDS.filter(function (k) { return k[0] === i.kind; })[0] || ["", i.kind])[1]));
      if (i.priority === 1) tags.appendChild(el("span", "tag accent", "High priority"));
      if (i.prospect) tags.appendChild(el("span", "tag warn", "Prospect"));
      if (i.origin === "suggested") tags.appendChild(el("span", "tag", "Suggested"));
      add(head, el("span", "name", i.title), tags);
      it.appendChild(head);
      if (i.question) it.appendChild(el("div", "small", i.question));
      it.appendChild(el("div", "muted small", [i.function, i.format, i.person_name ? "from " + i.person_name : null, i.post ? "used in: " + i.post.title + " (" + nice(i.post.due_date) + ")" : null].filter(Boolean).join(" · ")));
      var bar = el("div", "actions");
      if (i.source_url) bar.appendChild(link("Source", i.source_url, "small"));
      if (st === "new" || st === "dropped") bar.appendChild(button(i.kind === "topic" ? "Ready for Monday" : "Keep", "small primary", function () { setIdea(i.id, { status: "ready" }); }));
      if (st === "ready") bar.appendChild(button("Back to new", "small", function () { setIdea(i.id, { status: "new" }); }));
      if (st !== "dropped" && st !== "used") bar.appendChild(button("Drop", "small", function () { setIdea(i.id, { status: "dropped" }); }));
      bar.appendChild(button("Edit", "small", function () { editIdea(i); }));
      it.appendChild(bar);
      p.appendChild(it);
    });
    list.appendChild(p);
  });
  renderIdeaForm();
}
function setIdea(id, b) { return post("/api/ideas/" + encodeURIComponent(id), b).then(loadIdeas).catch(function (e) { toast(e.message); }); }
function editIdea(i) { ideas.editing = i; renderIdeaForm(); }
function renderIdeaForm() {
  var box = document.getElementById("ideaform"); box.textContent = "";
  var i = ideas.editing || {};
  box.appendChild(el("h2", "", i.id ? "Edit idea" : "Add an idea"));
  var f = el("form"); f.style.cssText = "display:flex;flex-direction:column;gap:8px";
  var kind = el("select"); IDEA_KINDS.forEach(function (k) { option(kind, k[0], k[1], i.kind || "topic"); });
  var title = el("input"); title.value = i.title || ""; title.required = true;
  var q = el("textarea"); q.rows = 2; q.value = i.question || "";
  var fn = el("select"); option(fn, "", "Choose later", i.function || ""); (ideas.functions || []).forEach(function (x) { option(fn, x, x, i.function || ""); });
  var fmt = el("input"); fmt.value = i.format || ""; fmt.placeholder = "post, article, episode, briefing…";
  var rn = el("input"); rn.value = i.research_needed || "";
  var pri = el("select"); [[1, "High"], [2, "Normal"], [3, "Low"]].forEach(function (x) { option(pri, x[0], x[1], i.priority || 2); });
  var src = el("input"); src.type = "url"; src.value = i.source_url || "";
  var who = el("select"); option(who, "", "No one", i.person_id || ""); (net.people || []).forEach(function (p) { option(who, p.person_id, p.full_name, i.person_id || ""); });
  var notes = el("textarea"); notes.rows = 2; notes.value = i.notes || "";
  add(f, add(el("label", "field", "Kind"), kind), add(el("label", "field", "Title"), title), add(el("label", "field", "The governance question"), q),
    add(el("label", "field", "Function"), fn), add(el("label", "field", "Format"), fmt), add(el("label", "field", "Research needed"), rn), add(el("label", "field", "Priority"), pri),
    add(el("label", "field", "From (person in your network, or the guest)"), who), add(el("label", "field", "Source link"), src), add(el("label", "field", "Notes"), notes));
  var bar = el("div", "actions");
  var save = button(i.id ? "Save" : "Add idea", "primary", function () {
    var b = { kind: kind.value, title: title.value, question: q.value, "function": fn.value, format: fmt.value, research_needed: rn.value, priority: Number(pri.value), source_url: src.value, person_id: who.value, notes: notes.value, origin: i.origin };
    save.disabled = true;
    (i.id ? post("/api/ideas/" + encodeURIComponent(i.id), b) : post("/api/ideas", b)).then(function () { toast("Saved."); ideas.editing = null; return loadIdeas(); })
      .catch(function (e) { toast(e.message); save.disabled = false; });
  });
  bar.appendChild(save);
  if (ideas.editing) bar.appendChild(button("Cancel", "", function () { ideas.editing = null; renderIdeaForm(); }));
  f.appendChild(bar);
  f.onsubmit = function (e) { e.preventDefault(); };
  box.appendChild(f);
}
function loadIdeas() {
  return fetch("/api/ideas").then(function (r) { return r.json(); }).then(function (d) {
    if (d.error) throw new Error(d.error);
    ideas.list = d.ideas; ideas.functions = d.functions; renderIdeas();
  }).catch(function (e) { document.getElementById("idealist").textContent = "Could not load: " + e.message; });
}

// ---- Review (KADE docs/influence-measurement.md) ----
var review = { data: null, month: null };
function cell(v) { return v == null ? "–" : String(v); }
function dataTable(head, rows, baseRow) {
  var t = el("table", "data"), tr = el("tr");
  head.forEach(function (h) { tr.appendChild(el("th", "", h)); });
  t.appendChild(tr);
  if (baseRow) { var b = el("tr", "base"); baseRow.forEach(function (c) { b.appendChild(el("td", "", cell(c))); }); t.appendChild(b); }
  rows.forEach(function (r) { var x = el("tr"); r.forEach(function (c) { x.appendChild(el("td", "", cell(c))); }); t.appendChild(x); });
  return add(el("div", "scroll"), t);
}
function shiftMonth(m, n) { var y = Number(m.slice(0, 4)), mo = Number(m.slice(5, 7)) - 1 + n; y += Math.floor(mo / 12); mo = ((mo % 12) + 12) % 12; return y + "-" + String(mo + 1).padStart(2, "0"); }
function renderReview() {
  var d = review.data; if (!d) return;
  var main = document.getElementById("reviewmain"), side = document.getElementById("reviewside");
  main.textContent = ""; side.textContent = "";
  var monday = (function () { var t = new Date(d.today + "T12:00:00Z"); t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7)); return t.toISOString().slice(0, 10); })();
  var due = !d.lastUpload || String(d.lastUpload.uploaded_at).slice(0, 10) < monday;
  var badge = document.getElementById("reviewbadge"); badge.hidden = !due; badge.textContent = "1";
  // Upload
  var up = el("section", "panel");
  up.appendChild(el("h2", "", "This week's LinkedIn numbers"));
  up.appendChild(el("p", "muted small", d.lastUpload ? "Last upload: " + d.lastUpload.period_start + " to " + d.lastUpload.period_end + " (uploaded " + nice(String(d.lastUpload.uploaded_at).slice(0, 10)) + ")" + (d.followers ? ". Followers: " + d.followers.total + " on " + nice(d.followers.day) + "." : ".") : "Nothing uploaded yet."));
  up.appendChild(el("p", "muted small", d.lastPageUpload ? "Company page: last upload " + d.lastPageUpload.period_start + " to " + d.lastPageUpload.period_end + " (uploaded " + nice(String(d.lastPageUpload.uploaded_at).slice(0, 10)) + ")." : "Company page: nothing uploaded yet."));
  if (due) up.appendChild(el("p", "small", "Due this week. Your profile: Analytics → past 28 days → Export (.xlsx). The company page: page admin → Analytics → Content → past 28 days → Export (.xls). Upload each file here."));
  var f = el("form"); f.style.cssText = "display:flex;flex-direction:column;gap:8px";
  var file = el("input"); file.type = "file"; file.accept = ".xlsx"; file.name = "file";
  var pv = el("input"); pv.type = "number"; pv.min = "0"; pv.name = "profile_views";
  var sa = el("input"); sa.type = "number"; sa.min = "0"; sa.name = "search_appearances";
  file.accept = ".xlsx,.xls";
  add(f, add(el("label", "field", "LinkedIn's export: your profile (.xlsx) or the company page's Content (.xls)"), file),
    add(el("div", ""), add(el("label", "field", "Profile viewers, past 90 days (optional, from your dashboard)"), pv)),
    add(el("div", ""), add(el("label", "field", "Search appearances, past week (optional)"), sa)));
  var go = button("Upload", "primary", function () {
    if (!file.files || !file.files[0]) { toast("Choose the .xlsx file first."); return; }
    var fd = new FormData(f); go.disabled = true; go.textContent = "Reading…";
    fetch("/api/linkedin/upload", { method: "POST", body: fd, redirect: "manual" }).then(function (r) {
      if (r.type === "opaqueredirect" || r.status === 401 || r.status === 403) throw new Error(EXPIRED);
      return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || r.status); return j; });
    }).then(function (j) { toast((j.account === "page" ? "Company page: " : "Your profile: ") + "read " + j.days + " days and " + j.posts + " posts (" + j.periodStart + " to " + j.periodEnd + ")."); file.value = ""; return loadReview(); })
      .catch(function (e) { toast(e.message); go.disabled = false; go.textContent = "Upload"; });
  });
  f.appendChild(add(el("div", "actions"), go));
  f.onsubmit = function (e) { e.preventDefault(); };
  up.appendChild(f);
  main.appendChild(up);
  // Weekly trends with the baseline
  var tr = el("section", "panel");
  tr.appendChild(el("h2", "", "Week by week"));
  tr.appendChild(el("p", "muted small", d.baseline ? "Shaded: your baseline, the weekly average of " + d.baseline.from + " (" + d.baseline.weeks.map(nice).join(", ") + ")." : "The baseline appears once two full weeks are uploaded, before or after the start on " + nice(d.pilot.start) + "."));
  var base = d.baseline ? ["Baseline", d.baseline.impressions, d.baseline.engagements, d.baseline.newFollowers, d.baseline.pageImpressions, d.baseline.pageEngagements, d.baseline.comments, null, null, null, null, null] : null;
  tr.appendChild(dataTable(["Week of", "Impressions", "Engagements", "New followers", "Page impressions", "Page engagements", "Comments", "People", "Responses", "Connections", "Ideas", "Posts"],
    d.weeks.map(function (w) { return [nice(w.week), w.impressions, w.engagements, w.newFollowers, w.pageImpressions, w.pageEngagements, w.comments, w.people, w.responses, w.connections, w.ideas, w.posts]; }), base));
  main.appendChild(tr);
  // The 90-day pilot
  var pl = el("section", "panel");
  pl.appendChild(el("h2", "", "90-day pilot: day " + d.pilot.day + " of 90"));
  pl.appendChild(el("p", "muted small", "Planning assumptions from your plan, not promises. Started " + nice(d.pilot.start) + "."));
  d.pilot.measures.forEach(function (m) {
    var row = el("div", ""); row.style.cssText = "display:grid;grid-template-columns:1fr auto;gap:4px 12px;align-items:center";
    var tgt = m.target[0] === m.target[1] ? String(m.target[0]) : m.target[0] + " to " + m.target[1];
    add(row, el("span", "small", m.label), el("span", "small", m.value + " of " + tgt));
    var bar = el("div", "bar"); var fill = el("span"); fill.style.width = Math.min(100, Math.round(100 * m.value / Math.max(1, m.target[0]))) + "%"; bar.appendChild(fill); bar.style.gridColumn = "1 / span 2";
    row.appendChild(bar);
    pl.appendChild(row);
  });
  main.appendChild(pl);
  // The month's review
  var r = d.review;
  var rv = el("section", "panel");
  var head = el("div", "head"); head.style.justifyContent = "space-between";
  var nav = el("span", "actions");
  nav.appendChild(button("Earlier", "small", function () { loadReview(shiftMonth(r.month, -1)); }));
  if (r.month < d.today.slice(0, 7)) nav.appendChild(button("Later", "small", function () { loadReview(shiftMonth(r.month, 1)); }));
  add(head, el("h2", "", "Review of " + r.month), nav);
  rv.appendChild(head);
  var li = r.linkedin || {};
  rv.appendChild(el("p", "small", "Your profile: " + cell(li.impressions) + " impressions, " + cell(li.engagements) + " engagements, " + cell(li.new_followers) + " new followers (" + (li.days || 0) + " days uploaded). Company page: " + cell(li.page_impressions) + " impressions, " + cell(li.page_engagements) + " engagements (" + (li.page_days || 0) + " days). Comments: " + r.topics.length + "."));
  function block(title, empty, items) {
    rv.appendChild(el("div", "label", title));
    if (!items.length) rv.appendChild(el("p", "empty", empty)); else items.forEach(function (x) { rv.appendChild(el("div", "small", x)); });
  }
  block("Who drew the most discussion", "No comments recorded this month.", r.discussions.map(function (x) { return x.name + ": " + x.replies + " responses to " + x.comments + " comments"; }));
  block("By community", "Nothing yet.", r.byCommunity.map(function (x) { return (label(net.settings ? net.settings.communities : [], x.key) || x.key) + ": " + x.responded + " responses to " + x.comments + " comments"; }));
  block("Which approaches drew responses", "No approaches recorded.", r.byApproach.map(function (x) { return (APPROACH_NAMES[x.key] || x.key) + ": " + x.responded + " of " + x.comments; }));
  block("In recurring engagement or beyond", "No one yet.", r.recurring.map(function (x) { return x.name + " (" + (STAGE_NAMES[x.stage] || x.stage) + (x.tier ? ", Tier " + x.tier : "") + ")"; }));
  block("What the comments were about", "No topics recorded.", r.topics.length ? [r.topics.join(" · ")] : []);
  block("Ideas that became posts", "None this month.", r.ideasUsed.map(function (x) { return x.title + " → " + x.post_title + " (" + nice(x.due_date) + ")"; }));
  block("Promotions, demotions and removals", "No changes.", r.tierChanges.map(function (x) {
    return nice(x.at.slice(0, 10)) + ": " + x.full_name + " " + (x.change === "joined" ? "joined" : x.change === "removed" ? "removed" : (x.from_tier ? "Tier " + x.from_tier : "untiered") + " → " + (x.to_tier ? "Tier " + x.to_tier : "untiered")) + (x.by ? " (" + x.by + ")" : "");
  }));
  main.appendChild(rv);
  // Side: what to change, and the audience
  var nb = el("section", "panel");
  nb.appendChild(el("h2", "", "What to change"));
  nb.appendChild(el("p", "muted small", "Your decisions from the " + r.month + " review: tiers, rhythm, communities, the kinds of comments that work."));
  var ta = el("textarea"); ta.rows = 8; ta.value = r.notes || "";
  var sv = button("Save", "primary", function () { sv.disabled = true; post("/api/review/notes", { month: r.month, notes: ta.value }).then(function () { toast("Saved."); sv.disabled = false; }).catch(function (e) { toast(e.message); sv.disabled = false; }); });
  add(nb, ta, add(el("div", "actions"), sv));
  side.appendChild(nb);
  var au = el("section", "panel");
  au.appendChild(el("h2", "", "Your audience"));
  au.appendChild(el("p", "muted small", "From the latest export. Private to this page."));
  if (!r.audience.length) au.appendChild(el("p", "empty", "Upload an export to see it."));
  ["Seniority", "Industry", "Job title"].forEach(function (cat) {
    var rows = r.audience.filter(function (x) { return x.category === cat; });
    if (!rows.length) return;
    au.appendChild(el("div", "label", cat));
    rows.slice(0, 6).forEach(function (x) { au.appendChild(el("div", "small", x.value + ": " + (x.pct == null ? "under 1%" : x.pct + "%"))); });
  });
  side.appendChild(au);
}
function loadReview(month) {
  return fetch("/api/review" + (month ? "?month=" + encodeURIComponent(month) : "")).then(function (r) { return r.json(); }).then(function (d) {
    if (d.error) throw new Error(d.error);
    review.data = d; renderReview();
  }).catch(function (e) { document.getElementById("reviewmain").textContent = "Could not load: " + e.message; });
}

// ---- Tabs ----
var TABS = ["today", "network", "posts", "ideas", "review"];
function showTab() {
  var tab = (location.hash || "#today").slice(1);
  if (TABS.indexOf(tab) < 0) tab = "today";
  TABS.forEach(function (t) {
    document.getElementById("tab-" + t).hidden = t !== tab;
    var a = document.querySelector('nav a[data-tab="' + t + '"]');
    if (t === tab) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
}
window.addEventListener("hashchange", showTab);

// ---- Load ----
function load() {
  return fetch("/api/posts").then(function (r) { return r.json(); }).then(function (d) {
    if (d.error) throw new Error(d.error);
    state.today = d.today; state.posts = d.posts;
    document.getElementById("date").textContent = longDate(d.today);
    renderPosts();
  }).catch(function (e) { document.getElementById("date").textContent = "Could not load: " + e.message; });
}
fetch("/api/me").then(function (r) { return r.json(); }).then(function (d) { if (d.me) document.getElementById("me").textContent = "Signed in as " + d.me; }).catch(function () {});
showTab();
load();
loadNetwork().then(function () { loadToday(); loadIdeas(); loadReview(); });
</script>
</body>
</html>`;
