/**
 * The review page: today's LinkedIn list, pending invites, and research needed.
 * One self-contained page; all data via /api/*. Text from the database is only ever set
 * with textContent or value, never as HTML. (No template literals inside the script below,
 * because this whole page is itself a template literal.)
 */
export const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>BD Daily</title>
<style>
:root { --bg:#f7f6f3; --card:#fff; --ink:#1d1d1b; --muted:#6b6a66; --line:#e4e2dc; --accent:#8a3b12; --ok:#2f6b3a; --chip:#f0ede6; }
@media (prefers-color-scheme: dark) { :root { --bg:#161614; --card:#1f1f1c; --ink:#ecebe7; --muted:#a19f98; --line:#33322e; --accent:#e58a5a; --ok:#7cc48a; --chip:#2a2926; } }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--ink); font:15px/1.45 -apple-system, "Segoe UI", system-ui, sans-serif; }
main { max-width: 1440px; margin: 0 auto; padding: 24px 24px 64px; }
.cols { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 40px; align-items: start; }
.cols > section > h2:first-child { margin-top: 8px; }
@media (max-width: 1000px) { .cols { grid-template-columns: minmax(0, 1fr); gap: 0; } main { padding: 24px 16px 64px; } }
h1 { font-size: 22px; margin: 0 0 4px; }
h2 { font-size: 16px; margin: 32px 0 10px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }
.sub { color: var(--muted); margin: 0 0 16px; }
.card { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:14px 16px; margin:10px 0; }
.card.done { opacity:.55; }
.row { display:flex; gap:8px; align-items:baseline; flex-wrap:wrap; }
.name { font-weight:600; }
.meta { color:var(--muted); font-size:13px; }
.chip { font-size:12px; background:var(--chip); border-radius:999px; padding:2px 8px; }
.chip.connect { color:var(--accent); } .chip.follow_up { color:var(--ok); }
textarea { width:100%; margin:10px 0 6px; padding:8px 10px; border:1px solid var(--line); border-radius:8px; background:var(--bg); color:var(--ink); font:inherit; resize:vertical; min-height:64px; }
.count { font-size:12px; color:var(--muted); }
.count.over { color:#c0392b; font-weight:600; }
.actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:6px; }
button, a.btn { font:inherit; font-size:14px; border:1px solid var(--line); background:var(--card); color:var(--ink); border-radius:8px; padding:6px 12px; cursor:pointer; text-decoration:none; }
button.primary { background:var(--accent); border-color:var(--accent); color:#fff; }
button:disabled { opacity:.5; cursor:default; }
.summary { color:var(--muted); font-size:13px; margin-top:6px; }
.empty { color:var(--muted); font-style:italic; }
#status { position:fixed; bottom:16px; left:50%; transform:translateX(-50%); background:var(--ink); color:var(--bg); padding:8px 14px; border-radius:8px; font-size:14px; display:none; }
</style>
</head>
<body>
<main>
  <h1>BD Daily</h1>
  <p class="sub" id="sub">Loading…</p>
  <div class="cols">
    <section>
      <h2>Today's LinkedIn list</h2>
      <div id="list"></div>
      <h2>Pending invites</h2>
      <p class="sub">Mark someone accepted when LinkedIn shows the connection. A thank-you follow-up is drafted the next morning.</p>
      <div id="pending"></div>
    </section>
    <section>
      <h2>Upcoming posts</h2>
      <p class="sub" id="postsub">Company page Mon/Wed/Fri, your profile Tue/Thu. Edit, copy, post on LinkedIn, then press Posted.</p>
      <div id="posts"></div>
      <h2>Research needed</h2>
      <p class="sub" id="gapsub">Hot organizations with no leadership contact in KADE. Approve to queue research, then run it in KADE.</p>
      <div id="gaps"></div>
    </section>
  </div>
</main>
<div id="status"></div>
<script>
var LIMITS = { connect: 200, follow_up: 600 };
var LABELS = { connect: "Connect", follow_up: "Follow up", withdraw_invite: "Withdraw invite" };
function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function toast(msg) { var s = document.getElementById("status"); s.textContent = msg; s.style.display = "block"; clearTimeout(toast.t); toast.t = setTimeout(function () { s.style.display = "none"; }, 8000); }
function post(path, body) {
  return fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body || {}) })
    .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || r.status); return j; }); });
}
function who(p) { return [p.title, p.organization].filter(Boolean).join(", "); }
function tierLine(a) {
  var bits = [];
  if (a.pursued) bits.push("pursued");
  if (a.kade_tier) bits.push(a.kade_tier + (a.kade_heat != null ? " " + Number(a.kade_heat).toFixed(2) : ""));
  return bits.join(" · ");
}

