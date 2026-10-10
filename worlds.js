/* ============================================================================
   ALGOARCADE — ALGORITHM WORLDS
   A playable grid maze: draw walls/terrain, run BFS / DFS / A*, watch the
   frontier expand, and compare strategies on identical terrain.
   ========================================================================== */
(function () {
'use strict';

const AA = window.AA_ALGO;
const AC = window.ALGOARCADE;
const CELL = AA.CELL;
const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = AC.esc;

const LEVELS = [
  { id: 1, name: 'Boot Camp', w: 15, h: 11, layout: 'open', mud: false, xp: 60,
    intro: 'Concept: breadth-first search. An open field — run BFS and watch the frontier expand in perfect rings. BFS visits cells in order of distance, so the first time it touches the goal, the path is provably shortest.' },
  { id: 2, name: 'Wall Street', w: 17, h: 12, layout: 'scatter', mud: false, xp: 80,
    intro: 'Concept: walls and traversal order. Now the rings must bend around walls. Run BFS, then switch to DFS and compare: DFS dives deep first, so it often explores far more cells before finding the goal.' },
  { id: 3, name: 'The Labyrinth', w: 21, h: 14, layout: 'maze', mud: false, xp: 100,
    intro: 'Concept: generated mazes. The maze is regenerated every time — BFS still guarantees the shortest route, DFS still does not. Try to wall off the goal entirely to see how each handles the impossible.' },
  { id: 4, name: 'Heavy Traffic', w: 23, h: 15, layout: 'maze', mud: true, xp: 120,
    intro: 'Concept: weighted terrain. Mud costs 3 energy per step instead of 1. BFS ignores cost — A* (with a Manhattan heuristic) routes around mud when the detour is cheaper. Draw mud, then compare explored cells and costs.' }
];

const ALGOS = {
  bfs:  { name: 'BFS',  full: 'Breadth-First Search', color: 'var(--cyan)',  run: AA.bfsSolve,
          note: 'Explores level by level (FIFO queue). Guarantees the SHORTEST path in hops on unweighted grids. Ignores mud costs.' },
  dfs:  { name: 'DFS',  full: 'Depth-First Search',   color: 'var(--violet)', run: AA.dfsSolve,
          note: 'Dives deep first (LIFO stack). A TRAVERSAL strategy — it finds A path, but never guaranteed to be the shortest.' },
  astar:{ name: 'A*',   full: 'A* Search',            color: 'var(--gold)',  run: AA.astarSolve,
          note: 'Guided best-first search with a Manhattan heuristic + terrain costs. Guarantees the cheapest route when the heuristic never overestimates.' }
};

const S = {
  level: 1,
  grid: null,
  algo: 'bfs',
  tool: 'wall',
  phase: 'idle',      // idle | explore | path | done
  steps: null,
  path: null,
  step: 0,
  pathStep: 0,
  playing: false,
  timer: null,
  speed: 1,
  cells: [],
  result: null,
  compare: null
};

const level = () => LEVELS.find(l => l.id === S.level);
const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function findEndpoints(grid) {
  let start = null, goal = null;
  grid.forEach((row, y) => row.forEach((v, x) => {
    if (v === CELL.START) start = [x, y];
    if (v === CELL.GOAL) goal = [x, y];
  }));
  return { start, goal };
}

/* ───────────────────────── level layouts ───────────────────────── */

function buildLevel(l) {
  if (l.layout === 'open') {
    const g = AA.emptyGrid(l.w, l.h);
    border(g);
    g[1][1] = CELL.START;
    g[l.h - 2][l.w - 2] = CELL.GOAL;
    return g;
  }
  if (l.layout === 'scatter') {
    let g, tries = 0;
    do {
      g = AA.emptyGrid(l.w, l.h);
      border(g);
      const target = Math.floor(l.w * l.h * 0.14);
      let placed = 0, guard = 0;
      while (placed < target && guard++ < 400) {
        const x = 1 + Math.floor(Math.random() * (l.w - 2));
        const y = 1 + Math.floor(Math.random() * (l.h - 2));
        if (g[y][x] !== CELL.EMPTY) continue;
        g[y][x] = CELL.WALL;
        if (AA.bfsHopDistance(g, 1, 1, l.w - 2, l.h - 2) < 0) { g[y][x] = CELL.EMPTY; continue; }
        placed++;
      }
      g[1][1] = CELL.START;
      g[l.h - 2][l.w - 2] = CELL.GOAL;
    } while (AA.bfsHopDistance(g, 1, 1, l.w - 2, l.h - 2) < 0 && tries++ < 5);
    return g;
  }
  // maze layout
  const g = AA.generateMaze(l.w, l.h);
  if (l.mud) {
    // sprinkle walkable mud patches (never on endpoints)
    const cells = [];
    for (let y = 1; y < l.h - 1; y++) for (let x = 1; x < l.w - 1; x++) {
      if (g[y][x] === CELL.EMPTY) cells.push([x, y]);
    }
    const n = Math.floor(cells.length * 0.12);
    for (let i = 0; i < n; i++) {
      const c = cells[Math.floor(Math.random() * cells.length)];
      if (c) g[c[1]][c[0]] = CELL.MUD;
    }
  }
  return g;
}

function border(g) {
  const h = g.length, w = g[0].length;
  for (let x = 0; x < w; x++) { g[0][x] = CELL.WALL; g[h - 1][x] = CELL.WALL; }
  for (let y = 0; y < h; y++) { g[y][0] = CELL.WALL; g[y][w - 1] = CELL.WALL; }
}

/* ───────────────────────── rendering ───────────────────────── */

function render() {
  const root = document.getElementById('worlds-root');
  if (!root) return;
  if (!S.grid) S.grid = buildLevel(level());

  root.innerHTML =
    '<div class="worlds-layout">' +
      '<div class="world-side">' +
        '<div class="panel">' +
          '<div class="panel-t">LEVELS</div>' +
          '<div class="level-list">' +
            LEVELS.map(l => {
              const done = !!(AC.getState().worlds.levels || {})[l.id];
              return '<button class="level-btn' + (S.level === l.id ? ' on' : '') + (done ? ' done' : '') + '" ' +
                'data-level="' + l.id + '" aria-pressed="' + (S.level === l.id) + '">' +
                '<span class="lv-num">' + (done ? '✓' : '0' + l.id) + '</span>' +
                '<span><span class="lv-t">' + esc(l.name) + '</span>' +
                '<span class="lv-d">' + esc(l.layout === 'maze' ? 'generated maze' : l.layout === 'scatter' ? 'scattered walls' : 'open field') +
                (l.mud ? ' · weighted mud' : '') + '</span></span></button>';
            }).join('') +
          '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-t">DRAWING TOOLS</div>' +
          '<div class="tools-row" role="group" aria-label="Drawing tools">' +
            toolBtn('wall', '🧱', 'WALL') +
            (level().mud ? toolBtn('mud', '🟫', 'MUD') : '') +
            toolBtn('start', '🟢', 'START') +
            toolBtn('goal', '🟡', 'GOAL') +
            toolBtn('erase', '⌫', 'ERASE') +
          '</div>' +
          '<div class="btn-row" style="margin-top:14px">' +
            '<button class="btn ghost sm" id="wd-reset">⟲ RESET</button>' +
            '<button class="btn ghost sm" id="wd-regen">🎲 NEW MAZE</button>' +
          '</div>' +
          '<p style="font-size:10px;color:var(--dim);line-height:1.8;margin-top:12px">Click or drag on the grid to ' +
          'paint. RESET restores this level’s default layout; NEW MAZE regenerates a fresh one.</p>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-t">ALGORITHM</div>' +
          '<div class="seg" style="flex-wrap:wrap" role="group" aria-label="Algorithm">' +
            Object.keys(ALGOS).map(k =>
              '<button type="button" data-algo="' + k + '" class="' + (S.algo === k ? 'on' : '') + '" aria-pressed="' + (S.algo === k) + '">' +
              esc(ALGOS[k].name) + '</button>').join('') +
          '</div>' +
          '<p style="font-size:10px;color:var(--dim);line-height:1.8;margin-top:12px">' + esc(ALGOS[S.algo].note) + '</p>' +
        '</div>' +
      '</div>' +

      '<div class="maze-wrap">' +
        '<div class="maze-hud">' +
          '<span class="hud-status" id="wd-status">READY — paint a maze, then press RUN</span>' +
          '<span>EXPLORED <b id="wd-explored">0</b></span>' +
          '<span>FRONTIER <b id="wd-frontier">0</b></span>' +
          '<span>PATH <b id="wd-pathlen">—</b></span>' +
          '<span>COST <b id="wd-cost">—</b></span>' +
        '</div>' +
        '<div class="note cy" style="margin:0 0 14px;font-size:11px">' + esc(level().intro) + '</div>' +
        '<div class="maze' + (reducedMotion() ? ' no-anim' : '') + '" id="wd-maze" style="grid-template-columns:repeat(' + S.grid[0].length + ',1fr)" role="application" aria-label="Maze grid — use the run controls below"></div>' +
        '<div class="maze-legend" aria-hidden="true">' +
          '<span class="lg"><span class="sw" style="background:var(--green)"></span>start</span>' +
          '<span class="lg"><span class="sw" style="background:var(--gold)"></span>goal</span>' +
          '<span class="lg"><span class="sw" style="background:#3a4160"></span>wall</span>' +
          '<span class="lg"><span class="sw" style="background:#3d3423"></span>mud (cost 3)</span>' +
          '<span class="lg"><span class="sw" style="background:rgba(139,92,246,.6)"></span>frontier</span>' +
          '<span class="lg"><span class="sw" style="background:rgba(0,229,199,.5)"></span>explored</span>' +
          '<span class="lg"><span class="sw" style="background:var(--cyan)"></span>path</span>' +
        '</div>' +

        '<div class="playback" style="margin-top:16px">' +
          '<button class="icon-btn" id="wd-play" aria-label="Play or pause">▶</button>' +
          '<button class="icon-btn" id="wd-step" aria-label="Step forward">⏭</button>' +
          '<button class="icon-btn" id="wd-clear" aria-label="Clear exploration">⟲</button>' +
          '<button class="btn" id="wd-run">▶ RUN ' + esc(ALGOS[S.algo].name) + '</button>' +
          '<button class="btn ghost sm" id="wd-compare">⚖ COMPARE ALL</button>' +
          '<span class="spacer"></span>' +
          '<label class="speed" style="font-size:10px;color:var(--dim)">SPEED ' +
            '<input type="range" id="wd-speed" min="0.5" max="4" step="0.5" value="' + S.speed + '" aria-label="Playback speed" style="width:120px">' +
            '<b id="wd-speed-label">' + S.speed.toFixed(1) + '×</b></label>' +
        '</div>' +

        '<div id="wd-compare-box"></div>' +
      '</div>' +
    '</div>';

  drawMaze();
  bind(root);
  if (S.compare) drawCompare();
}

function toolBtn(id, ico, label) {
  return '<button class="tool-btn' + (S.tool === id ? ' on' : '') + '" data-tool="' + id + '" ' +
    'aria-pressed="' + (S.tool === id) + '"><span class="t-ico">' + ico + '</span>' + label + '</button>';
}

function drawMaze() {
  const box = document.getElementById('wd-maze');
  if (!box) return;
  const w = S.grid[0].length, h = S.grid.length;
  let html = '';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      html += '<div class="cell ' + cellClass(x, y) + '" data-x="' + x + '" data-y="' + y + '" ' +
        'title="(' + x + ',' + y + ')"></div>';
    }
  }
  box.innerHTML = html;
  S.cells = Array.from(box.children);
}

