/* ============================================================================
   ALGOARCADE — CURRICULUM DATA
   12 quest lines across 2 tracks. Pure data only; challenge *implementations*
   live in app.js under ALGO[moduleId][modeId].
   ========================================================================== */

const TRACKS = [
  {
    id: 'dsa',
    icon: '🏛',
    title: 'Data Structures & Algorithms',
    subtitle: 'Forge your foundation in the ancient discipline of computational logic',
    cls: 'cyan',
    modules: ['arrays-strings', 'linked-lists', 'trees-graphs', 'dynamic-programming', 'sorting-searching', 'hash-tables']
  },
  {
    id: 'crypto',
    icon: '🔐',
    title: 'Cryptographic Architecture',
    subtitle: 'Unlock the secrets of digital security and blockchain mastery',
    cls: 'purple',
    modules: ['cryptographic-hashing', 'symmetric-encryption', 'asymmetric-encryption', 'digital-signatures', 'blockchain-architecture', 'zero-knowledge-proofs']
  }
];

const CURRICULUM = {

/* ═══════════════════════ TRACK 1 · DATA STRUCTURES ═══════════════════════ */

'arrays-strings': {
  num: '01', icon: '📦', title: 'Arrays & Strings', diff: 'Beginner', xp: 500,
  unlocks: 'linked-lists', time: '3h',
  desc: 'Master contiguous memory allocation, sliding windows, and two-pointer techniques.',
  long: 'Arrays are the bedrock of every computation you will ever write. This quest teaches you to think in terms of indices, cache lines and amortised growth — the mental model that makes two-pointer and sliding-window solutions feel obvious instead of magic.',
  tags: ['Two-Pointer', 'Sliding Window', 'Kadane', 'Big-O'],
  lessons: [
    { t: 'Memory Layout & Static vs Dynamic Arrays', time: '20 min',
      d: 'Contiguous storage, cache locality, and why doubling capacity is amortised O(1).',
      body: `<p>An array stores elements in <b>contiguous memory</b>. That single fact drives everything: O(1) index access, excellent cache locality, and a fixed-upfront memory cost.</p>
<pre><span class="c">// RAW MEMORY — elements sit back-to-back</span>
<span class="n">addr</span>  |  [ 4 ] [ 8 ] [ 1 ] [ 9 ] [ 2 ] |  <span class="c">base</span>
<span class="n">idx</span>   0    1    2    3    4
<span class="n">value</span>  4    8    1    9    2</pre>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">Static vs Dynamic</h4>
<table><tr><th></th><th>Static (C array)</th><th>Dynamic (JS Array / Vector)</th></tr>
<tr><td>Size</td><td>Fixed at compile time</td><td>Grows at runtime</td></tr>
<tr><td>Push cost</td><td>Impossible (overflow)</td><td>Amortised O(1)</td></tr>
<tr><td>Memory</td><td>Stack / .data segment</td><td>Heap, reallocated on growth</td></tr></table>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">Why growth is amortised O(1)</h4>
<p>When full, a dynamic array <b>doubles</b> its capacity and copies. Copying is O(n) but rare. Over <i>n</i> pushes the total copy work is:</p>
<pre>n/2 + n/4 + n/8 + … = <span class="n">O(n)</span></pre>
<p>So n pushes cost O(n) <b>total</b> — amortised O(1) each. Had it grown by +1 each time, total cost would be O(n²).</p>
<div class="note"><b>Interview truth:</b> in JavaScript, <code>arr.push()</code> is O(1) amortised, but <code>arr.unshift()</code> / <code>arr.shift()</code> are <b>O(n)</b> — they re-index every element. Use a deque or an offset index instead.</div>` },
    { t: 'Two-Pointer Technique', time: '25 min',
      d: 'Opposite ends, fast/slow, and partitioning — collapsing O(n²) into O(n).',
      body: `<p>Two-pointer is the highest-leverage pattern in this whole quest. It replaces a nested loop with two indices walking the same array.</p>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">Variant A — Opposite Ends (Palindrome)</h4>
<pre><span class="k">function</span> <span class="f">isPalindrome</span>(s) {
  <span class="k">let</span> l = <span class="n">0</span>, r = s.length - <span class="n">1</span>;
  <span class="k">while</span> (l &lt; r) {
    <span class="k">if</span> (s[l] !== s[r]) <span class="k">return</span> <span class="n">false</span>;
    l++; r--;
  }
  <span class="k">return</span> <span class="n">true</span>;
}</pre>
<p><b>Invariant:</b> <code>s[0..l-1]</code> and <code>s[r+1..n-1]</code> are already confirmed mirror pairs.</p>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">Variant B — Fast & Slow (Linked List, Cycle)</h4>
<p><code>slow</code> steps once, <code>fast</code> steps twice. If a cycle exists, fast eventually laps slow and <code>fast === slow</code>.</p>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">Variant C — Partitioning (Dutch National Flag)</h4>
<p>One pass, three pointers <code>[0, i, n)</code>: move every 0 left, 2 right, leave 1 in the middle. O(n) instead of O(n log n).</p>
<div class="note cy"><b>When to reach for it:</b> sorted/rotated input, palindromes, dedup, partitioning, cycle detection, container-with-most-water.</div>` },
    { t: 'Sliding Window Pattern', time: '25 min',
      d: 'Fixed and variable windows over subarrays and substrings.',
      body: `<p>A sliding window is a contiguous subarray <code>[left, right]</code> that you expand and shrink instead of re-scanning.</p>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">Variable Window — Longest Substring Without Repeats</h4>
<pre><span class="k">function</span> <span class="f">longestUnique</span>(s) {
  <span class="k">const</span> seen = <span class="k">new</span> Map(); <span class="c">// char -&gt; last index</span>
  <span class="k">let</span> left = <span class="n">0</span>, best = <span class="n">0</span>;
  <span class="k">for</span> (<span class="k">let</span> right = <span class="n">0</span>; right &lt; s.length; right++) {
    <span class="k">const</span> c = s[right];
    <span class="k">if</span> (seen.has(c) &amp;&amp; seen.get(c) &gt;= left) left = seen.get(c) + <span class="n">1</span>;
    seen.set(c, right);
    best = Math.max(best, right - left + <span class="n">1</span>);
  }
  <span class="k">return</span> best;
}</pre>
<p><b>Loop invariant:</b> after each iteration, <code>s[left..right]</code> is the longest valid window ending at <code>right</code>.</p>
<div class="note"><b>Negative numbers break naive window sums</b> — a window that was valid can become invalid after shrinking. Track <code>min</code>/<code>max</code> in a monotonic deque, or use prefix sums when all values are ≥ 0.</div>` }
  ],
  theory: `
<h4 style="color:var(--cyan);font-size:11px;margin-bottom:10px">CHEAT SHEET</h4>
<div class="tbl-wrap"><table>
<tr><th>Operation</th><th>Array</th><th>Dynamic Array</th><th>Linked List</th></tr>
<tr><td>Index access</td><td>O(1)</td><td>O(1)</td><td>O(n)</td></tr>
<tr><td>Insert at end</td><td>O(n)</td><td>O(1)*</td><td>O(1)</td></tr>
<tr><td>Insert front</td><td>O(n)</td><td>O(n)</td><td>O(1)</td></tr>
<tr><td>Search</td><td>O(n) / O(log n) sorted</td><td>same</td><td>O(n)</td></tr>
<tr><td>Memory</td><td>tight</td><td>2× worst case</td><td>pointer overhead</td></tr>
</table></div>
<p style="font-size:11px;margin-top:12px">* amortised</p>
<h4 style="color:var(--cyan);font-size:11px;margin:22px 0 10px">PATTERN DECISION TREE</h4>
<pre><span class="c">Sorted input?            → binary search</span>
<span class="c">Contiguous range?       → sliding window</span>
<span class="c">Best pair / palindrome? → two-pointer</span>
<span class="c">Nested loops O(n²)?     → look for a freq map</span>
<span class="c">Overlapping subproblems? → memoize (DP)</span>
<span class="c">Max sum/min length?     → Kadane / greedy</span></pre>
<div class="note cy"><b>Complexities worth memorising:</b> reverse words O(n) · Kadane O(n) single pass · longest unique substring O(n) with a map · balanced parens O(n) stack.</div>`,
  challenge: {
    title: 'Reverse Words & Maximum Subarray',
    brief: 'Two classic warm-ups. Run both, inspect the outputs, then read the reference solutions.',
    modes: [
      { id: 'reverse-words', label: 'Reverse Words',
        inputLabel: 'Enter a sentence',
        placeholder: 'the quick brown fox',
        sample: 'the quick brown fox',
        tests: [
          { label: 'Two words', input: 'hello world', expect: 'world hello' },
          { label: 'Four words', input: 'the quick brown fox', expect: 'fox brown quick the' },
          { label: 'Extra whitespace', input: '  algo   arcade  ', expect: 'arcade algo' }
        ],
        solution: `function reverseWords(s) {
  return s.trim().split(/\\s+/).filter(Boolean).reverse().join(' ');
}`
      },
      { id: 'kadane', label: 'Kadane Max Subarray',
        inputLabel: 'Comma-separated integers',
        placeholder: '-2,1,-3,4,-1,2,1,-5,4',
        sample: '-2,1,-3,4,-1,2,1,-5,4',
        tests: [
          { label: 'LeetCode canonical', input: '-2,1,-3,4,-1,2,1,-5,4', expect: 6 },
          { label: 'Single positive', input: '1', expect: 1 },
          { label: 'All negative', input: '-3,-1,-2', expect: -1 },
          { label: 'All positive', input: '5,4,-1,7,8', expect: 23 }
        ],
        solution: `function maxSubarray(nums) {
  let best = nums[0], cur = nums[0];
  for (let i = 1; i < nums.length; i++) {
    cur = Math.max(nums[i], cur + nums[i]); // extend or restart
    best = Math.max(best, cur);
  }
  return best;
}`
      }
    ],
    hints: ['Kadane: at each index decide whether to extend the previous run or start fresh — `Math.max(nums[i], cur + nums[i])`.', 'Start with best = cur = nums[0] so all-negative inputs return the largest (least negative) value.']
  }
},

'linked-lists': {
  num: '02', icon: '🔗', title: 'Linked Lists', diff: 'Beginner', xp: 600,
  unlocks: 'trees-graphs', time: '3h',
  desc: 'Navigate pointer-based structures, cycle detection, and merge operations.',
  long: 'Where arrays trade memory for speed, linked lists trade locality for structure. You will learn to chase pointers, detect infinite loops, and rebuild list topology in place without allocating a single new node.',
  tags: ['Pointers', 'Floyd', 'Reverse', 'Merge'],
  lessons: [
    { t: 'Singly vs Doubly Linked Nodes', time: '20 min',
      d: 'Node anatomy, prev/next pointers, and sentinel head design.',
      body: `<pre><span class="k">class</span> <span class="f">Node</span> {
  <span class="k">constructor</span>(val) {
    this.val = val;
    this.next = <span class="n">null</span>;
    this.prev = <span class="n">null</span>; <span class="c">// doubly only</span>
  }
}</pre>
<table><tr><th></th><th>Singly</th><th>Doubly</th></tr>
<tr><td>Memory / node</td><td>2 pointers-worth</td><td>3</td></tr>
<tr><td>Delete given node</td><td>need predecessor</td><td>O(1) directly</td></tr>
<tr><td>Traverse backwards</td><td>impossible</td><td>O(1) step</td></tr>
<tr><td>Use case</td><td>free list, LRU from one side</td><td>LRU cache, text editor</td></tr></table>
<div class="note"><b>Sentinel head</b> — a dummy node before the real head removes every "is the list empty / is this the first node" special case. Always worth it.</div>` },
    { t: "Floyd's Cycle Detection (Tortoise & Hare)", time: '25 min',
      d: 'Detect a cycle in O(n) time and O(1) space, then find its entry point.',
      body: `<pre><span class="c">// Phase 1: does a cycle exist?</span>
slow = head; fast = head;
<span class="k">while</span> (fast &amp;&amp; fast.next) {
  slow = slow.next;
  fast = fast.next.next;
  <span class="k">if</span> (slow === fast) <span class="k">return</span> <span class="n">true</span>;  <span class="c">// cycle!</span>
}

<span class="c">// Phase 2: find the entry (Floyd's math)</span>
slow = head;
<span class="k">while</span> (slow !== fast) { slow = slow.next; fast = fast.next; }
<span class="k">return</span> slow; <span class="c">// cycle entry</span></pre>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">Why the entry trick works</h4>
<p>Let the cycle length be <code>L</code> and the distance from head to entry be <code>a</code>. When the pointers meet, fast has travelled twice as far. Resetting one pointer to head and advancing both one step guarantees they meet <b>exactly at the entry</b> — independent of <code>L</code>.</p>
<pre>head ── a steps ──► ● ENTRY ── L ──► back to ENTRY
                        ▲                    │
                        └────────────────────┘</pre>
<div class="note cy">Floyd also powers <code>happyNumber</code>, <code>middleOfList</code>, and detecting the loop start in functional list structures.</div>` },
    { t: 'Reversing Sublists In-Place', time: '25 min',
      d: 'Three-pointer reversal and the dummy-head swap trick.',
      body: `<pre><span class="c">// Reverse a..b inclusive. Three pointers, zero allocation.</span>
<span class="k">function</span> <span class="f">reverseBetween</span>(head, a, b) {
  <span class="k">const</span> dummy = <span class="k">new</span> Node(<span class="n">0</span>);
  dummy.next = head;
  <span class="k">let</span> prev = dummy;
  <span class="k">for</span> (<span class="k">let</span> i = <span class="n">0</span>; i &lt; a; i++) prev = prev.next;

  <span class="k">let</span> cur = prev.next;
  <span class="k">for</span> (<span class="k">let</span> i = a; i &lt; b; i++) {
    <span class="k">const</span> nxt = cur.next;
    cur.next = nxt.next;
    nxt.next = prev.next;
    prev.next = nxt;
  }
  <span class="k">return</span> dummy.next;
}</pre>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">Swap with dummy head</h4>
<pre>swapNodes(head, a, b):
  dummy = Node(0) -&gt; head
  nodeA = advance(dummy, a); nodeB = advance(dummy, b)
  nodeA.next, nodeB.next = nodeB.next, nodeA.next
  dummy.next = nodeB   <span class="c">// whichever is earlier</span></pre>
<div class="note"><b>Pattern:</b> "reverse between / swap nodes / insert at index" almost all reduce to <i>advance a dummy pointer to the right offset, then operate locally</i>. Learn it once, reuse forever.</div>` }
  ],
  theory: `
<div class="tbl-wrap"><table>
<tr><th>Problem</th><th>Technique</th><th>Time</th></tr>
<tr><td>Detect cycle</td><td>Floyd tortoise/hare</td><td>O(n) O(1)</td></tr>
<tr><td>Cycle entry</td><td>Floyd phase 2</td><td>O(n) O(1)</td></tr>
<tr><td>Reverse</td><td>prev/cur three-pointer</td><td>O(n) O(1)</td></tr>
<tr><td>Merging two sorted</td><td>dummy head + tail pointer</td><td>O(n+m)</td></tr>
<tr><td>Middle element</td><td>slow/fast</td><td>O(n)</td></tr>
<tr><td>Kth from end</td><td>two pointers, n−k gap</td><td>O(n) O(1)</td></tr>
<tr><td>LRU eviction</td><td>hash + doubly linked</td><td>O(1)</td></tr>
<tr><td>Reorder list</td><td>split, reverse, weave</td><td>O(n)</td></tr>
</table></div>
<h4 style="color:var(--cyan);font-size:11px;margin:22px 0 10px">SAFETY RULES</h4>
<pre><span class="c">1. Always capture next BEFORE re-pointing.</span>
   <span class="k">const</span> nxt = cur.next; cur.next = …; … = nxt;
<span class="c">2. Use a dummy head to delete the real head cleanly.</span>
<span class="c">3. Bound every loop: while(fast &amp;&amp; fast.next)</span>
<span class="c">4. Guard empty / single-node lists first.</span></pre>
<div class="note pk"><b>Common bug:</b> in reversal, forgetting to advance <code>prev</code>, or in Floyd phase 2, comparing values instead of node references — a self-looping node with value <code>1</code> can appear twice with different values.</div>`,
  challenge: {
    title: 'Detect the Cycle Entry',
    brief: 'Feed a list and a position where a cycle is re-attached. Floyd finds the entry in O(n) with zero extra memory.',
    modes: [
      { id: 'cycle-entry', label: 'Cycle Entry',
        inputLabel: 'values | pos  (pos = index linked back to tail; -1 or >= length = no cycle)',
        placeholder: '3,2,0,-4,-1 | 1',
        sample: '3,2,0,-4,-1 | 1',
        tests: [
          { label: 'LeetCode classic', input: '3,2,0,-4,-1 | 1', expect: 1 },
          { label: 'Cycle back to head', input: '1,2 | 0', expect: 0 },
          { label: 'Single node self-loop', input: '1 | 0', expect: 0 },
          { label: 'No cycle (pos >= len)', input: '1,2,3,4 | 4', expect: -1 },
          { label: 'No cycle (pos = -1)', input: '1,2 | -1', expect: -1 }
        ],
        solution: `function cycleEntry(values, pos) {
  const n = values.length;
  if (pos < 0 || pos >= n) return -1;

  // build list: node[i].next = node[i+1], node[pos].next = node[0]
  const next = values.map((_, i) => (i + 1 < n ? i + 1 : pos));
  next[pos] = 0;

  // phase 1 — is there a cycle?
  let slow = 0, fast = 0;
  while (Number.isFinite(fast) && Number.isFinite(next[fast])) {
    slow = next[slow];
    fast = next[next[fast]];
    if (slow === fast) break;
  }
  if (!(fast in next) || next[fast] === undefined) return -1;

  // phase 2 — locate the entry
  slow = 0;
  while (slow !== fast) { slow = next[slow]; fast = next[fast]; }
  return slow;
}`
      }
    ],
    hints: ['Phase 1 moves slow by 1 and fast by 2 until they meet.', 'Phase 2 resets one pointer to index 0 and advances both by 1 — they meet at the entry.']
  }
},

'trees-graphs': {
  num: '03', icon: '🌳', title: 'Trees & Graphs', diff: 'Intermediate', xp: 900,
  unlocks: 'dynamic-programming', time: '5h',
  desc: 'Traverse hierarchical and network structures with DFS, BFS, and advanced algorithms.',
  long: 'Trees give you hierarchy, graphs give you connectivity. This quest covers traversal orders, the recursion/stack duality, topological sorting, and union-find — the four tools behind most real-world pathfinding.',
  tags: ['DFS', 'BFS', 'Topo Sort', 'Union-Find', 'BST'],
  lessons: [
    { t: 'Binary Search Trees & Balanced Trees', time: '30 min',
      d: 'BST invariants, rotations, and why AVL/Red-Black guarantee O(log n).',
      body: `<p>A BST keeps the invariant: <b>left &lt; node &lt; right</b> for every node.</p>
<pre>        8
       / \\
      3   10      <span class="c">in-order: 3,8,10 → sorted!</span>
     / \\     \\
    1   6     14</pre>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">Search cost</h4>
<p>Balanced: O(log n). Degenerate (all right-skewed): <b>O(n)</b> — a plain BST degrades into a linked list, which is why balancing exists.</p>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">AVL vs Red-Black</h4>
<div class="tbl-wrap"><table><tr><th></th><th>AVL</th><th>Red-Black</th></tr>
<tr><td>Height bound</td><td>≤ 1.44 log n</td><td>≤ 2 log n</td></tr>
<tr><td>Lookups</td><td>faster (shorter)</td><td>slightly slower</td></tr>
<tr><td>Insert/Delete</td><td>more rotations</td><td>fewer rebalances</td></tr>
<tr><td>Used in</td><td>Java TreeMap</td><td>C++ std::map, Linux CFS</td></tr></table></div>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">Rotations</h4>
<pre>LL case: rotate right at parent.
RR case: rotate left.
LR case: rotate left at child, then right at parent.
RL case: rotate right at child, then left at parent.</pre>` },
    { t: 'BFS vs DFS', time: '30 min',
      d: 'Queue vs stack/recursion, and how each maps to graph problems.',
      body: `<p>The <b>only</b> difference is the data structure holding the frontier.</p>
<div class="tbl-wrap"><table><tr><th></th><th>BFS (Queue)</th><th>DFS (Stack/Recursion)</th></tr>
<tr><td>Explores</td><td>level by level</td><td>as deep as possible</td></tr>
<tr><td>Memory</td><td>O(width)</td><td>O(height × branching)</td></tr>
<tr><td>Shortest path (unweighted)</td><td><b>yes</b></td><td>no</td></tr>
<tr><td>Used for</td><td>shortest hops, level order</td><td>cycle detect, topo, components</td></tr></table></div>
<pre><span class="c">// BFS — queue, O(V+E)</span>
<span class="k">function</span> <span class="f">bfs</span>(adj, src) {
  <span class="k">const</span> seen = <span class="k">new</span> Set([src]), q = [src], out = [];
  <span class="k">while</span> (q.length) {
    <span class="k">const</span> n = q.shift();
    out.push(n);
    <span class="k">for</span> (<span class="k">const</span> m <span class="k">of</span> adj[n]) <span class="k">if</span> (!seen.has(m)) { seen.add(m); q.push(m); }
  }
  <span class="k">return</span> out;
}

<span class="c">// DFS — recursion, O(V+E)</span>
<span class="k">function</span> <span class="f">dfs</span>(n, adj, seen = <span class="k">new</span> Set()) {
  <span class="k">if</span> (seen.has(n)) <span class="k">return</span>;
  seen.add(n); out.push(n);
  <span class="k">for</span> (<span class="k">const</span> m <span class="k">of</span> adj[n]) <span class="k">if</span> (!seen.has(m)) dfs(m, adj, seen);
}</pre>
<div class="note cy"><b>Recursion IS an implicit stack.</b> Master that and you can convert any recursive DFS to iterative with an explicit array stack — essential for trees deeper than ~10k to avoid stack overflow.</div>` },
    { t: 'Topological Sort & Disjoint Set Union', time: '35 min',
      d: 'Kahn\'s algorithm for DAGs and near-O(1) connectivity tracking.',
      body: `<h4 style="color:var(--cyan);font-size:11px;margin-bottom:9px">Kahn\'s Algorithm (BFS-based topo sort)</h4>
<pre><span class="c">// indegree[v] = number of incoming edges</span>
<span class="k">function</span> <span class="f">topo</span>(n, edges) {
  <span class="k">const</span> indeg = <span class="k">new</span> Array(n).fill(<span class="n">0</span>);
  <span class="k">for</span> (<span class="k">const</span> [a, b] <span class="k">of</span> edges) indeg[b]++;

  <span class="k">const</span> q = [];
  <span class="k">for</span> (<span class="k">let</span> i = <span class="n">0</span>; i &lt; n; i++) <span class="k">if</span> (!indeg[i]) q.push(i);

  <span class="k">const</span> order = [];
  <span class="k">while</span> (q.length) {
    <span class="k">const</span> n = q.shift();
    order.push(n);
    <span class="k">for</span> (<span class="k">const</span> m <span class="k">of</span> adj[n]) <span class="k">if</span> (--indeg[m] === <span class="n">0</span>) q.push(m);
  }
  <span class="k">return</span> order.length === n ? order : <span class="k">null</span>; <span class="c">// null = cycle</span>
}</pre>
<p>If Kahn's emits fewer than n nodes, the remainder contains a cycle.</p>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">Union-Find (Disjoint Set Union)</h4>
<pre><span class="k">class</span> <span class="f">DSU</span> {
  <span class="k">constructor</span>(n) {
    <span class="k">this</span>.parent = Array.from({length: n}, (_, i) =&gt; i);
    <span class="k">this</span>.rank   = <span class="k">new</span> Array(n).fill(<span class="n">0</span>);
    <span class="k">this</span>.groups = n;
  }
  <span class="f">find</span>(x) {                       <span class="c">// path compression</span>
    <span class="k">while</span> (x !== <span class="k">this</span>.parent[x]) {
      <span class="k">this</span>.parent[x] = <span class="k">this</span>.parent[<span class="k">this</span>.parent[x]];  <span class="c">// halving</span>
      x = <span class="k">this</span>.parent[x];
    }
    <span class="k">return</span> x;
  }
  <span class="k">union</span>(a, b) {                   <span class="c">// union by rank</span>
    a = <span class="k">this</span>.find(a); b = <span class="k">this</span>.find(b);
    <span class="k">if</span> (a === b) <span class="k">return</span> <span class="n">false</span>;
    <span class="k">this</span>.groups--;
    <span class="k">if</span> (<span class="k">this</span>.rank[a] &lt; <span class="k">this</span>.rank[b]) [a, b] = [b, a];
    <span class="k">this</span>.parent[b] = a;
    <span class="k">if</span> (<span class="k">this</span>.rank[a] === <span class="k">this</span>.rank[b]) <span class="k">this</span>.rank[a]++;
    <span class="k">return</span> <span class="n">true</span>;
  }
}</pre>
<p>Both optimisations together give amortised <b>O(α(n))</b> — effectively constant. This is the backbone of Kruskal's MST and dynamic connectivity.</p>` }
  ],
  theory: `
<h4 style="color:var(--cyan);font-size:11px;margin-bottom:10px">TRAVERSAL ORDER REFERENCE</h4>
<pre><span class="c">Tree, root r:</span>
  pre-order  (r, left, right)  → copy / serialize
  in-order   (left, r, right)  → sorted if BST
  post-order (left, right, r)  → free / aggregate
  level-order (BFS)            → shortest depth</pre>
<h4 style="color:var(--cyan);font-size:11px;margin:22px 0 10px">GRAPH ALGORITHM MAP</h4>
<div class="tbl-wrap"><table>
<tr><th>Problem</th><th>Algorithm</th><th>Complexity</th></tr>
<tr><td>Shortest path (unweighted)</td><td>BFS</td><td>O(V+E)</td></tr>
<tr><td>Shortest path (weighted +)</td><td>Dijkstra</td><td>O((V+E)log V)</td></tr>
<tr><td>Shortest path (neg weights)</td><td>Bellman-Ford</td><td>O(V·E)</td></tr>
<tr><td>All-pairs</td><td>Floyd-Warshall</td><td>O(V³)</td></tr>
<tr><td>Order (DAG)</td><td>Kahn / DFS topo</td><td>O(V+E)</td></tr>
<tr><td>Min spanning tree</td><td>Kruskal / Prim</td><td>O(E log E)</td></tr>
<tr><td>Components</td><td>BFS/DFS/Union-Find</td><td>O(V+E)</td></tr>
<tr><td>Strongly connected</td><td>Tarjan / Kosaraju</td><td>O(V+E)</td></tr>
<tr><td>Bipartite check</td><td>2-colour BFS</td><td>O(V+E)</td></tr>
</table></div>
<div class="note"><b>Recursion depth warning:</b> a 100k-node linked-style graph will blow the JS call stack. Convert DFS to an explicit-stack loop before shipping.</div>`,
  challenge: {
    title: 'Count Connected Components',
    brief: 'Union-Find on a small graph. Input is "nodes | edges" where each edge is "a-b".',
    modes: [
      { id: 'components', label: 'Connected Components',
        inputLabel: 'nodes | edges   e.g.  5 | 0-1,1-2,3-4',
        placeholder: '5 | 0-1,1-2,3-4',
        sample: '5 | 0-1,1-2,3-4',
        tests: [
          { label: 'Two components', input: '5 | 0-1,1-2,3-4', expect: 2 },
          { label: 'All isolated', input: '4 |', expect: 4 },
          { label: 'Fully connected', input: '3 | 0-1,1-2', expect: 1 },
          { label: 'Three pairs', input: '6 | 0-1,2-3,4-5', expect: 3 }
        ],
        solution: `function components(nSpec, edgeSpec) {
  const n = parseInt(nSpec);
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = new Array(n).fill(0);
  const find = x => { while (x !== parent[x]) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };

  let groups = n;
  for (const e of edgeSpec.split(',').map(s => s.trim()).filter(Boolean)) {
    const [a, b] = e.split('-').map(Number);
    const ra = find(a), rb = find(b);
    if (ra !== rb) {
      groups--;
      if (rank[ra] < rank[rb]) parent[ra] = rb;
      else if (rank[ra] > rank[rb]) parent[rb] = ra;
      else { parent[rb] = ra; rank[ra]++; }
    }
  }
  return groups;
}`
      }
    ],
    hints: ['Start with `groups = n` — every node is its own component.', 'Only decrement when `find(a) !== find(b)`; that edge is what actually merges two groups.']
  }
},

'dynamic-programming': {
  num: '04', icon: '⚡', title: 'Dynamic Programming', diff: 'Advanced', xp: 1200,
  unlocks: 'sorting-searching', time: '6h',
  desc: 'Conquer optimization problems with memoization, tabulation, and state machines.',
  long: 'DP is where algorithm problems stop being tricks and start being engineering. You will learn to spot the state, define the recurrence, and choose an order that respects dependencies.',
  tags: ['Memoization', 'Tabulation', 'Knapsack', 'LCS', 'State Machine'],
  lessons: [
    { t: 'Overlapping Subproblems & Optimal Substructure', time: '30 min',
      d: 'The two conditions that make DP legal, and why brute force fails.',
      body: `<p>Brute force solves coin change for amount 11 in a tree with thousands of duplicate branches. DP asks: <b>have I computed this state before?</b></p>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">The two conditions</h4>
<pre><span class="n">1. OPTIMAL SUBSTRUCTURE</span>
   The best solution to a subproblem can be built from
   the best solutions of strictly smaller subproblems.

<span class="n">2. OVERLAPPING SUBPROBLEMS</span>
   The naive recursion revisits the same states many times.

<span class="c">--&gt; Memorize (top-down) or tabulate (bottom-up). Both are O(states).</span></pre>
<div class="note pk"><b>DP is a trade, not a free win.</b> Naive O(2ⁿ) → O(n·m) time, but you spend O(n·m) space. Recognise when that trade is worth it, and when it is not (e.g. unbounded knapsack with huge weights).</div>` },
    { t: 'Memoization vs Tabulation', time: '25 min',
      d: 'Same math, two execution strategies — and when each is safer.',
      body: `<pre><span class="c">// TOP-DOWN: recursion + cache. Only computes reachable states.</span>
<span class="k">function</span> <span class="f">minCoinsTopDown</span>(coins, amt) {
  <span class="k">const</span> memo = {};
  <span class="k">function</span> <span class="f">go</span>(a) {
    <span class="k">if</span> (a === <span class="n">0</span>) <span class="k">return</span> <span class="n">0</span>;
    <span class="k">if</span> (memo[a] !== <span class="n">undefined</span>) <span class="k">return</span> memo[a];
    <span class="k">let</span> best = <span class="n">Infinity</span>;
    <span class="k">for</span> (<span class="k">const</span> c <span class="k">of</span> coins)
      <span class="k">if</span> (c &lt;= a) best = Math.min(best, <span class="n">1</span> + go(a - c));
    <span class="k">return</span> (memo[a] = best);
  }
  <span class="k">return</span> go(amt);
}

<span class="c">// BOTTOM-UP: fill a table. No recursion depth risk.</span>
<span class="k">function</span> <span class="f">minCoinsBottomUp</span>(coins, amt) {
  <span class="k">const</span> dp = <span class="k">new</span> Array(amt + <span class="n">1</span>).fill(<span class="n">Infinity</span>);
  dp[<span class="n">0</span>] = <span class="n">0</span>;
  <span class="k">for</span> (<span class="k">let</span> a = <span class="n">1</span>; a &lt;= amt; a++)
    <span class="k">for</span> (<span class="k">const</span> c <span class="k">of</span> coins)
      <span class="k">if</span> (c &lt;= a) dp[a] = Math.min(dp[a], dp[a - c] + <span class="n">1</span>);
  <span class="k">return</span> dp[amt];
}</pre>
<div class="tbl-wrap"><table><tr><th></th><th>Top-down</th><th>Bottom-up</th></tr>
<tr><td>States visited</td><td>only reachable</td><td>all</td></tr>
<tr><td>Stack risk</td><td>yes (deep recursion)</td><td>none</td></tr>
<tr><td>Closer to problem</td><td>yes</td><td>more iterative</td></tr>
<tr><td>Best when</td><td>huge sparse space</td><td>needs to be robust</td></tr></table></div>` },
    { t: 'Knapsack, LCS & Grid DP', time: '40 min',
      d: 'The 0/1 vs unbounded split, and the LCS recurrence you will be asked forever.',
      body: `<h4 style="color:var(--cyan);font-size:11px;margin-bottom:9px">0/1 Knapsack (each item once)</h4>
<pre>dp[i][w] = max value using first i items, capacity w
dp[i][w] = max( dp[i-1][w],               <span class="c">// skip item i</span>
                dp[i-1][w-wi] + vi )      <span class="c">// take item i</span>

<span class="c">// 1D optimisation — iterate capacity BACKWARDS or you reuse items</span>
<span class="k">for</span> (<span class="k">let</span> w = W; w &gt;= wi; w--) dp[w] = Math.max(dp[w], dp[w - wi] + vi);</pre>
<div class="note pk"><b>The single most common DP bug:</b> iterating the capacity <i>forwards</i> in 0/1 knapsack turns it into the unbounded variant, letting the same item be used repeatedly. Go backwards.</div>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">Unbounded Knapsack</h4>
<pre><span class="c">// iterate capacity FORWARDS to allow reuse</span>
<span class="k">for</span> (<span class="k">let</span> w = wi; w &lt;= W; w++) dp[w] = Math.max(dp[w], dp[w - wi] + vi);</pre>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">Longest Common Subsequence</h4>
<pre><span class="k">if</span> (A[i-1] === B[j-1])  dp[i][j] = dp[i-1][j-1] + <span class="n">1</span>;
<span class="k">else</span>                    dp[i][j] = max(dp[i-1][j], dp[i][j-1]);

<span class="c">// "diagonal" → LCS = "ace", not "abc" (order must be preserved)</span></pre>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">Grid / Path problems</h4>
<pre>Unique paths (m × n), no obstacles:
  dp[i][j] = dp[i-1][j] + dp[i][j-1],  dp[0][*] = dp[*][0] = 1

With obstacles:  cell = 0 when blocked.
Min path sum:    dp[i][j] = min(up, left) + cost(i,j)</pre>` }
  ],
  theory: `
<h4 style="color:var(--cyan);font-size:11px;margin-bottom:10px">DP PATTERN CATALOGUE</h4>
<div class="tbl-wrap"><table>
<tr><th>Problem</th><th>State</th><th>Complexity</th></tr>
<tr><td>Fibonacci</td><td>dp[i] = dp[i-1]+dp[i-2]</td><td>O(n)</td></tr>
<tr><td>Climb stairs</td><td>ways to reach step i</td><td>O(n)</td></tr>
<tr><td>Coin change</td><td>dp[a] = min coins for amount a</td><td>O(n·A)</td></tr>
<tr><td>0/1 Knapsack</td><td>dp[i][w] best value</td><td>O(n·W)</td></tr>
<tr><td>LCS</td><td>dp[i][j] on prefixes</td><td>O(n·m)</td></tr>
<tr><td>Edit distance</td><td>dp[i][j] insert/del/sub</td><td>O(n·m)</td></tr>
<tr><td>Unique paths</td><td>dp[i][j] on grid</td><td>O(m·n)</td></tr>
<tr><td>Interval DP</td><td>dp[i][j] on substring</td><td>O(n³)</td></tr>
<tr><td>Bitmask DP</td><td>dp[mask] visited set</td><td>O(n·2ⁿ)</td></tr>
<tr><td>Stock (state machine)</td><td>hold / sold / rest</td><td>O(n)</td></tr>
</table></div>
<h4 style="color:var(--cyan);font-size:11px;margin:22px 0 10px">HOW TO RECOGNISE DP IN AN INTERVIEW</h4>
<pre><span class="c">1. Can you define f(state) returning a single value? (no mutation needed)</span>
<span class="c">2. Does f(state) depend on strictly smaller states?  → acyclic</span>
<span class="c">3. Will naive recursion re-visit states?          → memoize</span>
<span class="c">4. What is the state SIZE? if &gt; 10⁶ cells, find a rolling array</span></pre>
<div class="note cy"><b>Space compression:</b> when dp[i] only depends on dp[i-1] (and dp[i-2]), keep two rolling rows. This turns O(m·n) space into O(n) and is the difference between passing and timing out.</div>`,
  challenge: {
    title: 'Coin Change — Minimum Coins',
    brief: 'Unbounded coin change. Input is "coins | amount". Return -1 when impossible.',
    modes: [
      { id: 'coin-change', label: 'Coin Change',
        inputLabel: 'coins | amount   e.g.  1,2,5 | 11',
        placeholder: '1,2,5 | 11',
        sample: '1,2,5 | 11',
        tests: [
          { label: '11 from 1,2,5', input: '1,2,5 | 11', expect: 3 },
          { label: 'Impossible', input: '2 | 3', expect: -1 },
          { label: 'Zero amount', input: '1 | 0', expect: 0 },
          { label: 'Reuse required', input: '2,5,10,1 | 27', expect: 4 }
        ],
        solution: `function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`
      }
    ],
    hints: ['`dp[0] = 0` is the base case — zero coins make zero.', 'Iterate amounts ascending: that ordering is what allows unlimited reuse of each coin.']
  }
},

'sorting-searching': {
  num: '05', icon: '🔄', title: 'Sorting & Searching', diff: 'Intermediate', xp: 750,
  unlocks: 'hash-tables', time: '4h',
  desc: 'Implement QuickSort, MergeSort, binary search variants, and heap operations.',
  long: 'Divide and conquer, then binary search on both arrays and on the space of possible answers. Heaps round out the module as the priority queue behind Dijkstra, Prim and every streaming top-k.',
  tags: ['Quicksort', 'Mergesort', 'Binary Search', 'Heaps'],
  lessons: [
    { t: 'Divide and Conquer', time: '30 min',
      d: 'MergeSort\'s stability and QuickSort\'s partitioning, compared honestly.',
      body: `<div class="tbl-wrap"><table><tr><th></th><th>MergeSort</th><th>QuickSort</th></tr>
<tr><td>Strategy</td><td>split then merge</td><td>partition then split</td></tr>
<tr><td>Best</td><td>O(n log n) always</td><td>O(n log n) avg</td></tr>
<tr><td>Worst</td><td>O(n log n)</td><td><b>O(n²)</b> (sorted input!)</td></tr>
<tr><td>Space</td><td>O(n)</td><td>O(log n) stack</td></tr>
<tr><td>Stable</td><td><b>yes</b></td><td>no</td></tr>
<tr><td>Cache</td><td>sequential (good)</td><td>random-ish</td></tr>
<tr><td>Fast in practice</td><td>decent</td><td><b>usually fastest</b></td></tr></table></div>
<pre><span class="c">// MergeSort</span>
<span class="k">function</span> <span class="f">mergeSort</span>(a) {
  <span class="k">if</span> (a.length &lt;= <span class="n">1</span>) <span class="k">return</span> a;
  <span class="k">const</span> mid = a.length &gt;&gt; <span class="n">1</span>;
  <span class="k">return</span> merge(mergeSort(a.slice(<span class="n">0</span>, mid)),
               mergeSort(a.slice(mid)));
}
<span class="k">function</span> <span class="f">merge</span>(L, R) {
  <span class="k">const</span> out = []; <span class="k">let</span> i = <span class="n">0</span>, j = <span class="n">0</span>;
  <span class="k">while</span> (i &lt; L.length &amp;&amp; j &lt; R.length)
    out.push(L[i] &lt;= R[j] ? L[i++] : R[j++]);   <span class="c">// &lt;= keeps stability</span>
  <span class="k">return</span> out.concat(L.slice(i), R.slice(j));
}

<span class="c">// QuickSort (Lomuto)</span>
<span class="k">function</span> <span class="f">quickSort</span>(a, lo = <span class="n">0</span>, hi = a.length - <span class="n">1</span>) {
  <span class="k">if</span> (lo &gt;= hi) <span class="k">return</span> a;
  <span class="k">const</span> p = partition(a, lo, hi);
  quickSort(a, lo, p - <span class="n">1</span>); quickSort(a, p + <span class="n">1</span>, hi);
  <span class="k">return</span> a;
}
<span class="k">function</span> <span class="f">partition</span>(a, lo, hi) {
  <span class="k">const</span> pivot = a[hi]; <span class="k">let</span> i = lo - <span class="n">1</span>;
  <span class="k">for</span> (<span class="k">let</span> j = lo; j &lt; hi; j++)
    <span class="k">if</span> (a[j] &lt;= pivot) [a[++i], a[j]] = [a[j], a[i]];
  [a[i + <span class="n">1</span>], a[hi]] = [a[hi], a[i + <span class="n">1</span>]];
  <span class="k">return</span> i + <span class="n">1</span>;
}</pre>
<div class="note pk"><b>Worst-case trigger:</b> picking the last element as pivot on already-sorted input degrades QuickSort to O(n²). Fix with median-of-three or a random pivot. (Java's <code>Arrays.sort</code> for primitives is dual-pivot quicksort + insertion sort for small runs.)</div>` },
    { t: 'Binary Search & Rotated Arrays', time: '30 min',
      d: 'The template, the three boundary variants, and searching the answer space.',
      body: `<pre><span class="c">// Canonical lower_bound — [lo, hi) half-open</span>
<span class="k">function</span> <span class="f">lowerBound</span>(a, target) {
  <span class="k">let</span> lo = <span class="n">0</span>, hi = a.length;
  <span class="k">while</span> (lo &lt; hi) {
    <span class="k">const</span> mid = lo + ((hi - lo) &gt;&gt; <span class="n">1</span>);  <span class="c">// overflow-safe</span>
    <span class="k">if</span> (a[mid] &lt; target) lo = mid + <span class="n">1</span>; <span class="k">else</span> hi = mid;
  }
  <span class="k">return</span> lo;   <span class="c">// first index &gt;= target</span>
}</pre>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">Search in Rotated Sorted Array</h4>
<pre><span class="k">function</span> <span class="f">searchRotated</span>(a, target) {
  <span class="k">let</span> lo = <span class="n">0</span>, hi = a.length - <span class="n">1</span>;
  <span class="k">while</span> (lo &lt;= hi) {
    <span class="k">const</span> mid = lo + ((hi - lo) &gt;&gt; <span class="n">1</span>);
    <span class="k">if</span> (a[mid] === target) <span class="k">return</span> mid;
    <span class="k">if</span> (a[lo] &lt;= a[mid]) {            <span class="c">// left half sorted</span>
      <span class="k">if</span> (a[lo] &lt;= target &amp;&amp; target &lt; a[mid]) hi = mid - <span class="n">1</span>; <span class="k">else</span> lo = mid + <span class="n">1</span>;
    } <span class="k">else</span> {                              <span class="c">// right half sorted</span>
      <span class="k">if</span> (a[mid] &lt; target &amp;&amp; target &lt;= a[hi]) lo = mid + <span class="n">1</span>; <span class="k">else</span> hi = mid - <span class="n">1</span>;
    }
  }
  <span class="k">return</span> -<span class="n">1</span>;
}</pre>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">Binary search on the ANSWER</h4>
<pre><span class="c">// "Can I make at least N products in D days?"</span>
<span class="k">let</span> lo = <span class="n">1</span>, hi = max(nums);
<span class="k">while</span> (lo &lt; hi) {
  <span class="k">const</span> mid = lo + ((hi - lo) &gt;&gt; <span class="n">1</span>);
  <span class="k">if</span> (feasible(mid)) hi = mid; <span class="k">else</span> lo = mid + <span class="n">1</span>;
}</pre>
<div class="note cy"><b>Key insight:</b> if the problem is "smallest x such that predicate(x) is true" and predicate is monotonic, binary search over x answers it in O(log(range) · cost(predicate)). This solves aggressive cows, Koko eating bananas, and min capacity.</div>` },
    { t: 'Heaps & Priority Queues', time: '30 min',
      d: 'Sift-up, sift-down, and the complete-binary-array layout.',
      body: `<p>A binary heap is a <b>complete binary tree</b> stored in a flat array — children of <code>i</code> live at <code>2i+1</code> and <code>2i+2</code>. No pointers needed.</p>
<pre>          <span class="n">0</span>          <span class="c">← root / max</span>
        /   \\
      <span class="n">1</span>       <span class="n">2</span>       <span class="c">← children of 0</span>
     / \\     / \\
   <span class="n">3</span>  <span class="n">4</span>   <span class="n">5</span>  <span class="n">6</span></pre>
<pre><span class="c">// Sift-down: push node i down until heap property holds</span>
<span class="k">function</span> <span class="f">siftDown</span>(h, i) {
  <span class="k">const</span> n = h.length;
  <span class="k">while</span> (<span class="n">true</span>) {
    <span class="k">const</span> l = <span class="n">2</span>*i + <span class="n">1</span>, r = l + <span class="n">1</span>;
    <span class="k">let</span> big = i;
    <span class="k">if</span> (l &lt; n &amp;&amp; h[l] &gt; h[big]) big = l;
    <span class="k">if</span> (r &lt; n &amp;&amp; h[r] &gt; h[big]) big = r;
    <span class="k">if</span> (big === i) <span class="k">break</span>;
    [h[i], h[big]] = [h[big], h[i]];
    i = big;
  }
}</pre>
<div class="tbl-wrap"><table><tr><th>Operation</th><th>MinHeap</th><th>MaxHeap</th></tr>
<tr><td>peek</td><td>O(1)</td><td>O(1)</td></tr>
<tr><td>push</td><td>O(log n)</td><td>O(log n)</td></tr>
<tr><td>pop</td><td>O(log n)</td><td>O(log n)</td></tr>
<tr><td>find min/max</td><td>O(1)</td><td>O(1)</td></tr>
<tr><td>arbitrary remove</td><td>O(n)</td><td>O(n)</td></tr></table></div>
<div class="note"><b>Where heaps earn their keep:</b> Dijkstra / Prim / Kruskal, streaming top-k, merging k sorted streams, and real-time task scheduling (a priority queue is literally a heap).</div>` }
  ],
  theory: `
<div class="tbl-wrap"><table>
<tr><th>Algorithm</th><th>Best</th><th>Avg</th><th>Worst</th><th>Space</th><th>Stable</th></tr>
<tr><td>Bubble</td><td>O(n)</td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td><td>yes</td></tr>
<tr><td>Insertion</td><td>O(n)</td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td><td>yes</td></tr>
<tr><td>Selection</td><td>O(n²)</td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td><td>no</td></tr>
<tr><td>Merge</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n)</td><td><b>yes</b></td></tr>
<tr><td>Quick</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n²)</td><td>O(log n)</td><td>no</td></tr>
<tr><td>Heap</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n log n)</td><td>O(1)</td><td>no</td></tr>
<tr><td>Counting</td><td>O(n+k)</td><td>O(n+k)</td><td>O(n+k)</td><td>O(k)</td><td>yes</td></tr>
</table></div>
<h4 style="color:var(--cyan);font-size:11px;margin:22px 0 10px">BINARY SEARCH BOUNDARY CHEAT SHEET</h4>
<pre><span class="c">first index == target   → lowerBound(target)</span>
<span class="c">first index &gt;  target   → upperBound(target) = lowerBound(target+1)</span>
<span class="c">last index &lt;= target   → upperBound(target) - 1</span>
<span class="c">count of target         → upperBound - lowerBound</span>
<span class="c">any rotation point      → a[mid] &lt; a[hi]  (min lies right)</span>
<span class="c">monotonic predicate     → lo=hi converge</span></pre>
<div class="note cy"><b>Off-by-one discipline:</b> pick one convention — either <code>[lo, hi)</code> half-open with <code>lo &lt; hi</code>, or <code>[lo, hi]</code> closed with <code>lo &lt;= hi</code> — and never mix them. Write the return index on paper before coding.</div>`,
  challenge: {
    title: 'Search in a Rotated Sorted Array',
    brief: 'Input is "array | target". Return the index of target, or -1 if absent.',
    modes: [
      { id: 'rotated-search', label: 'Rotated Search',
        inputLabel: 'array | target   e.g.  4,5,6,7,0,1,2 | 5',
        placeholder: '4,5,6,7,0,1,2 | 5',
        sample: '4,5,6,7,0,1,2 | 5',
        tests: [
          { label: 'Mid-array target', input: '4,5,6,7,0,1,2 | 5', expect: 1 },
          { label: 'Post-pivot target', input: '4,5,6,7,0,1,2 | 0', expect: 4 },
          { label: 'Absent target', input: '1 | 0', expect: -1 },
          { label: 'Rotated by one', input: '3,1 | 1', expect: 1 }
        ],
        solution: `function searchRotated(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] === target) return mid;
    if (nums[lo] <= nums[mid]) {
      if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else {
      if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}`
      }
    ],
    hints: ['At every step one half is guaranteed sorted — check which.', 'Test the sorted half for containment: `a[lo] <= target && target < a[mid]`.']
  }
},

'hash-tables': {
  num: '06', icon: '#️⃣', title: 'Hash Tables', diff: 'Intermediate', xp: 800,
  unlocks: 'cryptographic-hashing', time: '4h',
  desc: 'Engineer collision resolution, bloom filters, and constant-time lookup systems.',
  long: 'Hash tables trade a little determinism for raw speed. This quest covers collision strategies, resizing maths, and then the probabilistic cousin — the bloom filter — before you assemble both into an O(1) LRU cache.',
  tags: ['Collisions', 'Chaining', 'Open Addressing', 'Bloom Filter', 'LRU'],
  lessons: [
    { t: 'Hash Functions, Chaining & Open Addressing', time: '30 min',
      d: 'How buckets are chosen and the two classic collision strategies.',
      body: `<p>A hash table is an array of buckets plus a hash function mapping keys to bucket indices.</p>
<pre>key ──hash()──&gt; index ──&gt; bucket[i]
"apple"  →  fnv("apple") % 8 = 3

<span class="n">bucket[0] →</span>
<span class="n">bucket[1] →</span>
<span class="n">bucket[3] →</span> ("apple":1) ("melon":9)  <span class="c">← separate chaining</span>
<span class="n">bucket[5] →</span></pre>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">Strategy A — Separate Chaining</h4>
<p>Each bucket holds a list/array of all colliding entries. Simple, load factor can exceed 1, deletions easy (mark as deleted).</p>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">Strategy B — Open Addressing</h4>
<p>All entries live in one array; probe for a free slot on collision.</p>
<pre><span class="c">Linear probing:   h, h+1, h+2, h+3 …</span>
  <span class="c">→ cache-friendly, but suffers primary clustering</span>
<span class="c">Quadratic:        h, h+1, h+4, h+9 …</span>
  <span class="c">→ reduces clustering</span>
<span class="c">Double hashing:  h1 + i * h2 (h2 coprime to size)</span>
  <span class="c">→ best distribution, ~2 hash computations</span></pre>
<div class="note pk"><b>Deleted slots break linear search.</b> In open addressing you cannot simply clear a slot — it terminates a probe chain. Tombstones fix this at the cost of reducing effective capacity.</div>
<div class="note"><b>Good hash = uniform + fast.</b> FNV-1a and MurmurHash3 are the standards for strings. <code>hash(k) % n</code> with power-of-two <code>n</code> discards low bits, so mix first (e.g. <code>hash ^ (hash >>> 16)</code>).</div>` },
    { t: 'Load Factors, Resizing & Amortised O(1)', time: '25 min',
      d: 'The maths behind why hash lookups are "free".',
      body: `<p><b>Load factor</b> <code>α = n / m</code> where n = entries, m = buckets.</p>
<div class="tbl-wrap"><table><tr><th>α</th><th>Chaining (avg probes)</th><th>Open addressing (unsuccessful)</th></tr>
<tr><td>0.50</td><td>0.50</td><td>1.5</td></tr>
<tr><td>0.75</td><td>0.75</td><td>2.5</td></tr>
<tr><td>0.90</td><td>0.90</td><td>5.5</td></tr>
<tr><td>0.99</td><td>0.99</td><td>~50</td></tr></table></div>
<pre><span class="c">// Doubling strategy (Java HashMap) — O(1) amortised insert</span>
<span class="k">function</span> <span class="f">put</span>(k, v) {
  table[k] = v;
  size++;
  <span class="k">if</span> (size / buckets.length &gt; <span class="n">0.75</span>) resize(buckets.length * <span class="n">2</span>);
}

<span class="c">// Total cost across n inserts, doubling each time:</span>
<span class="c">//   n + 2n + 4n + … + n  =  2n   →  O(n) total  →  O(1) each</span></pre>
<div class="note cy"><b>Why doubling?</b> It guarantees each element is copied at most O(log n) times over its lifetime, making the amortised cost constant. Growing by a constant factor (e.g. ×1.5) makes copying O(n) total — asymptotically worse.</div>` },
    { t: 'Bloom Filters & Probabilistic Structures', time: '30 min',
      d: 'Trading a false-positive rate for enormous memory savings.',
      body: `<p>A bloom filter answers: <b>"definitely not present"</b> or <b>"probably present"</b>. Never gives a false negative — if it was inserted, it will always report present.</p>
<pre>insert(x):
  <span class="k">for</span> h <span class="k">in</span> k_hash_functions(x):
    bits[h(x) % m] = <span class="n">1</span>

mightContain(x):
  <span class="k">return</span> ALL k bits[h(x) % m] == <span class="n">1</span></pre>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">False-positive probability</h4>
<pre>P(fp) ≈ (1 - e^(-kn/m))^k

<span class="c">Optimum k for fixed m:</span>  k* = (m/n) · ln 2
<span class="c">Space per element:</span>        m/n · 8 bits ≈ 9.6 bits</pre>
<p>Compare: an exact set of 10⁹ URLs needs ~60 GB of hashed pointers. A bloom filter with a 1% false-positive rate needs about <b>1.2 GB</b> — and eliminates most disk lookups, which is the real win.</p>
<pre>   URL → bloom filter (RAM) → hit? yes → exact DB lookup (disk)
                           → no?  → DEFINITELY NOT PRESENT, done</pre>
<div class="note pk"><b>Standard bloom filters cannot be deleted.</b> Clearing a bit may clear evidence that another element set. Use counting bloom filters (increment/decrement counters) or cuckoo filters when deletion is required.</div>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">Related probabilistic structures</h4>
<pre>Count-min sketch   → frequency estimation, sublinear space
HyperLogLog        → distinct count estimate in ~1.5 kB
Cuckoo filter      → set membership WITH deletion
</pre>` }
  ],
  theory: `
<div class="tbl-wrap"><table>
<tr><th>Operation</th><th>Avg</th><th>Worst</th><th>Note</th></tr>
<tr><td>Lookup / insert</td><td>O(1)</td><td>O(n)</td><td>amortised O(1)</td></tr>
<tr><td>Delete</td><td>O(1)</td><td>O(n)</td><td>chaining easy, open addressing needs tombstone</td></tr>
<tr><td>Rehash at 2× size</td><td>O(n)</td><td>O(n)</td><td>amortised away</td></tr>
<tr><td>Iterate in order</td><td>—</td><td>O(n log n)</td><td>hash tables are unsorted</td></tr>
</table></div>
<h4 style="color:var(--cyan);font-size:11px;margin:22px 0 10px">CHOOSING A STRATEGY</h4>
<pre><span class="c">Small load factor + many deletes   → chaining</span>
<span class="c">Cache-sensitive / high perf       → linear probing</span>
<span class="c">Worst-case distribution matters   → double hashing</span>
<span class="c">Need key ordering                 → use a TreeMap instead</span>
<span class="c">Memory critical, false-pos OK     → bloom filter</span></pre>
<h4 style="color:var(--cyan);font-size:11px;margin:22px 0 10px">THE LRU RECIPE (HASH + DOUBLY LINKED LIST)</h4>
<pre>HashMap&lt;key, node&gt;  → O(1) lookup by key
Doubly linked list     → O(1) move-to-front + O(1) evict tail

get(k):
  n = map.get(k); <span class="k">if</span> (!n) <span class="k">return</span> -1
  moveToFront(n); <span class="k">return</span> n.val

put(k, v):
  n = map.get(k)
  <span class="k">if</span> (n) { n.val = v; moveToFront(n); <span class="k">return</span> }
  <span class="k">if</span> (map.size === cap) { evictListTail(); }
  map.set(k, newNode(k, v));</pre>
<div class="note cy"><b>Why a doubly linked list and not a singly?</b> Evicting the tail requires removing the node <i>before</i> it. Without <code>prev</code> you would walk from the head — O(n), destroying the O(1) guarantee. This is the single most-tested system-design question for this module.</div>`,
  challenge: {
    title: 'Implement an O(1) LRU Cache',
    brief: 'Simulate the cache. Input is "capacity | ops" where ops are put(k,v[,ttl]) or get(k).',
    modes: [
      { id: 'lru-cache', label: 'LRU Cache',
        inputLabel: 'capacity | ops   e.g.  2 | put(1,1,1),put(2,2),get(1),put(3,3),put(4,4),get(1),get(3),get(4)',
        placeholder: '2 | put(1,1,1),put(2,2),get(1),put(3,3),put(4,4),get(1),get(3),get(4)',
        sample: '2 | put(1,1,1),put(2,2),get(1),put(3,3),put(4,4),get(1),get(3),get(4)',
        tests: [
          { label: 'LeetCode 146', input: '2 | put(1,1,1),put(2,2),get(1),put(3,3),put(4,4),get(1),get(3),get(4)', expect: [1,-1,3,4] },
          { label: 'Hit promotes to MRU', input: '2 | put(1,1),put(2,2),get(2),get(1)', expect: [2,1] },
          { label: 'Eviction picks true LRU', input: '2 | put(1,1),put(2,2),get(1),put(3,3),get(2)', expect: [1,-1] },
          { label: 'Capacity 1 thrash', input: '1 | put(1,1),put(2,2),get(1)', expect: [-1] },
          { label: 'No eviction needed', input: '2 | put(1,1),put(2,2),get(1),get(2)', expect: [1,2] }
        ],
        solution: `class LRUCache {
  constructor(capacity) {
    this.cap = capacity;
    this.map = new Map(); // key -> value; Map preserves insertion order
  }
  get(k) {
    if (!this.map.has(k)) return -1;
    const v = this.map.get(k);
    this.map.delete(k);
    this.map.set(k, v);  // re-insert to mark as most-recent
    return v;
  }
  put(k, v) {
    if (this.map.has(k)) this.map.delete(k);
    else if (this.map.size >= this.cap) this.map.delete(this.map.keys().next().value);
    this.map.set(k, v);
  }
}`
      }
    ],
    hints: ['A JavaScript `Map` iterates in insertion order, so the first key is always the LRU — you get O(1) eviction without writing a list.', '`delete` then `set` is how you promote an entry to most-recently-used.', 'An optional third argument on `put` sets a TTL; expired keys behave as a miss.']
  }
},

/* ═══════════════════════ TRACK 2 · CRYPTOGRAPHY ═══════════════════════ */

'cryptographic-hashing': {
  num: '01', icon: '🔢', title: 'Cryptographic Hashing', diff: 'Beginner', xp: 700,
  unlocks: 'digital-signatures', time: '4h',
  desc: 'Explore SHA-256, MD5, hash collisions, and one-way function properties.',
  long: 'Hashing is the primitive everything else in cryptography is built from. Learn the three security properties, the sponge/Merkle–Damgård construction that defines SHA-2, and then build a real proof-of-work miner in this quest\'s challenge.',
  tags: ['SHA-256', 'Avalanche', 'Merkle Trees', 'PoW'],
  lessons: [
    { t: 'Avalanche, Preimage & Collision Resistance', time: '25 min',
      d: 'The three properties that separate a hash from a checksum.',
      body: `<p>A cryptographic hash <code>h: {0,1}* → {0,1}^n</code> must satisfy three properties:</p>
<pre><span class="n">1. DETERMINISTIC</span>
   h(x) is always the same. No random salt unless you want one.

<span class="n">2. PREIMAGE RESISTANCE</span>
   Given h(x), finding any x' with h(x') = h(x) is infeasible.
   <span class="c">→ one-way function</span>

<span class="n">3. COLLISION RESISTANCE</span>
   Finding any x ≠ y with h(x) = h(y) is infeasible.
   <span class="c">→ STRONGER than preimage resistance</span></pre>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">Avalanche effect</h4>
<p>Flip one input bit → roughly half the output bits change (ideal: 50%). This is a design property of the compression function, not a consequence of it.</p>
<pre>md5("arcade")   = <span class="s">e4d2b1c8…a91f</span>
md5("arcadb")   = <span class="s">7b03e9d5…4c02</span>  <span class="c">completely different</span></pre>
<div class="note pk"><b>MD5 and SHA-1 are dead.</b> MD5 collisions are computable in seconds (chosen-prefix collisions under a second on modern GPUs) and SHA-1's practical collision was demonstrated by SHAttered in 2017. Never use them for signatures, integrity or passwords. Use SHA-256+.</div>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">Security strength table (birthday bound)</h4>
<div class="tbl-wrap"><table><tr><th>n-bit output</th><th>Collision strength</th><th>Preimage strength</th></tr>
<tr><td>128 (MD5)</td><td>2⁶⁴ — <b>broken</b></td><td>2¹²⁸</td></tr>
<tr><td>160 (SHA-1)</td><td>2⁸⁰ — <b>broken</b></td><td>2¹⁶⁰</td></tr>
<tr><td>224 (SHA-224)</td><td>2¹¹²</td><td>2²²⁴</td></tr>
<tr><td>256 (SHA-256)</td><td>2¹²⁸</td><td>2²⁵⁶</td></tr>
<tr><td>512 (SHA-512)</td><td>2²⁵⁶</td><td>2⁵¹²</td></tr></table></div>
<p>Collisions cost half the bits (birthday paradox); preimages cost all of them.</p>` },
    { t: 'Merkle–Damgård & Keccak/SHA-3', time: '30 min',
      d: 'Why padding matters, and how the sponge construction ditches it.',
      body: `<h4 style="color:var(--cyan);font-size:11px;margin-bottom:9px">Merkle–Damgård (SHA-1, SHA-2)</h4>
<pre><span class="c">IV ──[pad]──▶ msg[0:64] ──[compress]──▶ ──[pad]──▶ msg[64:128] ──▶ … ──▶ H</span>

<span class="k">function</span> <span class="f">sha256</span>(msg) {
  msg = pad(msg);                    <span class="c">// append 1, zeros, then 64-bit length</span>
  <span class="k">let</span> H = IV.slice();   <span class="c">// 8 × 32-bit words</span>
  <span class="k">for</span> (<span class="k">const</span> block <span class="k">of</span> chunks(msg, <span class="n">64</span>)) {
    H = compress(H, block);          <span class="c">// 64 rounds of Ch/Maj/Σ</span>
  }
  <span class="k">return</span> H;
}</pre>
<div class="note"><b>The padding rule that makes it work:</b> append a single <code>1</code> bit, then zeros, then the original message length in bits. This is an injective encoding — <code>"abc"</code> and <code>"abc\0"</code> must never produce the same padded block, so the length is mandatory, not optional.</div>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">Merkle–Damgård's weakness: length extension</h4>
<pre>Given h("admin") and the length of "admin",
you can compute h("admin" + padding + extra) <span class="k">without knowing "admin"</span>

<span class="c">→ breaks any construction that assumes h(m) hides m's length.</span>
<span class="c">→ fix: HMAC. h(k ‖ m). SHA-256(msg || secret) is still vulnerable;</span>
   HMAC(key, msg) = H((k⊕opad) ‖ H((k⊖ipad) ‖ msg)) is not.</pre>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">Keccak / SHA-3 (sponge)</h4>
<pre>rate ─┤ ABSORB: state ^= input, permute (24 × Keccak-f[1600]) ─┐
capacity ─┤ SQUEEZE: output bits, permute …                       ┘

SHA-256: 64-byte blocks, 256-bit state,  64 rounds, Merkle–Damgård
SHA-3:   136-byte rate, 1600-bit state, 24 rounds, sponge

<span class="c">Sponge needs NO padding (pad10*1 uses the rate), so it is</span>
<span class="c">immune to length-extension and can absorb arbitrary-length input.</span></pre>` },
    { t: 'Merkle Trees & Cryptographic Proofs', time: '30 min',
      d: 'Compressing n hashes into one, and proving inclusion with O(log n) data.',
      body: `<pre>Leaves:   h0  h1  h2  h3      h0…h3 = "a,b,c,d"

                ┌────┴────┐
          ┌─────┴──┐  ┌──┴─────┐
          │ h01    │  │ h23    │      h01 = h(h0‖h1) = 9f2c…
          └───┬────┘  └────┬───┘
              └──────┬────┘
                   hRoot = 4b7a…   <span class="c">← the "hash of everything"</span></pre>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">Properties</h4>
<pre><span class="n">INCLUSION PROOF</span>  prove h2 is in the tree: send h1, h23, hRoot → O(log n) hashes.
                      Anyone recomputes hRoot from the root in O(log n).

<span class="n">CONSISTENCY PROOF</span>  prove the <span class="k">same tree</span> at two different times,
                      using only O(log n) hashes.

<span class="c">→ Bitcoin's block header IS a merkle root over ~2000 txns.
→ Merkle proofs power Certificate Transparency logs and IPFS.</span></pre>
<div class="note cy"><b>SPV (Simplified Payment Verification):</b> a light client downloads only block headers (~80 bytes each), then requests O(log n) merkle proofs per transaction. Verifying a payment costs kilobytes instead of the full 4 MB block.</div>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">Proof of Work</h4>
<pre>nonce = <span class="n">0</span>
<span class="k">while</span> (sha256(header ‖ nonce) &lt; target) nonce++

<span class="c">target = 2²⁵⁶ × difficulty_ratio</span>
<span class="c">4 leading hex zeros ≈ 65,536 expected hashes (≈ 1 in 2¹⁶)</span></pre>` }
  ],
  theory: `
<div class="tbl-wrap"><table>
<tr><th>Algorithm</th><th>Output</th><th>Status</th><th>Use for</th></tr>
<tr><td>MD5</td><td>128</td><td>❌ broken</td><td>legacy checksums only</td></tr>
<tr><td>SHA-1</td><td>160</td><td>❌ broken</td><td>legacy / git object ids</td></tr>
<tr><td>SHA-256</td><td>256</td><td>✅ secure</td><td>blockchain, signatures, TLS</td></tr>
<tr><td>SHA-512</td><td>512</td><td>✅ secure</td><td>high-security, Ed25519</td></tr>
<tr><td>SHA-3 / Keccak</td><td>224–512</td><td>✅ secure</td><td>no length-extension, Ethereum</td></tr>
<tr><td>BLAKE3</td><td>256</td><td>✅ secure</td><td>very fast, tree-structured</td></tr>
</table></div>
<h4 style="color:var(--cyan);font-size:11px;margin:22px 0 10px">ALWAYS REMEMBER</h4>
<pre><span class="c">Never:</span>  password ‖ direct hash</span>
<span class="c">Always:</span> password → Argon2id / scrypt / bcrypt (slow + salted)

<span class="c">Integrity only?  → plain hash or HMAC
Authenticity?         → HMAC (shared secret)
Non-repudiation?      → digital signature (asymmetric)
Consensus?            → SHA-256 (PoW, blockchain)</span></pre>
<h4 style="color:var(--cyan);font-size:11px;margin:22px 0 10px">SHA-256 ROUND INTERNALS</h4>
<pre>64 rounds, each computes:
  Σ1(e) = rotr(e,6) ⊕ rotr(e,11) ⊕ rotr(e,25)
  Ch    = (e &amp; f) ⊕ (~e &amp; g)
  t1    = h + Σ1(e) + Ch + K[i] + W[i]

  Σ0(a) = rotr(a,2) ⊕ rotr(a,13) ⊕ rotr(a,22)
  Maj   = (a &amp; b) ⊕ (a &amp; c) ⊕ (b &amp; c)
  t2    = Σ0(a) + Maj

  (h,g,f,e,d,c,b,a) = (g,f,e,(d+t1),c,b,a,(t1+t2))</pre>
<div class="note"><b>Hardware acceleration is the point:</b> SHA-256 has a data-isolated SIMD-friendly structure; SHA-3's permutation needs 64-bit lanes, so GPUs and ASICs run SHA-256 ~10–50× faster. This is exactly why Bitcoin chose SHA-256 and Ethereum chose Keccak-256.</div>`,
  challenge: {
    title: 'Mine a Mini Block — 4 Leading Zeros',
    brief: 'A real SHA-256 proof-of-work miner runs in your browser. Difficulty: 16 bits (1 in 65,536).',
    modes: [
      { id: 'pow-mine', label: 'Mine Block',
        inputLabel: 'Block data to mine (any text)',
        placeholder: 'ALGOARCADE',
        sample: 'ALGOARCADE',
        tests: [
          { label: 'Hash must have 4 leading zeros', input: 'ALGOARCADE', check: 'leadingZeros' },
          { label: 'Arbitrary payload', input: 'cipher text 42', check: 'leadingZeros' },
          { label: 'Numeric payload', input: '1337', check: 'leadingZeros' }
        ],
        solution: `async function mine(data) {
  const target = '0'.repeat(4);       // 16 bits of work
  for (let nonce = 0; ; nonce++) {
    const hash = await sha256hex(data + nonce);
    if (hash.startsWith(target)) return { nonce, hash };
    if (nonce % 5000 === 0) await new Promise(r => setTimeout(r, 0)); // stay responsive
  }
}`
      }
    ],
    hints: ['Each block stores the previous block\'s hash — that chain is what makes tampering detectable.', 'You need ~65,536 hash attempts on average. Raise the difficulty and watch the runtime grow linearly.']
  }
},

'symmetric-encryption': {
  num: '02', icon: '🔑', title: 'Symmetric Encryption', diff: 'Intermediate', xp: 850,
  unlocks: 'asymmetric-encryption', time: '4h',
  desc: 'Deploy AES, DES, and block cipher modes for secure data transmission.',
  long: 'One shared key locks and unlocks. This quest covers the block cipher core, why ECB destroys privacy, and why GCM is the default answer — with a live AES-GCM round-trip in the playground.',
  tags: ['AES', 'DES', 'CBC', 'CTR', 'GCM', 'AEAD'],
  lessons: [
    { t: 'Stream Ciphers vs Block Ciphers', time: '25 min',
      d: 'XOR-based keystreams, block diffusion, and where each fits.',
      body: `<div class="tbl-wrap"><table><tr><th></th><th>Stream Cipher</th><th>Block Cipher</th></tr>
<tr><td>Structure</td><td>keystream ⊕ plaintext</td><td>fixed-size blocks</td></tr>
<tr><td>Block size</td><td>n/a</td><td>64 / 128 bits</td></tr>
<tr><td>Diffusion</td><td>by PRNG quality</td><td>built in (rounds)</td></tr>
<tr><td>Error behaviour</td><td>bit-flip cascades</td><td>contained per block</td></tr>
<tr><td>Examples</td><td>ChaCha20, RC4</td><td>AES, DES, 3DES</td></tr>
<tr><td>Use for</td><td>bulk data, constrained</td><td>general purpose + modes</td></tr></table></div>
<pre><span class="c">// Stream cipher — XOR is its own inverse</span>
C = P ⊕ KS
P = C ⊕ KS          <span class="c">// same operation decrypts</span>

<span class="c">// Block cipher — one round (simplified Feistel-ish)</span>
state = block
<span class="k">for</span> r <span class="k">in</span> <span class="n">1</span>..N: state = round(state, key)
<span class="c">// decryption runs the SAME rounds with REVERSED round keys</span></pre>
<div class="note pk"><b>RC4 is broken.</b> Biases in the keystream (2.7 GB keystream, initial-byte weakness) leak plaintext. It survives in TLS 1.2 as a fallback only. ChaCha20 replaced it.</div>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">DES — a cautionary tale</h4>
<pre>56-bit key  →  2⁵⁶ keyspace
            →  ~1998: built for 10⁻¹⁵ security, delivered 3× faster
            →  1999: brute-forced in 22 hours (EFF Deep Crack)
            →  today: minutes on consumer hardware

3DES: 112-bit effective — still slow (64-bit blocks) and banned in TLS 1.3.</pre>` },
    { t: 'AES Rounds & Substitution-Permutation', time: '30 min',
      d: 'The SPN structure that gives AES its security.',
      body: `<p>AES processes 128-bit blocks (a 4×4 byte column matrix) through 10/12/14 rounds:</p>
<pre><span class="c">AddRoundKey → SubBytes → ShiftRows → MixColumns
      ↑ (round 1..Nr-1, repeating)
    AddRoundKey → SubBytes → ShiftRows → AddRoundKey   (final, no MixColumns)</pre>
<div class="tbl-wrap"><table><tr><th>Key size</th><th>Rounds</th><th>Substitutions</th><th>Effective keys</th></tr>
<tr><td>128-bit</td><td>10</td><td>10</td><td>10</td></tr>
<tr><td>192-bit</td><td>12</td><td>12</td><td>12</td></tr>
<tr><td>256-bit</td><td>14</td><td>14</td><td>14</td></tr></table></div>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">SubBytes — S-box diffusion</h4>
<p>Each byte is replaced by <code>S[x] = A·x⁻¹ ⊕ b</code> in GF(2⁸) — a non-linear bijection. One byte change corrupts all bytes downstream.</p>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">ShiftRows — cross-row diffusion</h4>
<pre>row 0: 0 1 2 3     row 1: 1 2 3 0
row 1: 4 5 6 7  →  row 2: 2 3 0 1
row 2: 8 9 a b     row 3: 3 0 1 2
row 3: c d e f     (rotated left by r)</pre>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">MixColumns — GF(2⁸) matrix multiply</h4>
<pre>[02 03 01 01] · [s0]     s'0 = 02·s0 ⊕ 03·s1 ⊕ 01·s2 ⊕ 01·s3
[01 02 03 01]   [s1]     s'1 = 01·s0 ⊕ 02·s1 ⊕ 03·s2 ⊕ 01·s3
[01 01 02 03] · [s2]     s'2 = 01·s0 ⊕ 01·s1 ⊕ 02·s2 ⊕ 03·s3
[03 01 01 02]   [s3]     s'3 = 03·s0 ⊕ 01·s1 ⊕ 01·s2 ⊕ 02·s3</pre>
<div class="note cy"><b>Security argument:</b> AES-128 resists differential cryptanalysis (2¹²⁹ chosen plaintexts) and linear cryptanalysis (2¹²⁶ known plaintexts). The S-box is the only non-linear element — that is where the whole design's strength concentrates.</div>` },
    { t: 'Cipher Modes: CBC, CTR & GCM', time: '35 min',
      d: 'Why ECB leaks your data, and why GCM is the modern default.',
      body: `<h4 style="color:var(--cyan);font-size:11px;margin-bottom:9px">ECB — never use this</h4>
<pre><span class="c">P:  12 34 56 78 9a bc de f0 12 34 56 78   (repeated block!)</span>
<span class="c">C:  96 e7 3d 8f …  96 e7 3d 8f …         (identical block revealed)</span></pre>
<p>Deterministic, no IV — identical plaintext blocks produce identical ciphertext blocks. The famous "ECB penguin" exposes the outline of the image. Semantic leakage.</p>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">CBC — chaining, but integrity-blind</h4>
<pre>encrypt: C[i] = E(P[i] ⊕ C[i-1]),   C[-1] = IV
decrypt: P[i] = D(C[i]) ⊕ C[i-1]
<span class="c">✓ chaining removes ECB leakage</span>
<span class="c">✗ malleable: flipping C[i] bits corrupts P[i+1] predictably</span>
<span class="c">✗ needs padding (PKCS#7), 1 block waste</span></pre>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">CTR — counter mode, no padding</h4>
<pre>C[i] = P[i] ⊕ AES(key, IV ‖ counter_i)

<span class="c">✓ random access — decrypt any block independently</span>
<span class="c">✓ no padding, parallel encryption</span>
<span class="c">✗ NO INTEGRITY — ciphertext is fully malleable</span>
<span class="c">✗ counter reuse is catastrophic (keystream repeats)</span></pre>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">GCM — authenticated encryption (AEAD)</h4>
<pre>encrypt:
  J0   = IV ‖ 0x00000001            <span class="c">(12-byte IV, 96 bits)</span>
  tag  = GHASH(H, AAD, C) ⊕ E(key, J0)
  C[i] = P[i] ⊕ AES(key, J0 + counter_i)

<span class="c">✓ confidentiality  (CTR)
✓ integrity          (GHASH polynomial over GF(2¹²⁸))
✓ authenticity       (the tag proves the key holder produced it)</span></pre>
<div class="note cy"><b>Nonce rules with GCM:</b> the IV must be <b>unique per key</b>, 96 bits is the sweet spot (J0 skips the GHASH step), and <b>never reuse</b>. Reuse leaks the authentication subkey H and allows forgery. Since 2⁹⁶ birthday limits are reached around 2³² messages, some protocols derive nonces from a counter (AES-GCM-SIV tolerates misuse instead).</div>` }
  ],
  theory: `
<div class="tbl-wrap"><table>
<tr><th>Mode</th><th>IV/nonce</th><th>Padding</th><th>Integrity</th><th>Parallel</th><th>Verdict</th></tr>
<tr><td>ECB</td><td>none</td><td>yes</td><td>✗</td><td>✓</td><td>❌ never</td></tr>
<tr><td>CBC</td><td>16 B random</td><td>yes</td><td>✗</td><td>encrypt only</td><td>⚠️ + HMAC</td></tr>
<tr><td>CTR</td><td>unique counter</td><td>no</td><td>✗</td><td>✓</td><td>⚠️ + HMAC</td></tr>
<tr><td>GCM</td><td>12 B unique</td><td>no</td><td>✓ tag</td><td>✓</td><td>✅ default</td></tr>
<tr><td>ChaCha20-Poly1305</td><td>12 B unique</td><td>no</td><td>✓ tag</td><td>✓</td><td>✅ mobile</td></tr>
</table></div>
<h4 style="color:var(--cyan);font-size:11px;margin:22px 0 10px">RULE OF THUMB</h4>
<pre><span class="c">Encrypt-then-MAC:</span>
  EtM = (E(k1, m), MAC(k2, E(k1, m)))
  <span class="c">→ verify MAC FIRST, then decrypt. Preferred order.</span>

<span class="c">Encrypt-and-MAC (CBC):</span>
  (E(k1,m), MAC(k2, m))   <span class="c">→ weaker, padding-oracle prone</span></pre>
<h4 style="color:var(--cyan);font-size:11px;margin:22px 0 10px">STORAGE FORMAT</h4>
<pre>[ 1B version ][ 1B algo ][ 1B kdf ][ 2B salt ]
[ 12B nonce  ][   ciphertext   ][ 16B tag   ]</pre>
<div class="note pk"><b>Common fatal mistakes:</b> fixed/static IV in CTR or GCM · storing password-derived keys without a real KDF (use Argon2id/scrypt) · reusing a nonce across different keys · rolling your own composition instead of using an AEAD library.</div>`,
  challenge: {
    title: 'AES-GCM Encrypt & Decrypt Round-Trip',
    brief: 'Generates a fresh AES-GCM-256 key, encrypts, decrypts and authenticates. Uses your browser\'s Web Crypto API.',
    modes: [
      { id: 'aes-gcm', label: 'AES-GCM',
        inputLabel: 'Plaintext payload',
        placeholder: 'Attack at dawn. Bring the key.',
        sample: 'Attack at dawn. Bring the key.',
        tests: [
          { label: 'Round-trip + tag verified', input: 'Attack at dawn. Bring the key.', check: 'aesRoundTrip' },
          { label: 'Single character', input: 'x', check: 'aesRoundTrip' },
          { label: 'Unicode payload', input: '🔐 ключ 鍵', check: 'aesRoundTrip' }
        ],
        solution: `async function aesGcmRoundTrip(plaintext) {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit nonce
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext)
  );
  // ct includes the 128-bit auth tag as its last 16 bytes
  const back = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv }, key, ct
  );
  const recovered = new TextDecoder().decode(back);
  if (recovered !== plaintext) throw new Error('round-trip mismatch');
  return {
    nonce: toHex(iv),
    ciphertext: toHex(new Uint8Array(ct)),
    tag: toHex(new Uint8Array(ct).slice(-16)),
    verified: true
  };
}`
      }
    ],
    hints: ['The Web Crypto API attaches the auth tag to the ciphertext automatically — the last 16 bytes of the result.', 'Always generate a fresh 12-byte nonce with `crypto.getRandomValues` for every single message.', 'If your page is not on https or localhost, `crypto.subtle` is unavailable — that is a browser security rule, not a bug.']
  }
},

'asymmetric-encryption': {
  num: '03', icon: '🔐', title: 'Asymmetric Encryption', diff: 'Advanced', xp: 1100,
  unlocks: 'digital-signatures', time: '7h',
  desc: 'Master RSA, ECC, key exchange protocols, and public-private key cryptography.',
  long: 'Public-key cryptography solves key distribution: publish a key that anyone can encrypt with, keep the private one secret. This quest covers the number theory, RSA-OAEP, and elliptic curves — plus a live ECDH key agreement.',
  tags: ['RSA', 'ECC', 'OAEP', 'Diffie-Hellman', 'secp256k1'],
  lessons: [
    { t: 'Number Theory Foundations', time: '35 min',
      d: 'Modular arithmetic, Euler\'s totient, and modular inverses.',
      body: `<h4 style="color:var(--cyan);font-size:11px;margin-bottom:9px">Modular arithmetic</h4>
<pre>(a + b) mod m = ((a mod m) + (b mod m)) mod m
(a · b) mod m = ((a mod m) · (b mod m)) mod m

<span class="c">e.g.  7²⁰³ mod 11:</span>
  203 ÷ 11 = 18 r 5
  7⁵ mod 11 = 16807 mod 11 = 10
  7²⁰³ mod 11 = 10^203 mod 11 … fast-pow instead of brute force</pre>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">Euler\'s Totient φ(n)</h4>
<pre>φ(n) = count of integers in [1,n) coprime to n

φ(prime p) = p − 1
φ(p·q)     = (p−1)(q−1)      <span class="c">// distinct primes only</span>
φ(pᵏ)      = pᵏ − pᵏ⁻¹

<span class="c">e.g.  φ(12) = φ(2²·3) = 12·(1−½)·(1−⅓) = 4
      numbers coprime to 12: 1,5,7,11 → φ(12) = 4 ✓</span></pre>
<p>Euler's theorem: if gcd(a,n)=1 then <code>a^φ(n) ≡ 1 (mod n)</code>.</p>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">Modular inverse</h4>
<pre><span class="c">d = e⁻¹ mod φ(n)   exists iff  gcd(e, φ(n)) = 1</span>

Extended Euclidean Algorithm:
  a = 61, m = 53
  61 = 1·53 + 8
  53 = 6·8  + 5
  8  = 1·5  + 3
  5  = 1·3  + 2
  3  = 1·2  + 1
  → back-substitute: 1 = 61 − 11·53
  → 61⁻¹ mod 53 = −11 mod 53 = 42   ✓  (61·42 = 2562 = 48·53 + 18 … verified)</span></pre>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">Why primes must be big</h4>
<div class="tbl-wrap"><table><tr><th>Key size</th><th>Factoring attack</th></tr>
<tr><td>512-bit</td><td>hours (factordb, 1999 RSA-155)</td></tr>
<tr><td>1024-bit</td><td>theoretically broken; no new deployments</td></tr>
<tr><td>2048-bit</td><td>accepted minimum until ~2030</td></tr>
<tr><td>3072–4096</td><td>long-term / high assurance</td></tr></table></div>
<div class="note pk"><b>Quantum threat:</b> Shor's algorithm solves discrete logs and factoring in polynomial time on a fault-tolerant quantum computer. RSA and ECC <b>both</b> die. Post-quantum schemes (ML-KEM, ML-DSA, Ed25519 alternatives) are being deployed now.</div>` },
    { t: 'RSA Key Generation & OAEP', time: '35 min',
      d: 'Trapdoor one-way functions, and why textbook RSA is insecure.',
      body: `<pre><span class="n">KEY GENERATION</span>
1. p, q ← random primes of equal bit-length   <span class="c">// n = pq is semiprime</span>
2. n  = p · q
3. φ  = (p−1)(q−1)
4. e  ← random, gcd(e, φ) = 1                <span class="c">// public exponent, e=65537</span>
5. d  = e⁻¹ mod φ                            <span class="c">// private exponent</span>

<span class="n">PUBLIC</span>  (n, e)          <span class="c">// encrypt + verify</span>
<span class="n">PRIVATE</span> (n, d)          <span class="c">// decrypt + sign</span>

<span class="n">ENCRYPT</span>  c = mᵉ mod n
<span class="n">DECRYPT</span>  m = cᵈ mod n

<span class="c">// correctness proof (Euler):</span>
cᵈ = (mᵉ)ᵈ = m^(ed) = m^(1 + kφ) = m · (m^φ)^k = m · 1^k = m (mod n)</span></pre>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">Why textbook RSA fails</h4>
<pre><span class="n">MALLEABLE</span>   multiply ciphertexts:  c(m1·m2) = c(m1)·c(m2)
<span class="n">DETERMINISTIC</span> same plaintext → same ciphertext (no IV)
<span class="n">NOT SEMANTIC</span> the raw message is recoverable as an integer
   <span class="c">// never feed binary data straight to RSA</span></pre>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">RSA-OAEP / PSS</h4>
<pre>OAEP:  MGF1-SHA256 padding, label L=""  → randomized, semantically secure
PSS:   probabilistic signature scheme (salted, randomised)

<span class="c">RSA-OAEP limits (RFC 8017):</span>
  k = byte length of n
  max message = k − 2·hLen − 2   (hLen = 32 for SHA-256)
  → 2048-bit key (k=256): 190 bytes
  → 4096-bit key (k=512): 446 bytes</pre>
<div class="note cy"><b>Hybrid encryption is mandatory in practice:</b> RSA cannot encrypt anything large. Generate a random AES key, encrypt the data with AES-GCM, and encrypt that key with RSA-OAEP. This is exactly what TLS handshakes do.</div>` },
    { t: 'Elliptic Curve Cryptography & Key Exchange', time: '45 min',
      d: 'secp256k1, Ed25519, and ECDH — the maths and the protocol.',
      body: `<h4 style="color:var(--cyan);font-size:11px;margin-bottom:9px">The curve group</h4>
<pre>y² = x³ + ax + b  (mod p)      e.g. secp256k1: y² = x³ + 7 (mod 2³²−2³⁹−77)

Points + point addition form an abelian group.
Scalar multiply:  k·P = P+P+…+P (k times)
Discrete log: given k·P find k → infeasible ✓</pre>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">Why ECC wins</h4>
<div class="tbl-wrap"><table><tr><th></th><th>RSA</th><th>ECC</th></tr>
<tr><td>Key size for 128-bit security</td><td>3072 bits</td><td><b>256 bits</b></td></tr>
<tr><td>Signatures</td><td>bigger</td><td>smaller</td></tr>
<tr><td>Perf (scalar mult)</td><td>fast</td><td>slower per op</td></tr>
<tr><td>Signing cost</td><td>faster</td><td>slower (but fixed-size sigs)</td></tr>
<tr><td>Key gen</td><td>slow (big primes)</td><td>fast</td></tr></table></div>
<p>Verified-secure: <b>NIST P-256</b>, <b>secp256k1</b> (Bitcoin, TLS), <b>Curve25519</b> (X25519 key exchange).</p>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">Signature schemes</h4>
<pre><span class="c">ECDSA (NIST P-256):</span>
  k ← random; R = k·G; r = R.x mod n; s = k⁻¹(z + r·d) mod n
  → malleable! (r, n−s) is also valid. Use low-s normalisation.

<span class="c">EdDSA / Ed25519 (RFC 8032):</span>
  Schnorr-based, deterministic (k = H(sk, M)) → no nonce-reuse risk at all.
  Sign:  r = H(prefix, M); R = r·B; k = H(R, A, M); S = r + k·a
  Used by SSH, Tor, Signal, and most modern protocols.</pre>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">ECDH key exchange</h4>
<pre>Alice: a ← random scalar;  A = a·G           → sends A (public)
Bob:   b ← random scalar;  B = b·G           → sends B (public)

Alice shared:  s = a·B = a·b·G
Bob shared:    s = b·A = b·a·G                → identical ✓

Alice computes the FULL hash — she must not transmit the x-coordinate raw.
Ephemeral keys (ECDHE) per session → forward secrecy.</pre>
<div class="note cy"><b>Forward secrecy</b> means that even if a server's private key leaks years later, previously recorded traffic cannot be decrypted — because session keys came from ephemeral scalars that were discarded.</div>` }
  ],
  theory: `
<div class="tbl-wrap"><table>
<tr><th>Primitive</th><th>Curve / scheme</th><th>Public key</th><th>Signature</th><th>Used by</th></tr>
<tr><td>ECDH</td><td>P-256</td><td>65 B</td><td>—</td><td>TLS 1.3, NIST</td></tr>
<tr><td>ECDH</td><td>secp256k1</td><td>65 B</td><td>—</td><td>Bitcoin, TLS</td></tr>
<tr><td>ECDH</td><td>X25519</td><td>32 B</td><td>—</td><td>TLS 1.3, Signal</td></tr>
<tr><td>ECDSA</td><td>P-256</td><td>65 B</td><td>64 B</td><td>TLS, JWT ES256</td></tr>
<tr><td>ECDSA</td><td>secp256k1</td><td>65 B</td><td>64 B</td><td>Ethereum</td></tr>
<tr><td>EdDSA</td><td>Ed25519</td><td>32 B</td><td>64 B</td><td>SSH, Tor, Cardano</td></tr>
<tr><td>RSA</td><td>2048/3072/4096</td><td>256+ B</td><td>256+ B</td><td>legacy TLS, JWT RS256</td></tr>
</table></div>
<h4 style="color:var(--cyan);font-size:11px;margin:22px 0 10px">WHY ASYMMETRIC EXISTS</h3></h4>
<div class="note">
<b>The key distribution problem.</b> Symmetric crypto needs a shared secret before any data can flow. In a 1000-peer mesh that is ~500,000 secrets to distribute and rotate. Public-key crypto reduces it to 1000 public keys — and public keys need no secrecy, so they can be broadcast, published in directories and cached freely.
</div>
<h4 style="color:var(--cyan);font-size:11px;margin:22px 0 10px">HYBRID ENCRYPTION (what TLS actually does)</h4>
<pre>1. Client → ClientHello  (key share, cipher suites)
2. Server → ServerHello + its own key share + certificate
3. Both derive:  session = HKDF(ECDH_shared_secret, "tls13 derived", transcript_hash)
4. Symmetric keys = HKDF-Expand-Label(session, "key", "", 32)
5. All record data encrypted with AES-128-GCM or ChaCha20-Poly1305

<span class="c">Asymmetric: authenticate + agree on a tiny secret (fast, safe)
Symmetric:  encrypt the actual bulk stream (fast, efficient)</span></pre>
<div class="note pk"><b>Never roll your own:</b> use libsodium, OpenSSL, or the Web Crypto API. Side-channel attacks (timing, cache, power) break naive implementations far more often than the maths is broken.</div>`,
  challenge: {
    title: 'Compute an ECDH Shared Secret',
    brief: 'Real P-256 key agreement in your browser. Alice and Bob generate ephemeral keypairs and independently derive the same secret.',
    modes: [
      { id: 'ecdh', label: 'ECDH P-256',
        inputLabel: 'Session label (mixed into the transcript)',
        placeholder: 'session-42',
        sample: 'session-42',
        tests: [
          { label: 'Both sides agree', input: 'session-42', check: 'ecdhMatch' },
          { label: 'Short label', input: 'a', check: 'ecdhMatch' },
          { label: 'Unicode label', input: '🔑 встреча', check: 'ecdhMatch' }
        ],
        solution: `async function ecdh(label) {
  const alg = { name: 'ECDH', namedCurve: 'P-256' };

  const alice = await crypto.subtle.generateKey(alg, false, ['deriveBits']);
  const bob   = await crypto.subtle.generateKey(alg, false, ['deriveBits']);

  // Export each public key and import it as the peer's
  const bobPub   = await crypto.subtle.exportKey('raw', bob.publicKey);
  const alicePub = await crypto.subtle.exportKey('raw', alice.publicKey);
  const bobImp   = await crypto.subtle.importKey('raw', bobPub,   alg, false, []);
  const aliceImp = await crypto.subtle.importKey('raw', alicePub, alg, false, []);

  const aBits = await crypto.subtle.deriveBits({ name: 'ECDH', public: bobImp },   alice.privateKey, 256);
  const bBits = await crypto.subtle.deriveBits({ name: 'ECDH', public: aliceImp }, bob.privateKey,   256);

  const a = hex(new Uint8Array(aBits));
  const b = hex(new Uint8Array(bBits));
  if (a !== b) throw new Error('shared secrets diverged');

  // Final key = KDF(shared, transcript) — never transmit the raw scalar
  const sessionKey = hex(await crypto.subtle.digest(
    'SHA-256', new TextEncoder().encode(label + '|' + a)
  ));

  return { sharedSecret: a, sessionKey, match: true };
}`
      }
    ],
    hints: ['Never send the raw shared x-coordinate over the wire — always hash it with a transcript to bind the session to both parties.', 'If `crypto.subtle` is undefined your page is not a secure context (https or localhost).', 'Try opening this page locally via `http://localhost` to guarantee full Web Crypto access.']
  }
},

'digital-signatures': {
  num: '04', icon: '✍️', title: 'Digital Signatures', diff: 'Intermediate', xp: 950,
  unlocks: 'blockchain-architecture', time: '4h',
  desc: 'Implement authentication, non-repudiation, and message integrity verification.',
  long: 'A signature proves three things at once: the message is intact, it came from the holder of a specific private key, and that holder cannot plausibly deny it. This quest covers ECDSA vs EdDSA, PKI, and the attacks that signatures must survive.',
  tags: ['ECDSA', 'EdDSA', 'PKI', 'X.509', 'Replay'],
  lessons: [
    { t: 'ECDSA vs EdDSA', time: '30 min',
      d: 'Two schemes, same job, very different failure modes.',
      body: `<div class="tbl-wrap"><table><tr><th></th><th>ECDSA (P-256)</th><th>EdDSA (Ed25519)</th></tr>
<tr><td>Family</td><td>legacy NIST</td><td>Schnorr</td></tr>
<tr><td>Sig size</td><td>64 B (DER ~70 B)</td><td><b>64 B fixed</b></td></tr>
<tr><td>Nonce k</td><td><b>must be random</b></td><td>deterministic</td></tr>
<tr><td>Signing speed</td><td>faster</td><td>slower</td></tr>
<tr><td>Verify speed</td><td>slower</td><td>faster</td></tr>
<tr><td>Malleability</td><td><b>yes</b> — (r, n−s)</td><td><b>no</b></td></tr>
<tr><td>Adopted by</td><td>TLS, JWT ES256, WebAuthn</td><td>SSH, Tor, Cardano, libsodium</td></tr></table></div>
<div class="note pk"><b>ECDSA nonce reuse is catastrophic.</b> If k repeats for two messages you recover the private key d from just two signatures. This has burned real wallets (Android SecureRandom failures in 2013, hardware faults). Ed25519 derives k = H(sk, M) so it is deterministic and cannot happen by accident.</div>
<pre><span class="c">// ECDSA</span>
sign(M):
  z  = leftmost bits of H(M)
  k  ← RANDOM in [1, n−1]
  R  = k·G
  r  = R.x mod n
  s  = k⁻¹ (z + r·d) mod n
  return (r, s)

verify(M, (r,s)):
  reject unless 1 ≤ r,s &lt; n          <span class="c">// range check</span>
  w  = s⁻¹ mod n
  u1 = z·w mod n ;  u2 = r·w mod n
  X  = u1·G + u2·Q
  return X ≠ O  AND  X.x mod n == r</pre>
<pre><span class="c">// ECDSA key recovery from ONE reused nonce:</span>
  s1·k = z1 + r·d
  s2·k = z2 + r·d
  ───────────────────────────────
  d    = (z1 − z2) · (s1 − s2)⁻¹ mod n</pre>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">JWT algorithms — pick one</h4>
<pre><span class="c">HS256  → symmetric (shared secret). Two parties can FORGE it.</span>
          <span class="c">// never use HS256 where a client verifies its own token</span>
RS/ES/EdDSA → asymmetric. Client can verify without any secret.

<span class="c">alg=none attack: strip the header alg, some naive libs skip verification.</span>
<span class="c">→ always validate alg against an allowlist, server-side.</span></pre>` },
    { t: 'PKI, Certificates & X.509', time: '35 min',
      d: 'The chain of trust that binds an identity to a public key.',
      body: `<pre>Root CA (self-signed, trusted by the OS/browser store)
  │
  ├─── Intermediate CA  (signed by Root)
  │      │
  │      ├─── leaf: algoarcade.io   (signed by Intermediate)
  │      └─── leaf: api.algoarcade.io
  │
  └─── Other Root (cross-signed for redundancy)</pre>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">X.509 v3 fields that matter</h4>
<div class="tbl-wrap"><table><tr><th>Extension</th><th>Meaning</th></tr>
<tr><td>Basic Constraints</td><td>CA:true/false — may this cert sign others?</td></tr>
<tr><td>Key Usage</td><td>digitalSignature, keyEncipherment, keyCertSign…</td></tr>
<tr><td>Subject Alt Name</td><td>SAN — modern name matching (CN is deprecated)</td></tr>
<tr><td>Extended Key Usage</td><td>serverAuth / clientAuth / codeSigning</td></tr>
<tr><td>Authority Info Access</td><td>where to fetch the issuer + OCSP responder</td></tr>
<tr><td>CRL Distribution Points</td><td>where to fetch the revocation list</td></tr>
<tr><td>Certificate Transparency</td><td>public proof of issuance (SCT list)</td></tr></table></div>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">Revocation reality</h4>
<pre>CRL  → whole signed list, grows forever, often stale when you download it
OCSP → per-cert "is it revoked?" online check → privacy leak + extra latency
     → must set OCSP Must-Staple to prevent stripping
CRL/  → partitioned revocations, Google's modern mechanism
STAPLE→ server pre-fetched OCSP response, signed into the handshake ✓</pre>
<div class="note cy"><b>Certificate Transparency</b> solves a nasty attack: a CA could secretly issue a fraudulent certificate for your domain and nobody would know. CT logs are append-only public ledgers of every issued cert; monitors alert you instantly if one appears for your name.</div>` },
    { t: 'MITM Defense & Replay Attacks', time: '30 min',
      d: 'What signatures alone do not protect you from.',
      body: `<h4 style="color:var(--cyan);font-size:11px;margin-bottom:9px">Man-in-the-Middle anatomy</h4>
<pre>  Alice                    Mallory                    Bob
    │─── "hello" ────────────&gt;│                         │
    │&lt;── cert(Bob) [FAKE] ────│                         │
    │  ✅ looks valid, never   │─── "hello" ───────────&gt;│
    │  checked the CA…        │                         │
    │─── "secret" [encrypted] ─&gt;│─── "secret" ────────&gt;│
    │                         │&lt;── "ok" ───────────────│
    │&lt;── "ok" ────────────────│                         │
    <span class="c">✗ Alice believes she talks securely to Bob. She doesn't.</span></pre>
<pre><span class="c">DEFENCES</span>
<span class="n">1.</span> Certificate validation   → chain to a trusted root, check SAN + dates
<span class="n">2.</span> Hostname pinning         → HPKP (deprecated) / pin the SPKI leaf
<span class="n">3.</span> Don't accept invalid certs<span class="c"> ← the #1 real-world failure</span>
<span class="n">4.</span> Certificate Transparency → detect covert issuance
<span class="n">5.</span> HSTS + Secure Cookies    → downgrade resistance</span></pre>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">Replay attacks — signature validity alone is not enough</h4>
<pre><span class="c">Problem:</span> a valid signed message is valid forever.
<span class="c">"transfer 100 to Bob, sig=abc"  ← captured and re-sent 100×</span>

<span class="n">FRESHNESS SOLUTIONS</span>
<span class="n">1. Timestamp</span>      reject if |now − t| > window
<span class="n">2. Nonce + cache</span>  server issues a random challenge; reject reused nonces
<span class="n">3. Sequence number</span> reject anything ≤ last seen for that key
<span class="n">4. Expiry field</span>    hard TTL inside the signed payload

<span class="c">In blockchain terms:</span> each tx includes a per-account nonce.
Replay protection = the account's expected nonce + the chain's block sequence.</span></pre>
<div class="note pk"><b>JWT replay:</b> set <code>exp</code> (expiry), <code>nbf</code> (not before), <code>iat</code> (issued at), <code>jti</code> (unique id) — and store <code>jti</code> in a deny-list for immediate revocation. Access tokens should live 5–15 minutes at most.</div>` }
  ],
  theory: `
<h4 style="color:var(--cyan);font-size:11px;margin-bottom:10px">WHAT A SIGNATURE PROVES</h4>
<div class="tbl-wrap"><table><tr><th></th><th>HMAC</th><th>Signature</th></tr>
<tr><td>Integrity</td><td>✓</td><td>✓</td></tr>
<tr><td>Authenticity</td><td>shared knowledge</td><td><b>provable to 3rd parties</b></td></tr>
<tr><td>Non-repudiation</td><td>✗ (both could deny)</td><td>✓</td></tr>
<tr><td>Anyone can verify?</td><td>✗ needs the secret</td><td>✓ needs only the public key</td></tr>
<tr><td>Keys needed</td><td>1 shared</td><td>2 per party</td></tr>
</table></div>
<h4 style="color:var(--cyan);font-size:11px;margin:22px 0 10px">VERIFICATION CHECKLIST</h4>
<pre><span class="c">1. Hash the message — exactly as the signer did</span>
<span class="c">2. Check signature ranges: 1 ≤ r, s &lt; n   (ECDSA)</span>
<span class="c">3. Check public key is trusted / pinned</span>
<span class="c">4. Check algorithm allowlist — reject "none", reject algorithm swap</span>
<span class="c">5. Check validity window, nonce, sequence number</span>
<span class="c">6. Check the payload itself: who, what, permissions, amount, destination</span></pre>
<div class="note cy"><b>#6 is where systems actually break.</b> A perfectly valid signature over <code>{"to":"attacker","amt":"1000"}</code> proves the signer sent it — it does not make the contents safe. Parse, validate and authorise the payload after verifying, never before.</div>
<h4 style="color:var(--cyan);font-size:11px;margin:22px 0 10px">WHY ECDSA NEEDS LOW-S NORMALISATION</h4>
<pre>(r, s) and (r, n−s) are BOTH valid ECDSA signatures for the same message.
<span class="c">→ an attacker can flip the encoding to change the signature bytes</span>
<span class="c">→ breaks "signature is unique", enabling duplicate-transaction IDs</span>
<span class="c">→ always enforce s ≤ n/2 (BIP-62 / low-s rule)</span></pre>
<div class="note pk"><b>Ed25519 has none of these problems</b>: deterministic, non-malleable, fixed 64-byte signatures. New protocols should prefer it — or Ed448 for ~224-bit security.</div>`,
  challenge: {
    title: 'Sign a Transaction & Verify the Signature',
    brief: 'Generates a P-256 keypair, signs a transaction payload, then verifies it — including a tampered payload that must be rejected.',
    modes: [
      { id: 'sign-verify', label: 'Sign & Verify',
        inputLabel: 'Transaction payload',
        placeholder: 'ALGO->GUX | 1000 ALGO',
        sample: 'ALGO->GUX | 1000 ALGO',
        tests: [
          { label: 'Valid signature', input: 'ALGO->GUX | 1000 ALGO', check: 'sigValid' },
          { label: 'Minimal payload', input: 'ping', check: 'sigValid' },
          { label: 'Unicode payload', input: 'перевод 500 ₿', check: 'sigValid' }
        ],
        solution: `async function signAndVerify(payload) {
  const alg = { name: 'ECDSA', namedCurve: 'P-256' };
  const pair = await crypto.subtle.generateKey(alg, true, ['sign', 'verify']);
  const data = new TextEncoder().encode(payload);

  // 1. sign with the private key
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, pair.privateKey, data
  );

  // 2. verify with the PUBLIC key only
  const ok = await crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' }, pair.publicKey, sig, data
  );

  // 3. negative control — flipping a byte must invalidate it
  const tampered = new Uint8Array(data);
  tampered[0] ^= 0x01;
  const tamperedOk = await crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' }, pair.publicKey, sig, tampered
  );

  if (!ok) throw new Error('genuine signature failed to verify');
  if (tamperedOk) throw new Error('tampered payload verified — SECURITY FAILURE');

  return {
    payload,
    signature: hex(new Uint8Array(sig)),
    verified: true,
    tamperedRejected: !tamperedOk
  };
}`
      }
    ],
    hints: ['Verification only ever needs the public key — that is what makes signatures provable to third parties.', 'Always include a negative control test: tampered data must fail verification.', 'The deterministic ECDSA (RFC 6979) exists specifically so nonces never repeat.']
  }
},

'blockchain-architecture': {
  num: '05', icon: '⛓️', title: 'Blockchain Architecture', diff: 'Advanced', xp: 1300,
  unlocks: 'zero-knowledge-proofs', time: '8h',
  desc: 'Build distributed ledgers, consensus mechanisms, and smart contract foundations.',
  long: 'A blockchain is a replicated, append-only state machine kept consistent by economic consensus. This quest covers gossip, the PoW/PoS/BFT trade-off space, gas metering, and a hand-rolled 5-block chain with real validation.',
  tags: ['Consensus', 'PoW', 'PoS', 'BFT', 'EVM', 'Gas'],
  lessons: [
    { t: 'Distributed State Machines & P2P Gossip', time: '35 min',
      d: 'Replicated state machines, mempools, and why gossip actually converges.',
      body: `<p>A <b>replicated state machine</b>: every honest node runs the same deterministic function over the same ordered set of messages and must reach the same state.</p>
<pre><span class="n">Consensus = agreement on the ORDER of messages</span>
(order is everything: reordering two transfers changes the outcome)</pre>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">Gossip protocol — how a tx reaches everyone</h4>
<pre>Alice submits tx ──&gt; her node (mempool)
                        │
                        ├── broadcast to k random peers
                        │        └── each rebroadcasts to k more  (O(log n) hops)
                        │
                        ▼
  eventually the whole network has it — usually in &lt; 1 second</pre>
<p>This is <b>flooding to a fixed fan-out</b>, which gives O(log n) expected propagation — the same reason RumorRunning spreads exponentially. Nodes maintain a <b>bloom filter per peer</b> to avoid re-sending transactions that peer already has.</p>
<pre><span class="n">FORKS ARE NORMAL</span>
Alice's node hears about block 101 slightly before Bob's node.
Two different valid blocks 101 → the chain forks.
Consensus's job: decide which branch survives.</pre>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">Block anatomy</h4>
<pre>┌──────────────────────────────┐
│ prevHash   ← links to parent │  tamper here → every later hash breaks
│ merkleRoot ← all txids       │
│ timestamp                     │
│ nonce     ← PoW search space  │
│ difficulty target             │
├──────────────────────────────┤
│ block weight / gas limit      │
│ signature (for PoS)           │
└──────────────────────────────┘
  hash = H(header)              <span class="c">← the chain link</span></pre>` },
    { t: 'Consensus: PoW vs PoS vs BFT', time: '45 min',
      d: 'Three answers to "who gets to write the next block", and what each costs.',
      body: `<div class="tbl-wrap"><table>
<tr><th></th><th>Proof of Work</th><th>Proof of Stake</th><th>Byzantine Fault Tolerance</th></tr>
<tr><td>Resource</td><td>electricity + ASICs</td><td>locked capital (slashing)</td><td>≥ 1/3 honest stake</td></tr>
<tr><td>Finality</td><td>probabilistic (~6 blocks)</td><td>economic (~epochs)</td><td><b>deterministic, instant</b></td></tr>
<tr><td>Throughput</td><td>7 tps (BTC)</td><td>hundreds+</td><td>thousands</td></tr>
<tr><td>51% attack cost</td><td>recycle ~$2B/yr of power</td><td>buy + risk the stake</td><td>impossible by assumption</td></tr>
<tr><td>Validator set</td><td>permissionless</td><td>permissionless (bonds)</td><td><b>permissioned / known</b></td></tr>
<tr><td>Real examples</td><td>Bitcoin, Litecoin</td><td>Ethereum, Cardano, Solana</td><td>Hyperledger, Tendermint, PBFT</td></tr>
</table></div>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">Why Proof of Stake needed a slashing mechanism</h4>
<pre>PoW's cost is <b>external</b> — electricity bills you even if the chain dies.
PoS's cost is <b>internal</b> — your own stake. So the protocol must destroy it:
<span class="c">• slash for equivocation (signing two conflicting blocks) → total loss</span>
<span class="c">• slash for downtime (online but non-participating)   → small loss</span>
<span class="c">→ this is what makes PoS cryptoeconomic, not merely economic</span></pre>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">PBFT — the BFT family</h4>
<pre>N validators, f = ⌊(N−1)/3⌋ tolerated faults, need 2f+1 votes:

  PRE-PREPARE  → leader proposes an ordered block
  PREPARE     → validators broadcast "I have it"        (n−1 needed)
  COMMIT      → validators broadcast "I commit"        (2f+1 needed)
  FINALIZE    → committed block

<span class="c">Round 1: leader + n-1 prepares       = 2n-1 messages
Round 2: n commits (only after 2f+1 prepares)  = n   messages

<span class="c">→ O(n²) messages per block: superb for 21–100 validators,</span>
<span class="c">  hopeless for 100,000. Hence sharding + aggregate signatures.</span></pre>
<div class="note cy"><b>CAP is unavoidable.</b> During a network partition you cannot have both consensus and availability — classic CAP. Blockchains pick CP: halt rather than fork. Liveness vs safety is the real trade, and safety is always prioritised.</div>` },
    { t: 'Smart Contracts & Gas Metering', time: '40 min',
      d: 'The EVM, opcodes, gas, reentrancy and the EVM stack machine.',
      body: `<p>A smart contract is code deployed to an address in replicated state, executed identically by every node.</p>
<pre><span class="n">EVM</span> — a 256-bit stack machine
<span class="n">150 opcodes</span>: arithmetic, stack, memory, storage, control flow, LOG, CALL
<span class="n">256-bit words</span>, 32-byte slots, persistent world storage

<span class="n">Execution</span>
  CALL → check balance → deduct gas → run EVM → refund unused gas
  revert → ALL state changes in this call are rolled back, gas is still consumed</pre>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">Gas</h4>
<pre><span class="c">Every opcode has a fixed gas cost. Gas exists to:</span>
  1. Make infinite loops impossible
  2. Price DoS honestly — spam costs real money
  3. Subsidise block space (users pay, validators earn)

<span class="c">storage is ~1000× more expensive than memory:</span>
  SLOAD / SSTORE = 2100 gas cold, 100 gas warm
  → minimising storage writes is THE critical optimisation</pre>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">Reentrancy — the canonical exploit</h4>
<pre><span class="c">contract Bank {
  mapping(address =&gt; uint) balances;
  function withdraw() {
    require(balances[msg.sender] &gt; 0);
    msg.sender.call.value(balances[msg.sender])("");  <span class="c">// ⚠️ external call</span>
    balances[msg.sender] = 0;                          <span class="c">// state updated LATE</span>
  }
}</span>

<span class="c">Attacker contract re-enters withdraw() before the balance is zeroed,
draining funds on every pass. The 2016 DAO hack drained ~$60M this way.</span>
<pre><span class="c">FIX</span> — Checks, Effects, Interactions:
  1. CHECK   all conditions
  2. EFFECTS update all state        &lt;-- before any external call
  3. INTERACT external calls        &lt;-- last, and re-entrantly guarded</pre>
<div class="note pk"><b>Reentrancy guard:</b> a <code>nonReentrant</code> modifier setting a lock on entry and clearing it on exit also works — and composes better than memory ordering alone. Prefer both.</div>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">GAS COST COMPARISON</h4>
<div class="tbl-wrap"><table><tr><th>Operation</th><th>~Gas</th><th>Cost</th></tr>
<tr><td>Arithmetic (ADD)</td><td>3</td><td>cheap</td></tr>
<tr><td>Keccak (hash)</td><td>30 + 6/word</td><td>moderate</td></tr>
<tr><td>LOG (event)</td><td>375 + 375/topic</td><td>expensive</td></tr>
<tr><td>SSTORE (zero→nonzero)</td><td>20,000</td><td><b>very expensive</b></td></tr>
<tr><td>EXTCODESIZE</td><td>2,600</td><td>cold-access penalty</td></tr>
</table></div>` }
  ],
  theory: `
<h4 style="color:var(--cyan);font-size:11px;margin-bottom:10px">BLOCK VALIDATION CHECKLIST</h4>
<pre><span class="c">1. hash(block) == blockHash claimed by the child   (chain integrity)</span>
<span class="c">2. prevHash matches the actual parent header       (no orphan)</span>
<span class="c">3. timestamp within bounds (not &gt; 2h future, not older than median)</span>
<span class="c">4. PoW: H(header) &lt;= target for the claimed difficulty</span>
<span class="c">5. all transactions have valid signatures</span>
<span class="c">6. merkleRoot actually matches the transaction set</span>
<span class="c">7. total gas used ≤ gas limit, fees balance</span>
<span class="c">8. no double-spend across the whole UTXO/balance state</span>
<span class="c">9. for PoS: proposer was legitimately scheduled, no slashing evidence</span></pre>
<h4 style="color:var(--cyan);font-size:11px;margin:22px 0 10px">CONSENSUS DECISION GUIDE</h4>
<div class="tbl-wrap"><table>
<tr><th>If you need…</th><th>Use</th><th>Because</th></tr>
<tr><td>Max censorship resistance</td><td>PoW</td><td>no privileged keys exist</td></tr>
<tr><td>Low energy + high throughput</td><td>PoS</td><td>cheaper, faster, ecological</td></tr>
<tr><td>Deterministic finality &lt; 2s</td><td>BFT</td><td>no probabilistic confirmation</td></tr>
<tr><td>Known participants, high value</td><td>BFT / permissioned</td><td>identity removes Sybil risk</td></tr>
<tr><td>Storage + payments</td><td>PoS + sharding</td><td>optimised for data availability</td></tr>
</table></div>
<h4 style="color:var(--cyan);font-size:11px;margin:22px 0 10px">KNOWN WEAKNESSES TO RECOGNISE</h4>
<pre><span class="c">51% attack       → rewrite recent history (PoW/PoS), or halt (BFT ≥1/3)</span>
<span class="c">Long-range PoS   → long-range attack while validators are offline</span>
<span class="c">Nothing at stake → cheap historical fork; mitigated by checkpoints</span>
<span class="c">Grinding attacks → BFT leader schedules, vanity addresses</span>
<span class="c">EVM quirks       → gas refunds, tx ordering dependence, SELFDESTRUCT</span>
<span class="c">MEV             → sandwich/priority reordering within a block</span></pre>
<div class="note cy"><b>Reorgs are a feature, not a bug.</b> Every chain with probabilistic finality reverses small numbers of blocks regularly. Applications must be written to survive reorgs — never treat an unconfirmed transaction as final.</div>`,
  challenge: {
    title: 'Build & Validate a 5-Block Chain',
    brief: 'A real chain: each block hashes its contents plus the previous block hash. Then we verify every link.',
    modes: [
      { id: 'chain', label: '5-Block Chain',
        inputLabel: 'Genesis block data',
        placeholder: 'ALGOARCADE GENESIS',
        sample: 'ALGOARCADE GENESIS',
        tests: [
          { label: '5 blocks chain correctly', input: 'ALGOARCADE GENESIS', check: 'chainValid' },
          { label: 'Unicode genesis', input: '🔗 блок генезис', check: 'chainValid' },
          { label: 'Tamper detection', input: 'TAMPER ME', check: 'tamperCaught' }
        ],
        solution: `class Block {
  constructor(index, data, prevHash) {
    this.index    = index;
    this.data     = data;
    this.prevHash = prevHash;
    this.timestamp = Date.now();
    this.nonce     = 0;
    this.hash = this.computeHash();
  }
  computeHash() {
    return sha256hex(JSON.stringify({
      index: this.index, data: this.data,
      prevHash: this.prevHash, timestamp: this.timestamp, nonce: this.nonce
    }));
  }
  mine(difficulty = 4) {
    const target = '0'.repeat(difficulty);
    while (!this.computeHash().startsWith(target)) this.nonce++;
    this.hash = this.computeHash();
  }
}

function validateChain(chain) {
  for (let i = 1; i < chain.length; i++) {
    const prev = chain[i - 1], cur = chain[i];
    if (cur.prevHash !== prev.hash) return { valid: false, brokenAt: i, why: 'prevHash mismatch' };
    if (cur.hash !== cur.computeHash()) return { valid: false, brokenAt: i, why: 'content tampered' };
  }
  return { valid: true, length: chain.length };
}`
      }
    ],
    hints: ['Try tampering with block 3\'s data after building the chain — `validateChain` should report exactly which link broke.', 'Each block stores `prevHash`, so corrupting block N invalidates every block after it too.', 'Raise the mining difficulty in the code and watch block times scale linearly.']
  }
},

'zero-knowledge-proofs': {
  num: '06', icon: '👁️', title: 'Zero-Knowledge Proofs', diff: 'Legendary', xp: 1500,
  unlocks: null, time: '9h',
  desc: 'Achieve privacy-preserving verification with SNARKs, STARKs, and zk-SNARKs.',
  long: 'The endgame of the cryptography track. A ZK proof convinces a verifier you know a secret without revealing it. This quest covers the three formal properties, Fiat-Shamir, and the polynomial machinery behind SNARKs and STARKs.',
  tags: ['SNARKs', 'STARKs', 'Fiat-Shamir', 'KZG', 'Arithmetic Circuits'],
  lessons: [
    { t: 'Completeness, Soundness & Zero-Knowledge', time: '35 min',
      d: 'The three properties, formalised — and honest zero knowledge.',
      body: `<p>Setup: <b>Prover</b> knows a witness <code>w</code>. <b>Verifier</b> knows a statement <code>x</code> but not <code>w</code>. After the protocol the verifier is convinced <code>w</code> satisfies the statement.</p>
<pre><span class="n">COMPLETENESS</span>  An honest prover with a valid witness always convinces
               the verifier.  Pr[accept] ≈ 1

<span class="n">SOUNDNESS</span>     A cheating prover cannot convince the verifier
               except with negligible probability ε ≈ 2⁻¹²⁸.

<span class="n">ZERO-KNOWLEDGE</span> The transcript is simulatable by a verifier who
               knows NOTHING about w.
               → formally: there must exist an efficient simulator</span></pre>
<div class="note cy"><b>Why "negligible" not "impossible":</b> security is measured in bits. 2⁻¹²⁸ means an adversary needs more attempts than atoms in the observable universe. Soundness is a probability bound, not a yes/no property.</div>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">Interactive vs non-interactive</h4>
<pre><span class="c">INTERACTIVE (traditional)</span>
  Verifier: "I pick challenge c ∈ {0,1}"     ← adaptive, needs live channel
  Prover:   "here is r_c"
  Verifier: checks r_0 or r_1

<span class="c">Why we need to kill interaction:</span>
  • the verifier must be online for every proof (bad for blockchains)
  • proofs cannot be published, aggregated or reused
  • the verifier's challenge could be chosen after seeing the commitment
     <span class="c">→ Fiat-Shamir makes it non-interactive</span></pre>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">Ali Baba's Cave (the intuition)</h4>
<pre>        ┌──────┬──────┐
        │  A   │  B   │      A holds the secret word behind it
        └──┬───┴───┬──┘      A walks in — the verifier sees nothing
           │     │
        ───┴─────┴───

Verifier flips a fair coin, walks to a door:
  "open A"  → A shows A. Proves nothing (50% chance for anyone).
  "open B"  → A must refuse. Cannot without knowing B's word ✓
  "open both" → A walks out and shows BOTH words.
     A now reveals both secrets — but the verifier still does not
     know WHICH door A came from. So A proved "I know both"
     without revealing "which door is mine" ✓✓

<span class="c">Repeat 100× → cheating probability 2⁻¹⁰⁰.
The identity of the chosen door is still never revealed.</span></pre>
<div class="note pk"><b>The subtlety:</b> in the real protocol A's <i>choice</i> of which word to say first could leak a bit per round. Real schemes randomise the order precisely so this side-channel disappears.</div>` },
    { t: 'Fiat-Shamir Heuristic', time: '30 min',
      d: 'Turning interactive proofs into non-interactive ones with hashing.',
      body: `<p>The insight: if the verifier's challenge is already determined by messages the prover sent, the prover can compute it alone and no interaction is needed.</p>
<pre><span class="n">INTERACTIVE</span>
  Prover   → commit   = H(w, r)
  Verifier → c = V(commit)                    <span class="c">VERIFIER PICKS c</span>
  Prover   → response(c)

<span class="n">FIAT-SHAMIR</span>
  Prover   → commit   = H(w, r)
  Prover   → c = H(commit)                    <span class="c">PROVER DERIVES c</span>
  Prover   → response(c)

<span class="c">→ security relies on hash unpredictability:
  a prover cannot choose w and r to control H(commit) after the fact
  without grinding ~2¹²⁸ work.</span></pre>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">Sigma protocols (the workhorse)</h4>
<pre><span class="n">PROVE KNOWLEDGE OF DISCRETE LOG</span>
  Statement: g, h = g^w.  Prover knows w.

  ROUND 1  commitment:  r ← Z_q*,  t = g^r
  ROUND 2  challenge:   c = H(g, h, t)      <span class="c">Fiat-Shamir</span>
  ROUND 3  response:     z = r + c·w mod q

  VERIFY:  g^z == t · h^c        <span class="c">← one exponentiation, done</span>

<span class="c">Perfect hiding: (t, z) reveals nothing about w, because for ANY w
you can pick z freely and derive t = g^z / h^c. This is why Sigma
protocols are zero-knowledge without needing a simulator.</span></pre>
<div class="note cy"><b>What SNARKs/STARKs really are:</b> thousands of Sigma-like statements packed together and proved in one shot, using polynomial commitments to check all of them at once. The magic is amortisation — one proof for a million constraints.</div>` },
    { t: 'zk-SNARKs, zk-STARKs & Polynomial Commitments', time: '50 min',
      d: 'Arithmetic circuits, R1CS, KZG pairings, and the STARK/FRI pipeline.',
      body: `<h4 style="color:var(--cyan);font-size:11px;margin-bottom:9px">Step 1 — Circuit</h4>
<pre>you know x such that  x³ + x + 5 == 0

circuit:
  v0 = 1
  v1 = x
  v2 = x * v1     →  v2 = x²
  v3 = x * v2     →  v3 = x³
  v4 = v3 + v1 + v0
  enforce v4 == 0

<span class="c">Every multiplication gate becomes a CONSTRAINT. n gates → ~n constraints.</span></pre>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">Step 2 — R1CS (Rank-1 Constraint System)</h4>
<pre>A · z = B · z ∘ C · z

  <span class="c">A, B, C = sparse matrices (the circuit wiring)</span>
  z = [1, witness values…, input values…]   <span class="c">z ∘ z = element-wise product</span>

<span class="c">The prover must show z exists — WITHOUT revealing z.
That is the entire problem, restated algebraically.</span></pre>
<h4 style="color:var(--cyan);font-size:11px;margin:16px 0 9px">Step 3 — Polynomial commitments</h4>
<pre>Commit to a polynomial P of degree n:
  <span class="n">KZG (Groth16, Halo2)</span>
    one G1 point  [P(τ)]G1     + one G2 point [τ]G2
    open at a:    e(P(a)G1, G2) == e(Q(a)G1 + v·[τ]G2, [τ]G2)
    <span class="c">→ needs a TRUSTED SETUP (toxic waste!)</span>

  <span class="n">FRI (STARKs)</span>
    Merkle-commit the coefficients of P, then repeatedly
    split P = P_even(x²) + x·P_odd(x²) and commit each part.
    Verifier queries random points; FRI proves the
    remainder becomes constant (low degree).
    <span class="c">→ NO trusted setup, but 8–10× larger proofs</span></pre>
<div class="note pk"><b>The trusted-setup problem.</b> If the ceremony's toxic waste leaks, anyone can forge proofs — the Ethereum "Summit" event burned a pre-Moonbeam-era ceremony's waste live to permanently destroy that risk. Newer schemes (Halo2's IPA, PLONK) use a universal setup or none.</div>
<div class="tbl-wrap"><table>
<tr><th></th><th>zk-SNARK</th><th>zk-STARK</th></tr>
<tr><td>Trusted setup</td><td>❌ required (Groth16)</td><td>✅ none</td></tr>
<tr><td>Proof size</td><td><b>~200 B</b></td><td>~50–100 KB</td></tr>
<tr><td>Verify time</td><td><b>~2 ms</b></td><td>~10 ms</td></tr>
<tr><td>Prover time</td><td>fast</td><td>slow</td></tr>
<tr><td>Assumption</td><td>pairings + knowledge assumption</td><td><b>collision-resistant hash</b></td></tr>
<tr><td>Post-quantum</td><td>❌ broken by Shor</td><td>✅ secure</td></tr>
<tr><td>Used by</td><td>Zcash, Tornado, Scroll</td><td>Starknet, Polygon zkEVM</td></tr>
</table></div>
<h4 style="color:var(--cyan);font-size:11px;margin:18px 0 9px">WHERE ZK IS ACTUALLY USED</h4>
<pre><span class="c">Privacy</span>       Zcash shielded transactions — the only real ZK privacy layer
<span class="c">Scalability</span>   ZK-rollups batch 1000 txs into 1 (validity proof)
<span class="c">Identity</span>      prove "I'm over 18" without revealing your birthdate
<span class="c">Compliance</span>   prove "I'm not on a sanctions list" to an exchange
<span class="c">ML</span>            verify an inference ran on the right model, privately
<span class="c">Gaming/guessing</span> incremental verifiable computation (your challenge!)</pre>` }
  ],
  theory: `
<h4 style="color:var(--cyan);font-size:11px;margin-bottom:10px">THE THREE PROPERTIES, CONCRETELY</h4>
<div class="tbl-wrap"><table>
<tr><th>Property</th><th>Meaning</th><th>Failure looks like</th></tr>
<tr><td>Completeness</td><td>honest prover always succeeds</td><td>users locked out of valid proofs</td></tr>
<tr><td>Soundness</td><td>cheater caught w.p. ≥ 1−ε</td><td>forged proofs = total system failure</td></tr>
<tr><td>Zero-knowledge</td><td>transcript reveals nothing</td><td>metadata leakage defeats privacy</td></tr>
</table></div>
<h4 style="color:var(--cyan);font-size:11px;margin:22px 0 10px">GAS COST REALITY</h4>
<pre><span class="c">On Ethereum L1 (2024 era):</span>
  Groth16 verify   ≈  300,000 gas  ≈ $3–30
  zk-SNARK prove   ≈  2,000,000 gas (one-off, amortised)

<span class="c">Why rollups are viable:</span>
  1 proof covering 10,000 txs × $0.01 = $100 of user fees
  $30 proof cost / 10,000 txs = <span class="n">$0.003 per transaction</span> ✓

<span class="c">This arithmetic — proof cost &lt;&lt; batched user fees — is the
entire economic case for ZK rollups.</span></pre>
<h4 style="color:var(--cyan);font-size:11px;margin:22px 0 10px">CIRCUIT ENGINEERING</h4>
<pre><span class="c">Constraint count is the currency. Optimisations that matter:</span>
  • SHA-256 ≈ 30,000 constraints   (optimised: ~28k)
  • ECDSA verify ≈ 6,000 constraints
  • keccak256  ≈ 300 constraints    (Poseidon ≈ 200)
  • Merkle proof (32 levels) ≈ 3,000

<span class="c">Gotchas:</span>
  <span class="n">1. Under-constrained circuits</span> — missing constraints let a cheater
     satisfy the R1CS without knowing the witness. <span class="c">Always audit.</span>
  <span class="n">2. Non-native arithmetic</span> — emulating 256-bit field ops in a
     smaller prime field is wildly expensive
  <span class="n">3. Variable-size loops</span> — every array index must be bounded to a
     fixed maximum, or the circuit shape depends on witness data</pre>
<div class="note cy"><b>Why this quest is Legendary difficulty:</b> you are now reasoning about adversarial computation over algebraic fields while trying to prove nothing leaked. Getting the proof system right is easy; getting it <i>genuinely</i> zero-knowledge and <i>genuinely</i> sound is where real ZK engineers spend their careers.</div>`,
  challenge: {
    title: "Ali Baba's Cave — Interactive ZK Simulation",
    brief: 'A live simulation of the classic ZK interaction. The verifier never learns which door the prover chose.',
    modes: [
      { id: 'ali-baba', label: 'Ali Baba Cave',
        inputLabel: 'Number of rounds (higher = exponentially stronger)',
        placeholder: '100',
        sample: '100',
        tests: [
          { label: 'Honest prover succeeds', input: '100', check: 'zkHonest' },
          { label: 'Single round (weakest)', input: '1', check: 'zkHonest' },
          { label: 'Large round count', input: '512', check: 'zkHonest' },
          { label: 'Cheater is always caught', input: '100', check: 'zkCheaterCaught' }
        ],
        solution: `function aliBaba(rounds) {
  const secret   = Math.random() < 0.5 ? 'A' : 'B';   // prover's door
  const password = { A: 'sesame', B: 'open-sesame' };

  let transcript = [];
  let caught = 0;

  for (let i = 0; i < rounds; i++) {
    // verifier flips a fair coin AFTER the prover is inside
    const challenge = Math.random() < 0.5 ? 'A' : 'B';
    transcript.push('round ' + (i + 1) + ': verifier demands "' + challenge + '"');

    // honest prover: answer only when it can
    if (challenge === secret) {
      transcript.push('  → prover whispers: "' + password[secret] + '"');
    } else {
      transcript.push('  → prover refuses (cannot know this door)');
      caught++;  // a cheater pretending to be here must stall
    }
  }

  // soundness: a cheater who does not know the password
  // must fail at least once → detection w.p. 1 - 2^-rounds
  const cheatingChance = Math.pow(2, -rounds);

  return {
    rounds,
    secretRevealed: false,           // never sent over the wire
    verifierLearnedWhichDoor: false,
    soundnessError: cheatingChance,
    transcript
  };
}`
      }
    ],
    hints: ['The verifier\'s coin flip must come AFTER the prover commits to a door — otherwise the prover can predict it.', 'Detection probability for a cheater is 1 − 2⁻ⁿ. Ten rounds already gives 99.9%.', 'Notice the verifier never learns WHICH door was chosen — that is the zero-knowledge property in action.']
  }
}

};