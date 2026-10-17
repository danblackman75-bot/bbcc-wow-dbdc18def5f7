/* War Room: build a five-person party and see how it holds up */
const CATS = [
  ["survive", "Stay Alive", "A real tank and a real healer"],
  ["damage", "Damage", "How hard the damage dealers hit"],
  ["control", "Control", "Crowd control and interrupts"],
  ["utility", "Utility", "Buffs, dispels, rezzes, summons, water"],
  ["leveling", "Leveling", "How smoothly the group levels to 60"],
  ["pvp", "PvP", "Burst, control and staying power in BGs"],
];
const TV = { S: 4, A: 3, B: 2, C: 1 };
const PLAY = [
  ["Casual", 0.85],
  ["Regular", 1],
  ["Grinder", 1.12],
];
const LS = "bbcc-comp-v3";
// [PvE weight, PvP weight (0-3), PvE headline, PvP headline]
const RACE_SYN = {
  Human: [2, 3, "Ruthless crit", "Will to Survive"],
  Dwarf: [2, 1, "Stoneform", "Stoneform cleanse"],
  "Night Elf": [2, 2, "Elune's Light", "Shadowmeld"],
  Gnome: [2, 2, "Eureka!", "Escape Artist"],
  "High Order Skyborne": [1, 1, "+3% haste", "Walk on Air"],
  Orc: [3, 2, "Blood Fury", "Hardiness"],
  Undead: [1, 3, "Cannibalize", "Will of the Forsaken"],
  Tauren: [1, 2, "+5% health", "War Stomp"],
  Troll: [2, 1, "Berserking", "Regeneration"],
  "Windshaper Skyborne": [1, 1, "+3% haste", "Skysight"],
};
const STACK = Object.fromEntries(
  Object.keys(RACE_SYN).map((r) => [
    r,
    (n) =>
      `${n} ${r} picks: personal racials stay separate; stagger utility cooldowns.`,
  ]),
);
function partyName(m) {
  return m.builderName || m.name;
}
function racialFit(x) {
  const r = x.p.race,
    role = x.sp.role;
  if (r === "Dwarf")
    return role.includes("tank")
      ? "Stoneform adds a physical defensive to your tank."
      : "Stoneform is a personal cleanse; party dispels still matter.";
  if (r === "Human")
    return role === "heal"
      ? "Will to Survive helps keep the healer active through stuns."
      : "Ruthless adds crit; Will to Survive breaks a stun.";
  if (r === "Night Elf")
    return "Elune's Light adds a crit window; Shadowmeld adds personal utility.";
  if (r === "Gnome")
    return role === "heal"
      ? "Extra mana for healing; Escape Artist helps against roots."
      : "Eureka! adds a burst window; Escape Artist helps against roots.";
  if (r === "Orc")
    return "Blood Fury supports attack or spell burst; Hardiness shortens stuns.";
  if (r === "Undead")
    return role === "heal"
      ? "Fear break helps keep heals flowing; Cannibalize restores resources."
      : "Will of the Forsaken breaks fear, charm and sleep.";
  if (r === "Tauren")
    return role.includes("tank")
      ? "Endurance adds health; War Stomp helps control a pull."
      : "War Stomp adds close-range control; Endurance adds health.";
  if (r === "Troll")
    return role === "heal"
      ? "Berserking gives healing a haste window."
      : "Berserking gives damage a haste window.";
  return "Wind Blessed adds haste; Walk on Air adds travel utility.";
}

