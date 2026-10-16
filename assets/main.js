(async () => {
  const page = document.body.dataset.page, file = location.pathname.split("/").pop() || "index.html";
  shell(file || "index.html");
  try { await loadData(); } catch (e) { $("#page").innerHTML = `<div class="wrap panel">Couldn't load data files (${esc(e.message)}). Serve the site over http.</div>`; return; }
  P[page]($("#page")); stamp(); bindAvatars(); bindYT(); reveal(); wisp(page);
  setInterval(async () => { try { const l = await fetch("data/live.json?v=" + Date.now()).then(r => r.json()); if (l.updated !== BB.live.updated) { BB.live = l; stamp(); } } catch (e) {} }, 10 * 60e3);
})();
