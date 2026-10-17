/* BBCC War Room core: shell, data, countdown, avatars */
const C = window.BBCC_CONFIG;
const $ = (s, r = document) => r.querySelector(s),
  $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const BB = {};
const ROLE_NAME = {
  tank: "Tank",
  heal: "Healer",
  dps: "DPS",
  "tank/dps": "Tank / DPS",
};
const own = (object, key) =>
  typeof key === "string" && Object.hasOwn(object, key);
const PAGES = [
  ["index.html", "Home", ""],
  ["warroom.html", "War Room", ""],
  ["roster.html", "Roster", ""],
  ["pve-pvp.html", "PvE vs PvP", ""],
  ["factions.html", "Factions", ""],
  ["meta.html", "Meta", ""],
  ["racials.html", "Racials", ""],
  ["news.html", "News", ""],
  ["streamers.html", "Streamers", ""],
  ["guild.html", "Guild Name", ""],
];
async function loadData() {
  const get = (f) =>
    fetch(f, { cache: "no-cache" }).then((r) => {
      if (!r.ok) throw new Error("Data unavailable");
      return r.json();
    });
  [BB.members, BB.game, BB.content, BB.live] = await Promise.all([
    get("data/members.json"),
    get("data/game.json"),
    get("data/content.json"),
    get("data/live.json").catch(() => ({
      updated: null,
      autoVideos: [],
      autoNews: [],
      autoStreamers: [],
      news: [],
      videos: [],
      trends: [],
      streamers: [],
      asmon: { facts: [] },
    })),
  ]);
  BB.M = Object.fromEntries(BB.members.members.map((m) => [m.id, m]));
  BB.live = normalizeFeed(BB.live);
}

function normalizeFeed(value) {
  const feed = value && typeof value === "object" ? value : {};
  const result = {
    ...feed,
    updated:
      typeof feed.updated === "string" &&
      Number.isFinite(Date.parse(feed.updated))
        ? feed.updated
        : null,
  };
  for (const key of [
    "news",
    "autoNews",
    "videos",
    "autoVideos",
    "streamers",
    "autoStreamers",
    "trends",
  ]) {
    result[key] = Array.isArray(feed[key])
      ? feed[key].filter((row) => row && typeof row === "object")
      : [];
  }
  result.asmon = {
    ...feed.asmon,
    facts: Array.isArray(feed.asmon?.facts) ? feed.asmon.facts : [],
  };
  return result;
}

