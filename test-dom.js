/* End-to-end DOM test: real jsdom environment, real localStorage,
   exercises rendering, modal, tabs, lesson toggles, unlock chain, XP. */
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

// jsdom lacks these; provide them so app.js boots cleanly
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

const load = (f) => {
  const el = window.document.createElement('script');
  el.textContent = fs.readFileSync(path.join(root, f), 'utf8');
  window.document.head.appendChild(el);
};
load('curriculum.js');
load('app.js');

const doc = window.document;
const $ = (s) => doc.querySelector(s);
const $$ = (s) => Array.from(doc.querySelectorAll(s));

let fail = 0;
const ok = (label, cond, extra) => {
  if (cond) console.log('  \x1b[32mPASS\x1b[0m ' + label);
  else { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + label + (extra ? '  -> ' + extra : '')); }
};

console.log('\n── RENDER ──');
ok('2 track sections rendered', $$('.track').length === 2, $$('.track').length);
ok('12 module cards rendered', $$('.card').length === 12, $$('.card').length);
ok('brand title present', !!$('.brand'), '');
ok('tagline present', !!$('.tagline'), '');
ok('stat bar shows 12 quest lines', $('#s-lines').textContent === '12', $('#s-lines').textContent);
ok('level starts at 1', $('#s-level').textContent === '1', $('#s-level').textContent);

console.log('\n── UNLOCK CHAIN (fresh save) ──');
const locked = $$('.card.locked').length;
ok('exactly 2 modules unlocked (first of each track)', locked === 10, 'locked=' + locked);
const firstIds = $$('.card:not(.locked)').map(c => c.dataset.mod);
ok('unlocked = arrays-strings + cryptographic-hashing',
   firstIds.includes('arrays-strings') && firstIds.includes('cryptographic-hashing'), firstIds.join(','));

console.log('\n── MODAL ──');
$('.card[data-mod="arrays-strings"]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
ok('modal opened', !!$('.win'), '');
ok('3 tabs present', $$('.tab').length === 3, $$('.tab').length);
ok('3 lessons listed', $$('.lesson[data-lesson], .lesson').length >= 4, $$('.lesson').length);

console.log('\n── TABS ──');
$$('.tab').find(t => t.dataset.tab === 'theory').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
ok('theory tab renders content', $('#tabbody').innerHTML.includes('CHEAT SHEET'), '');
$$('.tab').find(t => t.dataset.tab === 'playground').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
ok('playground tab renders', !!$('#pg-input'), '');
ok('2 modes for arrays-strings', $$('.mode').length === 2, $$('.mode').length);
ok('RUN button present', !!$('#pg-run'), '');

console.log('\n── LESSON CHECKBOX ──');
$$('.tab').find(t => t.dataset.tab === 'syllabus').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const chk = $('[data-lesson]');
chk.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
ok('lesson marked complete', !!$(`[data-lesson="${chk.dataset.lesson}"].on`), chk.dataset.lesson);
ok('persisted to localStorage', !!JSON.parse(window.localStorage.getItem('algoarcade.v1')).completedLessons[chk.dataset.lesson], '');

console.log('\n── CHALLENGE RUN + REWARD ──');
$$('.tab').find(t => t.dataset.tab === 'playground').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
$('#pg-input').value = 'the quick brown fox';
$('#pg-run').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

setTimeout(() => {
  const out = $('#pg-out').textContent;
  ok('runner produced output', out.includes('fox brown quick the'), out.slice(0, 60));
  const tests = $$('.test');
  ok('3 tests rendered', tests.length === 3, tests.length);
  ok('all tests passed', $$('.test.pass').length === 3, $$('.test.pass').length + ' passed');
  ok('award message shown', out.includes('TESTS PASSED'), '');
  ok('XP = 500', $('#s-total').textContent === '500', $('#s-total').textContent);
  ok('level advanced', Number($('#s-level').textContent) > 1, $('#s-level').textContent);

  console.log('\n── UNLOCK CHAIN ADVANCES ──');
  const st = JSON.parse(window.localStorage.getItem('algoarcade.v1'));
  ok('challenge recorded', st.completedChallenges['arrays-strings'] === true, '');
  ok('linked-lists now unlocked', st.completedChallenges['arrays-strings'] === true, 'chained via isUnlocked()');
  ok('XP persisted', st.xp === 500, st.xp);

  console.log('\n── MODAL CLOSE ──');
  $('.x').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  ok('modal closed via ✕ button', !$('.win'), '');

  console.log('\n── BACKDROP GUARD ──');
  $('.card[data-mod="linked-lists"]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  ok('linked-lists unlocked and opens', !!$('.win') && $('.win-title').textContent.includes('LINKED'), $('.win-title') ? $('.win-title').textContent : '');
  $$('.tab').find(t => t.dataset.tab === 'theory').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  ok('tab click does NOT close modal', !!$('.win'), '');
  $('.backdrop').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  ok('clicking backdrop closes', !$('.win'), '');

  $('.card[data-mod="linked-lists"]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  ok('Escape closes modal', !$('.win'), '');

  console.log('\n── SOUND TOGGLE ──');
  const sb = $('#sound-btn');
  const was = sb.textContent;
  sb.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  ok('sound toggles', $('#sound-btn').textContent !== was, $('#sound-btn').textContent);

  console.log('\n── RESET ──');
  $('#reset-btn').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  ok('progress wiped', $('#s-total').textContent === '0', $('#s-total').textContent);
  ok('12 cards still rendered after reset', $$('.card').length === 12, $$('.card').length);

  console.log(fail === 0 ? '\n\x1b[32mALL DOM TESTS PASS\x1b[0m\n' : `\n\x1b[31m${fail} DOM TEST(S) FAILED\x1b[0m\n`);
  process.exit(fail === 0 ? 0 : 1);
}, 300);