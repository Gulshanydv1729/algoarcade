/* ============================================================================
   ALGOARCADE — PURE LOGIC TESTS (no DOM required)
   1. Instrumented searches & sorts (correctness + edge cases)
   2. Complexity-Lab counters (growth sanity)
   3. Maze pathfinding (BFS optimality, DFS validity, A* optimality incl. mud)
   4. Debugging Bosses (correct fixes pass, broken fixes fail, all combos run)
   5. Showdown pairs + input validation
   ========================================================================== */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let fail = 0, pass = 0;
const ok = (label, cond, extra) => {
  if (cond) { pass++; console.log('  \x1b[32mPASS\x1b[0m ' + label); }
  else { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + label + (extra !== undefined ? '  -> ' + extra : '')); }
};

/* ── shared sandbox: algorithms + feature logic files ─────────────────── */
const sandbox = {
  window: {},
  document: {
    readyState: 'complete',
    getElementById: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    createElement: () => ({ style: {}, classList: { add() {}, remove() {} }, setAttribute() {}, appendChild() {} }),
    body: { appendChild() {} }
  },
  console
};
sandbox.window.matchMedia = () => ({ matches: false });
sandbox.window.ALGOARCADE = {
  esc: (s) => String(s),
  sfx: { click() {}, open() {}, close() {}, check() {}, success() {}, error() {}, level() {}, start() {} },
  getState: () => ({ xp: 0, showdown: {}, bosses: { solved: {} }, lab: { predictions: {} }, worlds: { levels: {} }, achievements: {} }),
  save() {}, toast() {}, renderAll() {}, awardXP() {}, awardAchievement() {}, levelFor: (x) => 1
};
vm.createContext(sandbox);
for (const f of ['algorithms.js', 'bosses.js', 'showdown.js', 'lab.js', 'worlds.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, f), 'utf8'), sandbox, { filename: f });
}
const AA = sandbox.window.AA_ALGO;
const { BOSSES, runTests, isCorrect, assemble } = sandbox.window.AA_BOSSES;
const SHOW = sandbox.window.AA_SHOWDOWN;
const LAB = sandbox.window.AA_LAB;
const WORLDS = sandbox.window.AA_WORLDS;

const isSorted = (a) => a.every((v, i) => i === 0 || a[i - 1] <= v);
const sameMultiset = (a, b) => a.slice().sort((x, y) => x - y).join(',') === b.slice().sort((x, y) => x - y).join(',');

/* ═══════════════ 1. SEARCHES ═══════════════ */
console.log('\n── SEARCH TRACES ──');
{
  const r1 = AA.linearSearchSteps([2, 4, 6, 8], 6);
  ok('linear finds target', r1.result === 2, r1.result);
  ok('linear counts 3 comparisons', r1.stats.comparisons === 3, r1.stats.comparisons);
  const r2 = AA.linearSearchSteps([1, 2, 3], 9);
  ok('linear missing → -1', r2.result === -1, r2.result);
  ok('linear empty → -1, 0 comparisons', (() => { const r = AA.linearSearchSteps([], 1); return r.result === -1 && r.stats.comparisons === 0; })());

  const r3 = AA.binarySearchSteps([1, 3, 5, 7, 9], 7);
  ok('binary finds target', r3.result === 3, r3.result);
  ok('binary does ≤ 4 comparisons on 5 items', r3.stats.comparisons <= 4, r3.stats.comparisons);
  ok('binary missing → -1', AA.binarySearchSteps([1, 3, 5, 7, 9], 4).result === -1);
  ok('binary empty → -1', AA.binarySearchSteps([], 5).result === -1);

  let agree = true;
  for (let t = 0; t < 30; t++) {
    const arr = AA.genDataset(20 + t, 'random').sort((a, b) => a - b);
    const target = t % 3 === 0 ? arr[Math.floor(Math.random() * arr.length)] : -999;
    if ((AA.linearSearchSteps(arr, target).result >= 0) !== (AA.binarySearchSteps(arr, target).result >= 0)) agree = false;
  }
  ok('linear & binary agree on presence (30 trials)', agree);
}

/* ═══════════════ 2. SORTS ═══════════════ */
console.log('\n── SORT TRACES ──');
const SORTS = [
  ['bubble', AA.bubbleSortSteps],
  ['insertion', AA.insertionSortSteps],
  ['selection', AA.selectionSortSteps],
  ['merge', AA.mergeSortSteps]
];
{
  const cases = [
    ['empty', []],
    ['single', [7]],
    ['two', [2, 1]],
    ['sorted', [1, 2, 3, 4, 5]],
    ['reversed', [9, 7, 5, 3, 1]],
    ['duplicates', [3, 1, 3, 2, 1]],
    ['negatives', [-5, 3, -1, 0, -2]],
    ['medium', [42, 7, 19, 3, 88, 1, 55, 23, 9, 64]]
  ];
  for (const [name, fn] of SORTS) {
    let allOk = true, detail = '';
    for (const [cname, input] of cases) {
      const r = fn(input);
      if (!isSorted(r.result)) { allOk = false; detail = name + '/' + cname + ' not sorted'; }
      else if (!sameMultiset(r.result, input)) { allOk = false; detail = name + '/' + cname + ' lost elements'; }
      else if (r.stats.ops !== (r.stats.comparisons || 0) + ((r.stats.swaps || 0) + (r.stats.writes || 0))) { allOk = false; detail = name + '/' + cname + ' ops mismatch'; }
      else if (r.steps.length === 0) { allOk = false; detail = name + '/' + cname + ' no steps'; }
    }
    ok(name + ' sorts all 8 edge cases correctly', allOk, detail);
  }

  const rand = AA.genDataset(60, 'random');
  ok('bubble result equals reference sort',
    AA.bubbleSortSteps(rand).result.join(',') === rand.slice().sort((a, b) => a - b).join(','));
  ok('merge result equals reference sort',
    AA.mergeSortSteps(rand).result.join(',') === rand.slice().sort((a, b) => a - b).join(','));

  const finalMarks = AA.insertionSortSteps([5, 2, 9]).steps;
  ok('final step marks everything sorted', finalMarks[finalMarks.length - 1].marks.length === 3);
}

/* ═══════════════ 3. LAB COUNTERS ═══════════════ */
console.log('\n── LAB COUNTERS ──');
{
  const n = 64;
  const data = AA.genDataset(n, 'random');
  const mergeOps = AA.countMerge(data).ops;
  const bubbleOps = AA.countBubble(data).ops;
  ok('merge ops (n log n) < bubble ops (n²) at n=64', mergeOps < bubbleOps, mergeOps + ' vs ' + bubbleOps);

  const sorted = AA.genDataset(128, 'sorted');
  let binaryWithinLog = true;
  for (let t = 0; t < 25; t++) {
    const target = t % 2 ? sorted[Math.floor(Math.random() * sorted.length)] : -7;
    const c = AA.countBinarySearch(sorted, target).comparisons;
    if (c > Math.ceil(Math.log2(sorted.length)) + 1) binaryWithinLog = false;
  }
  ok('binary search stays within log2(n)+1 comparisons', binaryWithinLog);

  const linLinear = AA.countLinearSearch(sorted, -7).comparisons;
  ok('linear worst case scans all n', linLinear === 128, linLinear);

  ok('fib(5) = 15 calls', AA.countFib(5).calls === 15, AA.countFib(5).calls);
  ok('fib(10) = 177 calls', AA.countFib(10).calls === 177, AA.countFib(10).calls);

  const s512 = LAB.sweepSizes(512);
  ok('sweep starts at 8, ends at cap, monotonic',
    s512[0] === 8 && s512[s512.length - 1] === 512 && s512.every((v, i) => i === 0 || v > s512[i - 1]), s512.join(','));
  ok('sweep has ≥ 10 points', s512.length >= 10, s512.length);
  ok('sweep(32) ends at 32', LAB.sweepSizes(32).slice(-1)[0] === 32);

  // prediction logic: merge(n log n) vs bubble(n²) → bubble correct;
  // bubble vs insertion (same class) → tie correct
  LAB.current.selected = ['merge', 'bubble'];
  ok('prediction: bubble grows faster than merge', LAB.predictionQuestion().correct === 'b', LAB.predictionQuestion().correct);
  LAB.current.selected = ['bubble', 'insertion'];
  ok('prediction: same class → tie', LAB.predictionQuestion().correct === 'tie', LAB.predictionQuestion().correct);
  LAB.current.selected = ['binary-search', 'linear-search'];
  ok('prediction: linear search grows faster than binary', LAB.predictionQuestion().correct === 'b', LAB.predictionQuestion().correct);
  LAB.current.selected = ['merge', 'bubble'];
}

/* ═══════════════ 4. MAZE / PATHFINDING ═══════════════ */
console.log('\n── PATHFINDING ──');
{
  // generated mazes always solvable + correct dimensions
  const g = AA.generateMaze(21, 14);
  ok('maze has correct dimensions', g.length === 14 && g[0].length === 21);
  ok('maze border is walled', g[0].every(v => v === AA.CELL.WALL) && g[13].every(v => v === AA.CELL.WALL));
  ok('maze start at (1,1), goal at (w-2,h-2)', g[1][1] === AA.CELL.START && g[12][19] === AA.CELL.GOAL);
  ok('maze always has a path start→goal', AA.bfsHopDistance(g, 1, 1, 19, 12) >= 0);

  // BFS optimality on many random mazes: path hops === independent hop distance
  let bfsOptimal = true, bfsDetail = '';
  for (let t = 0; t < 30; t++) {
    const m = AA.generateMaze(17, 12);
    const r = AA.bfsSolve(m, 1, 1, 15, 10);
    const best = AA.bfsHopDistance(m, 1, 1, 15, 10);
    if (r.status !== 'found' || r.path.length - 1 !== best) { bfsOptimal = false; bfsDetail = 'trial ' + t + ': ' + (r.path ? r.path.length - 1 : 'none') + ' vs ' + best; break; }
  }
  ok('BFS finds the shortest path (30 random mazes)', bfsOptimal, bfsDetail);

  // DFS paths are always valid (contiguous, no walls, endpoints respected)
  let dfsValid = true, dfsDetail = '';
  for (let t = 0; t < 30; t++) {
    const m = AA.generateMaze(17, 12);
    const r = AA.dfsSolve(m, 1, 1, 15, 10);
    if (r.status !== 'found') { dfsValid = false; dfsDetail = 'trial ' + t + ' not found'; break; }
    const p = r.path;
    if (p[0][0] !== 1 || p[0][1] !== 1 || p[p.length - 1][0] !== 15 || p[p.length - 1][1] !== 10) { dfsValid = false; dfsDetail = 'trial ' + t + ' endpoints'; break; }
    let contiguous = true;
    for (let i = 1; i < p.length; i++) {
      const d = Math.abs(p[i][0] - p[i - 1][0]) + Math.abs(p[i][1] - p[i - 1][1]);
      if (d !== 1 || m[p[i][1]][p[i][0]] === AA.CELL.WALL) { contiguous = false; break; }
    }
    if (!contiguous) { dfsValid = false; dfsDetail = 'trial ' + t + ' not contiguous'; break; }
  }
  ok('DFS returns valid paths (30 random mazes)', dfsValid, dfsDetail);

  // DFS is not guaranteed optimal. Perfect mazes (no cycles) can't show the
  // difference — BFS and DFS both find the unique path there — so use an open
  // grid, where DFS's dive-first order wanders badly. (Deterministic: fixed
  // grid + deterministic DFS = fixed result: 68 hops vs BFS's 20.)
  {
    const g = AA.emptyGrid(15, 11);
    for (let x = 0; x < 15; x++) { g[0][x] = 1; g[10][x] = 1; }
    for (let y = 0; y < 11; y++) { g[y][0] = 1; g[y][14] = 1; }
    g[1][1] = AA.CELL.START; g[9][13] = AA.CELL.GOAL;
    const b = AA.bfsSolve(g, 1, 1, 13, 9);
    const d = AA.dfsSolve(g, 1, 1, 13, 9);
    ok('open grid: DFS path much longer than BFS (20 vs 68 hops)', d.path.length - 1 > b.path.length - 1,
      b.path.length - 1 + ' vs ' + d.path.length - 1);
  }

  // On perfect mazes the two coincide — worth documenting as expected behavior
  {
    const m = AA.generateMaze(19, 13);
    const b = AA.bfsSolve(m, 1, 1, 17, 11);
    const d = AA.dfsSolve(m, 1, 1, 17, 11);
    ok('perfect maze: unique path ⇒ BFS and DFS agree on length (neither is "lucky luck")',
      b.status === 'found' && d.status === 'found' && b.path.length === d.path.length);
  }

  // A* with no mud: matches BFS shortest
  let astarOptimal = true, astarDetail = '';
  for (let t = 0; t < 30; t++) {
    const m = AA.generateMaze(17, 12);
    const a = AA.astarSolve(m, 1, 1, 15, 10);
    const best = AA.bfsHopDistance(m, 1, 1, 15, 10);
    if (a.status !== 'found' || a.path.length - 1 !== best) { astarOptimal = false; astarDetail = 'trial ' + t + ': ' + (a.path ? a.path.length - 1 : 'none') + ' vs ' + best; break; }
  }
  ok('A* matches BFS shortest on unweighted mazes (30 trials)', astarOptimal, astarDetail);

  // A* with mud: matches an independent Dijkstra reference on weighted cost
  const dijkstraCost = (m, sx, sy, gx, gy) => {
    const h = m.length, w = m[0].length;
    const cost = (x, y) => m[y][x] === AA.CELL.MUD ? 3 : 1;
    const dist = new Map([[sy * w + sx, 0]]);
    const seen = new Set();
    while (true) {
      let best = null, bestD = Infinity;
      for (const [k, d] of dist) {
        if (seen.has(k)) continue;
        if (d < bestD) { bestD = d; best = k; }
      }
      if (best === null) return Infinity;
      seen.add(best);
      const x = best % w, y = Math.floor(best / w);
      if (x === gx && y === gy) return bestD;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        if (m[ny][nx] === AA.CELL.WALL) continue;
        const nk = ny * w + nx;
        const nd = bestD + cost(nx, ny);
        if (nd < (dist.has(nk) ? dist.get(nk) : Infinity)) dist.set(nk, nd);
      }
    }
  };
  let astarWeightedOk = true, astarWeightedDetail = '';
  for (let t = 0; t < 25; t++) {
    const m = AA.generateMaze(15, 11);
    // add mud to ~10% of open cells
    for (let y = 1; y < m.length - 1; y++) for (let x = 1; x < m[0].length - 1; x++) {
      if (m[y][x] === AA.CELL.EMPTY && Math.random() < 0.1) m[y][x] = AA.CELL.MUD;
    }
    const a = AA.astarSolve(m, 1, 1, 13, 9);
    if (a.status !== 'found') { astarWeightedOk = false; astarWeightedDetail = 'trial ' + t + ' unreachable'; break; }
    // verify returned cost equals sum of step costs along its own path
    let sum = 0;
    for (let i = 1; i < a.path.length; i++) sum += m[a.path[i][1]][a.path[i][0]] === AA.CELL.MUD ? 3 : 1;
    const ref = dijkstraCost(m, 1, 1, 13, 9);
    if (a.cost !== sum || a.cost !== ref) { astarWeightedOk = false; astarWeightedDetail = 'trial ' + t + ': a*=' + a.cost + ' sum=' + sum + ' dijkstra=' + ref; break; }
  }
  ok('A* respects terrain cost = Dijkstra reference (25 trials)', astarWeightedOk, astarWeightedDetail);

  // unreachable maze (goal sealed in a box)
  const sealed = AA.emptyGrid(7, 7);
  for (let i = 0; i < 7; i++) { sealed[0][i] = 1; sealed[6][i] = 1; sealed[i][0] = 1; sealed[i][6] = 1; }
  sealed[3][3] = AA.CELL.START;
  sealed[5][5] = AA.CELL.GOAL;
  sealed[4][4] = 1; sealed[4][5] = 1; sealed[5][4] = 1; // box around goal
  sealed[4][3] = 1;
  const un1 = AA.bfsSolve(sealed, 3, 3, 5, 5);
  const un2 = AA.dfsSolve(sealed, 3, 3, 5, 5);
  const un3 = AA.astarSolve(sealed, 3, 3, 5, 5);
  ok('impossible maze: BFS/DFS/A* all report no path',
    un1.status === 'none' && un1.path === null &&
    un2.status === 'none' && un2.path === null &&
    un3.status === 'none' && un3.path === null);

  // blocked endpoints: start on an isolated cell
  const blocked = AA.emptyGrid(5, 5);
  blocked[2][2] = AA.CELL.START;
  blocked[2][1] = 1; blocked[2][3] = 1; blocked[1][2] = 1; blocked[3][2] = 1;
  blocked[0][0] = AA.CELL.GOAL;
  ok('blocked start: reported unreachable, explored = 1',
    AA.bfsSolve(blocked, 2, 2, 0, 0).status === 'none' &&
    AA.bfsSolve(blocked, 2, 2, 0, 0).explored === 1);

  // start === goal
  const same = AA.bfsSolve(g, 1, 1, 1, 1);
  ok('start = goal → path of length 1', same.status === 'found' && same.path.length === 1);

  // level layouts build correctly for every level
  let levelsOk = true, levelDetail = '';
  for (const l of WORLDS.LEVELS) {
    const grid = WORLDS.buildLevel(l);
    if (grid.length !== l.h || grid[0].length !== l.w) { levelsOk = false; levelDetail = 'dims ' + l.id; break; }
    let start = null, goal = null;
    grid.forEach((row, y) => row.forEach((v, x) => { if (v === AA.CELL.START) start = [x, y]; if (v === AA.CELL.GOAL) goal = [x, y]; }));
    if (!start || !goal) { levelsOk = false; levelDetail = 'endpoints ' + l.id; break; }
    if (AA.bfsHopDistance(grid, start[0], start[1], goal[0], goal[1]) < 0) { levelsOk = false; levelDetail = 'unsolvable level ' + l.id; break; }
  }
  ok('all 4 level layouts build with valid, solvable start→goal', levelsOk, levelDetail);
}

