/* Switchable views: shared search + filter state, chunked data, view registry.
   A view is a module that calls WHG.registerView(id, {mount, update, unmount}). See docs/PUBLISHING.md "Add a view". */
(function () {
  'use strict';
  var bar = document.getElementById('browse-bar'), stage = document.getElementById('stage');
  if (!bar || !stage) return;
  var base = document.body.getAttribute('data-root') || './';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FIELDS = ['q', 'region', 'country', 'type', 'family', 'era', 'cradle', 'photo'];
  var W = window.WHG = { views: {}, state: {}, manifest: null, rows: null };
  var pageView = stage.getAttribute('data-view'), defaultView = stage.getAttribute('data-default-view') || pageView;
  var isHome = base === './' || base === '';
  var current = null, curId = null, staticHTML = {}, ready = false, loadingAll = null, chunkCache = {};
  staticHTML[pageView] = stage.innerHTML;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function norm(s) { return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/['’`]/g, ''); }
  function fmt(n) { return Number(n).toLocaleString('en'); }
  W.esc = esc; W.fmt = fmt; W.reduce = reduce;

  /* ---------------- state in the URL ---------------- */
  function readState() {
    var p = new URLSearchParams(location.search), s = {};
    FIELDS.forEach(function (f) { s[f] = p.get(f) || ''; });
    s.view = p.get('view') || '';
    return s;
  }
  function writeURL(push) {
    var p = new URLSearchParams(), s = W.state;
    FIELDS.forEach(function (f) { if (s[f]) p.set(f, s[f]); });
    if (s.view && s.view !== pageView) p.set('view', s.view);
    var url = location.pathname + (p.toString() ? '?' + p.toString() : '');
    try { history[push ? 'pushState' : 'replaceState'](null, '', url); } catch (e) {}
  }
  function activeFilters() { return FIELDS.some(function (f) { return W.state[f]; }); }

  /* ---------------- data ---------------- */
  function getJSON(u) { return fetch(base + u).then(function (r) { if (!r.ok) throw new Error(u); return r.json(); }); }
  function prep(r, m) {
    var t = m.maps.type[r.t], f = m.maps.family[r.f];
    r.ctry = (r.c || []).map(function (i) { return m.maps.country[i] || i; });
    r.nn = norm(r.n); r.na = norm(r.a); r.nc = norm(r.ctry.join(' '));
    r.nt = norm((t || '') + ' ' + (f || '')); r.nx = norm((m.maps.era[r.e] || '') + ' ' + (m.maps.cradle[r.k] || ''));
    r.words = r.nn.split(/[^a-z0-9]+/).filter(Boolean);
    return r;
  }
  function loadManifest() {
    if (W.manifest) return Promise.resolve(W.manifest);
    return getJSON('data/browse/manifest.json').then(function (m) {
      m.maps = {};
      ['type', 'family', 'era', 'cradle', 'country', 'region'].forEach(function (k) {
        var list = m[k === 'type' ? 'types' : k === 'family' ? 'families' : k === 'era' ? 'eras' : k === 'cradle' ? 'cradles' : k === 'country' ? 'countries' : 'regions'];
        m.maps[k] = {}; list.forEach(function (x) { m.maps[k][x.id] = x.name; });
      });
      W.manifest = m; return m;
    });
  }
  function loadChunk(id) {
    if (chunkCache[id]) return chunkCache[id];
    return chunkCache[id] = loadManifest().then(function (m) {
      var e = m.eras.filter(function (x) { return x.id === id; })[0];
      return getJSON(e.file).then(function (rows) { return rows.map(function (r) { return prep(r, m); }); });
    });
  }
  function loadAll() {
    if (loadingAll) return loadingAll;
    return loadingAll = loadManifest().then(function (m) {
      return Promise.all(m.eras.map(function (e) { return loadChunk(e.id); }));
    }).then(function (parts) { W.rows = [].concat.apply([], parts).sort(function (a, b) { return (a.p ? 0 : 1) - (b.p ? 0 : 1) || (a.nn < b.nn ? -1 : a.nn > b.nn ? 1 : a.i - b.i); }); return W.rows; });
  }
  W.loadAll = loadAll;
  var viewData = {};
  W.viewData = function (id) { return viewData[id] || (viewData[id] = getJSON('data/browse/view-' + id + '.json')); };

  /* ---------------- matching ---------------- */
  function score(r, toks) {
    var total = 0;
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i], s = 0;
      if (r.nn === t) s = 30; else if (r.words.indexOf(t) >= 0) s = 14; else if (r.nn.indexOf(t) === 0) s = 12;
      else if (r.words.some(function (w) { return w.indexOf(t) === 0; })) s = 10; else if (r.nn.indexOf(t) >= 0) s = 6;
      if (r.na.indexOf(t) >= 0) s = Math.max(s, 5);
      if (r.nc.indexOf(t) >= 0) s = Math.max(s, 7);
      if (r.nt.indexOf(t) >= 0) s = Math.max(s, 4);
      if (r.nx.indexOf(t) >= 0) s = Math.max(s, 3);
      if (!s) return 0; total += s;
    }
    return total;
  }
  var FMAP = { region: 'r', type: 't', family: 'f', era: 'e', cradle: 'k' };
  function setOf(v) { var o = {}; v.split(',').forEach(function (x) { o[x] = 1; }); return o; }
  /* rows matching the whole state, except the facet named in `skip` (used for tile and menu counts) */
  W.match = function (skip) {
    var s = W.state, rows = W.rows || [], toks = norm(s.q).split(/[^a-z0-9]+/).filter(Boolean), sets = {}, out = [];
    Object.keys(FMAP).forEach(function (f) { if (s[f] && f !== skip) sets[f] = setOf(s[f]); });
    var cset = s.country && skip !== 'country' ? setOf(s.country) : null;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i], ok = true;
      for (var f in sets) if (!sets[f][r[FMAP[f]]]) { ok = false; break; }
      if (!ok) continue;
      if (cset && !r.c.some(function (c) { return cset[c]; })) continue;
      if (s.photo && skip !== 'photo' && !r.p) continue;
      if (toks.length) { var sc = score(r, toks); if (!sc) continue; out.push([sc, r]); } else out.push([0, r]);
    }
    if (toks.length) out.sort(function (a, b) { return b[0] - a[0] || (a[1].p ? 0 : 1) - (b[1].p ? 0 : 1) || a[1].i - b[1].i; });
    return out.map(function (x) { return x[1]; });
  };
  W.href = function (r) { return base + 'games/' + r.i + '-' + r.s + '/'; };
  W.where = function (r) { var c = r.ctry[0] || 'Worldwide'; return r.ctry.length > 1 ? c + ' +' + (r.ctry.length - 1) : c; };
  W.card = function (r) {
    var m = W.manifest, ph = r.p ? '<img src="' + base + 'img/thumb/' + r.p + '" alt="" loading="lazy" width="360" height="270">' : '<span class="ph-fallback"></span>';
    return '<li class="card" data-era="' + r.e + '"><span class="ph">' + ph + '</span><div class="b"><h3><a href="' + W.href(r) + '">' + esc(r.n) + '</a></h3><span class="m"><i class="dot"></i>' + esc(W.where(r)) + ' · ' + esc(m.maps.type[r.t]) + '</span></div></li>';
  };
  /* batched, lazy grid: appends 48 cards at a time as the sentinel nears the viewport; a button is the keyboard fallback */
  W.grid = function (host, rows, opt) {
    opt = opt || {}; var n = 0, step = opt.step || 48, ul = document.createElement('ul'), btn = document.createElement('button'), sent = document.createElement('div'), io = null;
    ul.className = 'grid'; btn.type = 'button'; btn.className = 'btn ghost more-btn'; sent.className = 'sentinel'; sent.setAttribute('aria-hidden', 'true');
    host.innerHTML = ''; host.appendChild(ul); host.appendChild(sent); host.appendChild(btn);
    function more() {
      if (n >= rows.length) return;
      var html = rows.slice(n, n + step).map(opt.card || W.card).join(''); n = Math.min(rows.length, n + step); ul.insertAdjacentHTML('beforeend', html);
      btn.hidden = n >= rows.length; btn.textContent = 'Show more (' + fmt(rows.length - n) + ' left)';
      if (n >= rows.length && io) io.disconnect();
    }
    btn.addEventListener('click', more);
    if ('IntersectionObserver' in window) { io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) more(); }, { rootMargin: '600px 0px' }); io.observe(sent); }
    more();
    return { destroy: function () { if (io) io.disconnect(); host.innerHTML = ''; } };
  };

  /* ---------------- bar: search, filters, chips, count ---------------- */
  var qi = $('#bq', bar), fbox = $('#bfilters', bar), cnt = $('#bcount', bar), chips = $('#bchips', bar), selects = {};
  var LABEL = { region: 'Region', country: 'Country', type: 'Type', family: 'Family', era: 'Era', cradle: 'Cradle' };
  function buildFilters(m) {
    var lists = { region: m.regions, country: m.countries, type: m.types, family: m.families, era: m.eras, cradle: m.cradles };
    var html = '<button type="button" class="btn ghost ftoggle" aria-expanded="false" aria-controls="fpanel">Filters</button><div class="fpanel" id="fpanel">';
    Object.keys(lists).forEach(function (f) {
      html += '<label class="fl"><span>' + LABEL[f] + '</span><select data-f="' + f + '"><option value="">All</option>' + lists[f].map(function (x) { return '<option value="' + esc(x.id) + '">' + esc(x.name) + '</option>'; }).join('') + '</select></label>';
    });
    html += '<label class="fl chk"><input type="checkbox" data-f="photo"> <span>Has a photo</span></label><button type="button" class="btn ghost fclear" hidden>Clear all</button></div>';
    fbox.innerHTML = html; fbox.hidden = false;
    $$('select', fbox).forEach(function (sel) { selects[sel.getAttribute('data-f')] = sel; sel.addEventListener('change', function () { W.set(sel.getAttribute('data-f'), sel.value); }); });
    $('input[data-f=photo]', fbox).addEventListener('change', function (e) { W.set('photo', e.target.checked ? '1' : ''); });
    $('.fclear', fbox).addEventListener('click', function () { W.clear(); });
    var tg = $('.ftoggle', fbox), pn = $('#fpanel', fbox);
    tg.addEventListener('click', function () { var o = pn.classList.toggle('open'); tg.setAttribute('aria-expanded', o); });
  }
  function syncBar() {
    var s = W.state, m = W.manifest;
    if (qi !== document.activeElement) qi.value = s.q;
    if (m) {
      Object.keys(selects).forEach(function (f) {
        var sel = selects[f], v = s[f];
        $$('option[data-tmp]', sel).forEach(function (o) { o.remove(); });
        if (v && !$('option[value="' + v.replace(/"/g, '') + '"]', sel)) {
          var names = v.split(',').map(function (x) { return (m.maps[f] || {})[x] || x; });
          var o = document.createElement('option'); o.value = v; o.textContent = names.length > 2 ? names.slice(0, 2).join(', ') + ' and ' + (names.length - 2) + ' more' : names.join(', '); o.setAttribute('data-tmp', '1'); sel.appendChild(o);
        }
        sel.value = v;
      });
      var ph = $('input[data-f=photo]', fbox); if (ph) ph.checked = !!s.photo;
      var cl = $('.fclear', fbox); if (cl) cl.hidden = !activeFilters();
      var chtml = '';
      FIELDS.forEach(function (f) {
        if (!s[f]) return;
        var t = f === 'q' ? 'Search: ' + s.q : f === 'photo' ? 'Has a photo' : LABEL[f] + ': ' + s[f].split(',').map(function (x) { return (m.maps[f] || {})[x] || x; }).slice(0, 2).join(', ') + (s[f].split(',').length > 2 ? ' +' + (s[f].split(',').length - 2) : '');
        chtml += '<li><button type="button" data-rm="' + f + '" aria-label="Remove filter ' + esc(t) + '">' + esc(t) + ' <span aria-hidden="true">×</span></button></li>';
      });
      chips.innerHTML = chtml;
    }
    document.body.classList.toggle('is-filtered', activeFilters());
    var nf = FIELDS.filter(function (f) { return f !== 'q' && s[f]; }).length, tg = $('.ftoggle', fbox); if (tg) tg.textContent = nf ? 'Filters (' + nf + ')' : 'Filters';
  }
  chips.addEventListener('click', function (e) { var b = e.target.closest('[data-rm]'); if (b) W.set(b.getAttribute('data-rm'), ''); });
  var qt = null;
  qi.addEventListener('input', function () { clearTimeout(qt); qt = setTimeout(function () { W.set('q', qi.value.trim(), true); }, 160); });
  bar.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); clearTimeout(qt); W.set('q', qi.value.trim()); });
  $$('[data-q]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); W.set('q', a.getAttribute('data-q')); qi.value = a.getAttribute('data-q'); }); });

  W.set = function (f, v, quiet) { W.state[f] = v; writeURL(false); refresh(); };
  W.patch = function (o) { for (var k in o) W.state[k] = o[k]; writeURL(false); refresh(); };
  W.clear = function () { FIELDS.forEach(function (f) { W.state[f] = ''; }); qi.value = ''; writeURL(false); refresh(); };

  /* ---------------- view registry + switcher ---------------- */
  W.registerView = function (id, v) { W.views[id] = v; if (ready && id === W.state.view && !current) show(id, true); };
  var sw = $$('.views a[data-view]');
  function markSwitcher(id) {
    sw.forEach(function (a) {
      var on = a.getAttribute('data-view') === id;
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      if (on && a.scrollIntoView && a.offsetParent) { var ul = a.closest('ul'); if (ul && ul.scrollWidth > ul.clientWidth) ul.scrollTo({ left: Math.max(0, a.offsetLeft - (ul.clientWidth - a.offsetWidth) / 2), behavior: reduce ? 'auto' : 'smooth' }); }
    });
  }
  sw.forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault(); var id = a.getAttribute('data-view');
      W.state.view = id; ls('whg-view', id); writeURL(true); show(id);
      var live = document.getElementById('view-live'), lab = a.textContent.trim();
      if (live) live.textContent = lab + ' view shown. ' + (W.rows ? fmt(W.match().length) + ' games.' : '');
    });
  });
  function show(id, silent) {
    var v = W.views[id];
    if (!v) { if (!silent) setTimeout(function () { if (W.views[id]) show(id, true); }, 150); return; }
    var first = !current;
    if (current && current.unmount) current.unmount(stage);
    current = v; curId = id; markSwitcher(id); document.body.classList.toggle('alt-view', id !== defaultView);
    stage.setAttribute('data-view', id); stage.classList.remove('is-loading');
    var useStatic = id === pageView && staticHTML[id] && !activeFilters() && !!v.adopt;
    if (useStatic) { if (!first) stage.innerHTML = staticHTML[id]; } else stage.innerHTML = '';
    loadAll().then(function () {
      if (curId !== id) return;
      if (useStatic) v.adopt(stage, { W: W }); else v.mount(stage, { W: W });
      refresh();
    });
  }
  function refresh(skipView) {
    syncBar();
    if (!W.rows) { loadAll().then(function () { refresh(); }); return; }
    var n = W.match().length, m = W.manifest;
    cnt.textContent = activeFilters() ? fmt(n) + ' of ' + fmt(m.total) + ' games match' : fmt(m.total) + ' games to explore';
    if (!skipView && current && current.update) current.update(stage, { W: W });
  }
  window.addEventListener('popstate', function () {
    var v = W.state.view; W.state = readState(); if (!W.state.view) W.state.view = pageView;
    if (W.state.view !== curId) show(W.state.view); else refresh();
  });

  /* ---------------- start ---------------- */
  W.state = readState();
  var want = W.state.view || (isHome && ls('whg-view')) || pageView;
  if (!VIEWS_OK(want)) want = pageView;
  function VIEWS_OK(id) { return !!$('.views a[data-view="' + id + '"]'); }
  W.state.view = want;
  qi.value = W.state.q;
  loadManifest().then(function (m) {
    buildFilters(m); syncBar();
    cnt.textContent = fmt(m.total) + ' games to explore';
    ready = true;
    var go = function () { markSwitcher(want); show(want); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  });
})();
