/* ============================================================================
   ALGOARCADE — ALGORITHM LIBRARY
   Pure, DOM-free, instrumented implementations.
   - *Steps(): full step traces for visualization (Showdown, home preview)
   - *Count(): lightweight operation counters for the Complexity Lab
   - maze pathfinding: BFS / DFS / A* with per-step frontier snapshots
   Everything here is deterministic given the same input.
   ========================================================================== */
(function () {
'use strict';

const AA = {};

/* ───────────────────────── search ───────────────────────── */

AA.linearSearchSteps = function (arr, target) {
  const a = arr.slice();
  const steps = [];
  let comparisons = 0, result = -1;
  for (let i = 0; i < a.length; i++) {
    comparisons++;
    steps.push({
      a: a.slice(),
      marks: [{ i, k: 'cmp' }],
      text: 'compare a[' + i + '] = ' + a[i] + ' against ' + target,
      ops: comparisons
    });
    if (a[i] === target) { result = i; break; }
  }
  steps.push({
    a: a.slice(),
    marks: result >= 0 ? [{ i: result, k: 'done' }] : [],
    text: result >= 0 ? 'FOUND at index ' + result : 'not found after ' + comparisons + ' comparisons',
    ops: comparisons
  });
  return { steps, result, stats: { comparisons, ops: comparisons } };
};

AA.binarySearchSteps = function (arr, target) {
  const a = arr.slice();
  const steps = [];
  let comparisons = 0, lo = 0, hi = a.length - 1, result = -1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    comparisons++;
    steps.push({
      a: a.slice(),
      marks: [{ i: lo, k: 'lo' }, { i: mid, k: 'cmp' }, { i: hi, k: 'hi' }],
      text: 'lo=' + lo + ' hi=' + hi + ' → mid=' + mid + ' (a[mid]=' + a[mid] + ')',
      ops: comparisons
    });
    if (a[mid] === target) { result = mid; break; }
    if (a[mid] < target) lo = mid + 1; else hi = mid - 1;
  }
  steps.push({
    a: a.slice(),
    marks: result >= 0 ? [{ i: result, k: 'done' }] : [],
    text: result >= 0 ? 'FOUND at index ' + result : 'not found in ' + comparisons + ' comparisons',
    ops: comparisons
  });
  return { steps, result, stats: { comparisons, ops: comparisons } };
};

/* ───────────────────────── sorts (traced) ───────────────────────── */

AA.bubbleSortSteps = function (input) {
  const a = input.slice();
  const steps = [];
  let comparisons = 0, swaps = 0;
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      comparisons++;
      steps.push({
        a: a.slice(),
        marks: [{ i: j, k: 'cmp' }, { i: j + 1, k: 'cmp' }],
        text: 'pass ' + (i + 1) + ' · compare a[' + j + ']=' + a[j] + ' vs a[' + (j + 1) + ']=' + a[j + 1],
        ops: comparisons + swaps
      });
      if (a[j] > a[j + 1]) {
        const t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
        swaps++; swapped = true;
        steps.push({
          a: a.slice(),
          marks: [{ i: j, k: 'swap' }, { i: j + 1, k: 'swap' }],
          text: 'swap a[' + j + '] ↔ a[' + (j + 1) + ']',
          ops: comparisons + swaps
        });
      }
    }
    steps.push({
      a: a.slice(),
      marks: [{ i: n - 1 - i, k: 'sorted' }],
      text: 'pass ' + (i + 1) + ' complete — position ' + (n - 1 - i) + ' is final',
      ops: comparisons + swaps
    });
    if (!swapped) break;
  }
  steps.push({
    a: a.slice(),
    marks: a.map((_, i) => ({ i, k: 'sorted' })),
    text: 'sorted in ' + comparisons + ' comparisons, ' + swaps + ' swaps',
    ops: comparisons + swaps
  });
  return { steps, result: a, stats: { comparisons, swaps, ops: comparisons + swaps } };
};

