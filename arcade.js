/* ============================================================================
   ALGOARCADE — ARCADE LAYER
   Boot BIOS · starfield · sprite FX · coin insert · tilt · ripples · lives
   Purely decorative + feedback: never blocks the learning app.
   ========================================================================== */
(function () {
'use strict';

const doc = document;
const $  = (s, r) => (r || doc).querySelector(s);
const $$ = (s, r) => Array.from((r || doc).querySelectorAll(s));

/* matchMedia that survives hosts without it (jsdom, ancient WebViews) */
const mq = (q) => {
  try {
    if (typeof window.matchMedia === 'function') return window.matchMedia(q);
  } catch (e) { /* noop */ }
  return { matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} };
};

const reduced = () => mq('(prefers-reduced-motion: reduce)').matches;
const noHover = () => mq('(hover: none)').matches;
const lowFx = () => doc.body.classList.contains('no-fx') || (window.innerWidth < 420 && window.innerHeight < 720);

/* canvases are optional everywhere — never let a missing 2D context break the app */
const ctx2d = (cv) => {
  if (!cv || !cv.getContext) return null;
  try { return cv.getContext('2d') || null; } catch (e) { return null; }
};

let state = { credits: 0, playing: false, fx: true };
const SKIP_KEY = 'aa.played';

/* ───────────────────────── pixel sprite factory ─────────────────────────
   Sprites are authored as strings (one char = one pixel) and blown up to
   an offscreen canvas. Authentic NES palette, zero assets.               */
const PAL = {
  k: '#0b0d14', w: '#f4f7ff', y: '#ffd166', o: '#ff9f1c', r: '#ff5c6c',
  p: '#f72585', v: '#b28dff', c: '#00e5c7', b: '#4da3ff', g: '#34d97b',
  n: '#8b5cf6', s: '#5a6178', d: '#2c3348', 1: '#1b2136', 2: '#3a4160', 3: '#6f7ba6'
};

const SPRITES = {
  coin: {
    pal: { y: PAL.y, o: PAL.o, k: PAL.k, w: PAL.w },
    rows: [
      '..oooo..',
      '.oyyyyo.',
      'oyywwyyo',
      'oyykkwyo',
      'oyykkwyo',
      'oyywwyyo',
      '.oyyyyo.',
      '..oooo..'
    ]
  },
  heart: { pal: { r: PAL.r, w: PAL.w, p: PAL.p }, rows: [
    '.rr.rr.',
    'rwwrwwr',
    'rwrrrrr',
    'rrrrrrr',
    '.rrrrr.',
    '..rrr..',
    '...r...',
    '........'
  ]},
  ghost: { pal: { p: PAL.p, w: PAL.w, k: PAL.k }, rows: [
    '.ppppp.',
    'pwwpwwp',
    'pwpppwp',
    'pwwpwwp',
    'ppppppp',
    'ppppppp',
    '.ppppp.',
    'pp.pp.p'
  ]},
  invader: { pal: { c: PAL.c, v: PAL.v, k: PAL.k }, rows: [
    '..v..v..',
    '...vv...',
    '..vvvv..',
    '.vvvvvv.',
    'vvvkvkvv',
    'vvvvvvvv',
    '.v.vv.v.',
    'v.v..v.v'
  ]},
  star: { pal: { y: PAL.y, o: PAL.o, w: PAL.w }, rows: [
    '...y...',
    '...y...',
    '.yyyyy.',
    '.yywyy.',
    'yyyyyyy',
    '.yyyyy.',
    '..y.y..',
    '.......'
  ]},
  bolt: { pal: { y: PAL.y, o: PAL.o, w: PAL.w }, rows: [
    '....yyy',
    '...yyy.',
    '..yyy..',
    '.yyyy..',
    'yyy....',
    'y......',
    'y......',
    '.......'
  ]},
  trophy: { pal: { y: PAL.y, o: PAL.o, 1: PAL[1], 2: PAL[2] }, rows: [
    '.yyyyy.',
    'yyyyyyy',
    '.yyyyy.',
    '..yyy..',
    '..yyy..',
    '..yyy..',
    '.yyyyy.',
    'yyyyyyy'
  ]},
  skull: { pal: { w: PAL.w, 2: PAL[2], 1: PAL[1] }, rows: [
    '.wwwww.',
    'wwwwwww',
    'wwwwwk.',
    'wwwwwww',
    'wwwwwww',
    '.wwwww.',
    '..www..',
    '.......'
  ]}
};

function spriteCanvas(name, scale) {
  const s = SPRITES[name]; if (!s) return null;
  const sc = scale || 3;
  const h = s.rows.length, w = s.rows[0].length;
  const cv = doc.createElement('canvas');
  cv.width = w * sc; cv.height = h * sc;
  cv.className = 'aa-sprite';
  const g = ctx2d(cv);
  if (!g) return cv;
  s.rows.forEach((row, y) => {
    row.split('').forEach((ch, x) => {
      const col = s.pal[ch]; if (!col) return;
      g.fillStyle = col;
      g.fillRect(x * sc, y * sc, sc, sc);
    });
  });
  return cv;
}

/* spin a sprite horizontally (classic coin flip) */
function spinSprite(cv, t) {
  const g = ctx2d(cv); if (!g) return;
  const w = cv.width, h = cv.height;
  g.save(); g.clearRect(0, 0, w, h);
  g.translate(w / 2, 0); g.scale(Math.abs(Math.cos(t)), 1); g.translate(-w / 2, 0);
  g.drawImage(cv._src || cv, 0, 0);
  g.restore();
}

/* ───────────────────────── boot / attract screen ───────────────────────── */
const BOOT_LINES = [
  ['ALGOARCADE BIOS v2.0  (C) ARCANE SYSTEMS', ''],
  ['ROM CHECK ............ 65536 BYTES OK', 'ok'],
  ['MEMORY TEST ......... 11150 XP SLOTS', 'ok'],
  ['CPU ................. MERGE-256 @ 3.58 MHz', 'ok'],
  ['PPU ................. CRT-88 SCANLINE ENGAGED', 'ok'],
  ['PSG ................. 8-BIT SFX CHANNEL ONLINE', 'ok'],
  ['CARTRIDGE ........... 12 QUEST LINES LOADED', 'ok'],
  ['TRACK A: DATA STRUCTURES & ALGORITHMS .... READY', 'hi'],
  ['TRACK B: CRYPTOGRAPHIC ARCHITECTURE ........ READY', 'hi'],
  ['SAVE RAM ............ LOCALSTORAGE MOUNTED', 'ok'],
  ['WARNING: NO SERVERS. NO TRACKING. ALL LOCAL.', 'warn'],
  ['', '']
];

function bootSequence(done) {
  const log = $('#aa-boot-log');
  const sprites = $('#aa-boot-sprites');
  if (sprites && !sprites.childNodes.length) {
    ['invader', 'ghost', 'heart', 'star', 'trophy', 'coin'].forEach((n, i) => {
      const cv = spriteCanvas(n, 3);
      if (cv) { cv.title = n; sprites.appendChild(cv); void i; }
    });
  }
  const yEl = $('#aa-year'); if (yEl) yEl.textContent = new Date().getFullYear();

  if (reduced() || !log) { done && done(); return; }

  let i = 0;
  const step = () => {
    if (i >= BOOT_LINES.length) { setTimeout(done, 240); return; }
    const [text, cls] = BOOT_LINES[i++];
    const row = doc.createElement('div');
    row.innerHTML = (text ? '<span class="' + cls + '">' + text + '</span>' : '') + '<span class="cur">▌</span>';
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
    const delay = text ? Math.min(22 + text.length * 2.2, 105) : 50;
    setTimeout(step, delay);
  };
  setTimeout(step, 320);
}

function startGame() {
  if (state.playing) return;
  state.playing = true;
  state.credits++;
  doc.body.classList.remove('aa-boot-open');
  try { localStorage.setItem(SKIP_KEY, '1'); } catch (e) { /* private mode */ }
  closeBoot();
  coinInsert();
  playStartJingle();
  flash();
  shake(11);
  spawnInvaders(3);
  burstCoins(60, 14);
  try { const b = $('#press-start'); if (b) b.focus(); } catch (e) { /* noop */ }
}

function closeBoot() {
  const b = $('#aa-boot');
  if (!b) return;
  b.style.transition = 'opacity .4s ease, transform .4s ease';
  b.style.opacity = '0';
  b.style.transform = 'scale(1.04)';
  setTimeout(() => { b.style.display = 'none'; }, 420);
}

/* ───────────────────────── audio (arcade layer) ───────────────────────── */
let ac = null;
function actx() {
  try {
    if (window.ALGOARCADE && window.ALGOARCADE.state && window.ALGOARCADE.state.sound === false) return null;
  } catch (e) { /* noop */ }
  if (!ac) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    try { ac = new C(); } catch (e) { return null; }
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

function blip(freqs, dur, type, vol, slide) {
  const c = actx(); if (!c) return;
  const list = Array.isArray(freqs) ? freqs : [freqs];
  list.forEach((f, i) => {
    const t0 = c.currentTime + i * 0.055;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f * slide), t0 + (dur || 0.1));
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol || 0.05, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + (dur || 0.1));
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + (dur || 0.1) + 0.03);
  });
}

