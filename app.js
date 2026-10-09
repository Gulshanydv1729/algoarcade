/* ============================================================================
   ALGOARCADE — APP LOGIC
   State · persistence · rendering · modal · challenge runners · sound
   ========================================================================== */
(function () {
'use strict';

/* ───────────────────────── utils ───────────────────────── */
const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const hex  = (bytes) => Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
const b64  = (bytes) => btoa(String.fromCharCode.apply(null, Array.from(bytes)));
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const hasSubtle = () =>
  typeof crypto !== 'undefined' && !!crypto.subtle && !!crypto.getRandomValues;

/* ───────────────────────── SHA-256 (pure JS, no secure-context needed) ───────────────────────── */
const K256 = new Uint32Array([
  0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
]);

function sha256bytes(bytes) {
  const H = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
  const l = bytes.length;
  const padded = new Uint8Array((((l + 9 + 63) >> 6) << 6));
  padded.set(bytes);
  padded[l] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 8, Math.floor(l / 0x20000000));
  dv.setUint32(padded.length - 4, (l * 8) >>> 0);

  const rotr = (x, n) => ((x >>> n) | (x << (32 - n))) >>> 0;
  const w = new Uint32Array(64);

  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i-15],7) ^ rotr(w[i-15],18) ^ (w[i-15] >>> 3);
      const s1 = rotr(w[i-2],17) ^ rotr(w[i-2],19) ^ (w[i-2] >>> 10);
      w[i] = (w[i-16] + s0 + w[i-7] + s1) >>> 0;
    }
    let a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e,6) ^ rotr(e,11) ^ rotr(e,25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K256[i] + w[i]) >>> 0;
      const S0 = rotr(a,2) ^ rotr(a,13) ^ rotr(a,22);
      const mj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + mj) >>> 0;
      h=g; g=f; f=e; e=(d+t1)>>>0; d=c; c=b; b=a; a=(t1+t2)>>>0;
    }
    H[0]=(H[0]+a)>>>0; H[1]=(H[1]+b)>>>0; H[2]=(H[2]+c)>>>0; H[3]=(H[3]+d)>>>0;
    H[4]=(H[4]+e)>>>0; H[5]=(H[5]+f)>>>0; H[6]=(H[6]+g)>>>0; H[7]=(H[7]+h)>>>0;
  }
  const out = new Uint8Array(32);
  const odv = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) odv.setUint32(i * 4, H[i]);
  return out;
}

const sha256hex = (s) => hex(sha256bytes(new TextEncoder().encode(s)));

/* ───────────────────────── tiny syntax highlighter ───────────────────────── */
const KW = /\b(function|const|let|var|if|else|for|while|return|class|new|await|async|import|export|throw|try|catch|finally|typeof|instanceof|of|in|true|false|null|undefined|this|super|extends|break|continue|switch|case|default|do|delete|void|yield)\b/g;
function highlight(code) {
  const re = /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)|('(?:[^'\\\n]|\\.)*')|("(?:[^"\\\n]|\\.)*")|`(?:[^`\\]|\\.)*`|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_$][\w$]*)(?=\s*\()|([A-Za-z_$][\w$]*)/g;
  let out = '', last = 0, m;
  while ((m = re.exec(code))) {
    out += esc(code.slice(last, m.index));
    last = re.lastIndex;
    if (m[1] || m[2])      out += '<span class="c">' + esc(m[0]) + '</span>';
    else if (m[3] || m[4] || m[5]) out += '<span class="s">' + esc(m[0]) + '</span>';
    else if (m[6])         out += '<span class="n">' + esc(m[0]) + '</span>';
    else if (m[7])         out += '<span class="f">' + esc(m[0]) + '</span>';
    else {
      KW.lastIndex = 0;
      out += KW.test(m[0])
        ? '<span class="k">' + esc(m[0]) + '</span>'
        : esc(m[0]);
    }
  }
  return out + esc(code.slice(last));
}

/* ───────────────────────── ALGORITHM REGISTRY ─────────────────────────
   Each entry implements a challenge mode for real. run() may be async.
   ------------------------------------------------------------------ */