function cellClass(x, y) {
  const v = S.grid[y][x];
  if (v === CELL.WALL) return 'wall';
  if (v === CELL.MUD) return 'mud';
  if (v === CELL.START) return 'start';
  if (v === CELL.GOAL) return 'goal';
  return '';
}

function cellEl(x, y) {
  const w = S.grid[0].length;
  return S.cells[y * w + x];
}

/* ───────────────────────── editing ───────────────────────── */

function paint(x, y) {
  const l = level();
  const { start, goal } = findEndpoints(S.grid);
  const isEndpoint = (start && start[0] === x && start[1] === y) || (goal && goal[0] === x && goal[1] === y);
  clearRun();

  if (S.tool === 'wall' && !isEndpoint) S.grid[y][x] = CELL.WALL;
  else if (S.tool === 'mud' && l.mud && !isEndpoint) S.grid[y][x] = CELL.MUD;
  else if (S.tool === 'erase' && !isEndpoint) S.grid[y][x] = CELL.EMPTY;
  else if (S.tool === 'start') {
    if (x === 0 || y === 0 || x === S.grid[0].length - 1 || y === S.grid.length - 1) return;
    if (start) S.grid[start[1]][start[0]] = CELL.EMPTY;
    S.grid[y][x] = CELL.START;
  } else if (S.tool === 'goal') {
    if (x === 0 || y === 0 || x === S.grid[0].length - 1 || y === S.grid.length - 1) return;
    if (goal) S.grid[goal[1]][goal[0]] = CELL.EMPTY;
    S.grid[y][x] = CELL.GOAL;
  } else return;
  drawMaze();
}