const A = {
  coin:  () => blip([988, 1319], 0.09, 'square', 0.06),
  start: () => blip([523, 659, 784, 1046, 1318], 0.16, 'square', 0.07),
  hover: () => blip(1400, 0.025, 'square', 0.018),
  press: () => blip([220, 160], 0.07, 'square', 0.05),
  coinInsert: () => blip([784, 1046, 784, 1318, 1568], 0.1, 'triangle', 0.07),
  levelup: () => blip([523, 659, 784, 1046, 1318, 1568, 2093], 0.2, 'square', 0.08),
  trophy: () => blip([659, 784, 988, 1318], 0.13, 'triangle', 0.07),
  blip:   () => blip([880], 0.04, 'square', 0.035),
  nope:   () => blip([160, 110], 0.13, 'sawtooth', 0.045)
};

function playStartJingle() {
  const seq = [262, 330, 392, 523, 659, 784, 1046];
  const c = actx(); if (!c) return;
  seq.forEach((f, i) => {
    const t0 = c.currentTime + i * 0.09;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'square'; o.frequency.setValueAtTime(f, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.06, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + 0.2);
  });
}

/* ───────────────────────── screen flash + shake ───────────────────────── */
function flash() {
  const f = $('#aa-flash'); if (!f) return;
  f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
}

