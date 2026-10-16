const P = {};
const src = (t, u) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)} ↗</a>`;
const sQuote = s => `<div class="panel reveal squote"><div class="sq">${esc(s.q)}</div><div class="small" style="margin-top:8px"><b>${esc(s.who)}</b> ${esc(s.h)} · ${fmtD(s.d)} · <span class="tag">${esc(s.tag)}</span> · ${src("source", s.url)}</div></div>`;
const streamerBy = tag => BB.live.streamers.filter(s => s.tag.includes(tag));

P.home = r => {
  const live = BB.live, M = BB.members.members;
  const t = new Date(C.LAUNCH_UTC);
  const pt = t.toLocaleString("en-US", { timeZone: "America/Los_Angeles", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const et = t.toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" });
  const days = Math.max(0, Math.ceil((t - Date.now()) / 864e5));
  r.innerHTML = `
  <section class="hero"><div class="embers">${Array.from({ length: 18 }, (_, i) => `<i style="left:${(i * 37) % 100}%;animation-duration:${6 + (i % 5) * 2}s;animation-delay:${-i * 1.3}s"></i>`).join("")}</div>
   <div class="kicker">THE OFFICIAL WAR ROOM OF THE</div>
   <h1 class="crewname">${esc(C.CREW_NAME)}</h1>
   <div class="title2">World of Warcraft: Forever · Launch Countdown</div>
   <div class="count" id="count" aria-live="off"></div>
   <div class="when">⏳ ${pt} PT · <b>${et} ET</b></div>
   <div class="cta"><a class="btn" href="warroom.html">⚔️ Build the comp</a><a class="btn ghost" href="pve-pvp.html">⚖️ PvE or PvP?</a><a class="btn ghost" href="guild.html">🗳️ Vote guild name</a></div>
  </section>
  <section class="wrap">
   <div class="grid g4 stats" style="margin-top:22px">
    <div class="panel stat reveal"><b>${days}</b><span>days to launch</span></div>
    <div class="panel stat reveal"><b>9</b><span>classes · 10 races</span></div>
    <div class="panel stat reveal"><b>4</b><span>rulesets, no realms</span></div>
    <div class="panel stat reveal"><b>${M.length}</b><span>${esc(C.CREW_SHORT)} heroes · ${M.filter(m => m.core).length} core</span></div>
   </div>
   <h2 class="sec">What is WoW: Forever?</h2>
   <div class="panel parch reveal"><p><b>World of Warcraft: Forever</b> is Blizzard's new permanent, level-60 take on vanilla-era Azeroth. It sits alongside retail and Classic and is set after Warcraft III Reforged: Forsaken Kingdom, before Molten Core. Announced at <b>BlizzCon 2026</b>, it launches <b>November 4, 2026</b> and is included with a WoW subscription.</p>
   <ul><li><b>No realms:</b> you pick a <i>ruleset</i> (Normal, PvP, Roleplaying, and Hardcore later). You can only group with your own ruleset and faction.</li>
   <li><b>New race:</b> the Skyborne (Horde Windshapers / Alliance High Order). New combos too: Orc Mage, Troll Warlock, Undead Paladin, Human Hunter, Gnome Priest, Dwarf Shaman.</li>
   <li><b>Reworked racials</b> (weapon skill racials are now crit %). The beta is capped at level 30 and raids open Dec 9.</li></ul>
   <p class="small">${src("Blizzard announcement", "https://news.blizzard.com/en-us/article/24302093/carve-a-new-path-with-world-of-warcraft-forever")} · ${src("Rulesets", "https://news.blizzard.com/en-us/article/24302070/choose-your-ruleset-in-world-of-warcraft-forever")} · ${src("Races & racials", "https://www.wowhead.com/forever/blue-tracker/news/us/create-the-hero-you-want-to-be-in-world-of-warcraft-forever-world-of-warcraft-24304075")}</p></div>
   <h2 class="sec">Road to Launch</h2><p class="sub">Live feed · updated <span class="liveStamp"></span></p>
   <div class="timeline">${live.news.slice().reverse().filter(n => n.d >= "2026-10-01").map(n => `<div class="tl reveal ${n.future ? "fut" : ""}"><b>${fmtD(n.d)}</b><span>${esc(n.t)}</span></div>`).join("")}</div>
   <h2 class="sec">The Core Four</h2>
   <div class="grid g4">${M.filter(m => m.core).map(m => { const c = cls(m.pick.cls); return `<a href="roster.html#${m.id}" class="panel reveal mini" style="--cc:${c.color}">${figure(m.pick.cls, m.pick.race, true, true)}<h3>${esc(m.name)}</h3><div class="cls" style="color:${c.color}">${esc(m.pick.spec)} ${c.name}</div><div class="small">${esc(m.usual)}</div></a>`; }).join("")}</div>
   <h2 class="sec">What's Trending</h2>
   <div class="grid g3">${live.trends.map(t => `<div class="panel reveal"><div class="small cinzel">${esc(t.k)}</div><h3 style="margin:.2rem 0;color:var(--gold)">${esc(t.v)}</h3><div>${esc(t.n)}</div><div class="small">${src("source", t.url)}</div></div>`).join("")}</div>
  </section>`;
  countdown($("#count"));
};

P.roster = r => {
  r.innerHTML = `<section class="wrap"><h2 class="sec">The Roster</h2><p class="sub">Real quotes from the crew chat. Picks marked <b>stated</b> came from the person; everything else is a suggestion. BattleTags go in <code>data/members.json</code>.</p>
  <div class="grid g2">${BB.members.members.map(m => { const c = cls(m.pick.cls); return `
   <article id="${m.id}" class="panel rcard reveal ${m.core ? "core" : ""}" style="--cc:${c.color}">
    ${m.core ? '<span class="corebadge tag">★ CORE 4</span>' : ""}
    <div class="rtop">${figure(m.pick.cls, m.pick.race)}
     <div><h3>${memberName(m)}</h3><div class="h">${esc(m.handle)} · aka ${esc(m.alias)}</div>
     <div class="pickline">${c.icon} ${esc(m.pick.spec)} ${c.name} · ${esc(m.pick.race)}</div>
     <div>${tier(c.specs[m.pick.spec].pve)} <span class="small">PvE</span> ${tier(c.specs[m.pick.spec].pvp)} <span class="small">PvP</span> <span class="tag">${m.pick.stated ? "STATED" : "SUGGESTION"}</span></div>
     <div class="small" style="margin-top:6px">Usually: ${esc(m.usual)} · Alt: ${esc(m.alt)}</div>
     <div class="small">BattleTag: ${m.battletag ? esc(m.battletag) : "<i>not set yet</i>"}</div></div></div>
    <p>${esc(m.why)}</p>
    <details ${m.core ? "open" : ""}><summary class="cinzel small">From the archives (${m.quotes.length})</summary>${m.quotes.map(q => `<div class="quote">“${esc(q.t)}”<small>${q.by ? esc(q.by) + " · " : ""}${fmtD(q.d)}</small></div>`).join("")}</details>
   </article>`; }).join("")}</div></section>`;
};

P.pvepvp = r => {
  r.innerHTML = `<section class="wrap"><h2 class="sec">PvE vs PvP</h2><p class="sub">Forever has no PvP or PvE servers. You pick a <b>ruleset</b> per character and can't switch later. Battlegrounds mix every ruleset except Hardcore, so you can still queue BGs on Normal.</p>
  <div class="grid g2">
   <div class="panel reveal"><h3>🏰 PvE focus (dungeons → raids)</h3>
    <p><b>Pros for us</b></p><ul><li>Plays to the crew's history: tanking, healing, dungeon nights since Classic 2019.</li><li>A 5-person core maps perfectly to dungeons. Raids open Dec 9.</li><li>Holy Paladin, Prot Paladin and Fury Warrior are top-tier PvE picks, which fits Donnie, Chilly and Harry.</li><li>Nobody gets ganked while leveling on a work night.</li></ul>
    <p><b>Cons</b></p><ul><li>Raiding needs 10–40 people, so we'd have to join a bigger guild.</li><li>Schedules: someone always has to be the healer.</li></ul></div>
   <div class="panel reveal"><h3>⚔️ PvP focus (BGs + world PvP)</h3>
    <p><b>Pros for us</b></p><ul><li>Warlock (bns, lmk), Priest (Harry) and Feral (dbx) are all A/S tier in PvP.</li><li>New 15v15 Darkspear Islands BG, plus WSG, AB and AV.</li><li>Pure chaos energy, very ${esc(C.CREW_SHORT)}.</li></ul>
    <p><b>Cons</b></p><ul><li>Chilly on modern PvP: <i>“World of stun craft.”</i></li><li>The PvP ruleset locks you to one faction, and Olympus (30k+) lives on Alliance PvP.</li><li>No arenas announced, and BG data only arrives after launch.</li></ul></div>
  </div>
  <h2 class="sec">Ruleset Recommendation</h2>
  <div class="panel parch reveal"><h3 style="margin-top:0">🏆 Recommended: <u>Normal</u> ruleset, PvE-first, BG nights for PvP</h3>
   <ol><li>We level and dungeon together without getting ganked by 40k Olympus tabards or Horde campers.</li><li>Battlegrounds still mix rulesets, so the PvP squad loses nothing in BGs.</li><li>Normal allows both factions, so alts can go Horde for fun.</li><li>Hardcore arrives in winter as a separate one-life challenge, and dead heroes can transfer out.</li></ol>
   <p><b>Choose the PvP ruleset instead if</b> the crew votes for open-world danger. If so, pick the faction together before launch, because it's one faction per account there.</p>
   <p class="small">${src("Blizzard rulesets", "https://news.blizzard.com/en-us/article/24302070/choose-your-ruleset-in-world-of-warcraft-forever")} · ${src("mmonster ruleset table", "https://mmonster.co/wow-forever/guides/pvp/rulesets")} · ${src("Region & ping Q&A", "https://halfbakedwarcraft.com/news/forever-deep-dive-realmless-camping-legacy/")}</p></div>
  <div class="grid g2" style="margin-top:18px">${[...streamerBy("PvP"), ...streamerBy("Purist"), ...streamerBy("Realm")].map(sQuote).join("")}</div>
  <div class="panel reveal" style="margin-top:18px"><table class="t"><tr><th>Ruleset</th><th>World PvP</th><th>Factions</th><th>Groups with</th><th>BGs</th></tr>
   <tr><td><b>Normal</b></td><td>Only if both agree</td><td>Both</td><td>Normal</td><td>Mixed</td></tr>
   <tr><td><b>PvP</b></td><td>Contested</td><td>One per account</td><td>PvP</td><td>Mixed</td></tr>
   <tr><td><b>Roleplaying</b></td><td>Like Normal</td><td>Both</td><td>RP</td><td>Mixed</td></tr>
   <tr><td><b>Hardcore</b> (winter)</td><td>n/a</td><td>Both</td><td>Hardcore only</td><td>Separate</td></tr></table></div></section>`;
};

P.factions = r => {
  r.innerHTML = `<section class="wrap"><h2 class="sec">Alliance vs Horde</h2><p class="sub">The crew held a vote on Sep 26. Harry: <i>“Damn close poll.”</i> Chilly: <i>“@Harryjones who voted horde so we can shame them?”</i> The lean is <b>Alliance</b>.</p>
  <div class="facgrid"><div class="panel ally reveal"><h3>🦁 Alliance</h3><ul><li>Crew history: Donnie's “slay the dirty Horde” WotLK era, and hamfish “dominated horde in cata”.</li><li><b>Human</b> (S tier) gets the only stun break, Will to Survive.</li><li>Gnome mages and priests, Dwarf Stoneform tanks, Night Elf druids for Dan.</li><li>Dwarf Shaman is new, so Alliance finally gets totems.</li><li>⚠️ Olympus (Asmongold, 30–40k) is Alliance on the PvP ruleset.</li></ul></div>
   <div class="vs">VS</div>
   <div class="panel horde reveal"><h3>🐺 Horde</h3><ul><li><b>Orc</b> (S tier) gets Blood Fury, the best PvE racial, now buffing spell power too.</li><li><b>Undead</b> fear break is the top Horde PvP racial, and Undead Paladins are new.</li><li>Troll Berserking is “low key cracked” on mage, warlock and hunter (Reddit chatter).</li><li>Sodapoppin reportedly went Horde to avoid Olympus chat.</li><li>The Forever Open tournament is Horde-only.</li></ul></div></div>
  <div class="panel reveal" style="margin-top:18px"><h3>Faction split chatter</h3><p>Redditors guess the PvP ruleset leans slightly Alliance and Normal slightly Horde. Faction-balance locks (SoD-style) can pause creation on the bigger side of the PvP ruleset. ${src("r/classicwow thread", "https://www.reddit.com/r/classicwow/comments/1wp62xr/wow_forever_pvp_servers_for_horde/")} · ${src("Olympus recap", "https://wofwforever.com/en/guides/wow-forever-olympus-guild/")}</p>
  <p><b>Our take:</b> Alliance on <b>Normal</b> keeps the crew vote, dodges the Olympus PvP zerg, and still lets anyone roll a Horde alt.</p></div></section>`;
};

P.meta = r => {
  const G = BB.game.classes, rows = [];
  Object.entries(G).forEach(([k, c]) => Object.entries(c.specs).forEach(([s, d]) => rows.push({ k, c, s, d })));
  r.innerHTML = `<section class="wrap"><h2 class="sec">Meta & Stats</h2><p class="sub">These tiers summarize the public beta lists (level 30 cap, class rework Oct 1, rage fixes Oct 8). There are no level-60 Warcraft Logs yet, so expect a full reshuffle after launch.</p>
  <div class="grid g4">${BB.live.trends.slice(0, 4).map(t => `<div class="panel stat reveal"><span class="small cinzel">${esc(t.k)}</span><b style="font-size:1.5rem">${esc(t.v)}</b><span>${esc(t.n)}</span></div>`).join("")}</div>
  <div class="grid g2" style="margin-top:18px"><div class="panel reveal"><h3>Class strength: PvE vs PvP</h3><div class="chartbox"><canvas id="cbar"></canvas></div></div>
   <div class="panel reveal"><h3>Race tiers</h3><div class="chartbox"><canvas id="rbar"></canvas></div></div></div>
  <h2 class="sec">Every Spec, Tiered</h2>
  <div class="panel reveal scroll"><table class="t" id="spect"><thead><tr><th>Class</th><th>Spec</th><th>Role</th><th>PvE</th><th>PvP</th></tr></thead><tbody>${rows.map(x => `<tr><td class="cls" style="color:${x.c.color}">${x.c.icon} ${x.c.name}</td><td>${x.s}</td><td>${x.d.role}</td><td>${tier(x.d.pve)}</td><td>${tier(x.d.pvp)}</td></tr>`).join("")}</tbody></table></div>
  <p class="small">Inputs: ${src("endgametools roundup (5 lists)", "https://endgametools.com/en/wow-forever/news/wow-forever-tier-list")} · ${src("mmonster tier lists", "https://mmonster.co/wow-forever/guides/tier-lists")} · ${src("PvP tiers", "https://wowforevertierlist.com/tier-list/pvp")} · ${src("timesaver PvP", "https://timesaver.gg/blog/wow-forever-best-pvp-class-tier-list")}</p></section>`;
  if (!window.Chart) return;
  Chart.defaults.color = "#e9dcc0"; Chart.defaults.font.family = "EB Garamond";
  const TVv = { S: 4, A: 3, B: 2, C: 1 }, ks = Object.keys(G);
  const best = (k, f) => Math.max(...Object.values(G[k].specs).map(d => TVv[d[f]]));
  new Chart($("#cbar"), { type: "bar", data: { labels: ks.map(k => G[k].name), datasets: [{ label: "Best PvE spec", data: ks.map(k => best(k, "pve")), backgroundColor: ks.map(k => G[k].color) }, { label: "Best PvP spec", data: ks.map(k => best(k, "pvp")), backgroundColor: "rgba(231,194,107,.35)", borderColor: "#e7c26b", borderWidth: 1 }] },
    options: { indexAxis: "y", maintainAspectRatio: false, scales: { x: { min: 0, max: 4, ticks: { stepSize: 1, callback: v => ["", "C", "B", "A", "S"][v] }, grid: { color: "#3a2c18" } }, y: { grid: { display: false } } }, plugins: { legend: { labels: { boxWidth: 12 } } } } });
  const RT = BB.game.raceTier, rk = Object.keys(RT);
  new Chart($("#rbar"), { type: "bar", data: { labels: rk.map(x => x.replace(" Skyborne", " Sky.")), datasets: [{ label: "Overall race tier", data: rk.map(x => TVv[RT[x]]), backgroundColor: rk.map(x => factionOf(x) === "Alliance" ? "#2a5bd7" : "#b3221b") }] },
    options: { indexAxis: "y", maintainAspectRatio: false, scales: { x: { min: 0, max: 4, ticks: { stepSize: 1, callback: v => ["", "C", "B", "A", "S"][v] }, grid: { color: "#3a2c18" } }, y: { grid: { display: false } } }, plugins: { legend: { display: false } } } });
};

P.racials = r => {
  const G = BB.game;
  r.innerHTML = `<section class="wrap"><h2 class="sec">Racials Matrix</h2><div class="warn meh" style="text-align:center">🧪 <b>Beta data, re-tuned Oct 16.</b> ${esc(G.racialsNote.t)} ${src("Blizzard dev notes via Wowhead", G.racialsNote.url)}</div><p class="sub">Best race per class for PvE and PvP. Orc is the default Horde damage race, Human (stun break + Ruthless crit) the default Alliance race, and the PvP columns follow the control breaks.</p>
  <div class="panel reveal scroll"><table class="t"><thead><tr><th>Class</th><th>🦁 PvE</th><th>🐺 PvE</th><th>🦁 PvP</th><th>🐺 PvP</th><th>Why</th></tr></thead><tbody>
  ${G.bestRace.map(([k, a, h, ap, hp]) => `<tr><td class="cls" style="color:${cls(k).color}">${cls(k).icon} ${cls(k).name}</td><td>${a}</td><td>${h}</td><td>${ap}</td><td>${hp}</td><td class="small">${esc(G.bestRaceWhy[k])}</td></tr>`).join("")}</tbody></table></div>
  <p class="small">${src("wowforevertierlist best race per class", "https://wowforevertierlist.com/races/best-race-for-each-class")} · ${src("Mobalytics racials", "https://mobalytics.gg/wow-forever/tier-lists/racials")} · ${src("Official racial text", "https://www.wowhead.com/forever/blue-tracker/news/us/create-the-hero-you-want-to-be-in-world-of-warcraft-forever-world-of-warcraft-24304075")}</p>
  <h2 class="sec">Every Race</h2>
  <div class="grid g3">${Object.entries(G.racials).map(([race, list]) => { const f = factionOf(race); return `<div class="panel reveal ${f === "Alliance" ? "ally" : "horde"}"><h3 style="margin:.1rem 0">${race} ${tier(G.raceTier[race])}</h3><div class="small">${f} · ${G.races[f][race].map(k => `<span style="color:${cls(k).color}">${cls(k).name}</span>`).join(", ")}</div><ul>${list.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`; }).join("")}</div></section>`;
};

P.news = r => {
  const L = BB.live, vids = [...(L.autoVideos || []), ...L.videos].filter((v, i, a) => a.findIndex(x => x.id === v.id) === i);
  const news = [...(L.autoNews || []), ...L.news].sort((a, b) => b.d.localeCompare(a.d));
  r.innerHTML = `<section class="wrap"><h2 class="sec">News & Videos</h2><p class="sub">Live feed · updated <span class="liveStamp"></span>. Every video ID was checked as embeddable through YouTube oEmbed.</p>
  <div class="grid g3">${vids.slice(0, 9).map(ytCard).join("")}</div>
  <h2 class="sec">Dispatches</h2><div class="panel reveal">${news.map(n => `<div class="news ${n.future ? "fut" : ""}"><span class="d">${fmtD(n.d)}</span><span>${esc(n.t)}<br><span class="small">${src(n.src, n.url)}</span></span></div>`).join("")}</div></section>`;
};

P.streamers = r => {
  const A = BB.live.asmon;
  r.innerHTML = `<section class="wrap"><h2 class="sec">Streamer Intel</h2><p class="sub">Verbatim public posts with dates and links. Anything we couldn't verify is labelled as a paraphrase or left out.</p>
  <div class="panel parch reveal"><h3 style="margin-top:0">🧭 Where is Asmongold going?</h3><p class="cinzel" style="font-size:1.2rem"><b>Alliance · PvP ruleset · guild network “Olympus”</b></p>
   <ul>${A.facts.map(f => `<li>${esc(f.t)} <span class="small">(${src(f.src, f.url)})</span></li>`).join("")}</ul><p><b>What it means for ${esc(C.CREW_SHORT)}:</b> ${esc(A.verdict)}</p></div>
  <h2 class="sec">On the Record</h2><div class="grid g2">${[...BB.live.streamers, ...(BB.live.autoStreamers || [])].filter((s, i, a) => a.findIndex(x => x.url === s.url) === i).sort((a, b) => b.d.localeCompare(a.d)).map(sQuote).join("")}</div>
  <h2 class="sec">Creator Videos</h2><div class="grid g3">${BB.live.videos.filter(v => !/World of Warcraft/.test(v.by)).map(ytCard).join("")}</div>
  <p class="small">We searched for recent Forever quotes from Payo, Venruki, Bellular, Quin69 and Savix and couldn't verify any, so they aren't shown. Pikaboo and Xaryu appear through their videos only.</p></section>`;
};

P.guild = r => {
  const LSV = "bbcc-guild-vote", names = BB.content.guildNames;
  let st = JSON.parse(localStorage.getItem(LSV) || '{"pick":null,"custom":[]}');
  const all = () => [...names, ...st.custom.map(n => ({ n, w: "Custom entry (saved on this device)" }))];
  const draw = () => {
    localStorage.setItem(LSV, JSON.stringify(st));
    $("#votes").innerHTML = all().map((g, i) => `<div class="vote ${st.pick === g.n ? "mine" : ""}" data-n="${esc(g.n)}" role="button" tabindex="0"><span class="n">${i === 0 ? "🦶 " : ""}&lt;${esc(g.n)}&gt;</span><span class="small">${esc(g.w)}</span><span class="c">${st.pick === g.n ? "✔" : ""}</span></div>`).join("");
    $$("#votes .vote").forEach(v => v.onclick = v.onkeydown = e => { if (e.type === "keydown" && e.key !== "Enter") return; st.pick = v.dataset.n; draw(); toast("Your vote: <" + st.pick + ">"); });
    $("#tab").textContent = st.pick ? `<${st.pick}>` : "<Your Guild Here>";
  };
  r.innerHTML = `<section class="wrap"><h2 class="sec">Name the Guild</h2><p class="sub">Your vote is saved on this device only (no accounts, no forms). Screenshot it into Discord to make it count.</p>
  <div class="grid g2"><div class="panel reveal"><div id="votes"></div><div class="addrow"><input id="custom" maxlength="24" placeholder="Suggest your own…" aria-label="Custom guild name"><button class="btn" id="add">Add</button></div><button class="btn ghost" id="vreset" style="margin-top:10px">Reset my vote</button></div>
  <div class="panel reveal tabard"><svg viewBox="0 0 200 260" aria-hidden="true"><path d="M30 10h140v190l-70 50-70-50z" fill="#1d3f9e" stroke="#e7c26b" stroke-width="6"/><path d="M100 10v240" stroke="#8e1a14" stroke-width="40" opacity=".55"/><circle cx="100" cy="110" r="42" fill="#120d09" stroke="#e7c26b" stroke-width="4"/><text x="100" y="122" text-anchor="middle" font-family="Cinzel" font-weight="900" font-size="30" fill="#e7c26b">${esc(C.CREW_SHORT)}</text></svg><div id="tab" class="cinzel tabname"></div><div class="small">${esc(C.CREW_NAME)}</div></div></div></section>`;
  $("#add").onclick = () => { const v = $("#custom").value.trim(); if (v && !all().some(g => g.n === v)) { st.custom.push(v); st.pick = v; $("#custom").value = ""; draw(); } };
  $("#vreset").onclick = () => { st = { pick: null, custom: [] }; draw(); };
  draw();
};
P.warroom = r => renderBuilder(r);
