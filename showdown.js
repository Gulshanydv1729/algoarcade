/* ============================================================================
   ALGOARCADE — ALGORITHM SHOWDOWN
   Side-by-side comparison of two algorithms on identical input.
   Primary metric: instrumented operation counts (never wall-clock).
   ========================================================================== */
(function () {
'use strict';

const AA = window.AA_ALGO;
const AC = window.ALGOARCADE;
const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = AC.esc;

const PAIRS = [
  {
    id: 'linear-vs-binary',
    title: 'Linear Search vs Binary Search',
    kind: 'search',
    requiresSorted: true,
    a: {
      name: 'Linear Search', run: AA.linearSearchSteps,
      complexity: 'O(n) time · O(1) space', color: 'var(--cyan)',
      blurb: 'Scans every element until it finds the target. No preconditions.'
    },
    b: {
      name: 'Binary Search', run: AA.binarySearchSteps,
      complexity: 'O(log n) time · O(1) space', color: 'var(--violet)',
      blurb: 'Halves the search range every step — but only works on sorted input.'
    }
  },
  {
    id: 'bubble-vs-merge',
    title: 'Bubble Sort vs Merge Sort',
    kind: 'sort',
    a: {
      name: 'Bubble Sort', run: AA.bubbleSortSteps,
      complexity: 'O(n²) time · O(1) space', color: 'var(--cyan)',
      blurb: 'Repeatedly swaps adjacent out-of-order pairs. Simple, quadratic.'
    },
    b: {
      name: 'Merge Sort', run: AA.mergeSortSteps,
      complexity: 'O(n log n) time · O(n) space', color: 'var(--violet)',
      blurb: 'Divide and conquer: split, sort halves, merge. Consistently fast.'
    }
  },
  {
    id: 'insertion-vs-selection',
    title: 'Insertion Sort vs Selection Sort',
    kind: 'sort',
    a: {
      name: 'Insertion Sort', run: AA.insertionSortSteps,
      complexity: 'O(n²) time · O(1) space', color: 'var(--cyan)',
      blurb: 'Builds the sorted prefix one element at a time. Fast on nearly-sorted data.'
    },
    b: {
      name: 'Selection Sort', run: AA.selectionSortSteps,
      complexity: 'O(n²) time · O(1) space', color: 'var(--violet)',
      blurb: 'Selects the minimum and swaps it into place. Always ~n²/2 comparisons.'
    }
  }
];

const SIZES = [12, 24, 40];
const SORT_DATASETS = [
  ['random', 'Random'], ['sorted', 'Sorted'], ['reversed', 'Reversed'],
  ['nearly', 'Nearly sorted'], ['few', 'Few unique']
];
const SEARCH_DATASETS = [
  ['random', 'Random (sorted)'], ['few', 'Few unique (sorted)']
];
const TARGETS = [
  ['random', 'Random'], ['first', 'First'], ['middle', 'Middle'],
  ['last', 'Last'], ['missing', 'Missing']
];

const S = {
  pairId: 'linear-vs-binary',
  size: 24,
  dataset: 'random',
  target: 'random',
  custom: '',
  useCustom: false,
  input: [],
  targetValue: 0,
  traces: null,
  step: 0,
  playing: false,
  timer: null,
  speed: 1,
  predicted: null,
  predFeedback: null
};

let root;

const getPair = () => PAIRS.find(p => p.id === S.pairId);

/* ───────────────────────── input generation ───────────────────────── */

function generateInput() {
  const pair = getPair();
  let arr = AA.genDataset(S.size, S.dataset);
  if (pair.kind === 'search') arr = arr.slice().sort((x, y) => x - y);
  return arr;
}

function pickTarget(arr) {
  switch (S.target) {
    case 'first': return arr[0];
    case 'middle': return arr[Math.floor(arr.length / 2)];
    case 'last': return arr[arr.length - 1];
    case 'missing': return arr[arr.length - 1] + 7;
    default: return arr[Math.floor(Math.random() * arr.length)];
  }
}

function applyInput(custom) {
  const pair = getPair();
  if (custom !== undefined) {
    const parsed = AA.parseNumbers(custom);
    if (parsed.length < 2) return 'Enter at least 2 comma-separated numbers.';
    if (parsed.length > 60) return 'Maximum 60 elements for the arena visualization.';
    if (pair.requiresSorted) {
      for (let i = 1; i < parsed.length; i++) {
        if (parsed[i] < parsed[i - 1]) return 'Binary Search requires ASCENDING sorted input (e.g. 1, 3, 5, 9).';
      }
    }
    S.input = parsed;
    S.useCustom = true;
  } else {
    S.input = generateInput();
    S.useCustom = false;
  }
  if (getPair().kind === 'search') S.targetValue = pickTarget(S.input);
  S.traces = null;
  S.step = 0;
  S.predFeedback = null;
  return null;
}

/* ───────────────────────── rendering ───────────────────────── */

function seg(name, options, current, attr) {
  return '<div class="seg" role="group" aria-label="' + esc(name) + '">' +
    options.map(([val, label]) =>
      '<button type="button" data-' + attr + '="' + esc(val) + '"' +
      (String(val) === String(current) ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>' +
      esc(label) + '</button>'
    ).join('') + '</div>';
}

function render() {
  const pair = getPair();
  const datasets = pair.kind === 'search' ? SEARCH_DATASETS : SORT_DATASETS;

  root.innerHTML =
    '<div class="panel">' +
      '<div class="toolbar">' +
        '<span class="toolbar-label">Match</span>' +
        seg('Algorithm pair', PAIRS.map(p => [p.id, p.title]), S.pairId, 'pair') +
      '</div>' +
      '<div class="toolbar">' +
        '<span class="toolbar-label">Size</span>' +
        seg('Input size', SIZES.map(s => [s, s + ' items']), S.size, 'size') +
        '<span class="toolbar-label" style="margin-left:10px">Dataset</span>' +
        seg('Dataset', datasets, S.dataset, 'dataset') +
        (pair.kind === 'search'
          ? '<span class="toolbar-label" style="margin-left:10px">Target</span>' + seg('Target', TARGETS, S.target, 'target')
          : '') +
      '</div>' +
      '<div class="field">' +
        '<label for="sd-custom">Custom input (comma-separated numbers' + (pair.requiresSorted ? ', ascending' : '') + ')</label>' +
        '<textarea id="sd-custom" rows="2" spellcheck="false" placeholder="e.g. ' + (pair.requiresSorted ? '1, 3, 5, 9, 14' : '5, 2, 9, 1, 7') + '">' + esc(S.custom) + '</textarea>' +
      '</div>' +
      '<div class="btn-row">' +
        '<button class="btn sm" id="sd-random">🎲 RANDOMIZE</button>' +
        '<button class="btn purple sm" id="sd-custom-btn">↥ USE CUSTOM INPUT</button>' +
        '<span class="spacer"></span>' +
        '<span class="chip" id="sd-input-info"></span>' +
      '</div>' +
      '<div id="sd-input-error"></div>' +
    '</div>' +

    '<div class="pred-box' + (S.predFeedback ? ' answered' : '') + '" id="sd-pred">' +
      '<div class="pred-q pixel">PREDICT THE WINNER</div>' +
      '<p style="font-size:11px;color:var(--dim);margin-bottom:14px;line-height:1.8">' +
        'Before the run: which algorithm will complete with <b>fewer total operations</b> ' +
        'on this input? Correct first-time predictions earn +40 XP.' +
      '</p>' +
      '<div class="pred-opts" role="group" aria-label="Prediction">' +
        '<button class="pred-opt" data-pred="a" style="border-color:' + pair.a.color + '">' + esc(pair.a.name.toUpperCase()) + '</button>' +
        '<button class="pred-opt" data-pred="b" style="border-color:' + pair.b.color + '">' + esc(pair.b.name.toUpperCase()) + '</button>' +
        '<button class="pred-opt" data-pred="tie">TIE</button>' +
      '</div>' +
      '<div class="pred-result" id="sd-pred-result"></div>' +
    '</div>' +

    '<div class="duel">' +
      vizPanel('a', pair.a) +
      vizPanel('b', pair.b) +
    '</div>' +

    '<div class="playback" role="group" aria-label="Playback controls">' +
      '<button class="icon-btn" id="sd-play" aria-label="Play or pause">▶</button>' +
      '<button class="icon-btn" id="sd-step" aria-label="Step forward">⏭</button>' +
      '<button class="icon-btn" id="sd-reset" aria-label="Reset playback">⟲</button>' +
      '<button class="btn" id="sd-run">⚔ RUN COMPARISON</button>' +
      '<span class="spacer"></span>' +
      '<label class="speed">SPEED ' +
        '<input type="range" id="sd-speed" min="0.5" max="4" step="0.5" value="' + S.speed + '" aria-label="Playback speed"> ' +
        '<b id="sd-speed-label">' + S.speed.toFixed(1) + '×</b>' +
      '</label>' +
    '</div>' +

    '<div id="sd-summary"></div>' +

    '<div class="note cy"><b>How we measure.</b> Both algorithms run on identical copies of the same input. ' +
    'The arena counts <b>instrumented operations</b> — comparisons, swaps and writes — which are deterministic ' +
    'and environment-independent. We deliberately do <b>not</b> compare raw wall-clock times: they fluctuate ' +
    'with CPU load, JIT warm-up and input size, and would mislead more than they inform. Theoretical complexity ' +
    'describes asymptotic growth; the operation count is what actually happened on this input.</div>';

  bindEvents();

  if (!S.useCustom) applyInput();
  updateInputInfo();
  if (S.traces) drawStep(S.step); else drawIdle();
  renderPrediction();
}

function vizPanel(side, algo) {
  return (
    '<div class="viz-panel" id="sd-panel-' + side + '">' +
      '<div class="vp-head">' +
        '<span class="vp-name pixel" style="color:' + algo.color + '">' + esc(algo.name.toUpperCase()) + '</span>' +
        '<span class="vp-complexity bdg dim">' + esc(algo.complexity) + '</span>' +
      '</div>' +
      '<p style="font-size:10px;color:var(--dim);line-height:1.7;margin-bottom:12px">' + esc(algo.blurb) + '</p>' +
      '<div class="viz-stage" id="sd-bars-' + side + '" aria-label="' + esc(algo.name) + ' visualization">' +
        '<div style="width:100%;text-align:center;color:var(--faint);font-size:10px;padding:20px 0">Press RUN COMPARISON to load the arena</div>' +
      '</div>' +
      '<div class="viz-status" id="sd-status-' + side + '">' +
        '<span>COMPARISONS <b>—</b></span><span>SWAPS / WRITES <b>—</b></span><span>TOTAL OPS <b>—</b></span><span>STATUS <b>READY</b></span>' +
      '</div>' +
      '<div id="sd-step-text-' + side + '" style="font-size:10px;color:var(--dim);margin-top:10px;min-height:18px"></div>' +
    '</div>'
  );
}

function bindEvents() {
  $$('[data-pair]').forEach(b => b.addEventListener('click', () => {
    S.pairId = b.dataset.pair; S.dataset = 'random'; S.custom = ''; S.useCustom = false;
    S.predicted = null; S.predFeedback = null;
    AC.sfx.click(); stop(); applyInput(); render();
  }));
  $$('[data-size]').forEach(b => b.addEventListener('click', () => {
    S.size = Number(b.dataset.size); S.useCustom = false; S.predFeedback = null;
    AC.sfx.click(); applyInput(); render();
  }));
  $$('[data-dataset]').forEach(b => b.addEventListener('click', () => {
    S.dataset = b.dataset.dataset; S.useCustom = false; S.predFeedback = null;
    AC.sfx.click(); applyInput(); render();
  }));
  $$('[data-target]').forEach(b => b.addEventListener('click', () => {
    S.target = b.dataset.target; S.predFeedback = null;
    AC.sfx.click();
    if (getPair().kind === 'search' && !S.useCustom) { applyInput(); render(); }
    else { S.targetValue = pickTarget(S.input); S.traces = null; render(); }
  }));
  $$('[data-pred]').forEach(b => b.addEventListener('click', () => {
    S.predicted = b.dataset.pred; S.predFeedback = null;
    AC.sfx.click(); renderPrediction();
  }));

  $('#sd-random').addEventListener('click', () => {
    S.custom = ''; S.useCustom = false; S.predFeedback = null;
    AC.sfx.click(); applyInput(); render();
  });
  $('#sd-custom-btn').addEventListener('click', () => {
    const err = applyInput($('#sd-custom').value);
    AC.sfx.click();
    if (err) {
      $('#sd-input-error').innerHTML = '<div class="note pk" style="margin:10px 0 0">' + esc(err) + '</div>';
    } else {
      render();
    }
  });

  $('#sd-run').addEventListener('click', runComparison);
  $('#sd-play').addEventListener('click', () => { if (S.traces) setPlaying(!S.playing); });
  $('#sd-step').addEventListener('click', () => { if (S.traces) { stop(); tick(); } });
  $('#sd-reset').addEventListener('click', () => {
    if (!S.traces) return;
    stop(); S.step = 0; drawStep(0); renderPrediction(); $('#sd-summary').innerHTML = '';
    AC.sfx.click();
  });
  $('#sd-speed').addEventListener('input', (e) => {
    S.speed = Number(e.target.value);
    $('#sd-speed-label').textContent = S.speed.toFixed(1) + '×';
    if (S.playing) { clearInterval(S.timer); S.timer = setInterval(tick, interval()); }
  });
}

function updateInputInfo() {
  const el = $('#sd-input-info');
  if (!el) return;
  const pair = getPair();
  let info = S.input.length + ' ITEMS' + (S.useCustom ? ' · CUSTOM' : ' · ' + S.dataset.toUpperCase());
  if (pair.kind === 'search') info += ' · TARGET ' + S.targetValue;
  el.textContent = info;
}

function renderPrediction() {
  const box = $('#sd-pred');
  if (!box) return;
  $$('[data-pred]', box).forEach(b => {
    b.classList.toggle('picked', b.dataset.pred === S.predicted);
    b.classList.remove('correct', 'wrong');
  });
  const res = $('#sd-pred-result');
  if (res) {
    if (S.predFeedback) {
      res.className = 'pred-result show';
      res.innerHTML = S.predFeedback;
    } else {
      res.className = 'pred-result';
      res.innerHTML = '';
    }
  }
}

/* ───────────────────────── run + playback ───────────────────────── */

function runComparison() {
  const pair = getPair();
  if (!S.input.length) applyInput();

  const inputCopy = S.input.slice();
  let a, b;
  try {
    a = pair.kind === 'search' ? pair.a.run(inputCopy.slice(), S.targetValue) : pair.a.run(inputCopy.slice());
    b = pair.kind === 'search' ? pair.b.run(inputCopy.slice(), S.targetValue) : pair.b.run(inputCopy.slice());
  } catch (e) {
    AC.toast('RUN FAILED', e.message, false);
    return;
  }

  S.traces = { a, b };
  S.step = 0;
  AC.awardAchievement('first-showdown');
  evaluatePrediction();
  updateInputInfo();
  drawStep(0);
  $('#sd-summary').innerHTML = '';
  setPlaying(true);
  AC.sfx.open();
}

function evaluatePrediction() {
  const pair = getPair();
  const da = S.traces.a.stats.ops, db = S.traces.b.stats.ops;
  const tie = Math.abs(da - db) <= Math.max(2, Math.round(0.05 * Math.max(da, db)));
  let correct = false;
  if (S.predicted === 'a') correct = !tie && da < db;
  else if (S.predicted === 'b') correct = !tie && db < da;
  else if (S.predicted === 'tie') correct = tie;

  const st = AC.getState();
  const rec = st.showdown[S.pairId] || {};
  const firstCorrect = S.predicted && correct && !rec.rewarded;

  if (S.predicted) {
    const winner = tie ? 'TIE' : (da < db ? pair.a.name : pair.b.name);
    let html = '<b>Result:</b> ' + esc(pair.a.name) + ' used <b>' + AA.formatInt(da) + '</b> ops · ' +
      esc(pair.b.name) + ' used <b>' + AA.formatInt(db) + '</b> ops → <b>' + esc(winner) + '</b> wins. ';
    if (correct) {
      html += '<span style="color:var(--green)">Your prediction was correct!</span>';
      if (firstCorrect) {
        st.showdown[S.pairId] = { predicted: S.predicted, correct: true, rewarded: true };
        AC.save();
        AC.awardXP(40);
        const correctCount = Object.values(st.showdown).filter(r => r && r.correct).length;
        if (correctCount >= 3) AC.awardAchievement('showdown-oracle');
        html += ' <span style="color:var(--gold)">+40 XP — first correct prediction for this match.</span>';
      }
    } else {
      html += '<span style="color:var(--red)">Your prediction was off — study the operation counts below.</span>';
      if (!rec.predicted) {
        st.showdown[S.pairId] = Object.assign({ predicted: S.predicted, correct: false }, rec);
        AC.save();
      }
    }
    S.predFeedback = html;
  }
  renderPrediction();
}

const interval = () => Math.round(420 / S.speed);

function setPlaying(on) {
  S.playing = on;
  clearInterval(S.timer);
  if (on) S.timer = setInterval(tick, interval());
  const btn = $('#sd-play');
  if (btn) { btn.textContent = on ? '⏸' : '▶'; btn.setAttribute('aria-label', on ? 'Pause' : 'Play'); }
}

function stop() { setPlaying(false); }

function tick() {
  if (!S.traces) return;
  const { a, b } = S.traces;
  const end = Math.max(a.steps.length, b.steps.length);
  if (S.step >= end) { stop(); renderSummary(); return; }
  // adaptive batching: long runs sweep fast early, then slow down near the end
  const batch = Math.max(1, Math.ceil((end - S.step) / 90));
  S.step = Math.min(S.step + batch, end);
  drawStep(S.step);
  if (S.step >= end) { stop(); renderSummary(); }
}

function drawIdle() {
  ['a', 'b'].forEach(side => {
    const bars = $('#sd-bars-' + side);
    if (bars) bars.innerHTML = '<div style="width:100%;text-align:center;color:var(--faint);font-size:10px;padding:20px 0">Press RUN COMPARISON to load the arena</div>';
    const st = $('#sd-status-' + side);
    if (st) st.innerHTML = '<span>COMPARISONS <b>—</b></span><span>SWAPS / WRITES <b>—</b></span><span>TOTAL OPS <b>—</b></span><span>STATUS <b>READY</b></span>';
    const tx = $('#sd-step-text-' + side);
    if (tx) tx.textContent = '';
  });
}

function drawStep(i) {
  const { a, b } = S.traces;
  const stepA = a.steps[Math.min(i, a.steps.length - 1)];
  const stepB = b.steps[Math.min(i, b.steps.length - 1)];
  drawPanel('a', a, stepA, i >= a.steps.length - 1);
  drawPanel('b', b, stepB, i >= b.steps.length - 1);
}

function drawPanel(side, trace, step, atEnd) {
  const bars = $('#sd-bars-' + side);
  if (!bars) return;
  const arr = step.a;
  const min = Math.min.apply(null, arr), max = Math.max.apply(null, arr);
  const span = Math.max(1, max - min);
  const marked = {};
  (step.marks || []).forEach(m => { marked[m.i] = m.k; });
  bars.innerHTML = arr.map((v, i) => {
    const h = 8 + Math.round(((v - min) / span) * 92);
    return '<div class="bar-cell ' + (marked[i] || '') + '" style="height:' + h + '%" title="a[' + i + '] = ' + v + '"></div>';
  }).join('');

  const s = trace.stats;
  const done = atEnd;
  $('#sd-status-' + side).innerHTML =
    '<span>COMPARISONS <b>' + AA.formatInt(s.comparisons || 0) + '</b></span>' +
    '<span>SWAPS / WRITES <b>' + AA.formatInt((s.swaps || 0) + (s.writes || 0)) + '</b></span>' +
    '<span>TOTAL OPS <b>' + AA.formatInt(s.ops) + '</b></span>' +
    '<span>STATUS <b>' + (done ? 'FINISHED' : 'RUNNING') + '</b></span>';
  $('#sd-step-text-' + side).textContent = step.text || '';
}

/* ───────────────────────── summary ───────────────────────── */

function renderSummary() {
  const pair = getPair();
  const { a, b } = S.traces;
  const da = a.stats.ops, db = b.stats.ops;
  const tie = Math.abs(da - db) <= Math.max(2, Math.round(0.05 * Math.max(da, db)));
  const winner = tie ? null : (da < db ? 'a' : 'b');

  // correctness validation
  let validation;
  if (pair.kind === 'sort') {
    const sortedOk = (r) => r.every((v, i) => i === 0 || r[i - 1] <= v);
    const permOk = (r) => {
      const x = S.input.slice().sort((p, q) => p - q).join(',');
      return r.slice().sort((p, q) => p - q).join(',') === x;
    };
    const aOk = sortedOk(a.result) && permOk(a.result);
    const bOk = sortedOk(b.result) && permOk(b.result);
    validation = 'Output validation — ' + pair.a.name + ': ' + (aOk ? '✓ correctly sorted (permutation preserved)' : '✖ INVALID RESULT') +
      ' · ' + pair.b.name + ': ' + (bOk ? '✓ correctly sorted' : '✖ INVALID RESULT');
  } else {
    const agree = (a.result < 0) === (b.result < 0);
    validation = 'Output validation — both algorithms agree the target ' + S.targetValue + ' is ' +
      (a.result >= 0 ? 'present (found at index ' + a.result + ' / ' + b.result + ')' : 'absent') +
      (agree ? ' ✓' : ' ✖ MISMATCH');
  }

  const col = (side, algo, trace, ops, win) =>
    '<div class="cmp-col">' +
      '<h4 style="color:' + algo.color + '">' + esc(algo.name.toUpperCase()) + (win ? ' · WINNER' : '') + '</h4>' +
      '<div class="cmp-row"><span class="k">Input size</span><span class="v">' + S.input.length + ' items</span></div>' +
      '<div class="cmp-row"><span class="k">Comparisons</span><span class="v' + (win ? ' win' : '') + '">' + AA.formatInt(trace.stats.comparisons || 0) + '</span></div>' +
      '<div class="cmp-row"><span class="k">Swaps / writes</span><span class="v">' + AA.formatInt((trace.stats.swaps || 0) + (trace.stats.writes || 0)) + '</span></div>' +
      '<div class="cmp-row"><span class="k">Total operations</span><span class="v' + (win ? ' win' : '') + '">' + AA.formatInt(ops) + '</span></div>' +
      '<div class="cmp-row"><span class="k">Theoretical complexity</span><span class="v">' + esc(algo.complexity) + '</span></div>' +
      '<div class="cmp-row"><span class="k">Observed growth class</span><span class="v">' + esc(observedClass(pair, trace)) + '</span></div>' +
    '</div>';

  $('#sd-summary').innerHTML =
    '<div class="panel" style="margin-top:20px">' +
      '<div class="panel-t">COMPARISON SUMMARY</div>' +
      '<div class="cmp-summary">' + col('a', pair.a, a, da, winner === 'a') + col('b', pair.b, b, db, winner === 'b') + '</div>' +
      '<div class="note" style="margin-top:16px">' + esc(validation) + '</div>' +
      (winner
        ? '<div class="note cy" style="margin-top:10px"><b>' + esc((winner === 'a' ? pair.a : pair.b).name) + '</b> won this round with <b>' +
          AA.formatInt(Math.min(da, db)) + '</b> operations — <b>' + AA.formatInt(Math.abs(da - db)) + '</b> fewer than its rival (' +
          Math.round((1 - Math.min(da, db) / Math.max(da, db)) * 100) + '% less work). On larger inputs this gap grows ' +
          (pair.id === 'linear-vs-binary' ? 'dramatically: O(n) vs O(log n) diverges fast.' :
           pair.id === 'bubble-vs-merge' ? 'dramatically: O(n²) vs O(n log n) diverges fast.' :
           'modestly here — both are O(n²); the constant factors and input pattern decide this one.') + '</div>'
        : '<div class="note vi" style="margin-top:10px"><b>Dead heat.</b> Both algorithms used effectively the same number of operations on this input.</div>') +
    '</div>';
}

function observedClass(pair, trace) {
  const n = S.input.length;
  const ops = trace.stats.ops;
  if (pair.kind === 'search') {
    return ops <= 2 * Math.ceil(Math.log2(n)) + 2 ? 'logarithmic (log n)' : 'linear (n)';
  }
  const nlogn = n * Math.max(1, Math.log2(n));
  if (ops <= nlogn * 1.6) return 'linearithmic (n log n)';
  return 'quadratic (n²)';
}

/* ───────────────────────── boot ───────────────────────── */

function init() {
  root = document.getElementById('showdown-root');
  if (!root) return;
  applyInput();
  render();
  window.AA_FEATURES = window.AA_FEATURES || [];
  window.AA_FEATURES.push({
    onView: (name) => { if (name === 'showdown') { stop(); render(); } }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/* test hooks */
window.AA_SHOWDOWN = { PAIRS, applyInputTo: (custom) => applyInput(custom), current: S };

})();
