/* BBCC War Room core: shell, data, countdown, figures */
const C = window.BBCC_CONFIG;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const BB = {};
const PAGES = [
  ["index.html", "Home", "🏰"], ["warroom.html", "War Room", "⚔️"], ["roster.html", "Roster", "🛡️"],
  ["pve-pvp.html", "PvE vs PvP", "⚖️"], ["factions.html", "Alliance vs Horde", "🚩"], ["meta.html", "Meta & Stats", "📊"],
  ["racials.html", "Racials", "🧬"], ["news.html", "News & Videos", "📜"], ["streamers.html", "Streamer Intel", "🎥"], ["guild.html", "Guild Name", "🗳️"]
];
const CREST = `<svg class="crest" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2bf"/><stop offset=".5" stop-color="#d9a441"/><stop offset="1" stop-color="#7a5418"/></linearGradient></defs><path d="M32 3 56 12v18c0 15-10 25-24 31C18 55 8 45 8 30V12z" fill="#1a120a" stroke="url(#cg)" stroke-width="3"/><path d="M32 3v58" stroke="url(#cg)" stroke-width="1.2" opacity=".5"/><path d="M8 12 32 3v58C18 55 8 45 8 30z" fill="#1d3f9e" opacity=".55"/><path d="M56 12 32 3v58c14-6 24-16 24-31z" fill="#8e1a14" opacity=".55"/><text x="32" y="40" text-anchor="middle" font-family="Cinzel" font-weight="900" font-size="15" fill="url(#cg)">BBCC</text></svg>`;

async function loadData() {
  const get = f => fetch(f + "?v=" + Date.now()).then(r => r.json());
  [BB.members, BB.game, BB.content, BB.live] = await Promise.all([get("data/members.json"), get("data/game.json"), get("data/content.json"), get("data/live.json")]);
  BB.M = Object.fromEntries(BB.members.members.map(m => [m.id, m]));
}

