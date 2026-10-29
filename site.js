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
  let land = null, proj = null, markLayer = null, mark = null;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function inMap(loc) {
    return !!loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lon) &&
      loc.lat >= 12 && loc.lat <= 41 && loc.lon >= -17 && loc.lon <= 62;
  }
  // Brief marker: accent ring + dot + label; old one fades out, new one fades in
  function drawMark(animate) {
    if (!markLayer || !proj) return;
    const fade = animate && !reduceMotion.matches;
    const old = markLayer.selectAll('g.bm').classed('bm', false);
    if (fade) old.transition().duration(300).style('opacity', 0).remove(); else old.remove();
    if (!mark) return;
    const [x, y] = proj([mark.lon, mark.lat]);
    const g = markLayer.append('g').attr('class', 'bm').attr('transform', 'translate(' + x + ',' + y + ')');
    g.append('circle').attr('class', 'bm-ring').attr('r', 8);
    g.append('circle').attr('class', 'bm-pulse').attr('r', 8);
    g.append('circle').attr('class', 'bm-dot').attr('r', 3.5);
    if (mark.label) {
      // Left of the point on English, right of it on Arabic; flip if it would leave the screen
      const t = g.append('text').attr('class', 'bm-label').attr('y', 5).style('direction', 'ltr').text(mark.label);
      const len = t.node().getComputedTextLength() || 0;
      let left = document.documentElement.dir !== 'rtl';
      if (left && x - 14 - len < 8) left = false;
      else if (!left && x + 14 + len > innerWidth - 8) left = true;
      t.attr('x', left ? -14 : 14).attr('text-anchor', left ? 'end' : 'start');
    }
    if (fade) g.style('opacity', 0).transition().duration(300).style('opacity', 1);
  }
  window.menaMap = {
    highlight(loc, label) {
      const next = inMap(loc) ? { lat: loc.lat, lon: loc.lon, label: String(label || '') } : null;
      if (!next) return this.clear();
      if (mark && mark.lat === next.lat && mark.lon === next.lon && mark.label === next.label) return;
      mark = next;
      try { drawMark(true); } catch (e) {}
    },
    clear() {
      if (!mark) return;
      mark = null;
      try { drawMark(true); } catch (e) {}
    }
  };
  function draw() {
    if (!land) return;
    const w = innerWidth, h = innerHeight;
    svg.attr('viewBox', '0 0 ' + w + ' ' + h).selectAll('*').remove();
    const box = { type: 'Feature', geometry: { type: 'MultiPoint', coordinates: [[-17, 12], [70, 41]] } }; // east edge extended past 62°E so Yemen clears the hero portrait
    proj = d3.geoMercator().fitExtent([[w * 0.04, h * 0.08], [w * 0.96, h * 0.95]], box);
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
    markLayer = svg.append('g').attr('class', 'brief-mark');
    try { drawMark(false); } catch (e) {}
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

// Yemen Daily Brief carousel (data: /brief/latest.json, updated by a reviewed daily pull request)
(function () {
  const band = document.getElementById('brief');
  if (!band || !window.fetch) return;
  const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
  const rtl = document.documentElement.dir === 'rtl';
  const t = {
    en: {
      brief: 'Yemen Daily Brief', updated: 'Last updated', sample: 'Sample', sources: 'Sources:', of: ' of ',
      pause: 'Pause slides', play: 'Play slides', prev: 'Previous slide', next: 'Next slide', locale: 'en-CA',
      note: 'Compiled from public reporting with AI assistance and reviewed by Hayl Al-Salehi. Not an official assessment.'
    },
    ar: {
      brief: 'الموجز اليومي عن اليمن', updated: 'آخر تحديث', sample: 'نموذج تجريبي', sources: 'المصادر:', of: ' من ',
      pause: 'إيقاف العرض مؤقتًا', play: 'تشغيل العرض', prev: 'الشريحة السابقة', next: 'الشريحة التالية', locale: 'ar',
      note: 'أُعدّ هذا الموجز من تقارير منشورة علنًا بمساعدة الذكاء الاصطناعي، وراجعه هائل الصالحي. وهو ليس تقييمًا رسميًا.'
    }
  }[lang];
  const DELAY = 9000;
  const HOUR = 3600 * 1000;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const icons = {
    pause: '<rect x="7" y="5" width="3.2" height="14" rx="1"/><rect x="13.8" y="5" width="3.2" height="14" rx="1"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z"/>',
    prev: '<path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    next: '<path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
  };

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function text(v) { return typeof v === 'string' && v.trim() !== '' ? v.trim() : null; }
  function placeOk(loc, category) {
    if (!loc || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lon) || !text(loc['name_' + lang])) return false;
    if (loc.lat < 12 || loc.lat > 41 || loc.lon < -17 || loc.lon > 62) return false;
    return category === 'regional' || (loc.lat >= 10 && loc.lat <= 20 && loc.lon >= 38 && loc.lon <= 55);
  }

  // Keep only slides with the fields this page needs; null means hide the band
  function prepare(d) {
    if (!d || typeof d !== 'object' || !/^\d{4}-\d{2}-\d{2}$/.test(d.date) || !Array.isArray(d.slides)) return null;
    const made = Date.parse(d.generated_at);
    if (!Number.isFinite(made)) return null;
    const age = Date.now() - made;
    if (age > 72 * HOUR) return null;
    const slides = d.slides.map(s => {
      const b = s && s[lang];
      if (!b || !text(b.title) || !text(b.summary)) return null;
      const sources = (Array.isArray(s.sources) ? s.sources : [])
        .filter(x => x && text(x.name) && typeof x.url === 'string' && /^https:\/\//.test(x.url));
      if (!sources.length) return null;
      return {
        label: text(b.category_label), title: b.title.trim(), summary: b.summary.trim(),
        attribution: text(b.attribution), sources,
        location: placeOk(s.location, s.category) ? s.location : null
      };
    }).filter(Boolean);
    if (!slides.length) return null;
    return { date: d.date, stale: age > 24 * HOUR, sample: d.status === 'sample', slides };
  }

  function formatDate(iso) {
    try {
      return new Intl.DateTimeFormat(t.locale, { day: 'numeric', month: lang === 'ar' ? 'long' : 'short', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' })
        .format(new Date(iso + 'T12:00:00Z'));
    } catch (e) { return iso; }
  }

  function button(cls, label, icon) {
    const b = el('button', 'brief-btn ' + cls);
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"' + (icon === 'prev' || icon === 'next' ? ' class="brief-chev"' : '') + '>' + icons[icon] + '</svg>';
    return b;
  }

  function render(brief) {
    const n = brief.slides.length;
    const wrap = el('div', 'wrap');
    const head = el('div', 'brief-head');
    const label = el('p', 'micro accent brief-label');
    label.appendChild(el('span', null, t.brief + ' · ' + (brief.stale ? t.updated + ' ' : '') + formatDate(brief.date)));
    if (brief.sample) label.appendChild(el('span', 'brief-badge', t.sample));
    const controls = el('div', 'brief-controls');
    const pauseBtn = button('brief-pause', t.pause, 'pause');
    const prevBtn = button('brief-prev', t.prev, 'prev');
    const nextBtn = button('brief-next', t.next, 'next');
    const count = el('span', 'brief-count');
    count.setAttribute('aria-hidden', 'true');
    controls.append(pauseBtn, prevBtn, nextBtn, count);
    head.append(label, controls);

    const deck = el('div', 'brief-deck');
    deck.id = 'brief-deck';
    deck.setAttribute('aria-live', 'off');
    [pauseBtn, prevBtn, nextBtn].forEach(b => b.setAttribute('aria-controls', deck.id));
    const nodes = brief.slides.map((s, k) => {
      const node = el('div', 'brief-slide');
      node.setAttribute('role', 'group');
      node.setAttribute('aria-roledescription', lang === 'ar' ? 'شريحة' : 'slide');
      node.setAttribute('aria-label', (k + 1) + t.of + n);
      if (s.label) node.appendChild(el('p', 'brief-cat', s.label));
      node.appendChild(el('p', 'brief-title', s.title));
      node.appendChild(el('p', 'brief-summary', s.summary));
      if (s.attribution) node.appendChild(el('p', 'brief-attr', s.attribution));
      const meta = el('p', 'brief-meta');
      if (s.location) meta.appendChild(el('span', 'brief-loc', '◎ ' + s.location['name_' + lang].trim()));
      const src = el('span', 'brief-src', t.sources + ' ');
      s.sources.forEach((x, j) => {
        if (j) src.appendChild(document.createTextNode(' · '));
        const a = el('a', null, x.name.trim());
        a.href = x.url; a.target = '_blank'; a.rel = 'noopener';
        src.appendChild(a);
      });
      meta.appendChild(src);
      node.appendChild(meta);
      deck.appendChild(node);
      return node;
    });

    const progress = el('div', 'brief-progress');
    progress.setAttribute('aria-hidden', 'true');
    const bar = progress.appendChild(el('span'));
    wrap.append(head, deck, progress, el('p', 'brief-note', t.note));
    band.appendChild(wrap);
    band.hidden = false;

    let i = 0, playing = !reduce, hover = false, focused = false, onScreen = true, manual = false;
    let elapsed = 0, last = 0, raf = 0;

    function running() { return playing && !hover && !focused && onScreen && !document.hidden && n > 1; }
    function mapMark() {
      try {
        const loc = brief.slides[i].location;
        if (!window.menaMap) return;
        if (onScreen && loc) window.menaMap.highlight(loc, loc['name_' + lang].trim());
        else window.menaMap.clear();
      } catch (e) {}
    }
    function drawBar() { bar.style.transform = 'scaleX(' + Math.min(1, elapsed / DELAY) + ')'; }
    function tick(now) {
      raf = 0;
      if (!running()) return;
      if (last) elapsed += now - last;
      last = now;
      if (elapsed >= DELAY) go(i + 1, false);
      drawBar();
      if (!raf) raf = requestAnimationFrame(tick);
    }
    function sync() {
      deck.setAttribute('aria-live', running() && !manual ? 'off' : 'polite');
      if (running()) { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } }
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }
    function go(k, byUser) {
      i = (k + n) % n;
      elapsed = 0;
      manual = byUser;
      nodes.forEach((node, j) => node.classList.toggle('is-active', j === i));
      count.textContent = (i + 1) + (lang === 'ar' ? t.of : ' / ') + n;
      drawBar();
      mapMark();
      sync();
    }
    function setPlaying(p) {
      playing = p;
      pauseBtn.setAttribute('aria-label', p ? t.pause : t.play);
      pauseBtn.querySelector('svg').innerHTML = p ? icons.pause : icons.play;
      sync();
    }

    if (n < 2) { controls.hidden = true; progress.hidden = true; }
    pauseBtn.addEventListener('click', () => setPlaying(!playing));
    prevBtn.addEventListener('click', () => go(i - 1, true));
    nextBtn.addEventListener('click', () => go(i + 1, true));
    band.addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      go(i + ((e.key === 'ArrowRight') !== rtl ? 1 : -1), true);
    });
    band.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { hover = true; sync(); } });
    band.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { hover = false; sync(); } });
    band.addEventListener('focusin', e => {
      let kb = true;
      try { kb = e.target.matches(':focus-visible'); } catch (err) {}
      focused = kb; sync();
    });
    band.addEventListener('focusout', e => { if (!band.contains(e.relatedTarget)) { focused = false; sync(); } });
    document.addEventListener('visibilitychange', sync);

    // Swipe: left goes forward on English, right goes forward on Arabic
    let sx = null, sy = 0;
    deck.addEventListener('touchstart', e => { if (e.touches.length === 1) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; } }, { passive: true });
    deck.addEventListener('touchend', e => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      sx = null;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      go(i + ((dx < 0) !== rtl ? 1 : -1), true);
    }, { passive: true });

    // Marker and rotation only while the band is on screen (below the sticky top bar)
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        onScreen = entries[entries.length - 1].isIntersecting;
        mapMark(); sync();
      }, { rootMargin: '-56px 0px 0px 0px' }).observe(band);
    }

    setPlaying(playing);
    go(0, false);
  }

  fetch('/brief/latest.json', { cache: 'no-cache' })
    .then(r => r.ok ? r.json() : null)
    .then(d => { const b = prepare(d); if (b) render(b); })
    .catch(() => {});
})();
