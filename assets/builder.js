/* Comp builder: light-touch scoring over 6 categories that players actually judge comps by */
const CATS = [
  ["survive", "Stay Alive", "Is there a real tank and a real healer, and how good are they? (Wowhead: 1 tank, 1 healer, 3 DPS)"],
  ["damage", "Damage", "How hard the DPS hit in dungeons and raids, based on the beta tier lists"],
  ["control", "Control", "Crowd control and interrupts. Classic groups want 1–2 CCs and an interrupt rotation"],
  ["utility", "Utility", "Buffs, dispels (Magic/Curse/Poison/Disease), rezzes, summons, and food and water"],
  ["leveling", "Leveling", "How fast and smooth the group levels together to 60"],
  ["pvp", "PvP", "Burst, control and survivability in battlegrounds and world PvP"]
];
const TV = { S: 4, A: 3, B: 2, C: 1 };
const PLAY = [["Casual", .85], ["Regular", 1], ["Grinder", 1.12]];
const LS = "bbcc-comp-v1";
let S;
function defaultState() {
  const picks = {}; BB.members.members.forEach(m => picks[m.id] = { cls: m.pick.cls, spec: m.pick.spec, race: m.pick.race, play: 1 });
  return { faction: "Alliance", sel: ["chilly", "harry", "donnie", "bns", "dbx"], picks };
}
function saveS() { localStorage.setItem(LS, JSON.stringify(S)); }
function racesFor(clsKey) { return Object.entries(BB.game.races[S.faction]).filter(([r, cl]) => cl.includes(clsKey)).map(([r]) => r); }
function fixPick(p) {
  const C = cls(p.cls); if (!C.specs[p.spec]) p.spec = Object.keys(C.specs)[0];
  const rs = racesFor(p.cls); if (!rs.includes(p.race)) p.race = rs[0];
}
function analyze() {
  const team = S.sel.map(id => ({ id, m: BB.M[id], p: S.picks[id] })).map(x => ({ ...x, C: cls(x.p.cls), sp: cls(x.p.cls).specs[x.p.spec], w: PLAY[x.p.play][1] }));
  const out = { warn: [], good: [] }; if (!team.length) return { team, scores: Object.fromEntries(CATS.map(c => [c[0], 0])), pve: 0, pvp: 0, warn: [["bad", "Pick some heroes first!"]], good: [] };
  const isT = x => x.sp.role.includes("tank"), isH = x => x.sp.role === "heal";
  let tanks = team.filter(x => x.sp.role === "tank"); const flex = team.filter(x => x.sp.role === "tank/dps");
  if (!tanks.length && flex.length) tanks = [flex[0]];
  const heals = team.filter(isH), dps = team.filter(x => !tanks.includes(x) && !isH(x));
  const avg = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0, cl = v => Math.max(0, Math.min(100, Math.round(v)));
  const best = arr => arr.length ? Math.max(...arr.map(x => TV[x.sp.pve] * x.w)) : 0;
  let survive = (tanks.length ? best(tanks) / 4 * 50 : 0) + (heals.length ? best(heals) / 4 * 50 : 0) + (heals.length > 1 ? 6 : 0);
  if (tanks[0] && tanks[0].sp.role === "tank/dps") survive -= 6;
  const damage = avg(dps.map(x => (TV[x.sp.pve] / 4 * 60 + (x.sp.attrs[1] + x.sp.attrs[2]) / 20 * 40) * x.w));
  const tags = team.flatMap(x => x.C.util);
  const ints = new Set(team.filter(x => x.C.util.some(t => t.includes("interrupt"))).map(x => x.id)).size;
  const ccs = tags.filter(t => /cc\(|fear|stun|silence/.test(t)).length;
  const control = Math.min(1, ints / 2) * 50 + Math.min(1, ccs / 3) * 50;
  const disp = ["magic", "curse", "poison", "disease"].filter(d => tags.some(t => t.includes(d + " dispel") || (d === "curse" && t === "curses" && false)));
  const buffs = new Set(tags.filter(t => /aura|blessing|fortitude|intellect|mark of|shout|totem/.test(t))).size;
  const rez = tags.some(t => /battle res|soulstone|reincarnation/.test(t)), logi = tags.some(t => /summon|food|portal/.test(t));
  const utility = disp.length / 4 * 40 + Math.min(buffs, 4) / 4 * 40 + (rez ? 10 : 0) + (logi ? 10 : 0);
  const leveling = avg(team.map(x => x.sp.attrs[3] * 10 * x.w));
  const pvp = avg(team.map(x => (TV[x.sp.pvp] / 4 * 60 + x.sp.attrs[5] * 4) * x.w)) + (heals.length ? 5 : -10);
  const scores = { survive: cl(survive), damage: cl(damage), control: cl(control), utility: cl(utility), leveling: cl(leveling), pvp: cl(pvp) };
  const pve = cl(.3 * scores.survive + .25 * scores.damage + .2 * scores.control + .15 * scores.utility + .1 * scores.leveling);
  const pvpAll = cl(.5 * scores.pvp + .2 * scores.survive + .2 * scores.control + .1 * scores.utility);
  const W = out.warn, G = out.good;
  if (!tanks.length) W.push(["bad", "No tank! Someone has to hold aggro (Chilly, we're looking at you)."]);
  else if (tanks[0].sp.role === "tank/dps") W.push(["meh", `${tanks[0].m.name} is a Feral off-tank. That works, but a Prot Warrior or Paladin is safer for dungeons.`]);
  if (!heals.length) W.push(["bad", "No healer! Need a healer? Because you definitely need a healer."]);
  if (tanks.length && heals.length) G.push(["ok", "Holy trinity covered: tank + healer ✔"]);
  if (team.filter(isT).length > 1 && team.length === 5) W.push(["meh", "Two tank-capable picks. Fine for leveling, but someone DPSes in dungeons."]);
  if (ints === 0) W.push(["bad", "No interrupts! Casters will chain-cast at you."]); else if (ints === 1) W.push(["meh", "Only one interrupter. Add a Rogue, Mage, Warrior or Shaman."]);
  if (ccs < 2) W.push(["meh", "Light on crowd control (sheep, sap, trap, fear). Classic pulls hurt without it."]);
  const missing = ["magic", "curse", "poison", "disease"].filter(d => !disp.includes(d));
  if (missing.length) W.push(["meh", "Missing dispels: " + missing.map(s => s[0].toUpperCase() + s.slice(1)).join(", ")]); else G.push(["ok", "Every dispel type covered ✔"]);
  if (!tags.some(t => /food|portal/.test(t))) W.push(["meh", "No Mage: no free water or portals. Bring snacks."]);
  if (!rez) W.push(["meh", "No battle rez or soulstone."]);
  const dup = Object.entries(team.reduce((a, x) => (a[x.p.cls] = (a[x.p.cls] || 0) + 1, a), {})).filter(([k, n]) => n > 1);
  dup.forEach(([k, n]) => W.push(["meh", `${n}× ${cls(k).name}: they'll compete for the same loot.`]));
  if (team.length < 5) W.push(["meh", `Only ${team.length}/5 picked.`]);
  return { team, scores, pve, pvp: pvpAll, warn: W, good: G, tanks, heals, dps };
}
const word = v => v >= 70 ? ["Strong", "ok"] : v >= 45 ? ["OK", "meh"] : ["Weak", "bad"];
const letter = v => v >= 85 ? "S" : v >= 72 ? "A" : v >= 58 ? "B" : v >= 45 ? "C" : "D";
let radar;
function renderBuilder(root) {
  S = JSON.parse(localStorage.getItem(LS) || "null") || defaultState();
  BB.members.members.forEach(m => { if (!S.picks[m.id]) S.picks[m.id] = defaultState().picks[m.id]; });
  const presets = BB.content.presets;
  root.innerHTML = `
  <section class="wrap">
   <h2 class="sec">The War Room</h2><p class="sub">Pick 5 of the ${BB.members.members.length}, then choose a class, spec and race for each. The grades update as you go. All picks are suggestions; hit Reset any time.</p>
   <div class="panel reveal" style="margin-bottom:16px">
     <div class="toolbar">
       <div class="fac-toggle" role="group" aria-label="Faction"><button data-f="Alliance" class="A">🦁 Alliance</button><button data-f="Horde" class="H">🐺 Horde</button></div>
       <select id="preset" aria-label="Load preset"><option value="">Load a preset…</option>${Object.keys(presets).map(k => `<option>${esc(k)}</option>`).join("")}</select>
       <button class="btn ghost" id="clear">Clear</button><button class="btn red" id="reset">Reset to crew default</button>
     </div>
     <div id="chips" class="chips" style="margin-top:10px"></div>
   </div>
   <div class="builder">
     <div id="rows"></div>
     <aside id="result" class="panel"></aside>
   </div>
   <details class="panel reveal" style="margin-top:18px"><summary class="cinzel">How the grades work</summary>
     <p>We use six categories that guides and players actually judge a group by: Wowhead's dungeon overview (1 tank, 1 healer, 3 DPS; the healer's buffs matter), classic party-building threads (bring 1–2 CCs and cover interrupts), dispel and stun/interrupt guides, and the beta tier lists for damage, leveling and PvP. Each category is graded <b>Strong / OK / Weak</b>. PvE and PvP each get a letter. The only slider is how much each person will play.</p>
     <ul>${CATS.map(c => `<li><b>${c[1]}</b>: ${c[2]}</li>`).join("")}</ul>
     <p class="small">Sources: <a href="https://www.wowhead.com/classic/guide/classic-dungeons-overview" target="_blank" rel="noopener">Wowhead Classic dungeons overview</a> · <a href="https://us.forums.blizzard.com/en/wow/t/building-your-party-in-classic/109150" target="_blank" rel="noopener">Blizzard forums: Building your party</a> · <a href="https://www.warcrafttavern.com/wow-classic/guides/dungeon-speed-leveling/" target="_blank" rel="noopener">Warcraft Tavern: dungeon comps</a> · <a href="https://www.reddit.com/r/classicwow/comments/cvhq76/cc_abilities_and_the_type_of_mobs_they_work_on/" target="_blank" rel="noopener">r/classicwow: CC by mob type</a> · <a href="https://endgametools.com/en/wow-forever/news/wow-forever-tier-list" target="_blank" rel="noopener">Forever tier-list roundup</a></p>
   </details>
  </section>`;
  $$(".fac-toggle button", root).forEach(b => b.onclick = () => { S.faction = b.dataset.f; Object.values(S.picks).forEach(fixPick); draw(); });
  $("#preset", root).onchange = e => { const p = presets[e.target.value]; if (!p) return; S.faction = p.faction; S.sel = Object.keys(p.picks); Object.entries(p.picks).forEach(([id, [c, s, r]]) => S.picks[id] = { ...S.picks[id], cls: c, spec: s, race: r }); e.target.value = ""; draw(); toast("Preset loaded"); };
  $("#clear", root).onclick = () => { S.sel = []; draw(); };
  $("#reset", root).onclick = () => { S = defaultState(); draw(); toast("Reset to crew default"); };
  draw();
}
function draw() {
  Object.values(S.picks).forEach(fixPick); saveS();
  $$(".fac-toggle button").forEach(b => b.classList.toggle("on", b.dataset.f === S.faction));
  $("#chips").innerHTML = BB.members.members.map(m => { const on = S.sel.includes(m.id), c = cls(S.picks[m.id].cls).color; return `<button class="chip ${on ? "on" : ""}" data-id="${m.id}" style="border-color:${c}" aria-pressed="${on}"><i style="background:${c}"></i>${esc(m.name)}${m.core ? " ★" : ""}</button>`; }).join("") + `<span class="small">&nbsp;${S.sel.length}/5 selected</span>`;
  $$("#chips .chip").forEach(b => b.onclick = () => { const id = b.dataset.id; if (S.sel.includes(id)) S.sel = S.sel.filter(x => x !== id); else { if (S.sel.length >= 5) { toast("Max 5. Tap someone to bench them first"); return; } S.sel.push(id); } draw(); });
  const open = new Set($$("#rows details[open]").map(d => d.dataset.id));
  $("#rows").innerHTML = S.sel.map((id, i) => {
    const m = BB.M[id], p = S.picks[id], C = cls(p.cls), sp = C.specs[p.spec];
    return `<details class="mrow" data-id="${id}" style="--cc:${C.color}" ${open.size ? (open.has(id) ? "open" : "") : (i === 0 ? "open" : "")}>
      <summary><span class="ico">${C.icon}</span><span><b>${esc(m.name)}</b>${m.core ? ' <span class="tag">core</span>' : ""}<br><span class="cls" style="color:${C.color}">${esc(p.spec)} ${esc(C.name)}</span> <span class="small">· ${esc(p.race)}</span></span><span class="tiers">${tier(sp.pve)}<small>PvE</small>${tier(sp.pvp)}<small>PvP</small></span></summary>
      <div class="mbody">${figure(p.cls, p.race, true, false, id)}
       <div class="ctrls">
        <label>Class<select data-k="cls">${Object.entries(BB.game.classes).filter(([k]) => racesFor(k).length).map(([k, c]) => `<option value="${k}" ${k === p.cls ? "selected" : ""}>${c.icon} ${c.name}</option>`).join("")}</select></label>
        <label>Spec<select data-k="spec">${Object.entries(C.specs).map(([s, d]) => `<option ${s === p.spec ? "selected" : ""} value="${s}">${s} (${d.role}) · ${d.pve}/${d.pvp}</option>`).join("")}</select></label>
        <label>Race<select data-k="race">${racesFor(p.cls).map(r => `<option ${r === p.race ? "selected" : ""}>${r}</option>`).join("")}</select></label>
        <label>How much will they play? <b class="pl">${PLAY[p.play][0]}</b><input type="range" min="0" max="2" step="1" value="${p.play}" data-k="play" aria-label="Playtime"></label>
        <p class="small">${esc(m.lean)}${m.pick.stated ? " · <b>stated in chat</b>" : " · suggestion"}</p>
       </div></div></details>`;
  }).join("") || `<div class="panel"><p>Tap names above to add them to the comp.</p></div>`;
  $$("#rows details").forEach(d => { d.addEventListener("toggle", () => d.open && bindFigures(d)); });
  $$("#rows select, #rows input").forEach(el => el.oninput = () => { const id = el.closest("details").dataset.id, k = el.dataset.k; S.picks[id][k] = k === "play" ? +el.value : el.value; if (k === "cls") S.picks[id].spec = ""; draw(); });
  bindFigures($("#rows"));
  const A = analyze();
  $("#result").innerHTML = `
   <div class="grades"><div><span class="small cinzel">PvE grade</span><div class="bigscore">${letter(A.pve)}</div></div><div><span class="small cinzel">PvP grade</span><div class="bigscore">${letter(A.pvp)}</div></div>
   <div class="roles"><span title="Tanks">🛡️ ${A.tanks?.length || 0}</span><span title="Healers">✚ ${A.heals?.length || 0}</span><span title="DPS">⚔️ ${A.dps?.length || 0}</span></div></div>
   <div class="radarbox"><canvas id="radar" aria-label="Comp strength radar"></canvas></div>
   <div class="catgrid">${CATS.map(([k, n, d]) => { const [w, c] = word(A.scores[k]); return `<div class="cat" title="${esc(d)}"><span>${n}</span><b class="w ${c}">${w}</b></div>`; }).join("")}</div>
   <div class="warns">${A.warn.map(([c, t]) => `<div class="warn ${c}">${c === "bad" ? "⛔" : "⚠️"} ${esc(t)}</div>`).join("")}${A.good.map(([c, t]) => `<div class="warn ok">${esc(t)}</div>`).join("")}</div>`;
  const data = CATS.map(c => A.scores[c[0]]);
  if (radar) radar.destroy();
  if (window.Chart) {
    const small = innerWidth < 500;
    radar = new Chart($("#radar"), { type: "radar", data: { labels: CATS.map(c => small ? c[1].replace("Stay Alive", "Alive") : c[1]), datasets: [{ data, backgroundColor: "rgba(231,194,107,.25)", borderColor: "#e7c26b", pointBackgroundColor: "#fff1c4", borderWidth: 2 }] },
      options: { animation: { duration: 400 }, maintainAspectRatio: true, layout: { padding: small ? 14 : 6 }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => word(c.raw)[0] } } }, scales: { r: { min: 0, max: 100, ticks: { display: false, stepSize: 25 }, grid: { color: "rgba(231,194,107,.18)" }, angleLines: { color: "rgba(231,194,107,.18)" }, pointLabels: { color: "#e9dcc0", font: { family: "Cinzel", size: small ? 10 : 13, weight: "700" } } } } } });
  }
}
