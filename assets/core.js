/* BBCC War Room core: shell, data, countdown, avatars */
const C = window.BBCC_CONFIG;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const BB = {};
const PAGES = [
  ["index.html", "Home", "🏰"], ["warroom.html", "War Room", "⚔️"], ["roster.html", "Roster", "🛡️"],
  ["pve-pvp.html", "PvE vs PvP", "⚖️"], ["factions.html", "Factions", "🚩"], ["meta.html", "Meta", "📊"],
  ["racials.html", "Racials", "🧬"], ["news.html", "News", "📜"], ["streamers.html", "Streamers", "🎥"], ["guild.html", "Guild Name", "🗳️"]
];
const CREST = `<svg class="crest" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2bf"/><stop offset=".5" stop-color="#d9a441"/><stop offset="1" stop-color="#7a5418"/></linearGradient></defs><path d="M32 3 56 12v18c0 15-10 25-24 31C18 55 8 45 8 30V12z" fill="#1a120a" stroke="url(#cg)" stroke-width="3"/><path d="M32 3v58" stroke="url(#cg)" stroke-width="1.2" opacity=".5"/><path d="M8 12 32 3v58C18 55 8 45 8 30z" fill="#1d3f9e" opacity=".55"/><path d="M56 12 32 3v58c14-6 24-16 24-31z" fill="#8e1a14" opacity=".55"/><text x="32" y="38" text-anchor="middle" font-family="Cinzel" font-weight="900" font-size="12" fill="url(#cg)">BBCC</text></svg>`;

const CREST_BIG = `<svg class="crestbig" viewBox="0 0 260 300" role="img" aria-label="${esc(C.CREW_SHORT)} crest"><defs>
<linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d0"/><stop offset=".35" stop-color="#f0c766"/><stop offset=".65" stop-color="#a8701f"/><stop offset="1" stop-color="#ffe29a"/></linearGradient>
<linearGradient id="bA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a6cf0"/><stop offset="1" stop-color="#0a1a4f"/></linearGradient>
<linearGradient id="bH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8352a"/><stop offset="1" stop-color="#3d0805"/></linearGradient>
<linearGradient id="bS" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d97a8"/><stop offset=".5" stop-color="#f4f7ff"/><stop offset="1" stop-color="#8d97a8"/></linearGradient>
<radialGradient id="bG"><stop offset="0" stop-color="#cfefff"/><stop offset="1" stop-color="#5fb8ff" stop-opacity="0"/></radialGradient>
<clipPath id="bL"><rect x="0" y="0" width="130" height="300"/></clipPath><clipPath id="bR"><rect x="130" y="0" width="130" height="300"/></clipPath></defs>
<g opacity=".95"><g transform="rotate(-38 130 150)"><rect x="124" y="10" width="12" height="210" rx="2" fill="url(#bS)"/><path d="M124 10l6-14 6 14z" fill="#f4f7ff"/><rect x="96" y="214" width="68" height="10" rx="4" fill="url(#bg1)"/><rect x="125" y="224" width="10" height="34" fill="#4a2d12"/><circle cx="130" cy="264" r="9" fill="url(#bg1)"/></g>
<g transform="rotate(38 130 150)"><rect x="124" y="10" width="12" height="210" rx="2" fill="url(#bS)"/><path d="M124 10l6-14 6 14z" fill="#f4f7ff"/><rect x="96" y="214" width="68" height="10" rx="4" fill="url(#bg1)"/><rect x="125" y="224" width="10" height="34" fill="#4a2d12"/><circle cx="130" cy="264" r="9" fill="url(#bg1)"/></g></g>
<path d="M130 34 210 60v74c0 62-36 104-80 124-44-20-80-62-80-124V60z" fill="#120c06"/>
<path d="M130 34 210 60v74c0 62-36 104-80 124-44-20-80-62-80-124V60z" fill="url(#bA)" clip-path="url(#bL)"/>
<path d="M130 34 210 60v74c0 62-36 104-80 124-44-20-80-62-80-124V60z" fill="url(#bH)" clip-path="url(#bR)"/>
<path d="M130 50 196 72v62c0 52-30 88-66 106-36-18-66-54-66-106V72z" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="3"/>
<path d="M130 34 210 60v74c0 62-36 104-80 124-44-20-80-62-80-124V60z" fill="none" stroke="url(#bg1)" stroke-width="8" stroke-linejoin="round"/>
<path d="M130 46 200 69v65c0 55-31 93-70 112-39-19-70-57-70-112V69z" fill="none" stroke="#ffe7a3" stroke-opacity=".45" stroke-width="1.5"/>
<circle cx="130" cy="112" r="38" fill="url(#bG)" opacity=".45"/>
<g stroke="#e9f8ff" stroke-width="5" stroke-linecap="round" fill="none"><path d="M130 82v60M104 97l52 30M104 127l52-30"/><path d="M122 86l8 8 8-8M122 138l8-8 8 8M106 106l11 1-5 10M154 106l-11 1 5 10M106 118l11-1-5-10M154 118l-11-1 5-10" stroke-width="3.5"/></g>
<path d="M28 176c34 10 68 10 102 10s68 0 102-10l-8 22 14 16c-36 12-72 14-108 14s-72-2-108-14l14-16z" fill="#1a0f06" stroke="url(#bg1)" stroke-width="3.5" stroke-linejoin="round"/>
<text x="130" y="214" text-anchor="middle" font-family="Cinzel Decorative,Cinzel,serif" font-weight="900" font-size="30" letter-spacing="3" fill="url(#bg1)">${esc(C.CREW_SHORT)}</text>
<path d="M130 18l7 12h-14z M118 26l-6-10 10 4z M142 26l6-10-10 4z" fill="url(#bg1)"/></svg>`;

