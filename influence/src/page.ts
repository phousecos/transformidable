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
      <a href="#network" data-tab="network">Network</a>
      <a href="#posts" data-tab="posts">Posts <span class="badge" id="postbadge" hidden></span></a>
    </nav>
  </div>
</header>

<div class="wrap page">
  <section id="tab-network" class="split">
    <main class="main">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap">
        <h2>Your influence network</h2><span class="muted small" id="netsummary"></span>
      </div>
      <p class="muted small" style="margin:4px 0 12px">People who shape the conversations you want to be part of. Score them on the six criteria and the tier follows; the stage comes from what actually happened.</p>
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


// ---- Network (KADE docs/influence.md) ----
var net = { people: [], settings: null, stages: {}, open: null };
function label(list, key) { var x = (list || []).filter(function (i) { return i.key === key; })[0]; return x ? x.label : ""; }
function option(sel, value, text, cur) { var o = el("option", "", text); o.value = value; if (String(cur || "") === String(value)) o.selected = true; sel.appendChild(o); }
function fillSelect(sel, list, cur, blank) { sel.textContent = ""; option(sel, "", blank, cur); list.forEach(function (i) { option(sel, i.key, i.label, cur); }); }
function renderNetwork() {
  var s = net.settings, list = document.getElementById("netlist"), tiers = document.getElementById("tiers");
  list.textContent = ""; tiers.textContent = "";
  document.getElementById("netsummary").textContent = net.people.length + " people";
  fillSelect(document.getElementById("addcommunity"), s.communities, "", "Choose later");
  fillSelect(document.getElementById("addtype"), s.types, "", "Choose later");
  var tile = el("div", "tiles");
  s.tiers.forEach(function (t) {
    var n = net.people.filter(function (p) { return p.tier === t.tier; }).length;
    add(tile, add(el("div", "tile"), el("span", "muted small", "Tier " + t.tier + ": " + t.label), el("span", "big", String(n)), el("span", "muted small", "target " + t.target)));
  });
  var unscored = net.people.filter(function (p) { return !p.tier; }).length;
  add(tile, add(el("div", "tile"), el("span", "muted small", "Not yet tiered"), el("span", "big", String(unscored)), el("span", "muted small", "score them to place them")));
  tiers.appendChild(tile);
  if (net.signalsError) list.appendChild(el("p", "muted small", "Signals could not be reached for stages and marks: " + net.signalsError));
  if (!net.people.length) list.appendChild(el("p", "empty", "No one yet. Add the people whose conversations you want to be part of."));
  net.people.forEach(function (p) {
    var it = el("div", "item"); it.style.cursor = "pointer";
    var head = el("div", "head");
    var nm = el("span", "name", p.full_name);
    var tags = el("span", "tags");
    tags.appendChild(el("span", "tag", p.tier ? "Tier " + p.tier : "Not tiered"));
    if (p.prospect) tags.appendChild(el("span", "tag warn", "Prospect"));
    if (p.partner) tags.appendChild(el("span", "tag ok", "Partner"));
    add(head, nm, tags);
    it.appendChild(head);
    it.appendChild(el("div", "muted small", [label(s.communities, p.community), label(s.types, p.type), net.stages[p.stage] || p.stage,
      p.score != null ? "score " + Math.round(p.score) : null].filter(Boolean).join(" · ")));
    if (p.affiliation || p.signals_role) it.appendChild(el("div", "small", p.affiliation || p.signals_role));
    if (p.next_action) it.appendChild(el("div", "small", "Next: " + p.next_action));
    it.onclick = function () { net.open = p.person_id; renderDetail(); };
    list.appendChild(it);
  });
  renderDetail();
}
function renderDetail() {
  var box = document.getElementById("detail"), s = net.settings;
  var p = net.people.filter(function (x) { return x.person_id === net.open; })[0];
  box.hidden = !p; box.textContent = "";
  if (!p) return;
  var head = el("div", "head"); head.style.justifyContent = "space-between";
  add(head, el("h2", "", p.full_name), p.linkedin_url ? link("LinkedIn", p.linkedin_url, "small") : null);
  box.appendChild(head);
  if (p.prospect) box.appendChild(el("p", "small", "A prospect in Signals: decide knowingly before featuring them publicly, and never make the connection identifiable."));
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
    add(row, el("span", "small", c.label + " (" + c.weight + ")"), inp);
    f.appendChild(row);
    if (cur.evidence) f.appendChild(el("div", "muted small", cur.evidence));
  });
  var tier = el("select"); tier.name = "tier";
  option(tier, "", "Follow the score" + (p.score != null ? " (" + Math.round(p.score) + ")" : ""), p.tier_set_by ? p.tier : "");
  s.tiers.forEach(function (t) { option(tier, t.tier, "Tier " + t.tier + ": " + t.label, p.tier_set_by ? p.tier : ""); });
  var stage = el("select"); stage.name = "stage";
  option(stage, "", "From what happened (" + (net.stages[p.stage] || p.stage) + ")", p.stage_override || "");
  ["dialogue", "collaboration", "active"].forEach(function (k) { option(stage, k, net.stages[k], p.stage_override || ""); });
  var next = el("input"); next.name = "next_action"; next.value = p.next_action || "";
  var notes = el("textarea"); notes.rows = 3; notes.value = p.notes || "";
  add(f, add(el("label", "field", "Tier"), tier), add(el("label", "field", "Stage"), stage), add(el("label", "field", "Next action"), next), add(el("label", "field", "Notes"), notes));
  var bar = el("div", "actions");
  var save = button("Save", "primary", function () {
    var scores = {};
    s.criteria.forEach(function (c) { var v = scoreInputs[c.key].value; scores[c.key] = { score: v === "" ? null : Number(v), evidence: (p.scores[c.key] || {}).evidence || null }; });
    save.disabled = true;
    post("/api/network/" + encodeURIComponent(p.person_id), { affiliation: aff.value, community: com.value, type: typ.value, scores: scores, tier: tier.value, stage: stage.value, next_action: next.value, notes: notes.value })
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
}
function loadNetwork() {
  return fetch("/api/network").then(function (r) { return r.json(); }).then(function (d) {
    if (d.error) throw new Error(d.error);
    net.people = d.people; net.settings = d.settings; net.stages = d.stages; net.signalsError = d.signalsError; renderNetwork();
  }).catch(function (e) { document.getElementById("netlist").textContent = "Could not load: " + e.message; });
}
document.getElementById("addform").onsubmit = function (e) {
  e.preventDefault();
  var b = {}; new FormData(e.target).forEach(function (v, k) { b[k] = v; });
  post("/api/network", b).then(function () { toast("Added."); e.target.reset(); return loadNetwork(); }).catch(function (err) { toast(err.message); });
};

// ---- Tabs ----
var TABS = ["network", "posts"];
function showTab() {
  var tab = (location.hash || "#network").slice(1);
  if (TABS.indexOf(tab) < 0) tab = "network";
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
loadNetwork();
</script>
</body>
</html>`;
