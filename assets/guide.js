/* Quick navigation, opened on demand. */
function wisp() {
  const panel = document.createElement('details');
  panel.className = 'quicklinks';
  panel.innerHTML = '<summary>Quick links</summary><a href="warroom.html">Build a party</a><a href="racials.html">Compare races</a><a href="guild.html">Pick a guild name</a>';
  document.querySelector('footer').prepend(panel);
}