async function loadData() {
  const get = f => fetch(f + "?v=" + Date.now()).then(r => r.json());
  [BB.members, BB.game, BB.content, BB.live] = await Promise.all([get("data/members.json"), get("data/game.json"), get("data/content.json"), get("data/live.json")]);
  BB.M = Object.fromEntries(BB.members.members.map(m => [m.id, m]));
}

function shell(pageFile) {
  if (!document.title) document.title = `${C.CREW_NAME} · ${C.SITE_TITLE}`;
  const nav = PAGES.map(([f, n, i]) => `<a href="${f}" class="${f === pageFile ? "on" : ""}"><span aria-hidden="true">${i}</span> ${n}</a>`).join("");
  document.body.insertAdjacentHTML("afterbegin", `
  <div class="crewbar">${esc(C.CREW_NAME)} <small>· ${esc(C.CREW_SHORT)} · ${esc(C.SITE_TITLE)}</small></div>
  <header class="top"><div class="navin">
    <a class="brand" href="index.html" aria-label="${esc(C.CREW_NAME)} home">${CREST}<div><b>${esc(C.CREW_SHORT)}</b><span>${esc(C.CREW_NAME)}</span></div></a>
    <button class="burger" aria-label="Menu" aria-expanded="false">☰</button>
    <nav class="links">${nav}</nav></div></header>`);
  const bn = [["index.html", "Home", "🏰"], ["roster.html", "Roster", "🛡️"], ["warroom.html", "Comp", "⚔️", "hub"], ["news.html", "News", "📜"]];
  document.body.insertAdjacentHTML("beforeend", `
  <footer><p>Made by the crew, for the crew.</p>
  <p class="small">World of Warcraft® is a trademark of Blizzard Entertainment. Not affiliated with Blizzard.</p></footer>
  <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="avg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2016"/><stop offset="1" stop-color="#0c0907"/></linearGradient></defs></svg>
  <div class="sheetbg" hidden></div>
  <nav class="bottomnav" aria-label="Quick navigation">${bn.map(([f, n, i, x]) => `<a href="${f}" class="${f === pageFile ? "on" : ""} ${x || ""}"${f === pageFile ? ' aria-current="page"' : ""}><span aria-hidden="true">${i}</span>${n}</a>`).join("")}<button class="more" aria-expanded="false"><span aria-hidden="true">☰</span>More</button></nav>`);
  const links = $("nav.links"), bur = $(".burger");
  const bg = $(".sheetbg"), more = $(".bottomnav .more");
  const tog = force => { const o = links.classList.toggle("open", force); bur.setAttribute("aria-expanded", o); more.setAttribute("aria-expanded", o); bg.hidden = !o; document.body.classList.toggle("sheet-open", o); };
  bur.onclick = () => tog(); more.onclick = () => tog(); bg.onclick = () => tog(false);
  document.addEventListener("keydown", e => e.key === "Escape" && tog(false));
}
function stamp() {
  const d = new Date(BB.live.updated);
  const s = d.toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + " ET";
  $$(".liveStamp").forEach(e => e.textContent = s);
}
/* ---------- countdown ---------- */
function countdown(el) {
  const T = new Date(C.LAUNCH_UTC).getTime();
  el.innerHTML = ["Days", "Hours", "Mins", "Secs"].map(l => `<div class="cd"><b>00</b><span>${l}</span></div>`).join("");
  const bs = $$("b", el);
  const tick = () => {
    let s = Math.max(0, Math.floor((T - Date.now()) / 1000));
    const v = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60];
    v.forEach((x, i) => { const t = String(x).padStart(2, "0"); if (bs[i].textContent !== t) { bs[i].textContent = t; bs[i].classList.remove("tick"); void bs[i].offsetWidth; bs[i].classList.add("tick"); } });
    if (s === 0) el.insertAdjacentHTML("afterend", "");
  };
  tick(); setInterval(tick, 1000);
}
/* ---------- helpers ---------- */
const cls = k => BB.game.classes[k];
const tier = t => `<span class="tier t${t}" title="Tier ${t}">${t}</span>`;
const TODAY = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" }); // YYYY-MM-DD, PT
const fmtD = d => new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
function memberName(m) {
  if (m.profileUrl) return `<a class="member-name link" href="${esc(m.profileUrl)}" target="_blank" rel="noopener">${esc(m.name)}</a>`;
  return `<span class="member-name">${esc(m.name)}</span>`;
}
function toast(t) { let e = $("#toast"); if (!e) { e = document.createElement("div"); e.id = "toast"; document.body.append(e); } e.textContent = t; e.className = "show"; clearTimeout(e._t); e._t = setTimeout(() => e.className = "", 1800); }
function factionOf(race) { return Object.keys(BB.game.races).find(f => BB.game.races[f][race]); }
function reveal() { const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add("in")), { threshold: .08 }); $$(".reveal").forEach(e => io.observe(e)); }

