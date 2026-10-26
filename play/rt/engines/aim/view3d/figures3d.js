// Real 3D people for the aim engine (1.8.0, opt-in through `look.figures: 'view3d'`).
// view3d athletes (Rocketbox, MIT) are rendered into small sprite sets ONCE at load (offscreen WebGL, one frame per clip time and
// camera azimuth), trimmed, and then simply blitted by the 2D scene: no WebGL per frame, no rig update per frame. If WebGL or the
// assets are missing, `initFigures()` resolves null and the engine keeps its vector figures.
//   const bank = await initFigures();                       // null when unavailable
//   const set = await bank.bake({ char, kit, skin, hair, az, clip, n | times, prop, marker });   // -> { frames, ppm, dur, events }
//   frame = set.frames[i] = { c: canvas, w, h, ax, ay (feet anchor in the sprite), mx, my (marker point, e.g. club head) }
// Rendering is serialised through one hidden stage; results are cached by their spec.

const FW = 640, FH = 620;           // render frame in pixels
const PPM = 230;                    // pixels per metre in the sprite (the figure is about 1.75 m)
const DIST = 14, FOV = 2 * Math.atan((FH / PPM / 2) / DIST) * 180 / Math.PI;
const LOOK_Y = 1.05;

let ready = null;

export function initFigures() {
  if (ready) return ready;
  ready = (async () => {
    const doc = globalThis.document;
    if (!doc || typeof doc.createElement !== 'function') return null;
    let V3;
    try { V3 = await import('./vendor3d/index.js'); } catch (e) { console.warn('aim: view3d failed to load', e); return null; }
    try { if (!V3.webglSupported()) return null; } catch { return null; }
    const { createStage, loadHuman, addSportClips, addThrowClips, addBatClips, addFieldClips, makeCricketBat, makeStick, THREE } = V3;
    const box = doc.createElement('div');
    box.style.cssText = `position:fixed;left:-10000px;top:0;width:${FW}px;height:${FH}px;pointer-events:none;visibility:hidden`;
    doc.body.appendChild(box);
    const canvas = doc.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block';
    box.appendChild(canvas);
    let stage;
    try { stage = createStage({ canvas, container: box, quality: 'high', dprCap: 1, lighting: 'day', transparent: true, shadows: false, mode: 'ondemand', preserveDrawingBuffer: true, fov: FOV }); } catch (e) { console.warn('aim: stage failed', e); return null; }
    if (!stage.supported) return null;
    stage.setSize(FW, FH);
    stage.scene.background = null;
    stage.camera.fov = FOV; stage.camera.aspect = FW / FH; stage.camera.updateProjectionMatrix();
    stage.camera.position.set(0, LOOK_Y, DIST); stage.camera.lookAt(0, LOOK_Y, 0);

    const humans = new Map();         // char -> human
    const cache = new Map();          // spec key -> Promise<set>
    let chain = Promise.resolve();
    let lightingNow = 'day';

    const getHuman = async (char) => {
      if (humans.has(char)) return humans.get(char);
      const h = await loadHuman({ character: char, kit: { top: '#c8322b', bottoms: '#f4f0e2', socks: '#f4f0e2' }, skin: 'tan', hair: 'black' });
      addSportClips(h); addThrowClips(h); addBatClips(h); addFieldClips(h);
      stage.add(h);
      humans.set(char, h);
      return h;
    };

    const makeProp = (p) => {
      const g = new THREE.Group();
      const mat = (c, r = 0.6, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
      const tip = new THREE.Object3D();
      if (p.kind === 'ball') {
        const r = p.radius ?? 0.12, c = doc.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
        const col = p.color ?? '#f2f0e6'; x.fillStyle = col; x.fillRect(0, 0, 256, 128); x.strokeStyle = p.line ?? 'rgba(20,20,20,0.85)'; x.lineWidth = 3;
        if (p.pattern === 'seams') { x.beginPath(); for (const u of [0, 64, 128, 192]) { x.moveTo(u, 0); x.lineTo(u, 128); } x.moveTo(0, 64); x.lineTo(256, 64); x.stroke(); }
        else if (p.pattern === 'volley') { x.strokeStyle = '#2d6bb0'; x.lineWidth = 12; x.beginPath(); for (const u of [30, 94, 158, 222]) { x.moveTo(u - 20, 0); x.quadraticCurveTo(u + 30, 64, u - 20, 128); } x.stroke(); }
        else if (p.pattern === 'panels') { x.fillStyle = '#222'; for (const [u, v] of [[32, 40], [96, 90], [160, 40], [224, 90], [96, 20], [224, 20]]) { x.beginPath(); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 - 1.57; x.lineTo(u + Math.cos(a) * 16, v + Math.sin(a) * 16); } x.fill(); } }
        const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
        const m = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 })); m.castShadow = true;
        return { obj: m, tip: m, two: false };
      }
      if (p.kind === 'bat') { const b = makeCricketBat({ wood: p.color ?? 0xd9b27a }); b.scale.setScalar(p.scale ?? 1); b.userData.tip = b.children[0]; return { obj: b, tip: (() => { const t = new THREE.Object3D(); t.position.y = 0.62 * (p.scale ?? 1); b.add(t); return t; })(), two: true }; }
      if (p.kind === 'stick') { const L = p.length ?? 0.95, s = makeStick({ length: L, radius: p.radius ?? 0.016, color: p.color ?? 0x8a5a2b }); s.position.y = 0; tip.position.y = L * 0.8; s.add(tip); return { obj: s, tip, two: false }; }
      if (p.kind === 'mallet') {
        const L = p.length ?? 0.92, shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, L, 12), mat(p.wood ?? 0xa5763d)); shaft.position.y = L / 2;
        const head = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.26, 20), mat(p.wood ?? 0xa5763d, 0.5)); head.rotation.z = Math.PI / 2; head.position.y = L;
        const band1 = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.025, 20), mat(p.band ?? 0xf4f0e2)); band1.rotation.z = Math.PI / 2; band1.position.set(-0.07, L, 0);
        const band2 = band1.clone(); band2.position.x = 0.07;
        const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 12), mat(0x222831)); grip.position.y = 0.11;
        g.add(shaft, head, band1, band2, grip); tip.position.y = L - 0.02; g.add(tip); return { obj: g, tip, two: true };
      }
      if (p.kind === 'club') {
        const L = p.length ?? 0.95, shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.011, L, 10), mat(0xb8bcc4, 0.35, 0.7)); shaft.position.y = L / 2;
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.015), mat(p.head ?? 0x6a6e78, 0.4, 0.6)); head.position.set(0.03, L, 0); head.rotation.z = -0.5;
        const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 12), mat(0x2a2218)); grip.position.y = 0.125;
        g.add(shaft, head, grip); tip.position.set(0.03, L, 0); g.add(tip); return { obj: g, tip, two: true };
      }
      return null;
    };

    const clearProps = (h) => { for (const pr of [...h.props]) h.detach(pr.prop); };

    const render = async (spec) => {
      const h = await getHuman(spec.char || 'athlete_m');
      for (const o of humans.values()) o.root.visible = o === h;   // only the figure being baked is in the picture
      if ((spec.lighting || 'day') !== lightingNow) { stage.setLighting(spec.lighting || 'day'); lightingNow = spec.lighting || 'day'; }
      stage.scene.background = null; stage.scene.fog = null;
      h.setKit(spec.kit || {}); if (spec.skin) h.setSkin(spec.skin); if (spec.hair) h.setHair(spec.hair);
      h.update(1e-4); stage.invalidate(); stage.render();   // warm-up: the repainted kit and skin textures must be uploaded before the first captured frame
      clearProps(h);
      let prop = null;
      if (spec.prop) {
        prop = makeProp(spec.prop);
        if (prop) { h.attach(prop.obj, spec.hand || 'R', spec.grip || 'bat'); if (prop.two) h.holdTwoHanded(prop.obj, spec.hand === 'L' ? 'R' : 'L', { gap: 0.1 }); }
      }
      if (spec.cap) { try { V3.addCap(h, { color: spec.cap }); } catch { /* optional */ } }
      h.setPosition(0, 0, 0);
      h.setFacing((180 + (spec.az || 0)) * Math.PI / 180);
      const clip = h.getClip(spec.clip);
      const dur = clip.dur;
      const times = spec.times ?? Array.from({ length: spec.n ?? 8 }, (_, i) => (spec.t0 ?? 0) + (((spec.t1 ?? dur) - (spec.t0 ?? 0)) * i) / Math.max(1, (spec.n ?? 8) - 1));
      const out = { frames: [], ppm: PPM, dur, events: { ...(clip.events || {}) }, times };
      const proj = (v) => { const q = v.clone().project(stage.camera); return { x: (q.x * 0.5 + 0.5) * FW, y: (-q.y * 0.5 + 0.5) * FH }; };
      const feet = proj(new THREE.Vector3(0, 0, 0));
      const tmp = doc.createElement('canvas'); tmp.width = FW; tmp.height = FH;
      const tctx = tmp.getContext('2d', { willReadFrequently: true });
      let propOn = !!prop;
      for (const t of times) {
        if (propOn && spec.propUntil !== undefined && t >= spec.propUntil) { clearProps(h); propOn = false; }
        h.play(spec.clip, { loop: false, fade: 0, startTime: Math.min(t, dur - 1e-3) });
        h.update(1e-4);
        h.root.updateMatrixWorld(true);
        stage.invalidate(); stage.render();
        tctx.clearRect(0, 0, FW, FH); tctx.drawImage(canvas, 0, 0);
        const px = tctx.getImageData(0, 0, FW, FH).data;
        let x0 = FW, y0 = FH, x1 = 0, y1 = 0;
        for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) if (px[(y * FW + x) * 4 + 3] > 12) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (x1 <= x0) { x0 = 0; y0 = 0; x1 = FW - 1; y1 = FH - 1; }
        x0 = Math.max(0, x0 - 2); y0 = Math.max(0, y0 - 2); x1 = Math.min(FW - 1, x1 + 2); y1 = Math.min(FH - 1, y1 + 2);
        const w = x1 - x0 + 1, hh = y1 - y0 + 1, c = doc.createElement('canvas'); c.width = w; c.height = hh;
        c.getContext('2d').drawImage(tmp, x0, y0, w, hh, 0, 0, w, hh);
        const fr = { c, w, h: hh, ax: feet.x - x0, ay: feet.y - y0 };
        let mk = null;
        if (spec.marker === 'prop' && prop && propOn) { const v = new THREE.Vector3(); prop.tip.getWorldPosition(v); mk = proj(v); }
        else if (spec.marker === 'rhand') { const b = h.bones.Bip01_R_Hand; if (b) { const v = new THREE.Vector3(); b.getWorldPosition(v); mk = proj(v); } }
        else if (spec.marker === 'rfoot' || spec.marker === 'lfoot') { const b = h.bones[spec.marker === 'rfoot' ? 'Bip01_R_Toe0' : 'Bip01_L_Toe0']; if (b) { const v = new THREE.Vector3(); b.getWorldPosition(v); mk = proj(v); } }
        if (mk) { fr.mx = mk.x - x0; fr.my = mk.y - y0; }
        out.frames.push(fr);
      }
      clearProps(h);
      return out;
    };

    return {
      ppm: PPM,
      /** Bake one sprite set (cached). Calls are serialised. */
      bake(spec) {
        const key = JSON.stringify(spec);
        if (!cache.has(key)) cache.set(key, new Promise((resolve, reject) => { chain = chain.then(() => render(spec)).then(resolve, (e) => { console.warn('aim: bake failed', e); resolve(null); void reject; }); }));
        return cache.get(key);
      },
      stats: () => ({ sets: cache.size }),
    };
  })();
  return ready;
}

/** Load the bank and bake everything `look` asks for; resolves null after `ms` ms or on any failure (the engine then keeps its vector figures). */
export async function loadFigures(look, ms = 12000) {
  const { prepareFigures } = await import('../src/figureplay.js');
  const t0 = performance.now();
  let timer = null;
  const run = (async () => { const bank = await initFigures(); return bank ? prepareFigures(bank, look) : null; })();
  const figs = await Promise.race([run, new Promise((r) => { timer = setTimeout(() => r(null), ms); })]).catch((e) => { console.warn('aim: 3D figures unavailable', e); return null; });
  clearTimeout(timer);
  if (figs && globalThis.__aimFigDebug) console.log('aim figures ready', Math.round(performance.now() - t0), 'ms', Math.round(figs.bytes / 1e6), 'MB');
  return figs;
}