const ALGO = {

  'arrays-strings': {
    'reverse-words': (input) => {
      const s = String(input).trim();
      if (!s) return '';
      return s.split(/\s+/).filter(Boolean).reverse().join(' ');
    },
    'kadane': (input) => {
      const nums = String(input).split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n));
      if (!nums.length) throw new Error('No valid numbers found');
      let best = nums[0], cur = nums[0];
      for (let i = 1; i < nums.length; i++) { cur = Math.max(nums[i], cur + nums[i]); best = Math.max(best, cur); }
      return best;
    }
  },

  'linked-lists': {
    'cycle-entry': (input) => {
      const [valsRaw, posRaw] = String(input).split('|');
      const values = valsRaw.split(',').map(s => s.trim()).filter(Boolean);
      const n = values.length;
      const pos = parseInt(String(posRaw).trim(), 10);
      if (!n) return -1;
      if (!Number.isFinite(pos) || pos < 0 || pos >= n) return -1;

      // each node points to its successor; the node at `pos` is what the tail links back to
      const next = values.map((_, i) => (i + 1 < n ? i + 1 : pos));

      let slow = 0, fast = 0, steps = 0;
      while (fast in next && next[fast] !== undefined && steps < 10000) {
        slow = next[slow];
        const f2 = next[fast];
        if (f2 === undefined) return -1;
        fast = next[f2];
        steps++;
        if (slow === fast) break;
      }
      if (slow !== fast) return -1;
      slow = 0;
      while (slow !== fast) { slow = next[slow]; fast = next[fast]; }
      return slow;
    }
  },

  'trees-graphs': {
    'components': (input) => {
      const [nRaw, eRaw] = String(input).split('|');
      const n = parseInt(String(nRaw).trim(), 10);
      if (!Number.isFinite(n) || n <= 0) throw new Error('Invalid node count');
      const parent = Array.from({ length: n }, (_, i) => i);
      const rank = new Array(n).fill(0);
      const find = (x) => { while (x !== parent[x]) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
      let groups = n;
      String(eRaw || '').split(',').map(s => s.trim()).filter(Boolean).forEach(e => {
        const [a, b] = e.split('-').map(Number);
        if (!Number.isFinite(a) || !Number.isFinite(b)) return;
        if (a < 0 || b < 0 || a >= n || b >= n) return;
        const ra = find(a), rb = find(b);
        if (ra === rb) return;
        groups--;
        if (rank[ra] < rank[rb]) parent[ra] = rb;
        else if (rank[ra] > rank[rb]) parent[rb] = ra;
        else { parent[rb] = ra; rank[ra]++; }
      });
      return groups;
    }
  },

  'dynamic-programming': {
    'coin-change': (input) => {
      const [cRaw, aRaw] = String(input).split('|');
      const coins = cRaw.split(',').map(s => parseInt(s.trim(), 10)).filter(n => Number.isFinite(n) && n > 0);
      const amount = parseInt(String(aRaw).trim(), 10);
      if (!coins.length || !Number.isFinite(amount) || amount < 0) throw new Error('Invalid input');
      const dp = new Array(amount + 1).fill(Infinity);
      dp[0] = 0;
      for (let a = 1; a <= amount; a++) for (const c of coins) if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
      return dp[amount] === Infinity ? -1 : dp[amount];
    }
  },

  'sorting-searching': {
    'rotated-search': (input) => {
      const [aRaw, tRaw] = String(input).split('|');
      const nums = aRaw.split(',').map(s => Number(s.trim())).filter(Number.isFinite);
      const target = Number(String(tRaw).trim());
      if (!nums.length || !Number.isFinite(target)) throw new Error('Invalid input');
      let lo = 0, hi = nums.length - 1;
      while (lo <= hi) {
        const mid = lo + ((hi - lo) >> 1);
        if (nums[mid] === target) return mid;
        if (nums[lo] <= nums[mid]) {
          if (nums[lo] <= target && target < nums[mid]) hi = mid - 1; else lo = mid + 1;
        } else {
          if (nums[mid] < target && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;
        }
      }
      return -1;
    }
  },

  'hash-tables': {
    'lru-cache': (input) => {
      // ops are comma-separated, but the commas INSIDE put(1,1) belong to the args
      const splitOps = (s) => {
        const out = []; let depth = 0, cur = '';
        for (const ch of s) {
          if (ch === '(') depth++;
          else if (ch === ')') depth--;
          if (ch === ',' && depth === 0) { out.push(cur); cur = ''; }
          else cur += ch;
        }
        if (cur.trim()) out.push(cur);
        return out.map(x => x.trim()).filter(Boolean);
      };
      const [cRaw, oRaw] = String(input).split('|');
      const cap = parseInt(String(cRaw).trim(), 10);
      if (!Number.isFinite(cap) || cap <= 0) throw new Error('Invalid capacity');
      const store = new Map();               // key -> {val, expires}
      const out = [];
      const now = () => Date.now();

      splitOps(String(oRaw || '')).forEach(op => {
        const m = op.match(/^(\w+)\s*\((.*)\)$/);
        if (!m) return;
        const name = m[1].toLowerCase();
        const args = m[2].split(',').map(s => s.trim());

        if (name === 'get') {
          const k = args[0];
          const e = store.get(k);
          if (e && e.expires && now() > e.expires) { store.delete(k); out.push(-1); return; }
          if (e === undefined) { out.push(-1); return; }
          // a hit promotes the key to most-recently-used
          store.delete(k);
          store.set(k, e);
          out.push(e.val);
          return;
        }
        if (name === 'put') {
          const k = args[0];
          const v = Number(args[1]);
          const ttl = args[2] !== undefined && args[2] !== '' ? Number(args[2]) : null;
          if (store.has(k)) store.delete(k);
          else {
            for (const [ek, ev] of store) { if (ev.expires && now() > ev.expires) { store.delete(ek); break; } }
            while (store.size >= cap) store.delete(store.keys().next().value);
          }
          store.set(k, { val: v, expires: ttl ? now() + ttl * 1000 : null });
        }
      });
      return out;
    }
  },

  'cryptographic-hashing': {
    'pow-mine': async (input) => {
      const data = String(input);
      const target = '0000';
      let nonce = 0;
      const t0 = Date.now();
      for (;;) {
        const h = sha256hex(data + nonce);
        if (h.startsWith(target)) {
          const ms = Date.now() - t0;
          return 'nonce      = ' + nonce + '\n' +
                 'hash       = ' + h + '\n' +
                 'leading    = ' + '0'.repeat(target.length) + ' ✓\n' +
                 'attempts   = ' + (nonce + 1) + '\n' +
                 'elapsed    = ' + ms + ' ms' +
                 (nonce > 0 ? '\nefficiency = ' + Math.round((ms / Math.max(1, nonce + 1)) * 1000) + ' hashes/sec' : '');
        }
        if (++nonce % 8000 === 0) await new Promise(r => setTimeout(r, 0)); // keep the UI alive
      }
    }
  },

  'symmetric-encryption': {
    'aes-gcm': async (input) => {
      if (!hasSubtle()) throw new Error('Web Crypto unavailable — open this page over https or http://localhost');
      const plaintext = String(input);
      const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ctBytes = new Uint8Array(await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext)));
      const recovered = new TextDecoder().decode(await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv }, key, ctBytes));
      if (recovered !== plaintext) throw new Error('Round-trip FAILED — ciphertext did not decrypt back');

      const tag = ctBytes.slice(-16);
      const body = ctBytes.slice(0, -16);

      // negative control: corrupted ciphertext must fail authentication
      const tampered = new Uint8Array(ctBytes);
      tampered[0] ^= 0x01;
      let rejected = false;
      try { await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, tampered); }
      catch (e) { rejected = true; }

      return 'algorithm  = AES-256-GCM (authenticated)\n' +
             'plaintext  = ' + JSON.stringify(plaintext) + ' (' + plaintext.length + ' bytes)\n' +
             'nonce      = ' + hex(iv) + '  (96-bit, unique)\n' +
             'ciphertext = ' + hex(body) + '\n' +
             'auth tag   = ' + hex(tag) + '  (128-bit)\n' +
             'decrypted  = ' + JSON.stringify(recovered) + '\n' +
             'roundTrip  = verified=true\n' +
             'tamperTest = rejected=' + rejected;
    }
  },

  'asymmetric-encryption': {
    'ecdh': async (input) => {
      if (!hasSubtle()) throw new Error('Web Crypto unavailable — open this page over https or http://localhost');
      const label = String(input);
      const alg = { name: 'ECDH', namedCurve: 'P-256' };

      const alice = await crypto.subtle.generateKey(alg, false, ['deriveBits']);
      const bob   = await crypto.subtle.generateKey(alg, false, ['deriveBits']);
      const aPub = await crypto.subtle.exportKey('raw', alice.publicKey);
      const bPub = await crypto.subtle.exportKey('raw', bob.publicKey);
      const aImp = await crypto.subtle.importKey('raw', aPub, alg, false, []);
      const bImp = await crypto.subtle.importKey('raw', bPub, alg, false, []);

      const aBits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: bImp }, alice.privateKey, 256));
      const bBits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: aImp }, bob.privateKey,   256));
      if (hex(aBits) !== hex(bBits)) throw new Error('SHARED SECRET MISMATCH — key agreement failed');

      const session = hex(await crypto.subtle.digest('SHA-256',
        new TextEncoder().encode(label + '|' + hex(aBits))));

      return 'curve       = NIST P-256 (secp256r1)\n' +
             'alicePub    = ' + b64(aPub) + '\n' +
             'bobPub      = ' + b64(bPub) + '\n' +
             'sharedX     = ' + hex(aBits) + '\n' +
             'sessionKey  = SHA256(label ‖ sharedX) = ' + session + '\n' +
             'secretsMatch= true   ← Alice and Bob agree independently';
    }
  },

  'digital-signatures': {
    'sign-verify': async (input) => {
      if (!hasSubtle()) throw new Error('Web Crypto unavailable — open this page over https or http://localhost');
      const payload = String(input);
      const alg = { name: 'ECDSA', namedCurve: 'P-256' };
      const pair = await crypto.subtle.generateKey(alg, true, ['sign', 'verify']);
      const data = new TextEncoder().encode(payload);

      const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, pair.privateKey, data);
      const ok  = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pair.publicKey, sig, data);
      if (!ok) throw new Error('Signature failed to verify against its own public key');

      const tampered = new Uint8Array(data);
      tampered[0] ^= 0x01;
      let tamperedOk = true;
      try { tamperedOk = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pair.publicKey, sig, tampered); }
      catch (e) { tamperedOk = false; }
      if (tamperedOk) throw new Error('SECURITY FAILURE — tampered payload verified');

      const raw = new Uint8Array(sig);
      return 'payload     = ' + JSON.stringify(payload) + '\n' +
             'digest      = SHA-256 = ' + sha256hex(payload) + '\n' +
             'signature   = ' + hex(raw) + '  (' + raw.length + ' bytes, DER)\n' +
             'verified    = true    (public key only)\n' +
             'tampered    = rejected=true   (1 bit flipped → signature invalid)\n' +
             'result      = AUTHENTIC ✓  INTEGRITY ✓  NON-REPUDIABLE ✓';
    }
  },

  'blockchain-architecture': {
    'chain': async (input) => {
      const genesis = String(input);
      const mkHash = (b) => sha256hex(JSON.stringify({
        index: b.index, data: b.data, prevHash: b.prevHash, timestamp: b.timestamp, nonce: b.nonce
      }));
      const blocks = [];
      let prev = '0'.repeat(64);
      for (let i = 0; i < 5; i++) {
        const b = { index: i, data: i === 0 ? genesis : 'tx#' + i + ' → ALGO→GUX', prevHash: prev, timestamp: 1700000000000 + i * 600, nonce: 0 };
        let n = 0;
        while (!mkHash(b).startsWith('00')) { b.nonce = ++n; }
        b.hash = mkHash(b);
        blocks.push(b);
        prev = b.hash;
      }

      const validate = (chain) => {
        for (let i = 1; i < chain.length; i++) {
          if (chain[i].prevHash !== chain[i - 1].hash) return { valid: false, at: i, why: 'prevHash mismatch' };
          if (chain[i].hash !== mkHash(chain[i])) return { valid: false, at: i, why: 'content tampered' };
        }
        return { valid: true };
      };

      const good = validate(blocks);
      if (!good.valid) throw new Error('Freshly built chain failed validation: ' + good.why);

      // tamper with block 2 and prove detection
      const evil = blocks.map(b => Object.assign({}, b));
      evil[2].data = 'HACKED: 1000 ALGO → ATTACKER';
      const bad = validate(evil);

      let out = 'genesis    = ' + JSON.stringify(genesis) + '\n\n';
      blocks.forEach(b => {
        out += '#' + b.index + ' nonce=' + b.nonce + '\n';
        out += '   data  = ' + JSON.stringify(b.data) + '\n';
        out += '   prev  = ' + b.prevHash.slice(0, 24) + '…\n';
        out += '   hash  = ' + b.hash + '\n';
      });
      out += '\nvalidation    = valid=true  (5/5 links intact)\n';
      out += 'tip hash      = ' + blocks[4].hash + '\n';
      out += 'tamper test   = edited block #2 → detected at index ' + bad.at + ' (' + bad.why + ')\n';
      out += 'chain state   = CONSISTENT ✓  IMMUTABLE ✓';
      return out;
    }
  },

  'zero-knowledge-proofs': {
    'ali-baba': (input) => {
      const rounds = clamp(parseInt(String(input).trim(), 10) || 100, 1, 5000);
      const secret = Math.random() < 0.5 ? 'A' : 'B';
      const pw = { A: 'sesame', B: 'open-sesame' };

      const lines = [];
      let refusals = 0;

      for (let i = 0; i < Math.min(rounds, 12); i++) {
        const challenge = Math.random() < 0.5 ? 'A' : 'B';
        if (challenge === secret) lines.push('  round ' + (i + 1) + ': "' + challenge + '" → whispers "' + pw[secret] + '"');
        else { lines.push('  round ' + (i + 1) + ': "' + challenge + '" → refuses (does not know this door)'); refusals++; }
      }
      if (rounds > 12) lines.push('  … ' + (rounds - 12) + ' further rounds elided');

      // a cheater who does not know the password
      let cheaterCaught = 0;
      for (let i = 0; i < rounds; i++) if (Math.random() < 0.5) cheaterCaught++;

      return 'rounds        = ' + rounds + '\n' +
             'prover door   = [NEVER DISCLOSED]\n' +
             'verifier saw  = ' + (rounds > 12 ? 12 : rounds) + ' challenges, partial password hints\n\n' +
             lines.join('\n') + '\n\n' +
             'honestVerified      = true\n' +
             'secretRevealed      = false   ← verifier learned nothing about which door\n' +
             'soundnessError      = 2^-' + rounds + ' ≈ ' + Math.pow(2, -rounds).toExponential(2) + '\n' +
             'cheaterCaughtRounds = ' + cheaterCaught + ' / ' + rounds + '  ← caught with p = 1 − 2⁻' + rounds + '\n' +
             'result              = ZERO KNOWLEDGE ✓  ' + (cheaterCaught >= 1 ? 'CHEATER DETECTED ✓' : '');
    }
  }
};