const BUFFS = [
  ["Fortitude", /fortitude/],
  ["Mark of the Wild", /mark of the wild/],
  ["Arcane Intellect", /arcane intellect/],
  ["Blessings", /blessings/],
  ["Battle Shout", /battle shout/],
  ["Totems", /totems/],
  ["Trueshot Aura", /trueshot/],
];
const KIT = [
  ["Water", /food/],
  ["Portals", /portals/],
  ["Summons", /summon/],
  ["Healthstones", /healthstones/],
  ["Battle rez", /battle res/],
  ["Soulstone", /soulstone/],
  ["Innervate", /innervate/],
];
const DISPELS = ["magic", "curse", "poison", "disease"];
const ROLE_ICO = { tank: "", heal: "", dps: "", "tank/dps": "" };
const cap = (s) => s[0].toUpperCase() + s.slice(1);
let S;
function defaultState() {
  const picks = {};
  BB.members.members.forEach(
    (m) =>
      (picks[m.id] = {
        cls: m.pick.cls,
        spec: m.pick.spec,
        race: m.pick.race,
        play: 1,
      }),
  );
  const sel = BB.members.members
    .filter((m) => m.defaultParty)
    .slice(0, 5)
    .map((m) => m.id);
  return { faction: "Alliance", sel, picks, active: sel[0] };
}
function saveS() {
  try {
    localStorage.setItem(LS, JSON.stringify(S));
  } catch (e) {}
}
function racesFor(clsKey, fac = S.faction) {
  return Object.entries(BB.game.races[fac])
    .filter(([r, cl]) => cl.includes(clsKey))
    .map(([r]) => r);
}
function fixPick(p) {
  if (!cls(p.cls)) {
    p.cls = "warrior";
    p.spec = "";
  }
  const C = cls(p.cls);
  if (!own(C.specs, p.spec)) p.spec = Object.keys(C.specs)[0];
  if (!Number.isInteger(p.play) || !PLAY[p.play]) p.play = 1;
  const rs = racesFor(p.cls);
  if (!rs.includes(p.race)) {
    const was = p.race;
    p.race = rs[0];
    return was
      ? `${was} can't be a ${C.name} on ${S.faction}, so ${p.race}${rs.length === 1 ? ` (the only ${S.faction} ${C.name} race)` : ""}`
      : "";
  }
  return "";
}
function topRace(clsKey, fac, pvp) {
  const row = BB.game.bestRace.find((r) => r[0] === clsKey);
  if (!row) return "";
  return row[(fac === "Alliance" ? 1 : 2) + (pvp ? 2 : 0)] || "";
}
const firstRace = (s) => s.split(/ \(|;/)[0].trim();
function analyze() {
  const team = S.sel
    .map((id) => ({
      id,
      m: { ...BB.M[id], name: partyName(BB.M[id]) },
      p: S.picks[id],
    }))
    .map((x) => ({
      ...x,
      C: cls(x.p.cls),
      sp: cls(x.p.cls).specs[x.p.spec],
      w: PLAY[x.p.play][1],
    }));
  if (!team.length)
    return {
      team,
      scores: Object.fromEntries(CATS.map((c) => [c[0], 0])),
      pve: 0,
      pvp: 0,
      warn: [["bad", "Pick some heroes first."]],
      good: [],
      tanks: [],
      heals: [],
      dps: [],
      buffs: [],
      kit: [],
      disp: [],
      stacks: [],
      fit: 0,
      tips: [],
    };
  const isH = (x) => x.sp.role === "heal";
  let tanks = team.filter((x) => x.sp.role === "tank");
  const flex = team.filter((x) => x.sp.role === "tank/dps");
  if (!tanks.length && flex.length) tanks = [flex[0]];
  const heals = team.filter(isH),
    dps = team.filter((x) => !tanks.includes(x) && !isH(x));
  const avg = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0),
    cl = (v) => Math.max(0, Math.min(100, Math.round(v)));
  const best = (arr) =>
    arr.length ? Math.max(...arr.map((x) => TV[x.sp.pve] * x.w)) : 0;
  let survive =
    (tanks.length ? (best(tanks) / 4) * 50 : 0) +
    (heals.length ? (best(heals) / 4) * 50 : 0) +
    (heals.length > 1 ? 6 : 0);
  if (tanks[0] && tanks[0].sp.role === "tank/dps") survive -= 6;
  const extraT = tanks
    .slice()
    .sort((a, b) => TV[b.sp.pve] - TV[a.sp.pve])
    .slice(1); // a 2nd tank DPSes, badly
  const rPve = avg(team.map((x) => (RACE_SYN[x.p.race] || [1.5])[0])),
    rPvp = avg(team.map((x) => (RACE_SYN[x.p.race] || [0, 1.5])[1]));
  const damage =
    avg([
      ...dps.map(
        (x) =>
          ((TV[x.sp.pve] / 4) * 60 +
            ((x.sp.attrs[1] + x.sp.attrs[2]) / 20) * 40) *
          x.w,
      ),
      ...extraT.map((x) => 30 * x.w),
    ]) +
    (rPve - 1.5) * 4;
  const tags = team.flatMap((x) =>
    x.C.util.filter(
      (t) => t !== "trueshot aura" || x.p.spec === "Marksmanship",
    ),
  );
  const ints = new Set(
    team
      .filter((x) => x.C.util.some((t) => t.includes("interrupt")))
      .map((x) => x.id),
  ).size;
  const ccs = tags.filter((t) => /cc\(|fear|stun|silence/.test(t)).length;
  const control = Math.min(1, ints / 2) * 50 + Math.min(1, ccs / 3) * 50;
  const disp = DISPELS.filter((d) =>
    tags.some((t) => t.includes(d + " dispel")),
  );
  const buffN = new Set(
    tags.filter((t) =>
      /aura|blessing|fortitude|intellect|mark of|shout|totem/.test(t),
    ),
  ).size;
  const rez = tags.some((t) => /battle res|soulstone|reincarnation/.test(t)),
    logi = tags.some((t) => /summon|food|portal/.test(t));
  const utility =
    (disp.length / 4) * 40 +
    (Math.min(buffN, 4) / 4) * 40 +
    (rez ? 10 : 0) +
    (logi ? 10 : 0);
  const leveling = avg(team.map((x) => x.sp.attrs[3] * 10 * x.w));
  const pvp =
    avg(team.map((x) => ((TV[x.sp.pvp] / 4) * 60 + x.sp.attrs[5] * 4) * x.w)) +
    (heals.length ? 5 : -10) +
    (rPvp - 1.5) * 4;
  const scores = {
    survive: cl(survive),
    damage: cl(damage),
    control: cl(control),
    utility: cl(utility),
    leveling: cl(leveling),
    pvp: cl(pvp),
  };
  let pve = cl(
    0.3 * scores.survive +
      0.25 * scores.damage +
      0.2 * scores.control +
      0.15 * scores.utility +
      0.1 * scores.leveling,
  );
  if (!heals.length) pve = Math.min(pve, 44);
  else if (!tanks.length) pve = Math.min(pve, 57); // dungeons need both: no healer caps at D, no tank at C
  const pvpAll = cl(
    0.5 * scores.pvp +
      0.2 * scores.survive +
      0.2 * scores.control +
      0.1 * scores.utility,
  );
  // racials: stacking and best-race fit
  const raceN = team.reduce(
    (a, x) => ((a[x.p.race] = (a[x.p.race] || 0) + 1), a),
    {},
  );
  const stacks = Object.entries(raceN)
    .filter(([r, n]) => n > 1 && STACK[r])
    .map(([r, n]) => STACK[r](n));
  let fit = 0;
  const tips = [];
  team.forEach((x) => {
    const a = topRace(x.p.cls, S.faction, false),
      b = topRace(x.p.cls, S.faction, true);
    if (a.includes(x.p.race) || b.includes(x.p.race)) fit++;
    else if (
      a &&
      tips.length < 2 &&
      firstRace(a) !== x.p.race &&
      racesFor(x.p.cls).includes(firstRace(a))
    )
      tips.push(
        `${x.m.name}: ${firstRace(a)} is the usual ${S.faction} ${x.C.name} pick.`,
      );
  });
  const W = [],
    G = [];
  if (!tanks.length) W.push(["bad", "No tank. Someone has to hold aggro."]);
  else if (tanks[0].sp.role === "tank/dps")
    W.push([
      "meh",
      `${tanks[0].m.name} covers tank as Feral. Bring a tanking setup.`,
    ]);
  if (!heals.length)
    W.push(["bad", "No healer. Add a healing spec before the first pull."]);
  if (tanks.length && heals.length) G.push(["ok", "Tank and healer covered."]);
  const realT = team.filter((x) => x.sp.role === "tank").length;
  if (realT > 1)
    W.push([
      "meh",
      `${realT} tanks. Only one gets to tank; the other becomes a very sturdy DPS.`,
    ]);
  if (ints === 0)
    W.push([
      "bad",
      "No interrupts. Enemy casters will cast whatever they like.",
    ]);
  else if (ints === 1)
    W.push([
      "meh",
      "One interrupt. A Rogue, Mage, Warrior or Shaman would help.",
    ]);
  if (ccs < 2) W.push(["meh", "Light on crowd control. Big pulls will hurt."]);
  const missing = DISPELS.filter((d) => !disp.includes(d));
  if (missing.length)
    W.push(["meh", "No dispel for " + missing.map(cap).join(", ") + "."]);
  else G.push(["ok", "Every dispel type covered."]);
  if (!tags.some((t) => /food|portal/.test(t)))
    W.push(["meh", "No Mage: no free water, no portals. Pack snacks."]);
  if (!rez) W.push(["meh", "No battle rez or Soulstone."]);
  Object.entries(
    team.reduce((a, x) => ((a[x.p.cls] = (a[x.p.cls] || 0) + 1), a), {}),
  )
    .filter(([k, n]) => n > 1)
    .forEach(([k, n]) =>
      W.push([
        "meh",
        `${n}× ${cls(k).name}: overlapping buffs and more loot competition.`,
      ]),
    );
  if (heals.length > 1)
    W.push([
      "meh",
      `${heals.length} healers: safe pulls, slower clears. Swap one to DPS for dungeons.`,
    ]);
  if (team.length < 5) W.push(["meh", `${team.length}/5 picked.`]);
  const buffs = BUFFS.map(([n, re]) => [n, tags.some((t) => re.test(t))]);
  const kit = KIT.map(([n, re]) => [n, tags.some((t) => re.test(t))]);
  return {
    team,
    scores,
    pve,
    pvp: pvpAll,
    warn: W,
    good: G,
    tanks,
    heals,
    dps,
    buffs,
    kit,
    disp: DISPELS.map((d) => [cap(d), disp.includes(d)]),
    stacks,
    fit,
    tips,
    ints,
    ccs,
  };
}
const word = (v) =>
  v >= 70 ? ["Strong", "ok"] : v >= 45 ? ["OK", "meh"] : ["Weak", "bad"];
const letter = (v) =>
  !S.sel.length
    ? "-"
    : v >= 85
      ? "S"
      : v >= 72
        ? "A"
        : v >= 58
          ? "B"
          : v >= 45
            ? "C"
            : "D";

/* ---------- radar (plain SVG, tweened) ---------- */
let radarPrev = null;
function radarPts(vals, R = 100) {
  return vals.map((v, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / vals.length,
      r = (R * Math.max(4, v)) / 100;
    return [Math.cos(a) * r, Math.sin(a) * r];
  });
}
function radarSVG() {
  const n = CATS.length,
    ring = (f) =>
      radarPts(Array(n).fill(f * 100))
        .map((p) => p.join(","))
        .join(" ");
  const lab = radarPts(Array(n).fill(128))
    .map(
      ([x, y], i) =>
        `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${Math.abs(x) < 5 ? "middle" : x > 0 ? "start" : "end"}">${CATS[i][1]}</text>`,
    )
    .join("");
  return `<svg class="radar" viewBox="-185 -150 370 300" role="img" aria-label="Party strengths chart">
   ${[0.25, 0.5, 0.75, 1].map((f) => `<polygon class="rg" points="${ring(f)}"/>`).join("")}
   ${radarPts(Array(n).fill(100))
     .map(
       ([x, y]) =>
         `<line class="rg" x1="0" y1="0" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`,
     )
     .join("")}
   <polygon class="rv" points=""/>${CATS.map(() => `<circle class="rp" r="4"/>`).join("")}${lab}</svg>`;
}
function radarSet(svg, vals) {
  const from = radarPrev || vals.map(() => 0),
    poly = svg.querySelector(".rv"),
    dots = svg.querySelectorAll(".rp");
  const paint = (cur) => {
    const pts = radarPts(cur);
    poly.setAttribute(
      "points",
      pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" "),
    );
    pts.forEach(([x, y], i) => {
      dots[i].setAttribute("cx", x.toFixed(1));
      dots[i].setAttribute("cy", y.toFixed(1));
    });
  };
  radarPrev = vals.slice();
  // phones and reduced motion: jump straight to the new shape (a few hundred ms of frames per tap isn't worth it there)
  if (
    matchMedia(
      "(prefers-reduced-motion: reduce), (pointer: coarse), (max-width: 899px)",
    ).matches
  )
    return paint(vals);
  const t0 = performance.now(),
    D = 380;
  const step = (t) => {
    const k = Math.min(1, (t - t0) / D),
      e = 1 - Math.pow(1 - k, 3);
    paint(vals.map((v, i) => from[i] + (v - from[i]) * e));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- UI ---------- */
function loadS() {
  let s = null;
  try {
    s = JSON.parse(localStorage.getItem(LS) || "null");
  } catch (e) {}
  if (
    !s ||
    typeof s !== "object" ||
    !s.picks ||
    Array.isArray(s.picks) ||
    typeof s.picks !== "object"
  )
    s = defaultState();
  const d = defaultState();
  s.picks = Object.fromEntries(
    BB.members.members.map((m) => [
      m.id,
      s.picks[m.id] &&
      typeof s.picks[m.id] === "object" &&
      !Array.isArray(s.picks[m.id])
        ? s.picks[m.id]
        : d.picks[m.id],
    ]),
  );
  BB.members.members.forEach((m) => {
    if (!s.picks[m.id] || typeof s.picks[m.id] !== "object")
      s.picks[m.id] = d.picks[m.id];
  });
  s.sel = [
    ...new Set(
      (Array.isArray(s.sel) ? s.sel : d.sel).filter((id) => own(BB.M, id)),
    ),
  ].slice(0, 5);
  if (!own(BB.game.races, s.faction)) s.faction = "Alliance";
  if (!s.sel.includes(s.active)) s.active = s.sel[0] || null;
  return s;
}
function renderBuilder(root) {
  S = loadS();
  const hm = location.hash.match(/^#m=(\w+)/);
  if (hm && own(BB.M, hm[1])) {
    const id = hm[1];
    if (!S.sel.includes(id)) {
      if (S.sel.length >= 5) S.sel[S.sel.length - 1] = id;
      else S.sel.push(id);
    }
    S.active = id;
  }
  const presets = BB.content.presets;
  root.innerHTML = `
  <section class="wrap wr">
   <h2 class="sec">The War Room</h2>
   <p class="sub">Five slots. Make them count.</p><div class="steps"><span>01 / Pick your crew</span><span>02 / Tune each build</span><span>03 / Check the gaps</span></div>
   <div class="panel wr-bar">
     <div class="seg fac" role="group" aria-label="Faction"><button data-f="Alliance" class="A"> Alliance</button><button data-f="Horde" class="H"> Horde</button></div>
     <div class="presets" role="group" aria-label="Presets">${Object.keys(
       presets,
     )
       .map(
         (k) => `<button class="pchip" data-p="${esc(k)}">${esc(k)}</button>`,
       )
       .join("")}</div>
     <button class="btn ghost" id="reset">↺ Reset party</button>
   </div>
   <div class="party" id="party" role="list">${Array.from({ length: 5 }, (_, i) => `<div class="slot" role="listitem" data-i="${i}"></div>`).join("")}</div>
   <div class="bench" id="bench" aria-label="Bench"></div>
   <div id="coverage" class="coverage" role="status" aria-live="polite"></div><a id="mini" class="minigrade" href="#result" aria-label="Jump to party grades"></a>
   <div class="builder">
     <div class="panel editor" id="editor"><div class="ed-av"></div><div class="ed-ctrl"></div></div>
     <aside id="result" class="panel" aria-label="Party analysis"></aside>
   </div>
   <details class="panel howto"><summary>How grading works</summary>
     <p>Planning grades, not a damage sim. Beta balance can change. Aim for one tank, one healer and three damage dealers.</p>
     <ul>${CATS.map((c) => `<li><b>${c[1]}</b>: ${c[2]}</li>`).join("")}</ul>
     <p class="small">${src("Wowhead dungeon guide", "https://www.wowhead.com/classic/guide/classic-dungeons-overview")} · ${src("Tier list roundup", "https://endgametools.com/en/wow-forever/news/wow-forever-tier-list")}</p>
   </details>
  </section>`;
  $$(".fac button", root).forEach(
    (b) =>
      (b.onclick = () => {
        if (S.faction === b.dataset.f) return;
        S.faction = b.dataset.f;
        const msgs = S.sel
          .map((id) => {
            const m = fixPick(S.picks[id]);
            return m && `${partyName(BB.M[id])}: ${m}`;
          })
          .filter(Boolean);
        draw();
        if (msgs.length)
          toast(
            msgs.length > 1
              ? `${msgs.length} races swapped for ${S.faction}`
              : msgs[0],
          );
      }),
  );
  $$(".pchip", root).forEach(
    (b) =>
      (b.onclick = () => {
        const p = presets[b.dataset.p];
        if (
          !p ||
          !own(BB.game.races, p.faction) ||
          !p.picks ||
          typeof p.picks !== "object"
        )
          return;
        S.faction = p.faction;
        S.sel = Object.keys(p.picks)
          .filter((id) => own(BB.M, id) && Array.isArray(p.picks[id]))
          .slice(0, 5);
        S.sel.forEach((id) => {
          const [c, s, r] = p.picks[id];
          S.picks[id] = { ...S.picks[id], cls: c, spec: s, race: r };
        });
        S.active = S.sel[0];
        draw();
        toast(b.dataset.p + " loaded");
      }),
  );
  $("#reset", root).onclick = () => {
    S = defaultState();
    draw();
    toast("Back to defaults");
  };
  draw();
}
function slotHTML(id) {
  const m = { ...BB.M[id], name: partyName(BB.M[id]) },
    p = S.picks[id];
  return `${avatar(p.cls, p.race, "", { key: id, cls: "sm" })}<button class="slot-pick" aria-pressed="false"><span class="slot-txt"><b>${esc(m.name)}</b><small></small></span><span class="slot-role" aria-hidden="true"></span></button><button class="slot-x" aria-label="Bench ${esc(m.name)}">×</button>`;
}
function draw() {
  BB.members.members.forEach((m) => fixPick(S.picks[m.id]));
  if (!S.sel.includes(S.active)) S.active = S.sel[0] || null;
  saveS();
  $$(".fac button").forEach((b) => {
    b.classList.toggle("on", b.dataset.f === S.faction);
    b.setAttribute("aria-pressed", b.dataset.f === S.faction);
  });
  document.body.dataset.fac = S.faction;
  // party slots: keep avatar nodes alive so 3D models survive redraws
  $$("#party .slot").forEach((slot, i) => {
    const id = S.sel[i];
    if (!id) {
      if (slot.dataset.id !== "") {
        slot.dataset.id = "";
        slot.className = "slot empty";
        slot.innerHTML = `<span>+</span><small>Add from the bench</small>`;
      }
      return;
    }
    const m = { ...BB.M[id], name: partyName(BB.M[id]) },
      p = S.picks[id],
      C = cls(p.cls),
      sp = C.specs[p.spec];
    if (slot.dataset.id !== id) {
      slot.dataset.id = id;
      slot.className = "slot";
      slot.innerHTML = slotHTML(id);
      bindAvatars(slot);
      $(".slot-pick", slot).onclick = () => {
        S.active = id;
        draw();
        if (innerWidth < 980)
          $("#editor").scrollIntoView({ behavior: "smooth", block: "start" });
      };
      $(".slot-x", slot).onclick = () => {
        S.sel = S.sel.filter((x) => x !== id);
        draw();
        toast(`${m.name} to the bench`);
      };
    }
    setAvatar($(".av", slot), p.cls, p.race, "");
    slot.style.setProperty("--cc", C.color);
    slot.classList.toggle("on", id === S.active);
    $(".slot-pick", slot).setAttribute("aria-pressed", id === S.active);
    $(".slot-txt small", slot).textContent = `${p.race} · ${p.spec} ${C.name}`;
    $(".slot-role", slot).textContent = ROLE_ICO[sp.role];
  });
  const bench = BB.members.members.filter((m) => !S.sel.includes(m.id));
  $("#bench").innerHTML = bench.length
    ? `<span class="lbl">Bench</span>${bench
        .map((m) => {
          const c = cls(S.picks[m.id].cls);
          return `<button class="bchip" data-id="${m.id}" style="--cc:${c.color}"><i aria-hidden="true">${c.icon}</i>${esc(partyName(m))}</button>`;
        })
        .join("")}`
    : "";
  $$("#bench .bchip").forEach(
    (b) =>
      (b.onclick = () => {
        const id = b.dataset.id;
        if (S.sel.length < 5) {
          S.sel.push(id);
          toast(`${partyName(BB.M[id])} joins the party`);
        } else {
          const out = S.active || S.sel[4],
            i = S.sel.indexOf(out);
          S.sel[i] = id;
          toast(`${partyName(BB.M[id])} in, ${partyName(BB.M[out])} out`);
        }
        S.active = id;
        draw();
      }),
  );
  drawEditor();
  drawResult();
}
function drawEditor() {
  const ed = $("#editor"),
    id = S.active;
  if (!id) {
    ed.classList.add("empty");
    $(".ed-av", ed).innerHTML = "";
    $(".ed-ctrl", ed).innerHTML =
      `<p class="ed-none">Your party is empty. Tap someone on the bench.</p>`;
    return;
  }
  ed.classList.remove("empty");
  const m = { ...BB.M[id], name: partyName(BB.M[id]) },
    p = S.picks[id],
    C = cls(p.cls),
    box = $(".ed-av", ed);
  ed.style.setProperty("--cc", C.color);
  const cur = $(".av", box);
  if (!cur || cur.dataset.key !== id) {
    box.innerHTML = avatar(p.cls, p.race, m.name, { key: id, cls: "lg" });
    bindAvatars(box);
  } else setAvatar(cur, p.cls, p.race, m.name);
  const races = Object.keys(BB.game.races[S.faction]),
    legal = racesFor(p.cls);
  const tA = topRace(p.cls, S.faction, false),
    tP = topRace(p.cls, S.faction, true);
  const ctrl = $(".ed-ctrl", ed),
    html = `
   <div class="ed-head"><h3>${esc(m.name)}</h3><span class="tag">Editing build</span><span class="small">${esc(p.race)} · ${esc(p.spec)} ${C.name}</span></div>
   <div class="opt"><span class="lbl">Class</span><div class="cgrid">${Object.entries(
     BB.game.classes,
   )
     .filter(([k]) => racesFor(k).length)
     .map(
       ([k, c]) =>
         `<button class="cbtn ${k === p.cls ? "on" : ""}" data-v="${k}" style="--cc:${c.color}" aria-pressed="${k === p.cls}"><span aria-hidden="true">${c.icon}</span><small>${c.name}</small></button>`,
     )
     .join("")}</div></div>
   <div class="opt"><span class="lbl">Spec</span><div class="sgrid">${Object.entries(
     C.specs,
   )
     .map(
       ([s, d]) =>
         `<button class="sbtn ${s === p.spec ? "on" : ""}" data-v="${esc(s)}" aria-pressed="${s === p.spec}"><b>${esc(s)}</b><small>${ROLE_ICO[d.role]} ${ROLE_NAME[d.role]}</small><span class="st">${tier(d.pve)}<i>PvE</i>${tier(d.pvp)}<i>PvP</i></span></button>`,
     )
     .join("")}</div></div>
   <div class="opt"><span class="lbl">Race <small>${S.faction}</small></span><div class="rgrid">${races
     .map((r) => {
       const ok = legal.includes(r),
         y = RACE_SYN[r],
         star = ok && (tA.includes(r) || tP.includes(r));
       return `<button class="rbtn ${r === p.race ? "on" : ""}" data-v="${esc(r)}" ${ok ? "" : `disabled title="${esc(r)} can't be a ${esc(C.name)}"`} aria-pressed="${r === p.race}"><b>${esc(r.replace(" Skyborne", " Sky."))}${star ? ' <span class="star" title="Top race for this class"></span>' : ""}</b><small>${ok ? esc(y[2] + " · " + y[3]) : "Not a " + esc(C.name)}</small></button>`;
     })
     .join("")}</div></div>
   <div class="opt"><span class="lbl">Playtime</span><div class="seg play" role="group" aria-label="Playtime">${PLAY.map(([n], i) => `<button data-v="${i}" class="${i === p.play ? "on" : ""}" aria-pressed="${i === p.play}">${n}</button>`).join("")}</div></div>`;
  // patch only what changed, so the button under your finger is never destroyed and rebuilt mid-tap
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const nu = [...tmp.children],
    old = [...ctrl.children];
  if (old.length !== nu.length || ctrl.querySelector(".ed-none"))
    ctrl.replaceChildren(...nu);
  else
    nu.forEach((n, i) => {
      const o = old[i];
      if (o.outerHTML === n.outerHTML) return;
      const ob = o.querySelectorAll("button"),
        nb = n.querySelectorAll("button");
      if (ob.length === nb.length && ob.length) {
        ob.forEach((b, j) => {
          const c = nb[j];
          if (b.outerHTML === c.outerHTML) return;
          b.className = c.className;
          b.innerHTML !== c.innerHTML && (b.innerHTML = c.innerHTML);
          [
            "aria-pressed",
            "style",
            "disabled",
            "title",
            "data-v",
            "aria-label",
          ].forEach((a) =>
            c.hasAttribute(a)
              ? b.getAttribute(a) !== c.getAttribute(a) &&
                b.setAttribute(a, c.getAttribute(a))
              : b.removeAttribute(a),
          );
        });
        const ol = o.querySelector(".lbl"),
          nl = n.querySelector(".lbl");
        if (ol && nl && ol.innerHTML !== nl.innerHTML)
          ol.innerHTML = nl.innerHTML;
      } else o.replaceWith(n);
    });
  ed._id = id;
  if (!ed._bound) {
    ed._bound = 1;
    ed.addEventListener("click", (e) => {
      const b = e.target.closest(".ed-ctrl button[data-v]");
      if (!b || b.disabled) return;
      const id = ed._id,
        pk = S.picks[id],
        v = b.dataset.v;
      const set = (k, v) => {
        if (pk[k] === v) return;
        pk[k] = v;
        if (k === "cls") {
          pk.spec = "";
          const msg = fixPick(pk);
          if (msg) toast(msg);
        }
        draw();
      };
      if (b.classList.contains("cbtn")) set("cls", v);
      else if (b.classList.contains("sbtn")) set("spec", v);
      else if (b.classList.contains("rbtn")) set("race", v);
      else if (b.closest(".play")) set("play", +v);
    });
  }
}
function drawResult() {
  const A = analyze(),
    res = $("#result");
  const missing = !A.tanks.length
    ? "Tank needed"
    : !A.heals.length
      ? "Healer needed"
      : A.team.length < 5
        ? "Room for " + (5 - A.team.length) + " more"
        : A.heals.length > 1
          ? "Extra heals; light on damage"
          : "Ready for a dungeon";
  $("#coverage").innerHTML =
    `<div><span class="eyebrow">LIVE PARTY CHECK</span><b>${missing}</b></div><div class="coverage-roles"><span class="${A.tanks.length ? "covered" : "gap"}">${A.tanks.length} tank</span><span class="${A.heals.length ? "covered" : "gap"}">${A.heals.length} heal</span><span>${A.dps.length} DPS</span></div><a href="#result">Full breakdown →</a>`;
  if (S.active) {
    const focus = A.team.find((x) => x.id === S.active);
    $("#coverage").insertAdjacentHTML(
      "beforeend",
      `<p>${esc(focus.m.name)}: ${esc(racialFit(focus))}</p>`,
    );
  }

  const lean = A.pve - A.pvp,
    leanTxt = !S.sel.length
      ? ""
      : lean > 8
        ? "Leans PvE"
        : lean < -8
          ? "Leans PvP"
          : "Good at both";
  const who = (arr) =>
    arr.length
      ? arr
          .map(
            (x) => `<span style="color:${x.C.color}">${esc(x.m.name)}</span>`,
          )
          .join(", ")
      : `<span class="none">nobody</span>`;
  const pills = (arr) =>
    arr
      .map(
        ([n, on]) =>
          `<span class="pill ${on ? "on" : ""}"><span aria-hidden="true">${on ? "✓" : "−"}</span> ${esc(n)}<span class="sr-only">: ${on ? "covered" : "missing"}</span></span>`,
      )
      .join("");
  if (!res.querySelector(".radar"))
    res.innerHTML = `<div class="result-heading"><h2>Party check</h2><span class="tag">Live</span></div><div class="res-top"></div><div class="radarbox">${radarSVG()}</div><div class="res-body"></div>`;
  $(".res-top", res).innerHTML = `
   <div class="grades"><div><span class="small cinzel">PvE</span><div class="bigscore g${letter(A.pve)}">${letter(A.pve)}</div></div><div><span class="small cinzel">PvP</span><div class="bigscore g${letter(A.pvp)}">${letter(A.pvp)}</div></div></div>
   <div class="lean" aria-label="${esc(leanTxt)}"><span>PvE</span><div class="leanbar"><i style="left:${50 + Math.max(-45, Math.min(45, -lean * 1.5))}%"></i></div><span>PvP</span></div><div class="leantxt">${leanTxt}</div>
   <div class="roles3"><div class="${A.tanks.length ? "" : "miss"}"><b> Tank</b>${who(A.tanks)}</div><div class="${A.heals.length ? "" : "miss"}"><b> Healer</b>${who(A.heals)}</div><div><b> DPS</b>${who(A.dps)}</div></div>`;
  radarSet(
    $(".radar", res),
    CATS.map((c) => A.scores[c[0]]),
  );
  $(".res-body", res).innerHTML = `
   <div class="catgrid">${CATS.map(([k, n, d]) => {
     const [w, c] = word(A.scores[k]);
     return `<div class="cat" title="${esc(d)}"><span>${n}</span><b class="w ${c}">${w}</b></div>`;
   }).join("")}</div>
   <h4>Buffs</h4><div class="pills">${pills(A.buffs)}</div>
   <h4>Dispels</h4><div class="pills">${pills(A.disp)}</div>
   <h4>Kit</h4><div class="pills">${pills(A.kit)}</div>
   <h4>Racial fit</h4><div class="rac">${S.sel.length ? `<div>${A.fit}/${A.team.length} on a top race for their class.</div>` : ""}${A.team.map((x) => `<div class="racial-fit"><b>${esc(x.m.name)} · ${esc(x.p.race)}</b><span>${esc(racialFit(x))}</span></div>`).join("")}${A.stacks.map((t) => `<div> ${esc(t)}</div>`).join("")}${A.tips.map((t) => `<div class="small">${esc(t)}</div>`).join("")}</div>
   <div class="warns">${A.warn.map(([c, t]) => `<div class="warn ${c}">${c === "bad" ? "" : ""} ${esc(t)}</div>`).join("")}${A.good.map(([c, t]) => `<div class="warn ok"> ${esc(t)}</div>`).join("")}</div>`;
  $("#mini").innerHTML =
    `<span>PvE <b class="g${letter(A.pve)}">${letter(A.pve)}</b></span><span>PvP <b class="g${letter(A.pvp)}">${letter(A.pvp)}</b></span><span>${A.tanks.length} tank · ${A.heals.length} heal · ${A.dps.length} DPS</span><span class="go">Details ↓</span>`;
}
