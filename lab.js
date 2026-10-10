/* ============================================================================
   ALGOARCADE — COMPLEXITY LAB
   Sweeps input sizes, counts real instrumented operations, and plots
   n (input size) vs operation count against reference growth curves.
   No fabricated benchmarks: every point is a measured operation count.
   ========================================================================== */
(function () {
'use strict';

const AA = window.AA_ALGO;
const AC = window.ALGOARCADE;
const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = AC.esc;

/* growth class ranks — used by the prediction exercise */
const RANK = { 'O(1)': 0, 'O(log n)': 1, 'O(n)': 2, 'O(n log n)': 3, 'O(n²)': 4, 'O(2ⁿ)': 5 };

const ALGOS = [
  { id: 'merge',   name: 'Merge Sort',      kind: 'sort',    fn: AA.countMerge,      cls: 'O(n log n)', cap: 512, color: 'var(--green)',  note: 'divide & conquer' },
  { id: 'bubble',  name: 'Bubble Sort',     kind: 'sort',    fn: AA.countBubble,     cls: 'O(n²)',      cap: 512, color: 'var(--pink)',   note: 'quadratic, adaptive' },
  { id: 'insertion', name: 'Insertion Sort',kind: 'sort',    fn: AA.countInsertion,  cls: 'O(n²)',      cap: 512, color: 'var(--gold)',   note: 'quadratic, adaptive' },
  { id: 'selection', name: 'Selection Sort',kind: 'sort',    fn: AA.countSelection,  cls: 'O(n²)',      cap: 512, color: 'var(--blue)',   note: 'quadratic, non-adaptive' },
  { id: 'linear-search', name: 'Linear Search', kind: 'search', fn: AA.countLinearSearch, cls: 'O(n)',   cap: 512, color: 'var(--cyan)',  note: 'scans left → right' },
  { id: 'binary-search', name: 'Binary Search', kind: 'search', fn: AA.countBinarySearch, cls: 'O(log n)', cap: 512, color: 'var(--violet)', note: 'halves the range (needs sorted input)' },
  { id: 'fib',     name: 'Fibonacci (naive recursion)', kind: 'recursive', fn: (a) => AA.countFib(a.length), cls: 'O(2ⁿ)', cap: 30, color: 'var(--red)', note: 'duplicated subproblems' }
];

const REFERENCES = [
  { id: 'r1', name: 'O(1)',      f: () => 1,                       color: '#8b93ab', dash: '1 5' },
  { id: 'r2', name: 'O(log n)',  f: (n) => Math.log2(Math.max(2, n)), color: '#6b7280', dash: '4 4' },
  { id: 'r3', name: 'O(n)',      f: (n) => n,                      color: '#4da3ff', dash: '' },
  { id: 'r4', name: 'O(n log n)',f: (n) => n * Math.log2(Math.max(2, n)), color: '#8b5cf6', dash: '8 4' },
  { id: 'r5', name: 'O(n²)',     f: (n) => n * n,                  color: '#f72585', dash: '' },
  { id: 'r6', name: 'O(2ⁿ)',     f: (n) => Math.pow(2, n),         color: '#ff5c6c', dash: '2 3' }
];

const DATASETS = [
  ['random', 'Random (average)'], ['sorted', 'Sorted (best-ish)'],
  ['reversed', 'Reversed (worst)'], ['nearly', 'Nearly sorted'], ['few', 'Few unique']
];

const S = {
  selected: ['merge', 'bubble'],
  maxSize: 512,
  dataset: 'random',
  showRefs: true,
  predicted: null,
  predictionResolved: false,
  predOutcome: null,
  series: null
};

function getAlgo(id) { return ALGOS.find(a => a.id === id); }

/* deterministic dataset for a given (kind, n): same data for every algorithm */
function datasetFor(kind, n) {
  // AA.genDataset uses Math.random for some kinds — regenerate is fine because
  // within a single experiment the same array object is shared across algorithms.
  return AA.genDataset(n, kind);
}

function sweepSizes(cap) {
  const out = [];
  for (let i = 0; i <= 10; i++) {
    const n = Math.round(8 * Math.pow(cap / 8, i / 10));
    if (!out.length || n > out[out.length - 1]) out.push(n);
  }
  if (out[out.length - 1] !== cap) out.push(cap);
  return out;
}

function runExperiment() {
  const selected = S.selected.map(getAlgo);
  const isSearch = selected.some(a => a.kind === 'search');
  const sizes = sweepSizes(S.maxSize);

  // ONE dataset per size, shared by every algorithm — a fair comparison.
  const shared = {};
  for (const n of sizes) {
    let d = datasetFor(S.dataset, n);
    if (isSearch) d = d.slice().sort((x, y) => x - y); // sorted precondition for binary search
    shared[n] = d;
  }

  const series = selected.map(algo => {
    const pts = [];
    for (const n of sizes) {
      if (n > algo.cap) continue;
      const data = shared[n];
      let ops;
      try {
        const r = algo.kind === 'search' ? algo.fn(data, data[Math.floor(data.length / 2)]) : algo.fn(data);
        ops = r.ops;
      } catch (e) { ops = null; }
      if (ops !== null) pts.push({ n, ops });
    }
    return { algo, pts };
  });
  S.series = series;
  renderChart();
  renderTable();
}

/* ───────────────────────── rendering ───────────────────────── */

function render() {
  const root = document.getElementById('lab-root');
  if (!root) return;

  root.innerHTML =
    '<div class="lab-controls">' +
      '<div class="field"><span class="toolbar-label" style="display:block;margin-bottom:9px">Algorithms</span>' +
        '<div class="seg" style="flex-wrap:wrap" role="group" aria-label="Algorithms">' +
          ALGOS.map(a =>
            '<button type="button" data-algo="' + a.id + '" class="' + (S.selected.includes(a.id) ? 'on' : '') + '" ' +
            'aria-pressed="' + S.selected.includes(a.id) + '" title="' + esc(a.note) + '">' + esc(a.name.split(' ')[0].toUpperCase()) + '</button>'
          ).join('') +
        '</div></div>' +
      '<div class="field" style="max-width:240px"><label for="lab-size">Max input size <b id="lab-size-label" style="color:var(--cyan)">' + S.maxSize + '</b></label>' +
        '<input type="range" id="lab-size" min="32" max="512" step="16" value="' + S.maxSize + '" aria-label="Maximum input size"></div>' +
      '<div class="field"><span class="toolbar-label" style="display:block;margin-bottom:9px">Dataset</span>' +
        '<div class="seg" style="flex-wrap:wrap" role="group" aria-label="Dataset">' +
          DATASETS.map(([v, l]) =>
            '<button type="button" data-ds="' + v + '" class="' + (S.dataset === v ? 'on' : '') + '" ' +
            'aria-pressed="' + (S.dataset === v) + '">' + esc(l.toUpperCase()) + '</button>').join('') +
        '</div></div>' +
      '<div class="btn-row" style="align-items:flex-end">' +
        '<button class="btn" id="lab-run"' + (S.predictionResolved ? '' : ' disabled') + '>🧪 RUN EXPERIMENT</button>' +
        '<button class="btn ghost sm" id="lab-refs" aria-pressed="' + S.showRefs + '">' + (S.showRefs ? '📈 REFS: ON' : '📈 REFS: OFF') + '</button>' +
      '</div>' +
    '</div>' +

    predictionHTML() +

    (!S.predictionResolved
      ? '<div class="note vi" style="margin-top:4px">Answer the prediction above to unlock the experiment — the chart is the reveal.</div>'
      : '') +

    '<div class="chart-wrap" id="lab-chart">' +
      '<div class="empty"><span class="e-ico">🧪</span>No data yet — answer the prediction, then run the experiment.</div>' +
    '</div>' +

    '<div id="lab-table"></div>' +

    '<div class="note cy" style="margin-top:16px"><b>Measured vs. theoretical.</b> The curves above are REAL operation ' +
    'counts returned by instrumented implementations — not wall-clock timings. Big-O describes how counts GROW as n ' +
    'heads to infinity; your machine adds constant factors (CPU, JIT warm-up, cache effects, input pattern) that ' +
    'wall-clock measurements would fold into the result. Counting operations removes that noise and is why two ' +
    'algorithms with the same class (say, insertion vs. selection sort) can still differ in practice — and why ' +
    'dataset choice matters: sorted input is insertion sort\'s best case and bubble sort\'s best case, while ' +
    'reversed input is their worst.</div>';

  bind(root);

  if (S.series) { renderChart(); renderTable(); }
}

function predictionHTML() {
  if (S.predictionResolved) {
    const q = predictionQuestion();
    const out = S.predOutcome || { correct: false, answer: null };
    return (
      '<div class="pred-box answered">' +
        '<div class="pred-q pixel">PREDICTION — ANSWERED</div>' +
        '<p style="font-size:12px;line-height:1.9">' + esc(q.text) + '</p>' +
        '<div class="pred-result show" id="lab-pred-result">' + esc(q.feedback(out.correct, out.answer)) + '</div>' +
      '</div>'
    );
  }
  const q = predictionQuestion();
  return (
    '<div class="pred-box" id="lab-pred">' +
      '<div class="pred-q pixel">PREDICT BEFORE THE REVEAL</div>' +
      '<p style="font-size:12px;line-height:1.9;margin-bottom:14px">' + esc(q.text) + '</p>' +
      '<div class="pred-opts" role="group" aria-label="Prediction">' +
        '<button class="pred-opt" data-lp="' + q.optA + '">' + esc(q.labelA) + '</button>' +
        '<button class="pred-opt" data-lp="' + q.optB + '">' + esc(q.labelB) + '</button>' +
        '<button class="pred-opt" data-lp="tie">SAME GROWTH RATE</button>' +
      '</div>' +
      '<div class="pred-result" id="lab-pred-result"></div>' +
    '</div>'
  );
}

function predictionQuestion() {
  const a = getAlgo(S.selected[0]) || ALGOS[0];
  const b = getAlgo(S.selected[1]) || ALGOS[1];
  const ra = RANK[a.cls], rb = RANK[b.cls];
  const feedback = (correct, answer) => {
    let msg;
    if (answer === 'tie') msg = 'They share the same growth class — ' + a.cls + '.';
    else msg = 'The faster-growing class is ' + (ra > rb ? a.name + ' (' + a.cls + ')' : b.name + ' (' + b.cls + ')') + '.';
    return (correct ? '✓ Correct. ' : '✗ Not quite. ') + msg +
      ' Run the experiment to see the measured operation counts diverge.';
  };
  return {
    text: 'As the input size doubles, which of your selected algorithms will have MORE operations — ' +
          a.name + ' (' + a.cls + ') vs ' + b.name + ' (' + b.cls + ')?',
    labelA: a.name.toUpperCase() + ' (' + a.cls + ')',
    labelB: b.name.toUpperCase() + ' (' + b.cls + ')',
    optA: 'a', optB: 'b',
    correct: ra === rb ? 'tie' : (ra > rb ? 'a' : 'b'),
    feedback
  };
}

function bind(root) {
  $$('[data-algo]', root).forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.algo;
    const i = S.selected.indexOf(id);
    if (i >= 0) {
      if (S.selected.length > 1) S.selected.splice(i, 1);
    } else if (S.selected.length < 4) S.selected.push(id);
    S.predictionResolved = false; S.predicted = null; S.series = null;
    AC.sfx.click(); render();
  }));
  $$('[data-ds]', root).forEach(b => b.addEventListener('click', () => {
    S.dataset = b.dataset.ds; AC.sfx.click(); render();
  }));
  const size = $('#lab-size');
  if (size) {
    // live label while dragging; full re-render on release (rebuilding mid-drag would kill the thumb)
    size.addEventListener('input', (e) => { S.maxSize = Number(e.target.value); $('#lab-size-label').textContent = S.maxSize; });
    size.addEventListener('change', (e) => { S.maxSize = Number(e.target.value); render(); });
  }
  $$('[data-lp]', root).forEach(b => b.addEventListener('click', () => {
    if (S.predictionResolved) return;
    S.predicted = b.dataset.lp;
    const q = predictionQuestion();
    const correct = S.predicted === q.correct;
    S.predictionResolved = true;
    S.predOutcome = { correct, answer: S.predicted };
    AC.sfx.click();

    if (correct) {
      const st = AC.getState();
      if (!st.lab.predictions.correct) {
        st.lab.predictions.correct = true;
        AC.save();
        AC.awardXP(40);
        AC.awardAchievement('complexity-detective');
      }
    }
    render();
    const res = $('#lab-pred-result');
    if (res) res.innerHTML = q.feedback(correct, S.predicted);
  }));
  const run = $('#lab-run');
  if (run) run.addEventListener('click', () => { AC.sfx.open(); runExperiment(); });
  const refs = $('#lab-refs');
  if (refs) refs.addEventListener('click', () => {
    S.showRefs = !S.showRefs; AC.sfx.click(); render();
  });
}