function clearRun() {
  stop();
  S.steps = null; S.path = null; S.step = 0; S.pathStep = 0; S.result = null; S.phase = 'idle';
  const st = document.getElementById('wd-status');
  if (st) { st.textContent = 'READY — paint a maze, then press RUN'; st.className = 'hud-status'; }
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('wd-explored', '0'); set('wd-frontier', '0'); set('wd-pathlen', '—'); set('wd-cost', '—');
}

/* ───────────────────────── run / playback ───────────────────────── */

function startRun() {
  const { start, goal } = findEndpoints(S.grid);
  if (!start || !goal) {
    status('NO START OR GOAL — place both tiles', 'err');
    AC.sfx.error();
    return;
  }
  clearRun();
  const res = ALGOS[S.algo].run(S.grid, start[0], start[1], goal[0], goal[1]);
  S.steps = res.steps;
  S.result = res;
  S.path = res.path;
  S.step = 0;
  S.pathStep = 0;
  S.phase = 'explore';

  if (reducedMotion()) {
    // reveal everything at once for reduced-motion users
    res.steps.forEach(st => markExplored(st));
    S.step = res.steps.length;
    finishRun();
    return;
  }
  status('RUNNING ' + ALGOS[S.algo].full.toUpperCase() + '…', '');
  setPlaying(true);
  AC.sfx.open();
}