let shakeMag = 0, shakeRAF = 0;
function shake(mag) {
  if (reduced()) return;
  const m = Math.max(shakeMag, mag);
  shakeMag = m;
  if (shakeRAF) return;
  const t0 = performance.now();
  const step = (t) => {
    const e = t - t0;
    if (e > 460 || shakeMag <= 0) {
      shakeMag = 0; shakeRAF = 0;
      doc.body.style.setProperty('--aa-shake-x', '0px');
      doc.body.style.setProperty('--aa-shake-y', '0px');
      return;
    }
    const k = shakeMag * (1 - e / 460);
    doc.body.style.setProperty('--aa-shake-x', (Math.random() * 2 - 1) * k + 'px');
    doc.body.style.setProperty('--aa-shake-y', (Math.random() * 2 - 1) * k * 0.7 + 'px');
    shakeRAF = requestAnimationFrame(step);
  };
  shakeRAF = requestAnimationFrame(step);
}

/* ───────────────────────── FX particle layer ───────────────────────── */
const fxCv = $('#aa-fx');
let fxCtx = ctx2d(fxCv), parts = [], running = false;

function sizeFx() {
  if (!fxCv) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  fxCv.width = Math.floor(window.innerWidth * dpr);
  fxCv.height = Math.floor(window.innerHeight * dpr);
  if (fxCtx) { fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0); }
}

const PALETTE = ['#00e5c7', '#ffd166', '#f72585', '#8b5cf6', '#34d97b', '#ff9f1c', '#4da3ff'];

function spawn(p) { parts.push(p); }

function burstCoins(x, y, n) {
  if (reduced() || lowFx() || !fxCtx) return;
  n = n || 14;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 1.4 + Math.random() * 4.6;
    spawn({
      k: 'coin', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2.4,
      g: 0.16, life: 1, decay: 0.008 + Math.random() * 0.008,
      s: 4 + Math.floor(Math.random() * 3), rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      hue: Math.random() < 0.7 ? '#ffd166' : '#00e5c7'
    });
  }
  wake();
}

function burstSparks(x, y, color, n) {
  if (reduced() || lowFx() || !fxCtx) return;
  n = n || 10;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = 0.6 + Math.random() * 3.2;
    spawn({
      k: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      g: 0.03, life: 1, decay: 0.02 + Math.random() * 0.03,
      s: 1 + Math.floor(Math.random() * 3), color: color || PALETTE[(Math.random() * PALETTE.length) | 0]
    });
  }
  wake();
}

function burstText(x, y, text, color) {
  if (reduced() || lowFx() || !fxCtx) return;
  spawn({
    k: 'text', x, y, vx: (Math.random() - 0.5) * 0.7, vy: -1.5,
    g: 0.02, life: 1, decay: 0.012, text: text || '+XP', color: color || '#ffd166'
  });
  wake();
}

function confetti() {
  if (reduced() || lowFx() || !fxCtx) return;
  const w = window.innerWidth;
  for (let i = 0; i < 60; i++) {
    spawn({
      k: 'confetti', x: w / 2 + (Math.random() - 0.5) * 260, y: -20 - Math.random() * 120,
      vx: (Math.random() - 0.5) * 2.2, vy: 1.2 + Math.random() * 2.4,
      g: 0.045, life: 1, decay: 0.0032,
      s: 3 + Math.floor(Math.random() * 4), rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.35,
      color: PALETTE[(Math.random() * PALETTE.length) | 0]
    });
  }
  wake();
}