AA.insertionSortSteps = function (input) {
  const a = input.slice();
  const steps = [];
  let comparisons = 0, writes = 0;
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    steps.push({
      a: a.slice(),
      marks: [{ i, k: 'piv' }],
      text: 'pick key a[' + i + '] = ' + key + ' — insert into sorted prefix',
      ops: comparisons + writes
    });
    while (j >= 0) {
      comparisons++;
      steps.push({
        a: a.slice(),
        marks: [{ i: j, k: 'cmp' }, { i: i, k: 'piv' }],
        text: 'compare key ' + key + ' vs a[' + j + '] = ' + a[j],
        ops: comparisons + writes
      });
      if (a[j] > key) {
        a[j + 1] = a[j];
        writes++;
        steps.push({
          a: a.slice(),
          marks: [{ i: j + 1, k: 'swap' }, { i: j, k: 'cmp' }],
          text: 'shift a[' + j + '] right into a[' + (j + 1) + ']',
          ops: comparisons + writes
        });
        j--;
      } else break;
    }
    a[j + 1] = key;
    writes++;
    steps.push({
      a: a.slice(),
      marks: [{ i: j + 1, k: 'done' }],
      text: 'place key ' + key + ' at a[' + (j + 1) + ']',
      ops: comparisons + writes
    });
  }
  steps.push({
    a: a.slice(),
    marks: a.map((_, i) => ({ i, k: 'sorted' })),
    text: 'sorted in ' + comparisons + ' comparisons, ' + writes + ' writes',
    ops: comparisons + writes
  });
  return { steps, result: a, stats: { comparisons, writes, ops: comparisons + writes } };
};

AA.selectionSortSteps = function (input) {
  const a = input.slice();
  const steps = [];
  let comparisons = 0, swaps = 0;
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      comparisons++;
      steps.push({
        a: a.slice(),
        marks: [{ i: min, k: 'piv' }, { i: j, k: 'cmp' }],
        text: 'scan for minimum: a[' + j + ']=' + a[j] + ' vs current min a[' + min + ']=' + a[min],
        ops: comparisons + swaps
      });
      if (a[j] < a[min]) min = j;
    }
    if (min !== i) {
      const t = a[i]; a[i] = a[min]; a[min] = t;
      swaps++;
    }
    steps.push({
      a: a.slice(),
      marks: [{ i, k: 'sorted' }, min !== i ? { i: min, k: 'swap' } : { i, k: 'sorted' }],
      text: 'place minimum ' + a[i] + ' at position ' + i + (min !== i ? ' (swapped with a[' + min + '])' : ''),
      ops: comparisons + swaps
    });
  }
  steps.push({
    a: a.slice(),
    marks: a.map((_, i) => ({ i, k: 'sorted' })),
    text: 'sorted in ' + comparisons + ' comparisons, ' + swaps + ' swaps',
    ops: comparisons + swaps
  });
  return { steps, result: a, stats: { comparisons, swaps, ops: comparisons + swaps } };
};

AA.mergeSortSteps = function (input) {
  const a = input.slice();
  const steps = [];
  let comparisons = 0, writes = 0;
  const tmp = new Array(a.length);
  const marks = (lo, hi) => {
    const m = [];
    for (let i = lo; i < hi; i++) m.push({ i, k: 'sorted' });
    return m;
  };
  (function sort(lo, hi) {
    if (hi - lo <= 1) return;
    const mid = lo + Math.floor((hi - lo) / 2);
    sort(lo, mid);
    sort(mid, hi);
    let i = lo, j = mid, k = lo;
    for (let x = lo; x < hi; x++) tmp[x] = a[x];
    while (i < mid && j < hi) {
      comparisons++;
      if (tmp[i] <= tmp[j]) a[k++] = tmp[i++]; else a[k++] = tmp[j++];
      writes++;
    }
    while (i < mid) { a[k++] = tmp[i++]; writes++; }
    while (j < hi) { a[k++] = tmp[j++]; writes++; }
    steps.push({
      a: a.slice(),
      marks: marks(lo, hi),
      text: 'merge [' + lo + '..' + mid + ') and [' + mid + '..' + hi + ') into sorted range',
      ops: comparisons + writes
    });
  })(0, a.length);
  steps.push({
    a: a.slice(),
    marks: a.map((_, i) => ({ i, k: 'sorted' })),
    text: 'sorted in ' + comparisons + ' comparisons, ' + writes + ' writes',
    ops: comparisons + writes
  });
  return { steps, result: a, stats: { comparisons, writes, ops: comparisons + writes } };
};

