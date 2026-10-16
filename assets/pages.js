const P = {};
const src = (t, u) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)} ↗</a>`;
const sQuote = s => `<figure class="panel reveal squote" data-tag="${esc(s.tag)}"><blockquote class="sq">${esc(s.q)}</blockquote><figcaption class="small"><b>${esc(s.who)}</b> · <a href="${esc(s.url)}" target="_blank" rel="noopener">${fmtD(s.d)} ↗</a></figcaption></figure>`;
const streamerBy = tag => BB.live.streamers.filter(s => s.tag.includes(tag));
// segmented toggle + filter chips; onPick(value) runs on tap and once on load
function seg(el, onPick) {
  const bs = $$("button", el);
  const pick = v => { bs.forEach(b => { const on = b.dataset.v === v; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); }); onPick(v); };
  bs.forEach(b => b.onclick = () => pick(b.dataset.v));
  pick((bs.find(b => b.classList.contains("on")) || bs[0]).dataset.v);
}
const segHTML = (cls, opts, label) => `<div class="seg ${cls}" role="group" aria-label="${esc(label)}">${opts.map(([v, t], i) => `<button data-v="${esc(v)}" class="${i ? "" : "on"}">${t}</button>`).join("")}</div>`;
const roleOf = m => cls(m.pick.cls).specs[m.pick.spec].role;

P.home = r => {
  const live = BB.live, M = BB.members.members;
  const t = new Date(C.LAUNCH_UTC);
  const pt = t.toLocaleString("en-US", { timeZone: "America/Los_Angeles", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const et = t.toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" });
  const days = Math.max(0, Math.floor((t - Date.now()) / 864e5));
  const facts = [
    ["🗺️", "No realms", "You pick a ruleset instead: Normal, PvP or Roleplaying, with Hardcore later. You group inside your ruleset and faction."],
    ["🪽", "New race: Skyborne", "Windshapers for the Horde, the High Order for the Alliance."],
    ["🧪", "New combos", "Orc Mage, Troll Warlock, Undead Paladin, Human Hunter, Gnome Priest and Dwarf Shaman."],
    ["🧬", "Racials reworked", "Weapon-skill racials are now crit. Still being tuned in beta."],
    ["🐉", "Raids Dec 9", "Level cap is 60. The first raid tier opens about five weeks after launch."]
  ];
  r.innerHTML = `
  <section class="hero">
   <div class="hero-bg" aria-hidden="true"><i class="beam A"></i><i class="beam H"></i><i class="fog f1"></i><i class="fog f2"></i><i class="ring"></i></div>
   <div class="banner A" aria-hidden="true"><span>🦁</span></div><div class="banner H" aria-hidden="true"><span>🐺</span></div><div class="embers" aria-hidden="true">${Array.from({ length: 22 }, (_, i) => `<i style="left:${(i * 37) % 100}%;animation-duration:${6 + (i % 5) * 2}s;animation-delay:${-i * 1.3}s"></i>`).join("")}</div>
   <div class="herocrest">${CREST_BIG}</div><div class="kicker">The war room of the</div>
   <h1 class="crewname">${(w => `<span class="cn1">${esc(w.slice(0, 2).join(" "))}</span> <span class="cn2">${esc(w.slice(2).join(" "))}</span>`)(C.CREW_NAME.split(" "))}</h1>
   <div class="title2"><i></i>World of Warcraft: Forever<i></i></div>
   <div class="gates">The gates open in</div>
   <div class="count" id="count" aria-live="off"></div>
   <div class="when"><span>⏳ ${pt} PT</span><b>${et} ET</b></div>
   <div class="cta"><a class="btn big" href="warroom.html">⚔️ Build the party</a><a class="btn ghost" href="roster.html">🛡️ Roster</a><a class="btn ghost" href="guild.html">🗳️ Name the guild</a></div>
  </section>
  <section class="wrap">
   <div class="grid g4 stats" style="margin-top:22px">
    <div class="panel stat reveal"><b>${days}</b><span>days to go</span></div>
    <div class="panel stat reveal"><b>9</b><span>classes · 10 races</span></div>
    <div class="panel stat reveal"><b>3+1</b><span>rulesets, Hardcore later</span></div>
    <div class="panel stat reveal"><b>${M.length}</b><span>heroes · ${M.filter(m => m.core).length} core</span></div>
   </div>
   <h2 class="sec">Forever in 30 Seconds</h2>
   <div class="facts">${facts.map(([i, h, b]) => `<details class="xcard reveal"><summary><span class="xi" aria-hidden="true">${i}</span><b>${h}</b></summary><p>${b}</p></details>`).join("")}</div>
   <p class="small center">${src("Blizzard announcement", "https://news.blizzard.com/en-us/article/24302093/carve-a-new-path-with-world-of-warcraft-forever")} · ${src("Rulesets", "https://news.blizzard.com/en-us/article/24302070/choose-your-ruleset-in-world-of-warcraft-forever")}</p>
   <h2 class="sec">The Core Four</h2>
   <div class="grid g4 corefour">${M.filter(m => m.core).map(m => { const c = cls(m.pick.cls); return `<a href="roster.html#${m.id}" class="panel reveal mini" style="--cc:${c.color}">${avatar(m.pick.cls, m.pick.race, "", { key: m.id, m3d: "wide", cls: "md" })}<h3>${esc(m.name)}</h3><div class="cls" style="color:${c.color}">${esc(m.pick.spec)} ${c.name}</div></a>`; }).join("")}</div>
   <h2 class="sec">Road to Launch</h2>
   <div class="timeline">${live.news.slice().reverse().filter(n => n.d >= "2026-10-01").map(n => `<div class="tl reveal ${n.d >= TODAY() ? "fut" : ""}"><b>${fmtD(n.d)}</b><span>${esc(n.t)}</span></div>`).join("")}</div>
   <h2 class="sec">Trending</h2>
   <div class="grid g3 trend">${live.trends.map(t => `<a class="panel reveal tcard" href="${esc(t.url)}" target="_blank" rel="noopener"><div class="small cinzel">${esc(t.k)}</div><h3>${esc(t.v)}</h3><div>${esc(t.n)}</div></a>`).join("")}</div>
  </section>`;
  countdown($("#count"));
};

P.roster = r => {
  const M = BB.members.members;
  r.innerHTML = `<section class="wrap"><h2 class="sec">The Roster</h2><p class="sub">Eight heroes, one Discord, zero agreement on who tanks.</p>
  ${segHTML("rfilter", [["all", "All"], ["core", "Core 4"], ["tank", "🛡️ Tanks"], ["heal", "✚ Healers"], ["dps", "⚔️ DPS"]], "Filter roster")}
  <div class="grid g2 rgrid2">${M.map(m => { const c = cls(m.pick.cls), sp = c.specs[m.pick.spec]; return `
   <article id="${m.id}" class="panel rcard reveal ${m.core ? "core" : ""}" style="--cc:${c.color}" data-role="${sp.role}" data-core="${m.core ? 1 : 0}">
    ${m.core ? '<span class="corebadge tag">★ Core</span>' : ""}
    <div class="rtop">${avatar(m.pick.cls, m.pick.race, m.name, { key: m.id })}
     <div class="rinfo"><h3>${memberName(m)}</h3><div class="h">${esc(m.handle)}${m.alias && m.alias !== m.name ? ` · ${esc(m.alias)}` : ""}</div>
      <div class="pickline">${c.icon} ${esc(m.pick.spec)} ${c.name}<br><span>${esc(m.pick.race)}</span></div>
      <div class="tiers2">${tier(sp.pve)}<span class="small">PvE</span>${tier(sp.pvp)}<span class="small">PvP</span><span class="tag">${m.pick.stated ? "Locked in" : "Our guess"}</span></div>
      <p class="why">${esc(m.why)}</p>
      <div class="small">Alt: ${esc(m.alt)}</div>
      <a class="btn ghost sm" href="warroom.html#m=${m.id}">⚔️ Try in War Room</a>
     </div></div>
    <details class="quotes"><summary>Quotes (${m.quotes.length})</summary>${m.quotes.map(q => `<div class="quote">“${esc(q.t)}”<small>${q.by ? esc(q.by) + " · " : ""}${q.d.length === 4 ? q.d : fmtD(q.d)}</small></div>`).join("")}</details>
   </article>`; }).join("")}</div></section>`;
  seg($(".rfilter", r), v => $$(".rcard", r).forEach(c => { const show = v === "all" || (v === "core" ? c.dataset.core === "1" : v === "tank" ? c.dataset.role.includes("tank") : c.dataset.role === v); c.hidden = !show; }));
  if (location.hash) setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: "center" }), 300);
};

P.pvepvp = r => {
  const side = {
    pve: { h: "🏰 PvE first", pro: ["Tanking, healing and dungeon nights are what this crew has always done.", "Five people is exactly one dungeon group. Raids open Dec 9.", "Holy Paladin, Prot Paladin and Fury Warrior are top-tier PvE picks.", "Nobody gets ganked on a work night."], con: ["Raid sizes aren't confirmed. Vanilla raids took 20-40, so we'd likely team up with a bigger guild.", "Somebody still has to heal."] },
    pvp: { h: "⚔️ PvP first", pro: ["Warlock, Priest and Feral Druid all rate A or S in PvP.", "New 15v15 Darkspear Islands BG, plus WSG, AB and AV.", `Pure chaos. Very ${esc(C.CREW_SHORT)}.`], con: ["Chilly on modern PvP: <i>“World of stun craft.”</i>", "The PvP ruleset is one faction per account, and Olympus (30k+) lives on Alliance PvP.", "No arenas announced yet."] }
  };
  const rs = [["Normal", "🛡️", "Only if both agree", "Both", "Normal", "Mixed", 1], ["PvP", "⚔️", "Anywhere contested", "One per account", "PvP", "Mixed"], ["Roleplaying", "🎭", "Not stated", "Both", "RP", "Mixed"], ["Hardcore", "💀", "Not stated", "Both", "Hardcore only", "Separate (after launch)"]];
  r.innerHTML = `<section class="wrap"><h2 class="sec">PvE vs PvP</h2><p class="sub">No PvP servers anymore. Each character picks a ruleset for life, and battlegrounds mix every ruleset except Hardcore.</p>
  ${segHTML("pvx", [["pve", "🏰 PvE"], ["pvp", "⚔️ PvP"]], "Show PvE or PvP")}
  <div class="panel reveal procon" id="procon"></div>
  <h2 class="sec">Our Call</h2>
  <div class="panel parch reveal"><h3 style="margin-top:0">🏆 Normal ruleset. Dungeons first, BG nights for PvP.</h3>
   <ul><li>Level and run dungeons without 40k Olympus tabards camping the flight path.</li><li>BGs still mix rulesets, so the PvP crowd loses nothing.</li><li>Both factions allowed, so Horde alts are fair game.</li></ul>
   <p><b>Go PvP instead if</b> the crew wants open-world danger. Pick the faction together first: it's one per account.</p>
   <p class="small">${src("Blizzard rulesets", "https://news.blizzard.com/en-us/article/24302070/choose-your-ruleset-in-world-of-warcraft-forever")}</p></div>
  <h2 class="sec">Rulesets</h2><p class="sub">Tap one for the details.</p>
  <div class="grid g4 rulesets">${rs.map(([n, i, w, f, g, b, rec]) => `<details class="panel reveal rs ${rec ? "rec" : ""}" ${rec ? "open" : ""}><summary>${rec ? '<span class="tag">Our pick</span>' : ""}<span class="rs-ico" aria-hidden="true">${i}</span><h3>${n}</h3></summary><dl><dt>World PvP</dt><dd>${w}</dd><dt>Factions</dt><dd>${f}</dd><dt>Groups with</dt><dd>${g}</dd><dt>BGs</dt><dd>${b}</dd></dl></details>`).join("")}</div>
  <h2 class="sec">Streamers Say</h2>
  <div class="grid g2">${[...streamerBy("PvP"), ...streamerBy("Purist"), ...streamerBy("Realm")].map(sQuote).join("")}</div></section>`;
  seg($(".pvx", r), v => { const s = side[v]; $("#procon").className = "panel procon " + v; $("#procon").innerHTML = `<h3>${s.h}</h3><div class="pc"><div><b class="pro">Good for us</b><ul>${s.pro.map(x => `<li>${x}</li>`).join("")}</ul></div><div><b class="con">Watch out</b><ul>${s.con.map(x => `<li>${x}</li>`).join("")}</ul></div></div>`; });
};

P.factions = r => {
  const G = BB.game;
  const facs = {
    Alliance: ["🦁", ["The crew's “slay the dirty Horde” WotLK era, and hamfish “dominated horde in cata”.", "Human (S tier) has the only stun break, Will to Survive.", "Dwarf Shaman is new: Alliance finally gets totems.", "⚠️ Olympus (Asmongold, 30-40k) is Alliance on the PvP ruleset."]],
    Horde: ["🐺", ["Orc (S tier) has Blood Fury, the best PvE racial, now buffing spell power too.", "Undead fear break is the top Horde PvP racial, and Undead Paladins are new.", "Sodapoppin reportedly went Horde to get away from Olympus.", "The Forever Open tournament is Horde-only."]]
  };
  const raceCard = (race, fac) => `<details class="xcard race ${fac === "Alliance" ? "ally" : "horde"}"><summary><b>${race}</b>${tier(G.raceTier[race])}<span class="rcls">${G.races[fac][race].map(k => `<i title="${cls(k).name}" style="color:${cls(k).color}">${cls(k).icon}</i>`).join("")}</span></summary><ul>${G.racials[race].map(x => `<li>${esc(x)}</li>`).join("")}</ul></details>`;
  r.innerHTML = `<section class="wrap"><h2 class="sec">Alliance vs Horde</h2><p class="sub">The Sep 26 vote went Alliance. Harry: <i>“Damn close poll.”</i></p>
  ${segHTML("fpick", [["both", "⚖️ Compare"], ["Alliance", "🦁 Alliance"], ["Horde", "🐺 Horde"]], "Faction")}
  <div class="facgrid" id="facgrid">${["Alliance", "Horde"].map((f, i) => `${i ? '<div class="vs"><span>VS</span></div>' : ""}<div class="panel ${f === "Alliance" ? "ally" : "horde"} reveal facpanel" data-f="${f}"><span class="facmark" aria-hidden="true">${facs[f][0]}</span><h3>${facs[f][0]} ${f}</h3><ul>${facs[f][1].map(x => `<li>${x}</li>`).join("")}</ul><h4 class="cinzel">Races <small>tap for racials</small></h4><div class="races">${Object.keys(G.races[f]).map(rc => raceCard(rc, f)).join("")}</div></div>`).join("")}</div>
  <div class="panel reveal" style="margin-top:18px"><h3>Balance</h3><p>PvP ruleset: one faction per account, and creation locks can pause the bigger side. Normal, Roleplaying and Hardcore allow both. No official population numbers yet. ${src("Blizzard", "https://news.blizzard.com/en-us/article/24302070/choose-your-ruleset-in-world-of-warcraft-forever")}</p>
  <p><b>Our take:</b> Alliance on Normal keeps the vote, skips the Olympus zerg, and still lets anyone roll a Horde alt.</p></div></section>`;
  seg($(".fpick", r), v => { $("#facgrid").dataset.show = v; $$("#facgrid .facpanel").forEach(p => p.hidden = v !== "both" && p.dataset.f !== v); $("#facgrid .vs").hidden = v !== "both"; });
};

P.meta = r => {
  const G = BB.game.classes, TVv = { S: 4, A: 3, B: 2, C: 1 }, L = ["", "C", "B", "A", "S"];
  const best = (k, f) => Math.max(...Object.values(G[k].specs).map(d => TVv[d[f]]));
  r.innerHTML = `<section class="wrap"><h2 class="sec">Meta</h2><p class="sub">Beta tiers at the level-30 cap. Expect a full reshuffle after launch.</p>
  <div class="grid g4">${BB.live.trends.slice(0, 4).map(t => `<div class="panel stat reveal"><span class="small cinzel">${esc(t.k)}</span><b style="font-size:1.5rem">${esc(t.v)}</b><span>${esc(t.n)}</span></div>`).join("")}</div>
  <div class="grid g2" style="margin-top:18px"><div class="panel reveal"><div class="phead"><h3>Best spec per class</h3>${segHTML("mmode", [["pve", "PvE"], ["pvp", "PvP"]], "Mode")}</div><div class="tbars" id="cbars"></div><div class="tbscale" aria-hidden="true"><span>C</span><span>B</span><span>A</span><span>S</span></div></div>
   <div class="panel reveal"><div class="phead"><h3>Races</h3>${segHTML("rmode", [["all", "All"], ["Alliance", "🦁"], ["Horde", "🐺"]], "Faction")}</div><div class="tbars" id="rbars"></div><div class="tbscale" aria-hidden="true"><span>C</span><span>B</span><span>A</span><span>S</span></div></div></div>
  <h2 class="sec">Every Spec</h2>
  <div class="fbar">${segHTML("srole", [["all", "All"], ["tank", "🛡️ Tank"], ["heal", "✚ Heal"], ["dps", "⚔️ DPS"]], "Role")}${segHTML("ssort", [["pve", "Sort PvE"], ["pvp", "Sort PvP"]], "Sort")}</div>
  <div class="grid g3 specgrid" id="specs"></div>
  <p class="small center">Tier lists: ${src("endgametools roundup", "https://endgametools.com/en/wow-forever/news/wow-forever-tier-list")} · ${src("mmonster", "https://mmonster.co/wow-forever/guides/tier-lists")} · ${src("PvP tiers", "https://wowforevertierlist.com/tier-list/pvp")}</p></section>`;
  seg($(".mmode", r), f => { $("#cbars").innerHTML = Object.entries(G).sort((a, b) => best(b[0], f) - best(a[0], f)).map(([k, c]) => `<div class="tb" style="--cc:${c.color}"><span class="tbn cls" style="color:${c.color}">${c.icon} ${c.name}</span><div class="tbt"><i class="pve" style="--v:${best(k, f) / 4}"><b>${L[best(k, f)]}</b></i></div></div>`).join(""); });
  seg($(".rmode", r), f => { $("#rbars").innerHTML = Object.entries(BB.game.raceTier).filter(([rc]) => f === "all" || factionOf(rc) === f).sort((a, b) => TVv[b[1]] - TVv[a[1]]).map(([rc, t]) => `<div class="tb ${factionOf(rc) === "Alliance" ? "fa" : "fh"}"><span class="tbn">${rc.replace(" Skyborne", " Sky.")}</span><div class="tbt"><i class="race" style="--v:${TVv[t] / 4}"><b>${t}</b></i></div></div>`).join(""); });
  let role = "all", sort = "pve";
  const specs = () => { const rows = Object.entries(G).flatMap(([k, c]) => Object.entries(c.specs).map(([s, d]) => ({ k, c, s, d }))).filter(x => role === "all" || x.d.role.includes(role)).sort((a, b) => TVv[b.d[sort]] - TVv[a.d[sort]] || TVv[b.d[sort === "pve" ? "pvp" : "pve"]] - TVv[a.d[sort === "pve" ? "pvp" : "pve"]]);
    $("#specs").innerHTML = rows.map(x => `<div class="panel spec1" style="--cc:${x.c.color}"><span class="si" aria-hidden="true">${x.c.icon}</span><span class="sn"><b>${esc(x.s)}</b><small style="color:${x.c.color}">${x.c.name} · ${ROLE_NAME[x.d.role]}</small></span>${tier(x.d.pve)}<i>PvE</i>${tier(x.d.pvp)}<i>PvP</i></div>`).join(""); };
  seg($(".srole", r), v => { role = v; specs(); }); seg($(".ssort", r), v => { sort = v; specs(); });
};

P.racials = r => {
  const G = BB.game;
  r.innerHTML = `<section class="wrap"><h2 class="sec">Racials</h2><p class="sub">Pick a class to see its best races. Numbers are from the beta and were re-tuned Oct 16. ${src("Patch notes", G.racialsNote.url)}</p>
  <div class="cpick" role="group" aria-label="Class">${G.bestRace.map(([k], i) => `<button data-v="${k}" class="${i ? "" : "on"}" style="--cc:${cls(k).color}"><span aria-hidden="true">${cls(k).icon}</span><small>${cls(k).name}</small></button>`).join("")}</div>
  <div class="panel reveal brcard" id="best"></div>
  <h2 class="sec">Every Race</h2>
  ${segHTML("rfac", [["Alliance", "🦁 Alliance"], ["Horde", "🐺 Horde"]], "Faction")}
  <div class="grid g3 races3" id="races"></div>
  <p class="small center">${src("Best race per class", "https://wowforevertierlist.com/races/best-race-for-each-class")} · ${src("Racial tiers", "https://mobalytics.gg/wow-forever/tier-lists/racials")}</p></section>`;
  const cp = $(".cpick", r);
  const showBest = k => { const [, a, h, ap, hp] = G.bestRace.find(x => x[0] === k), c = cls(k); $("#best").style.setProperty("--cc", c.color);
    $("#best").innerHTML = `<h3 class="cls" style="color:${c.color}">${c.icon} ${c.name}</h3><div class="brgrid"><span></span><span class="small cinzel">PvE</span><span class="small cinzel">PvP</span><b class="fa">🦁</b><span>${esc(a)}</span><span>${esc(ap)}</span><b class="fh">🐺</b><span>${esc(h)}</span><span>${esc(hp)}</span></div><p class="small">${esc(G.bestRaceWhy[k])}</p>`; };
  seg(cp, showBest);
  seg($(".rfac", r), f => { $("#races").innerHTML = Object.entries(G.racials).filter(([rc]) => factionOf(rc) === f).map(([rc, list]) => `<details class="panel xcard race ${f === "Alliance" ? "ally" : "horde"}"><summary><b>${rc}</b>${tier(G.raceTier[rc])}<span class="rcls">${G.races[f][rc].map(k => `<i title="${cls(k).name}" style="color:${cls(k).color}">${cls(k).icon}</i>`).join("")}</span></summary><ul>${list.map(x => `<li>${esc(x)}</li>`).join("")}</ul></details>`).join(""); });
};

P.news = r => {
  const L = BB.live, vids = [...(L.autoVideos || []), ...L.videos].filter((v, i, a) => a.findIndex(x => x.id === v.id) === i);
  const news = [...(L.autoNews || []), ...L.news].filter((n, i, a) => a.findIndex(x => x.t === n.t) === i).sort((a, b) => b.d.localeCompare(a.d));
  const kind = n => /blizzard/i.test(n.src) ? "blizzard" : /wowhead/i.test(n.src) ? "wowhead" : "other";
  r.innerHTML = `<section class="wrap"><h2 class="sec">News</h2><p class="sub">Updated <span class="liveStamp"></span>.</p>
  ${segHTML("nf", [["all", "All"], ["upcoming", "⏳ Upcoming"], ["blizzard", "Blizzard"], ["wowhead", "Wowhead"], ["other", "Other"]], "Filter news")}
  <div class="panel reveal" id="newslist">${news.map(n => `<div class="news ${n.d >= TODAY() ? "fut" : ""}" data-k="${kind(n)}" data-up="${n.d >= TODAY() ? 1 : 0}"><span class="d">${fmtD(n.d)}</span><a href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.t)}</a><span class="small">${esc(n.src)}</span></div>`).join("")}<p class="none" hidden>Nothing here yet.</p></div>
  <h2 class="sec">Videos</h2>
  <div class="grid g3" id="vids">${vids.map((v, i) => ytCard(v).replace('class="panel reveal"', `class="panel reveal${i >= 6 ? " more" : ""}"${i >= 6 ? " hidden" : ""}`)).join("")}</div>
  ${vids.length > 6 ? `<div class="center"><button class="btn ghost" id="morevids">More videos (${vids.length - 6})</button></div>` : ""}</section>`;
  seg($(".nf", r), v => { let n = 0; $$("#newslist .news").forEach(e => { const show = v === "all" || (v === "upcoming" ? e.dataset.up === "1" : e.dataset.k === v); e.hidden = !show; n += show; }); $("#newslist .none").hidden = n > 0; });
  const mv = $("#morevids"); if (mv) mv.onclick = () => { $$("#vids .more").forEach(e => { e.hidden = false; e.classList.add("in"); }); mv.remove(); };
};

P.streamers = r => {
  const A = BB.live.asmon;
  const all = [...BB.live.streamers, ...(BB.live.autoStreamers || [])].filter((s, i, a) => a.findIndex(x => x.url === s.url) === i).sort((a, b) => b.d.localeCompare(a.d));
  const tags = [...new Set(all.map(s => s.tag))];
  r.innerHTML = `<section class="wrap"><h2 class="sec">Streamers</h2><p class="sub">Who's going where, and what they're saying.</p>
  <div class="panel parch reveal"><h3 style="margin-top:0">🧭 Where's Asmongold going?</h3><p class="cinzel" style="font-size:1.15rem"><b>Alliance · PvP ruleset · “Olympus”</b></p>
   <ul>${A.facts.map(f => `<li>${esc(f.t)} <span class="small">${src(f.src, f.url)}</span></li>`).join("")}</ul><p><b>For us:</b> Alliance PvP will be a sea of Olympus tabards. Normal skips the zerg; Horde PvP means fighting it.</p></div>
  <h2 class="sec">Quotes</h2>
  ${segHTML("sf", [["all", "All"], ...tags.map(t => [t, esc(t)])], "Filter quotes")}
  <div class="grid g2" id="squotes">${all.map(sQuote).join("")}</div>
  <h2 class="sec">Videos</h2><div class="grid g3">${BB.live.videos.filter(v => !/World of Warcraft/.test(v.by)).map(ytCard).join("")}</div></section>`;
  seg($(".sf", r), v => $$("#squotes .squote").forEach(e => e.hidden = v !== "all" && e.dataset.tag !== v));
};

P.guild = r => {
  const LSV = "bbcc-guild-vote", names = BB.content.guildNames;
  let st; try { st = JSON.parse(localStorage.getItem(LSV) || "null"); } catch (e) {}
  if (!st || !Array.isArray(st.custom)) st = { pick: null, custom: [] };
  const all = () => [...names, ...st.custom.map(n => ({ n, w: "Your idea" }))];
  const draw = () => {
    try { localStorage.setItem(LSV, JSON.stringify(st)); } catch (e) {}
    $("#votes").innerHTML = all().map((g, i) => `<button class="vote ${st.pick === g.n ? "mine" : ""}" data-n="${esc(g.n)}" aria-pressed="${st.pick === g.n}"><span class="n">${i === 0 ? "🦶 " : ""}&lt;${esc(g.n)}&gt;</span><span class="small">${esc(g.w)}</span><span class="c">${st.pick === g.n ? "✔" : ""}</span></button>`).join("");
    $$("#votes .vote").forEach(v => v.onclick = () => { st.pick = v.dataset.n; draw(); toast("Your vote: <" + st.pick + ">"); });
    $("#tab").textContent = st.pick ? `<${st.pick}>` : "<Your Guild Here>";
  };
  r.innerHTML = `<section class="wrap"><h2 class="sec">Name the Guild</h2><p class="sub">Tap a name. Your vote stays on this device, so screenshot it into Discord.</p>
  <div class="grid g2"><div class="panel reveal"><div id="votes"></div><div class="addrow"><input id="custom" maxlength="24" placeholder="Got a better one?" aria-label="Your own guild name"><button class="btn" id="add">Add</button></div><button class="btn ghost" id="vreset" style="margin-top:10px">Reset my vote</button></div>
  <div class="panel reveal tabard"><svg viewBox="0 0 200 260" aria-hidden="true"><path d="M30 10h140v190l-70 50-70-50z" fill="#1d3f9e" stroke="#e7c26b" stroke-width="6"/><path d="M100 10v240" stroke="#8e1a14" stroke-width="40" opacity=".55"/><circle cx="100" cy="110" r="42" fill="#120d09" stroke="#e7c26b" stroke-width="4"/><text x="100" y="122" text-anchor="middle" font-family="Cinzel" font-weight="900" font-size="24" fill="#e7c26b">${esc(C.CREW_SHORT)}</text></svg><div id="tab" class="cinzel tabname"></div><div class="small">${esc(C.CREW_NAME)}</div></div></div></section>`;
  const add = () => { const v = $("#custom").value.trim(); if (v && !all().some(g => g.n.toLowerCase() === v.toLowerCase())) { st.custom.push(v); st.pick = v; $("#custom").value = ""; draw(); } };
  $("#add").onclick = add; $("#custom").onkeydown = e => e.key === "Enter" && add();
  $("#vreset").onclick = () => { st = { pick: null, custom: [] }; draw(); };
  draw();
};
P.warroom = r => renderBuilder(r);