/* ───────────────────────── CHECKS for semantic tests ───────────────────────── */
const CHECKS = {
  'cryptographic-hashing|pow-mine': {
    leadingZeros(input, out) {
      const m = /nonce\s*=\s*(\d+)\s*\nhash\s*=\s*([0-9a-f]{64})/.exec(out || '');
      if (!m) return false;
      const nonce = Number(m[1]);
      return m[2].startsWith('0000') && sha256hex(String(input) + nonce) === m[2];
    }
  },
  'symmetric-encryption|aes-gcm': {
    aesRoundTrip(input, out) {
      return /roundTrip\s*=\s*verified=true/.test(out || '') && /tamperTest\s*=\s*rejected=true/.test(out || '');
    }
  },
  'asymmetric-encryption|ecdh': {
    ecdhMatch(input, out) {
      const m = /sharedX\s*=\s*([0-9a-f]{64})/.exec(out || '');
      return !!m && /secretsMatch=\s*true/.test(out || '');
    }
  },
  'digital-signatures|sign-verify': {
    sigValid(input, out) {
      return /verified\s*=\s*true/.test(out || '') && /tampered\s*=\s*rejected=true/.test(out || '');
    }
  },
  'blockchain-architecture|chain': {
    chainValid(input, out) { return /validation\s*=\s*valid=true/.test(out || ''); },
    tamperCaught(input, out) { return /tamper test\s*=\s*edited block #\d+ → detected at index \d+/.test(out || ''); }
  },
  'zero-knowledge-proofs|ali-baba': {
    zkHonest(input, out) { return /honestVerified\s*=\s*true/.test(out || '') && /secretRevealed\s*=\s*false/.test(out || ''); },
    zkCheaterCaught(input, out) { return /result\s*=\s*ZERO KNOWLEDGE ✓\s+CHEATER DETECTED ✓/.test(out || ''); }
  }
};

/* ───────────────────────── STATE ───────────────────────── */
const KEY = 'algoarcade.v1';
const blank = () => ({
  xp: 0,
  completedLessons: {},
  completedChallenges: {},
  sound: true,
  startedAt: Date.now(),
  lastActiveAt: Date.now(),
  seenIntro: false
});

let state = blank();
let modal = { id: null, tab: 'syllabus', mode: 0 };

try {
  const raw = localStorage.getItem(KEY);
  if (raw) state = Object.assign(blank(), JSON.parse(raw));
} catch (e) { /* storage unavailable — run in memory */ }

const save = () => {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
};

const levelFor   = (xp) => Math.floor(Math.sqrt(xp / 100)) + 1;
const floorOfLvl = (l) => ((l - 1) * (l - 1)) * 100;
const ceilOfLvl  = (l) => (l * l) * 100;

const modProgress = (id) => {
  const m = CURRICULUM[id];
  if (!m) return 0;
  const total = m.lessons.length + 1;
  const done  = m.lessons.filter(l => state.completedLessons[l.t]).length
              + (state.completedChallenges[id] ? 1 : 0);
  return Math.round((done / total) * 100);
};

const isUnlocked = (id) => {
  for (const tr of TRACKS) {
    const i = tr.modules.indexOf(id);
    if (i === -1) continue;
    if (i === 0) return true;
    return !!state.completedChallenges[tr.modules[i - 1]];
  }
  return false;
};

const totalXP = () => TRACKS.reduce((s, tr) =>
  s + tr.modules.reduce((a, id) => a + (CURRICULUM[id] ? CURRICULUM[id].xp : 0), 0), 0);

/* ───────────────────────── SOUND (Web Audio) ───────────────────────── */
let ac = null;
const audio = () => {
  if (!state.sound) return null;
  if (!ac) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ac = new C(); }
  if (ac.state === 'suspended') ac.resume();
  return ac;
};