/* ───────────────────────── sorts (count-only, for the Lab) ───────────────────────── */

AA.countBubble = function (a) {
  a = a.slice();
  let comparisons = 0, swaps = 0;
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      comparisons++;
      if (a[j] > a[j + 1]) { const t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; swaps++; swapped = true; }
    }
    if (!swapped) break;
  }
  return { comparisons, swaps, ops: comparisons + swaps };
};

AA.countInsertion = function (a) {
  a = a.slice();
  let comparisons = 0, writes = 0;
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    while (j >= 0) {
      comparisons++;
      if (a[j] > key) { a[j + 1] = a[j]; writes++; j--; } else break;
    }
    a[j + 1] = key;
    writes++;
  }
  return { comparisons, writes, ops: comparisons + writes };
};

AA.countSelection = function (a) {
  a = a.slice();
  let comparisons = 0, swaps = 0;
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) { comparisons++; if (a[j] < a[min]) min = j; }
    if (min !== i) { const t = a[i]; a[i] = a[min]; a[min] = t; swaps++; }
  }
  return { comparisons, swaps, ops: comparisons + swaps };
};

AA.countMerge = function (a) {
  a = a.slice();
  let comparisons = 0, writes = 0;
  const tmp = new Array(a.length);
  (function sort(lo, hi) {
    if (hi - lo <= 1) return;
    const mid = lo + Math.floor((hi - lo) / 2);
    sort(lo, mid); sort(mid, hi);
    let i = lo, j = mid, k = lo;
    for (let x = lo; x < hi; x++) tmp[x] = a[x];
    while (i < mid && j < hi) { comparisons++; if (tmp[i] <= tmp[j]) a[k++] = tmp[i++]; else a[k++] = tmp[j++]; writes++; }
    while (i < mid) { a[k++] = tmp[i++]; writes++; }
    while (j < hi) { a[k++] = tmp[j++]; writes++; }
  })(0, a.length);
  return { comparisons, writes, ops: comparisons + writes };
};

AA.countLinearSearch = function (a, target) {
  let comparisons = 0;
  for (let i = 0; i < a.length; i++) { comparisons++; if (a[i] === target) break; }
  return { comparisons, ops: comparisons };
};

AA.countBinarySearch = function (a, target) {
  let comparisons = 0, lo = 0, hi = a.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    comparisons++;
    if (a[mid] === target) break;
    if (a[mid] < target) lo = mid + 1; else hi = mid - 1;
  }
  return { comparisons, ops: comparisons };
};

AA.countFib = function (n) {
  let calls = 0;
  (function fib(x) {
    calls++;
    if (x < 2) return x;
    return fib(x - 1) + fib(x - 2);
  })(n);
  return { calls, ops: calls };
};

/* ───────────────────────── datasets ───────────────────────── */

AA.genDataset = function (n, kind) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(i);
  switch (kind) {
    case 'sorted': return out;
    case 'reversed': return out.reverse();
    case 'nearly': {
      const a = out.slice();
      for (let i = 0; i < Math.max(1, Math.floor(n / 10)); i++) {
        const p = Math.floor(Math.random() * n), q = Math.floor(Math.random() * n);
        const t = a[p]; a[p] = a[q]; a[q] = t;
      }
      return a;
    }
    case 'few': return out.map(() => Math.floor(Math.random() * Math.max(2, Math.floor(n / 4))));
    case 'random': default: {
      const a = out.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }
  }
};

/* ───────────────────────── maze world ───────────────────────── */
/* Grid cells: 0 empty · 1 wall · 2 start · 3 goal · 4 mud (cost 3) */
AA.CELL = { EMPTY: 0, WALL: 1, START: 2, GOAL: 3, MUD: 4 };

AA.emptyGrid = function (w, h) {
  return Array.from({ length: h }, () => new Array(w).fill(AA.CELL.EMPTY));
};

AA.cloneGrid = function (g) { return g.map(row => row.slice()); };

/* Recursive-division maze with a parity discipline that GUARANTEES
   connectivity (and therefore a solvable start→goal path):
     · chambers always begin at odd coordinates (interior starts at 1)
     · vertical wall lines sit on EVEN columns, gaps on ODD rows
     · horizontal wall lines sit on EVEN rows, gaps on ODD columns
   Gaps therefore always pass through open cell rows that sibling walls
   (which only ever occupy even lines) can never seal off. */
