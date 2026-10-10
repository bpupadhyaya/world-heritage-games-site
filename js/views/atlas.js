/* Atlas of Play view: era chapters. Static markup is adopted when nothing is filtered; otherwise chapters are rebuilt from the shared state. */
(function () {
  var W = window.WHG; if (!W) return;
  var dirty = false, grids = [];
  function pick(rows, k) {
    var by = {}, keys = [], out = [];
    rows.filter(function (r) { return r.p; }).concat(rows.filter(function (r) { return !r.p; })).forEach(function (r) { (by[r.k] = by[r.k] || []).push(r); if (keys.indexOf(r.k) < 0) keys.push(r.k); });
    keys.sort(function (a, b) { return by[b].length - by[a].length; });
    while (out.length < k && keys.some(function (c) { return by[c].length; })) keys.forEach(function (c) { if (by[c].length && out.length < k) out.push(by[c].shift()); });
    return out;
  }
  function wire(root) {
    grids.forEach(function (g) { g.destroy(); }); grids = [];
    Array.prototype.forEach.call(root.querySelectorAll('.chapter'), function (ch) {
      var era = ch.getAttribute('data-era'), act = ch.querySelector('.chap-actions'); if (!act || act.querySelector('.all-btn')) return;
      var rows = W.match().filter(function (r) { return r.e === era; });
      var b = document.createElement('button'); b.type = 'button'; b.className = 'btn ghost all-btn'; b.setAttribute('aria-expanded', 'false');
      b.textContent = 'Show all ' + W.fmt(rows.length) + ' here'; act.insertBefore(b, act.firstChild);
      var host = document.createElement('div'); host.className = 'chap-all'; host.hidden = true; ch.appendChild(host); var g = null;
      b.addEventListener('click', function () {
        var open = host.hidden; host.hidden = !open; b.setAttribute('aria-expanded', open);
        b.textContent = open ? 'Hide the full list' : 'Show all ' + W.fmt(rows.length) + ' here';
        if (open) { g = W.grid(host, rows); grids.push(g); } else if (g) g.destroy();
      });
    });
  }
  function render(stage) {
    var m = W.manifest, rows = W.match(), host = stage.querySelector('[data-atlas-chapters]');
    if (!host) { stage.innerHTML = '<section class="journey"><div class="wrap"><div style="position:relative"><div class="river" aria-hidden="true"><i></i></div><div data-atlas-chapters></div></div></div></section>'; host = stage.querySelector('[data-atlas-chapters]'); }
    var html = '';
    m.eras.forEach(function (er) {
      var l = rows.filter(function (r) { return r.e === er.id; }); if (!l.length) return;
      html += '<section class="chapter" data-era="' + er.id + '" aria-labelledby="ch-' + er.id + '"><span class="span">' + W.esc(er.span) + '</span><h3 id="ch-' + er.id + '">' + W.esc(er.name) + '</h3><p class="story">' + W.esc(er.story) + '</p><div><ul class="strip">' +
        pick(l, 6).map(W.card).join('') + '</ul></div><p class="chap-actions"><a class="more" href="' + (document.body.getAttribute('data-root') || './') + 'eras/' + er.id + '/">Explore ' + W.fmt(l.length) + ' games of this era →</a></p></section>';
    });
    host.innerHTML = html || '<p class="lede">No games match these filters. Try fewer filters or a shorter search.</p>';
    dirty = true; wire(host);
  }
  W.registerView('atlas', {
    adopt: function (stage) { dirty = false; Array.prototype.forEach.call(stage.querySelectorAll('.reveal'), function (n) { n.classList.add('in'); }); wire(stage); },
    mount: function (stage) { render(stage); },
    update: function (stage) { render(stage); },
    unmount: function () { grids.forEach(function (g) { g.destroy(); }); grids = []; }
  });
})();