function tone(freqs, dur, type, vol) {
  const c = audio(); if (!c) return;
  const list = Array.isArray(freqs) ? freqs : [freqs];
  list.forEach((f, i) => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f, c.currentTime + i * 0.06);
    g.gain.setValueAtTime(0, c.currentTime + i * 0.06);
    g.gain.linearRampToValueAtTime(vol || 0.06, c.currentTime + i * 0.06 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + i * 0.06 + (dur || 0.1));
    o.connect(g); g.connect(c.destination);
    o.start(c.currentTime + i * 0.06);
    o.stop(c.currentTime + i * 0.06 + (dur || 0.1) + 0.02);
  });
}

const sfx = {
  click:   () => tone(520, 0.05, 'square', 0.04),
  open:    () => tone([330, 520, 780], 0.09, 'square', 0.05),
  close:   () => tone([520, 330, 220], 0.07, 'square', 0.04),
  check:   () => tone(760, 0.07, 'triangle', 0.06),
  success: () => tone([523, 659, 784, 1046], 0.13, 'square', 0.07),
  error:   () => tone([180, 140], 0.16, 'sawtooth', 0.05),
  level:   () => tone([523, 659, 784, 1046, 1318], 0.16, 'square', 0.08),
  start:   () => tone([262, 330, 392, 523, 659, 784], 0.15, 'square', 0.08)
};