function markExplored(st) {
  const el = cellEl(st.cell[0], st.cell[1]);
  if (el) { el.classList.remove('frontier'); el.classList.add('explored'); }
  (st.frontier || []).forEach(f => {
    const fe = cellEl(f[0], f[1]);
    if (fe && !fe.classList.contains('explored') && !fe.classList.contains('start') && !fe.classList.contains('goal')) {
      fe.classList.add('frontier');
    }
  });
}

function finishRun() {
  stop();
  const res = S.result;
  if (!res) return;
  if (res.status === 'found') {
    // draw path progressively
    S.phase = 'path';
    status('PATH FOUND — tracing ' + res.path.length + ' cells', 'ok');
    if (reducedMotion()) { drawPathFull(); } else { setPlaying(true); }
  } else {
    S.phase = 'done';
    status('NO PATH EXISTS — the goal is sealed off', 'err');
    AC.sfx.error();
  }
  updateHud();
}

function drawPathFull() {
  if (!S.path) { S.phase = 'done'; updateHud(); recordCompletion(); return; }
  S.path.forEach(p => {
    const el = cellEl(p[0], p[1]);
    if (el) el.classList.add('path');
  });
  S.pathStep = S.path.length;
  S.phase = 'done';
  updateHud();
  recordCompletion();
}

function tick() {
  if (S.phase === 'explore') {
    if (!S.steps || S.step >= S.steps.length) { finishRun(); return; }
    // adaptive batching: sweep large frontiers fast, finish fine-grained
    const batch = Math.max(1, Math.ceil((S.steps.length - S.step) / 90));
    for (let k = 0; k < batch && S.step < S.steps.length; k++, S.step++) markExplored(S.steps[S.step]);
    updateHud();
    if (S.step >= S.steps.length) finishRun();
  } else if (S.phase === 'path') {
    if (!S.path) { S.phase = 'done'; setPlaying(false); return; }
    const batch = Math.max(1, Math.ceil((S.path.length - S.pathStep) / 60));
    for (let k = 0; k < batch && S.pathStep < S.path.length; k++) {
      const p = S.path[S.pathStep++];
      const el = cellEl(p[0], p[1]);
      if (el) el.classList.add('path');
    }
    updateHud();
    if (S.pathStep >= S.path.length) {
      S.phase = 'done';
      setPlaying(false);
      updateHud();
      recordCompletion();
    }
  } else {
    setPlaying(false);
  }
}

function updateHud() {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  const exploredCount = document.querySelectorAll('#wd-maze .explored').length;
  const frontierCount = document.querySelectorAll('#wd-maze .frontier').length;
  set('wd-explored', String(exploredCount));
  set('wd-frontier', String(frontierCount));
  if (S.result && S.path) {
    set('wd-pathlen', String(S.path.length));
    set('wd-cost', S.result.cost != null ? String(S.result.cost) : String(pathHops()));
  } else if (S.phase === 'explore') {
    set('wd-pathlen', '—'); set('wd-cost', '—');
  }
}

function pathHops() {
  if (!S.path) return 0;
  let cost = 0;
  for (let i = 1; i < S.path.length; i++) {
    const c = S.grid[S.path[i][1]][S.path[i][0]];
    cost += c === CELL.MUD ? 3 : 1;
  }
  return cost;
}

