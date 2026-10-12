// Procedural drawing for Tempo Race: scenery, track strips, racers as shapes with direction. Canvas primitives only.
export const hash = (n) => { let h = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };

const poly = (ctx, pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };

// Scenery piece standing at (x, y) with size s (about one lane wide). kind picks the shape.
export function scenery(ctx, kind, x, y, s, r) {
  ctx.lineCap = 'round';
  switch (kind) {
    case 'reeds':
      ctx.strokeStyle = '#2f6b38'; ctx.lineWidth = Math.max(2, s * 0.08);
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x + i * s * 0.18, y + s * 0.4); ctx.quadraticCurveTo(x + i * s * 0.3, y, x + i * s * 0.18 + (r - 0.5) * s * 0.4, y - s * 0.5); ctx.stroke(); }
      ctx.fillStyle = '#7a5a2a'; ctx.beginPath(); ctx.ellipse(x, y - s * 0.45, s * 0.07, s * 0.16, 0, 0, 7); ctx.fill(); break;
    case 'palms':
      ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = Math.max(3, s * 0.12); ctx.beginPath(); ctx.moveTo(x, y + s * 0.5); ctx.quadraticCurveTo(x + s * 0.15, y, x + (r - 0.5) * s * 0.3, y - s * 0.55); ctx.stroke();
      ctx.strokeStyle = '#2e7d3a'; ctx.lineWidth = Math.max(2, s * 0.08);
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.7; ctx.beginPath(); ctx.moveTo(x + (r - 0.5) * s * 0.3, y - s * 0.55); ctx.quadraticCurveTo(x + Math.cos(a) * s * 0.4, y - s * 0.55 + Math.sin(a) * s * 0.3 - s * 0.1, x + Math.cos(a) * s * 0.7, y - s * 0.55 + Math.sin(a) * s * 0.55 + s * 0.2); ctx.stroke(); }
      break;
    case 'pines':
      ctx.fillStyle = '#6b4a2a'; ctx.fillRect(x - s * 0.05, y + s * 0.25, s * 0.1, s * 0.25);
      for (let i = 0; i < 3; i++) { ctx.fillStyle = i % 2 ? '#2a5a3e' : '#1f4a34'; poly(ctx, [[x, y - s * 0.6 + i * s * 0.25], [x + s * (0.28 + i * 0.1), y - s * 0.05 + i * s * 0.25], [x - s * (0.28 + i * 0.1), y - s * 0.05 + i * s * 0.25]]); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; poly(ctx, [[x, y - s * 0.6], [x + s * 0.12, y - s * 0.3], [x - s * 0.12, y - s * 0.3]]); ctx.fill(); break;
    case 'dunes':
      ctx.fillStyle = r > 0.5 ? '#c99a52' : '#d9ad66'; ctx.beginPath(); ctx.ellipse(x, y + s * 0.2, s * (0.7 + r * 0.5), s * (0.28 + r * 0.14), 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(x + s * 0.2, y + s * 0.2, s * 0.4, s * 0.12, 0, Math.PI, 0); ctx.fill(); break;
    case 'trees':
      ctx.fillStyle = '#5a3d22'; ctx.fillRect(x - s * 0.06, y, s * 0.12, s * 0.45);
      ctx.fillStyle = r > 0.5 ? '#3d8a3a' : '#2f7432'; ctx.beginPath(); ctx.arc(x, y - s * 0.1, s * (0.34 + r * 0.1), 0, 7); ctx.fill(); break;
    case 'crowd': {
      const cols = ['#e0603a', '#f2c14e', '#58c27d', '#b07be0', '#ef8fb5', '#4fc3d9', '#f5f1e8'];
      ctx.fillStyle = '#3a3f4a'; ctx.fillRect(x - s * 0.6, y - s * 0.1, s * 1.2, s * 0.5);
      for (let i = 0; i < 5; i++) { ctx.fillStyle = cols[Math.floor(hash(i * 7 + Math.floor(r * 1000)) * cols.length)]; ctx.beginPath(); ctx.arc(x - s * 0.48 + i * s * 0.24, y - s * 0.12 - (i % 2) * s * 0.06, s * 0.1, 0, 7); ctx.fill(); }
      break; }
    case 'fence':
      ctx.strokeStyle = '#d8d1c0'; ctx.lineWidth = Math.max(2, s * 0.07); ctx.beginPath(); ctx.moveTo(x - s * 0.6, y); ctx.lineTo(x + s * 0.6, y); ctx.moveTo(x - s * 0.5, y - s * 0.2); ctx.lineTo(x - s * 0.5, y + s * 0.2); ctx.moveTo(x, y - s * 0.2); ctx.lineTo(x, y + s * 0.2); ctx.moveTo(x + s * 0.5, y - s * 0.2); ctx.lineTo(x + s * 0.5, y + s * 0.2); ctx.stroke(); break;
    default: break;
  }
}

