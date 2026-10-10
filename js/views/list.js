/* List view: plain sortable table, A to Z by default, batched so 1,000+ rows stay light. */
(function () {
  var W = window.WHG; if (!W) return;
  var sort = 'n', dir = 1, shown = 100, host = null, rows = [];
  var COLS = [['n', 'Game'], ['c', 'Where'], ['t', 'Type'], ['e', 'Era']];
  function key(r, k) {
    var m = W.manifest.maps;
    if (k === 'n') return r.nn;
    if (k === 'c') return (r.ctry[0] || 'zz').toLowerCase();
    if (k === 't') return m.type[r.t];
    return W.manifest.eras.map(function (e) { return e.id; }).indexOf(r.e);
  }
  function body() {
    var m = W.manifest.maps;
    return rows.slice(0, shown).map(function (r) {
      return '<tr data-era="' + r.e + '"><th scope="row"><a href="' + W.href(r) + '">' + W.esc(r.n) + '</a></th><td>' + W.esc(r.ctry.slice(0, 2).join(', ') || 'Worldwide') + '</td><td>' + W.esc(m.type[r.t]) + '</td><td><i class="dot"></i>' + W.esc(m.era[r.e]) + '</td></tr>';
    }).join('');
  }
  function paint() {
    var head = COLS.map(function (c) {
      var on = sort === c[0];
      return '<th scope="col" aria-sort="' + (on ? (dir > 0 ? 'ascending' : 'descending') : 'none') + '"><button type="button" data-sort="' + c[0] + '">' + c[1] + '<span aria-hidden="true">' + (on ? (dir > 0 ? ' ↑' : ' ↓') : '') + '</span></button></th>';
    }).join('');
    host.innerHTML = '<div class="tablewrap"><table class="ltable"><caption class="visually-hidden">Games, sortable by column</caption><thead><tr>' + head + '</tr></thead><tbody>' + body() + '</tbody></table></div>' +
      (rows.length > shown ? '<p><button type="button" class="btn ghost" data-more>Show ' + Math.min(200, rows.length - shown) + ' more (' + W.fmt(rows.length - shown) + ' left)</button></p>' : '') + (rows.length ? '' : '<p class="lede">No games match these filters.</p>');
  }
  function update() {
    rows = W.match().slice();
    rows.sort(function (a, b) { var x = key(a, sort), y = key(b, sort); return (x < y ? -1 : x > y ? 1 : a.i - b.i) * dir; });
    shown = 100; paint();
  }
  W.registerView('list', {
    mount: function (stage) {
      stage.innerHTML = '<section class="section"><div class="wrap"><div data-list-root></div></div></section>'; host = stage.querySelector('[data-list-root]');
      host.addEventListener('click', function (e) {
        var b = e.target.closest('[data-sort]'), mo = e.target.closest('[data-more]');
        if (b) { var k = b.getAttribute('data-sort'); if (sort === k) dir = -dir; else { sort = k; dir = 1; } update(); var nb = host.querySelector('[data-sort="' + k + '"]'); if (nb) nb.focus(); }
        if (mo) { shown += 200; paint(); var t = host.querySelectorAll('tbody tr')[shown - 200]; var l = t && t.querySelector('a'); if (l) l.focus(); }
      });
      update();
    },
    update: update
  });
})();
