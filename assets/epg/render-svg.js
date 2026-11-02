/* ============================================================
   GeneMapper-style SVG renderer: one panel per dye channel
   (x = fragment size in bp, y = RFU), coloured peaks, allele-call
   boxes (allele / size / height), analytical-threshold line, a
   LIZ size-standard strip, and a sample header.  Pure function
   (peaks → SVG string) so it also runs in Node for batch export.
   ============================================================ */
import { DYES, DYE_ORDER, maxSize, allelesOf, sizeOf } from "./panels.js";

const KIND_OPACITY = { allele: 1, minusA: 0.5, stutter: 0.55, pullup: 0.4, blob: 0.4, spike: 0.5, dropin: 0.85, noise: 0.3 };

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmtAllele(a) {
  return (typeof a === "number" && !Number.isInteger(a)) ? a.toFixed(1) : String(a);
}

/* A small seeded PRNG + a stable hash of the peak set, so the baseline noise is
   reproducible for a given trace but differs between cases (no more identical
   deterministic sine on every render). */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashPeaks(peaks) {
  let h = 2166136261;
  for (const p of peaks) {
    h = Math.imul(h ^ Math.round(p.size), 16777619);
    h = Math.imul(h ^ Math.round(p.height), 16777619);
  }
  return h >>> 0;
}

/* Short tag for an artefact kind, used by the answer-mode overlay. */
const ARTEFACT_TAG = { stutter: "St", minusA: "-A", pullup: "PU", dropin: "DI", spike: "Sp", blob: "Bl" };

/* GeneMapper-style bin call: a peak is labelled with the allele of the bin it
   falls in (nearest allele within ~0.5 bp in its dye), else "OL" (off-ladder).
   Artefacts landing in a bin thus read as ordinary allele calls — no artefact
   tag — so the analyst must recognise them. The peak's true `kind` stays in
   the data for grading. */
function binCall(kit, dye, size) {
  let best = null, bd = Infinity;
  for (const l of kit.loci) {
    if (l.dye !== dye) continue;
    for (const a of allelesOf(l)) {
      const d = Math.abs(sizeOf(l, a) - size);
      if (d < bd) { bd = d; best = a; }
    }
  }
  return (best != null && bd <= 0.5) ? fmtAllele(best) : "OL";
}

/* Focus on one locus's allele span, with a flank of at least two repeat units
   for n-1/n+1 stutter and minus-A. This is a viewport ONLY: no peak or
   genotype is modified, and all dye channels retain their shared size axis. */
export function locusViewport(kit, locusName) {
  const locus = kit.loci.find((l) => l.name === locusName);
  if (!locus) throw new RangeError("Unknown EPG locus for " + kit.id + ": " + locusName);
  const sizes = allelesOf(locus).map((a) => sizeOf(locus, a));
  const flank = Math.max(8, 2 * (locus.repeat || 4));
  return {
    locus: locus.name, dye: locus.dye,
    min: Math.max(80, Math.min(...sizes) - flank),
    max: Math.max(...sizes) + flank
  };
}