/* ───────────────────────── chart ───────────────────────── */

const W = 860, H = 440, M = { t: 18, r: 24, b: 56, l: 78 };

function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + 'k';
  return String(Math.round(n));
}

function renderChart() {
  const box = document.getElementById('lab-chart');
  if (!box || !S.series) return;

  const iw = W - M.l - M.r, ih = H - M.t - M.b;
  const allPts = S.series.flatMap(s => s.pts);

  // reference curves (normalized to the first measured data point)
  const refs = [];
  if (S.showRefs && allPts.length) {
    const anchor = allPts[0];
    for (const r of REFERENCES) {
      const f0 = r.f(anchor.n);
      if (!(f0 > 0) || !isFinite(f0)) continue;
      refs.push(Object.assign({}, r, { scale: anchor.ops / f0 }));
    }
  }

  let maxY = 1;
  S.series.forEach(s => s.pts.forEach(p => { if (p.ops > maxY) maxY = p.ops; }));
  refs.forEach(r => {
    const last = S.series[0].pts[S.series[0].pts.length - 1];
    const v = r.scale * r.f(last.n);
    if (isFinite(v) && v < 30 * maxY) maxY = Math.max(maxY, v);
  });
  maxY *= 1.05;

  let minX = Infinity, maxX = 1;
  S.series.forEach(s => s.pts.forEach(p => { minX = Math.min(minX, p.n); maxX = Math.max(maxX, p.n); }));
  if (!isFinite(minX)) { minX = 8; }

  const x = (n) => M.l + ((n - minX) / Math.max(1, maxX - minX)) * iw;
  const y = (v) => M.t + ih - (v / maxY) * ih;

  // grid + ticks
  let grid = '', ticksX = '';
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const v = (maxY / yTicks) * i;
    const yy = y(v);
    grid += '<line class="chart-grid" x1="' + M.l + '" y1="' + yy + '" x2="' + (W - M.r) + '" y2="' + yy + '"/>' +
            '<text class="chart-tick" x="' + (M.l - 10) + '" y="' + (yy + 3) + '" text-anchor="end">' + fmt(v) + '</text>';
  }
  const xStep = Math.max(1, Math.round((maxX - minX) / 8));
  for (let n = minX; n <= maxX; n += xStep) {
    ticksX += '<line class="chart-grid" x1="' + x(n) + '" y1="' + M.t + '" x2="' + x(n) + '" y2="' + (M.t + ih) + '" opacity=".6"/>' +
              '<text class="chart-tick" x="' + x(n) + '" y="' + (M.t + ih + 18) + '" text-anchor="middle">' + n + '</text>';
  }

  // series polylines
  let seriesSVG = '';
  S.series.forEach(s => {
    const pts = s.pts.map(p => x(p.n) + ',' + y(p.ops)).join(' ');
    seriesSVG += '<polyline points="' + pts + '" fill="none" stroke="' + s.algo.color + '" stroke-width="2.5" stroke-linejoin="round"/>';
    s.pts.forEach(p => {
      seriesSVG += '<circle class="chart-pt" cx="' + x(p.n) + '" cy="' + y(p.ops) + '" r="4" fill="' + s.algo.color + '" ' +
        'data-tt="' + esc(s.algo.name) + ' · n=' + p.n + ' · ' + fmt(p.ops) + ' ops"/>';
    });
  });

  let refSVG = '';
  refs.forEach(r => {
    const pts = [];
    for (const s of S.series[0].pts) {
      const v = r.scale * r.f(s.n);
      if (v <= maxY) pts.push(x(s.n) + ',' + y(v));
    }
    if (pts.length > 1) {
      refSVG = '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + r.color + '" stroke-width="1.5" ' +
        'stroke-dasharray="' + r.dash + '" opacity=".75"/>' + refSVG;
    }
  });

  box.innerHTML =
    '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Operation counts versus input size">' +
      grid + ticksX +
      '<line class="chart-axis" x1="' + M.l + '" y1="' + M.t + '" x2="' + M.l + '" y2="' + (M.t + ih) + '"/>' +
      '<line class="chart-axis" x1="' + M.l + '" y1="' + (M.t + ih) + '" x2="' + (W - M.r) + '" y2="' + (M.t + ih) + '"/>' +
      refSVG + seriesSVG +
      '<text class="chart-label" x="' + (M.l + iw / 2) + '" y="' + (H - 12) + '" text-anchor="middle">input size n (elements)</text>' +
      '<text class="chart-label" x="18" y="' + (M.t + ih / 2) + '" text-anchor="middle" transform="rotate(-90 18 ' + (M.t + ih / 2) + ')">operation count</text>' +
    '</svg>' +
    '<div class="chart-legend">' +
      S.series.map(s =>
        '<span class="legend-item"><span class="legend-swatch" style="background:' + s.algo.color + '"></span>' +
        esc(s.algo.name) + ' · ' + esc(s.algo.cls) + '</span>').join('') +
      (refs.map(r =>
        '<span class="legend-item"><span class="legend-swatch" style="background:' + r.color + '"></span>' + esc(r.name) + ' reference</span>').join('')) +
    '</div>';

  // tooltips
  box.querySelectorAll('[data-tt]').forEach(el => {
    el.addEventListener('mouseenter', (e) => {
      const tt = document.getElementById('chart-tooltip');
      tt.textContent = el.getAttribute('data-tt');
      tt.classList.add('show');
      position(e, tt);
    });
    el.addEventListener('mousemove', (e) => position(e, document.getElementById('chart-tooltip')));
    el.addEventListener('mouseleave', () => {
      document.getElementById('chart-tooltip').classList.remove('show');
    });
  });
}

