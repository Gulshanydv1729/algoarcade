/* Full progression test: clear all 12 challenges via the real UI,
   verifying the unlock chain, XP totals, and end-game state. */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const root = __dirname;
const dom = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), {
  runScripts: 'dangerously', url: 'https://localhost/', pretendToBeVisual: true
});
const { window } = dom;

// jsdom ships no crypto.subtle — inject Node's real WebCrypto implementation
const { webcrypto } = require('node:crypto');
Object.defineProperty(window, 'crypto', { value: webcrypto, configurable: true });
window.isSecureContext = true;
window.TextEncoder = TextEncoder;
window.TextDecoder = TextDecoder;

window.AudioContext = function () {
  return { state: 'running', currentTime: 0, destination: {}, resume() {}, suspend() {},
    createOscillator: () => ({ type: 'square', frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {} }),
    createGain: () => ({ gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }) };
};
window.HTMLElement.prototype.scrollIntoView = function () {};
window.confirm = () => true;
['curriculum.js', 'app.js'].forEach(f => {
  const e = window.document.createElement('script');
  e.textContent = fs.readFileSync(path.join(root, f), 'utf8');
  window.document.head.appendChild(e);
});

const doc = window.document;
const $ = (s) => doc.querySelector(s);
const $$ = (s) => Array.from(doc.querySelectorAll(s));
const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

let fail = 0;
const ok = (l, c, x) => { if (c) console.log('  \x1b[32mPASS\x1b[0m ' + l); else { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + l + (x ? '  -> ' + x : '')); } };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const IDS = ['arrays-strings', 'linked-lists', 'trees-graphs', 'dynamic-programming', 'sorting-searching', 'hash-tables',
  'cryptographic-hashing', 'symmetric-encryption', 'asymmetric-encryption', 'digital-signatures',
  'blockchain-architecture', 'zero-knowledge-proofs'];

(async () => {
  console.log('\n── PROGRESSION: clearing all 12 challenges via the UI ──');

  for (const id of IDS) {
    const card = $(`.card[data-mod="${id}"]`);
    if (!card || card.classList.contains('locked')) { ok(`${id} reachable`, false, 'card missing or locked'); break; }

    click(card);
    click($$('.tab').find(t => t.dataset.tab === 'playground'));

    // run every mode in this module
    const modeCount = $$('.mode').length || 1;
    for (let m = 0; m < modeCount; m++) {
      const modes = $$('.mode');
      if (modes[m]) click(modes[m]);
      $('#pg-run').click();
      await sleep(id === 'cryptographic-hashing' ? 2500 : 700);
    }

    const passed = $$('.test.pass').length;
    const total = $$('.test').length;
    const cleared = passed === total && total > 0;
    if (!cleared) {
      ok(`${id} cleared`, false, `${passed}/${total} — ` + ($('#pg-out').textContent.split('\n').slice(-2)[0] || ''));
    }
    // move to next module
    const x = $('.win .x'); if (x) click(x);
    await sleep(60);
  }

  const st = JSON.parse(window.localStorage.getItem('algoarcade.v1'));
  console.log('');
  ok('all 12 challenges completed', IDS.every(i => st.completedChallenges[i]), IDS.filter(i => !st.completedChallenges[i]).join(',') || 'none pending');
  ok('XP totals 11,150', st.xp === 11150, String(st.xp));
  ok('final level is 11', $('#s-level').textContent === '11', $('#s-level').textContent);
  ok('all cards marked done', $$('.card.done').length === 12, $$('.card.done').length);
  ok('no cards remain locked', $$('.card.locked').length === 0, $$('.card.locked').length);
  ok('mastery banner saved', st.allDone === true, String(st.allDone));
  // progress % counts lessons + challenge; only the challenge was cleared here
  const pcts = $$('.mprog span').filter(s => /% CLEARED/.test(s.textContent)).map(s => parseInt(s.textContent, 10));
  ok('all 12 cards show challenge-complete progress (25%+, 0 lessons marked)',
     pcts.length === 12 && pcts.every(p => p >= 25), pcts.join(','));

  console.log(fail === 0 ? '\n\x1b[32mFULL PROGRESSION PASS — 12/12 quests clearable\x1b[0m\n' : `\n\x1b[31m${fail} FAILED\x1b[0m\n`);
  process.exit(fail === 0 ? 0 : 1);
})();