let lastT = 0;
function fxLoop(t) {
  if (!fxCtx) return;
  const dt = Math.min((t - lastT) / 16.67 || 1, 3);
  lastT = t;
  const W = window.innerWidth, H = window.innerHeight;
  fxCtx.clearRect(0, 0, W, H);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt;
    p.life -= (p.decay || 0.01) * dt;
    if (p.rot !== undefined) p.rot += (p.vr || 0) * dt;
    if (p.life <= 0 || p.y > H + 40) { parts.splice(i, 1); continue; }

    const a = Math.max(0, Math.min(1, p.life));
    fxCtx.save();
    fxCtx.globalAlpha = a;
    if (p.k === 'text') {
      fxCtx.font = '10px "Press Start 2P", monospace';
      fxCtx.textAlign = 'center';
      fxCtx.fillStyle = p.color;
      fxCtx.shadowColor = p.color; fxCtx.shadowBlur = 12;
      fxCtx.fillText(p.text, p.x, p.y);
    } else if (p.k === 'spark') {
      fxCtx.fillStyle = p.color;
      fxCtx.shadowColor = p.color; fxCtx.shadowBlur = 8;
      fxCtx.fillRect(p.x, p.y, p.s, p.s);
    } else if (p.k === 'confetti') {
      fxCtx.translate(p.x, p.y); fxCtx.rotate(p.rot);
      fxCtx.fillStyle = p.color;
      fxCtx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
    } else if (p.k === 'coin') {
      /* coin disc with a spinning squash */
      const sq = Math.abs(Math.cos(p.rot));
      fxCtx.translate(p.x, p.y);
      fxCtx.fillStyle = p.hue;
      fxCtx.shadowColor = p.hue; fxCtx.shadowBlur = 10;
      fxCtx.beginPath();
      fxCtx.ellipse(0, 0, Math.max(0.6, p.s * sq), p.s, 0, 0, Math.PI * 2);
      fxCtx.fill();
      fxCtx.shadowBlur = 0;
      if (sq > 0.35) {
        fxCtx.fillStyle = 'rgba(0,0,0,.45)';
        fxCtx.fillRect(-p.s * 0.18 * sq, -p.s * 0.5, Math.max(1, p.s * 0.36 * sq), p.s);
      }
    }
    fxCtx.restore();
  }
  if (parts.length) requestAnimationFrame(fxLoop);
  else { running = false; }
}
function wake() { if (!running) { running = true; lastT = performance.now(); requestAnimationFrame(fxLoop); } }
sizeFx();

/* ───────────────────────── starfield + drifting sprites ───────────────────────── */
const sky = $('#aa-stars');
let skyCtx = ctx2d(sky);

const BG_COLORS = ['#3a4160', '#4a5273', '#5a6178', '#6f7ba6', '#2c3348'];
let stars = [], skyRAF = 0;

/* The starfield is static geometry; only its scroll offset and twinkle change.
   Drawing ~200 fillRects per frame is far too expensive, so we bake the stars
   into an offscreen tile ONCE and blit it (wrapped) every frame instead. */
let skyTile = null, skyTileW = 0, skyTileH = 0, skyTileCtx = null;
let skyDPR = 1, skyW = 0, skyH = 0;

function buildSkyTile() {
  const target = Math.round((skyW * skyH) / 5200);
  const count = Math.max(40, Math.min(220, target));

  /* group by colour so the bake uses one fillStyle per pass */
  const groups = BG_COLORS.map(c => ({ c, items: [] }));
  for (let i = 0; i < count; i++) {
    const g = groups[(Math.random() * groups.length) | 0];
    g.items.push({
      x: Math.random() * skyTileW,
      y: Math.random() * skyTileH,
      z: Math.random() * 0.85 + 0.15,
      tw: Math.random() * Math.PI * 2,
      px: Math.random() < 0.05
    });
  }
  stars = [];

  if (!skyTile) skyTile = doc.createElement('canvas');
  skyTile.width = skyTileW; skyTile.height = skyTileH;
  try { skyTileCtx = skyTile.getContext('2d'); } catch (e) { skyTileCtx = null; }
  if (!skyTileCtx) return;

  skyTileCtx.clearRect(0, 0, skyTileW, skyTileH);
  groups.forEach(g => {
    if (!g.items.length) return;
    skyTileCtx.fillStyle = g.c;
    g.items.forEach(s => {
      const size = s.px ? 3 : (s.z > 0.7 ? 2 : 1);
      const a = 0.25 + s.z * 0.55;
      skyTileCtx.globalAlpha = a;
      skyTileCtx.fillRect(s.x | 0, s.y | 0, size, size);
      stars.push({ x: s.x, y: s.y, tw: s.tw, z: s.z });
    });
  });
  skyTileCtx.globalAlpha = 1;
}

