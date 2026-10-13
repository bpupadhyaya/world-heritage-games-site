// Synthesised sound for every game (no audio files). Silent no-op in headless tests.
//
// Kit audio 2.0 (2026-10-12). Root cause of "no sound on phones" (proved on the iOS simulator and the Android emulator,
// docs/NATIVE-WRAPPER.md "Sound on devices"):
//   * The old unlock was ONE `{once:true}` listener on the canvas `pointerdown`. A touch pointerdown is not a user
//     activation (Chrome: pointerup/touchend/click; WebKit: touchend/click), so the context was created OUTSIDE a gesture.
//     On iOS WebKit such a context reports state `interrupted` (not `suspended`) and the old `ensure()` only resumed
//     `suspended`, so it stayed silent forever (currentTime 0, oscillators started into a dead context).
//   * The listener was consumed by that first, useless pointerdown and never retried.
// Fix: persistent capture-phase listeners on the document for every real activation event (touchend, pointerup, click,
// mousedown, keydown) that create/resume the context and play a silent buffer (the iOS unlock idiom) whenever the state is
// not `running`; resume on visibilitychange and on `statechange`; `navigator.audioSession.type = 'playback'` so the iOS
// mute switch does not silence an instrument (native shells also set the AVAudioSession category, see the stagers).
//
// Shared graph (all voices go through it): out -> highpass(25 Hz) -> compressor (limiter) -> master -> destination,
// and a gentle reverb send (generated impulse, seeded noise) mixed in parallel.
// API: tone() (kept), `context`, `out` (dry bus), `send` (reverb bus), `running`, `noise()` (shared noise buffer),
// `voices` (live voice counter used by platform/engine-kit/synth.js for polyphony limits).
export function createAudio() {
  const AudioCtx = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  let ctx = null;
  let muted = false;
  let graph = null;
  let noiseBuf = null;
  let active = 0;               // tone() voices currently sounding
  let lastError = null;

  const buildGraph = (ac) => {
    const out = ac.createGain();          // dry bus every voice connects to
    out.gain.value = 1;
    const hp = ac.createBiquadFilter();   // removes sub-audible rumble that eats headroom
    hp.type = 'highpass'; hp.frequency.value = 25;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 14; comp.ratio.value = 6; comp.attack.value = 0.004; comp.release.value = 0.18;
    const master = ac.createGain();
    master.gain.value = muted ? 0 : 0.9;
    out.connect(hp); hp.connect(comp); comp.connect(master); master.connect(ac.destination);
    // reverb send: 1.6 s exponentially decaying stereo noise, lowpassed; quiet by design
    const send = ac.createGain(); send.gain.value = 1;
    let conv = null;
    try {
      const sr = ac.sampleRate, len = Math.floor(sr * 1.6), buf = ac.createBuffer(2, len, sr);
      let s = 0x9e3779b9;
      for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < len; i++) {
          s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
          const r = s / 2147483648 - 1, e = Math.exp(-3.6 * i / len);
          d[i] = r * e * (i < 200 ? i / 200 : 1);
        }
      }
      conv = ac.createConvolver(); conv.buffer = buf;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200;
      const wet = ac.createGain(); wet.gain.value = 0.22;
      send.connect(conv); conv.connect(lp); lp.connect(wet); wet.connect(comp);
    } catch (e) { lastError = e; }
    return { out, send, master, comp };
  };

  const applySession = () => {
    try { if (globalThis.navigator?.audioSession) globalThis.navigator.audioSession.type = 'playback'; } catch { /* old WebKit */ }
  };

  const kick = (ac) => {
    // iOS: a started (even silent) source inside a gesture is what unlocks output
    try {
      const b = ac.createBuffer(1, 1, 22050), src = ac.createBufferSource();
      src.buffer = b; src.connect(ac.destination); src.start(0);
    } catch (e) { lastError = e; }
  };

  const ensure = () => {
    if (!AudioCtx) return null;
    if (!ctx) {
      try {
        ctx = new AudioCtx({ latencyHint: 'interactive' });
      } catch {
        try { ctx = new AudioCtx(); } catch (e) { lastError = e; return null; }
      }
      applySession();
      graph = buildGraph(ctx);
      try { ctx.addEventListener('statechange', () => { if (ctx.state !== 'running') applySession(); }); } catch { /* ignore */ }
    }
    // 'suspended' (autoplay policy) and 'interrupted' (WebKit, created outside a gesture / after a call) both need resume()
    if (ctx.state !== 'running') {
      try { const p = ctx.resume(); if (p?.catch) p.catch(() => {}); } catch (e) { lastError = e; }
    }
    return ctx;
  };

  // Persistent real-gesture unlock (see header). Cheap: does nothing once the context is running.
  const onGesture = () => {
    if (!AudioCtx) return;
    const wasRunning = ctx?.state === 'running';
    const ac = ensure();
    if (ac && !wasRunning) { applySession(); kick(ac); }
  };
  const doc = globalThis.document;
  if (AudioCtx && doc?.addEventListener) {
    for (const ev of ['touchend', 'pointerup', 'click', 'mousedown', 'keydown']) doc.addEventListener(ev, onGesture, { capture: true, passive: true });
    doc.addEventListener('visibilitychange', () => { if (!doc.hidden && ctx && ctx.state !== 'running') ensure(); });
    globalThis.addEventListener?.('pageshow', () => { if (ctx && ctx.state !== 'running') ensure(); });
  }

  const audio = {
    // Kept for compatibility (boot.js binds it to the canvas): same as a gesture.
    unlock: onGesture,
    setMuted(value) {
      muted = value;
      if (graph) graph.master.gain.value = muted ? 0 : 0.9;
    },
    get muted() { return muted; },
    get context() { return ctx ?? (ensure()); },
    get out() { return (ctx ?? ensure()) && graph.out; },
    get send() { return (ctx ?? ensure()) && graph.send; },
    // true only when output is really flowing (a voice scheduled into a suspended context would burst out late)
    get running() { return !!ctx && ctx.state === 'running'; },
    get state() { return ctx ? ctx.state : AudioCtx ? 'none' : 'unsupported'; },
    get lastError() { return lastError; },
    // shared 2 s noise buffer (seeded; audio only, never touches game state)
    noise() {
      const ac = ensure();
      if (!ac) return null;
      if (!noiseBuf || noiseBuf.sampleRate !== ac.sampleRate) {
        const len = Math.floor(ac.sampleRate * 2);
        noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
        const d = noiseBuf.getChannelData(0);
        let s = 0x1234567;
        for (let i = 0; i < len; i++) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; d[i] = s / 2147483648 - 1; }
      }
      return noiseBuf;
    },
    get voices() { return active; },
    set voices(v) { active = v; },
    tone({ freq = 440, to = null, dur = 0.12, type = 'sine', vol = 0.2 } = {}) { // pass raw: true to bypass the router
      if (muted) return;
      const ac = ensure();
      if (!ac || ac.state !== 'running' || !graph || active > 48) return;
      // engines that installed the natural-voice router (platform/engine-kit/synth.js) get instrument-like sounds, not bleeps
      if (audio.naturalTone && !arguments[0]?.raw) { try { if (audio.naturalTone(arguments[0] ?? {})) return; } catch { /* fall through to the plain tone */ } }
      const t = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain); gain.connect(graph.out);
      active++;
      osc.onended = () => { active = Math.max(0, active - 1); try { gain.disconnect(); } catch { /* gone */ } };
      osc.start(t);
      osc.stop(t + dur + 0.02);
    },
  };
  return audio;
}