AA.generateMaze = function (w, h) {
  const g = AA.emptyGrid(w, h);
  for (let x = 0; x < w; x++) { g[0][x] = AA.CELL.WALL; g[h - 1][x] = AA.CELL.WALL; }
  for (let y = 0; y < h; y++) { g[y][0] = AA.CELL.WALL; g[y][w - 1] = AA.CELL.WALL; }

  const ri = (n) => Math.floor(Math.random() * n);
  const EMPTY = AA.CELL.EMPTY, WALL = AA.CELL.WALL;

  (function divide(x, y, cw, ch) {
    // even wall lines strictly inside the region [x .. x+cw-1] × [y .. y+ch-1]
    const countV = Math.floor((cw - 3) / 2) + 1;
    const countH = Math.floor((ch - 3) / 2) + 1;
    if (countV < 1 && countH < 1) return;

    // longer axis gets the wall perpendicular to it; fall back if it can't fit
    let vertical = cw > ch ? true : ch > cw ? ri(2) === 0 : false;
    if (vertical && countV < 1) vertical = false;
    else if (!vertical && countH < 1) vertical = true;
    if (vertical && countV < 1) return;
    if (!vertical && countH < 1) return;

    if (vertical) {
      const wx = x + 1 + 2 * ri(countV);                       // even column
      const gy = y + 2 * ri(Math.ceil(ch / 2));                // odd row (a cell row)
      for (let i = y; i < y + ch; i++) if (i !== gy && g[i][wx] === EMPTY) g[i][wx] = WALL;
      divide(x, y, wx - x, ch);
      divide(wx + 1, y, x + cw - wx - 1, ch);
    } else {
      const wy = y + 1 + 2 * ri(countH);                       // even row
      const gx = x + 2 * ri(Math.ceil(cw / 2));                // odd column (a cell column)
      for (let i = x; i < x + cw; i++) if (i !== gx && g[wy][i] === EMPTY) g[wy][i] = WALL;
      divide(x, y, cw, wy - y);
      divide(x, wy + 1, cw, y + ch - wy - 1);
    }
  })(1, 1, w - 2, h - 2);

  g[1][1] = AA.CELL.START;
  g[h - 2][w - 2] = AA.CELL.GOAL;
  return g;
};

const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function reconstruct(parent, w, sx, sy, gx, gy) {
  const path = [[gx, gy]];
  let k = gy * w + gx;
  while (parent.has(k)) {
    const p = parent.get(k);
    path.push(p);
    k = p[1] * w + p[0];
  }
  path.reverse();
  return path;
}

AA.bfsSolve = function (grid, sx, sy, gx, gy) {
  const h = grid.length, w = grid[0].length;
  const visited = new Uint8Array(w * h);
  const parent = new Map();
  const queue = [[sx, sy]];
  visited[sy * w + sx] = 1;
  const steps = [];
  let explored = 0;
  while (queue.length) {
    const cur = queue.shift();
    const x = cur[0], y = cur[1];
    explored++;
    if (x === gx && y === gy) {
      return { steps, path: reconstruct(parent, w, sx, sy, gx, gy), explored, cost: null, status: 'found' };
    }
    for (const d of DIRS4) {
      const nx = x + d[0], ny = y + d[1];
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      if (grid[ny][nx] === AA.CELL.WALL) continue;
      const nk = ny * w + nx;
      if (visited[nk]) continue;
      visited[nk] = 1;
      parent.set(nk, [x, y]);
      queue.push([nx, ny]);
    }
    steps.push({ cell: [x, y], frontier: queue.slice() });
  }
  return { steps, path: null, explored, cost: null, status: 'none' };
};

