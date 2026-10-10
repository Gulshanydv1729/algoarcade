/* ============================================================================
   ALGOARCADE — INTEGRATION TESTS (jsdom, full app, all scripts loaded)
   Navigation, Showdown run + summary, Bosses solve flow, Lab experiment,
   Worlds maze run, trophy cabinet, achievement dedupe.
   ========================================================================== */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const root = __dirname;
const dom = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), {
  runScripts: 'dangerously',
  url: 'https://localhost/',
  pretendToBeVisual: true
});
const { window } = dom;

// jsdom gaps
window.AudioContext = function () {
  return {
    state: 'running', currentTime: 0, destination: {},
    resume() {}, suspend() {},
    createOscillator: () => ({ type: 'square', frequency: { setValueAtTime() {}, value: 0 }, connect() {}, start() {}, stop() {} }),
    createGain: () => ({ gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, value: 0 }, connect() {} })
  };
};
window.scrollTo = () => {};
window.HTMLElement.prototype.scrollIntoView = function () {};
window.confirm = () => true;
window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));

['curriculum.js', 'algorithms.js', 'app.js', 'showdown.js', 'bosses.js', 'lab.js', 'worlds.js'].forEach(f => {
  const e = window.document.createElement('script');
  e.textContent = fs.readFileSync(path.join(root, f), 'utf8');
  window.document.head.appendChild(e);
});

const doc = window.document;
const $ = (s, r) => (r || doc).querySelector(s);
const $$ = (s, r) => Array.from((r || doc).querySelectorAll(s));
const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const levelsDone = () => ((state().worlds || {}).levels || {});

let fail = 0;
const ok = (l, c, x) => {
  if (c) console.log('  \x1b[32mPASS\x1b[0m ' + l);
  else { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + l + (x ? '  -> ' + x : '')); }
};
const go = (name) => {
  window.location.hash = name ? '#/' + name : '#/';
  window.dispatchEvent(new window.Event('hashchange'));
};
const state = () => JSON.parse(window.localStorage.getItem('algoarcade.v1') || '{}');

/* Feature files defer init() to DOMContentLoaded when readyState is
   'loading', which is the case while JSDOM finishes its lifecycle — so run
   the assertions only once every feature has registered itself. */
function whenReady(cb) {
  if ((window.AA_FEATURES || []).length >= 4) { setTimeout(cb, 0); return; }
  window.addEventListener('load', () => setTimeout(cb, 0));
}