export function renderEPG(kit, sim, opts = {}) {
  const W = opts.width || 1300;
  const padL = 62, padR = 18, headerH = 34, panelH = 120, gap = 8, axisH = 26, liziH = 20;
  const zoom = opts.zoomLocus ? locusViewport(kit, opts.zoomLocus) : null;
  const X0 = zoom ? zoom.min : 90, X1 = zoom ? zoom.max : maxSize(kit) + 15;
  // Use the same simulated peaks in both views; only the SVG viewport changes.
  const visiblePeaks = zoom ? sim.peaks.filter((p) => p.size >= X0 && p.size <= X1) : sim.peaks;
  const dyes = DYE_ORDER;
  const totalH = headerH + dyes.length * (panelH + gap) + liziH + axisH;

  const xOf = (size) => padL + ((size - X0) / (X1 - X0)) * (W - padL - padR);

  // display y-max. With opts.dispMax, use a FIXED ceiling (like a fixed-scale
  // GeneMapper view): peaks above it clip/flat-top (off-scale) and small peaks
  // such as pull-up keep their true proportion. Otherwise auto-scale to the
  // tallest non-saturated true allele (default; unchanged).
  let disp;
  if (opts.dispMax != null) {
    disp = opts.dispMax;
  } else {
    disp = sim.thresholds.st * 1.3;
    for (const p of visiblePeaks) if (p.kind === "allele" && !p.saturated) disp = Math.max(disp, p.height);
    disp = Math.max(disp * 1.12, 500);
  }

  const parts = [];
  const zoomAttr = zoom ? ` data-zoom-locus="${esc(zoom.locus)}" data-zoom-min="${X0}" data-zoom-max="${X1}"` : "";
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${totalH}" width="${W}" height="${totalH}"${zoomAttr} font-family="Segoe UI, Arial, sans-serif" style="background:#fff">`);
  parts.push(`<rect x="0" y="0" width="${W}" height="${totalH}" fill="#ffffff"/>`);

  // header
  const title = esc(opts.title || kit.label);
  const sample = esc(opts.sampleLabel || "Sample");
  parts.push(`<text x="${padL}" y="22" font-size="14" font-weight="700" fill="#24292e">${sample}</text>`);
  parts.push(`<text x="${W - padR}" y="22" font-size="12" fill="#6a737d" text-anchor="end">${title}</text>`);
  if (zoom) parts.push(`<text x="${Math.round(W / 2)}" y="22" font-size="12" font-weight="600" fill="#57606a" text-anchor="middle">${esc(zoom.locus)} · ${X0}–${X1} bp</text>`);

  // Baseline-noise seed: stable for a given trace, different between cases.
  const noiseSeed = (opts.noiseSeed != null ? opts.noiseSeed : hashPeaks(sim.peaks)) >>> 0;

  dyes.forEach((dyeKey, i) => {
    const dye = DYES[dyeKey];
    const top = headerH + i * (panelH + gap);
    const bottom = top + panelH;
    const plotH = panelH - 16;
    const yOf = (h) => bottom - (Math.min(h, disp) / disp) * plotH;

    // panel frame + alt background
    parts.push(`<rect x="${padL}" y="${top}" width="${W - padL - padR}" height="${panelH}" fill="${zoom && dyeKey === zoom.dye ? "#f4f8fb" : (i % 2 ? "#fbfcfd" : "#ffffff")}" stroke="#e1e4e8"/>`);
    // dye label
    parts.push(`<text x="6" y="${top + 14}" font-size="11" font-weight="700" fill="${dye.color}">${dye.label}</text>`);
    // baseline
    parts.push(`<line x1="${padL}" y1="${bottom}" x2="${W - padR}" y2="${bottom}" stroke="#cbd3da"/>`);
    // analytical threshold (AT) and, when it fits, the stochastic threshold (ST)
    const atY = yOf(sim.thresholds.at);
    parts.push(`<line x1="${padL}" y1="${atY.toFixed(1)}" x2="${W - padR}" y2="${atY.toFixed(1)}" stroke="#c8ccd1" stroke-dasharray="3 3"/>`);
    parts.push(`<text x="${padL + 2}" y="${(atY - 2).toFixed(1)}" font-size="7" fill="#9aa0a6">AT</text>`);
    if (sim.thresholds.st && sim.thresholds.st < disp) {
      const stY = yOf(sim.thresholds.st);
      parts.push(`<line x1="${padL}" y1="${stY.toFixed(1)}" x2="${W - padR}" y2="${stY.toFixed(1)}" stroke="#d9a441" stroke-width="0.8" stroke-dasharray="2 3"/>`);
      parts.push(`<text x="${padL + 2}" y="${(stY - 2).toFixed(1)}" font-size="7" fill="#b9802a">ST</text>`);
    }

    // allele-bin position marks (teaching overlay) — opt-in via opts.showBins
    if (opts.showBins) {
      kit.loci.filter((l) => l.dye === dyeKey).forEach((l) => {
        for (const a of allelesOf(l)) {
          const sz = sizeOf(l, a);
          if (sz < X0 || sz > X1) continue;
          const bx = xOf(sz);
          parts.push(`<line class="bin" x1="${bx.toFixed(1)}" y1="${bottom}" x2="${bx.toFixed(1)}" y2="${(bottom - 6).toFixed(1)}" stroke="#aeb6bf" stroke-width="0.6" opacity="0.75"/>`);
        }
      });
    }
    // y ticks (0 and disp)
    parts.push(`<text x="${padL - 4}" y="${bottom}" font-size="8" fill="#98a0a8" text-anchor="end">0</text>`);
    parts.push(`<text x="${padL - 4}" y="${top + 10}" font-size="8" fill="#98a0a8" text-anchor="end">${Math.round(disp)}</text>`);

    // baseline noise (subtle) — a seeded, smoothed random walk per dye, so it
    // looks like real baseline fluctuation and differs from case to case.
    if (sim.noise) {
      const rnd = mulberry32((noiseSeed + i * 0x9e3779b1) >>> 0);
      let d = `M ${padL} ${bottom}`, w = 0;
      for (let x = padL; x <= W - padR; x += 5) {
        w = w * 0.55 + (rnd() - 0.5) * 2 * 0.45;
        const n = bottom - Math.abs(w) * 5;
        d += ` L ${x} ${n.toFixed(1)}`;
      }
      parts.push(`<path d="${d}" fill="none" stroke="${dye.color}" stroke-width="0.5" opacity="0.18"/>`);
    }

    // peaks in this dye. Each path carries class "pk" + data-* and a <title> so
    // a viewer can hover/tap it to read size (bp) and RFU; the artefact `kind` is
    // added only when opts.revealKind (answer mode), so exercises don't leak it.
    const dpk = visiblePeaks.filter((p) => p.dye === dyeKey);
    for (const p of dpk) {
      const x = xOf(p.size);
      const yTop = yOf(p.height);
      // Exercise mode hides ground-truth opacity cues; default renders unchanged.
      const op = opts.neutralArtifacts ? 1 : (KIND_OPACITY[p.kind] || 0.5);
      // off-scale: truly saturated, or (with a fixed ceiling) any peak at/above it
      const offscale = p.saturated || (opts.dispMax != null && p.height >= disp);
      let attrs = `class="pk" data-size="${p.size}" data-rfu="${p.height}" data-dye="${dyeKey}" data-locus="${esc(p.locus || "")}" data-called="${p.called ? 1 : 0}"`;
      let title = `${p.size} bp · ${p.height} RFU`;
      if (opts.revealKind) { attrs += ` data-kind="${esc(p.kind)}"`; title += ` · ${p.kind}`; }
      const d = offscale
        ? `M ${(x - 3).toFixed(1)} ${bottom} L ${(x - 2).toFixed(1)} ${(top + 2).toFixed(1)} L ${(x + 2).toFixed(1)} ${(top + 2).toFixed(1)} L ${(x + 3).toFixed(1)} ${bottom} Z`
        : `M ${(x - 2.6).toFixed(1)} ${bottom} L ${x.toFixed(1)} ${yTop.toFixed(1)} L ${(x + 2.6).toFixed(1)} ${bottom} Z`;
      parts.push(`<path ${attrs} d="${d}" fill="${dye.color}" opacity="${op}"><title>${esc(title)}</title></path>`);
    }
    // marker (locus) names across the top of the panel, each centred over
    // its allele size-range with a thin bracket and a white halo for legibility.
    kit.loci.filter((l) => l.dye === dyeKey).forEach((l) => {
      const al = allelesOf(l);
      const left = sizeOf(l, al[0]), right = sizeOf(l, al[al.length - 1]);
      if (right < X0 || left > X1) return;
      const xs = xOf(Math.max(X0, left));
      const xe = xOf(Math.min(X1, right));
      const xm = (xs + xe) / 2;
      const w = Math.max(16, l.name.length * 5.4);
      parts.push(
        `<line x1="${xs.toFixed(1)}" y1="${(top + 13).toFixed(1)}" x2="${xe.toFixed(1)}" y2="${(top + 13).toFixed(1)}" stroke="#d0d7de" stroke-width="0.75"/>` +
        `<rect x="${(xm - w / 2).toFixed(1)}" y="${(top + 2).toFixed(1)}" width="${w.toFixed(1)}" height="11" fill="#ffffff" opacity="0.82"/>` +
        `<text x="${xm.toFixed(1)}" y="${(top + 10).toFixed(1)}" font-size="8" font-weight="600" fill="#57606a" text-anchor="middle">${esc(l.name)}</text>`
      );
    });

    // allele-call labels for called peaks (drawn last, on top).
    // Allele number + RFU placed UNDER the peak, near the baseline (not above).
    // White halo + vertical stagger lifts crowded neighbours upward.
    let lastLabelX = -99, row = 0;
    for (const p of dpk) {
      if (!p.called) continue;
      const x = xOf(p.size);
      row = (x - lastLabelX < 22) ? (row + 1) % 2 : 0;
      lastLabelX = x;
      const yA = bottom - 11 - row * 19;        // allele line, just above the baseline
      const label = esc(binCall(kit, p.dye, p.size));
      parts.push(
        `<rect x="${(x - 9).toFixed(1)}" y="${(yA - 8).toFixed(1)}" width="18" height="17" fill="#ffffff" opacity="0.82"/>` +
        `<text x="${x.toFixed(1)}" y="${yA.toFixed(1)}" font-size="8.5" font-weight="700" fill="${dye.color}" text-anchor="middle">${label}</text>` +
        `<text x="${x.toFixed(1)}" y="${(yA + 8).toFixed(1)}" font-size="7" fill="#8a929a" text-anchor="middle">${p.height}</text>`
      );
    }

    // Answer-mode artefact overlay (#50): ring + tag each visible artefact
    // (above AT) and each off-ladder true allele, so the answer key points out
    // exactly what the analyst had to recognise. Opt-in via opts.revealKind.
    if (opts.revealKind) {
      let lastOX = -99, orow = 0;
      for (const p of dpk) {
        const isOL = p.kind === "allele" && p.offladder;
        const isArt = p.kind !== "allele" && p.height >= sim.thresholds.at;
        if (!isOL && !isArt) continue;
        const tag = isOL ? "OL" : (ARTEFACT_TAG[p.kind] || "?");
        const col = isOL ? "#b9802a" : "#b5179e";
        const x = xOf(p.size), yt = yOf(p.height);
        orow = (x - lastOX < 16) ? (orow + 1) % 3 : 0; // stagger crowded tags over 3 rows
        lastOX = x;
        parts.push(
          `<circle cx="${x.toFixed(1)}" cy="${(yt - 3).toFixed(1)}" r="5" fill="none" stroke="${col}" stroke-width="1.1"/>` +
          `<text x="${x.toFixed(1)}" y="${(yt - 10 - orow * 7).toFixed(1)}" font-size="6.5" font-weight="700" fill="${col}" text-anchor="middle">${tag}</text>`
        );
      }
    }
  });

  // LIZ size-standard strip
  const lizTop = headerH + dyes.length * (panelH + gap);
  parts.push(`<rect x="${padL}" y="${lizTop}" width="${W - padL - padR}" height="${liziH}" fill="#fff7ef" stroke="#f0d9c0"/>`);
  parts.push(`<text x="6" y="${lizTop + 13}" font-size="10" font-weight="700" fill="${DYES.LIZ.color}">LIZ</text>`);
  for (let s = zoom ? Math.ceil(X0 / 25) * 25 : 100; s <= X1; s += 25) {
    const x = xOf(s);
    parts.push(`<path d="M ${(x - 1.5).toFixed(1)} ${lizTop + liziH} L ${x.toFixed(1)} ${lizTop + 4} L ${(x + 1.5).toFixed(1)} ${lizTop + liziH} Z" fill="${DYES.LIZ.color}" opacity="0.8"/>`);
  }

  // size axis
  const axisY = lizTop + liziH;
  const sizeStep = zoom ? (X1 - X0 <= 44 ? 5 : 10) : 50;
  for (let s = zoom ? Math.ceil(X0 / sizeStep) * sizeStep : 100; s <= X1; s += sizeStep) {
    const x = xOf(s);
    parts.push(`<line x1="${x.toFixed(1)}" y1="${axisY}" x2="${x.toFixed(1)}" y2="${axisY + 4}" stroke="#98a0a8"/>`);
    parts.push(`<text x="${x.toFixed(1)}" y="${axisY + 16}" font-size="9" fill="#6a737d" text-anchor="middle">${s}</text>`);
  }
  parts.push(`<text x="${W - padR}" y="${axisY + 16}" font-size="9" fill="#98a0a8" text-anchor="end">bp</text>`);

  parts.push(`</svg>`);
  return { svg: parts.join(""), width: W, height: totalH };
}

/* Stack several sample EPGs into one SVG (kinship pairs, replicates). */
export function renderStack(renders, width) {
  const gapY = 14;
  const totalH = renders.reduce((s, r) => s + r.height, 0) + gapY * (renders.length - 1);
  let y = 0;
  const inner = renders.map((r) => {
    // stripOuter removes each standalone SVG root. Preserve zoom metadata
    // on its nested viewport so stacked control/sample tracks stay inspectable.
    const zoomMeta = (r.svg.match(/ data-zoom-locus="[^"]+" data-zoom-min="[^"]+" data-zoom-max="[^"]+"/) || [""])[0];
    const g = `<svg x="0" y="${y}" width="${r.width}" height="${r.height}" viewBox="0 0 ${r.width} ${r.height}"${zoomMeta}>${stripOuter(r.svg)}</svg>`;
    y += r.height + gapY;
    return g;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${totalH}" width="${width}" height="${totalH}">${inner}</svg>`;
}

function stripOuter(svg) {
  return svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
}