function actionCard(a) {
  var c = el("div", "card" + (a.status !== "todo" ? " done" : ""));
  var r = el("div", "row");
  r.appendChild(el("span", "chip " + a.action_type, LABELS[a.action_type] || a.action_type));
  r.appendChild(el("span", "name", a.full_name));
  r.appendChild(el("span", "meta", who(a)));
  c.appendChild(r);
  c.appendChild(el("div", "meta", a.reason + (tierLine(a) && a.reason.indexOf(tierLine(a)) < 0 ? " · " + tierLine(a) : "")));
  var ta = null, count = null;
  if (a.text != null) {
    ta = el("textarea"); ta.value = a.text; ta.disabled = a.status !== "todo";
    count = el("div", "count");
    var limit = LIMITS[a.action_type] || 600;
    var upd = function () { count.textContent = ta.value.length + " / " + limit; count.className = "count" + (ta.value.length > limit ? " over" : ""); };
    ta.addEventListener("input", upd); upd();
    c.appendChild(ta); c.appendChild(count);
  }
  var bar = el("div", "actions");
  if (a.status === "todo") {
    if (ta) { var cp = el("button", "", "Copy text"); cp.onclick = function () { navigator.clipboard.writeText(ta.value).then(function () { toast("Copied"); }); }; bar.appendChild(cp); }
    if (a.target_url) { var lk = el("a", "btn", "Open profile"); lk.href = a.target_url; lk.target = "_blank"; lk.rel = "noopener"; bar.appendChild(lk); }
    if (a.kade_url) { var kd = el("a", "btn", "KADE"); kd.href = a.kade_url; kd.target = "_blank"; kd.rel = "noopener"; bar.appendChild(kd); }
    var done = el("button", "primary", "Done");
    done.onclick = function () {
      if (ta && ta.value.length > (LIMITS[a.action_type] || 600)) { toast("Too long for LinkedIn. Shorten it first."); return; }
      done.disabled = true;
      post("/api/actions/" + a.id, { status: "done", text: ta ? ta.value : undefined }).then(load).catch(function (e) { toast(e.message); done.disabled = false; });
    };
    var skip = el("button", "", "Skip");
    skip.onclick = function () { post("/api/actions/" + a.id, { status: "skipped" }).then(load).catch(function (e) { toast(e.message); }); };
    bar.appendChild(done); bar.appendChild(skip);
  } else {
    bar.appendChild(el("span", "meta", a.status === "done" ? "Done" : "Skipped"));
  }
  c.appendChild(bar);
  return c;
}

var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function postCard(p) {
  var c = el("div", "card" + (p.status !== "proposed" ? " done" : ""));
  var r = el("div", "row");
  var d = new Date(p.due_date + "T12:00:00Z");
  r.appendChild(el("span", "chip " + (p.channel === "page" ? "connect" : "follow_up"), (p.channel === "page" ? "Company page" : "Your profile")));
  r.appendChild(el("span", "name", DAYS[d.getUTCDay()] + " " + p.due_date.slice(5)));
  r.appendChild(el("span", "meta", p.title || ""));
  c.appendChild(r);
  var src = p.context && p.context.source ? "From: " + p.context.source : "";
  if (src) c.appendChild(el("div", "meta", src));
  var ta = el("textarea"); ta.value = p.text || ""; ta.rows = 8; ta.disabled = p.status !== "proposed";
  var count = el("div", "count");
  var upd = function () { count.textContent = ta.value.length + " / 3000"; count.className = "count" + (ta.value.length > 3000 ? " over" : ""); };
  ta.addEventListener("input", upd); upd();
  c.appendChild(ta); c.appendChild(count);
  var bar = el("div", "actions");
  if (p.status === "proposed") {
    var cp = el("button", "", "Copy text"); cp.onclick = function () { navigator.clipboard.writeText(ta.value).then(function () { toast("Copied"); }); }; bar.appendChild(cp);
    if (p.context && p.context.link) { var lk = el("a", "btn", "Open link"); lk.href = p.context.link; lk.target = "_blank"; lk.rel = "noopener"; bar.appendChild(lk); }
    var done = el("button", "primary", "Posted");
    done.onclick = function () { done.disabled = true; post("/api/posts/" + p.id, { status: "posted", text: ta.value }).then(load).catch(function (e) { toast(e.message); done.disabled = false; }); };
    var skip = el("button", "", "Skip");
    skip.onclick = function () { post("/api/posts/" + p.id, { status: "skipped" }).then(load).catch(function (e) { toast(e.message); }); };
    bar.appendChild(done); bar.appendChild(skip);
  } else {
    bar.appendChild(el("span", "meta", p.status === "sent" ? "Posted" + (p.approved_by ? " by " + p.approved_by : "") : "Skipped"));
  }
  c.appendChild(bar);
  return c;
}

