/* Play preview: poster -> live iframe of the real game (same-site /play/<slug>/). Without JavaScript the poster is a plain link
   to the full-page preview, so the page still works. */
(function () {
  var frame = document.querySelector('[data-gp-frame]');
  if (!frame) return;
  var poster = frame.querySelector('.gp-poster');
  var url = frame.getAttribute('data-src');
  var title = frame.getAttribute('data-title') || 'Game preview';
  var original = poster ? poster.outerHTML : '';
  var tools = document.querySelector('[data-gp-tools]');
  function start(e) {
    if (e) e.preventDefault();
    var f = document.createElement('iframe');
    f.src = url + (url.indexOf('?') < 0 ? '?' : '&') + 'embed=1&play=1';
    f.title = title + ': playable preview';
    f.setAttribute('allow', 'autoplay; fullscreen');
    f.setAttribute('allowfullscreen', '');
    frame.innerHTML = '';
    frame.appendChild(f);
    if (tools) tools.hidden = false;
    f.focus();
  }
  function reset() {
    frame.innerHTML = original;
    if (tools) tools.hidden = true;
    bind();
  }
  function bind() { var p = frame.querySelector('.gp-poster'); if (p) p.addEventListener('click', start); }
  bind();
  var close = document.querySelector('[data-gp-reset]');
  if (close) close.addEventListener('click', reset);
  var fs = document.querySelector('[data-gp-full]');
  if (fs) fs.addEventListener('click', function (e) {
    var f = frame.querySelector('iframe');
    if (f && f.requestFullscreen) { e.preventDefault(); f.requestFullscreen().catch(function () { window.location.href = url; }); }
  });
  document.querySelectorAll('[data-gp-start]').forEach(function (a) { a.addEventListener('click', function () { setTimeout(start, 350); }); });
})();