function sizeSky() {
  if (!sky) return;
  /* DPR 1 on purpose: these are 1-3px specks, and 2x quadruples fill cost */
  skyDPR = 1;
  skyW = window.innerWidth; skyH = window.innerHeight;
  sky.width = Math.floor(skyW * skyDPR);
  sky.height = Math.floor(skyH * skyDPR);
  if (skyCtx) skyCtx.setTransform(skyDPR, 0, 0, skyDPR, 0, 0);
  skyTileW = skyW; skyTileH = skyH;
  buildSkyTile();
}
sizeSky();

let scrollY = 0;
function drawSky(t) {
  if (!skyCtx || !skyTileCtx) return;
  const W = skyW, H = skyH;
  scrollY += 0.22;
  const off = scrollY % H;
  const breathe = 0.82 + 0.18 * Math.sin(t / 900);

  skyCtx.clearRect(0, 0, W, H);
  skyCtx.globalAlpha = breathe;
  /* two blits, wrapped, make the field scroll forever */
  skyCtx.drawImage(skyTile, 0, off - H, W, H);
  skyCtx.drawImage(skyTile, 0, off, W, H);
  skyCtx.globalAlpha = 1;
}

/* occasional shooting star */
let nextShoot = 0;
function maybeShoot(t) {
  if (reduced() || lowFx() || !skyCtx || doc.hidden) return;
  if (t < nextShoot) return;
  nextShoot = t + 6000 + Math.random() * 14000;
  const x0 = Math.random() * window.innerWidth * 0.8;
  const y0 = Math.random() * window.innerHeight * 0.5;
  const a0 = performance.now();
  const step = (t2) => {
    const e = (t2 - a0) / 900;
    if (e >= 1 || reduced()) { return; }
    const x = x0 + e * (window.innerWidth * 0.6);
    const y = y0 + e * (window.innerHeight * 0.32);
    const tail = 46 * (1 - e);
    skyCtx.save();
    const g = skyCtx.createLinearGradient(x, y, x - tail, y - tail * 0.55);
    g.addColorStop(0, 'rgba(0,229,199,' + (0.85 * (1 - e)) + ')');
    g.addColorStop(1, 'rgba(0,229,199,0)');
    skyCtx.strokeStyle = g; skyCtx.lineWidth = 2;
    skyCtx.beginPath(); skyCtx.moveTo(x, y); skyCtx.lineTo(x - tail, y - tail * 0.55); skyCtx.stroke();
    skyCtx.restore();
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* an invader sprite strolling across the top of the tube */
function spawnInvaders(n) {
  if (reduced() || lowFx()) return;
  n = n || 1;
  const kinds = ['invader', 'ghost', 'heart', 'bolt', 'star'];
  for (let i = 0; i < n; i++) {
    setTimeout(() => {
      const cv = spriteCanvas(kinds[(Math.random() * kinds.length) | 0], 4);
      if (!cv) return;
      cv.className = 'aa-invader';
      const dur = 7000 + Math.random() * 5000;
      cv.style.animationDuration = dur + 'ms';
      doc.body.appendChild(cv);
      requestAnimationFrame(() => cv.classList.add('fly'));
      setTimeout(() => cv.remove(), dur + 400);
    }, i * 900 + Math.random() * 700);
  }
}

/* ───────────────────────── marquee chase bulbs ─────────────────────────
   Real arcade marquees run a band of bulbs chasing around the sign.
   We run two columns (left + right edge) chasing in opposite directions. */
let bulbTimer = 0, bulbCells = [];

function initBulbs() {
  const box = $('#aa-bulbs');
  if (!box) return;
  box.innerHTML = '';
  bulbCells = [];

  const count = Math.max(5, Math.min(18, Math.round((box.clientHeight || 70) / 17)));
  for (let side = 0; side < 2; side++) {
    for (let i = 0; i < count; i++) {
      const b = doc.createElement('i');
      b.style.left = side === 0 ? '7px' : 'calc(100% - 15px)';
      b.style.top = 'calc(8px + (100% - 16px) * ' + (i / (count - 1 || 1)) + ')';
      box.appendChild(b);
      bulbCells.push({ el: b, phase: side === 0 ? i : (count * 1.5 - i) });
    }
  }

  if (reduced()) { bulbCells.forEach(c => c.el.classList.add('on')); return; }

  let t = 0;
  const step = () => {
    t++;
    const SPAN = 9;                 // how many bulbs lit at once
    const head = t % (count + SPAN);
    bulbCells.forEach(c => {
      let d = (head - c.phase) % (count + SPAN);
      if (d < 0) d += count + SPAN;
      c.el.classList.toggle('on', d < SPAN);
    });
  };
  bulbTimer = setInterval(step, 110);
}

/* ───────────────────────── ticker content ───────────────────────── */
const TICKS = [
  'TIP: <i>BIG-O</i> IS ABOUT GROWTH, NOT SPEED',
  'PRESS <b>ESC</b> TO CLOSE ANY MODULE',
  '<b>11,150 XP</b> HIDES ACROSS 12 QUEST LINES',
  'EVERY CHALLENGE RUNS <i>REAL CODE</i> IN YOUR BROWSER',
  'BEAT A <b>DEBUG BOSS</b> TO UNLOCK THE NEXT QUEST LINE',
  'COMPARE <b>BFS</b> VS <b>DFS</b> IN ALGORITHM WORLDS',
  'PROVE <b>SHA-256</b> YOURSELF IN THE MINING CHALLENGE',
  'NO SERVERS · NO TRACKING · <i>ALL PROGRESS IS LOCAL</i>',
  'INSERT COIN TO CONTINUE',
  '<b>O(n log n)</b> BEATS <b>O(n²)</b> — SHOWDOWN PROVES IT'
];

function initTicker() {
  const tr = $('#aa-ticker');
  if (!tr) return;
  tr.innerHTML = TICKS.map(t => '<span>' + t + '</span>').join('');
  // duplicate once for a seamless -50% loop
  tr.innerHTML = tr.innerHTML + tr.innerHTML;
}

/* ───────────────────────── lives + credits ───────────────────────── */
function maxLives() {
  try {
    const st = window.ALGOARCADE && window.ALGOARCADE.state;
    if (st && st.completedChallenges) {
      const done = Object.keys(st.completedChallenges).filter(k => st.completedChallenges[k]).length;
      return 12 - done;
    }
  } catch (e) { /* noop */ }
  return 12;
}

function renderLives() {
  const box = $('#aa-lives');
  if (!box) return;
  const n = Math.max(0, Math.min(12, maxLives()));
  box.innerHTML = '';
  const shown = n === 0 ? 1 : Math.min(n, 6);
  for (let i = 0; i < shown; i++) box.appendChild(spriteCanvas('heart', 2));
  if (n > 6) {
    const more = doc.createElement('span');
    more.textContent = '×' + n;
    more.style.cssText = "font-family:'Press Start 2P',cursive;font-size:8px;color:#ff5c6c";
    box.appendChild(more);
  }
  box.setAttribute('title', n + ' quests remaining');
}

function renderCredits(bump) {
  state.credits = Math.max(state.credits, countCleared() + 1);
  const v = String(state.credits).padStart(2, '0');
  const a = $('#aa-credits'), b = $('#aa-slot-credit'), c = $('#aa-boot-credits'), l = $('#aa-boot-lives');
  if (a) a.textContent = 'CREDIT ' + v;
  if (b) b.textContent = v;
  if (c) c.textContent = v;
  if (l) l.textContent = String(maxLives());
  if (a && bump) { a.classList.remove('bump'); void a.offsetWidth; a.classList.add('bump'); }
}

function countCleared() {
  try {
    const st = window.ALGOARCADE && window.ALGOARCADE.state;
    if (st && st.completedChallenges) {
      return Object.keys(st.completedChallenges).filter(k => st.completedChallenges[k]).length;
    }
  } catch (e) { /* noop */ }
  return 0;
}

function coinInsert() {
  const slot = $('#aa-slot');
  if (!slot) return;
  const cv = spriteCanvas('coin', 3);
  if (cv) slot.querySelector('.aa-slot-body').appendChild(cv);
  slot.classList.remove('insert'); void slot.offsetWidth; slot.classList.add('insert');
  setTimeout(() => { if (cv) cv.remove(); }, 900);
}

/* ───────────────────────── interaction juice ───────────────────────── */
function ripple(e, el) {
  if (reduced()) return;
  const r = el.getBoundingClientRect();
  const d = doc.createElement('span');
  d.className = 'aa-ripple';
  const s = Math.max(r.width, r.height) * 0.9;
  d.style.width = d.style.height = s + 'px';
  d.style.left = (e.clientX - r.left) + 'px';
  d.style.top = (e.clientY - r.top) + 'px';
  el.appendChild(d);
  setTimeout(() => d.remove(), 640);
}

function wireJuice() {
  doc.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn, .nav-btn, .aa-btn, .aa-sysbtn, .mode, .seg button, .icon-btn, .tool-btn, .level-btn');
    if (btn && !btn.disabled) {
      ripple(e, btn);
      /* deck buttons run their own click handler (sound + sparks) */
      if (btn.classList.contains('aa-btn') || btn.classList.contains('aa-sysbtn')) return;
      const r = btn.getBoundingClientRect();
      if (r.width < 900) burstSparks(r.left + r.width / 2, r.top + r.height / 2, '#00e5c7', 5);
    }

    const card = e.target.closest('.card, .feat, .boss-card');
    if (card && !card.classList.contains('locked')) {
      const r = card.getBoundingClientRect();
      burstSparks(r.left + r.width / 2, r.top + Math.min(80, r.height / 3), '#ffd166', 8);
    }
  }, true);

  doc.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') burstSparks(window.innerWidth / 2, window.innerHeight / 2, '#b28dff', 4);
  });
}