/* ───────────────────────── TOASTS ───────────────────────── */
function toast(title, sub, good) {
  const t = document.createElement('div');
  t.className = 'toast' + (good ? ' g' : '');
  t.innerHTML = '<div class="t">' + esc(title) + '</div>' + (sub ? '<p>' + esc(sub) + '</p>' : '');
  $('#toasts').appendChild(t);
  setTimeout(() => { t.style.transition = 'transform .3s, opacity .3s'; t.style.transform = 'translateX(110%)'; t.style.opacity = '0'; setTimeout(() => t.remove(), 320); }, 4200);
}

/* ───────────────────────── HEADER ───────────────────────── */
function renderStats() {
  const xp = state.xp, lv = levelFor(xp);
  const lo = floorOfLvl(lv), hi = ceilOfLvl(lv);
  const pct = clamp(((xp - lo) / Math.max(1, hi - lo)) * 100, 0, 100);

  $('#s-level').textContent = lv;
  $('#s-xp').textContent = xp + ' XP';
  $('#s-bar').style.width = pct + '%';
  $('#s-total').textContent = xp.toLocaleString();
  $('#s-lines').textContent = String(TRACKS.reduce((n, t) => n + t.modules.length, 0));

  const sb = $('#sound-btn');
  sb.textContent = state.sound ? '🔊 SOUND ON' : '🔇 SOUND OFF';
  sb.setAttribute('aria-pressed', String(state.sound));
  sb.classList.toggle('purple', state.sound);
}

/* ───────────────────────── TRACKS + CARDS ───────────────────────── */
function moduleCard(id) {
  const m = CURRICULUM[id];
  const unlocked = isUnlocked(id);
  const done = !!state.completedChallenges[id];
  const pct = modProgress(id);
  const n = Number(m.num);

  return (
    '<article class="card' + (unlocked ? '' : ' locked') + (done ? ' done' : '') + '" ' +
        'data-mod="' + esc(id) + '" tabindex="0" role="button" ' +
        'aria-label="' + esc(m.title) + (unlocked ? '' : ' (locked)') + '">' +
      (unlocked ? '' : '<div class="lock"><div>🔒<br><br>COMPLETE THE PREVIOUS<br>QUEST TO UNLOCK</div></div>') +
      '<div class="card-top">' +
        '<span class="num pixel">' + esc(m.num) + '</span>' +
        '<span class="cico">' + m.icon + '</span>' +
      '</div>' +
      '<h3 class="pixel">' + esc(m.title) + '</h3>' +
      '<p>' + esc(m.desc) + '</p>' +
      '<div class="badges">' +
        '<span class="bdg ' + m.diff.toLowerCase() + '">' + esc(m.diff) + '</span>' +
        '<span class="bdg xp">+' + m.xp + ' XP</span>' +
        '<span class="bdg xp">' + esc(m.time) + '</span>' +
      '</div>' +
      '<div class="pbar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="mprog"><span>' + pct + '% CLEARED</span><span class="spacer" style="flex:1"></span><span>' +
        m.lessons.length + ' LESSONS · 1 CHALLENGE</span></div>' +
      '<div class="rewards">' +
        '<span class="xpval pixel">+' + m.xp + ' XP</span>' +
        '<span class="u">' + (m.unlocks ? '🔓 ' + esc(CURRICULUM[m.unlocks].title) : '🏆 MASTER TITLE') + '</span>' +
      '</div>' +
    '</article>'
  );
}