function shell(pageFile) {
  document.title = `${C.CREW_NAME} · ${C.SITE_TITLE}`;
  const nav = PAGES.map(([f, n, i]) => `<a href="${f}" class="${f === pageFile ? "on" : ""}"><span aria-hidden="true">${i}</span> ${n}</a>`).join("");
  document.body.insertAdjacentHTML("afterbegin", `
  <div class="crewbar">${esc(C.CREW_NAME)} <small>· ${esc(C.CREW_SHORT)} · ${esc(C.SITE_TITLE)}</small></div>
  <header class="top"><div class="navin">
    <a class="brand" href="index.html">${CREST}<div><b>${esc(C.CREW_SHORT)}</b><span>WAR ROOM</span></div></a>
    <button class="burger" aria-label="Menu" aria-expanded="false">☰</button>
    <nav class="links">${nav}</nav></div></header>`);
  const bn = [["index.html", "Home", "🏰"], ["warroom.html", "Comp", "⚔️"], ["roster.html", "Roster", "🛡️"], ["news.html", "News", "📜"]];
  document.body.insertAdjacentHTML("beforeend", `
  <footer><div class="crewbig">${esc(C.CREW_NAME)}</div>
  <p>Fan-made war room for the ${esc(C.CREW_SHORT)} Discord crew. Data comes from public sources (Blizzard, Wowhead, tier-list sites, creators' public posts) and from our own crew chat (real quotes). Tier lists come from the level-30 beta and will change after launch. Not affiliated with Blizzard Entertainment. World of Warcraft® is a trademark of Blizzard. All art on this site is original.</p>
  <p class="small">Live data updated: <b id="liveStamp">…</b> · Site build ${esc(C.UPDATED)}</p></footer>
  <nav class="bottomnav">${bn.map(([f, n, i]) => `<a href="${f}" class="${f === pageFile ? "on" : ""}"><span>${i}</span>${n}</a>`).join("")}<button class="more"><span>☰</span>More</button></nav>`);
  const links = $("nav.links"), bur = $(".burger");
  const tog = () => { links.classList.toggle("open"); bur.setAttribute("aria-expanded", links.classList.contains("open")); };
  bur.onclick = tog; $(".bottomnav .more").onclick = () => { tog(); window.scrollTo({ top: 0, behavior: "smooth" }); };
}
function stamp() {
  const d = new Date(BB.live.updated);
  const s = d.toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + " ET";
  $$("#liveStamp,.liveStamp").forEach(e => e.textContent = s);
}
/* ---------- countdown ---------- */
function countdown(el) {
  const T = new Date(C.LAUNCH_UTC).getTime();
  el.innerHTML = ["Days", "Hours", "Mins", "Secs"].map(l => `<div><b>00</b><span>${l}</span></div>`).join("");
  const bs = $$("b", el);
  const tick = () => {
    let s = Math.max(0, Math.floor((T - Date.now()) / 1000));
    const v = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60];
    v.forEach((x, i) => { const t = String(x).padStart(2, "0"); if (bs[i].textContent !== t) bs[i].textContent = t; });
    if (s === 0) el.insertAdjacentHTML("afterend", "");
  };
  tick(); setInterval(tick, 1000);
}
/* ---------- helpers ---------- */
const cls = k => BB.game.classes[k];
const tier = t => `<span class="tier t${t}" title="Tier ${t}">${t}</span>`;
const fmtD = d => new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
function memberName(m) {
  if (m.profileUrl) return `<a class="member-name link" href="${esc(m.profileUrl)}" target="_blank" rel="noopener">${esc(m.name)}</a>`;
  if (m.battletag) return `<span class="member-name link" title="Click to copy BattleTag ${esc(m.battletag)}" onclick="navigator.clipboard&&navigator.clipboard.writeText('${esc(m.battletag)}');this.dataset.c=1;toast('Copied ${esc(m.battletag)}')">${esc(m.name)}</span>`;
  return `<span class="member-name">${esc(m.name)}</span>`;
}
function toast(t) { let e = $("#toast"); if (!e) { e = document.createElement("div"); e.id = "toast"; document.body.append(e); } e.textContent = t; e.className = "show"; clearTimeout(e._t); e._t = setTimeout(() => e.className = "", 1800); }
function factionOf(race) { return Object.keys(BB.game.races).find(f => BB.game.races[f][race]); }
function reveal() { const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add("in")), { threshold: .08 }); $$(".reveal").forEach(e => io.observe(e)); }