// Surface texture mark in a lane area (water ripples, ice scratches, sand speckles, snow flecks, grass ticks).
export function texture(ctx, terrain, x, y, s, r, col) {
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(1.5, s * 0.05); ctx.lineCap = 'round';
  switch (terrain) {
    case 'water': ctx.beginPath(); ctx.arc(x, y, s * (0.2 + r * 0.15), 0.2, 2.6); ctx.stroke(); break;
    case 'ice': ctx.beginPath(); ctx.moveTo(x - s * 0.3, y); ctx.lineTo(x + s * (0.1 + r * 0.4), y + s * 0.05 * (r - 0.5)); ctx.stroke(); break;
    case 'sand': case 'mud': ctx.beginPath(); ctx.arc(x, y, s * 0.04 + r * s * 0.04, 0, 7); ctx.fill(); break;
    case 'snow': ctx.beginPath(); ctx.ellipse(x, y, s * 0.2, s * 0.06, 0, 0, 7); ctx.fill(); break;
    default: ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r - 0.5) * s * 0.2, y - s * 0.22); ctx.stroke(); break;
  }
}

// A racer drawn in local coordinates with +x pointing along the direction of travel.
// ph = animation phase (radians, tied to distance covered), ex = { lean, trim, gallop, whip (speed lines while a burst lasts) }
export function racer(ctx, kind, x, y, ang, s, col, ph, ex = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const dark = 'rgba(0,0,0,0.35)';
  switch (kind) {
    case 'paddle': {
      // long hull with a bow ornament; paddlers each side with paddles swinging in alternation
      ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(-s * 0.1, s * 0.12, s * 1.45, s * 0.42, 0, 0, 7); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(s * 1.6, 0); ctx.quadraticCurveTo(s * 0.7, s * 0.42, -s * 1.4, s * 0.32); ctx.lineTo(-s * 1.4, -s * 0.32); ctx.quadraticCurveTo(s * 0.7, -s * 0.42, s * 1.6, 0); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-s * 1.2, -s * 0.06, s * 2.4, s * 0.12);
      for (let i = 0; i < 4; i++) {
        const bx = s * (0.8 - i * 0.6), sw = Math.sin(ph + (i % 2) * Math.PI) * s * 0.35;
        ctx.strokeStyle = '#d9c28a'; ctx.lineWidth = Math.max(2, s * 0.09);
        ctx.beginPath(); ctx.moveTo(bx, -s * 0.28); ctx.lineTo(bx + sw, -s * 0.78); ctx.moveTo(bx, s * 0.28); ctx.lineTo(bx - sw, s * 0.78); ctx.stroke();
        ctx.fillStyle = '#f5f1e8'; ctx.beginPath(); ctx.arc(bx, 0, s * 0.17, 0, 7); ctx.fill();
      }
      ctx.fillStyle = '#f2c14e'; ctx.beginPath(); ctx.arc(s * 1.55, 0, s * 0.13, 0, 7); ctx.fill();
      break; }
    case 'runner': {
      const sw = Math.sin(ph);
      ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(0, s * 0.1, s * 0.55, s * 0.35, 0, 0, 7); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.42, s * 0.5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#f5f1e8'; ctx.beginPath(); ctx.arc(s * 0.08, 0, s * 0.22, 0, 7); ctx.fill();
      ctx.fillStyle = '#2a2a2a';
      ctx.beginPath(); ctx.ellipse(s * 0.55 * sw, -s * 0.34, s * 0.3, s * 0.14, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-s * 0.55 * sw, s * 0.34, s * 0.3, s * 0.14, 0, 0, 7); ctx.fill();
      break; }
    case 'animal': {
      const look = ex.look ?? 'camel', g = ex.gallop ? 1 : 0.55;
      const body = (bx, by, k, fur, headLen) => {
        ctx.save(); ctx.translate(bx, by); ctx.scale(k, k);
        ctx.strokeStyle = '#2d2118'; ctx.lineWidth = Math.max(2, s * 0.1);
        for (const [lx, ph2] of [[0.6, 0], [0.5, 1.6], [-0.55, 3.1], [-0.65, 4.7]]) {
          const off = Math.sin(ph * 1.3 + ph2) * s * 0.35 * g;
          ctx.beginPath(); ctx.moveTo(s * lx, -s * 0.12); ctx.lineTo(s * lx + off, -s * 0.5); ctx.moveTo(s * lx, s * 0.12); ctx.lineTo(s * lx - off, s * 0.5); ctx.stroke();
        }
        ctx.fillStyle = fur; ctx.strokeStyle = fur;
        ctx.beginPath(); ctx.ellipse(0, 0, s * 0.95, s * 0.36, 0, 0, 7); ctx.fill();
        if (headLen > 0) { ctx.lineWidth = Math.max(3, s * 0.2); ctx.beginPath(); ctx.moveTo(s * 0.7, 0); ctx.quadraticCurveTo(s * (0.7 + headLen / 2), Math.sin(ph * 1.3) * s * 0.1, s * (0.7 + headLen), 0); ctx.stroke(); }
        ctx.beginPath(); ctx.ellipse(s * (0.75 + headLen), 0, s * 0.22, s * 0.15, 0, 0, 7); ctx.fill();
        ctx.restore();
      };
      ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(0, s * 0.12, s * 1.0, s * 0.4, 0, 0, 7); ctx.fill();
      if (look === 'buffalo') {
        ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = Math.max(2, s * 0.08); ctx.beginPath(); ctx.moveTo(-s * 0.6, -s * 0.45); ctx.lineTo(-s * 0.6, s * 0.45); ctx.stroke();
        body(0, -s * 0.5, 0.72, '#33343a', 0.15); body(0, s * 0.5, 0.72, '#3d3e45', 0.15);
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(-s * 1.3, 0, s * 0.24, 0, 7); ctx.fill();
      } else if (look === 'dog') {
        ctx.fillStyle = '#7a5a3a'; ctx.fillRect(-s * 1.9, -s * 0.28, s * 0.9, s * 0.56);
        ctx.strokeStyle = '#bbb'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-s * 1.0, 0); ctx.lineTo(s * 0.2, 0); ctx.stroke();
        body(s * 0.1, -s * 0.18, 0.4, '#d9d4c8', 0.1); body(s * 0.1, s * 0.18, 0.4, '#5a5048', 0.1);
        body(s * 0.9, -s * 0.18, 0.4, '#5a5048', 0.1); body(s * 0.9, s * 0.18, 0.4, '#d9d4c8', 0.1);
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(-s * 1.45, 0, s * 0.22, 0, 7); ctx.fill();
      } else {
        body(0, 0, 1, '#b08a5a', 0.75);
        ctx.fillStyle = '#8f6b3e'; ctx.beginPath(); ctx.ellipse(s * 0.25, 0, s * 0.3, s * 0.3, 0, 0, 7); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(-s * 0.05, 0, s * 0.22, 0, 7); ctx.fill();
      }
      if (ex.whip) { ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-s * 1.1, (i - 1) * s * 0.3); ctx.lineTo(-s * 1.8, (i - 1) * s * 0.3); ctx.stroke(); } }
      break; }
    case 'sailor': {
      ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(-s * 0.1, s * 0.12, s * 1.1, s * 0.34, 0, 0, 7); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(s * 1.2, 0); ctx.quadraticCurveTo(s * 0.4, s * 0.36, -s * 0.9, s * 0.28); ctx.lineTo(-s * 0.9, -s * 0.28); ctx.quadraticCurveTo(s * 0.4, -s * 0.36, s * 1.2, 0); ctx.fill();
      const a = (ex.trim ?? 0) * 0.9;     // boom angle from the keel line
      ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = Math.max(2, s * 0.08);
      ctx.beginPath(); ctx.moveTo(s * 0.2, 0); ctx.lineTo(s * 0.2 - Math.cos(a) * s * 1.3, Math.sin(a) * s * 1.3); ctx.stroke();
      ctx.fillStyle = 'rgba(250,245,230,0.92)'; ctx.beginPath(); ctx.moveTo(s * 0.2, 0); ctx.lineTo(s * 0.2 - Math.cos(a) * s * 1.3, Math.sin(a) * s * 1.3); ctx.lineTo(s * 0.2 - Math.cos(a) * s * 0.8 + Math.sin(a) * s * 0.35, Math.sin(a) * s * 0.8 + Math.cos(a) * s * 0.35); ctx.closePath(); ctx.fill();
      break; }
    case 'skater': {
      const sw = Math.sin(ph), push = ex.push ?? 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(2, s * 0.07);
      ctx.beginPath(); ctx.moveTo(-s * 0.4, -s * 0.3 - sw * s * 0.1); ctx.lineTo(s * 0.5, -s * 0.3 - sw * s * 0.1); ctx.moveTo(-s * 0.4 - push * s * 0.2, s * 0.3); ctx.lineTo(s * 0.5, s * 0.3 + sw * s * 0.1); ctx.stroke();
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.45, s * 0.32, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#f5f1e8'; ctx.beginPath(); ctx.arc(s * 0.15, 0, s * 0.2, 0, 7); ctx.fill();
      break; }
    case 'sled': {
      const tilt = (ex.lean ?? 0) * 0.35;
      ctx.rotate(tilt);
      ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(0, s * 0.14, s * 0.9, s * 0.42, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#8a8f99'; ctx.lineWidth = Math.max(2, s * 0.1);
      ctx.beginPath(); ctx.moveTo(-s * 0.8, -s * 0.34); ctx.lineTo(s * 0.8, -s * 0.34); ctx.moveTo(-s * 0.8, s * 0.34); ctx.lineTo(s * 0.8, s * 0.34); ctx.stroke();
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(s * 1.0, 0); ctx.quadraticCurveTo(s * 0.5, s * 0.34, -s * 0.7, s * 0.28); ctx.lineTo(-s * 0.7, -s * 0.28); ctx.quadraticCurveTo(s * 0.5, -s * 0.34, s * 1.0, 0); ctx.fill();
      ctx.fillStyle = '#f5f1e8'; ctx.beginPath(); ctx.arc(-s * 0.05, 0, s * 0.2, 0, 7); ctx.fill();
      break; }
    default: break;
  }
  ctx.restore();
}

