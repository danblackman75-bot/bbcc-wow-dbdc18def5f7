/* BBCC optional 3D viewer (Wowhead ZamModelViewer via wow-model-viewer, ISC). Progressive enhancement over SVG figures.
   Enabled only when BBCC_CONFIG.MODEL_PROXY is set (a same-path proxy for wow.zamimg.com /modelviewer/*). One live viewer at a time. */
window.M3D = (() => {
  const C = window.BBCC_CONFIG || {}, BASE = (C.MODEL_PROXY || "").replace(/\/$/, "");
  const RACE_ID = { "Human": 1, "Orc": 2, "Dwarf": 3, "Night Elf": 4, "Undead": 5, "Tauren": 6, "Gnome": 7, "Troll": 8 };
  // [viewer slot, retail ItemDisplayInfoID]; vanilla T2 (T1 Bloodfang/Netherwind/Dragonstalker/Ten Storms = T2 sets of those classes) + BWL/MC weapons
  const GEAR = {"warrior": [[9, 33982], [5, 33983], [10, 33984], [1, 34215], [7, 33986], [3, 34253], [8, 33989], [6, 33990], [21, 30606], [22, 31852]], "priest": [[6, 34053], [9, 34052], [8, 34055], [1, 34233], [10, 34051], [7, 34049], [3, 34048], [21, 675577], [20, 34047]], "paladin": [[6, 33633], [9, 33634], [5, 33635], [1, 45888], [10, 33636], [7, 33637], [8, 33639], [3, 33680], [21, 675214], [22, 29702]], "druid": [[6, 30541], [8, 30542], [9, 30548], [5, 30536], [1, 178176], [10, 34016], [7, 30540], [3, 30546], [21, 32162]], "warlock": [[6, 34011], [8, 674855], [9, 34012], [10, 34013], [7, 7939], [1, 34369], [3, 34022], [21, 184656], [20, 674853]], "rogue": [[6, 31110], [8, 31111], [9, 31127], [5, 33650], [10, 32815], [1, 33743], [7, 31115], [3, 32813], [21, 33615], [22, 22366]], "mage": [[6, 34046], [9, 34045], [8, 34044], [1, 188836], [3, 34058], [10, 34041], [7, 34039], [5, 34038], [21, 31960]], "hunter": [[6, 33665], [9, 33666], [5, 33667], [10, 33668], [8, 34269], [1, 34367], [7, 33672], [3, 34091], [21, 682296], [26, 733457]], "shaman": [[6, 34078], [9, 34079], [5, 34081], [3, 34067], [10, 34082], [8, 34083], [1, 34217], [7, 34084], [21, 675214], [22, 29702]]};
  const LOOK = { 1: { skin: 2, face: 1, hairStyle: 3, hairColor: 2, facialStyle: 2 }, 3: { skin: 2, face: 1, hairStyle: 3, hairColor: 2, facialStyle: 4 }, 4: { skin: 2, face: 1, hairStyle: 2, hairColor: 3, facialStyle: 1 }, 7: { skin: 1, face: 1, hairStyle: 2, hairColor: 4, facialStyle: 1 } };
  let active = null, libP = null, failed = false;
  function capable() {
    if (!BASE || failed) return false;
    const n = navigator; if (n.connection && n.connection.saveData) return false;
    if ((n.deviceMemory && n.deviceMemory < 3) || (n.hardwareConcurrency && n.hardwareConcurrency < 4)) return false;
    try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; }
  }
  const supports = (cls, race) => !!(RACE_ID[race] && GEAR[cls]);
  const script = src => new Promise((ok, no) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => no(new Error("load " + src)); document.head.append(s); });
  function lib() {
    if (!libP) libP = (async () => {
      window.CONTENT_PATH = BASE + "/modelviewer/live/"; window.WOTLK_TO_RETAIL_DISPLAY_ID_API = undefined;
      if (!window.jQuery) await script("assets/wmv/jquery.min.js");
      // site defines its own global const \$, so run Zam's viewer with \$ bound to jQuery
      const src = await fetch(BASE + "/modelviewer/live/viewer/viewer.min.js").then(r => { if (!r.ok) throw new Error("viewer " + r.status); return r.text(); });
      const url = URL.createObjectURL(new Blob(["(function($){" + src + "\n})(window.jQuery);"], { type: "text/javascript" }));
      await script(url); URL.revokeObjectURL(url);
      if (!window.ZamModelViewer) throw new Error("viewer missing");
      return import("./wmv/index.js");
    })();
    libP.catch(() => { libP = null; });
    return libP;
  }
  function stop() {
    if (!active) return; const a = active; active = null;
    try { a.viewer && a.viewer.renderer && a.viewer.renderer.destroy(); } catch (e) {}
    a.box.remove(); a.wrap.classList.remove("is3d");
    const b = a.wrap.querySelector(".b3d"); if (b) b.textContent = "⚔ 3D";
  }
  async function start(wrap) {
    const cls = wrap.dataset.cls, race = wrap.dataset.race, key = wrap.dataset.key || "";
    stop();
    const fig = wrap.querySelector(".fig"), box = document.createElement("div"), id = "m3d" + Math.random().toString(36).slice(2, 8);
    box.className = "m3d loading"; box.id = id; box.innerHTML = '<span class="m3d-spin">Summoning…</span>';
    fig.after(box); wrap.classList.add("is3d");
    const me = active = { wrap, box, key, cls, race, viewer: null };
    const b = wrap.querySelector(".b3d"); if (b) b.textContent = "✕ 2D";
    try {
      const { generateModels } = await Promise.race([lib(), new Promise((_, n) => setTimeout(() => n(new Error("timeout")), 20000))]);
      if (active !== me) return;
      const r = RACE_ID[race], g = +(wrap.dataset.gender || 0);
      const ch = { race: r, gender: g, ...(LOOK[r] || { skin: 1, face: 1, hairStyle: 1, hairColor: 1, facialStyle: 1 }), items: GEAR[cls] };
      // Zam sizes the canvas as width / aspect; keep it in step with the CSS 3:4 box
      const v = await generateModels(0.75, "#" + id, ch);
      if (active !== me) { try { v.renderer.destroy(); } catch (e) {} return; }
      me.viewer = v;
      const t0 = Date.now();
      await new Promise((ok, no) => { const t = setInterval(() => { const R = v.renderer; if (R && R.actors && R.actors[0] && R.distance) { clearInterval(t); ok(); } else if (Date.now() - t0 > 25000) { clearInterval(t); no(new Error("model timeout")); } }, 150); });
      // frame: pull camera back a bit so helmets/shoulders never clip
      setTimeout(() => { try { if (active === me) { v.renderer.distance *= 1.45; v.setZenith && v.setZenith(Math.PI / 2 + 0.06); } } catch (e) {} }, 1200);
      box.classList.remove("loading"); const s = box.querySelector(".m3d-spin"); if (s) s.remove();
    } catch (e) {
      console.warn("3D viewer unavailable, using SVG:", e.message);
      if (active === me) stop();
      failed = true; document.querySelectorAll(".b3d").forEach(x => x.remove());
      if (window.toast) toast("3D viewer unavailable, showing the drawing");
    }
  }
  function bind(root = document) {
    if (!capable()) return;
    root.querySelectorAll(".figwrap[data-cls]").forEach(w => {
      if (w._m3d || !supports(w.dataset.cls, w.dataset.race)) return; w._m3d = 1;
      const b = document.createElement("button"); b.type = "button"; b.className = "b3d"; b.textContent = "⚔ 3D"; b.title = "Show the in-game 3D model";
      b.onclick = e => { e.preventDefault(); e.stopPropagation(); if (active && active.wrap === w) stop(); else start(w); };
      w.querySelector(".fig").after(b);
      // War Room re-renders on every change: if this figure replaces the active one (same member), swap model automatically
      if (active && w.dataset.key && active.key === w.dataset.key && !document.body.contains(active.wrap)) {
        if (active.cls === w.dataset.cls && active.race === w.dataset.race) { w.querySelector(".fig").after(active.box); w.classList.add("is3d"); active.wrap = w; b.textContent = "✕ 2D"; }
        else { active.box.remove(); active = null; start(w); }
      }
    });
    if (active && !document.body.contains(active.wrap)) { try { active.viewer && active.viewer.renderer.destroy(); } catch (e) {} active = null; }
  }
  return { bind, stop, capable };
})();