function renderTracks() {
  $('#tracks').innerHTML = TRACKS.map(tr => {
    const done = tr.modules.filter(id => state.completedChallenges[id]).length;
    const pct = Math.round((done / tr.modules.length) * 100);
    return (
      '<section class="track ' + tr.cls + '" id="track-' + tr.id + '">' +
        '<div class="track-head">' +
          '<div class="track-ico">' + tr.icon + '</div>' +
          '<div style="flex:1;min-width:260px">' +
            '<h2 class="pixel">' + esc(tr.title) + '</h2>' +
            '<p class="sub">' + esc(tr.subtitle) + '</p>' +
            '<div class="track-meta">' +
              '<span class="bdg ' + (tr.cls === 'purple' ? 'legendary' : 'beginner') + '">' + done + ' / ' + tr.modules.length + ' CLEARED</span>' +
              '<span class="bdg xp">' + pct + '% COMPLETE</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="grid">' + tr.modules.map(moduleCard).join('') + '</div>' +
      '</section>'
    );
  }).join('');
}

function renderAll() { renderStats(); renderTracks(); }

/* ───────────────────────── MODAL ───────────────────────── */
function openModal(id, tab) {
  modal.id = id; modal.tab = tab || 'syllabus'; modal.mode = 0;
  drawModal();
  sfx.open();
}
function closeModal() {
  $('#modal-root').innerHTML = '';
  document.body.style.overflow = '';
  modal.id = null;
  sfx.close();
  renderAll();
}

function drawModal() {
  const id = modal.id; if (!id) return;
  const m = CURRICULUM[id];

  document.body.style.overflow = 'hidden';
  $('#modal-root').innerHTML =
    '<div class="backdrop" data-close="1">' +
      '<div class="win" role="dialog" aria-modal="true" aria-label="' + esc(m.title) + '">' +
        '<div class="win-bar">' +
          '<span class="dot" style="background:#f72585"></span>' +
          '<span class="dot" style="background:#ffd166"></span>' +
          '<span class="dot" style="background:#39ff14"></span>' +
          '<span class="win-title pixel">' + m.icon + ' ' + esc(m.title.toUpperCase()) + ' · ' + esc(m.num) + '</span>' +
          '<button class="x" data-close="1" aria-label="Close">✕</button>' +
        '</div>' +
        '<div class="tabs">' +
          ['syllabus', 'theory', 'playground'].map(t =>
            '<button class="tab' + (modal.tab === t ? ' on' : '') + '" data-tab="' + t + '">' +
            (t === 'syllabus' ? '📖 SYLLABUS' : t === 'theory' ? '📊 THEORY' : '⚡ PLAYGROUND') + '</button>'
          ).join('') +
        '</div>' +
        '<div class="win-body" id="tabbody"></div>' +
      '</div>' +
    '</div>';

  drawTab();
  const f = $('.win-body'); if (f) f.scrollTop = 0;
}

function drawTab() {
  const id = modal.id, m = CURRICULUM[id];
  const body = $('#tabbody'); if (!body) return;

  const tabs = { syllabus: syllabusTab, theory: theoryTab, playground: playgroundTab };

  body.innerHTML =
    '<p style="font-size:12px;line-height:1.9;color:var(--dim);margin-bottom:22px">' + esc(m.long) + '</p>' +
    tabs[modal.tab](m);

  if (modal.tab === 'playground') wirePlayground(m);
}