/* 3D tilt on cards & tiles */
function wireTilt() {
  if (reduced() || noHover()) return;
  const sel = '.card, .feat, .boss-card, .achv';
  const move = (e) => {
    const el = e.target.closest(sel);
    if (!el || el.classList.contains('locked')) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform =
      'perspective(900px) rotateX(' + (-py * 6).toFixed(2) + 'deg) rotateY(' +
      (px * 8).toFixed(2) + 'deg) translateY(-6px)';
  };
  const leave = (e) => {
    const el = e.target.closest(sel);
    if (el) el.style.transform = '';
  };
  doc.addEventListener('mousemove', move, { passive: true });
  doc.addEventListener('mouseleave', leave, true);
}

/* joystick follows the pointer */
function wireStick() {
  const stick = $('#aa-stick'), ball = $('#aa-ball');
  if (!stick || !ball || reduced()) return;
  const move = (e) => {
    const r = stick.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const m = Math.max(1, Math.hypot(x, y));
    ball.style.transform = 'translate(' + (x / m * 26).toFixed(1) + 'px,' + (y / m * 26).toFixed(1) + 'px)';
  };
  const reset = () => { ball.style.transform = ''; };
  stick.addEventListener('mousemove', move);
  stick.addEventListener('mouseleave', reset);
}

