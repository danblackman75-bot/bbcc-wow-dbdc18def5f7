/* War Room: build a five-person party and see how it holds up */
const CATS = [
  ["survive", "Stay Alive", "A real tank and a real healer"],
  ["damage", "Damage", "How hard the damage dealers hit"],
  ["control", "Control", "Crowd control and interrupts"],
  ["utility", "Utility", "Buffs, dispels, rezzes, summons, water"],
  ["leveling", "Leveling", "How smoothly the group levels to 60"],
  ["pvp", "PvP", "Burst, control and staying power in BGs"]
];
const TV = { S: 4, A: 3, B: 2, C: 1 };
const PLAY = [["Casual", .85], ["Regular", 1], ["Grinder", 1.12]];
const LS = "bbcc-comp-v2", LS_OLD = "bbcc-comp-v1";
// [PvE weight, PvP weight (0-3), PvE headline, PvP headline]
const RACE_SYN = {
  "Human": [2, 3, "Ruthless crit", "Will to Survive"],
  "Dwarf": [2, 1, "Stoneform", "Stoneform cleanse"],
  "Night Elf": [2, 2, "Elune's Light", "Shadowmeld"],
  "Gnome": [2, 2, "Eureka!", "Escape Artist"],
  "High Order Skyborne": [1, 1, "+3% haste", "Walk on Air"],
  "Orc": [3, 2, "Blood Fury", "Hardiness"],
  "Undead": [1, 3, "Cannibalize", "Will of the Forsaken"],
  "Tauren": [1, 2, "+5% health", "War Stomp"],
  "Troll": [2, 1, "Berserking", "Regeneration"],
  "Windshaper Skyborne": [1, 1, "+3% haste", "Skysight"]
};
const STACK = {
  "Human": n => `${n} Humans: ${n} stun breaks every fight.`,
  "Dwarf": n => `${n} Dwarves: poisons and bleeds just bounce off.`,
  "Night Elf": n => `${n} Night Elves: Shadowmeld resets all day.`,
  "Gnome": n => `${n} Gnomes: small, fast, impossible to root.`,
  "Orc": n => `${n} Orcs: stacked Blood Fury makes openers hurt.`,
  "Undead": n => `${n} Undead: fear is more of a suggestion.`,
  "Tauren": n => `${n} Tauren: chain War Stomps on every pack.`,
  "Troll": n => `${n} Trolls: stacked Berserking melts bosses.`,
  "High Order Skyborne": n => `${n} Skyborne: the whole party glides off cliffs together.`,
  "Windshaper Skyborne": n => `${n} Skyborne: the whole party glides off cliffs together.`
};
const BUFFS = [["Fortitude", /fortitude/], ["Mark of the Wild", /mark of the wild/], ["Arcane Intellect", /arcane intellect/], ["Blessings", /blessings/], ["Battle Shout", /battle shout/], ["Totems", /totems/], ["Trueshot Aura", /trueshot/]];
const KIT = [["Water", /food/], ["Portals", /portals/], ["Summons", /summon/], ["Healthstones", /healthstones/], ["Battle rez", /battle res/], ["Soulstone", /soulstone/], ["Innervate", /innervate/]];
const DISPELS = ["magic", "curse", "poison", "disease"];
const ROLE_ICO = { tank: "🛡️", heal: "✚", dps: "⚔️", "tank/dps": "🛡️" };
const ROLE_NAME = { tank: "Tank", heal: "Healer", dps: "DPS", "tank/dps": "Tank / DPS" };
const cap = s => s[0].toUpperCase() + s.slice(1);
let S;
function defaultState() {
  const picks = {}; BB.members.members.forEach(m => picks[m.id] = { cls: m.pick.cls, spec: m.pick.spec, race: m.pick.race, play: 1 });
  const sel = BB.members.members.slice(0, 5).map(m => m.id);
  return { faction: "Alliance", sel, picks, active: sel[0] };
}
function saveS() { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) {} }
function racesFor(clsKey, fac = S.faction) { return Object.entries(BB.game.races[fac]).filter(([r, cl]) => cl.includes(clsKey)).map(([r]) => r); }
function fixPick(p) {
  if (!cls(p.cls)) { p.cls = "warrior"; p.spec = ""; }
  const C = cls(p.cls); if (!C.specs[p.spec]) p.spec = Object.keys(C.specs)[0];
  if (!PLAY[p.play]) p.play = 1;
  const rs = racesFor(p.cls); if (!rs.includes(p.race)) { const was = p.race; p.race = rs[0]; return was ? `${was} can't be a ${C.name} on ${S.faction}, so ${p.race}${rs.length === 1 ? ` (the only ${S.faction} ${C.name} race)` : ""}` : ""; }
  return "";
}
function topRace(clsKey, fac, pvp) {
  const row = BB.game.bestRace.find(r => r[0] === clsKey); if (!row) return "";
  return row[(fac === "Alliance" ? 1 : 2) + (pvp ? 2 : 0)] || "";
}
const firstRace = s => s.split(/ \(|;/)[0].trim();
function analyze() {
  const team = S.sel.map(id => ({ id, m: BB.M[id], p: S.picks[id] })).map(x => ({ ...x, C: cls(x.p.cls), sp: cls(x.p.cls).specs[x.p.spec], w: PLAY[x.p.play][1] }));
  if (!team.length) return { team, scores: Object.fromEntries(CATS.map(c => [c[0], 0])), pve: 0, pvp: 0, warn: [["bad", "Pick some heroes first."]], good: [], tanks: [], heals: [], dps: [], buffs: [], kit: [], disp: [], stacks: [], fit: 0, tips: [] };
  const isH = x => x.sp.role === "heal";
  let tanks = team.filter(x => x.sp.role === "tank"); const flex = team.filter(x => x.sp.role === "tank/dps");
  if (!tanks.length && flex.length) tanks = [flex[0]];
  const heals = team.filter(isH), dps = team.filter(x => !tanks.includes(x) && !isH(x));
  const avg = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0, cl = v => Math.max(0, Math.min(100, Math.round(v)));
  const best = arr => arr.length ? Math.max(...arr.map(x => TV[x.sp.pve] * x.w)) : 0;
  let survive = (tanks.length ? best(tanks) / 4 * 50 : 0) + (heals.length ? best(heals) / 4 * 50 : 0) + (heals.length > 1 ? 6 : 0);
  if (tanks[0] && tanks[0].sp.role === "tank/dps") survive -= 6;
  const extraT = tanks.slice().sort((a, b) => TV[b.sp.pve] - TV[a.sp.pve]).slice(1); // a 2nd tank DPSes, badly
  const rPve = avg(team.map(x => (RACE_SYN[x.p.race] || [1.5])[0])), rPvp = avg(team.map(x => (RACE_SYN[x.p.race] || [0, 1.5])[1]));
  const damage = avg([...dps.map(x => (TV[x.sp.pve] / 4 * 60 + (x.sp.attrs[1] + x.sp.attrs[2]) / 20 * 40) * x.w), ...extraT.map(x => 30 * x.w)]) + (rPve - 1.5) * 4;
  const tags = team.flatMap(x => x.C.util);
  const ints = new Set(team.filter(x => x.C.util.some(t => t.includes("interrupt"))).map(x => x.id)).size;
  const ccs = tags.filter(t => /cc\(|fear|stun|silence/.test(t)).length;
  const control = Math.min(1, ints / 2) * 50 + Math.min(1, ccs / 3) * 50;
  const disp = DISPELS.filter(d => tags.some(t => t.includes(d + " dispel")));
  const buffN = new Set(tags.filter(t => /aura|blessing|fortitude|intellect|mark of|shout|totem/.test(t))).size;
  const rez = tags.some(t => /battle res|soulstone|reincarnation/.test(t)), logi = tags.some(t => /summon|food|portal/.test(t));
  const utility = disp.length / 4 * 40 + Math.min(buffN, 4) / 4 * 40 + (rez ? 10 : 0) + (logi ? 10 : 0);
  const leveling = avg(team.map(x => x.sp.attrs[3] * 10 * x.w));
  const pvp = avg(team.map(x => (TV[x.sp.pvp] / 4 * 60 + x.sp.attrs[5] * 4) * x.w)) + (heals.length ? 5 : -10) + (rPvp - 1.5) * 4;
  const scores = { survive: cl(survive), damage: cl(damage), control: cl(control), utility: cl(utility), leveling: cl(leveling), pvp: cl(pvp) };
  let pve = cl(.3 * scores.survive + .25 * scores.damage + .2 * scores.control + .15 * scores.utility + .1 * scores.leveling);
  if (!heals.length) pve = Math.min(pve, 44); else if (!tanks.length) pve = Math.min(pve, 57); // dungeons need both: no healer caps at D, no tank at C
  const pvpAll = cl(.5 * scores.pvp + .2 * scores.survive + .2 * scores.control + .1 * scores.utility);
  // racials: stacking and best-race fit
  const raceN = team.reduce((a, x) => (a[x.p.race] = (a[x.p.race] || 0) + 1, a), {});
  const stacks = Object.entries(raceN).filter(([r, n]) => n > 1 && STACK[r]).map(([r, n]) => STACK[r](n));
  let fit = 0; const tips = [];
  team.forEach(x => {
    const a = topRace(x.p.cls, S.faction, false), b = topRace(x.p.cls, S.faction, true);
    if (a.includes(x.p.race) || b.includes(x.p.race)) fit++;
    else if (a && tips.length < 2 && firstRace(a) !== x.p.race && racesFor(x.p.cls).includes(firstRace(a))) tips.push(`${x.m.name}: ${firstRace(a)} is the usual ${S.faction} ${x.C.name} pick.`);
  });
  const W = [], G = [];
  if (!tanks.length) W.push(["bad", "No tank. Someone has to hold aggro."]);
  else if (tanks[0].sp.role === "tank/dps") W.push(["meh", `${tanks[0].m.name} off-tanks as Feral. It works, but plate is safer.`]);
  if (!heals.length) W.push(["bad", "No healer. You definitely need a healer."]);
  if (tanks.length && heals.length) G.push(["ok", "Tank and healer covered."]);
  const realT = team.filter(x => x.sp.role === "tank").length;
  if (realT > 1) W.push(["meh", `${realT} tanks. Only one gets to tank; the other becomes a very sturdy DPS.`]);
  if (ints === 0) W.push(["bad", "No interrupts. Enemy casters will cast whatever they like."]); else if (ints === 1) W.push(["meh", "One interrupt. A Rogue, Mage, Warrior or Shaman would help."]);
  if (ccs < 2) W.push(["meh", "Light on crowd control. Big pulls will hurt."]);
  const missing = DISPELS.filter(d => !disp.includes(d));
  if (missing.length) W.push(["meh", "No dispel for " + missing.map(cap).join(", ") + "."]); else G.push(["ok", "Every dispel type covered."]);
  if (!tags.some(t => /food|portal/.test(t))) W.push(["meh", "No Mage: no free water, no portals. Pack snacks."]);
  if (!rez) W.push(["meh", "No battle rez or Soulstone."]);
  Object.entries(team.reduce((a, x) => (a[x.p.cls] = (a[x.p.cls] || 0) + 1, a), {})).filter(([k, n]) => n > 1)
    .forEach(([k, n]) => W.push(["meh", `${n}× ${cls(k).name}: same gear, same loot rolls.`]));
  if (heals.length > 2) W.push(["meh", `${heals.length} healers. Nobody dies, but nothing else does either.`]);
  if (team.length < 5) W.push(["meh", `${team.length}/5 picked.`]);
  const buffs = BUFFS.map(([n, re]) => [n, tags.some(t => re.test(t))]);
  const kit = KIT.map(([n, re]) => [n, tags.some(t => re.test(t))]);
  return { team, scores, pve, pvp: pvpAll, warn: W, good: G, tanks, heals, dps, buffs, kit, disp: DISPELS.map(d => [cap(d), disp.includes(d)]), stacks, fit, tips, ints, ccs };
}
const word = v => v >= 70 ? ["Strong", "ok"] : v >= 45 ? ["OK", "meh"] : ["Weak", "bad"];
const letter = v => !S.sel.length ? "-" : v >= 85 ? "S" : v >= 72 ? "A" : v >= 58 ? "B" : v >= 45 ? "C" : "D";

/* ---------- radar (plain SVG, tweened) ---------- */
let radarPrev = null;
function radarPts(vals, R = 100) { return vals.map((v, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / vals.length, r = R * Math.max(4, v) / 100; return [Math.cos(a) * r, Math.sin(a) * r]; }); }
function radarSVG() {
  const n = CATS.length, ring = f => radarPts(Array(n).fill(f * 100)).map(p => p.join(",")).join(" ");
  const lab = radarPts(Array(n).fill(128)).map(([x, y], i) => `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${Math.abs(x) < 5 ? "middle" : x > 0 ? "start" : "end"}">${CATS[i][1]}</text>`).join("");
  return `<svg class="radar" viewBox="-185 -150 370 300" role="img" aria-label="Party strengths chart">
   ${[.25, .5, .75, 1].map(f => `<polygon class="rg" points="${ring(f)}"/>`).join("")}
   ${radarPts(Array(n).fill(100)).map(([x, y]) => `<line class="rg" x1="0" y1="0" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`).join("")}
   <polygon class="rv" points=""/>${CATS.map(() => `<circle class="rp" r="4"/>`).join("")}${lab}</svg>`;
}
function radarSet(svg, vals) {
  const from = radarPrev || vals.map(() => 0), poly = svg.querySelector(".rv"), dots = svg.querySelectorAll(".rp");
  const paint = cur => { const pts = radarPts(cur); poly.setAttribute("points", pts.map(p => p.map(v => v.toFixed(1)).join(",")).join(" ")); pts.forEach(([x, y], i) => { dots[i].setAttribute("cx", x.toFixed(1)); dots[i].setAttribute("cy", y.toFixed(1)); }); };
  radarPrev = vals.slice();
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return paint(vals);
  const t0 = performance.now(), D = 380;
  const step = t => { const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3); paint(vals.map((v, i) => from[i] + (v - from[i]) * e)); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

/* ---------- UI ---------- */
function loadS() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(LS) || "null") || JSON.parse(localStorage.getItem(LS_OLD) || "null"); } catch (e) {}
  if (!s || typeof s !== "object" || !s.picks) s = defaultState();
  const d = defaultState();
  BB.members.members.forEach(m => { if (!s.picks[m.id] || typeof s.picks[m.id] !== "object") s.picks[m.id] = d.picks[m.id]; });
  s.sel = [...new Set((Array.isArray(s.sel) ? s.sel : []).filter(id => BB.M[id]))].slice(0, 5);
  if (!BB.game.races[s.faction]) s.faction = "Alliance";
  if (!s.sel.includes(s.active)) s.active = s.sel[0] || null;
  return s;
}
function renderBuilder(root) {
  S = loadS();
  const hm = location.hash.match(/^#m=(\w+)/);
  if (hm && BB.M[hm[1]]) { const id = hm[1]; if (!S.sel.includes(id)) { if (S.sel.length >= 5) S.sel[S.sel.length - 1] = id; else S.sel.push(id); } S.active = id; }
  const presets = BB.content.presets;
  root.innerHTML = `
  <section class="wrap wr">
   <h2 class="sec">The War Room</h2>
   <p class="sub">Pick five. Tap a hero to change their race, class and spec.</p>
   <div class="panel wr-bar">
     <div class="seg fac" role="group" aria-label="Faction"><button data-f="Alliance" class="A">🦁 Alliance</button><button data-f="Horde" class="H">🐺 Horde</button></div>
     <div class="presets" role="group" aria-label="Presets">${Object.keys(presets).map(k => `<button class="pchip" data-p="${esc(k)}">${esc(k)}</button>`).join("")}</div>
     <button class="btn ghost" id="reset">↺ Reset to defaults</button>
   </div>
   <div class="party" id="party" role="list">${Array.from({ length: 5 }, (_, i) => `<div class="slot" role="listitem" data-i="${i}"></div>`).join("")}</div>
   <div class="bench" id="bench" aria-label="Bench"></div>
   <a id="mini" class="minigrade" href="#result" aria-label="Jump to party grades"></a>
   <div class="builder">
     <div class="panel editor" id="editor"><div class="ed-av"></div><div class="ed-ctrl"></div></div>
     <aside id="result" class="panel" aria-live="polite"></aside>
   </div>
   <details class="panel howto"><summary>How grading works</summary>
     <p>Six things decide whether a group works. Each one is graded Strong, OK or Weak, and PvE and PvP each get a letter. Tiers come from the level-30 beta, so expect changes after launch.</p>
     <ul>${CATS.map(c => `<li><b>${c[1]}</b>: ${c[2]}</li>`).join("")}</ul>
     <p class="small">${src("Wowhead dungeon guide", "https://www.wowhead.com/classic/guide/classic-dungeons-overview")} · ${src("Tier list roundup", "https://endgametools.com/en/wow-forever/news/wow-forever-tier-list")}</p>
   </details>
  </section>`;
  $$(".fac button", root).forEach(b => b.onclick = () => {
    if (S.faction === b.dataset.f) return;
    S.faction = b.dataset.f;
    const msgs = S.sel.map(id => { const m = fixPick(S.picks[id]); return m && `${BB.M[id].name}: ${m}`; }).filter(Boolean);
    draw(); if (msgs.length) toast(msgs.length > 1 ? `${msgs.length} races swapped for ${S.faction}` : msgs[0]);
  });
  $$(".pchip", root).forEach(b => b.onclick = () => {
    const p = presets[b.dataset.p]; if (!p) return;
    S.faction = p.faction; S.sel = Object.keys(p.picks).filter(id => BB.M[id]).slice(0, 5);
    Object.entries(p.picks).forEach(([id, [c, s, r]]) => { if (S.picks[id]) S.picks[id] = { ...S.picks[id], cls: c, spec: s, race: r }; });
    S.active = S.sel[0]; draw(); toast(b.dataset.p + " loaded");
  });
  $("#reset", root).onclick = () => { S = defaultState(); draw(); toast("Back to defaults"); };
  draw();
}
function slotHTML(id) {
  const m = BB.M[id], p = S.picks[id];
  return `<button class="slot-pick" aria-pressed="false">${avatar(p.cls, p.race, "", { key: id, m3d: "wide", cls: "sm" })}<span class="slot-txt"><b>${esc(m.name)}</b><small></small></span><span class="slot-role" aria-hidden="true"></span></button><button class="slot-x" aria-label="Bench ${esc(m.name)}">×</button>`;
}
function draw() {
  Object.values(S.picks).forEach(fixPick);
  if (!S.sel.includes(S.active)) S.active = S.sel[0] || null;
  saveS();
  $$(".fac button").forEach(b => { b.classList.toggle("on", b.dataset.f === S.faction); b.setAttribute("aria-pressed", b.dataset.f === S.faction); });
  document.body.dataset.fac = S.faction;
  // party slots: keep avatar nodes alive so 3D models survive redraws
  $$("#party .slot").forEach((slot, i) => {
    const id = S.sel[i];
    if (!id) { if (slot.dataset.id !== "") { slot.dataset.id = ""; slot.className = "slot empty"; slot.innerHTML = `<span>+</span><small>Add from the bench</small>`; } return; }
    const m = BB.M[id], p = S.picks[id], C = cls(p.cls), sp = C.specs[p.spec];
    if (slot.dataset.id !== id) { slot.dataset.id = id; slot.className = "slot"; slot.innerHTML = slotHTML(id); bindAvatars(slot);
      $(".slot-pick", slot).onclick = () => { S.active = id; draw(); if (innerWidth < 980) $("#editor").scrollIntoView({ behavior: "smooth", block: "start" }); };
      $(".slot-x", slot).onclick = () => { S.sel = S.sel.filter(x => x !== id); draw(); toast(`${m.name} to the bench`); }; }
    setAvatar($(".av", slot), p.cls, p.race, "");
    slot.style.setProperty("--cc", C.color); slot.classList.toggle("on", id === S.active);
    $(".slot-pick", slot).setAttribute("aria-pressed", id === S.active);
    $(".slot-txt small", slot).textContent = `${p.spec} ${C.name}`;
    $(".slot-role", slot).textContent = ROLE_ICO[sp.role];
  });
  const bench = BB.members.members.filter(m => !S.sel.includes(m.id));
  $("#bench").innerHTML = bench.length ? `<span class="lbl">Bench</span>${bench.map(m => { const c = cls(S.picks[m.id].cls); return `<button class="bchip" data-id="${m.id}" style="--cc:${c.color}"><i aria-hidden="true">${c.icon}</i>${esc(m.name)}</button>`; }).join("")}` : "";
  $$("#bench .bchip").forEach(b => b.onclick = () => {
    const id = b.dataset.id;
    if (S.sel.length < 5) { S.sel.push(id); toast(`${BB.M[id].name} joins the party`); }
    else { const out = S.active || S.sel[4], i = S.sel.indexOf(out); S.sel[i] = id; toast(`${BB.M[id].name} in, ${BB.M[out].name} out`); }
    S.active = id; draw();
  });
  drawEditor();
  drawResult();
}
function drawEditor() {
  const ed = $("#editor"), id = S.active;
  if (!id) { ed.classList.add("empty"); $(".ed-av", ed).innerHTML = ""; $(".ed-ctrl", ed).innerHTML = `<p class="ed-none">Your party is empty. Tap someone on the bench.</p>`; return; }
  ed.classList.remove("empty");
  const m = BB.M[id], p = S.picks[id], C = cls(p.cls), box = $(".ed-av", ed);
  ed.style.setProperty("--cc", C.color);
  const cur = $(".av", box);
  if (!cur || cur.dataset.key !== id) { box.innerHTML = avatar(p.cls, p.race, m.name, { key: id, cls: "lg" }); bindAvatars(box); }
  else setAvatar(cur, p.cls, p.race, m.name);
  const races = Object.keys(BB.game.races[S.faction]), legal = racesFor(p.cls);
  const tA = topRace(p.cls, S.faction, false), tP = topRace(p.cls, S.faction, true);
  $(".ed-ctrl", ed).innerHTML = `
   <div class="ed-head"><h3>${esc(m.name)}</h3><span class="tag">${m.pick.stated ? "Locked in" : "Our guess"}</span><span class="small">${esc(m.lean)}</span></div>
   <div class="opt"><span class="lbl">Class</span><div class="cgrid">${Object.entries(BB.game.classes).filter(([k]) => racesFor(k).length).map(([k, c]) => `<button class="cbtn ${k === p.cls ? "on" : ""}" data-v="${k}" style="--cc:${c.color}" aria-pressed="${k === p.cls}"><span aria-hidden="true">${c.icon}</span><small>${c.name}</small></button>`).join("")}</div></div>
   <div class="opt"><span class="lbl">Spec</span><div class="sgrid">${Object.entries(C.specs).map(([s, d]) => `<button class="sbtn ${s === p.spec ? "on" : ""}" data-v="${esc(s)}" aria-pressed="${s === p.spec}"><b>${esc(s)}</b><small>${ROLE_ICO[d.role]} ${ROLE_NAME[d.role]}</small><span class="st">${tier(d.pve)}<i>PvE</i>${tier(d.pvp)}<i>PvP</i></span></button>`).join("")}</div></div>
   <div class="opt"><span class="lbl">Race <small>${S.faction}</small></span><div class="rgrid">${races.map(r => { const ok = legal.includes(r), y = RACE_SYN[r], star = ok && (tA.includes(r) || tP.includes(r)); return `<button class="rbtn ${r === p.race ? "on" : ""}" data-v="${esc(r)}" ${ok ? "" : `disabled title="${esc(r)} can't be a ${esc(C.name)}"`} aria-pressed="${r === p.race}"><b>${esc(r.replace(" Skyborne", " Sky."))}${star ? ' <span class="star" title="Top race for this class">★</span>' : ""}</b><small>${ok ? esc(y[2] + " · " + y[3]) : "Not a " + esc(C.name)}</small></button>`; }).join("")}</div></div>
   <div class="opt"><span class="lbl">Playtime</span><div class="seg play" role="group" aria-label="Playtime">${PLAY.map(([n], i) => `<button data-v="${i}" class="${i === p.play ? "on" : ""}" aria-pressed="${i === p.play}">${n}</button>`).join("")}</div></div>`;
  const set = (k, v) => { const pk = S.picks[id]; pk[k] = v; if (k === "cls") { pk.spec = ""; const msg = fixPick(pk); if (msg) toast(msg); } draw(); };
  $$(".cbtn", ed).forEach(b => b.onclick = () => b.dataset.v !== p.cls && set("cls", b.dataset.v));
  $$(".sbtn", ed).forEach(b => b.onclick = () => set("spec", b.dataset.v));
  $$(".rbtn", ed).forEach(b => b.onclick = () => set("race", b.dataset.v));
  $$(".play button", ed).forEach(b => b.onclick = () => set("play", +b.dataset.v));
}
function drawResult() {
  const A = analyze(), res = $("#result");
  const lean = A.pve - A.pvp, leanTxt = !S.sel.length ? "" : lean > 8 ? "Leans PvE" : lean < -8 ? "Leans PvP" : "Good at both";
  const who = arr => arr.length ? arr.map(x => `<span style="color:${x.C.color}">${esc(x.m.name)}</span>`).join(", ") : `<span class="none">nobody</span>`;
  const pills = arr => arr.map(([n, on]) => `<span class="pill ${on ? "on" : ""}">${on ? "✓" : "✗"} ${esc(n)}</span>`).join("");
  if (!res.querySelector(".radar")) res.innerHTML = `<div class="res-top"></div><div class="radarbox">${radarSVG()}</div><div class="res-body"></div>`;
  $(".res-top", res).innerHTML = `
   <div class="grades"><div><span class="small cinzel">PvE</span><div class="bigscore g${letter(A.pve)}">${letter(A.pve)}</div></div><div><span class="small cinzel">PvP</span><div class="bigscore g${letter(A.pvp)}">${letter(A.pvp)}</div></div></div>
   <div class="lean" aria-label="${esc(leanTxt)}"><span>PvE</span><div class="leanbar"><i style="left:${50 + Math.max(-45, Math.min(45, -lean * 1.5))}%"></i></div><span>PvP</span></div><div class="leantxt">${leanTxt}</div>
   <div class="roles3"><div class="${A.tanks.length ? "" : "miss"}"><b>🛡️ Tank</b>${who(A.tanks)}</div><div class="${A.heals.length ? "" : "miss"}"><b>✚ Healer</b>${who(A.heals)}</div><div><b>⚔️ DPS</b>${who(A.dps)}</div></div>`;
  radarSet($(".radar", res), CATS.map(c => A.scores[c[0]]));
  $(".res-body", res).innerHTML = `
   <div class="catgrid">${CATS.map(([k, n, d]) => { const [w, c] = word(A.scores[k]); return `<div class="cat" title="${esc(d)}"><span>${n}</span><b class="w ${c}">${w}</b></div>`; }).join("")}</div>
   <h4>Buffs</h4><div class="pills">${pills(A.buffs)}</div>
   <h4>Dispels</h4><div class="pills">${pills(A.disp)}</div>
   <h4>Kit</h4><div class="pills">${pills(A.kit)}</div>
   <h4>Racials</h4><div class="rac">${S.sel.length ? `<div>${A.fit}/${A.team.length} on a top race for their class.</div>` : ""}${A.stacks.map(t => `<div>✦ ${esc(t)}</div>`).join("")}${A.tips.map(t => `<div class="small">${esc(t)}</div>`).join("")}</div>
   <div class="warns">${A.warn.map(([c, t]) => `<div class="warn ${c}">${c === "bad" ? "⛔" : "⚠️"} ${esc(t)}</div>`).join("")}${A.good.map(([c, t]) => `<div class="warn ok">✓ ${esc(t)}</div>`).join("")}</div>`;
  $("#mini").innerHTML = `<span>PvE <b class="g${letter(A.pve)}">${letter(A.pve)}</b></span><span>PvP <b class="g${letter(A.pvp)}">${letter(A.pvp)}</b></span><span>🛡️${A.tanks.length} ✚${A.heals.length} ⚔️${A.dps.length}</span><span class="go">${A.warn.some(w => w[0] === "bad") ? "⛔ " : ""}Details ↓</span>`;
}
