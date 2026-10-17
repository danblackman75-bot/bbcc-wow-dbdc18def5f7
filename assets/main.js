(async () => {
  const page = document.body.dataset.page,
    file = location.pathname.split("/").pop() || "index.html";
  shell(file || "index.html");
  try {
    await loadData();
  } catch (e) {
    $("#page").innerHTML =
      `<div class="wrap panel">Couldn't load data files (${esc(e.message)}). Serve the site over http.</div>`;
    return;
  }
  P[page]($("#page"));
  if (page !== "home") {
    const title = $("#page .sec");
    if (title) {
      const h = document.createElement("h1");
      h.className = "sec";
      h.innerHTML = title.innerHTML;
      title.replaceWith(h);
    }
  }
  stamp();
  bindAvatars();
  bindYT();
  reveal();
  wisp(page);
  setInterval(async () => {
    try {
      const l = await fetch("data/live.json", { cache: "no-cache" }).then(
        (r) => {
          if (!r.ok) throw new Error("Feed unavailable");
          return r.json();
        },
      );
      if (
        l &&
        l.updated &&
        l.updated !== BB.live.updated &&
        !$("#feed-refresh")
      ) {
        const b = document.createElement("button");
        b.id = "feed-refresh";
        b.className = "btn feed-refresh";
        b.textContent = "New updates — refresh";
        b.onclick = () => location.reload();
        $("#page").prepend(b);
      }
    } catch (e) {}
  }, 10 * 60e3);
})();