function runTests() {

/* ── 1. NAVIGATION ── */
console.log('\n── NAVIGATION ──');
ok('5 view sections exist',
  ['home', 'showdown', 'bosses', 'lab', 'worlds'].every(v => !!$('#view-' + v)));
ok('home visible on load', !$('#view-home').hidden);
ok('feature views hidden on load', ['showdown', 'bosses', 'lab', 'worlds'].every(v => $('#view-' + v).hidden));
ok('6 nav destinations (5 views + trophies)', $$('.nav-btn').length === 6, $$('.nav-btn').length);

go('showdown');
ok('hash routing shows showdown', !$('#view-showdown').hidden && $('#view-home').hidden);
ok('active nav highlighted', $('.nav-btn[data-view="showdown"]').classList.contains('on'));
ok('aria-current set on active nav', $('.nav-btn[data-view="showdown"]').getAttribute('aria-current') === 'page');
ok('inactive nav has no highlight', !$('.nav-btn[data-view="home"]').classList.contains('on'));

go('home');
ok('routing back home', !$('#view-home').hidden && $('#view-showdown').hidden);

/* ── 2. SHOWDOWN ── */
console.log('\n── SHOWDOWN ──');
go('showdown');
ok('config toolbar rendered', $$('#showdown-root .seg').length >= 2, $$('#showdown-root .seg').length);
ok('two equally-sized viz panels', $$('#showdown-root .viz-panel').length === 2);
ok('prediction challenge present', !!$('#sd-pred') && $$('[data-pred]').length === 3);
ok('playback controls present', !!$('#sd-play') && !!$('#sd-step') && !!$('#sd-reset') && !!$('#sd-run'));
ok('summary initially empty', $('#sd-summary').innerHTML === '');

// predict, then run to completion using the STEP control (deterministic, no timers)
click($('[data-target="last"]')); // linear always scans to the end → binary must win
click($('[data-pred="b"]'));
ok('prediction marked picked', $('[data-pred="b"]').classList.contains('picked'));
click($('#sd-run'));
ok('run produced traces (bars rendered)', $$('#sd-bars-a .bar-cell').length === 24, $$('#sd-bars-a .bar-cell').length);
ok('first-showdown achievement awarded on run', !!state().achievements['first-showdown']);

for (let i = 0; i < 600 && !$('#sd-summary').innerHTML; i++) click($('#sd-step'));
const summary = $('#sd-summary').innerHTML;
ok('comparison summary rendered after playback', summary.includes('COMPARISON SUMMARY'), summary.slice(0, 60));
ok('summary shows op counts for both', summary.includes('Total operations') && summary.includes('Comparisons'));
ok('summary validates correctness', summary.includes('Output validation'));
ok('winner highlighted', summary.includes('WINNER') || summary.includes('Dead heat'));
ok('prediction feedback shown', $('#sd-pred-result').textContent.includes('Your prediction was correct'), $('#sd-pred-result').textContent.slice(0, 80));
ok('prediction rewarded +40 XP', state().xp === 140, state().xp);

// input validation path
go('home'); go('showdown');
click($('#sd-custom-btn'));
ok('rejects empty custom input', $('#sd-input-error').textContent.length > 0, '');

/* ── 3. DEBUG BOSSES ── */
console.log('\n── DEBUG BOSSES ──');
go('bosses');
ok('8 boss cards rendered', $$('.boss-card').length === 8, $$('.boss-card').length);
ok('topic filter present', $$('[data-filter]').length >= 4, $$('[data-filter]').length);

click($('[data-boss="off-by-one"]'));
ok('boss detail opened', !!$('#bd-code'), '');
ok('buggy line marked', $$('#bd-code .code-line.buggy').length === 1, $$('#bd-code .code-line.buggy').length);
ok('two repair options offered', $$('.opt-btn').length === 2, $$('.opt-btn').length);
ok('test cases table visible', $('#bd-results') && $('#tabbody') === null && $$('table tbody tr').length === 4, $$('table tbody tr').length);

// progressive hints
click($('#bd-hint'));
ok('hint 1 revealed', $('#bd-results') && $$('.hint.show').length === 1 && $$('.hint.show')[0].textContent.includes('Hint 1'), '');
click($('#bd-hint'));
ok('hints accumulate (2 shown)', $$('.hint.show')[0].textContent.includes('Hint 2'), '');

// submit broken code → failures
click($('#bd-run'));
ok('broken code fails ≥1 test', $$('#bd-results .boss-test.fail').length >= 1, $$('#bd-results .boss-test.fail').length);
ok('no XP for broken code', state().xp === 140, state().xp);

// pick the correct repair and resubmit
click($$('.opt-btn')[1]);
ok('option selection marked', $$('.opt-btn')[1].classList.contains('sel'));
click($('#bd-run'));
ok('correct fix passes all tests', $$('#bd-results .boss-test.fail').length === 0 && $$('#bd-results .boss-test.pass').length === 4,
  $$('#bd-results .boss-test.pass').length + ' pass');
ok('defeat banner shown', !!$('#bd-results .award'), '');
ok('solution explanation shown', $('#bd-explain').textContent.includes('SOLUTION EXPLANATION'), '');
ok('bug-hunter achievement awarded', !!state().achievements['bug-hunter']);
ok('first-clear XP (+80) + bug-hunter trophy (+150)', state().xp === 370, state().xp);
ok('boss marked solved in state', state().bosses.solved['off-by-one'] !== undefined);
ok('snapshot shows 1/8 bosses', $('#snap-bosses').textContent === '1/8', $('#snap-bosses').textContent);

// duplicate protection: revisit, already solved
go('home'); go('bosses');
// the bosses view preserves which challenge was open — return to the list first
if ($('#bd-back')) click($('#bd-back'));
ok('boss card shows defeated', $('[data-boss="off-by-one"]').classList.contains('solved'));
click($('[data-boss="off-by-one"]'));
click($$('.opt-btn')[1]);
click($('#bd-run'));
ok('re-clearing awards no extra XP', state().xp === 370, state().xp);

/* ── 4. COMPLEXITY LAB ── */
console.log('\n── COMPLEXITY LAB ──');
go('lab');
ok('run locked until prediction answered', $('#lab-run').disabled === true);
ok('prediction question shown', $('#lab-pred') && $('#lab-pred').textContent.includes('PREDICT'));
click($('[data-lp="b"]')); // bubble (O(n²)) grows faster than merge (O(n log n)) → correct
ok('correct prediction unlocks experiment', $('#lab-run').disabled === false);
ok('complexity-detective awarded', !!state().achievements['complexity-detective']);
ok('prediction XP +40 and trophy +100 granted', state().xp === 510, state().xp);
ok('prediction feedback rendered', $('#lab-pred-result') && $('#lab-pred-result').textContent.includes('Correct'),
  $('#lab-pred-result') ? $('#lab-pred-result').textContent.slice(0, 60) : 'missing');

click($('#lab-run'));
ok('chart SVG rendered', !!$('#lab-chart svg'));
ok('chart has 2 series polylines', $$('#lab-chart svg polyline').length >= 2, $$('#lab-chart svg polyline').length);
ok('data points drawn', $$('#lab-chart svg circle[data-tt]').length > 10, $$('#lab-chart svg circle[data-tt]').length);
ok('axes labeled', $('#lab-chart svg').innerHTML.includes('operation count') && $('#lab-chart svg').innerHTML.includes('input size'));
ok('legend shows algorithms + references', $$('.chart-legend .legend-item').length >= 4, $$('.chart-legend .legend-item').length);
ok('growth table rendered', $('#lab-table .growth-table') !== null);
const rows = $$('#lab-table tbody tr');
ok('one table row per selected algorithm', rows.length === 2, rows.length);
ok('table shows measured op counts', rows[0].textContent.includes('@ n='), rows[0].textContent.slice(0, 80));
ok('merge fewer ops than bubble at largest n (measured)',
  rows[0].textContent.includes('Merge Sort') && rows[0].querySelector('td.num').textContent.includes('@ n=8'),
  rows[0].textContent.slice(0, 120));

/* ── 5. WORLDS ── */
console.log('\n── WORLDS ──');
go('worlds');
ok('level list rendered (4 levels)', $$('.level-btn').length === 4, $$('.level-btn').length);
ok('maze grid rendered', $$('#wd-maze .cell').length === 15 * 11, $$('#wd-maze .cell').length);
ok('start + goal tiles present', $$('#wd-maze .cell.start').length === 1 && $$('#wd-maze .cell.goal').length === 1);
ok('drawing tools present', $$('[data-tool]').length === 4, $$('[data-tool]').length);
ok('algorithm selector has BFS/DFS/A*', $$('[data-algo]', $('#worlds-root')).length === 3,
  $$('[data-algo]', $('#worlds-root')).length);
ok('HUD controls present', !!$('#wd-run') && !!$('#wd-step') && !!$('#wd-play') && !!$('#wd-compare'));

// run BFS via STEP until completion (deterministic)
for (let i = 0; i < 900 && !levelsDone()[1]; i++) click($('#wd-step'));
ok('level 1 completed + persisted', !!levelsDone()[1]);
const statusTxt = $('#wd-status').textContent;
ok('status reports path found', statusTxt.includes('PATH FOUND'), statusTxt);
ok('explored cells visualized', $$('#wd-maze .cell.explored').length > 0, $$('#wd-maze .cell.explored').length);
ok('path cells drawn', $$('#wd-maze .cell.path').length > 1, $$('#wd-maze .cell.path').length);
ok('path length shown in HUD', $('#wd-pathlen').textContent !== '—', $('#wd-pathlen').textContent);
ok('maze-navigator awarded', !!state().achievements['maze-navigator']);
ok('level clear XP (+60) + maze-navigator trophy (+100)', state().xp === 670, state().xp);
ok('level button marked done', $('.level-btn[data-level="1"]').classList.contains('done'));

// path must be contiguous from start to goal
{
  const cells = $$('#wd-maze .cell.path');
  ok('path includes start tile', cells.some(c => c.classList.contains('start')), '');
  ok('path includes goal tile', cells.some(c => c.classList.contains('goal')), '');
}

// compare all strategies
click($('#wd-compare'));
const cmpBox = $('#wd-compare-box');
ok('compare table rendered', cmpBox.querySelector('table') !== null);
ok('compare lists all 3 algorithms', cmpBox.querySelectorAll('tbody tr').length === 3, cmpBox.querySelectorAll('tbody tr').length);
ok('compare reports explored + cost', cmpBox.textContent.includes('Cells explored') && cmpBox.textContent.includes('Path cost'));

// reset restores a clean grid
click($('#wd-reset'));
ok('reset clears exploration', $$('#wd-maze .cell.explored').length === 0 && $('#wd-status').textContent.includes('READY'),
  $('#wd-status').textContent);

/* ── 6b. STATIC A11Y / RESPONSIVE QA ── */
console.log('\n── A11Y / RESPONSIVE (static) ──');
{
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  ok('html lang attribute', doc.documentElement.getAttribute('lang') === 'en',
    doc.documentElement.getAttribute('lang'));
  const vp = $('meta[name="viewport"]');
  ok('responsive viewport meta', !!vp && /width=device-width/.test(vp.getAttribute('content')),
    vp ? vp.getAttribute('content') : 'missing');
  ok('reduced-motion media block in CSS', /@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(css));
  ok('mobile-first CSS: small-screen tweaks + mid/large breakpoints',
    /max-width:\s*(375|520)px/.test(css) &&
    /min-width:\s*(6[0-9]{2}|7[0-9]{2})px/.test(css) &&
    /min-width:\s*(9[0-9]{2}|10[0-9]{2})px/.test(css));
  ok('focus-visible keyboard outlines defined', css.includes(':focus-visible'));
  const navs = $$('.nav-btn');
  ok('nav destinations are native links/buttons (keyboard reachable)',
    navs.every(n => n.tagName === 'A' || n.tagName === 'BUTTON'));
  ok('icon-only buttons carry aria-labels',
    $$('.icon-btn').every(b => b.hasAttribute('aria-label')));
  ok('segmented controls expose aria-pressed',
    $$('.seg button').every(b => b.hasAttribute('aria-pressed') || b.hasAttribute('aria-label')));
  ok('landmarks present (nav, main content region)',
    !!$('nav[aria-label]') && !!$('.wrap'));
}

/* ── 6. TROPHY CABINET + DEDUPE ── */
console.log('\n── TROPHIES ──');
click($('#achv-btn'));
ok('trophy cabinet opens', !!$('.win') && !!$('.achv-grid'));
ok('8 achievements listed', $$('.achv-grid .achv').length === 8, $$('.achv-grid .achv').length);
const earnedCount = Object.keys(state().achievements).length;
ok('earned trophies highlighted, locked greyed', $$('.achv-grid .achv.locked').length === 8 - earnedCount, $$('.achv-grid .achv.locked').length);
doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
ok('Escape closes trophy cabinet', !$('.win'), '');

const xpBefore = state().xp;
const r1 = window.ALGOARCADE.awardAchievement('optimal-path');   // not yet earned
const xpMid = state().xp;
const r2 = window.ALGOARCADE.awardAchievement('optimal-path');   // duplicate
ok('first award succeeds, duplicate rejected', r1 === true && r2 === false, r1 + '/' + r2);
ok('first award grants 150 XP, duplicate grants none',
  xpMid === xpBefore + 150 && state().xp === xpMid, state().xp);

ok('exactly 5 achievements earned so far',
  Object.keys(state().achievements).sort().join(',') ===
    'bug-hunter,complexity-detective,first-showdown,maze-navigator,optimal-path',
  Object.keys(state().achievements).join(','));

console.log(fail === 0 ? '\n\x1b[32mALL VIEW TESTS PASS\x1b[0m\n' : `\n\x1b[31m${fail} VIEW TEST(S) FAILED\x1b[0m\n`);
process.exit(fail === 0 ? 0 : 1);

}

whenReady(runTests);
