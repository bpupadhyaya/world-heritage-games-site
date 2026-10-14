/* Atlas of Play: small dependency-free enhancements. Everything works (as plain HTML) without it, except search. */
(function () {
  'use strict';
  var root = document.documentElement, base = document.body.getAttribute('data-root') || './';
  root.classList.remove('no-js');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; }

  /* theme picker. mode: light | dark | auto (follow the device). Keep ids in sync with tools/site/style.css and the head script in build-site.py */
  var THEMES = [
    { id: 'nutrisize', name: 'Nutrisize', note: 'Fresh green, the default', mode: 'light', bar: '#ffffff', sw: 'linear-gradient(135deg,#ffffff 50%,#178a5e 50%)' },
    { id: 'arcforge', name: 'Arcforge', note: 'Violet and teal on ink', mode: 'dark', bar: '#26268f', sw: 'linear-gradient(135deg,#191b26 45%,#7c3aed 45%,#22d3ee)' },
    { id: 'classic', name: 'Parchment', note: 'Original look, follows your device', mode: 'auto', bar: '#f4efe4', sw: 'linear-gradient(135deg,#f4efe4 50%,#b4431f 50%)' },
    { id: 'light', name: 'Parchment light', note: 'Always light', mode: 'light', bar: '#f4efe4', sw: 'linear-gradient(135deg,#fbf8f0 50%,#b4431f 50%)' },
    { id: 'dark', name: 'Parchment dark', note: 'Always dark', mode: 'dark', bar: '#0f151e', sw: 'linear-gradient(135deg,#0f151e 50%,#f08a5d 50%)' },
    { id: 'midnight', name: 'Midnight gold', note: 'Navy and warm gold', mode: 'dark', bar: '#080d22', sw: 'linear-gradient(135deg,#0b1226 50%,#e0b64a 50%)' },
    { id: 'teal', name: 'Deep teal', note: 'Calm teal-slate, easy on the eyes', mode: 'dark', bar: '#394f54', sw: 'linear-gradient(135deg,#1b343a 50%,#394f54 50%)' },
    { id: 'contrast', name: 'High contrast', note: 'Black, white and yellow', mode: 'dark', bar: '#000000', sw: 'linear-gradient(135deg,#000 50%,#ffd60a 50%)' }
  ];
  var DEFAULT_THEME = 'nutrisize', dq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  function themeById(id) { for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i]; return THEMES[0]; }
  var tbtn = $('.theme'), tmenu = null, cur = themeById(ls('whg-theme') || DEFAULT_THEME);
  function modeOf(t) { return t.mode === 'auto' ? (dq && dq.matches ? 'dark' : 'light') : t.mode; }
  function applyTheme(t) {
    cur = t; root.setAttribute('data-theme', t.id); root.setAttribute('data-mode', modeOf(t));
    var m = $('meta[name="theme-color"]'); if (m) m.setAttribute('content', t.bar);
    if (tbtn) { tbtn.innerHTML = '<span class="sw" style="background:' + t.sw + '"></span><span class="caret" aria-hidden="true"></span>'; tbtn.title = 'Theme: ' + t.name; tbtn.setAttribute('aria-label', 'Colour theme: ' + t.name + '. Activate to choose another.'); }
    if (tmenu) $$('button', tmenu).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-id') === t.id ? 'true' : 'false'); });
  }
  if (dq && dq.addEventListener) dq.addEventListener('change', function () { applyTheme(cur); });
  if (tbtn) {
    var wrap = document.createElement('div'); wrap.className = 'theme-wrap'; tbtn.parentNode.insertBefore(wrap, tbtn); wrap.appendChild(tbtn);
    tmenu = document.createElement('ul'); tmenu.className = 'theme-menu'; tmenu.id = 'theme-menu'; tmenu.hidden = true;
    tmenu.setAttribute('aria-label', 'Colour theme');
    THEMES.forEach(function (t) {
      var li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; b.setAttribute('data-id', t.id);
      b.innerHTML = '<span class="sw" style="background:' + t.sw + '"></span><span>' + t.name + '<small>' + t.note + '</small></span>';
      b.addEventListener('click', function () { ls('whg-theme', t.id); applyTheme(t); closeMenu(true); });
      li.appendChild(b); tmenu.appendChild(li);
    });
    wrap.appendChild(tmenu);
    tbtn.setAttribute('aria-haspopup', 'true'); tbtn.setAttribute('aria-expanded', 'false'); tbtn.setAttribute('aria-controls', 'theme-menu');
    var closeMenu = function (refocus) { tmenu.hidden = true; tbtn.setAttribute('aria-expanded', 'false'); if (refocus) tbtn.focus(); };
    tbtn.addEventListener('click', function () {
      var open = tmenu.hidden; tmenu.hidden = !open; tbtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        // keep the menu on screen: open toward the side with room (the button sits at the far left under the logo on most pages)
        tmenu.style.left = tmenu.style.right = 'auto';
        var wr = wrap.getBoundingClientRect(), mw = tmenu.offsetWidth, vw = document.documentElement.clientWidth, gap = 8;
        var left = Math.min(Math.max(gap, wr.left), Math.max(gap, vw - mw - gap)) - wr.left;
        tmenu.style.left = left + 'px';
        var p = $('button[aria-pressed="true"]', tmenu) || $('button', tmenu); p.focus();
      }
    });
    document.addEventListener('click', function (e) { if (!tmenu.hidden && !wrap.contains(e.target)) closeMenu(false); });
    wrap.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !tmenu.hidden) { e.preventDefault(); closeMenu(true); return; }
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !tmenu.hidden) {
        var bs = $$('button', tmenu), i = bs.indexOf(document.activeElement); e.preventDefault();
        bs[(i + (e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length].focus();
      }
    });
  }
  applyTheme(cur);
  var nt = $('.nav-toggle'), nav = $('.nav');
  if (nt) nt.addEventListener('click', function () { var o = nav.classList.toggle('open'); nt.setAttribute('aria-expanded', o); });

  /* copy link */
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var u = b.getAttribute('data-copy') || location.href.split('#')[0];
      function done() { var o = b.textContent; b.textContent = 'Copied'; setTimeout(function () { b.textContent = o; }, 1600); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(u).then(done, function () { window.prompt && done(); });
      else { var t = document.createElement('textarea'); t.value = u; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(t); done(); }
    });
  });

  /* ---------- search ---------- */
  var IDX = null, loading = null;
  function norm(s) { return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/['’`]/g, ''); }
  function loadIndex() {
    if (IDX) return Promise.resolve(IDX);
    if (loading) return loading;
    loading = fetch(base + 'data/search-index.json').then(function (r) { return r.json(); }).then(function (j) {
      j.rows = j.e.map(function (r) {
        var o = { id: r[0], name: r[1], alt: r[2], ctry: r[3], type: r[4], fam: r[5], era: r[6], cradle: r[7], photo: r[8], slug: r[9] };
        o.n = norm(o.name); o.a = norm(o.alt); o.c = norm(o.ctry);
        o.t = norm(j.types[o.type] + ' ' + (j.families[o.fam] || '')); o.x = norm((j.eras[o.era] || '') + ' ' + (j.cradles[o.cradle] || ''));
        o.words = o.n.split(/[^a-z0-9]+/).filter(Boolean);
        return o;
      });
      IDX = j; return j;
    });
    return loading;
  }
  function score(r, toks) {
    var total = 0;
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i], s = 0;
      if (r.n === t) s = 30; else if (r.words.indexOf(t) >= 0) s = 14; else if (r.n.indexOf(t) === 0) s = 12;
      else if (r.words.some(function (w) { return w.indexOf(t) === 0; })) s = 10; else if (r.n.indexOf(t) >= 0) s = 6;
      if (r.a.indexOf(t) >= 0) s = Math.max(s, r.a.split(/[^a-z0-9]+/).indexOf(t) >= 0 ? 9 : 5);
      if (r.c.indexOf(t) >= 0) s = Math.max(s, 7);
      if (r.t.indexOf(t) >= 0) s = Math.max(s, 4);
      if (r.x.indexOf(t) >= 0) s = Math.max(s, 3);
      if (!s) return 0; total += s;
    }
    return total;
  }
  function search(q, filt, limit) {
    var toks = norm(q).split(/[^a-z0-9]+/).filter(Boolean); if (!toks.length) return [];
    var out = [];
    IDX.rows.forEach(function (r) {
      if (filt) { if (filt.type && r.type !== filt.type) return; if (filt.era && r.era !== filt.era) return; }
      var s = score(r, toks); if (s) out.push([s, r]);
    });
    out.sort(function (a, b) { return b[0] - a[0] || a[1].id - b[1].id; });
    return out.slice(0, limit || 50).map(function (x) { return x[1]; });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function href(r) { return base + 'games/' + r.id + '-' + r.slug + '/'; }

  var hs = $('#hero-search');
  if (hs) {
    var inp = $('input', hs), box = $('.suggest', hs), sel = -1, cur = [];
    function render(list) {
      cur = list; sel = -1;
      if (!list.length) { box.hidden = true; inp.setAttribute('aria-expanded', 'false'); return; }
      box.innerHTML = list.slice(0, 8).map(function (r, i) { return '<li role="presentation"><a role="option" id="sg' + i + '" href="' + href(r) + '"><span>' + esc(r.name) + '</span><small>' + esc(r.ctry.split(',')[0]) + ' · ' + esc(IDX.types[r.type]) + '</small></a></li>'; }).join('');
      box.hidden = false; inp.setAttribute('aria-expanded', 'true');
    }
    inp.addEventListener('input', function () { var q = inp.value; if (!q.trim()) { render([]); return; } loadIndex().then(function () { render(search(q, null, 8)); }); });
    inp.addEventListener('focus', function () { loadIndex(); });
    inp.addEventListener('keydown', function (e) {
      var links = $$('a', box);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { if (!links.length) return; e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length; links.forEach(function (a, i) { a.setAttribute('aria-selected', i === sel); }); inp.setAttribute('aria-activedescendant', links[sel].id); }
      else if (e.key === 'Escape') { render([]); }
      else if (e.key === 'Enter') { e.preventDefault(); if (sel >= 0 && links[sel]) location.href = links[sel].href; else location.href = base + 'search/?q=' + encodeURIComponent(inp.value); }
    });
    document.addEventListener('click', function (e) { if (!hs.contains(e.target)) render([]); });
    $$('[data-q]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); inp.value = a.getAttribute('data-q'); inp.focus(); inp.dispatchEvent(new Event('input')); }); });
  }

  var sp = $('#search-page');
  if (sp) {
    var qi = $('input[type=search]', sp), res = $('#results'), cnt = $('#count'), ft = $('#f-type'), fe = $('#f-era'), more = $('#more'), shown = 40, last = [];
    var p = new URLSearchParams(location.search); qi.value = p.get('q') || '';
    function shortC(c) { var a = (c || 'Worldwide').split(', '); return a.length > 3 ? a.slice(0, 3).join(', ') + ' +' + (a.length - 3) : a.join(', '); }
    function card(r) {
      var img = r.photo ? '<img src="' + base + 'img/thumb/' + r.photo + '" alt="" loading="lazy" width="88" height="66">' : '<span class="ph-fallback"></span>';
      var alt = r.alt ? r.alt.split(' | ').filter(function (x) { return norm(x) !== r.n; }).slice(0, 2).join(' · ') : '';
      return '<li class="row" data-era="' + r.era + '"><span class="ph">' + img + '</span><div class="b"><h3><a href="' + href(r) + '">' + esc(r.name) + '</a></h3>' +
        '<span class="m"><i class="dot"></i>' + esc(shortC(r.ctry)) + ' · ' + esc(IDX.types[r.type]) + ' · ' + esc(IDX.eras[r.era] || '') + '</span>' + (alt ? '<span class="m alt">' + esc(alt) + '</span>' : '') + '</div></li>';
    }
    function run() {
      loadIndex().then(function () {
        var q = qi.value; shown = 40;
        if (!ft.options.length) { ft.innerHTML = '<option value="">All types</option>' + Object.keys(IDX.types).map(function (k) { return '<option value="' + k + '">' + esc(IDX.types[k]) + '</option>'; }).join(''); fe.innerHTML = '<option value="">All eras</option>' + Object.keys(IDX.eras).map(function (k) { return '<option value="' + k + '">' + esc(IDX.eras[k]) + '</option>'; }).join(''); }
        last = q.trim() ? search(q, { type: ft.value, era: fe.value }, 400) : [];
        paint(q);
        history.replaceState(null, '', q ? '?q=' + encodeURIComponent(q) : location.pathname);
      });
    }
    function paint(q) {
      res.innerHTML = last.slice(0, shown).map(card).join('');
      cnt.textContent = !q.trim() ? 'Type a name, a country, a kind of game or a civilization.' : last.length ? last.length + (last.length >= 400 ? '+' : '') + ' results' : 'No results. Try a shorter word, or browse by era or country.';
      more.hidden = last.length <= shown;
    }
    qi.addEventListener('input', run); ft.addEventListener('change', run); fe.addEventListener('change', run);
    more.addEventListener('click', function () { shown += 40; paint(qi.value); });
    loadIndex().then(run); qi.focus && qi.focus({ preventScroll: true });
  }

  /* game of the day */
  var god = $('#god');
  if (god) loadIndex().then(function (j) {
    var rows = j.rows.filter(function (r) { return r.photo; }); if (!rows.length) return;
    var d = new Date(), day = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
    var r = rows[(day * 7919) % rows.length];
    god.querySelector('[data-god-img]').innerHTML = '<img src="' + base + 'img/thumb/' + r.photo + '" alt="" width="360" height="270">';
    var a = god.querySelector('[data-god-link]'); a.textContent = r.name; a.href = href(r);
    god.querySelector('[data-god-meta]').textContent = (r.ctry.split(',')[0] || 'Worldwide') + ' · ' + j.types[r.type] + ' · ' + j.eras[r.era];
    god.setAttribute('data-era', r.era);
  });

  /* journey: palette shifts as chapters scroll into view; river fills */
  var chapters = $$('.chapter');
  if (chapters.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); } });
    }, { threshold: 0, rootMargin: '0px 0px -6% 0px' });
    $$('.reveal').forEach(function (n) { io.observe(n); });
    var set = function (era) { document.body.setAttribute('data-era', era); document.body.style.setProperty('--era', 'var(--e-' + era + ')'); };
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) set(e.target.getAttribute('data-era')); });
    }, { rootMargin: '-35% 0px -55% 0px' });
    chapters.forEach(function (c) { io2.observe(c); });
    var jr = $('.journey'), rv = $('.river i');
    function prog() { var r = jr.getBoundingClientRect(), h = r.height - window.innerHeight * 0.4; var p = Math.min(1, Math.max(0, (window.innerHeight * 0.55 - r.top) / h)); rv.style.setProperty('--prog', (p * 100).toFixed(1) + '%'); }
    prog(); window.addEventListener('scroll', prog, { passive: true }); window.addEventListener('resize', prog);
  } else { $$('.reveal').forEach(function (n) { n.classList.add('in'); }); }

  /* counters */
  $$('[data-count]').forEach(function (el) {
    var to = +el.getAttribute('data-count'); if (reduce || !('IntersectionObserver' in window)) { el.textContent = to.toLocaleString('en'); return; }
    var o = new IntersectionObserver(function (es) { if (!es[0].isIntersecting) return; o.disconnect(); var t0 = performance.now(); (function f(t) { var k = Math.min(1, (t - t0) / 1100); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString('en'); if (k < 1) requestAnimationFrame(f); })(t0); });
    o.observe(el);
  });
})();