/* control panel buttons — real clicks, real sound, real sparks */
function wirePanel() {
  const panel = $('.aa-panel');
  if (!panel) return;
  const snd = {
    p1: [523, 784], p2: [392, 659], b3: [659, 880], b4: [880, 1175],
    sys: [523, 659, 784, 1046], opt: [440, 330]
  };
  const hueFor = (b) => b.classList.contains('p1') ? '#f72585'
    : b.classList.contains('p2') ? '#4da3ff'
    : b.classList.contains('b3') ? '#ffd166'
    : b.classList.contains('b4') ? '#34d97b'
    : b.classList.contains('alt') ? '#f72585' : '#00e5c7';

  $$('.aa-btn, .aa-sysbtn', panel).forEach(b => {
    const fire = (e) => {
      b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 120);
      const r = b.getBoundingClientRect();
      blip(snd[b.dataset.snd] || [660], 0.07, 'square', 0.05);
      burstSparks(r.left + r.width / 2, r.top + r.height / 2, hueFor(b), 12);
      /* START actually starts the game — that's what the button is for */
      if (b.dataset.snd === 'sys' && !state.playing) startGame();
      if (e) { e.preventDefault(); e.stopPropagation(); }
    };
    b.addEventListener('click', fire);
    b.addEventListener('mouseenter', () => A.hover());
  });
}

/* ───────────────────────── entrance reveals ───────────────────────── */
function wireReveal() {
  const hasIO = typeof window.IntersectionObserver === 'function';
  const io = hasIO ? new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const sibs = Array.from(el.parentNode ? el.parentNode.children : []);
      el.style.transitionDelay = Math.min(sibs.indexOf(el) * 60, 480) + 'ms';
      el.classList.add('in');
      io.unobserve(el);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }) : null;

  const showNow = (el) => {
    el.classList.add('in');
    el.style.transitionDelay = '0ms';
  };

  const mark = () => {
    /* reduced motion + no IO: never hide content, just show it */
    const instant = reduced() || !io;
    ['.card', '.feat', '.snap', '.track'].forEach(sel => {
      $$(sel).forEach(el => { if (!el.classList.contains('aa-reveal')) el.classList.add('aa-reveal'); });
    });
    $$('.aa-reveal').forEach(el => {
      if (instant) { showNow(el); return; }
      if (el.classList.contains('in')) return;
      io.observe(el);
    });
  };
  mark();
  /* re-mark when views re-render */
  setTimeout(mark, 900);
  setInterval(mark, 4000);
}