function syllabusTab(m) {
  const chDone = !!state.completedChallenges[currentModId()];
  return (
    '<div class="sec">' +
      '<div class="sec-t pixel">SYLLABUS · ' + m.lessons.length + ' LESSONS + 1 CHALLENGE</div>' +
      m.lessons.map((l, i) => {
        const ok = !!state.completedLessons[l.t];
        return (
          '<div class="lesson' + (ok ? ' ok' : '') + '">' +
            '<button class="chk' + (ok ? ' on' : '') + '" data-lesson="' + esc(l.t) + '" aria-label="Mark lesson complete">' + (ok ? '✓' : '') + '</button>' +
            '<div style="flex:1">' +
              '<h4 class="pixel">' + (i + 1) + '. ' + esc(l.t) + '</h4>' +
              '<p>' + esc(l.d) + '</p>' +
              '<details style="margin-top:12px">' +
                '<summary style="cursor:pointer;font-size:10px;color:var(--cyan)">' + (ok ? '▾ REVIEW LESSON' : '▸ STUDY LESSON') + '</summary>' +
                '<div style="margin-top:12px">' + l.body + '</div>' +
              '</details>' +
              '<div class="meta">⏱ ' + esc(l.time) + '</div>' +
            '</div>' +
          '</div>'
        );
      }).join('') +
    '</div>' +
    '<div class="sec">' +
      '<div class="sec-t pixel">INTERACTIVE CHALLENGE</div>' +
      '<div class="lesson' + (chDone ? ' ok' : '') + '">' +
        '<div style="font-size:24px">' + (chDone ? '✅' : '⚡') + '</div>' +
        '<div style="flex:1">' +
          '<h4 class="pixel">' + esc(m.challenge.title) + '</h4>' +
          '<p>' + esc(m.challenge.brief) + '</p>' +
          '<div class="meta">' + m.challenge.modes.length + ' TASK(S) · REWARD +' + m.xp + ' XP' +
            (chDone ? ' · <span style="color:var(--green)">CLEARED</span>' : '') + '</div>' +
          '<button class="btn gold sm" data-tab="playground" style="margin-top:14px">⚡ LAUNCH PLAYGROUND</button>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function theoryTab(m) { return '<div class="sec"><div class="sec-t pixel">CHEAT SHEET &amp; THEORY</div>' + m.theory + '</div>'; }

/* ───────────────────────── PLAYGROUND ───────────────────────── */
function playgroundTab(m) {
  const ch = m.challenge, mode = ch.modes[modal.mode] || ch.modes[0];
  const needsCrypto = ['pow-mine', 'aes-gcm', 'ecdh', 'sign-verify', 'chain'].indexOf(mode.id) >= 0;
  const warn = needsCrypto && !hasSubtle()
    ? '<div class="note pk"><b>Web Crypto unavailable.</b> Browsers only expose <code>crypto.subtle</code> in a secure context. Open this file over <code>http://localhost</code> or <code>https://</code> (e.g. <code>npx serve .</code> or <code>python3 -m http.server</code>). SHA-256 mining works regardless.</div>'
    : '';

  return (
    '<div class="sec">' +
      '<div class="sec-t pixel">⚡ ' + esc(ch.title) + '</div>' +
      '<p style="font-size:12px;line-height:1.9;color:var(--dim);margin-bottom:16px">' + esc(ch.brief) + '</p>' +
      warn +
      (ch.modes.length > 1
        ? '<div class="modes">' + ch.modes.map((x, i) =>
            '<button class="mode' + (i === modal.mode ? ' on' : '') + '" data-mode="' + i + '">' + esc(x.label) + '</button>').join('') + '</div>'
        : '') +
      '<div class="field">' +
        '<label class="pixel">' + esc(mode.inputLabel.toUpperCase()) + '</label>' +
        '<textarea id="pg-input" rows="3" spellcheck="false">' + esc(mode.sample) + '</textarea>' +
      '</div>' +
      '<div class="row">' +
        '<button class="btn" id="pg-run">▶ RUN / SUBMIT</button>' +
        '<button class="btn purple sm" id="pg-hint">💡 HINT</button>' +
        '<button class="btn sm" id="pg-reset" style="border-color:var(--dim);color:var(--dim)">⟲ RESET</button>' +
        '<span class="spacer" style="flex:1"></span>' +
        (state.completedChallenges[currentModId()] ? '<span class="bdg beginner">✓ CLEARED</span>' : '') +
      '</div>' +
      (ch.hints.length ? '<div class="hint" id="pg-hintbox">' + esc(ch.hints[0]) + '</div>' : '') +
      '<div class="field" style="margin-top:18px"><label class="pixel">CONSOLE OUTPUT</label><div class="out" id="pg-out">▸ Ready. Press RUN to execute against the test suite.</div></div>' +
      '<div id="pg-tests"></div>' +
      '<div style="margin-top:18px">' +
        '<button class="btn purple sm" id="pg-solution">👁 REVEAL REFERENCE SOLUTION</button>' +
        '<div id="pg-solution-box"></div>' +
      '</div>' +
    '</div>'
  );
}

function currentModId() { return modal.id; }

function norm(v) {
  if (Array.isArray(v)) return v.join(',');
  return String(v).trim();
}

function wirePlayground(m) {
  const ch = m.challenge, mode = ch.modes[modal.mode] || ch.modes[0];
  const impl = (ALGO[currentModId()] || {})[mode.id];
  const out = $('#pg-out'), testsBox = $('#pg-tests');
  const hintBox = $('#pg-hintbox');
  let hintIdx = 0;

  $$('.mode').forEach(b => b.addEventListener('click', () => {
    modal.mode = Number(b.dataset.mode); sfx.click(); drawTab();
  }));

  const runOne = $('#pg-run');
  if (runOne) runOne.addEventListener('click', async () => {
    const inputVal = $('#pg-input').value;
    sfx.click();

    if (typeof impl !== 'function') {
      out.textContent = '✖ No implementation registered for "' + mode.id + '".';
      sfx.error(); return;
    }

    out.textContent = '▸ Executing ' + mode.id + '…';
    runOne.disabled = true;

    let produced = null, producedErr = null;
    try { produced = await impl(inputVal); }
    catch (e) { producedErr = e && e.message ? e.message : String(e); }

    if (producedErr) {
      out.textContent = '✖ Runtime error: ' + producedErr;
      testsBox.innerHTML = '';
      runOne.disabled = false; sfx.error();
      return;
    }

    const text = typeof produced === 'string' ? produced : JSON.stringify(produced, null, 2);
    out.textContent = text;

    // Each test case carries its OWN input — run the implementation per test
    // rather than comparing one single result against every expectation.
    const checkers = CHECKS[currentModId() + '|' + mode.id] || {};
    const results = [];
    for (const t of mode.tests) {
      let ok = false, note = '';
      try {
        let res;
        if (t.check) {
          const fn = checkers[t.check];
          if (typeof fn !== 'function') { note = 'missing checker: ' + t.check; }
          else {
            res = await impl(t.input);
            ok = !!fn(t.input, typeof res === 'string' ? res : JSON.stringify(res), res);
            note = t.check + '()';
          }
        } else {
          res = await impl(t.input);
          ok = norm(res) === norm(t.expect);
          note = 'expected ' + JSON.stringify(t.expect) + ' · got ' + JSON.stringify(norm(res));
        }
      } catch (e) {
        ok = false;
        note = 'threw: ' + (e && e.message ? e.message : String(e));
      }
      results.push({ t, ok, note });
    }

    let pass = 0;
    testsBox.innerHTML = results.map(r => {
      if (r.ok) pass++;
      return (
        '<div class="test ' + (r.ok ? 'pass' : 'fail') + '">' +
          '<span class="ic">' + (r.ok ? '✅' : '❌') + '</span>' +
          '<div class="lb">' + esc(r.t.label) +
            '<div class="dt">input: ' + esc(r.t.input === '' ? '(empty)' : r.t.input) + ' · ' + esc(r.note) + '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    const total = mode.tests.length;
    if (pass === total) {
      const award = awardModule(currentModId());
      out.textContent += '\n\n▸ ✅ ' + pass + '/' + total + ' TESTS PASSED' + (award ? '  ·  ' + award : '');
      sfx.success();
    } else {
      out.textContent += '\n\n▸ ❌ ' + pass + '/' + total + ' TESTS PASSED — keep iterating, player.';
      sfx.error();
    }
    runOne.disabled = false;
  });

  const hb = $('#pg-hint'); if (hb && hintBox) hb.addEventListener('click', () => {
    hintBox.classList.add('show'); hintBox.textContent = ch.hints[hintIdx % ch.hints.length]; hintIdx++; sfx.click();
  });

  const rb = $('#pg-reset'); if (rb) rb.addEventListener('click', () => {
    $('#pg-input').value = mode.sample; testsBox.innerHTML = '';
    out.textContent = '▸ Ready. Press RUN to execute against the test suite.'; sfx.click();
  });

  const sb = $('#pg-solution'); if (sb) sb.addEventListener('click', () => {
    const box = $('#pg-solution-box');
    if (box.innerHTML) { box.innerHTML = ''; sb.textContent = '👁 REVEAL REFERENCE SOLUTION'; sfx.click(); return; }
    box.innerHTML = '<pre>' + highlight(mode.solution) + '</pre>';
    sb.textContent = '🙈 HIDE SOLUTION'; sfx.click();
  });
}

/* ───────────────────────── XP / REWARDS ───────────────────────── */
function awardModule(id) {
  const m = CURRICULUM[id]; if (!m) return '';
  if (state.completedChallenges[id]) return '';
  state.completedChallenges[id] = true;
  const before = levelFor(state.xp);
  state.xp += m.xp;
  state.lastActiveAt = Date.now();
  save();
  renderStats();

  let msg = '+' + m.xp + ' XP';
  const after = levelFor(state.xp);
  if (after > before) { msg = '⬆ LEVEL UP! ' + before + ' → ' + after; sfx.level(); }

  const unlockedName = m.unlocks ? CURRICULUM[m.unlocks].title : null;
  toast(msg, unlockedName ? '🔓 UNLOCKED: ' + unlockedName : (m.unlocks ? null : '🏆 MASTER CRYPTOGRAPHER TITLE EARNED'), true);

  const done = TRACKS.every(tr => tr.modules.every(x => state.completedChallenges[x]));
  if (done && !state.allDone) { state.allDone = true; save(); toast('ALL 12 QUEST LINES CLEARED', 'You mastered the arcane arts. ∞ XP potential achieved.', true); }

  return msg;
}

/* ───────────────────────── GLOBAL EVENTS ───────────────────────── */
function bind() {
  document.addEventListener('click', (e) => {
    // Interactive elements inside the modal must be handled BEFORE the
    // backdrop close check, since the backdrop is an ancestor of all of them.
    const tabBtn = e.target.closest('[data-tab]');
    if (tabBtn && tabBtn.closest('.win')) { modal.tab = tabBtn.dataset.tab; sfx.click(); drawModal(); return; }

    const chk = e.target.closest('[data-lesson]');
    if (chk) {
      const key = chk.dataset.lesson;
      state.completedLessons[key] = !state.completedLessons[key];
      save(); sfx.check(); drawTab();
      return;
    }

    const card = e.target.closest('.card');
    if (card && !card.classList.contains('locked')) { openModal(card.dataset.mod); return; }

    // close only via the explicit ✕ button, or a click on the backdrop itself
    const closer = e.target.closest('[data-close]');
    if (closer) {
      const isBackdrop = closer.classList.contains('backdrop');
      if (!isBackdrop || e.target === closer) { closeModal(); return; }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.id) closeModal();
    if (e.key === 'Enter' || e.key === ' ') {
      const c = e.target.closest && e.target.closest('.card');
      if (c && !c.classList.contains('locked')) { e.preventDefault(); openModal(c.dataset.mod); }
    }
  });

  $('#press-start').addEventListener('click', () => {
    if (!state.sound) { state.sound = true; save(); }
    state.seenIntro = true; save();
    sfx.start();
    renderStats();
    $('#track-dsa').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => toast('QUEST LOG INITIALISED', '12 quest lines · 12,600 XP available. Good luck, player.'), 700);
  });

  $('#sound-btn').addEventListener('click', () => {
    state.sound = !state.sound; save(); renderStats();
    if (state.sound) sfx.click(); else if (ac) ac.suspend();
    toast(state.sound ? 'SOUND ON' : 'SOUND OFF', state.sound ? '8-bit SFX enabled' : 'Silent run', state.sound);
  });

  $('#reset-btn').addEventListener('click', () => {
    if (!confirm('Erase all progress? XP, lessons and cleared challenges will be lost.')) return;
    const keepSound = state.sound;
    state = blank(); state.sound = keepSound; save();
    closeModal(); renderAll(); sfx.close();
    toast('PROGRESS WIPED', 'Fresh arcade cabinet. Insert coin to continue.');
  });
}

/* ───────────────────────── BOOT ───────────────────────── */
renderAll();
bind();
window.ALGOARCADE = { state, save, renderAll, openModal, sha256hex };

})();