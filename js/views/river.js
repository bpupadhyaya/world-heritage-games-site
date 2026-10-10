/* River of Time: one wide scrollable river through six eras. Cradles are tributaries (click to filter), games are boats with photo cards
   placed in their real era. "Show all N" opens a lazy list of every matching game in that lane. */
(function () {
  var W = window.WHG; if (!W) return;
  var SW = 4400, SH = 720, M = 140, EW = (SW - 2 * M) / 6;
  var SLOTS = [[.16, 'top'], [.41, 'bot'], [.66, 'top'], [.91, 'bot']];
  var TRIB = [[.41, 'top'], [.16, 'bot'], [.66, 'bot'], [.91, 'top']];  // tributary gaps are the free columns between cards
  var D = null, host = null, drawerLane = -1, drawerGrid = null, scroller = null, laneOf = {}, off = [];
  function ry(x) { return SH / 2 + 40 * Math.sin(x / 270) + 18 * Math.sin(x / 101 + 1); }
  function pick(rows, k) {
    var by = {}, keys = [], out = [];
    rows.filter(function (r) { return r.p; }).forEach(function (r) { (by[r.k] = by[r.k] || []).push(r); if (keys.indexOf(r.k) < 0) keys.push(r.k); });
    keys.sort(function (a, b) { return by[b].length - by[a].length; });
    while (out.length < k && keys.some(function (c) { return by[c].length; })) keys.forEach(function (c) { if (by[c].length && out.length < k) out.push(by[c].shift()); });
    if (out.length < k) rows.filter(function (r) { return !r.p; }).slice(0, k - out.length).forEach(function (r) { out.push(r); });
    return out;
  }
  function grad(id, key) {
    var s = '';
    for (var i = 0; i < 6; i++) {
      var a = i ? (M + i * EW + EW * .16) / SW * 100 : 0, b = i < 5 ? (M + (i + 1) * EW - EW * .16) / SW * 100 : 100, c = 'var(--rv-' + key + i + ')';
      s += '<stop offset="' + a.toFixed(2) + '%" style="stop-color:' + c + '"/><stop offset="' + b.toFixed(2) + '%" style="stop-color:' + c + '"/>';
    }
    return '<linearGradient id="' + id + '" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="' + SW + '" y2="0">' + s + '</linearGradient>';
  }
  function scene(rows) {
    var L = D.lanes, laneRows = L.map(function () { return []; });
    rows.forEach(function (r) { laneRows[laneOf[r.e]].push(r); });
    var d = 'M' + Array.apply(null, Array(Math.floor(SW / 12) + 1)).map(function (_, i) { return (i * 12) + ',' + ry(i * 12).toFixed(1); }).join(' L');
    var svg = '<defs>' + grad('rvw', 'w') + grad('rvs', 's') + '<linearGradient id="rvf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--rv-fade)" stop-opacity="0"/><stop offset="1" stop-color="var(--rv-fade)" stop-opacity=".9"/></linearGradient></defs>' +
      '<rect width="' + SW + '" height="' + SH + '" fill="url(#rvs)"/><rect y="' + (SH - 220) + '" width="' + SW + '" height="220" fill="url(#rvf)"/>';
    var over = '', conn = '', boats = '';
    L.forEach(function (l, i) {
      var x0 = M + i * EW, n = laneRows[i].length;
      svg += '<line x1="' + x0 + '" y1="16" x2="' + x0 + '" y2="' + (SH - 16) + '" style="stroke:var(--rv-ink' + i + ')" stroke-width="2" stroke-dasharray="4 8" opacity=".5"/>' +
        '<text x="' + (x0 + EW - 16) + '" y="' + (SH - 10) + '" text-anchor="end" class="rv-big" style="fill:var(--rv-ink' + i + ')">' + (i + 1) + '</text>';
      over += '<div class="rv-era" style="left:' + (x0 + 22) + 'px;--ek:var(--rv-ink' + i + ')"><b>' + W.esc(l.name) + '</b><span>' + W.esc(l.span) + '</span></div>' +
        '<button type="button" class="rv-all" data-lane="' + i + '" style="left:' + (x0 + 22) + 'px"' + (n ? '' : ' disabled') + '>' + (n ? 'Show all ' + W.fmt(n) + ' in this era' : 'No matches in this era') + '</button>';
      pick(laneRows[i], 4).forEach(function (r, j) {
        var f = SLOTS[j][0], top = SLOTS[j][1] === 'top', x = x0 + f * EW, y = ry(x), cy = top ? 84 : 440;
        conn += '<line x1="' + x.toFixed(1) + '" y1="' + (y + (top ? -14 : 14)).toFixed(1) + '" x2="' + x.toFixed(1) + '" y2="' + (top ? cy + 196 : cy) + '" class="rv-conn"/>';
        boats += '<g transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')" class="rv-boat"><ellipse cx="0" cy="3" rx="22" ry="7" class="rv-hull"/><path d="M-18,1 L18,1 L12,-6 L-12,-6Z" class="rv-deck"/><path d="M0,-6 L0,-24 L14,-8Z" class="rv-sail"/></g>';
        over += '<a class="rv-card" href="' + W.href(r) + '" data-era="' + r.e + '" style="left:' + (x - 82).toFixed(0) + 'px;top:' + cy + 'px">' + (r.p ? '<img src="' + (document.body.getAttribute('data-root') || './') + 'img/thumb/' + r.p + '" alt="" loading="lazy" width="164" height="116">' : '<span class="ph-fallback"></span>') +
          '<b>' + W.esc(r.n) + '</b><small>' + W.esc(W.where(r)) + ' · ' + W.esc(W.manifest.maps.type[r.t]) + '</small></a>';
      });
    });
    var tr = '';
    D.cradles.forEach(function (c) {
      var t = TRIB[c.slot], top = t[1] === 'top', xs = M + c.lane * EW + t[0] * EW, xj = xs + 45, yj = ry(xj), ys = top ? 116 : 604, sel = W.state.cradle === c.id;
      var p = 'M' + xs.toFixed(0) + ',' + ys + ' C' + xs.toFixed(0) + ',' + (ys + (top ? 120 : -120)) + ' ' + xj.toFixed(0) + ',' + (yj + (top ? -120 : 120)).toFixed(0) + ' ' + xj.toFixed(0) + ',' + (yj + (top ? -8 : 8)).toFixed(0);
      tr += '<path d="' + p + '" fill="none" stroke="url(#rvw)" stroke-width="12" stroke-linecap="round" opacity=".85"/><path class="flow" d="' + p + '" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="2 22" opacity=".7"/>' +
        '<g class="rv-src" tabindex="0" role="button" aria-pressed="' + sel + '" data-cradle="' + c.id + '" aria-label="Filter by ' + W.esc(c.name) + ' cradle"><circle cx="' + xs.toFixed(0) + '" cy="' + ys + '" r="' + (sel ? 10 : 8) + '"/>' +
        '<text x="' + xs.toFixed(0) + '" y="' + (ys + (top ? -16 : 28)) + '" text-anchor="middle">' + W.esc(c.name) + '</text></g>';
    });
    svg += '<path d="' + d + '" fill="none" class="rv-shadow" stroke-width="58" stroke-linecap="round" transform="translate(0,6)"/><path d="' + d + '" fill="none" class="rv-bank" stroke-width="54" stroke-linecap="round"/><path d="' + d + '" fill="none" stroke="url(#rvw)" stroke-width="46" stroke-linecap="round"/>' +
      '<path class="flow" d="' + d + '" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="2 26" opacity=".6" transform="translate(0,-8)"/><path class="flow" d="' + d + '" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="2 34" opacity=".45" transform="translate(0,9)"/>' +
      tr + conn + boats + '<text x="40" y="' + (ry(40) + 62).toFixed(0) + '" class="rv-end">The first stone games</text><text x="' + (SW - 40) + '" y="' + (ry(SW - 40) + 62).toFixed(0) + '" text-anchor="end" class="rv-end">Today: games still played</text>';
    return { svg: svg, over: over, laneRows: laneRows };
  }
  function drawer(laneRows) {
    var box = host.querySelector('.rv-drawer');
    if (drawerGrid) { drawerGrid.destroy(); drawerGrid = null; }
    if (drawerLane < 0) { box.hidden = true; return; }
    var l = D.lanes[drawerLane], rows = laneRows[drawerLane];
    box.hidden = false; box.style.setProperty('--ek', 'var(--rv-ink' + drawerLane + ')');
    box.querySelector('h3').textContent = l.name + ': ' + W.fmt(rows.length) + ' game' + (rows.length === 1 ? '' : 's');
    drawerGrid = W.grid(box.querySelector('[data-rv-grid]'), rows);
  }
  var lastRows = null;
  function paint() {
    var s = scene(W.match()); lastRows = s.laneRows;
    host.querySelector('svg.rv-svg').innerHTML = s.svg; host.querySelector('.rv-over').innerHTML = s.over;
    D.lanes.forEach(function (l, i) { var b = host.querySelector('.rv-jump [data-j="' + i + '"] i'); if (b) b.textContent = W.fmt(s.laneRows[i].length); });
    drawer(s.laneRows);
  }
  function jump(i) { scroller.scrollTo({ left: Math.max(0, M + i * EW - 60), behavior: W.reduce ? 'auto' : 'smooth' }); }
  function mark() {
    var mid = scroller.scrollLeft + scroller.clientWidth * .35, i = Math.max(0, Math.min(5, Math.floor((mid - M) / EW)));
    Array.prototype.forEach.call(host.querySelectorAll('.rv-jump button'), function (b) { if (+b.getAttribute('data-j') === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    
  }
  function mount(stage) {
    W.viewData('river').then(function (d) {
      D = d; laneOf = {}; d.lanes.forEach(function (l, i) { l.eras.forEach(function (e) { laneOf[e] = i; }); });
      stage.innerHTML = '<section class="section rv" aria-labelledby="rvh"><div class="wrap"><h2 id="rvh">River of Time</h2><p class="lede">Follow the river from the first stone games to today. Streams join from the cradles of culture (select one to filter), and every boat is a real game in its own era. Drag, scroll or use the buttons.</p>' +
        '<div class="rv-jump" role="group" aria-label="Jump to an era">' + d.lanes.map(function (l, i) { return '<button type="button" data-j="' + i + '" style="--ek:var(--rv-ink' + i + ')">' + W.esc(l.name) + ' <i></i></button>'; }).join('') + '</div>' +
        '<p class="rv-hint">Drag, swipe or scroll sideways. Era buttons jump along the river.</p><div class="rv-frame"><div class="rv-scroll" tabindex="0" role="region" aria-label="River of time. Scroll sideways with arrow keys, mouse or touch."><div class="rv-scene" style="width:' + SW + 'px;height:' + SH + 'px"><svg class="rv-svg" viewBox="0 0 ' + SW + ' ' + SH + '" width="' + SW + '" height="' + SH + '" aria-hidden="true" focusable="false"></svg><div class="rv-over"></div></div></div></div>' +
        '<div class="rv-drawer" hidden><div class="rv-dh"><h3></h3><button type="button" class="btn ghost" data-close>Close list</button></div><div data-rv-grid></div></div></div></section>';
      host = stage; scroller = stage.querySelector('.rv-scroll'); drawerLane = -1;
      var sx = 0, sl = 0, drag = false, moved = 0;
      scroller.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' || e.button) return; drag = true; moved = 0; sx = e.clientX; sl = scroller.scrollLeft; scroller.classList.add('drag'); });
      window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
      function onMove(e) { if (!drag) return; moved = Math.max(moved, Math.abs(e.clientX - sx)); scroller.scrollLeft = sl - (e.clientX - sx); }
      function onUp() { drag = false; scroller.classList.remove('drag'); }
      off = [function () { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); }];
      scroller.addEventListener('click', function (e) { if (moved > 5) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
      scroller.addEventListener('wheel', function (e) {
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || e.ctrlKey) return;
        var max = scroller.scrollWidth - scroller.clientWidth;
        if ((e.deltaY < 0 && scroller.scrollLeft <= 0) || (e.deltaY > 0 && scroller.scrollLeft >= max - 1)) return;
        scroller.scrollLeft += e.deltaY; e.preventDefault();
      }, { passive: false });
      scroller.addEventListener('scroll', function () { requestAnimationFrame(mark); }, { passive: true });
      stage.addEventListener('click', function (e) {
        var j = e.target.closest('[data-j]'), a = e.target.closest('.rv-all'), c = e.target.closest('[data-close]'), src = e.target.closest('.rv-src');
        if (j) jump(+j.getAttribute('data-j'));
        if (a) { drawerLane = drawerLane === +a.getAttribute('data-lane') ? -1 : +a.getAttribute('data-lane'); drawer(lastRows); if (drawerLane >= 0) stage.querySelector('.rv-drawer').scrollIntoView({ behavior: W.reduce ? 'auto' : 'smooth', block: 'start' }); }
        if (c) { drawerLane = -1; drawer(lastRows); }
        if (src) W.set('cradle', W.state.cradle === src.getAttribute('data-cradle') ? '' : src.getAttribute('data-cradle'));
      });
      stage.addEventListener('keydown', function (e) { var src = e.target.closest && e.target.closest('.rv-src'); if (src && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); src.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
      paint(); mark();
      if (W.state.era && laneOf[W.state.era] != null) jump(laneOf[W.state.era]);
      var fk = W.state.cradle && D.cradles.filter(function (c) { return c.id === W.state.cradle; })[0]; if (fk && !W.state.era) jump(fk.lane);
    });
  }
  W.registerView('river', {
    mount: mount,
    update: function () { if (D && host) { var key = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute('data-cradle'); paint(); if (key) { var n = host.querySelector('[data-cradle="' + key + '"]'); if (n) n.focus({ preventScroll: true }); } } },
    unmount: function () { off.forEach(function (f) { f(); }); off = []; if (drawerGrid) drawerGrid.destroy(); drawerGrid = null; host = null; }
  });
})();