function shell(pageFile) {
  if (!document.title) document.title = `${C.CREW_NAME} · ${C.SITE_TITLE}`;
  const nav = PAGES.map(
    ([f, n, i]) =>
      `<a href="${f}" ${f === pageFile ? 'aria-current="page"' : ""} class="${f === pageFile ? "on" : ""}"><span aria-hidden="true">${i}</span> ${n}</a>`,
  ).join("");
  document.body.insertAdjacentHTML(
    "afterbegin",
    `
  <a class="skip" href="#page">Skip to content</a><div class="crewbar">${esc(C.CREW_NAME)} <small>· ${esc(C.CREW_SHORT)} · ${esc(C.SITE_TITLE)}</small></div>
  <header class="top"><div class="navin">
    <a class="brand" href="index.html" aria-label="${esc(C.CREW_NAME)} home"><div><b>${esc(C.CREW_SHORT)}</b><span>${esc(C.CREW_NAME)}</span></div></a>
    <button class="burger" aria-label="Menu" aria-controls="site-nav" aria-expanded="false">Menu</button>
    <nav class="links" id="site-nav" aria-label="Main navigation">${nav}</nav></div></header>`,
  );
  const bn = [
    ["index.html", "Home", ""],
    ["roster.html", "Roster", ""],
    ["warroom.html", "Comp", "", "hub"],
    ["news.html", "News", ""],
  ];
  document.body.insertAdjacentHTML(
    "beforeend",
    `
  <footer><p class="footer-brand">BBCC <span>See you at the meeting stone.</span></p>
  <p class="small">World of Warcraft® is a trademark of Blizzard Entertainment. Not affiliated with Blizzard.</p></footer>
  <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="avg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2016"/><stop offset="1" stop-color="#0c0907"/></linearGradient></defs></svg>
  <div class="sheetbg" hidden></div>
  <nav class="bottomnav" aria-label="Quick navigation">${bn.map(([f, n, i, x]) => `<a href="${f}" class="${f === pageFile ? "on" : ""} ${x || ""}"${f === pageFile ? ' aria-current="page"' : ""}><span aria-hidden="true">${i}</span>${n}</a>`).join("")}<button class="more" aria-expanded="false"><span aria-hidden="true"></span>More</button></nav>`,
  );
  const links = $("nav.links"),
    bur = $(".burger");
  const bg = $(".sheetbg"),
    more = $(".bottomnav .more");
  let opener = bur;
  const tog = (force) => {
    const o = links.classList.toggle("open", force);
    bur.setAttribute("aria-expanded", o);
    more.setAttribute("aria-expanded", o);
    bg.hidden = !o;
    document.body.classList.toggle("sheet-open", o);
    links.style.visibility = o ? "visible" : "";
    if (o) {
      opener = document.activeElement;
      setTimeout(() => {
        if (links.classList.contains("open"))
          links.querySelector("a").focus({ preventScroll: true });
      }, 0);
    } else if (links.contains(document.activeElement)) opener.focus();
    $("#page").inert = o;
    $("footer").inert = o;
  };
  bur.onclick = () => tog();
  more.onclick = () => tog();
  bg.onclick = () => tog(false);
  document.addEventListener("keydown", (e) => {
    if (!links.classList.contains("open")) return;
    if (e.key === "Escape") tog(false);
    if (e.key === "Tab") {
      const stops = [...links.querySelectorAll("a"), opener];
      const index = stops.indexOf(document.activeElement);
      e.preventDefault();
      stops[(index + (e.shiftKey ? stops.length - 1 : 1)) % stops.length].focus();
    }
  });
  matchMedia("(max-width: 1060px)").addEventListener("change", (e) => {
    if (!e.matches && links.classList.contains("open")) tog(false);
  });
}
function stamp() {
  if (!BB.live.updated) {
    $$(".liveStamp").forEach(
      (e) => (e.textContent = "Feed unavailable — try again soon"),
    );
    return;
  }
  const d = new Date(BB.live.updated);
  const s =
    d.toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }) + " ET";
  $$(".liveStamp").forEach((e) => (e.textContent = s));
}
/* ---------- countdown ---------- */
function countdown(el) {
  const T = new Date(C.LAUNCH_UTC).getTime();
  el.innerHTML = ["Days", "Hours", "Mins", "Secs"]
    .map((l) => `<div class="cd"><b>00</b><span>${l}</span></div>`)
    .join("");
  const bs = $$("b", el),
    flip = !matchMedia(
      "(pointer: coarse), (max-width: 899px), (prefers-reduced-motion: reduce)",
    ).matches;
  let timer = 0,
    onScreen = true;
  // ticks on the second, only while the countdown is on screen and the tab is visible
  const tick = () => {
    clearTimeout(timer);
    const s = Math.max(0, Math.floor((T - Date.now()) / 1000));
    const v = [
      Math.floor(s / 86400),
      Math.floor((s % 86400) / 3600),
      Math.floor((s % 3600) / 60),
      s % 60,
    ];
    // alternate two identical keyframes to replay the flip without forcing a reflow
    v.forEach((x, i) => {
      const t = String(x).padStart(2, "0");
      if (bs[i].textContent !== t) {
        bs[i].textContent = t;
        if (flip)
          bs[i].className = bs[i].className === "tick" ? "tock" : "tick";
      }
    });
    if (s > 0 && onScreen && !document.hidden)
      timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 10);
  };
  if ("IntersectionObserver" in window)
    new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      tick();
    }).observe(el);
  document.addEventListener("visibilitychange", tick);
  tick();
}
/* ---------- helpers ---------- */
const cls = (k) => (own(BB.game.classes, k) ? BB.game.classes[k] : null);
const tier = (t) => `<span class="tier t${t}" title="Tier ${t}">${t}</span>`;
const TODAY = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" }); // YYYY-MM-DD, PT
const fmtD = (d) =>
  new Date(d + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
function memberName(m) {
  if (m.profileUrl)
    return `<a class="member-name link" href="${esc(m.profileUrl)}" target="_blank" rel="noopener">${esc(m.name)}</a>`;
  return `<span class="member-name">${esc(m.name)}</span>`;
}
function toast(t) {
  let e = $("#toast");
  if (!e) {
    e = document.createElement("div");
    e.id = "toast";
    e.setAttribute("role", "status");
    document.body.append(e);
  }
  e.textContent = t;
  e.className = "show";
  clearTimeout(e._t);
  e._t = setTimeout(() => (e.className = ""), 1800);
}
function factionOf(race) {
  return Object.keys(BB.game.races).find((f) => BB.game.races[f][race]);
}
function reveal() {
  const io = new IntersectionObserver(
    (es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
    { threshold: 0.08 },
  );
  $$(".reveal").forEach((e) => io.observe(e));
}

/* ---------- avatars: always in-game 3D models (shimmer while loading) ---------- */
function avInner() {
  return `<span class="ph" aria-hidden="true"></span>`;
}
function avatar(clsKey, race, name, opt = {}) {
  const c = cls(clsKey) || { color: "#888" };
  return `<div class="av ${opt.cls || ""}" data-cls="${esc(clsKey)}" data-race="${esc(race)}" data-key="${esc(opt.key || "")}"${opt.m3d ? ` data-m3d="${opt.m3d}"` : ""} style="--cc:${c.color}" role="img" aria-label="${esc(name ? name + ": " : "")}${esc(race)} ${esc(c.name || "")}">${avInner(clsKey, race, name)}</div>`;
}
function setAvatar(el, clsKey, race, name) {
  if (el.dataset.cls === clsKey && el.dataset.race === race) return;
  const c = cls(clsKey);
  el.dataset.cls = clsKey;
  el.dataset.race = race;
  el.style.setProperty("--cc", c.color);
  el.setAttribute("aria-label", `${name ? name + ": " : ""}${race} ${c.name}`);
  window.M3D && M3D.refresh(el);
}
function bindAvatars(root = document) {
  window.M3D && M3D.observe(root);
}
function ytCard(v) {
  return `<div class="panel reveal"><div class="yt" data-id="${esc(v.id)}" role="button" tabindex="0" aria-label="Play ${esc(v.title)}"><img loading="lazy" src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" alt=""></div><h4 style="margin:.6rem 0 .1rem">${esc(v.title)}</h4><div class="small">${esc(v.by)}${v.d ? " · " + fmtD(v.d) : ""} · <a href="https://www.youtube.com/watch?v=${esc(v.id)}" target="_blank" rel="noopener">YouTube ↗</a></div></div>`;
}
function bindYT() {
  $$(".yt").forEach((y) => {
    const go = () => {
      y.outerHTML = `<iframe class="vid" src="https://www.youtube-nocookie.com/embed/${y.dataset.id}?autoplay=1" title="YouTube video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    };
    y.onclick = go;
    y.onkeydown = (e) =>
      ["Enter", " "].includes(e.key) && (e.preventDefault(), go());
  });
}
