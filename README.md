# 🎮 ALGOARCADE

**Master the Arcane Arts of Data Structures & Cryptographic Architecture**

A retro-arcade / cyberpunk-terminal themed, gamified learning hub for CS and
Cryptography. 12 quest lines across 2 tracks, XP + levels, unlockable modules,
real in-browser challenges, and local progress persistence.

---

## 🚀 Run it

The MVP is a **static site** — no build step, no `npm install`, no backend.

```bash
# simplest: just open the file
open index.html          # macOS
xdg-open index.html      # Linux
start index.html         # Windows
```

**Recommended — serve over `localhost`.** Browsers only expose the Web Crypto API
(`crypto.subtle`) in a *secure context*, and `file://` does not qualify. The
AES-GCM, ECDH and ECDSA challenges need it. Everything else works either way.

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

---

## 🗺️ What's inside

| Track | Quest lines |
|---|---|
| 🏛 **Data Structures & Algorithms** | Arrays & Strings · Linked Lists · Trees & Graphs · Dynamic Programming · Sorting & Searching · Hash Tables |
| 🔐 **Cryptographic Architecture** | Cryptographic Hashing · Symmetric Encryption · Asymmetric Encryption · Digital Signatures · Blockchain Architecture · Zero-Knowledge Proofs |

Every module opens a retro modal with three tabs:

1. **📖 Syllabus** — lessons with progress checkboxes + full written content
2. **📊 Theory** — cheat sheets, complexity tables, code walkthroughs
3. **⚡ Playground** — runnable challenges with an instant test suite, hints, and a reference solution

**11,150 XP** total across the 12 modules. Clearing a challenge awards XP and
unlocks the next quest line in that track. Progress (XP, levels, checked lessons,
cleared challenges, sound preference) persists to `localStorage`.

---

## 🧪 The challenges are real

These aren't toy assertions — they run actual implementations in your browser:

- **Proof-of-Work miner** — real SHA-256, ~65k hashes, mines a block with 4 leading zeros
- **AES-256-GCM** — genuine Web Crypto encrypt/decrypt + tamper-rejection test
- **ECDH P-256** — real key agreement; both sides derive the same shared secret
- **ECDSA sign & verify** — real signature, verified with the public key; tampered payload is rejected
- **5-block chain** — real SHA-256 chain with link validation + tamper detection
- **Ali Baba's Cave** — interactive ZK simulation with soundness maths
- Plus classic DSA: Kadane, two-pointer, Floyd's cycle detection, coin-change DP, rotated binary search, an O(1) LRU cache…

SHA-256 is implemented from scratch in `app.js` (so mining and chaining work even
without Web Crypto), and verified against Node's `crypto` including padding edge cases.

---

## 🕹️ Controls

- **▶ PRESS START** — enable sound + jump to the quest log
- **🔊 SOUND** — toggle 8-bit SFX (Web Audio, no audio files)
- **⟲ RESET** — wipe local progress
- Click any **unlocked** card to open its module (locked ones unlock as you progress)
- `Esc` closes the modal · `Enter`/`Space` activates a focused card
- Fully responsive: mobile, tablet, desktop

---

## 🧷 Files

```
index.html      markup + full retro CSS (CRT scanlines, neon glow, pixel borders)
curriculum.js   all 12 modules: lessons, theory, challenge specs + test cases
app.js          SHA-256, challenge implementations, state, rendering, modal, sound
```

## 🧪 Run the tests

Requires Node (only for the test harness; the app itself needs nothing).

```bash
npm install --no-save jsdom

node test-challenges.js    # every algorithm vs its declared test suite
node test-dom.js           # render, modal, tabs, lesson toggles, XP, persistence
node test-progression.js   # clear all 12 challenges end-to-end via the UI
```

---

*No servers. No tracking. Everything stays in your browser.*