export function checker(ctx, x, y, w, h, cell) {
  for (let i = 0; i * cell < w; i++) for (let j = 0; j * cell < h; j++) { ctx.fillStyle = (i + j) % 2 ? '#111' : '#fff'; ctx.fillRect(x + i * cell, y + j * cell, Math.min(cell, w - i * cell), Math.min(cell, h - j * cell)); }
}

// The lead object that runs ahead of the racers (course.lead). Drawn at (x, y), s = radius in px, +x = direction of travel.
// roll = rolling angle (radians, from distance covered), hop = 0..1 height of the current bounce, ex = { vehicle, fl }.
export function leadObject(ctx, kind, x, y, ang, s, color, roll, hop = 0, ex = {}) {
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const lift = hop * s * 0.55;
  // ground shadow stays on the ground while the body hops
  if (kind === 'hoop') { ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = Math.max(3, s * 0.3); ctx.beginPath(); ctx.arc(x + s * 0.15, y + s * 0.25, s * 0.82, 0, 7); ctx.stroke(); }
  else if (kind !== 'pacemaker') {
    ctx.fillStyle = 'rgba(0,0,0,' + (0.3 - hop * 0.12).toFixed(2) + ')';
    ctx.beginPath(); ctx.ellipse(x + s * 0.12, y + s * 0.2, s * (kind === 'lure' ? 0.6 : 1) * (1 - hop * 0.15), s * (kind === 'lure' ? 0.3 : 0.55) * (1 - hop * 0.15), 0, 0, 7); ctx.fill();
  }
  const bx = x - lift * 0.25, by = y - lift;
  switch (kind) {
    case 'cheese': {
      // a round of cheese seen face-on, turning as it rolls: rind, eyes and a cut wedge that shows it spinning
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(bx, by, s, 0, 7); ctx.fill();
      ctx.strokeStyle = '#b9791f'; ctx.lineWidth = Math.max(2, s * 0.2); ctx.beginPath(); ctx.arc(bx, by, s * 0.93, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(150,90,10,0.45)';
      for (let i = 0; i < 3; i++) { const a = roll + i * 2.1 + 0.4; ctx.beginPath(); ctx.arc(bx + Math.cos(a) * s * 0.5, by + Math.sin(a) * s * 0.5, s * (0.1 + 0.03 * i), 0, 7); ctx.fill(); }
      ctx.fillStyle = '#7a4d0c'; ctx.beginPath(); ctx.moveTo(bx, by); ctx.arc(bx, by, s * 0.96, roll, roll + 0.95); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffe7a3'; ctx.beginPath(); ctx.moveTo(bx, by); ctx.arc(bx, by, s * 0.72, roll + 0.08, roll + 0.87); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(1.5, s * 0.07); ctx.beginPath(); ctx.arc(bx, by, s * 0.6, 3.4, 4.3); ctx.stroke();
      break; }
    case 'hoop': {
      ctx.strokeStyle = color; ctx.lineWidth = Math.max(3, s * 0.3); ctx.beginPath(); ctx.arc(bx, by, s * 0.82, 0, 7); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = Math.max(1.5, s * 0.07); ctx.beginPath(); ctx.arc(bx, by, s * 0.82, roll, roll + 1.4); ctx.stroke();
      ctx.fillStyle = 'rgba(30,20,10,0.65)';
      for (let i = 0; i < 3; i++) { const a = roll + i * 2.094; ctx.beginPath(); ctx.arc(bx + Math.cos(a) * s * 0.82, by + Math.sin(a) * s * 0.82, s * 0.1, 0, 7); ctx.fill(); }
      break; }
    case 'ball': {
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(bx, by, s * 0.85, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(30,30,30,0.7)'; ctx.lineWidth = Math.max(2, s * 0.1);
      for (let i = 0; i < 3; i++) { const a = roll + i * 1.05; ctx.beginPath(); ctx.ellipse(bx, by, s * 0.85, s * 0.3, a, 0, 7); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = Math.max(1.5, s * 0.08); ctx.beginPath(); ctx.arc(bx, by, s * 0.85, 3.6, 4.4); ctx.stroke();
      break; }
    case 'lure': {
      // a bright rag on a cord, streaming back from a short handle; the flutter follows distance
      const fl = ex.fl ?? 0;
      ctx.save(); ctx.translate(bx, by); ctx.rotate(ang);
      ctx.strokeStyle = '#5a3d22'; ctx.lineWidth = Math.max(2, s * 0.14); ctx.beginPath(); ctx.moveTo(s * 0.3, 0); ctx.lineTo(-s * 0.1, 0); ctx.stroke();
      ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-s * 0.1, -s * 0.12);
      for (let i = 1; i <= 4; i++) ctx.lineTo(-s * (0.1 + i * 0.5), -s * 0.12 + Math.sin(fl + i * 0.9) * s * 0.28 - i * s * 0.02);
      for (let i = 4; i >= 1; i--) ctx.lineTo(-s * (0.1 + i * 0.5), s * 0.5 + Math.sin(fl + i * 0.9 + 0.6) * s * 0.28);
      ctx.lineTo(-s * 0.1, s * 0.35); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1.5, s * 0.06); ctx.beginPath(); ctx.moveTo(-s * 0.3, s * 0.12); ctx.lineTo(-s * 1.8, s * 0.12 + Math.sin(fl + 2.5) * s * 0.2); ctx.stroke();
      ctx.restore();
      break; }
    case 'pacemaker': {
      // an extra craft of the same vehicle kind in a plain colour, with a white pennant on a mast
      racer(ctx, ex.vehicle ?? 'paddle', bx, by, ang, s, color, roll * 0.4, { lean: 0, trim: 0, gallop: true, whip: false, look: ex.look });
      ctx.save(); ctx.translate(bx, by); ctx.rotate(ang);
      ctx.strokeStyle = '#444'; ctx.lineWidth = Math.max(2, s * 0.08); ctx.beginPath(); ctx.moveTo(-s * 0.6, 0); ctx.lineTo(-s * 0.6, -s * 1.0); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-s * 0.6, -s * 1.0); ctx.lineTo(-s * 1.5, -s * 0.8); ctx.lineTo(-s * 0.6, -s * 0.6); ctx.closePath(); ctx.fill();
      ctx.restore();
      break; }
    default: break;
  }
  ctx.restore();
}
