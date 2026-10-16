/* Danbot: wisp mascot. Canned multiple-choice links only. No chat, no API keys, no network calls. */
const DANBOT_SVG = `<svg viewBox="0 0 120 120" class="db-svg" aria-hidden="true"><defs><radialGradient id="dbw" cx="50%" cy="42%" r="55%"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#bff6ff"/><stop offset=".7" stop-color="#5fb8ff" stop-opacity=".55"/><stop offset="1" stop-color="#5fb8ff" stop-opacity="0"/></radialGradient></defs>
<circle cx="60" cy="60" r="56" fill="url(#dbw)" class="db-glow"/><circle cx="60" cy="56" r="20" fill="#f4feff" class="db-core"/>
<g class="db-spark" fill="#fff6c8"><path d="M24 30l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/><path d="M94 84l1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6z"/><circle cx="92" cy="30" r="2.4"/><circle cx="30" cy="88" r="1.8"/></g></svg>`;
const DB_LINES = {
  home: ["Launch is coming whether your healer is ready or not.", "The countdown ticks every second. So does my patience.", "Welcome to the war room. Snacks are BYO."],
  warroom: ["Need a healer? You definitely need a healer.", "Five slots, eight egos. Good luck.", "A Mage brings free water. Just saying."],
  roster: ["Eight heroes. Zero agreement on who tanks.", "Tap “Try in War Room” on anyone. I won't tell."],
  pvepvp: ["Normal ruleset, BG nights. Everybody wins.", "PvP ruleset means one faction per account. Choose wisely."],
  factions: ["Alliance won the vote. Horde voters know what they did.", "Olympus is Alliance PvP. Bring earplugs."],
  meta: ["Tier lists from a level-30 beta. Deep breaths, theorycrafters.", "Fury Warrior tops the raid sim. For now."],
  racials: ["Night Elves get Shadowmeld. I'm not hiding, I'm mysterious.", "Orc Blood Fury buffs spell power now too. Rude."],
  news: ["Fresh scrolls from Azeroth.", "Click a video. I'll wait."],
  streamers: ["Asmon went Alliance PvP. We could not.", "Pick a side. Any side."],
  guild: ["<Sam Squatch> has big-foot energy.", "Vote, then screenshot it to Discord."]
};
const DB_MENU = [
  ["🩹 Need a healer?", "Yes. The answer is always yes. Let's check the party.", "warroom.html#result"],
  ["⚔️ Show me the party", "Load a preset and watch the grades move.", "warroom.html"],
  ["⏳ When's launch?", () => { const d = Math.max(0, Math.ceil((new Date(C.LAUNCH_UTC) - Date.now()) / 864e5)); return `Nov 4, 3:00 PM PT / 6:00 PM ET. About ${d} days. Don't be late.`; }, "index.html#count"],
  ["🗳️ Pick a guild name", "<Sam Squatch> has big-foot energy. Just saying.", "guild.html"],
  ["🧬 Best racials?", "Orc and Human for PvE, Human and Undead for PvP.", "racials.html"],
  ["🚩 Alliance or Horde?", "The crew vote went Alliance. Horde voters know what they did.", "factions.html"]
];
function danbot(page) {
  const KEY = "bbcc-danbot", st = JSON.parse(localStorage.getItem(KEY) || '{"mute":false,"last":0,"seen":{}}');
  const save = () => localStorage.setItem(KEY, JSON.stringify(st));
  document.body.insertAdjacentHTML("beforeend", `<div id="danbot" class="db"><div class="db-bubble" role="status" hidden><button class="db-x" aria-label="Dismiss">×</button><span class="db-text"></span><div class="db-choices"></div><button class="db-mute">No more tips</button></div>
   <button class="db-av" aria-label="Wisp: tap for quick links" aria-expanded="false">${DANBOT_SVG}<span class="db-name">Wisp</span></button></div>`);
  const root = $("#danbot"), bub = $(".db-bubble", root), txt = $(".db-text", root), ch = $(".db-choices", root);
  let hideT;
  const show = (text, menu, ms) => { clearTimeout(hideT); txt.textContent = text; ch.innerHTML = menu || ""; bub.hidden = false; $(".db-av", root).setAttribute("aria-expanded", !!menu); if (ms) hideT = setTimeout(() => bub.hidden = true, ms); bindChoices(); };
  const menuHTML = () => DB_MENU.map((m, i) => `<button data-i="${i}">${esc(m[0])}</button>`).join("");
  function bindChoices() {
    $$("button[data-i]", ch).forEach(b => b.onclick = () => {
      const [label, ans, href] = DB_MENU[b.dataset.i]; const a = typeof ans === "function" ? ans() : ans;
      const here = location.pathname.endsWith(href.split("#")[0]) || (href.startsWith("index") && /\/$/.test(location.pathname));
      show(a, here ? "" : `<a class="btn" href="${href}">Take me there →</a>`, 12000);
      if (here && href.includes("#")) document.getElementById(href.split("#")[1])?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  $(".db-av", root).onclick = () => { if (!bub.hidden && ch.querySelector("button[data-i]")) { bub.hidden = true; return; } show("Hey hero. What do you need?", menuHTML()); };
  $(".db-x", root).onclick = () => { bub.hidden = true; st.seen[page] = Date.now(); save(); };
  $(".db-mute", root).onclick = () => { st.mute = true; bub.hidden = true; save(); toast("Tips off. Tap Wisp any time."); };
  const lines = DB_LINES[page] || DB_LINES.home;
  if (!st.mute && Date.now() - st.last > 90e3 && Date.now() - (st.seen[page] || 0) > 6 * 36e5) {
    setTimeout(() => { if (!bub.hidden) return; show(lines[Math.floor(Math.random() * lines.length)], "", 9000); st.last = Date.now(); st.seen[page] = Date.now(); save(); }, 5000);
  }
}