/* ═══════════════ 5. DEBUGGING BOSSES ═══════════════ */
console.log('\n── DEBUGGING BOSSES ──');
{
  ok('8 bosses shipped', BOSSES.length === 8, BOSSES.length);
  const topics = new Set(BOSSES.map(b => b.topic.toLowerCase()));
  ok('topics cover arrays/searching/sorting/loops/recursion/graphs',
    ['arrays', 'searching', 'sorting', 'loops', 'recursion', 'graphs'].every(t => topics.has(t)),
    Array.from(topics).join(','));

  let shapeOk = true, shapeDetail = '';
  for (const ch of BOSSES) {
    if (!ch.hints || ch.hints.length !== 3) { shapeOk = false; shapeDetail = ch.id + ': ' + (ch.hints ? ch.hints.length : 0) + ' hints'; break; }
    if (!ch.explanation || !ch.expected || !ch.brief) { shapeOk = false; shapeDetail = ch.id + ': missing text'; break; }
    if (ch.tests.length < 4) { shapeOk = false; shapeDetail = ch.id + ': only ' + ch.tests.length + ' tests'; break; }
    if (!ch.slots || !ch.slots.length) { shapeOk = false; shapeDetail = ch.id + ': no slots'; break; }
    // must include a boundary/edge test (empty array, zero, absent target, unreachable…)
    const hasEdge = ch.tests.some(t => {
      const j = JSON.stringify(t.args);
      return j.includes('[]') || j === '[0]' || j.includes('-1') || j.includes('0]') ||
             t.label.toLowerCase().includes('empty') || t.label.toLowerCase().includes('boundary') ||
             t.label.toLowerCase().includes('absent') || t.label.toLowerCase().includes('zero') ||
             t.label.toLowerCase().includes('unreachable') || t.label.toLowerCase().includes('single') ||
             t.label.toLowerCase().includes('k = 0') || t.label.toLowerCase().includes('identity');
    });
    if (!hasEdge) { shapeOk = false; shapeDetail = ch.id + ': no edge-case test'; break; }
  }
  ok('every boss: 3 hints, expected text, ≥4 tests incl. an edge case', shapeOk, shapeDetail);

  let correctPasses = true, correctDetail = '';
  for (const ch of BOSSES) {
    const results = runTests(ch, ch.slots.map(s => s.answers));
    const failed = results.filter(r => !r.ok);
    if (failed.length) { correctPasses = false; correctDetail = ch.id + ': ' + failed.map(f => f.t.label).join(', '); break; }
  }
  ok('the CORRECT fix passes every test for all 8 bosses', correctPasses, correctDetail);

  let brokenFails = true, brokenDetail = '';
  for (const ch of BOSSES) {
    // default selection = option 0 in every slot, which is authored as the broken version
    const results = runTests(ch, {});
    const failed = results.filter(r => !r.ok);
    if (!failed.length) { brokenFails = false; brokenDetail = ch.id + ': broken code passed all tests'; break; }
    if (isCorrect(ch, {})) { brokenFails = false; brokenDetail = ch.id + ': default marked correct'; break; }
  }
  ok('the DEFAULT (broken) selection fails ≥1 test on every boss', brokenFails, brokenDetail);

  let combosOk = true, combosDetail = '';
  let comboCount = 0;
  for (const ch of BOSSES) {
    // enumerate every combination of repair options — all must terminate and grade
    const combos = [[]];
    ch.slots.forEach((slot, i) => {
      const next = [];
      for (const c of combos) for (let oi = 0; oi < slot.options.length; oi++) next.push(c.concat([oi]));
      combos.length = 0; combos.push(...next);
    });
    for (const combo of combos) {
      comboCount++;
      try {
        const sel = {};
        combo.forEach((oi, i) => { sel[i] = oi; });
        const results = runTests(ch, sel);
        if (!Array.isArray(results) || results.length !== ch.tests.length) { combosOk = false; combosDetail = ch.id + ' combo ' + combo.join('/'); break; }
      } catch (e) { combosOk = false; combosDetail = ch.id + ' combo ' + combo.join('/') + ': ' + e.message; break; }
    }
    if (!combosOk) break;
  }
  ok('all ' + comboCount + ' repair-option combinations terminate and grade', combosOk, combosDetail);

  // assembled source for a correct fix contains no template slots left
  const ch0 = BOSSES[0];
  ok('assembly leaves no unresolved slots',
    assemble(ch0, ch0.slots.map(s => s.answers)).indexOf('{{') === -1);

  // explanation present for solution reveal
  ok('every boss ships a solution explanation', BOSSES.every(b => b.explanation && b.explanation.length > 40));
}

