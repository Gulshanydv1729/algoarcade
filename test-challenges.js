/* Headless harness: runs every ALGO implementation against its declared
   test suite (expect-based and check-based) from curriculum.js. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
const src = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

// pull the pure-logic sections out of the IIFE (no DOM needed)
function slice(startMarker, endMarker) {
  const a = src.indexOf(startMarker);
  const b = src.indexOf(endMarker, a);
  if (a < 0 || b < 0) throw new Error('marker not found: ' + startMarker);
  return src.slice(a, b);
}

const utils = `
  const esc = s => String(s);
  const hex = b => Array.from(b).map(x => x.toString(16).padStart(2,'0')).join('');
  const b64 = b => btoa(String.fromCharCode.apply(null, Array.from(b)));
  const clamp = (n,a,b) => Math.max(a, Math.min(b, n));
  const hasSubtle = () => typeof crypto !== 'undefined' && !!crypto.subtle && !!crypto.getRandomValues;
`;

const sha = slice('const K256 = new Uint32Array([', '/* ───────────────────────── tiny syntax');
const algo = slice('const ALGO = {', '/* ───────────────────────── CHECKS');
const checks = slice('const CHECKS = {', '/* ───────────────────────── STATE');

const code = utils + sha + algo + checks +
  '\nmodule.exports = { ALGO, CHECKS, sha256hex };';

const sandbox = { module: { exports: {} }, exports: {}, console,
  crypto: globalThis.crypto, btoa: globalThis.btoa, atob: globalThis.atob,
  TextEncoder, TextDecoder, Uint8Array, Uint32Array, DataView,
  setTimeout: globalThis.setTimeout,
  Math, Number, JSON, Array, Object, Date };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const { ALGO, CHECKS, sha256hex } = sandbox.module.exports;

// load curriculum
const curriculumSrc = fs.readFileSync(path.join(root, 'curriculum.js'), 'utf8');
vm.runInContext(curriculumSrc + '\n;globalThis.CURRICULUM = CURRICULUM;', sandbox);
const CURRICULUM = sandbox.CURRICULUM;

const norm = (v) => Array.isArray(v) ? v.join(',') : String(v).trim();

(async () => {
  let total = 0, passed = 0, mods = 0, subtests = 0;
  const failures = [];
  const t0 = Date.now();

  for (const [id, mod] of Object.entries(CURRICULUM)) {
    mods++;
    for (const mode of mod.challenge.modes) {
      const impl = ALGO[id] && ALGO[id][mode.id];
      if (typeof impl !== 'function') { failures.push(`${id}/${mode.id}: NO IMPLEMENTATION`); continue; }
      for (const t of mode.tests) {
        subtests++;
        let out, err = null;
        try { out = await impl(t.input); }
        catch (e) { failures.push(`${id}/${mode.id} :: "${t.label}" THREW: ${e.message}`); continue; }
        const text = typeof out === 'string' ? out : JSON.stringify(out);
        let ok, note;
        if (t.check) {
          const fn = (CHECKS[`${id}|${mode.id}`] || {})[t.check];
          if (typeof fn !== 'function') { failures.push(`${id}/${mode.id}: MISSING CHECKER ${t.check}`); continue; }
          ok = !!fn(t.input, text, out); note = t.check + '()';
        } else {
          ok = norm(out) === norm(t.expect);
          note = `got ${JSON.stringify(norm(out))} want ${JSON.stringify(norm(t.expect))}`;
        }
        total++;
        if (ok) passed++;
        else failures.push(`${id}/${mode.id} :: "${t.label}" (input=${JSON.stringify(t.input)}) — ${note}`);
      }
    }
  }

  console.log(`\nmodules=${mods}  subtests=${subtests}  total=${total}  passed=${passed}  failed=${total - passed}  (${Date.now() - t0}ms)\n`);
  if (failures.length) { failures.forEach(f => console.log('  FAIL ' + f)); process.exit(1); }
  console.log('ALL CHALLENGE TESTS PASS\n');
})();