/* ───────────────────────── hook the app's milestones ───────────────────────── */
let lastXP = -1, lastCleared = -1;

function pollProgress() {
  const api = window.ALGOARCADE;
  if (!api || !api.state) return;

  const xp = api.state.xp || 0;
  if (lastXP >= 0 && xp > lastXP) {
    const d = xp - lastXP;
    const bar = $('#s-bar') || $('#s-xp');
    if (bar) {
      const r = bar.getBoundingClientRect();
      burstCoins(r.left + r.width, r.top + r.height / 2, Math.min(26, 8 + Math.floor(d / 60)));
      burstText(r.left + r.width / 2, r.top - 6, '+' + d + ' XP', '#ffd166');
    }
    A.coin();
    flash();
  }
  lastXP = xp;

  const cleared = countCleared();
  if (lastCleared >= 0 && cleared > lastCleared) {
    renderCredits(true);
    confetti();
    A.levelup();
    shake(9);
  }
  lastCleared = cleared;
}

/* celebratory big fanfare when everything is cleared */
function watchAllDone() {
  const api = window.ALGOARCADE; if (!api) return;
  let celebrated = false;
  const check = () => {
    const st = api.getState ? api.getState() : api.state;
    if (st && st.allDone && !celebrated) {
      celebrated = true;
      setTimeout(() => {
        confetti(); confetti();
        A.trophy(); flash(); shake(18);
        spawnInvaders(4);
        const el = doc.createElement('div');
        el.className = 'aa-press';
        el.style.cssText = 'position:fixed;left:50%;top:42%;transform:translate(-50%,-50%);z-index:1100';
        el.textContent = '★ MASTER CERTIFIED ★';
        doc.body.appendChild(el);
        setTimeout(() => el.remove(), 6000);
      }, 300);
    }
  };
  check();
  setInterval(check, 4000);
}

/* ───────────────────────── main loop ───────────────────────── */
function loop(t) {
  drawSky(t);
  maybeShoot(t);
  requestAnimationFrame(loop);
}

/* ───────────────────────── boot ───────────────────────── */
function start() {
  doc.body.style.setProperty('--aa-shake-x', '0px');
  initBulbs();
  initTicker();
  wireJuice();
  wireTilt();
  wireStick();
  wirePanel();
  wireReveal();
  renderLives();
  renderCredits(false);
  sizeSky(); sizeFx();

  const press = $('#aa-press-start');
  if (press) {
    press.addEventListener('click', startGame);
    press.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGame(); }
    });
  }
  doc.addEventListener('keydown', (e) => {
    if (doc.body.classList.contains('aa-boot-open') && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault(); startGame();
    }
  });

  let played = false;
  try { played = localStorage.getItem(SKIP_KEY) === '1'; } catch (err) { played = false; }
  if (played && !reduced()) {
    /* returning player: brief 700ms power-on, no blocking */
    const b = $('#aa-boot');
    bootSequence(() => { doc.body.classList.remove('aa-boot-open'); flash(); A.start(); });
    if (b) b.style.background = 'rgba(4,5,10,.92)';
    setTimeout(() => {
      doc.body.classList.remove('aa-boot-open');
      if (b) { b.style.display = 'none'; }
      renderCredits(true);
      spawnInvaders(2);
    }, 1500);
    state.playing = true;
    state.credits = countCleared();
  } else {
    bootSequence(() => {
      /* auto-start after a beat if the player is patient */
      setTimeout(() => { if (doc.body.classList.contains('aa-boot-open')) startGame(); }, 2600);
    });
  }

  if (!reduced()) requestAnimationFrame(loop);
  else if (bulbTimer) { clearInterval(bulbTimer); bulbTimer = 0; }
  /* don't burn frames on a backgrounded tab */
  doc.addEventListener('visibilitychange', () => { if (!doc.hidden && !reduced()) requestAnimationFrame(loop); });
  setInterval(pollProgress, 900);
  setInterval(renderLives, 2500);
  watchAllDone();

  /* pause heavy loops while the tab is hidden */
  doc.addEventListener('visibilitychange', () => {
    if (doc.hidden) { doc.body.classList.add('no-fx'); }
    else { doc.body.classList.remove('no-fx'); sizeSky(); }
  });
  if (doc.hidden) doc.body.classList.add('no-fx');

  let rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { sizeSky(); sizeFx(); }, 180);
  });
}

if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start);
else start();

/* public hooks for the rest of the app */
window.AA_ARCADE = {
  startGame, coinInsert, confetti, flash, shake,
  coins: burstCoins, sparks: burstSparks, text: burstText,
  invader: spawnInvaders, sound: A, sprite: spriteCanvas,
  refresh: () => { renderLives(); renderCredits(false); }
};

})();