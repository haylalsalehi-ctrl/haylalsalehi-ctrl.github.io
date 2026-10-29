// Theme toggle
const root = document.documentElement;
const stored = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (stored === 'dark' || (!stored && prefersDark)) root.classList.add('dark');

const sunIcon = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>';
const moonIcon = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';

function refreshIcon() {
  const icon = document.getElementById('theme-icon');
  const dark = root.classList.contains('dark');
  icon.innerHTML = dark ? sunIcon : moonIcon;
  document.getElementById('theme-toggle').setAttribute('aria-pressed', String(dark));
}
refreshIcon();

document.getElementById('theme-toggle').addEventListener('click', () => {
  root.classList.toggle('dark');
  localStorage.setItem('theme', root.classList.contains('dark') ? 'dark' : 'light');
  refreshIcon();
});

// Scroll-driven hero fade
(function () {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let ticking = false;
  function update() {
    const h = hero.offsetHeight;
    const y = Math.max(0, Math.min(1, window.scrollY / (h * 0.8)));
    const eased = 1 - Math.pow(1 - y, 2);
    hero.style.opacity = String(1 - eased * 0.92);
    hero.style.transform = 'translate3d(0,' + (-eased * 32) + 'px,0)';
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
})();

// MENA background map (Natural Earth via world-atlas)
(function () {
  if (!window.d3 || !window.topojson) return;
  const svg = d3.select('#mena-map');
  const focus = new Set(['887', '422']); // Yemen, Lebanon
  const mena = new Set(['504','012','788','434','818','732','376','275','422','760','400','368','364','682','887','512','784','634','048','414']);
  const pins = [{ name: 'صنعاء', ll: [44.21, 15.35] }, { name: 'بيروت', ll: [35.50, 33.89] }];
  let land = null;
  function draw() {
    if (!land) return;
    const w = innerWidth, h = innerHeight;
    svg.attr('viewBox', '0 0 ' + w + ' ' + h).selectAll('*').remove();
    const box = { type: 'Feature', geometry: { type: 'MultiPoint', coordinates: [[-17, 12], [62, 41]] } };
    const proj = d3.geoMercator().fitExtent([[w * 0.04, h * 0.08], [w * 0.96, h * 0.95]], box);
    const path = d3.geoPath(proj);
    const defs = svg.append('defs');
    const grad = defs.append('radialGradient').attr('id', 'veil-g').attr('cx', document.documentElement.dir === 'rtl' ? '62%' : '38%').attr('cy', '50%').attr('r', '65%');
    grad.append('stop').attr('offset', '0%').style('stop-color', 'var(--paper)').attr('stop-opacity', 0.6);
    grad.append('stop').attr('offset', '100%').style('stop-color', 'var(--paper)').attr('stop-opacity', 0);
    svg.append('rect').attr('class', 'sea').attr('width', w).attr('height', h);
    svg.append('path').attr('class', 'grat').attr('d', path(d3.geoGraticule().step([10, 10])()));
    svg.append('g').selectAll('path').data(land.features).join('path')
      .attr('class', d => 'land' + (focus.has(String(d.id)) ? ' focus' : mena.has(String(d.id)) ? ' mena' : ''))
      .attr('d', path);
    const g = svg.append('g');
    pins.forEach(p => {
      const [x, y] = proj(p.ll);
      g.append('circle').attr('class', 'pin-ring').attr('cx', x).attr('cy', y).attr('r', 7);
      g.append('circle').attr('class', 'pin').attr('cx', x).attr('cy', y).attr('r', 2.5);
      g.append('text').attr('class', 'pin-label').attr('x', x + 11).attr('y', y + 5).text(p.name);
    });
    svg.append('rect').attr('width', w).attr('height', h).attr('fill', 'url(#veil-g)');
  }
  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json')
    .then(r => r.json())
    .then(topo => { land = topojson.feature(topo, topo.objects.countries); draw(); })
    .catch(() => {});
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
})();

// Ask me about Yemen panel
(function () {
  const fab = document.getElementById('ask-fab');
  const panel = document.getElementById('ask-panel');
  const close = document.getElementById('ask-close');
  // Stays hidden until a real booking link replaces BOOKING_URL
  if (!document.getElementById('ask-book').getAttribute('href').startsWith('https://')) return;
  fab.hidden = false;
  function setOpen(open) {
    panel.hidden = !open;
    fab.setAttribute('aria-expanded', String(open));
    if (open) close.focus(); else fab.focus();
  }
  fab.addEventListener('click', () => setOpen(panel.hidden));
  close.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) setOpen(false); });
  document.addEventListener('click', e => {
    if (!panel.hidden && !panel.contains(e.target) && !fab.contains(e.target)) setOpen(false);
  });
})();