function position(e, tt) {
  if (!tt) return;
  tt.style.left = Math.min(window.innerWidth - 240, e.clientX + 14) + 'px';
  tt.style.top = (e.clientY - 10) + 'px';
}

/* ───────────────────────── table ───────────────────────── */

function renderTable() {
  const box = document.getElementById('lab-table');
  if (!box || !S.series) return;
  box.innerHTML =
    '<div class="panel" style="margin-top:16px">' +
      '<div class="panel-t">MEASURED GROWTH — dataset: ' + esc(S.dataset) + '</div>' +
      '<div class="tbl-wrap"><table class="growth-table"><thead><tr>' +
        '<th>Algorithm</th><th>Theory</th><th>Ops at smallest n</th><th>Ops at largest n</th>' +
        '<th>Growth factor</th><th>n factor</th><th>Verdict</th>' +
      '</tr></thead><tbody>' +
      S.series.map(s => {
        const first = s.pts[0], last = s.pts[s.pts.length - 1];
        if (!first || !last) return '';
        const opFactor = last.ops / Math.max(1, first.ops);
        const nFactor = last.n / first.n;
        const ratio = opFactor / nFactor;
        const verdict = ratio < 1.6 ? 'sub-linear growth' :
                        ratio < 6 ? 'roughly linear growth' :
                        ratio < 60 ? 'super-linear (n log n-ish?)' : 'quadratic or worse';
        return '<tr><td><span style="color:' + s.algo.color + '">' + esc(s.algo.name) + '</span></td>' +
          '<td>' + esc(s.algo.cls) + '</td>' +
          '<td class="num">' + fmt(first.ops) + ' @ n=' + first.n + '</td>' +
          '<td class="num">' + fmt(last.ops) + ' @ n=' + last.n + '</td>' +
          '<td class="num">×' + opFactor.toFixed(1) + '</td>' +
          '<td class="num">×' + nFactor.toFixed(1) + '</td>' +
          '<td>' + verdict + '</td></tr>';
      }).join('') +
      '</tbody></table></div>' +
      '<div class="note" style="margin-top:14px"><b>Reading the table:</b> if operations grew exactly like O(n), ' +
      'the growth factor would equal the n factor. ×n² input → ×n² operations means quadratic behavior; ' +
      '×n·log n means linearithmic. The chart shows the same story visually.</div>' +
    '</div>';
}

/* ───────────────────────── boot ───────────────────────── */

function init() {
  // lazily create the tooltip element if missing (app.js ships one, be safe)
  if (!document.getElementById('chart-tooltip')) {
    const tt = document.createElement('div');
    tt.id = 'chart-tooltip'; tt.className = 'chart-tooltip';
    document.body.appendChild(tt);
  }
  render();
  window.AA_FEATURES = window.AA_FEATURES || [];
  window.AA_FEATURES.push({ onView: (name) => { if (name === 'lab') render(); } });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

/* test hooks */
window.AA_LAB = { ALGOS, REFERENCES, sweepSizes, predictionQuestion: () => predictionQuestion(), current: S };

})();
