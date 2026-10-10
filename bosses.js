/* ============================================================================
   ALGOARCADE — DEBUGGING BOSSES
   Challenge library: broken implementations assembled from CURATED repair
   options. No arbitrary user code is ever executed — every option line is
   authored in this file, assembled with eval() over app-controlled strings,
   and validated against a deterministic test suite.
   ========================================================================== */
(function () {
'use strict';

const AC = window.ALGOARCADE;
const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = AC.esc;

/* ───────────────────────── challenge library ─────────────────────────
   Each challenge:
     template  — full function source with {{i}} slots (one slot per line)
     slots     — [{ options:[code…], answers:[correctIndex…] }]
                 options[0] is the BROKEN version shown initially
     tests     — [{ label, args, expected }] compared on the RETURNED VALUE
   ------------------------------------------------------------------ */
const BOSSES = [
  {
    id: 'off-by-one',
    topic: 'Arrays',
    diff: 'Beginner',
    icon: '📦',
    title: 'Off-by-One Outpost',
    brief: 'sumArray() must add every element of an array. Tests show it returns NaN on small inputs.',
    expected: 'Return the sum of all elements. An empty array must sum to 0. It currently returns NaN.',
    params: ['arr'],
    template:
`function sumArray(arr) {
  let total = 0;
  {{0}}
  return total;
}`,
    slots: [{ options: [
      '  for (let i = 0; i <= arr.length; i++) total += arr[i];',
      '  for (let i = 0; i < arr.length; i++) total += arr[i];'
    ], answers: [1] }],
    tests: [
      { label: 'Normal input', args: [[1, 2, 3]], expected: 6 },
      { label: 'Empty array (boundary)', args: [[]], expected: 0 },
      { label: 'Negatives cancel out', args: [[-4, 4, 0]], expected: 0 },
      { label: 'Single element', args: [[7]], expected: 7 }
    ],
    hints: [
      'Look closely at the loop condition: it decides which indices are read.',
      'arr.length is not a valid index — the last valid index is arr.length - 1.',
      'The condition uses <=, so on the final iteration it reads one past the end, adding undefined.'
    ],
    explanation:
`The loop ran from 0 to arr.length **inclusive**. Reading arr[arr.length] yields undefined,
which turns the accumulator into NaN — and for an empty array the very first iteration read
index 0 of nothing. Changing <= to < keeps every access inside the valid index range.`
  },
  {
    id: 'binary-blindspot',
    topic: 'Searching',
    diff: 'Intermediate',
    icon: '🔭',
    title: 'Binary Search Blindspot',
    brief: 'binarySearch() reports "not found" for values that are clearly in the array.',
    expected: 'Return the index of target in a sorted array, or -1 if absent.',
    params: ['arr', 'target'],
    template:
`function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) return mid;
    {{0}}
  }
  return -1;
}`,
    slots: [{ options: [
      '    if (arr[mid] > target) lo = mid + 1; else hi = mid - 1;',
      '    if (arr[mid] < target) lo = mid + 1; else hi = mid - 1;'
    ], answers: [1] }],
    tests: [
      { label: 'Target on the right', args: [[1, 3, 5, 7, 9], 7], expected: 3 },
      { label: 'First element', args: [[1, 3, 5, 7, 9], 1], expected: 0 },
      { label: 'Last element', args: [[1, 3, 5, 7, 9], 9], expected: 4 },
      { label: 'Absent value', args: [[1, 3, 5, 7, 9], 4], expected: -1 },
      { label: 'Larger sorted run', args: [[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], 13], expected: 13 }
    ],
    hints: [
      'Draw the search window after one iteration with arr = [1, 3, 5, 7, 9], target = 7.',
      'The window must move TOWARD the target: bigger targets → higher lo.',
      'The branches are inverted: when arr[mid] > target the window moves right instead of left.'
    ],
    explanation:
`When arr[mid] was greater than the target the code advanced lo — moving away from the answer —
and shrank hi when it should have advanced. The window still shrank every step (so no hang),
but it always slid past the target and returned -1. Comparison operators decide direction:
arr[mid] < target → search right (lo = mid + 1), otherwise search left (hi = mid - 1).`
  },
  {
    id: 'bubble-down',
    topic: 'Sorting',
    diff: 'Beginner',
    icon: '🫧',
    title: 'Bubble Trouble',
    brief: 'bubbleSort() "sorts" every array into descending order. The arcade demands ascending.',
    expected: 'Return the elements in ascending order without modifying the input array.',
    params: ['arr'],
    template:
`function bubbleSort(arr) {
  const a = arr.slice();
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      {{0}}
    }
  }
  return a;
}`,
    slots: [{ options: [
      '      if (a[j] < a[j + 1]) { const t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; }',
      '      if (a[j] > a[j + 1]) { const t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; }'
    ], answers: [1] }],
    tests: [
      { label: 'Typical shuffle', args: [[5, 1, 4, 2, 8]], expected: [1, 2, 4, 5, 8] },
      { label: 'Empty array', args: [[]], expected: [] },
      { label: 'Two elements', args: [[2, 1]], expected: [1, 2] },
      { label: 'Already sorted', args: [[1, 2, 3]], expected: [1, 2, 3] },
      { label: 'Duplicates', args: [[3, 3, 1]], expected: [1, 3, 3] }
    ],
    hints: [
      'Watch what happens to [5, 1, 4, 2, 8] after the very first comparison.',
      'A swap should occur only when the left element is GREATER than the right.',
      'The swap condition is inverted — it swaps exactly when the pair is already in order.'
    ],
    explanation:
`Ascending order means a[j] <= a[j+1]. The condition swapped when a[j] was SMALLER,
so every already-ordered pair got flipped — producing a perfectly descending array.
One character: < → > .`
  },
  {
    id: 'multiples-mayhem',
    topic: 'Loops',
    diff: 'Beginner',
    icon: '🔁',
    title: 'Multiples Mayhem',
    brief: 'countMultiples(n) counts integers ≤ n divisible by 3 OR 5. It only counts one number.',
    expected: 'Count integers from 1 to n divisible by 3 or 5 (inclusive). countMultiples(15) must be 7.',
    params: ['n'],
    template:
`function countMultiples(n) {
  let count = 0;
  {{0}}
  return count;
}`,
    slots: [{ options: [
      '  for (let i = 1; i <= n; i++) { if (i % 3 === 0 && i % 5 === 0) count++; }',
      '  for (let i = 1; i <= n; i++) { if (i % 3 === 0 || i % 5 === 0) count++; }'
    ], answers: [1] }],
    tests: [
      { label: 'The classic 15', args: [15], expected: 7 },
      { label: 'Below all multiples', args: [1], expected: 0 },
      { label: 'First multiple of 3', args: [3], expected: 1 },
      { label: 'Zero boundary', args: [0], expected: 0 },
      { label: 'Both conditions fire', args: [10], expected: 5 }
    ],
    hints: [
      'List the matching numbers below 15: 3, 5, 6, 9, 10, 12, 15. That is seven numbers.',
      'The spec says "divisible by 3 OR 5" — read the two branches side by side.',
      '&& requires BOTH remainders to be zero, which only 15, 30, 45… satisfy. The spec needs ||.'
    ],
    explanation:
`&& demanded divisibility by 3 and 5 simultaneously (only multiples of 15),
while the spec required either condition. || unions the two sets — the multiples of 3 plus
the multiples of 5, with multiples of 15 counted once, because the if body runs at most once per i.`
  },
  {
    id: 'base-case-blunder',
    topic: 'Recursion',
    diff: 'Intermediate',
    icon: '♾️',
    title: 'Base Case Blunder',
    brief: 'factorial() crashes with a stack overflow when asked for 0!. Factorials of positives work.',
    expected: 'Return n! for n ≥ 0. By definition 0! = 1.',
    params: ['n'],
    template:
`function factorial(n) {
  {{0}}
  return n * factorial(n - 1);
}`,
    slots: [{ options: [
      '  if (n === 1) return 1;',
      '  if (n <= 1) return 1;'
    ], answers: [1] }],
    tests: [
      { label: 'Zero (boundary — the crash)', args: [0], expected: 1 },
      { label: 'One', args: [1], expected: 1 },
      { label: 'Five', args: [5], expected: 120 },
      { label: 'Ten', args: [10], expected: 3628800 },
      { label: 'Two', args: [2], expected: 2 }
    ],
    hints: [
      'Every recursive function needs a base case that stops the descent.',
      'Trace n = 0: does the guard ever return before calling factorial(n - 1)?',
      'The guard matches only n === 1, so n = 0 recurses to -1, -2, -3… until the stack blows.'
    ],
    explanation:
`The guard fired only for n === 1. factorial(0) fell through to factorial(-1), -2, -3…
decrementing forever until the engine threw RangeError: Maximum call stack size exceeded.
Widening the guard to n <= 1 stops the descent for every n ≤ 1 — and returns the
canonical 0! = 1.`
  },
  {
    id: 'insertion-injury',
    topic: 'Sorting',
    diff: 'Intermediate',
    icon: '🪡',
    title: 'Insertion Injury',
    brief: 'insertionSort() sometimes returns arrays full of duplicates — data is being lost.',
    expected: 'Return a sorted copy in ascending order, preserving every original element.',
    params: ['arr'],
    template:
`function insertionSort(arr) {
  const a = arr.slice();
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > key) {
      a[j + 1] = a[j];
      j--;
    }
    {{0}}
  }
  return a;
}`,
    slots: [{ options: [
      '    a[j] = key;',
      '    a[j + 1] = key;'
    ], answers: [1] }],
    tests: [
      { label: 'Typical shuffle', args: [[5, 1, 4, 2]], expected: [1, 2, 4, 5] },
      { label: 'Empty array', args: [[]], expected: [] },
      { label: 'Single element', args: [[9]], expected: [9] },
      { label: 'Two elements', args: [[2, 1]], expected: [1, 2] },
      { label: 'All equal', args: [[1, 1, 1]], expected: [1, 1, 1] },
      { label: 'Already sorted', args: [[1, 2, 3]], expected: [1, 2, 3] }
    ],
    hints: [
      'The while loop shifts larger elements right — where does the empty hole end up?',
      'After the loop, j + 1 is the position the key must occupy.',
      'Writing to a[j] overwrites a neighbour instead of filling the hole — and a[-1] silently does nothing.'
    ],
    explanation:
`Shifting (a[j + 1] = a[j]) opens a hole at index j + 1. The key must be written THERE.
a[j] = key overwrote a shifted element — and when the loop ran off the front (j = -1),
a[-1] = key silently vanished in JavaScript, losing the element entirely.`
  },
  {
    id: 'rotate-wrong-way',
    topic: 'Arrays',
    diff: 'Intermediate',
    icon: '🔄',
    title: 'Rotate Wrong Way',
    brief: 'rotateRight(arr, k) rotates the wrong direction — every result is mirrored.',
    expected: 'Return a copy rotated RIGHT by k positions: rotateRight([1,2,3], 1) → [3,1,2].',
    params: ['arr', 'k'],
    template:
`function rotateRight(arr, k) {
  if (!arr.length) return [];
  const a = arr.slice();
  const kk = k % arr.length;
  for (let i = 0; i < kk; i++) {
    {{0}}
  }
  return a;
}`,
    slots: [{ options: [
      '    a.push(a.shift());',
      '    a.unshift(a.pop());'
    ], answers: [1] }],
    tests: [
      { label: 'Rotate by one', args: [[1, 2, 3], 1], expected: [3, 1, 2] },
      { label: 'Rotate by two', args: [[1, 2, 3, 4, 5], 2], expected: [4, 5, 1, 2, 3] },
      { label: 'k = 0 (identity)', args: [[1, 2, 3], 0], expected: [1, 2, 3] },
      { label: 'k larger than length', args: [[1, 2], 5], expected: [2, 1] },
      { label: 'Empty array', args: [[], 3], expected: [] }
    ],
    hints: [
      'A RIGHT rotation moves the LAST element to the FRONT.',
      'Array.prototype.pop() removes from the end; shift() removes from the front.',
      'The current line pushes what shift() removed — that advances every element left, not right.'
    ],
    explanation:
`a.push(a.shift()) takes the first element and appends it — a LEFT rotation, repeated k times.
The inverse operation is needed: take the LAST element (pop) and put it at the FRONT (unshift).
The k % arr.length guard correctly handles k ≥ length, so only the direction was wrong.`
  },
  {
    id: 'visited-vortex',
    topic: 'Graphs',
    diff: 'Advanced',
    icon: '🕸️',
    title: 'Visited Vortex',
    brief: 'bfsDepths() is supposed to return SHORTEST hop counts from start. On branching graphs it over-reports.',
    expected: 'Return an array where index i holds the minimum number of edges from start to node i (-1 if unreachable).',
    params: ['graph', 'start'],
    template:
`function bfsDepths(graph, start) {
  const depth = new Array(graph.length).fill(-1);
  depth[start] = 0;
  const queue = [start];
  while (queue.length) {
    {{0}}
    for (const nb of graph[node]) {
      if (depth[nb] === -1) {
        depth[nb] = depth[node] + 1;
        queue.push(nb);
      }
    }
  }
  return depth;
}`,
    slots: [{ options: [
      '    const node = queue.pop();',
      '    const node = queue.shift();'
    ], answers: [1] }],
    tests: [
      { label: 'Branch that rejoins (the trap)',
        args: [[[1, 2], [5], [3], [4], [5], []], 0], expected: [0, 1, 1, 2, 3, 2] },
      { label: 'Simple triangle', args: [[[1, 2], [2], []], 0], expected: [0, 1, 1] },
      { label: 'Linear chain', args: [[[1], [2], [3], []], 0], expected: [0, 1, 2, 3] },
      { label: 'Single node', args: [[[]], 0], expected: [0] },
      { label: 'Unreachable node', args: [[[1], [], [0]], 1], expected: [-1, 0, -1] }
    ],
    hints: [
      'Draw the frontier after two steps for both queue disciplines: first-in-first-out vs last-in-first-out.',
      'BFS promises the shortest path only if it explores level by level — in order.',
      'pop() takes the NEWEST node: that is depth-first exploration, so node 5 gets discovered through the long detour first.'
    ],
    explanation:
`queue.shift() serves the OLDEST node first — level order — so every node is first reached
via the minimum number of edges. queue.pop() serves the NEWEST node, which is depth-first:
in the test graph, node 5 was first discovered along 0→2→3→4→5 (depth 4) before the short
0→1→5 route (depth 2) was ever examined. BFS works because of FIFO discipline, not because
of the visited check.`
  }
];

const XP_BY_DIFF = { Beginner: 80, Intermediate: 120, Advanced: 160 };

window.AA_BOSS_COUNT = BOSSES.length;

/* ───────────────────────── assembly + testing ───────────────────────── */

const norm = (v) => Array.isArray(v) ? v.join(',') : String(v).trim();

function assemble(ch, sel) {
  let src = ch.template;
  ch.slots.forEach((slot, i) => {
    const idx = sel[i] === undefined ? 0 : sel[i];
    src = src.replace('{{' + i + '}}', slot.options[idx]);
  });
  return src;
}

function buildFn(ch, sel) {
  const src = assemble(ch, sel);
  // Every line in `src` is authored in this file — nothing user-authored is evaluated.
  return (0, eval)('(' + src + ')');
}

function runTests(ch, sel) {
  const results = [];
  let fn;
  try {
    fn = buildFn(ch, sel);
  } catch (e) {
    return ch.tests.map(t => ({ t, ok: false, note: 'failed to assemble: ' + e.message }));
  }
  for (const t of ch.tests) {
    try {
      const res = fn.apply(null, t.args);
      const ok = norm(res) === norm(t.expected);
      results.push({
        t, ok,
        note: ok ? 'expected ' + JSON.stringify(norm(t.expected))
                 : 'expected ' + JSON.stringify(norm(t.expected)) + ' · got ' + JSON.stringify(norm(res))
      });
    } catch (e) {
      results.push({ t, ok: false, note: 'threw: ' + (e && e.message ? e.message : String(e)) });
    }
  }
  return results;
}

function isCorrect(ch, sel) {
  return ch.slots.every((slot, i) => (sel[i] === undefined ? 0 : sel[i]) === slot.answers[i]);
}

/* ───────────────────────── state / UI ───────────────────────── */

const S = { open: null, sel: {}, hints: 0, results: null, filter: 'All', revealed: false };

const isSolved = (id) => !!(AC.getState().bosses.solved || {})[id];

function render() {
  const root = document.getElementById('bosses-root');
  if (!root) return;
  root.innerHTML = S.open ? detailHTML() : listHTML();
  if (S.open) bindDetail(root); else bindList(root);
}

function listHTML() {
  const topics = ['All'].concat(Array.from(new Set(BOSSES.map(b => b.topic))));
  const solved = Object.keys(AC.getState().bosses.solved || {}).length;
  const visible = BOSSES.filter(b => S.filter === 'All' || b.topic === S.filter);

  return (
    '<div class="toolbar">' +
      '<span class="toolbar-label">Filter</span>' +
      '<div class="seg" role="group" aria-label="Filter by topic">' +
        topics.map(t =>
          '<button type="button" data-filter="' + esc(t) + '" class="' + (S.filter === t ? 'on' : '') + '" ' +
          'aria-pressed="' + (S.filter === t) + '">' + esc(t.toUpperCase()) + '</button>').join('') +
      '</div>' +
      '<span class="spacer"></span>' +
      '<span class="chip">' + solved + '/' + BOSSES.length + ' BOSSES DEFEATED</span>' +
    '</div>' +
    '<div class="boss-grid">' +
      visible.map(b => (
        '<button class="boss-card' + (isSolved(b.id) ? ' solved' : '') + '" data-boss="' + esc(b.id) + '" ' +
          'aria-label="Open boss: ' + esc(b.title) + '">' +
          '<div class="b-ico">' + (isSolved(b.id) ? '✅' : b.icon) + '</div>' +
          '<h3 class="pixel">' + esc(b.title) + '</h3>' +
          '<p>' + esc(b.brief) + '</p>' +
          '<div class="b-meta">' +
            '<span class="bdg ' + b.diff.toLowerCase() + '">' + esc(b.diff) + '</span>' +
            '<span class="bdg dim">' + esc(b.topic) + '</span>' +
            '<span class="bdg gold">+' + XP_BY_DIFF[b.diff] + ' XP</span>' +
          '</div>' +
        '</button>'
      )).join('') +
    '</div>' +
    (visible.length ? '' : '<div class="empty"><span class="e-ico">🕳️</span>No bosses in this topic yet.</div>')
  );
}

function detailHTML() {
  const ch = BOSSES.find(b => b.id === S.open);
  const solved = isSolved(ch.id);

  // Build display: template lines with slots expanded, option groups after each slot line
  let display = '';
  let no = 0;
  ch.template.split('\n').forEach(tline => {
    const m = /\{\{(\d+)\}\}/.exec(tline);
    if (m) {
      const i = Number(m[1]);
      const selIdx = S.sel[i] === undefined ? 0 : S.sel[i];
      const code = tline.replace('{{' + i + '}}', ch.slots[i].options[selIdx]);
      no++;
      display += '<div class="code-line buggy"><span class="ln">' + no + '</span><span class="lc">' +
        esc(code) + '</span></div>' +
        '<div class="opt-group" role="radiogroup" aria-label="Fix for line ' + no + '">' +
          ch.slots[i].options.map((opt, oi) =>
            '<button class="opt-btn' + (oi === selIdx ? ' sel' : '') + '" data-slot="' + i + '" data-opt="' + oi + '" ' +
            'role="radio" aria-checked="' + (oi === selIdx) + '">' +
            '<span class="key">' + String.fromCharCode(65 + oi) + '</span><span>' + esc(opt.trim()) + '</span></button>'
          ).join('') +
        '</div>';
    } else {
      no++;
      display += '<div class="code-line"><span class="ln">' + no + '</span><span class="lc">' +
        (esc(tline) || '&nbsp;') + '</span></div>';
    }
  });

  const revealed = S.revealed;
  const fixedSrc = assemble(ch, ch.slots.map(s => s.answers));

  return (
    '<div class="btn-row" style="margin-bottom:16px">' +
      '<button class="btn ghost sm" id="bd-back">◂ BOSS LIST</button>' +
      '<span class="bdg ' + ch.diff.toLowerCase() + '">' + esc(ch.diff) + '</span>' +
      '<span class="bdg dim">' + esc(ch.topic) + '</span>' +
      (solved ? '<span class="bdg beginner">✅ DEFEATED</span>' : '') +
      '<span class="spacer"></span>' +
      '<span class="bdg gold">+' + XP_BY_DIFF[ch.diff] + ' XP FIRST CLEAR</span>' +
    '</div>' +

    '<div class="panel">' +
      '<div class="panel-t pixel">' + ch.icon + ' ' + esc(ch.title.toUpperCase()) + '</div>' +
      '<p style="font-size:12px;line-height:1.9;color:var(--dim)">' + esc(ch.brief) + '</p>' +
      '<div class="note vi" style="margin-top:12px"><b>Expected behavior:</b> ' + esc(ch.expected) + '</div>' +
      '<div class="note cy"><b>How fixing works:</b> each pink line is a bug. Choose a replacement from the curated ' +
      'options below it — only those authored lines are ever assembled and run, so nothing unsafe executes. ' +
      'Your fix is graded on OUTPUT: the assembled function must pass every test below.</div>' +

      '<div class="boss-code" id="bd-code">' + display + '</div>' +

      '<div class="btn-row">' +
        '<button class="btn" id="bd-run">⚡ SUBMIT &amp; TEST</button>' +
        '<button class="btn gold sm" id="bd-hint" ' + (S.hints >= ch.hints.length ? 'disabled' : '') + '>💡 HINT (' + Math.min(S.hints + 1, ch.hints.length) + '/' + ch.hints.length + ')</button>' +
        '<button class="btn purple sm" id="bd-reveal">' + (revealed ? '▾ HIDE SOLUTION' : '👁 REVEAL SOLUTION') + '</button>' +
        '<span class="spacer"></span>' +
      '</div>' +
      (S.hints ? '<div class="hint show">' + ch.hints.slice(0, S.hints).map((h, i) => 'Hint ' + (i + 1) + ': ' + esc(h)).join('<br><br>') + '</div>' : '') +

      '<div class="panel-t pixel" style="margin-top:22px">TEST CASES — ' + ch.tests.length + '</div>' +
      '<div class="tbl-wrap"><table><thead><tr><th>Test</th><th>Arguments</th><th>Expected output</th></tr></thead><tbody>' +
        ch.tests.map(t =>
          '<tr><td>' + esc(t.label) + '</td><td><code>' + esc(JSON.stringify(t.args)) + '</code></td>' +
          '<td><code>' + esc(JSON.stringify(norm(t.expected))) + '</code></td></tr>').join('') +
      '</tbody></table></div>' +

      '<div id="bd-results" style="margin-top:18px"></div>' +
      '<div id="bd-explain"></div>' +
    '</div>'
  );
}

function bindList(root) {
  $$('[data-filter]', root).forEach(b => b.addEventListener('click', () => {
    S.filter = b.dataset.filter; AC.sfx.click(); render();
  }));
  $$('[data-boss]', root).forEach(b => b.addEventListener('click', () => {
    S.open = b.dataset.boss; S.sel = {}; S.hints = 0; S.results = null; S.revealed = false;
    AC.sfx.open(); render();
  }));
}

function bindDetail(root) {
  const ch = BOSSES.find(b => b.id === S.open);

  $('#bd-back').addEventListener('click', () => { S.open = null; AC.sfx.close(); render(); });

  $$('.opt-btn', root).forEach(b => b.addEventListener('click', () => {
    S.sel[Number(b.dataset.slot)] = Number(b.dataset.opt);
    AC.sfx.click();
    render();
  }));

  $('#bd-hint').addEventListener('click', () => {
    if (S.hints < ch.hints.length) { S.hints++; AC.sfx.click(); render(); }
  });

  $('#bd-reveal').addEventListener('click', () => {
    S.revealed = !S.revealed;
    AC.sfx.click();
    render();
    if (S.revealed) drawExplain(ch, false);
  });

  $('#bd-run').addEventListener('click', () => {
    AC.sfx.click();
    S.results = runTests(ch, S.sel);
    drawResults(ch);
  });
}

function drawResults(ch) {
  const box = $('#bd-results');
  if (!box) return;
  const results = S.results;
  const pass = results.filter(r => r.ok).length;
  const allPass = pass === results.length;

  box.innerHTML =
    '<div class="panel-t pixel" style="margin-top:8px">RESULTS — ' + pass + '/' + results.length + ' PASSED</div>' +
    results.map(r =>
      '<div class="boss-test ' + (r.ok ? 'pass' : 'fail') + '">' +
        '<span class="ic">' + (r.ok ? '✅' : '❌') + '</span>' +
        '<div class="lb"><b>' + esc(r.t.label) + '</b>' +
          '<div class="dt">' + esc(r.note) + '</div>' +
        '</div>' +
      '</div>').join('');

  if (allPass) {
    const firstTime = !isSolved(ch.id);
    let xpNote = '';
    if (firstTime) {
      const st = AC.getState();
      const revealedBefore = st.bosses.revealed && st.bosses.revealed[ch.id];
      const xp = revealedBefore ? Math.floor(XP_BY_DIFF[ch.diff] / 2) : XP_BY_DIFF[ch.diff];
      st.bosses.solved[ch.id] = { at: Date.now(), xp };
      AC.save();
      AC.awardXP(xp);
      AC.awardAchievement('bug-hunter');
      const solvedCount = Object.keys(st.bosses.solved).length;
      if (solvedCount >= BOSSES.length) AC.awardAchievement('bug-master');
      AC.renderAll();
      xpNote = '+' + xp + ' XP' + (revealedBefore ? ' (reduced — solution was revealed first)' : ' — first clear!');
    }
    box.insertAdjacentHTML('beforeend',
      '<div class="award"><div class="t pixel">🏆 BOSS DEFEATED</div>' +
      '<div class="s">' + esc(ch.title) + ' cleared · ' + (xpNote || 'already cleared before') + '</div></div>');
    AC.sfx.success();
    drawExplain(ch, true);
  } else {
    box.insertAdjacentHTML('beforeend',
      '<div class="note pk" style="margin-top:10px"><b>' + (results.length - pass) + ' test(s) failing.</b> ' +
      'Read the first failure: its input, the expected output, and what your code produced. ' +
      'Adjust the pink line and submit again.</div>');
    AC.sfx.error();
  }
}

function drawExplain(ch, solved) {
  const box = $('#bd-explain');
  if (!box) return;
  box.innerHTML =
    '<div class="panel-t pixel" style="margin-top:22px">' + (solved ? 'SOLUTION EXPLANATION' : 'REFERENCE SOLUTION (XP for this boss will be halved)') + '</div>' +
    '<pre>' + highlightSafe(assemble(ch, ch.slots.map(s => s.answers))) + '</pre>' +
    '<div class="note cy">' + esc(ch.explanation) + '</div>';
  if (!solved && !(AC.getState().bosses.revealed || {})[ch.id]) {
    const st = AC.getState();
    st.bosses.revealed = st.bosses.revealed || {};
    st.bosses.revealed[ch.id] = true;
    AC.save();
  }
}

/* minimal highlighter — mirrors app.js's for solution blocks */
function highlightSafe(code) {
  return esc(code)
    .replace(/\b(function|let|const|return|while|for|if|else)\b/g, '<span class="k">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="n">$1</span>');
}

/* ───────────────────────── boot ───────────────────────── */

function init() {
  render();
  window.AA_FEATURES = window.AA_FEATURES || [];
  window.AA_FEATURES.push({ onView: (name) => { if (name === 'bosses') render(); } });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

/* test hooks (used by test-algorithms.js — no DOM required) */
window.AA_BOSSES = { BOSSES, assemble, buildFn, runTests, isCorrect, XP_BY_DIFF };

})();
