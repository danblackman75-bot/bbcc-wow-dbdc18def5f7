/* BBCC 3D characters (Wowhead ZamModelViewer via wow-model-viewer, ISC), loaded through BBCC_CONFIG.MODEL_PROXY.
   Every .av[data-cls] avatar starts as a placeholder card. Visible avatars join a queue and load one at a time;
   avatars that scroll away are torn down (the card shows again) so only a few WebGL viewers ever run at once. */
window.M3D = (() => {
  const C = window.BBCC_CONFIG || {}, BASE = (C.MODEL_PROXY || "").replace(/\/$/, "");
  const RACE_ID = { "Human": 1, "Orc": 2, "Dwarf": 3, "Night Elf": 4, "Undead": 5, "Tauren": 6, "Gnome": 7, "Troll": 8 };
  // [viewer slot, retail ItemDisplayInfoID]; vanilla T2 (T1 Bloodfang/Netherwind/Dragonstalker/Ten Storms = T2 sets of those classes) + BWL/MC weapons
  const GEAR = {"warrior": [[9, 33982], [5, 33983], [10, 33984], [1, 34215], [7, 33986], [3, 34253], [8, 33989], [6, 33990], [21, 30606], [22, 31852]], "priest": [[6, 34053], [9, 34052], [8, 34055], [1, 34233], [10, 34051], [7, 34049], [3, 34048], [21, 675577], [20, 34047]], "paladin": [[6, 33633], [9, 33634], [5, 33635], [1, 45888], [10, 33636], [7, 33637], [8, 33639], [3, 33680], [21, 675214], [22, 29702]], "druid": [[6, 30541], [8, 30542], [9, 30548], [5, 30536], [1, 178176], [10, 34016], [7, 30540], [3, 30546], [21, 32162]], "warlock": [[6, 34011], [8, 674855], [9, 34012], [10, 34013], [7, 7939], [1, 34369], [3, 34022], [21, 184656], [20, 674853]], "rogue": [[6, 31110], [8, 31111], [9, 31127], [5, 33650], [10, 32815], [1, 33743], [7, 31115], [3, 32813], [21, 33615], [22, 22366]], "mage": [[6, 34046], [9, 34045], [8, 34044], [1, 188836], [3, 34058], [10, 34041], [7, 34039], [5, 34038], [21, 31960]], "hunter": [[6, 33665], [9, 33666], [5, 33667], [10, 33668], [8, 34269], [1, 34367], [7, 33672], [3, 34091], [21, 682296], [26, 733457]], "shaman": [[6, 34078], [9, 34079], [5, 34081], [3, 34067], [10, 34082], [8, 34083], [1, 34217], [7, 34084], [21, 675214], [22, 29702]]};
  const LOOK = { 1: { skin: 2, face: 1, hairStyle: 3, hairColor: 2, facialStyle: 2 }, 3: { skin: 2, face: 1, hairStyle: 3, hairColor: 2, facialStyle: 4 }, 4: { skin: 2, face: 1, hairStyle: 2, hairColor: 3, facialStyle: 1 }, 7: { skin: 1, face: 1, hairStyle: 2, hairColor: 4, facialStyle: 1 } };
  const small = () => matchMedia("(max-width: 760px)").matches;
  const MAX_LIVE = () => small() ? 2 : 6;
  const WIDE = 900; // data-m3d="wide" avatars only go 3D at this width and up
  let libP = null, dead = false, busy = false, ok = null;
  const queue = [], live = new Set();

  function capable() {
    if (ok !== null) return ok && !dead;
    ok = false;
    if (!BASE) return false;
    const n = navigator; if (n.connection && n.connection.saveData) return false;
    if (n.deviceMemory && n.deviceMemory < 2) return false;
    try { ok = !!document.createElement("canvas").getContext("webgl2"); } catch (e) {}
    return ok;
  }
  const supports = el => !!(RACE_ID[el.dataset.race] && GEAR[el.dataset.cls]) && !(el.dataset.m3d === "wide" && innerWidth < WIDE) && el.dataset.m3d !== "off";
  const sig = el => el.dataset.cls + "|" + el.dataset.race + "|" + (el.dataset.gender || 0);
  const script = src => new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("load " + src)); document.head.append(s); });
  const timeout = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(what + " timeout")), ms))]);

  function lib() {
    if (!libP) libP = (async () => {
      window.CONTENT_PATH = BASE + "/modelviewer/live/"; window.WOTLK_TO_RETAIL_DISPLAY_ID_API = undefined;
      if (!window.jQuery) await script("assets/wmv/jquery.min.js");
      // the site owns the global $, so run Zam's viewer with $ bound to jQuery
      const src = await fetch(BASE + "/modelviewer/live/viewer/viewer.min.js").then(r => { if (!r.ok) throw new Error("viewer " + r.status); return r.text(); });
      const url = URL.createObjectURL(new Blob(["(function($){" + src + "\n})(window.jQuery);"], { type: "text/javascript" }));
      await script(url); URL.revokeObjectURL(url);
      if (!window.ZamModelViewer) throw new Error("viewer missing");
      return import("./wmv/index.js");
    })();
    return libP;
  }

  function teardown(el) {
    const s = el._m3d; if (!s) return; el._m3d = null; live.delete(el);
    try { s.viewer && s.viewer.renderer && s.viewer.renderer.destroy(); } catch (e) {}
    s.box.remove(); el.classList.remove("live", "loading");
  }
  function sweep() { live.forEach(el => { if (!el.isConnected) teardown(el); }); for (let i = queue.length; i--;) if (!queue[i].isConnected) queue.splice(i, 1); }

  function want(el) { if (!queue.includes(el) && !(el._m3d && el._m3d.sig === sig(el))) queue.push(el); pump(); }

  async function pump() {
    if (busy || dead) return;
    sweep();
    const next = queue.find(el => el._vis);
    if (!next) return;
    if (live.size >= MAX_LIVE()) {
      const idle = [...live].find(el => !el._vis);
      if (!idle) return;
      teardown(idle);
    }
    queue.splice(queue.indexOf(next), 1);
    busy = true;
    try { await load(next); } finally { busy = false; }
    pump();
  }

  async function load(el) {
    teardown(el);
    const want = sig(el), box = document.createElement("div"), id = "m3d" + Math.random().toString(36).slice(2, 8);
    box.className = "m3d"; box.id = id; el.append(box); el.classList.add("loading");
    const me = el._m3d = { box, viewer: null, sig: want }; live.add(el);
    let stage = "lib";
    try {
      const { generateModels } = await timeout(lib(), 20000, "viewer");
      stage = "model";
      if (el._m3d !== me) return;
      const r = RACE_ID[el.dataset.race];
      const ch = { race: r, gender: +(el.dataset.gender || 0), ...(LOOK[r] || { skin: 1, face: 1, hairStyle: 1, hairColor: 1, facialStyle: 1 }), items: GEAR[el.dataset.cls] };
      const v = await timeout(generateModels(0.75, "#" + id, ch), 20000, "model");
      if (el._m3d !== me) { try { v.renderer.destroy(); } catch (e) {} return; }
      me.viewer = v;
      const t0 = Date.now();
      await new Promise((res, rej) => { const t = setInterval(() => { const R = v.renderer; if (el._m3d !== me) { clearInterval(t); res(); } else if (R && R.actors && R.actors[0] && R.distance) { clearInterval(t); res(); } else if (Date.now() - t0 > 25000) { clearInterval(t); rej(new Error("model timeout")); } }, 150); });
      if (el._m3d !== me) return;
      // pull the camera back a touch so helmets and shoulders never clip
      setTimeout(() => { try { if (el._m3d === me) { v.renderer.distance *= 1.45; v.setZenith && v.setZenith(Math.PI / 2 + 0.06); } } catch (e) {} }, 900);
      el.classList.remove("loading"); el.classList.add("live");
      if (el._vis === false) setTimeout(() => { if (!el._vis && el._m3d === me && live.size > 1) teardown(el); }, 4000);
    } catch (e) {
      console.warn("3D model unavailable:", e.message);
      teardown(el); el.classList.add("no3d");
      if (stage === "lib") { dead = true; libP = null; queue.length = 0; document.querySelectorAll(".av").forEach(a => a.classList.add("no3d")); }
    }
  }

  const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => {
    const el = e.target; el._vis = e.isIntersecting;
    if (e.isIntersecting) want(el);
    else {
      const i = queue.indexOf(el); if (i > -1) queue.splice(i, 1);
      // pause offscreen: tear down after a grace period so quick scroll-bys don't thrash
      clearTimeout(el._off); el._off = setTimeout(() => { if (!el._vis && el._m3d && !el.classList.contains("loading")) teardown(el); }, small() ? 1500 : 6000);
    }
  }), { rootMargin: "120px 0px" }) : null;

  function observe(root = document) {
    sweep();
    if (!capable() || !io) { root.querySelectorAll(".av").forEach(a => a.classList.add("no3d")); return; }
    root.querySelectorAll(".av[data-cls]").forEach(el => {
      if (!supports(el)) { el.classList.add("no3d"); return; }
      el.classList.remove("no3d");
      if (!el._obs) { el._obs = 1; io.observe(el); }
    });
  }
  // avatar's class/race changed in place (War Room): swap the model if it's on screen
  function refresh(el) {
    if (el._m3d && el._m3d.sig === sig(el)) return;
    teardown(el);
    if (!capable() || !io || !supports(el)) { el.classList.add("no3d"); return; }
    el.classList.remove("no3d");
    if (!el._obs) { el._obs = 1; io.observe(el); return; }
    if (el._vis) want(el);
  }
  return { observe, refresh, capable, _state: () => ({ live: live.size, queue: queue.length, dead, busy }) };
})();
