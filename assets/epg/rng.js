/* ============================================================
   Seedable PRNG (mulberry32) + sampling helpers.
   Deterministic: same seed → same sequence → reproducible cases
   (needed for exam batches and self-tests).
   Pure ESM: usable in the browser and in Node.
   ============================================================ */

export function seedFrom(input) {
  if (typeof input === "number" && Number.isFinite(input)) return input >>> 0;
  let h = 2166136261 >>> 0;
  const s = String(input == null ? Date.now() : input);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function makeRng(seed) {
  let s = seedFrom(seed);
  function next() {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const rng = {
    seed: s,
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    range: (min, max) => min + next() * (max - min),
    bool: (p = 0.5) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    /* Box–Muller normal */
    normal: (mean = 0, sd = 1) => {
      const u = 1 - next(), v = next();
      return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    /* clamp helper */
    clampNormal: (mean, sd, lo, hi) => {
      let x = rng.normal(mean, sd);
      return x < lo ? lo : x > hi ? hi : x;
    },
    /* items[] with parallel weights[] */
    weightedPick: (items, weights) => {
      let total = 0;
      for (let i = 0; i < weights.length; i++) total += weights[i];
      let r = next() * total;
      for (let i = 0; i < items.length; i++) {
        r -= weights[i];
        if (r <= 0) return items[i];
      }
      return items[items.length - 1];
    },
    shuffle: (arr) => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        const t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }
  };
  return rng;
}
