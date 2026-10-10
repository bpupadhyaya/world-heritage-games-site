/* Mosaic of Tiles: photo tiles per region and kind of play. A tile sets a shared filter; counts follow the other filters. */
(function () {
  var W = window.WHG; if (!W) return;
  var T = null, root = null, grid = null, stageEl = null;
  var FM = { region: 'r', type: 't' };
  function tileHTML(g, t, rows) {
    var n = rows.filter(function (r) { return t.value.indexOf(r[FM[g.facet]]) >= 0; }).length;
    var on = W.state[g.facet] === t.value.join(',');
    var img = t.cover ? '<img src="' + (document.body.getAttribute('data-root') || './') + 'img/thumb/' + t.cover + '" alt="" loading="lazy" width="360" height="270">' : '';
    return '<li><button type="button" class="mz-tile' + (n ? '' : ' is-empty') + '" style="--tc:' + t.color + '" data-facet="' + g.facet + '" data-value="' + t.value.join(',') + '" aria-pressed="' + on + '"' + (n || on ? '' : ' aria-disabled="true"') + '>' +
      '<span class="mz-img">' + img + '</span><span class="mz-t"><b>' + W.esc(t.short || t.label) + '</b><span>' + W.fmt(n) + ' game' + (n === 1 ? '' : 's') + '</span></span></button></li>';
  }
  function paint() {
    var html = '';
    T.groups.forEach(function (g) {
      var rows = W.match(g.facet);
      html += '<h2 class="mz-h">' + W.esc(g.title) + '</h2><ul class="mz-grid" data-group="' + g.id + '">' + g.tiles.map(function (t) { return tileHTML(g, t, rows); }).join('') + '</ul>';
    });
    var res = W.match(), act = ['region', 'type'].filter(function (f) { return W.state[f]; });
    var crumb = act.map(function (f) { var g = T.groups.filter(function (x) { return x.facet === f; })[0], t = g.tiles.filter(function (x) { return x.value.join(',') === W.state[f]; })[0]; return t ? t.label : (W.manifest.maps[f][W.state[f]] || W.state[f]); }).join(' › ');
    html += '<div class="mz-res" id="mz-res" tabindex="-1"><h2 class="mz-h">' + (crumb ? W.esc(crumb) : 'All games') + ' <span class="mz-n">' + W.fmt(res.length) + '</span></h2><div data-mz-grid></div></div>';
    var active = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute('data-value');
    root.innerHTML = html;
    if (grid) grid.destroy();
    grid = W.grid(root.querySelector('[data-mz-grid]'), res);
    if (!res.length) root.querySelector('[data-mz-grid]').innerHTML = '<p class="lede">No games match. Clear a tile or a filter.</p>';
    if (active) { var b = root.querySelector('[data-value="' + active + '"]'); if (b) b.focus({ preventScroll: true }); }
  }
  function onclick(e) {
    var b = e.target.closest('.mz-tile'); if (!b) return;
    var f = b.getAttribute('data-facet'), v = b.getAttribute('data-value'), o = {};
    o[f] = W.state[f] === v ? '' : v; W.patch(o);
    if (o[f]) { var r = document.getElementById('mz-res'); if (r) r.scrollIntoView({ behavior: W.reduce ? 'auto' : 'smooth', block: 'start' }); }
  }
  W.registerView('mosaic', {
    mount: function (stage) {
      stageEl = stage;
      stage.innerHTML = '<section class="section"><div class="wrap"><div data-mz-root></div></div></section>'; root = stage.querySelector('[data-mz-root]');
      root.addEventListener('click', onclick);
      W.viewData('mosaic').then(function (d) { T = d; paint(); });
    },
    update: function () { if (T) paint(); },
    unmount: function () { if (grid) grid.destroy(); grid = null; }
  });
})();