/* ═══════════════ 6. SHOWDOWN ═══════════════ */
console.log('\n── SHOWDOWN ──');
{
  ok('3 compatible pairs shipped', SHOW.PAIRS.length === 3, SHOW.PAIRS.length);

  for (const pair of SHOW.PAIRS) {
    const isSearch = pair.kind === 'search';
    const input = isSearch ? [1, 3, 5, 7, 9, 11, 13] : [5, 2, 9, 1, 5, 6];
    const a = isSearch ? pair.a.run(input.slice(), 9) : pair.a.run(input.slice());
    const b = isSearch ? pair.b.run(input.slice(), 9) : pair.b.run(input.slice());
    ok(pair.id + ': both ran with positive op counts',
      a.stats.ops > 0 && b.stats.ops > 0 && a.steps.length > 0 && b.steps.length > 0,
      a.stats.ops + '/' + b.stats.ops);
    if (!isSearch) {
      ok(pair.id + ': both produce correctly sorted output',
        isSorted(a.result) && isSorted(b.result) && sameMultiset(a.result, input) && sameMultiset(b.result, input));
    } else {
      ok(pair.id + ': both agree on found index (sorted input)',
        a.result === b.result, a.result + ' vs ' + b.result);
    }
  }

  // input validation
  SHOW.current.pairId = 'linear-vs-binary';
  const errSorted = SHOW.applyInputTo('3,1,2');
  ok('search pair rejects unsorted custom input', typeof errSorted === 'string' && /ascending/i.test(errSorted), errSorted);
  ok('search pair accepts sorted custom input', SHOW.applyInputTo('1,2,3,4') === null);
  ok('rejects < 2 numbers', typeof SHOW.applyInputTo('5') === 'string');
  ok('rejects > 60 items', typeof SHOW.applyInputTo(new Array(61).fill(1).join(',')) === 'string');
  SHOW.current.pairId = 'bubble-vs-merge';
  ok('sort pair accepts unsorted custom input', SHOW.applyInputTo('9,1,2') === null);

  // linear vs binary on identical search input: binary must not be worse asymptotically
  const arr = AA.genDataset(40, 'random').sort((x, y) => x - y);
  const target = 33;
  const lin = AA.linearSearchSteps(arr, target).stats.ops;
  const bin = AA.binarySearchSteps(arr, target).stats.ops;
  ok('binary search uses fewer ops than linear on n=40', bin < lin, bin + ' vs ' + lin);
  SHOW.current.pairId = 'linear-vs-binary';
}

/* ── summary ── */
console.log('\n' + (fail === 0
  ? '\x1b[32mALL ALGORITHM TESTS PASS — ' + pass + ' assertions\x1b[0m\n'
  : '\x1b[31m' + fail + ' FAILED / ' + (pass + fail) + ' total\x1b[0m\n'));
process.exit(fail === 0 ? 0 : 1);