function status(text, cls) {
  const el = document.getElementById('wd-status');
  if (el) { el.textContent = text; el.className = 'hud-status' + (cls ? ' ' + cls : ''); }
}

function interval() { return Math.max(30, Math.round(240 / S.speed)); }

function setPlaying(on) {
  S.playing = on;
  clearInterval(S.timer);
  if (on) S.timer = setInterval(tick, interval());
  const btn = document.getElementById('wd-play');
  if (btn) { btn.textContent = on ? '⏸' : '▶'; btn.setAttribute('aria-label', on ? 'Pause' : 'Play'); }
}

function stop() { setPlaying(false); }

/* ───────────────────────── completion / XP ───────────────────────── */

function recordCompletion() {
  if (!S.result || S.result.status !== 'found') return;
  const st = AC.getState();
  st.worlds.levels = st.worlds.levels || {};
  const first = !st.worlds.levels[S.level];
  if (first) {
    st.worlds.levels[S.level] = { at: Date.now(), algo: S.algo, explored: S.result.explored, pathLen: S.path.length };
    AC.save();
    AC.awardXP(level().xp);
    AC.awardAchievement('maze-navigator');
    AC.toast('LEVEL ' + S.level + ' CLEARED', level().name + ' — +' + level().xp + ' XP', true);
    AC.renderAll();
    // update the level button in place — a full re-render would wipe the traced path
    const btn = document.querySelector('.level-btn[data-level="' + S.level + '"]');
    if (btn) {
      btn.classList.add('done');
      const num = btn.querySelector('.lv-num');
      if (num) num.textContent = '✓';
    }
  }
  // Optimal Path: A* traced a route that provably equals the BFS shortest length
  if (S.algo === 'astar') {
    const noMud = S.grid.every(row => row.every(v => v !== CELL.MUD));
    if (noMud) {
      const { start, goal } = findEndpoints(S.grid);
      const best = AA.bfsHopDistance(S.grid, start[0], start[1], goal[0], goal[1]);
      if (best >= 0 && S.path.length - 1 === best) AC.awardAchievement('optimal-path');
    } else {
      AC.awardAchievement('optimal-path');
    }
  }
}

/* ───────────────────────── compare all ───────────────────────── */

function compareAll() {
  const { start, goal } = findEndpoints(S.grid);
  if (!start || !goal) { status('NO START OR GOAL — place both tiles', 'err'); return; }
  clearRun();
  const results = {};
  Object.keys(ALGOS).forEach(k => {
    results[k] = ALGOS[k].run(S.grid, start[0], start[1], goal[0], goal[1]);
  });
  S.compare = results;
  drawCompare();
  AC.sfx.check();
}

function drawCompare() {
  const box = document.getElementById('wd-compare-box');
  if (!box || !S.compare) return;
  const r = S.compare;
  const costOf = (k) => {
    const res = r[k];
    if (res.status !== 'found') return Infinity;
    if (res.cost != null) return res.cost;
    let c = 0;
    for (let i = 1; i < res.path.length; i++) {
      const cell = S.grid[res.path[i][1]][res.path[i][0]];
      c += cell === CELL.MUD ? 3 : 1;
    }
    return c;
  };
  const bestCost = Math.min(costOf('bfs'), costOf('dfs'), costOf('astar'));
  const bestExplored = Math.min(r.bfs.explored, r.dfs.explored, r.astar.explored);
  const hasMud = S.grid.some(row => row.some(v => v === CELL.MUD));

  box.innerHTML =
    '<div class="panel" style="margin-top:16px">' +
      '<div class="panel-t">STRATEGY COMPARISON — same maze, same start, same goal</div>' +
      '<div class="tbl-wrap"><table class="compare-table"><thead><tr>' +
        '<th>Algorithm</th><th>Cells explored</th><th>Path cells</th><th>Path cost</th><th>Status</th>' +
      '</tr></thead><tbody>' +
      Object.keys(ALGOS).map(k => {
        const res = r[k];
        const found = res.status === 'found';
        const cost = found ? costOf(k) : null;
        const hops = found ? res.path.length : null;
        const costCls = found && cost === bestCost ? 'best' : '';
        const expCls = res.explored === bestExplored ? 'best' : '';
        return '<tr><td><span class="algo-name"><span class="algo-dot" style="background:' + ALGOS[k].color + '"></span>' +
          esc(ALGOS[k].name) + ' <span style="color:var(--dim)">' + esc(ALGOS[k].full) + '</span></span></td>' +
          '<td class="' + expCls + '">' + res.explored + '</td>' +
          '<td>' + (found ? hops : '—') + '</td>' +
          '<td class="' + costCls + '">' + (found ? cost : '—') + '</td>' +
          '<td>' + (found ? '✓ found' : '✖ unreachable') + '</td></tr>';
      }).join('') +
      '</tbody></table></div>' +
      '<div class="note cy" style="margin-top:12px"><b>Reading the table:</b> ' +
      'fewest cells explored = most efficient search; lowest path cost = cheapest route' +
      (hasMud ? ' (mud costs 3 per step).' : ' (every step costs 1 here).') +
      ' BFS always returns the shortest route in hops; A* returns the cheapest route while typically exploring ' +
      'far fewer cells thanks to its heuristic; DFS returns <i>some</i> route — its exploration count and path ' +
      'quality vary wildly with the maze.</div>';
}