/* ---------- original SVG hero figures (race + class kit) ---------- */
const RACE_LOOK = {
  "Human": { skin: "#e8b48f", h: 1, hair: "#5b3a1e" }, "Dwarf": { skin: "#e0a27c", h: .8, w: 1.18, beard: "#a0522d", hair: "#a0522d" },
  "Night Elf": { skin: "#8a7bd1", h: 1.08, ears: 1, hair: "#2fd1c4", eyes: "#d8fbff" }, "Gnome": { skin: "#f2c3a0", h: .66, w: 1.05, hair: "#ff5fa2" },
  "High Order Skyborne": { skin: "#cfd9ff", h: 1.04, ears: .8, hair: "#f4f7ff", eyes: "#7fe3ff", wingtips: 1 },
  "Orc": { skin: "#5f8f3a", h: 1.02, w: 1.15, tusks: 1, hair: "#1d1d1d" }, "Tauren": { skin: "#7a5233", h: 1.12, w: 1.3, horns: 1, hair: "#3b2414" },
  "Troll": { skin: "#4f8fa1", h: 1.08, tusks: 2, ears: .6, hair: "#e0472b" }, "Undead": { skin: "#9fae9a", h: .98, w: .9, hair: "#3a3a3a", eyes: "#ffe76b" },
  "Windshaper Skyborne": { skin: "#b9e3dc", h: 1.04, ears: .8, hair: "#e8fff9", eyes: "#9effd6", wingtips: 1 }
};
const ARMOR = { warrior: "plate", paladin: "plate", hunter: "mail", shaman: "mail", rogue: "leather", druid: "leather", mage: "cloth", priest: "cloth", warlock: "cloth" };
function figureSVG(clsKey, race, back = false) {
  const L = RACE_LOOK[race] || RACE_LOOK.Human, c = cls(clsKey)?.color || "#888", a = ARMOR[clsKey] || "cloth";
  const w = L.w || 1, uid = Math.random().toString(36).slice(2, 7);
  const metal = a === "plate" ? "#c9ccd6" : a === "mail" ? "#9aa3ad" : a === "leather" ? "#6b4a2b" : c;
  const robe = a === "cloth";
  const weap = {
    warrior: `<g transform="translate(150 70) rotate(18)"><rect x="-4" y="0" width="8" height="110" rx="2" fill="#d9dde6"/><rect x="-18" y="100" width="36" height="7" rx="3" fill="#b8862f"/><rect x="-3" y="107" width="6" height="22" fill="#5a3a1a"/></g><path d="M40 120 q-22 30 0 62 q22-30 0-62z" fill="${c}" stroke="#e7c26b" stroke-width="3"/>`,
    paladin: `<g transform="translate(150 95)"><rect x="-3" y="0" width="6" height="80" fill="#5a3a1a"/><rect x="-16" y="-14" width="32" height="24" rx="5" fill="#e7c26b" stroke="#fff3c4" stroke-width="2"/></g><circle cx="44" cy="150" r="24" fill="#f4f0e6" stroke="#e7c26b" stroke-width="4"/><path d="M44 134v32M30 150h28" stroke="${c}" stroke-width="5"/>`,
    hunter: `<path d="M34 60 q-30 80 0 160" stroke="#7a4f22" stroke-width="7" fill="none"/><path d="M34 60 L34 220" stroke="#eee" stroke-width="1.5"/><g transform="translate(150 70)"><rect x="-6" y="0" width="12" height="60" rx="3" fill="#6b4a2b"/><path d="M-4 0 l4-14 4 14M2 0l4-12 3 12" stroke="#ddd" stroke-width="2" fill="none"/></g>`,
    mage: `<rect x="148" y="40" width="7" height="190" rx="3" fill="#6b4a2b"/><circle cx="151" cy="38" r="13" fill="#bff3ff" stroke="${c}" stroke-width="4" class="glow"/><circle cx="44" cy="150" r="11" fill="${c}" opacity=".8" class="glow"/>`,
    priest: `<rect x="148" y="50" width="7" height="180" rx="3" fill="#e9dcc0"/><circle cx="151" cy="44" r="15" fill="none" stroke="#ffe9a8" stroke-width="5" class="glow"/><path d="M151 30v28M137 44h28" stroke="#fff" stroke-width="3"/>`,
    rogue: `<g transform="translate(150 140) rotate(-30)"><path d="M0 0 l5 -60 5 60z" fill="#dfe3ea"/><rect x="-3" y="0" width="16" height="5" fill="#333"/></g><g transform="translate(42 140) rotate(30)"><path d="M0 0 l5 -60 5 60z" fill="#dfe3ea"/><rect x="-3" y="0" width="16" height="5" fill="#333"/></g>`,
    shaman: `<rect x="148" y="70" width="8" height="160" rx="3" fill="#6b4a2b"/><path d="M140 72 l12-30 12 30z" fill="#3fa9ff" class="glow"/><rect x="28" y="196" width="22" height="36" rx="3" fill="#a0522d"/><rect x="28" y="190" width="22" height="8" fill="${c}"/><circle cx="39" cy="210" r="5" fill="#ffd34d"/>`,
    warlock: `<rect x="148" y="50" width="7" height="180" rx="3" fill="#2a1c3a"/><path d="M140 52 q11-26 22 0 q-11 10-22 0z" fill="#9b5cff" class="glow"/><circle cx="44" cy="150" r="13" fill="#6dff6a" opacity=".85" class="glow"/>`,
    druid: `<path d="M150 230 q-10-90 4-180 q14 6 6 22 q-6 10 6 18" stroke="#6b4a2b" stroke-width="8" fill="none"/><circle cx="160" cy="50" r="10" fill="#7dff8a" class="glow"/><path d="M36 150 q8-14 16 0 q-8 14-16 0z" fill="#5fd35f"/>`
  }[clsKey] || "";
  const ears = L.ears ? `<path d="M76 70 L${76 - 30 * L.ears} ${56 - 6 * L.ears} L80 80z" fill="${L.skin}"/><path d="M124 70 L${124 + 30 * L.ears} ${56 - 6 * L.ears} L120 80z" fill="${L.skin}"/>` : "";
  const horns = L.horns ? `<path d="M74 58 q-24-6 -26-30 q10 14 30 18z" fill="#efe3c8"/><path d="M126 58 q24-6 26-30 q-10 14-30 18z" fill="#efe3c8"/>` : "";
  const tusks = L.tusks ? `<path d="M90 92 l-3 -10 4 2z M110 92 l3 -10 -4 2z" fill="#fff" stroke="#ddd"/>` : "";
  const beard = L.beard ? `<path d="M80 84 q20 50 40 0 q-4 8 -20 8 q-16 0 -20 -8z" fill="${L.beard}"/>` : "";
  const helm = (a === "plate" && !back) ? `<path d="M78 66 q22-30 44 0 v6 h-44z" fill="${metal}" stroke="#666"/>` : robe ? `<path d="M74 72 q26-46 52 0 q-6-16-26-18 q-20 2-26 18z" fill="${c}" opacity=".9"/>` : "";
  const face = back ? `<path d="M76 66 q24-26 48 0 v14 q-24 6-48 0z" fill="${L.hair}"/>` :
    `<path d="M78 64 q22-22 44 0 l-2 8 q-20-8-40 0z" fill="${L.hair}"/><circle cx="91" cy="74" r="2.6" fill="${L.eyes || "#222"}"/><circle cx="109" cy="74" r="2.6" fill="${L.eyes || "#222"}"/><path d="M93 86 q7 4 14 0" stroke="#5a2a1a" stroke-width="1.6" fill="none"/>`;
  const wings = L.wingtips ? `<path d="M64 120 q-40-20-46 30 q22-8 46-10z" fill="#ffffff" opacity=".35"/><path d="M136 120 q40-20 46 30 q-22-8-46-10z" fill="#ffffff" opacity=".35"/>` : "";
  const torso = robe
    ? `<path d="M70 104 h60 l20 132 h-100z" fill="${c}"/><path d="M100 104 v132" stroke="#e7c26b" stroke-width="3"/><path d="M70 104 h60 l-6 30 h-48z" fill="#00000033"/>`
    : `<path d="M70 104 h60 l-4 70 h-52z" fill="${metal}" stroke="#00000055"/><path d="M78 112 h44 v40 h-44z" fill="${c}" opacity=".85"/><rect x="72" y="172" width="56" height="8" fill="#4a3210"/><rect x="96" y="171" width="8" height="10" fill="#e7c26b"/><path d="M76 180 h20 l-2 56 h-16z M104 180 h20 l-2 56 h-16z" fill="${a === "leather" ? "#4a321c" : metal}" stroke="#00000055"/>`;
  const pauld = `<ellipse cx="66" cy="108" rx="${a === "plate" ? 18 : 12}" ry="${a === "plate" ? 12 : 8}" fill="${a === "plate" ? metal : c}" stroke="#e7c26b" stroke-width="2"/><ellipse cx="134" cy="108" rx="${a === "plate" ? 18 : 12}" ry="${a === "plate" ? 12 : 8}" fill="${a === "plate" ? metal : c}" stroke="#e7c26b" stroke-width="2"/>`;
  const arms = `<path d="M58 112 l-12 50 h12 l10-46z M142 112 l8 46 h-10 l-10-46z" fill="${robe ? c : metal}" stroke="#00000044"/><circle cx="52" cy="166" r="6" fill="${L.skin}"/><circle cx="146" cy="160" r="6" fill="${L.skin}"/>`;
  return `<svg viewBox="0 0 200 250" role="img" aria-label="${esc(race)} ${esc(cls(clsKey)?.name || "")}"><defs><radialGradient id="g${uid}"><stop offset="0" stop-color="${c}" stop-opacity=".55"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs>
  <ellipse cx="100" cy="238" rx="60" ry="9" fill="#000" opacity=".5"/><circle cx="100" cy="130" r="100" fill="url(#g${uid})"/>
  <g transform="translate(100 240) scale(${w} ${L.h}) translate(-100 -240)">${wings}${back ? "" : weap}${torso}${arms}${pauld}${horns}${ears}<ellipse cx="100" cy="76" rx="22" ry="24" fill="${L.skin}"/>${face}${tusks}${beard}${helm}${back ? weap : ""}</g></svg>`;
}
function figure(clsKey, race, small, nocap) {
  const c = cls(clsKey)?.color || "#888";
  return `<div class="figwrap"><div class="fig ${small ? "sm" : ""}" style="--cc:${c}" data-rot="0" tabindex="0" aria-label="Drag to rotate"><div class="face">${figureSVG(clsKey, race)}</div><div class="face back">${figureSVG(clsKey, race, true)}</div></div>${nocap ? "" : `<div class="small figcap">↔ drag to rotate · <a href="https://www.wowhead.com/classic/dressing-room" target="_blank" rel="noopener">Wowhead Dressing Room ↗</a></div>`}</div>`;
}
function bindFigures(root = document) {
  $$(".fig", root).forEach(f => {
    if (f._b) return; f._b = 1; let x0 = null, r = 0, auto = true;
    const set = () => f.style.transform = `rotateY(${r}deg)`;
    f.addEventListener("pointerdown", e => { x0 = e.clientX; auto = false; f.setPointerCapture(e.pointerId); });
    f.addEventListener("pointermove", e => { if (x0 === null) return; r += (e.clientX - x0) * .9; x0 = e.clientX; set(); });
    f.addEventListener("pointerup", () => { x0 = null; });
    f.addEventListener("keydown", e => { if (e.key === "ArrowLeft") r -= 20; if (e.key === "ArrowRight") r += 20; set(); });
    const spin = () => { if (auto && !matchMedia("(prefers-reduced-motion: reduce)").matches) { r = (r + .35) % 360; set(); } if (f.isConnected) requestAnimationFrame(spin); };
    f.style.touchAction = "pan-y"; requestAnimationFrame(spin);
  });
}
function ytCard(v) {
  return `<div class="panel reveal"><div class="yt" data-id="${esc(v.id)}" role="button" tabindex="0" aria-label="Play ${esc(v.title)}"><img loading="lazy" src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" alt=""></div><h4 style="margin:.6rem 0 .1rem">${esc(v.title)}</h4><div class="small">${esc(v.by)}${v.d ? " · " + fmtD(v.d) : ""} · <a href="https://www.youtube.com/watch?v=${esc(v.id)}" target="_blank" rel="noopener">YouTube ↗</a></div></div>`;
}
function bindYT() { $$(".yt").forEach(y => { const go = () => { y.outerHTML = `<iframe class="vid" src="https://www.youtube-nocookie.com/embed/${y.dataset.id}?autoplay=1" title="YouTube video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`; }; y.onclick = go; y.onkeydown = e => e.key === "Enter" && go(); }); }
