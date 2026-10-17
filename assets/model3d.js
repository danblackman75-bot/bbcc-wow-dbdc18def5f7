/* BBCC 3D characters (Wowhead ZamModelViewer via wow-model-viewer, ISC), loaded through BBCC_CONFIG.MODEL_PROXY.
   Every .av[data-cls] avatar is an in-game 3D model. A soft shimmer shows until it's up; only if 3D can't load after a
   bounded load attempt (or the race has no model) does it show a text fallback.
   Phones: each model renders once, is frozen into a still of its own 3D render, then its WebGL context is released.
   One live context at most, and nothing keeps drawing afterwards.
   Desktop: models stay live while on screen. Offscreen viewers stop requesting frames entirely (no idle rAF); past the
   context cap the farthest one is released and leaves its still in place. */
window.M3D = (() => {
  const C = window.BBCC_CONFIG || {},
    BASE = (C.MODEL_PROXY || "").replace(/\/$/, "");
  const RACE_ID = {
    Human: 1,
    Orc: 2,
    Dwarf: 3,
    "Night Elf": 4,
    Undead: 5,
    Tauren: 6,
    Gnome: 7,
    Troll: 8,
  };
  // [viewer slot, retail ItemDisplayInfoID]; vanilla T2 (T1 Bloodfang/Netherwind/Dragonstalker/Ten Storms = T2 sets of those classes) + BWL/MC weapons
  const GEAR = {
    warrior: [
      [9, 33982],
      [5, 33983],
      [10, 33984],
      [1, 34215],
      [7, 33986],
      [3, 34253],
      [8, 33989],
      [6, 33990],
      [21, 30606],
      [22, 31852],
    ],
    priest: [
      [6, 34053],
      [9, 34052],
      [8, 34055],
      [1, 34233],
      [10, 34051],
      [7, 34049],
      [3, 34048],
      [21, 675577],
      [20, 34047],
    ],
    paladin: [
      [6, 33633],
      [9, 33634],
      [5, 33635],
      [1, 45888],
      [10, 33636],
      [7, 33637],
      [8, 33639],
      [3, 33680],
      [21, 675214],
      [22, 29702],
    ],
    druid: [
      [6, 30541],
      [8, 30542],
      [9, 30548],
      [5, 30536],
      [1, 178176],
      [10, 34016],
      [7, 30540],
      [3, 30546],
      [21, 32162],
    ],
    warlock: [
      [6, 34011],
      [8, 674855],
      [9, 34012],
      [10, 34013],
      [7, 7939],
      [1, 34369],
      [3, 34022],
      [21, 184656],
      [20, 674853],
    ],
    rogue: [
      [6, 31110],
      [8, 31111],
      [9, 31127],
      [5, 33650],
      [10, 32815],
      [1, 33743],
      [7, 31115],
      [3, 32813],
      [21, 33615],
      [22, 22366],
    ],
    mage: [
      [6, 34046],
      [9, 34045],
      [8, 34044],
      [1, 188836],
      [3, 34058],
      [10, 34041],
      [7, 34039],
      [5, 34038],
      [21, 31960],
    ],
    hunter: [
      [6, 33665],
      [9, 33666],
      [5, 33667],
      [10, 33668],
      [8, 34269],
      [1, 34367],
      [7, 33672],
      [3, 34091],
      [21, 682296],
      [26, 733457],
    ],
    shaman: [
      [6, 34078],
      [9, 34079],
      [5, 34081],
      [3, 34067],
      [10, 34082],
      [8, 34083],
      [1, 34217],
      [7, 34084],
      [21, 675214],
      [22, 29702],
    ],
  };
  const LOOK = {
    1: { skin: 2, face: 1, hairStyle: 3, hairColor: 2, facialStyle: 2 },
    3: { skin: 2, face: 1, hairStyle: 3, hairColor: 2, facialStyle: 4 },
    4: { skin: 2, face: 1, hairStyle: 2, hairColor: 3, facialStyle: 1 },
    7: { skin: 1, face: 1, hairStyle: 2, hairColor: 4, facialStyle: 1 },
  };
  // camera framing per race: [distance multiplier, vertical aim offset as a fraction of distance]; keeps the full body in frame
  const FRAME = {
    1: [1.22, 0],
    2: [1.22, 0],
    3: [1.22, 0],
    4: [1.22, 0],
    5: [1.22, 0],
    6: [1.22, 0],
    7: [1.22, 0],
    8: [1.22, 0],
  };
  const FRAME_K = window.BBCC_FRAME_K || 1;
  const PHONE = matchMedia("(pointer: coarse), (max-width: 899px)").matches;
  const CALM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const GL = (() => {
    try {
      return !!window.WebGLRenderingContext;
    } catch (e) {
      return false;
    }
  })();
  const MAX_TRY = 1;
  const small = () => matchMedia("(max-width: 760px)").matches;
  const MAX_LIVE = () => (PHONE ? 1 : 6);
  const PAR = () => (PHONE || small() ? 1 : 2); // concurrent loads
  const STILLS = new Map(); // sig|WxH -> still blob URL, reused when a card re-renders
  const sig = (el) =>
    el.dataset.cls + "|" + el.dataset.race + "|" + (el.dataset.gender || 0);
  const skey = (el) => sig(el) + "|" + el.clientWidth + "x" + el.clientHeight;
  const supports = (el) => !!(RACE_ID[el.dataset.race] && GEAR[el.dataset.cls]);
  const script = (src) =>
    new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = res;
      s.onerror = () => rej(new Error("load " + src));
      document.head.append(s);
    });
  const timeout = (p, ms, what) =>
    Promise.race([
      p,
      new Promise((_, rej) =>
        setTimeout(() => rej(new Error(what + " timeout")), ms),
      ),
    ]);
  let libP = null,
    busy = 0,
    pumpT = 0,
    scrollAt = 0;
  const queue = [],
    live = new Set();

  /* ---------- frame gate ----------
     A frame requested while a viewer's draw was running belongs to that viewer. When that viewer is idle (offscreen,
     held still, or torn down) the frame is parked instead of run, so a frozen viewer costs zero rAF work. Waking the
     viewer re-arms whatever was parked. Works whether the viewer schedules its next frame inside draw or around it. */
  const raf0 = window.requestAnimationFrame.bind(window),
    caf0 = window.cancelAnimationFrame.bind(window);
  const tokens = new Map();
  let RUN = null,
    seq = 0;
  const idle = (me) => me.dead || (me.ready && me.paused && !me.snap);
  function arm(tk) {
    tk.raw = raf0((t) => fire(tk, t));
  }
  function fire(tk, t) {
    if (tk.off) return;
    const me = tk.from && tk.from.owner;
    if (me && idle(me)) {
      if (me.dead) tokens.delete(tk.key);
      else me.parked.push(tk);
      return;
    }
    tokens.delete(tk.key);
    tk.from = null; // only the owner is needed from here on; don't chain every past frame
    const prev = RUN;
    RUN = tk;
    try {
      tk.cb(t);
    } finally {
      RUN = prev;
    }
  }
  window.requestAnimationFrame = (cb) => {
    const tk = { cb, from: RUN, key: ++seq };
    tokens.set(tk.key, tk);
    arm(tk);
    return tk.key;
  };
  window.cancelAnimationFrame = (id) => {
    const tk = tokens.get(id);
    if (!tk) return;
    tk.off = true;
    tokens.delete(id);
    caf0(tk.raw);
  };
  function wake(me) {
    if (me.dead || idle(me)) return;
    const p = me.parked.splice(0);
    if (p.length) p.forEach(arm);
    else if (me.broke) {
      me.broke = false;
      requestAnimationFrame((t) => me.R && me.R.draw(t));
    }
  }
  const snapNow = (me) => {
    me.snap = true;
    wake(me);
  };
  if (PHONE)
    addEventListener(
      "scroll",
      () => {
        scrollAt = performance.now();
      },
      { passive: true },
    );

  function lib() {
    if (!libP)
      libP = (async () => {
        // tag each canvas with its WebGL context (so phones can release it); phones also keep the buffer readable for stills
        const gc = HTMLCanvasElement.prototype.getContext;
        if (!gc._bbcc) {
          HTMLCanvasElement.prototype.getContext = function (type, attrs) {
            const gl = /webgl/.test(type);
            const ctx = gc.call(this, type, attrs);
            if (gl && ctx) this.__gl = ctx;
            return ctx;
          };
          HTMLCanvasElement.prototype.getContext._bbcc = 1;
        }
        window.CONTENT_PATH = BASE + "/modelviewer/live/";
        window.WOTLK_TO_RETAIL_DISPLAY_ID_API = undefined;
        if (!window.jQuery) await script("assets/wmv/jquery.min.js");
        // the site owns the global $, so run Zam's viewer with $ bound to jQuery
        const src = await fetch(
          BASE + "/modelviewer/live/viewer/viewer.min.js",
        ).then((r) => {
          if (!r.ok) throw new Error("viewer " + r.status);
          return r.text();
        });
        const url = URL.createObjectURL(
          new Blob(["(function($){" + src + "\n})(window.jQuery);"], {
            type: "text/javascript",
          }),
        );
        await script(url);
        URL.revokeObjectURL(url);
        if (!window.ZamModelViewer) throw new Error("viewer missing");
        return import("./wmv/index.js");
      })();
    return libP;
  }

  /* ---------- stills + class card ---------- */
  // swap in a still only once it's decoded, so the avatar never blinks empty between two images
  function putStill(el, url) {
    el._stillUrl = url;
    const cur = el.querySelector(".m3d-still");
    if (cur && cur.getAttribute("src") === url) {
      el.classList.add("still");
      return;
    }
    const img = new Image();
    img.className = "m3d-still";
    img.alt = "";
    img.src = url;
    const swap = () => {
      if (el._stillUrl !== url) return;
      const c = el.querySelector(".m3d-still");
      c ? c.replaceWith(img) : el.append(img);
      el.classList.add("still");
      dropCard(el);
    };
    (img.decode ? img.decode() : Promise.resolve()).then(swap, swap);
  }
  function clearStill(el) {
    el._stillUrl = null;
    const s = el.querySelector(".m3d-still");
    if (s) s.remove();
    el.classList.remove("still");
  }
  function card(el) {
    clearTimeout(el._retry);
    el.classList.remove("loading");
    el.classList.add("no3d");
    if (el.querySelector(".m3d-card")) return;
    const c = typeof cls === "function" ? cls(el.dataset.cls) || {} : {},
      d = document.createElement("span");
    d.className = "m3d-card";
    d.innerHTML = `<b></b><small></small>`;
    d.children[0].textContent = el.dataset.race + " " + (c.name || "");
    d.children[1].textContent = supports(el)
      ? "3D preview unavailable."
      : "No 3D preview for this race.";
    el.setAttribute(
      "aria-label",
      d.children[0].textContent + ". " + d.children[1].textContent,
    );
    if (supports(el) && !el.closest("button, a, .slot")) {
      el.setAttribute("role", "group");
      const retry = document.createElement("button");
      retry.className = "model-retry";
      retry.textContent = "Retry 3D";
      retry.onclick = () => {
        libP = null;
        refresh(el);
      };
      d.append(retry);
    }
    el.append(d);
  }
  function dropCard(el) {
    const d = el.querySelector(".m3d-card");
    if (d) d.remove();
    el.classList.remove("no3d");
    el.setAttribute("role", "img");
  }

  // composite the viewer's canvas onto the card background and keep it as a still (encoded off the main thread)
  function grab(el, me) {
    const R = me.R,
      c = R && R.canvas && (R.canvas[0] || R.canvas);
    if (!c || !c.width) return done(me);
    // the viewer's pixels are premultiplied with near-zero alpha, so a raw export goes transparent: paint an opaque
    // copy of the card background first, and only accept a lit frame (textures stream in after the mesh, which
    // first renders as a dark silhouette)
    const W = c.width,
      H = c.height,
      k = document.createElement("canvas");
    k.width = W;
    k.height = H;
    const g = k.getContext("2d");
    const lg = g.createLinearGradient(0, 0, 0, H);
    lg.addColorStop(0, "#0c0d12");
    lg.addColorStop(1, "#181410");
    g.fillStyle = lg;
    g.fillRect(0, 0, W, H);
    const cc =
        getComputedStyle(el).getPropertyValue("--cc").trim() || "#888888",
      rg = g.createRadialGradient(
        W / 2,
        H * 0.65,
        0,
        W / 2,
        H * 0.65,
        Math.max(W, H) * 0.6,
      );
    rg.addColorStop(0, cc + "26");
    rg.addColorStop(1, cc + "00");
    g.fillStyle = rg;
    g.fillRect(0, 0, W, H);
    g.drawImage(c, 0, 0);
    const t2 = document.createElement("canvas");
    t2.width = t2.height = 32;
    const g2 = t2.getContext("2d");
    g2.drawImage(k, 0, 0, 32, 32);
    const d = g2.getImageData(0, 0, 32, 32).data;
    let br = 0;
    for (let q = 0; q < d.length; q += 4)
      if (d[q] * 0.3 + d[q + 1] * 0.59 + d[q + 2] * 0.11 > 55) br++;
    const lit = br / 1024 > 0.05;
    if (!lit && (me.tries = (me.tries || 0) + 1) <= 14) {
      setTimeout(() => {
        if (el._m3d === me) snapNow(me);
      }, 600);
      return;
    }
    if (!lit) return done(me);
    k.toBlob(
      (b) => {
        if (!me.dead && b && b.size > 2000) {
          me.still = URL.createObjectURL(b);
          const old = STILLS.get(me.skey);
          if (old) URL.revokeObjectURL(old);
          STILLS.set(me.skey, me.still);
          if (STILLS.size > 48) {
            const key = STILLS.keys().next().value;
            URL.revokeObjectURL(STILLS.get(key));
            STILLS.delete(key);
          }
        }
        done(me);
      },
      "image/jpeg",
      0.86,
    );
  }
  function done(me) {
    me.snapped = true;
    const f = me.onSnap;
    me.onSnap = null;
    f && f();
  }

  /* ---------- lifecycle ---------- */
  function release(me) {
    if (me.dead) return;
    me.dead = true;
    clearTimeout(me.deadline);
    done(me);
    me.parked.splice(0).forEach((tk) => tokens.delete(tk.key));
    const R = me.R;
    if (!PHONE) {
      try {
        R && R.destroy();
      } catch (e) {}
      return;
    }
    // phones: stop drawing, then drop the WebGL context of this viewer's own canvas once it's out of the DOM.
    // (renderer.destroy() also tears down data other viewers still share, so it isn't used here.)
    try {
      if (R) R.draw = () => {};
    } catch (e) {}
    const cvs = [...me.box.querySelectorAll("canvas")].filter((cv) => cv.__gl);
    setTimeout(
      () =>
        cvs.forEach((cv) => {
          try {
            const gl = cv.__gl;
            if (!cv.isConnected && gl && !gl.isContextLost()) {
              const x = gl.getExtension("WEBGL_lose_context");
              x && x.loseContext();
            }
          } catch (e) {}
        }),
      0,
    );
  }
  function teardown(el, keepStill = true) {
    const s = el._m3d;
    if (!s) return;
    el._m3d = null;
    live.delete(el);
    // leave a still of this model's own 3D render in place, so a released viewer never blanks or re-shimmers
    if (keepStill && s.still) putStill(el, s.still);
    release(s);
    s.box.remove();
    el.classList.remove("live", "loading");
  }
  function sweep() {
    live.forEach((el) => {
      if (!el.isConnected) {
        io?.unobserve(el);
        teardown(el);
      }
    });
    for (let i = queue.length; i--;)
      if (!queue[i].isConnected) {
        io?.unobserve(queue[i]);
        queue.splice(i, 1);
      }
  }

  function want(el) {
    if (el.classList.contains("no3d")) return;
    if (PHONE && !el._m3d) {
      const u = STILLS.get(skey(el));
      if (u) {
        putStill(el, u);
        return;
      }
    }
    if (!queue.includes(el) && !(el._m3d && el._m3d.sig === sig(el)))
      queue.push(el);
    pump();
  }

  async function pump() {
    if (busy >= PAR()) return;
    // phones: don't start parsing a model mid-fling
    if (PHONE) {
      const w = 220 - (performance.now() - scrollAt);
      if (w > 0) {
        clearTimeout(pumpT);
        pumpT = setTimeout(pump, w);
        return;
      }
    }
    sweep();
    const inView = (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
    };
    const next =
      queue.find((el) => el._vis && inView(el)) || queue.find((el) => el._vis);
    if (!next) return;
    if (live.size >= MAX_LIVE()) {
      // release the offscreen viewer farthest from the viewport
      const mid = innerHeight / 2,
        far = [...live]
          .filter(
            (el) =>
              (!el._vis || (inView(next) && !inView(el))) &&
              el._m3d &&
              el._m3d.ready,
          )
          .sort(
            (a, b) =>
              Math.abs(b.getBoundingClientRect().top - mid) -
              Math.abs(a.getBoundingClientRect().top - mid),
          )[0];
      if (!far) return;
      teardown(far);
    }
    queue.splice(queue.indexOf(next), 1);
    busy++;
    pump();
    try {
      await load(next);
    } finally {
      busy--;
    }
    pump();
  }

  async function load(el) {
    teardown(el, false);
    const mySig = sig(el),
      box = document.createElement("div"),
      id = "m3d" + Math.random().toString(36).slice(2, 8);
    box.className = "m3d";
    box.id = id;
    el.append(box);
    el.classList.add("loading");
    const me = (el._m3d = {
      box,
      sig: mySig,
      parked: [],
      paused: el._vis === false,
    });
    live.add(el);
    me.deadline = setTimeout(() => {
      if (el._m3d === me && !me.ready) {
        teardown(el, false);
        card(el);
      }
    }, 25000);
    let stage = "lib";
    try {
      const { generateModels } = await timeout(lib(), 20000, "viewer");
      stage = "model";
      if (el._m3d !== me) return;
      const r = RACE_ID[el.dataset.race];
      const ch = {
        race: r,
        gender: +(el.dataset.gender || 0),
        ...(LOOK[r] || {
          skin: 1,
          face: 1,
          hairStyle: 1,
          hairColor: 1,
          facialStyle: 1,
        }),
        items: GEAR[el.dataset.cls],
      };
      // canvas matches the container's own fixed px box exactly, so nothing stretches or resizes later
      const asp =
        el.clientWidth && el.clientHeight
          ? el.clientWidth / el.clientHeight
          : 0.75;
      const task = generateModels(asp, "#" + id, ch);
      task.then(
        (v) => {
          if (me.dead || el._m3d !== me) {
            try {
              v.renderer.destroy();
            } catch (e) {}
          }
        },
        () => {},
      );
      const v = await timeout(task, 12000, "model");
      me.R = v.renderer;
      if (el._m3d !== me) {
        release(me);
        return;
      }
      me.skey = skey(el);
      const Rr = v.renderer,
        draw = Rr.draw,
        fr = FRAME[r] || [1, 0],
        gearSpace = el.dataset.cls === "warlock" ? 1.14 : 1;
      me.fit = 0;
      Rr.draw = function (t) {
        if (RUN) RUN.owner = me;
        const refit = Rr.doUpdateBounds;
        if (Object.keys(Rr.downloads || {}).length) me.dlAt = Date.now();
        if (me.paused && !me.snap && !refit) {
          me.broke = true;
          return;
        }
        draw.call(this, t);
        // the viewer re-fits its camera whenever bounds change; re-apply our framing in the same frame so it never jumps
        if (refit && !Rr.doUpdateBounds) {
          try {
            Rr.distance *= fr[0] * gearSpace * FRAME_K * (window.BBCC_FRAME_X || 1);
            Rr.zenith = Math.PI / 2;
            if (fr[1]) Rr.target[2] += fr[1] * Rr.distance;
            Rr.updateCamera();
          } catch (e) {}
          me.fit = Date.now();
        }
        // read the canvas right after this frame's draw, while its buffer is still valid
        if (me.snap && !me.snapReq) {
          me.snapReq = true;
          queueMicrotask(() => {
            me.snapReq = false;
            me.snap = false;
            if (el._m3d !== me) return done(me);
            try {
              grab(el, me);
            } catch (e) {
              done(me);
            }
          });
        }
      };
      const cv = box.querySelector("canvas");
      cv &&
        cv.addEventListener("webglcontextlost", (ev) => {
          if (el._m3d !== me) return;
          ev.preventDefault();
          teardown(el);
          setTimeout(() => el.isConnected && want(el), 1000);
        });
      // settle: mesh fitted and (on phones) textures done streaming
      const t0 = Date.now();
      await new Promise((res, rej) => {
        const t = setInterval(() => {
          const R = v.renderer;
          if (el._m3d !== me) {
            clearInterval(t);
            res();
          } else if (
            R &&
            R.actors &&
            R.actors[0] &&
            R.distance &&
            me.fit &&
            Date.now() - me.fit > 700 &&
            (!PHONE || Date.now() - (me.dlAt || me.fit) > 1500)
          ) {
            clearInterval(t);
            res();
          } else if (Date.now() - t0 > 25000) {
            clearInterval(t);
            rej(new Error("model timeout"));
          }
        }, 150);
      });
      if (el._m3d !== me) return;
      el._try = 0;
      if (PHONE) {
        // render once, keep the still, free the context
        me.ready = true;
        me.paused = false;
        el.classList.remove("loading");
        el.classList.add("live");
        await new Promise((res) => {
          me.onSnap = res;
          snapNow(me);
          setTimeout(() => done(me), 12000);
        });
        if (el._m3d !== me) return;
        if (me.still) teardown(el);
        else {
          teardown(el, false);
          card(el);
        }
        return;
      }
      if (CALM)
        try {
          v.setAnimPaused(true);
        } catch (e) {}
      clearTimeout(me.deadline);
      me.ready = true;
      me.hold = CALM;
      me.paused = el._vis === false || me.hold;
      el.classList.remove("loading", "still");
      el.classList.add("live");
      snapNow(me); // one still for the cache, so a rebuilt card shows its model instantly
    } catch (e) {
      if (el._m3d !== me) return;
      teardown(el, false);
      if (stage === "lib") libP = null;
      el._try = (el._try || 0) + 1;
      if (el._try >= MAX_TRY) {
        if (!el.querySelector(".m3d-still")) card(el);
        return;
      }
      // retry with backoff while it's on screen; the shimmer stays up meanwhile
      clearTimeout(el._retry);
      el._retry = setTimeout(
        () => {
          if (el.isConnected && el._vis !== false) want(el);
        },
        1500 * 2 ** el._try,
      );
    }
  }

  const io =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (es) =>
            es.forEach((e) => {
              const el = e.target;
              el._vis = e.isIntersecting;
              const m = el._m3d;
              if (m) {
                m.paused = !e.isIntersecting || !!m.hold;
                wake(m);
              }
              if (e.isIntersecting) want(el);
              else {
                const i = queue.indexOf(el);
                if (i > -1) queue.splice(i, 1);
                pump();
              }
            }),
          { rootMargin: "300px 0px" },
        )
      : null;

  function track(el) {
    if (!supports(el) || !GL) {
      card(el);
      return;
    }
    // a card re-rendered with a model we've already drawn shows it at once, no shimmer
    if (STILLS.size) {
      const u = STILLS.get(skey(el));
      if (u) putStill(el, u);
    }
    if (!io) {
      el._vis = true;
      want(el);
      return;
    }
    if (!el._obs) {
      el._obs = 1;
      io.observe(el);
    } else if (el._vis) want(el);
  }
  function observe(root = document) {
    sweep();
    root.querySelectorAll(".av[data-cls]").forEach((el) => {
      if (!el._obs) track(el);
    });
  }
  // avatar's class/race changed in place (War Room): swap the model
  function refresh(el) {
    if (el._m3d && el._m3d.sig === sig(el)) return;
    teardown(el, false);
    el._try = 0;
    clearTimeout(el._retry);
    dropCard(el);
    const u = supports(el) && STILLS.get(skey(el));
    if (!u) clearStill(el);
    track(el);
    if (el._vis && !el.classList.contains("no3d")) want(el);
  }
  return {
    observe,
    refresh,
    capable: () => GL,
    _state: () => ({
      phone: PHONE,
      stills: STILLS.size,
      live: live.size,
      queue: queue.length,
      busy,
      frames: tokens.size,
    }),
  };
})();