/* ───────────────────────── bindings ───────────────────────── */

function bind(root) {
  $$('[data-level]', root).forEach(b => b.addEventListener('click', () => {
    S.level = Number(b.dataset.level);
    S.grid = buildLevel(level());
    clearRun(); S.compare = null;
    AC.sfx.click(); render();
  }));
  $$('[data-tool]', root).forEach(b => b.addEventListener('click', () => {
    S.tool = b.dataset.tool; AC.sfx.click(); render();
  }));
  $$('[data-algo]', root).forEach(b => b.addEventListener('click', () => {
    S.algo = b.dataset.algo; clearRun(); AC.sfx.click(); render();
  }));

  $('#wd-reset').addEventListener('click', () => {
    S.grid = buildLevel(level()); clearRun(); S.compare = null;
    AC.sfx.click(); render();
  });
  $('#wd-regen').addEventListener('click', () => {
    S.grid = buildLevel(level()); clearRun(); S.compare = null;
    AC.sfx.click(); render();
    AC.toast('MAZE REGENERATED', 'Fresh layout, same rules.', true);
  });

  $('#wd-run').addEventListener('click', startRun);
  $('#wd-compare').addEventListener('click', compareAll);
  $('#wd-play').addEventListener('click', () => {
    if (S.phase === 'idle') { startRun(); return; }
    if (S.phase === 'done') return;
    if (S.playing) stop();
    else if (S.steps || S.path) { status('RESUMED', ''); setPlaying(true); }
    else startRun();
  });
  $('#wd-step').addEventListener('click', () => {
    if (S.phase === 'idle') {
      const { start, goal } = findEndpoints(S.grid);
      if (!start || !goal) { status('NO START OR GOAL — place both tiles', 'err'); return; }
      clearRun();
      const res = ALGOS[S.algo].run(S.grid, start[0], start[1], goal[0], goal[1]);
      S.steps = res.steps; S.result = res; S.path = res.path;
      S.phase = 'explore'; status('STEPPING ' + ALGOS[S.algo].full.toUpperCase(), '');
    }
    stop(); tick();
  });
  $('#wd-clear').addEventListener('click', () => { clearRun(); AC.sfx.click(); });
  $('#wd-speed').addEventListener('input', (e) => {
    S.speed = Number(e.target.value);
    const lbl = document.getElementById('wd-speed-label');
    if (lbl) lbl.textContent = S.speed.toFixed(1) + '×';
    if (S.playing) { clearInterval(S.timer); S.timer = setInterval(tick, interval()); }
  });

  // grid painting
  const box = document.getElementById('wd-maze');
  let painting = false;
  box.addEventListener('pointerdown', (e) => {
    const c = e.target.closest('.cell');
    if (!c) return;
    painting = true;
    paint(Number(c.dataset.x), Number(c.dataset.y));
    e.preventDefault();
  });
  box.addEventListener('pointermove', (e) => {
    if (!painting) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el && el.classList && el.classList.contains('cell')) {
      paint(Number(el.dataset.x), Number(el.dataset.y));
    }
  });
  document.addEventListener('pointerup', () => { painting = false; });
}

/* ───────────────────────── boot ───────────────────────── */

function init() {
  render();
  window.AA_FEATURES = window.AA_FEATURES || [];
  window.AA_FEATURES.push({ onView: (name) => { if (name === 'worlds') render(); } });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

/* test hooks */
window.AA_WORLDS = { LEVELS, ALGOS, buildLevel, current: S };

})();