/* ---------- avatars: always in-game 3D models (shimmer while loading) ---------- */
function avInner() { return `<div class="ph" aria-hidden="true"></div>`; }
function avatar(clsKey, race, name, opt = {}) {
  const c = cls(clsKey) || { color: "#888" };
  return `<div class="av ${opt.cls || ""}" data-cls="${esc(clsKey)}" data-race="${esc(race)}" data-key="${esc(opt.key || "")}"${opt.m3d ? ` data-m3d="${opt.m3d}"` : ""} style="--cc:${c.color}" role="img" aria-label="${esc(name ? name + ": " : "")}${esc(race)} ${esc(c.name || "")}">${avInner(clsKey, race, name)}</div>`;
}
function setAvatar(el, clsKey, race, name) {
  if (el.dataset.cls === clsKey && el.dataset.race === race) return;
  const c = cls(clsKey);
  el.dataset.cls = clsKey; el.dataset.race = race; el.style.setProperty("--cc", c.color);
  el.setAttribute("aria-label", `${name ? name + ": " : ""}${race} ${c.name}`);
    window.M3D && M3D.refresh(el);
}
function bindAvatars(root = document) { window.M3D && M3D.observe(root); }
function ytCard(v) {
  return `<div class="panel reveal"><div class="yt" data-id="${esc(v.id)}" role="button" tabindex="0" aria-label="Play ${esc(v.title)}"><img loading="lazy" src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" alt=""></div><h4 style="margin:.6rem 0 .1rem">${esc(v.title)}</h4><div class="small">${esc(v.by)}${v.d ? " · " + fmtD(v.d) : ""} · <a href="https://www.youtube.com/watch?v=${esc(v.id)}" target="_blank" rel="noopener">YouTube ↗</a></div></div>`;
}
function bindYT() { $$(".yt").forEach(y => { const go = () => { y.outerHTML = `<iframe class="vid" src="https://www.youtube-nocookie.com/embed/${y.dataset.id}?autoplay=1" title="YouTube video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`; }; y.onclick = go; y.onkeydown = e => e.key === "Enter" && go(); }); }