function pendingCard(p) {
  var c = el("div", "card");
  var r = el("div", "row");
  r.appendChild(el("span", "name", p.full_name));
  r.appendChild(el("span", "meta", who(p)));
  r.appendChild(el("span", "meta", "invited " + (p.invited_at || "").slice(0, 10)));
  c.appendChild(r);
  var bar = el("div", "actions");
  if (p.linkedin_url) { var lk = el("a", "btn", "Open profile"); lk.href = p.linkedin_url; lk.target = "_blank"; lk.rel = "noopener"; bar.appendChild(lk); }
  var b = el("button", "primary", "Accepted");
  b.onclick = function () { b.disabled = true; post("/api/people/" + p.person_id + "/connected").then(load).catch(function (e) { toast(e.message); b.disabled = false; }); };
  bar.appendChild(b);
  c.appendChild(bar);
  return c;
}

function gapCard(g) {
  var c = el("div", "card");
  var r = el("div", "row");
  r.appendChild(el("span", "name", g.organization));
  r.appendChild(el("span", "meta", [g.entity_type, g.state_province].filter(Boolean).join(" · ")));
  r.appendChild(el("span", "chip", tierLine(g) || "no tier"));
  c.appendChild(r);
  if (g.kade_summary) c.appendChild(el("div", "summary", g.kade_summary));
  var bar = el("div", "actions");
  var kd = el("a", "btn", "Open in KADE"); kd.href = g.kade_url; kd.target = "_blank"; kd.rel = "noopener"; bar.appendChild(kd);
  var ok = el("button", "primary", "Approve research");
  ok.onclick = function () { post("/api/gaps/" + encodeURIComponent(g.kade_account_id), { status: "approved" }).then(function () { toast("Approved. Run the people research in KADE."); load(); }).catch(function (e) { toast(e.message); }); };
  var no = el("button", "", "Dismiss");
  no.onclick = function () { post("/api/gaps/" + encodeURIComponent(g.kade_account_id), { status: "dismissed" }).then(load).catch(function (e) { toast(e.message); }); };
  bar.appendChild(ok); bar.appendChild(no);
  c.appendChild(bar);
  return c;
}

function fill(id, items, make, emptyText) {
  var box = document.getElementById(id); box.textContent = "";
  if (!items.length) { box.appendChild(el("p", "empty", emptyText)); return; }
  items.forEach(function (i) { box.appendChild(make(i)); });
}

function load() {
  return fetch("/api/today").then(function (r) { return r.json(); }).then(function (d) {
    if (d.error) { document.getElementById("sub").textContent = d.error; return; }
    var todo = d.actions.filter(function (a) { return a.status === "todo"; }).length;
    document.getElementById("sub").textContent = d.date + " · " + todo + " of " + d.actions.length + " left · signed in as " + d.me;
    var box = document.getElementById("list");
    if (!d.actions.length) {
      box.textContent = "";
      box.appendChild(el("p", "empty", "No list for today yet. It is built each weekday at 5 a.m. ET."));
      var b = el("button", "primary", "Build today's list now");
      b.onclick = function () { b.disabled = true; b.textContent = "Drafting…"; post("/api/today/build").then(load).catch(function (e) { toast(e.message); b.disabled = false; }); };
      box.appendChild(b);
    } else fill("list", d.actions, actionCard, "");
    var pbox = document.getElementById("posts");
    if (!d.posts.length) {
      pbox.textContent = "";
      pbox.appendChild(el("p", "empty", "No upcoming posts. Monday mornings fill the week; this button drafts the next five weekdays from tomorrow."));
      var pb = el("button", "primary", "Draft upcoming posts now");
      pb.onclick = function () {
        pb.disabled = true; pb.textContent = "Drafting… (up to a minute)";
        post("/api/posts/build").then(function (r) {
          if (r.skipped) toast("Not drafted: " + r.reason);
          else if (!r.posts) toast("Claude returned no posts. Try again.");
          else toast(r.posts + " posts drafted.");
          return load();
        }).catch(function (e) { toast(e.message); }).then(function () { pb.disabled = false; pb.textContent = "Draft upcoming posts now"; });
      };
      pbox.appendChild(pb);
    } else fill("posts", d.posts, postCard, "");
    fill("pending", d.pending, pendingCard, "No pending invites.");
    document.getElementById("gapsub").textContent = d.openGaps + " hot organizations with no leadership contact in KADE (hottest first). Approve to queue research, then run it in KADE.";
    fill("gaps", d.gaps, gapCard, "Nothing needs research.");
  }).catch(function (e) { document.getElementById("sub").textContent = "Could not load: " + e.message; });
}
load();
</script>
</body>
</html>`;
