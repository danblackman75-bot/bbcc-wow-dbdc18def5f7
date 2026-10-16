/* Danbot: original Night Elf mascot. Canned multiple-choice links only. No chat, no API keys, no network calls. */
const DANBOT_SVG = `<svg viewBox="0 0 120 140" class="db-svg" aria-hidden="true">
<g class="db-body"><path d="M28 140 q4-40 32-44 q28 4 32 44z" fill="#3b2a6b"/><path d="M44 104 q16 10 32 0 l-4 36 h-24z" fill="#e7c26b" opacity=".9"/><path d="M48 98 h24 l-12 14z" fill="#8a7bd1"/>
<g class="db-head"><g class="db-ear l"><path d="M34 54 L4 34 L38 66z" fill="#8a7bd1"/><path d="M30 54 L12 40 L34 60z" fill="#b6a8ff"/></g><g class="db-ear r"><path d="M86 54 L116 34 L82 66z" fill="#8a7bd1"/><path d="M90 54 L108 40 L86 60z" fill="#b6a8ff"/></g>
<path d="M30 48 q30-44 60 0 v40 q-8 10-14 4 v-30 h-32 v30 q-6 6-14-4z" fill="#2fd1c4"/>
<ellipse cx="60" cy="62" rx="24" ry="27" fill="#8a7bd1"/>
<path d="M36 50 q24-26 48 0 q-10-8-24-8 q-14 0-24 8z" fill="#2fd1c4"/><path d="M58 40 q-14 6-20 22 q10-14 24-16z" fill="#4ff0e2"/>
<path d="M44 74 l-4 4 M80 74 l4 4" stroke="#6d5fc0" stroke-width="2"/>
<g class="db-eyes"><g class="db-eye l"><ellipse cx="50" cy="62" rx="5.5" ry="6" fill="#e9fdff"/><circle cx="50" cy="62" r="2.6" fill="#38f2ff"/><circle cx="51.5" cy="60.5" r="1" fill="#fff"/></g>
<g class="db-eye r"><ellipse cx="70" cy="62" rx="5.5" ry="6" fill="#e9fdff"/><circle cx="70" cy="62" r="2.6" fill="#38f2ff"/><circle cx="71.5" cy="60.5" r="1" fill="#fff"/></g>
<path class="db-wink" d="M64 62 q6 4 12 0" stroke="#2a1d4d" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>
<path d="M44 54 q6-3 11 0 M65 54 q6-3 11 0" stroke="#2a1d4d" stroke-width="1.6" fill="none"/>
<path d="M53 76 q7 6 14 0" stroke="#5a2a4d" stroke-width="2" fill="#ff8fb4" stroke-linecap="round"/>
<ellipse cx="43" cy="72" rx="4" ry="2.2" fill="#ff8fd0" opacity=".45"/><ellipse cx="77" cy="72" rx="4" ry="2.2" fill="#ff8fd0" opacity=".45"/>
<path d="M60 30 l3 6 h6 l-5 4 2 6 -6-4 -6 4 2-6 -5-4 h6z" fill="#ffe08a" class="db-gem"/></g></g></svg>`;
const DB_LINES = {
  home: ["Launch is coming whether your healer is ready or not. 😉", "Psst. The countdown ticks every second. So does my patience.", "Welcome to the war room, hero. Snacks are BYO."],
  warroom: ["Need a healer? Because you definitely need a healer.", "Five slots, eight egos. Good luck. 💜", "Tip: a Mage brings free water. Just saying."],
  roster: ["I read every chat log. Every. Single. One. 👀", "Stated picks are gold. Suggestions are… my professional opinion."],
  pvepvp: ["Normal ruleset, BG nights. You're welcome. 😘", "PvP ruleset means one faction per account. Choose wisely, cutie."],
  factions: ["Alliance won the vibe check. Horde voters know what they did.", "Olympus is Alliance PvP. Bring earplugs."],
  meta: ["Tier lists are from a level-30 beta. Calm down, theorycrafters.", "Fury Warrior tops the raid sim. Rage fixes pending."],
  racials: ["Night Elves get Shadowmeld. I'm not hiding. I'm just mysterious.", "Orc Blood Fury now buffs spell power too. Rude, honestly."],
  news: ["Fresh scrolls from Azeroth, refreshed hourly.", "Click a video. I'll wait. Elegantly."],
  streamers: ["Asmon went Alliance PvP. We could… not.", "Real quotes only. I have standards."],
  guild: ["<Sam Squatch> has big-foot energy. Just saying.", "Vote with your heart. Then screenshot it to Discord."]
};
const DB_MENU = [
  ["🩹 Need a healer?", "Spoiler: yes. Harry's going Priest and Donnie usually heals. Let's check the comp.", "warroom.html#result"],
  ["⚔️ Show me the comp", "Five slots, eight egos. Load a preset and watch the grades.", "warroom.html"],
  ["⏳ When's launch?", () => { const d = Math.max(0, Math.ceil((new Date(C.LAUNCH_UTC) - Date.now()) / 864e5)); return `Nov 4, 3:00 PM PT / 6:00 PM ET. About ${d} days. Don't be late, darling.`; }, "index.html#count"],
  ["🗳️ Pick a guild name", "<Sam Squatch> has big-foot energy. Just saying.", "guild.html"],
  ["🧬 Best racials?", "Orc for PvE, Human for PvP. Re-tuned today, too.", "racials.html"],
  ["🚩 Alliance or Horde?", "The crew poll leaned Alliance. Horde voters know what they did.", "factions.html"]
];
function danbot(page) {
  const KEY = "bbcc-danbot", st = JSON.parse(localStorage.getItem(KEY) || '{"mute":false,"last":0,"seen":{}}');
  const save = () => localStorage.setItem(KEY, JSON.stringify(st));
  document.body.insertAdjacentHTML("beforeend", `<div id="danbot" class="db"><div class="db-bubble" role="status" hidden><button class="db-x" aria-label="Dismiss">×</button><span class="db-text"></span><div class="db-choices"></div><button class="db-mute">Don't show tips</button></div>
   <button class="db-av" aria-label="Danbot: tap for quick links" aria-expanded="false">${DANBOT_SVG}<span class="db-name">Danbot</span></button></div>`);
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
  $(".db-av", root).onclick = () => { if (!bub.hidden && ch.querySelector("button[data-i]")) { bub.hidden = true; return; } show("Hey hero 😉 What do you need?", menuHTML()); };
  $(".db-x", root).onclick = () => { bub.hidden = true; st.seen[page] = Date.now(); save(); };
  $(".db-mute", root).onclick = () => { st.mute = true; bub.hidden = true; save(); toast("Tips off. Tap Danbot any time for quick links."); };
  const lines = DB_LINES[page] || DB_LINES.home;
  if (!st.mute && Date.now() - st.last > 90e3 && Date.now() - (st.seen[page] || 0) > 6 * 36e5) {
    setTimeout(() => { if (!bub.hidden) return; show(lines[Math.floor(Math.random() * lines.length)], "", 9000); st.last = Date.now(); st.seen[page] = Date.now(); save(); }, 5000);
  }
}