AA.dfsSolve = function (grid, sx, sy, gx, gy) {
  const h = grid.length, w = grid[0].length;
  const visited = new Uint8Array(w * h);
  const parent = new Map();
  const stack = [[sx, sy]];
  visited[sy * w + sx] = 1;
  const steps = [];
  let explored = 0;
  while (stack.length) {
    const cur = stack.pop();
    const x = cur[0], y = cur[1];
    if (visited[y * w + x] === 2) continue; // already expanded
    visited[y * w + x] = 2;
    explored++;
    if (x === gx && y === gy) {
      return { steps, path: reconstruct(parent, w, sx, sy, gx, gy), explored, cost: null, status: 'found' };
    }
    for (const d of DIRS4) {
      const nx = x + d[0], ny = y + d[1];
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      if (grid[ny][nx] === AA.CELL.WALL) continue;
      const nk = ny * w + nx;
      if (visited[nk]) continue;
      visited[nk] = 1;
      parent.set(nk, [x, y]);
      stack.push([nx, ny]);
    }
    steps.push({ cell: [x, y], frontier: stack.slice() });
  }
  return { steps, path: null, explored, cost: null, status: 'none' };
};

AA.astarSolve = function (grid, sx, sy, gx, gy) {
  const h = grid.length, w = grid[0].length;
  const key = (x, y) => y * w + x;
  const heuristic = (x, y) => Math.abs(x - gx) + Math.abs(y - gy); // Manhattan: admissible for 4-dir, min cost 1
  const stepCost = (x, y) => (grid[y][x] === AA.CELL.MUD ? 3 : 1);
  const gScore = new Map([[key(sx, sy), 0]]);
  const parent = new Map();
  const closed = new Uint8Array(w * h);
  const open = [[sx, sy]];
  const steps = [];
  let explored = 0;

  while (open.length) {
    let bi = 0, bf = Infinity, bh = Infinity;
    for (let i = 0; i < open.length; i++) {
      const p = open[i], k = key(p[0], p[1]);
      const f = gScore.get(k) + heuristic(p[0], p[1]);
      if (f < bf || (f === bf && heuristic(p[0], p[1]) < bh)) { bi = i; bf = f; bh = heuristic(p[0], p[1]); }
    }
    const cur = open.splice(bi, 1)[0];
    const x = cur[0], y = cur[1], k = key(x, y);
    if (closed[k]) continue;
    closed[k] = 1;
    explored++;
    if (x === gx && y === gy) {
      return {
        steps, path: reconstruct(parent, w, sx, sy, gx, gy),
        explored, cost: gScore.get(k), status: 'found'
      };
    }
    for (const d of DIRS4) {
      const nx = x + d[0], ny = y + d[1];
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      if (grid[ny][nx] === AA.CELL.WALL) continue;
      const nk = key(nx, ny);
      if (closed[nk]) continue;
      const ng = gScore.get(k) + stepCost(nx, ny);
      if (ng < (gScore.has(nk) ? gScore.get(nk) : Infinity)) {
        gScore.set(nk, ng);
        parent.set(nk, [x, y]);
        let inOpen = false;
        for (const o of open) if (o[0] === nx && o[1] === ny) { inOpen = true; break; }
        if (!inOpen) open.push([nx, ny]);
      }
    }
    steps.push({ cell: [x, y], frontier: open.slice() });
  }
  return { steps, path: null, explored, cost: null, status: 'none' };
};

/* Hop-distance from start (BFS), used to verify path optimality claims. */
AA.bfsHopDistance = function (grid, sx, sy, gx, gy) {
  const h = grid.length, w = grid[0].length;
  const dist = new Int32Array(w * h).fill(-1);
  const q = [[sx, sy]];
  dist[sy * w + sx] = 0;
  while (q.length) {
    const c = q.shift(), x = c[0], y = c[1];
    if (x === gx && y === gy) return dist[y * w + x];
    for (const d of DIRS4) {
      const nx = x + d[0], ny = y + d[1];
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      if (grid[ny][nx] === AA.CELL.WALL) continue;
      const nk = ny * w + nx;
      if (dist[nk] !== -1) continue;
      dist[nk] = dist[y * w + x] + 1;
      q.push([nx, ny]);
    }
  }
  return -1;
};

AA.solveAll = function (grid, sx, sy, gx, gy) {
  return {
    bfs: AA.bfsSolve(grid, sx, sy, gx, gy),
    dfs: AA.dfsSolve(grid, sx, sy, gx, gy),
    astar: AA.astarSolve(grid, sx, sy, gx, gy)
  };
};

/* ───────────────────────── misc ───────────────────────── */

AA.parseNumbers = function (str) {
  return String(str).split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n));
};

AA.formatInt = function (n) {
  return Number(n).toLocaleString('en-US');
};

window.AA_ALGO = AA;
})();
