/* BBCC 3D characters (Wowhead ZamModelViewer via wow-model-viewer, ISC), loaded through BBCC_CONFIG.MODEL_PROXY.
   Every .av[data-cls] avatar is always a 3D model: it shows a loading shimmer until the model is up, and a failed
   load is retried (never a drawing). Avatars load lazily as they near the screen and then STAY loaded; offscreen
   viewers stop rendering (frozen on their last frame). Only past the WebGL context cap is the farthest offscreen
   viewer released, and it leaves a still image of its own 3D render in place until it is rebuilt. */
window.M3D = (() => {
  const C = window.BBCC_CONFIG || {}, BASE = (C.MODEL_PROXY || "").replace(/\/$/, "");
  const RACE_ID = { "Human": 1, "Orc": 2, "Dwarf": 3, "Night Elf": 4, "Undead": 5, "Tauren": 6, "Gnome": 7, "Troll": 8 };
  // [viewer slot, retail ItemDisplayInfoID]; vanilla T2 (T1 Bloodfang/Netherwind/Dragonstalker/Ten Storms = T2 sets of those classes) + BWL/MC weapons
  const GEAR = {"warrior": [[9, 33982], [5, 33983], [10, 33984], [1, 34215], [7, 33986], [3, 34253], [8, 33989], [6, 33990], [21, 30606], [22, 31852]], "priest": [[6, 34053], [9, 34052], [8, 34055], [1, 34233], [10, 34051], [7, 34049], [3, 34048], [21, 675577], [20, 34047]], "paladin": [[6, 33633], [9, 33634], [5, 33635], [1, 45888], [10, 33636], [7, 33637], [8, 33639], [3, 33680], [21, 675214], [22, 29702]], "druid": [[6, 30541], [8, 30542], [9, 30548], [5, 30536], [1, 178176], [10, 34016], [7, 30540], [3, 30546], [21, 32162]], "warlock": [[6, 34011], [8, 674855], [9, 34012], [10, 34013], [7, 7939], [1, 34369], [3, 34022], [21, 184656], [20, 674853]], "rogue": [[6, 31110], [8, 31111], [9, 31127], [5, 33650], [10, 32815], [1, 33743], [7, 31115], [3, 32813], [21, 33615], [22, 22366]], "mage": [[6, 34046], [9, 34045], [8, 34044], [1, 188836], [3, 34058], [10, 34041], [7, 34039], [5, 34038], [21, 31960]], "hunter": [[6, 33665], [9, 33666], [5, 33667], [10, 33668], [8, 34269], [1, 34367], [7, 33672], [3, 34091], [21, 682296], [26, 733457]], "shaman": [[6, 34078], [9, 34079], [5, 34081], [3, 34067], [10, 34082], [8, 34083], [1, 34217], [7, 34084], [21, 675214], [22, 29702]]};
  const LOOK = { 1: { skin: 2, face: 1, hairStyle: 3, hairColor: 2, facialStyle: 2 }, 3: { skin: 2, face: 1, hairStyle: 3, hairColor: 2, facialStyle: 4 }, 4: { skin: 2, face: 1, hairStyle: 2, hairColor: 3, facialStyle: 1 }, 7: { skin: 1, face: 1, hairStyle: 2, hairColor: 4, facialStyle: 1 } };
  // camera framing per race: [distance multiplier, vertical aim offset as a fraction of distance]
  const FRAME = { 1: [1.05, 0], 2: [1.05, 0], 3: [1.05, 0], 4: [1.05, 0], 5: [1.05, 0], 6: [1.05, 0], 7: [1.05, 0], 8: [1.05, 0] };
  const FRAME_K = (window.BBCC_FRAME_K || 1);
  const small = () => matchMedia("(max-width: 760px)").matches;
  const MAX_LIVE = () => small() ? 8 : 14; // stay under browser WebGL context limits
  const PAR = () => small() ? 1 : 2; // concurrent loads
  let libP = null, busy = 0;
  const dead = false;
  const queue = [], live = new Set();

  const capable = () => true;
  const supports = el => !!(RACE_ID[el.dataset.race] && GEAR[el.dataset.cls]);
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
    // leave a still of this model's own 3D render in place, so a released viewer never blanks or re-shimmers
    if (s.still) { let img = el.querySelector(".m3d-still"); if (!img) { img = document.createElement("img"); img.className = "m3d-still"; img.alt = ""; img.decoding = "async"; el.append(img); } img.src = s.still; }
    try { s.viewer && s.viewer.renderer && s.viewer.renderer.destroy(); } catch (e) {}
    s.box.remove(); el.classList.remove("live", "loading", "no3d"); if (el.querySelector(".m3d-still")) el.classList.add("still");
  }
  function sweep() { live.forEach(el => { if (!el.isConnected) teardown(el); }); for (let i = queue.length; i--;) if (!queue[i].isConnected) queue.splice(i, 1); }

  function want(el) { if (!queue.includes(el) && !(el._m3d && el._m3d.sig === sig(el))) queue.push(el); pump(); }

  async function pump() {
    if (busy >= PAR()) return;
    sweep();
    const next = queue.find(el => el._vis);
    if (!next) return;
    if (live.size >= MAX_LIVE()) {
      // release the offscreen viewer farthest from the viewport
      const mid = innerHeight / 2, far = [...live].filter(el => !el._vis && !el.classList.contains("loading")).sort((a, b) => Math.abs(b.getBoundingClientRect().top - mid) - Math.abs(a.getBoundingClientRect().top - mid))[0];
      if (!far) return;
      teardown(far); if (far.querySelector(".m3d-still")) far.classList.add("still");
    }
    queue.splice(queue.indexOf(next), 1);
    busy++; pump();
    try { await load(next); } finally { busy--; }
    pump();
  }

  async function load(el) {
    teardown(el);
    const mySig = sig(el), box = document.createElement("div"), id = "m3d" + Math.random().toString(36).slice(2, 8);
    box.className = "m3d"; box.id = id; el.append(box); el.classList.add("loading");
    const me = el._m3d = { box, viewer: null, sig: mySig }; live.add(el);
    let stage = "lib";
    try {
      const { generateModels } = await timeout(lib(), 20000, "viewer");
      stage = "model";
      if (el._m3d !== me) return;
      const r = RACE_ID[el.dataset.race];
      const ch = { race: r, gender: +(el.dataset.gender || 0), ...(LOOK[r] || { skin: 1, face: 1, hairStyle: 1, hairColor: 1, facialStyle: 1 }), items: GEAR[el.dataset.cls] };
      // canvas matches the container's own fixed px box exactly, so nothing stretches or resizes later
      const asp = el.clientWidth && el.clientHeight ? el.clientWidth / el.clientHeight : 0.75;
      const v = await timeout(generateModels(asp, "#" + id, ch), 20000, "model");
      if (el._m3d !== me) { try { v.renderer.destroy(); } catch (e) {} return; }
      me.viewer = v;
      // render only while on screen; when it scrolls away draw one last frame, keep a still of it, then freeze
      const Rr = v.renderer, draw = Rr.draw;
      const fr = FRAME[r] || [1, 0];
      me.fit = 0;
      Rr.draw = function (t) {
        const refit = Rr.doUpdateBounds;
        if (me.paused && !me.snap && !refit) return;
        draw.call(this, t);
        // the viewer re-fits its camera whenever bounds change; re-apply our framing in the same frame so it never jumps
        if (refit && !Rr.doUpdateBounds) { try { Rr.distance *= fr[0] * FRAME_K * (window.BBCC_FRAME_X || 1); Rr.zenith = Math.PI / 2; if (fr[1]) Rr.target[2] += fr[1] * Rr.distance; Rr.updateCamera(); } catch (e) {} me.fit = Date.now(); }
        if (me.snap) { me.snap = false; try { const c = Rr.canvas && (Rr.canvas[0] || Rr.canvas); const u = c.toDataURL("image/webp", 0.82); if (u.length > 3000) me.still = u; } catch (e) {} }
      };
      const cv = box.querySelector("canvas");
      cv && cv.addEventListener("webglcontextlost", ev => { ev.preventDefault(); if (el._m3d !== me) return; console.warn("3D context lost; rebuilding"); teardown(el); setTimeout(() => el.isConnected && want(el), 1000); });
      const t0 = Date.now();
      await new Promise((res, rej) => { const t = setInterval(() => { const R = v.renderer; if (el._m3d !== me) { clearInterval(t); res(); } else if (R && R.actors && R.actors[0] && R.distance && me.fit && Date.now() - me.fit > 700) { clearInterval(t); res(); } else if (Date.now() - t0 > 25000) { clearInterval(t); rej(new Error("model timeout")); } }, 150); });
      if (el._m3d !== me) return;
      el._try = 0; el.classList.remove("loading", "still"); el.classList.add("live");
      if (el._vis === false) { me.snap = true; me.paused = true; }
    } catch (e) {
      console.warn("3D model unavailable:", e.message);
      teardown(el);
      if (stage === "lib") libP = null;
      // retry with backoff; the shimmer stays up meanwhile
      el._try = (el._try || 0) + 1;
      clearTimeout(el._retry); el._retry = setTimeout(() => { if (el.isConnected && el._vis !== false) want(el); }, Math.min(30000, 1500 * 2 ** Math.min(el._try, 5)));
    }
  }

  const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => {
    const el = e.target; el._vis = e.isIntersecting;
    const m = el._m3d; if (m) { if (!e.isIntersecting && !m.paused && m.viewer) m.snap = true; m.paused = !e.isIntersecting; } // freeze offscreen
    if (e.isIntersecting) want(el);
    else { const i = queue.indexOf(el); if (i > -1) queue.splice(i, 1); }
  }), { rootMargin: "300px 0px" }) : null;

  function observe(root = document) {
    sweep();
    if (!io) { root.querySelectorAll(".av[data-cls]").forEach(el => { el._vis = true; want(el); }); return; }
    root.querySelectorAll(".av[data-cls]").forEach(el => {
      if (!supports(el)) return;
      if (!el._obs) { el._obs = 1; io.observe(el); }
    });
  }
  // avatar's class/race changed in place (War Room): swap the model if it's on screen
  function refresh(el) {
    if (el._m3d && el._m3d.sig === sig(el)) return;
    teardown(el);
    const st = el.querySelector(".m3d-still"); if (st) st.remove(); el.classList.remove("still");
    if (!supports(el)) return;
    if (!io) { el._vis = true; want(el); return; }
    if (!el._obs) { el._obs = 1; io.observe(el); return; }
    if (el._vis) want(el);
  }
  return { observe, refresh, capable, _state: () => ({ live: live.size, queue: queue.length, dead, busy }) };
})();
