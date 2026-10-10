# 🎮 ALGOARCADE

**Master the Arcane Arts of Data Structures & Cryptographic Architecture**

A retro-arcade / cyberpunk-terminal themed, gamified learning hub for CS and
Cryptography. 12 quest lines across 2 tracks, XP + levels, unlockable modules,
real in-browser challenges, and local progress persistence — plus four arcade
modes and a trophy cabinet.

## 🆕 What's new in 2.0

The top nav switches between five views (hash routing, no page reloads):

| Mode | What you do |
|---|---|
| 🏠 **Arcade** (home) | Quest lines as before, plus a live merge-sort preview, feature hub, and progress snapshot |
| ⚔️ **Algorithm Showdown** | Pit two algorithms head-to-head on identical input — synchronized playback, real operation counts, prediction challenge before the reveal |
| 🪳 **Debugging Bosses** | 8 buggy implementations to repair via curated fix options, graded against a deterministic test suite (only app-authored code ever runs — no arbitrary sandboxing) |
| 🧪 **Complexity Lab** | Sweep input sizes, measure instrumented operation counts, and plot growth curves against O(1)/O(log n)/O(n)/O(n log n)/O(n²) references |
| 🌍 **Algorithm Worlds** | A playable maze: draw walls & weighted mud, run BFS/DFS/A*, watch the frontier expand, compare all three strategies, 4 concept levels |

**🏆 Trophy cabinet** — 8 achievements (first showdown, prediction oracle,
complexity detective, bug hunter, bug master, maze navigator, optimal path,
and a meta trophy) with first-time-only XP. All XP feeds the same single
progress system; everything persists to `localStorage` as before.

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

- **Top nav** — switch between Arcade / Showdown / Debug BOSSES / Complexity LAB / Worlds; **🏆** opens the trophy cabinet
- **▶ PRESS START** — enable sound + jump to the quest log
- **🔊 SOUND** — toggle 8-bit SFX (Web Audio, no audio files)
- **⟲ RESET** — wipe local progress
- Click any **unlocked** card to open its module (locked ones unlock as you progress)
- `Esc` closes modals · `Enter`/`Space` activates focused cards/buttons
- Fully responsive (320–1440px), keyboard-navigable, honours `prefers-reduced-motion`

---

## 🧷 Files

```
index.html      markup + top nav + five view sections
styles.css      full design system (retro CRT/pixel theme, views, responsive, reduced-motion)
curriculum.js   all 12 modules: lessons, theory, challenge specs + test cases
algorithms.js   shared instrumented algorithm library (sort/search traces, maze BFS/DFS/A*)
app.js          SHA-256, challenge implementations, state, XP, achievements, routing, modal, sound
showdown.js     Algorithm Showdown mode
bosses.js       Debugging Bosses challenge library (curated fixes + deterministic tests)
lab.js          Complexity Lab (size sweeps, SVG growth charts, prediction exercise)
worlds.js       Algorithm Worlds (maze drawing, BFS/DFS/A* playback, compare-all, 4 levels)
arcade.css      arcade layer: marquee + chase bulbs, CRT tube, coin slot, control deck
arcade.js       arcade layer: BIOS boot screen, starfield, particle FX, 3D tilt, lives/credits
```

The arcade layer is entirely self-contained: it never changes app logic, degrades
to nothing when `prefers-reduced-motion` is set, and exposes `window.AA_ARCADE`
(`coins`, `sparks`, `confetti`, `shake`, `flash`, `sound`, `startGame`) for hooks.

## 🧪 Run the tests

Requires Node (only for the test harness; the app itself needs nothing).

```bash
npm install          # jsdom for the DOM suites
npm test             # runs all five suites below

node test-challenges.js    # every algorithm implementation vs its declared test suite
node test-dom.js           # render, modal, tabs, lesson toggles, XP, persistence, navigation
node test-progression.js   # clear all 12 challenges end-to-end via the UI
node test-algorithms.js    # instrumented sorts/searches, maze BFS/DFS/A* optimality, boss integrity
node test-views.js         # integration: nav + all four new modes + trophies + a11y statics
```

---

*No servers. No tracking. Everything stays in your browser.*