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

export function renderEPG(kit, sim, opts = {}) {
  const W = opts.width || 1300;
  const padL = 62, padR = 18, headerH = 34, panelH = 120, gap = 8, axisH = 26, liziH = 20;
  const X0 = 90, X1 = maxSize(kit) + 15;
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
    for (const p of sim.peaks) if (p.kind === "allele" && !p.saturated) disp = Math.max(disp, p.height);
    disp = Math.max(disp * 1.12, 500);
  }

  const parts = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${totalH}" width="${W}" height="${totalH}" font-family="Segoe UI, Arial, sans-serif" style="background:#fff">`);
  parts.push(`<rect x="0" y="0" width="${W}" height="${totalH}" fill="#ffffff"/>`);

  // header
  const title = esc(opts.title || kit.label);
  const sample = esc(opts.sampleLabel || "Sample");
  parts.push(`<text x="${padL}" y="22" font-size="14" font-weight="700" fill="#24292e">${sample}</text>`);
  parts.push(`<text x="${W - padR}" y="22" font-size="12" fill="#6a737d" text-anchor="end">${title}</text>`);

  dyes.forEach((dyeKey, i) => {
    const dye = DYES[dyeKey];
    const top = headerH + i * (panelH + gap);
    const bottom = top + panelH;
    const plotH = panelH - 16;
    const yOf = (h) => bottom - (Math.min(h, disp) / disp) * plotH;

    // panel frame + alt background
    parts.push(`<rect x="${padL}" y="${top}" width="${W - padL - padR}" height="${panelH}" fill="${i % 2 ? "#fbfcfd" : "#ffffff"}" stroke="#e1e4e8"/>`);
    // dye label
    parts.push(`<text x="6" y="${top + 14}" font-size="11" font-weight="700" fill="${dye.color}">${dye.label}</text>`);
    // baseline
    parts.push(`<line x1="${padL}" y1="${bottom}" x2="${W - padR}" y2="${bottom}" stroke="#cbd3da"/>`);
    // analytical threshold
    const atY = yOf(sim.thresholds.at);
    parts.push(`<line x1="${padL}" y1="${atY.toFixed(1)}" x2="${W - padR}" y2="${atY.toFixed(1)}" stroke="#c8ccd1" stroke-dasharray="3 3"/>`);
    // y ticks (0 and disp)
    parts.push(`<text x="${padL - 4}" y="${bottom}" font-size="8" fill="#98a0a8" text-anchor="end">0</text>`);
    parts.push(`<text x="${padL - 4}" y="${top + 10}" font-size="8" fill="#98a0a8" text-anchor="end">${Math.round(disp)}</text>`);

    // baseline noise (subtle)
    if (sim.noise) {
      let d = `M ${padL} ${bottom}`;
      for (let x = padL; x <= W - padR; x += 6) {
        const n = bottom - Math.abs(Math.sin(x * 12.9 + i * 7.3) * Math.cos(x * 4.1)) * 5;
        d += ` L ${x} ${n.toFixed(1)}`;
      }
      parts.push(`<path d="${d}" fill="none" stroke="${dye.color}" stroke-width="0.5" opacity="0.18"/>`);
    }

    // peaks in this dye
    const dpk = sim.peaks.filter((p) => p.dye === dyeKey);
    for (const p of dpk) {
      const x = xOf(p.size);
      const yTop = yOf(p.height);
      const op = KIND_OPACITY[p.kind] || 0.5;
      // off-scale: truly saturated, or (with a fixed ceiling) any peak at/above it
      const offscale = p.saturated || (opts.dispMax != null && p.height >= disp);
      if (offscale) {
        // flat-topped
        parts.push(`<path d="M ${(x - 3).toFixed(1)} ${bottom} L ${(x - 2).toFixed(1)} ${(top + 2).toFixed(1)} L ${(x + 2).toFixed(1)} ${(top + 2).toFixed(1)} L ${(x + 3).toFixed(1)} ${bottom} Z" fill="${dye.color}" opacity="${op}"/>`);
      } else {
        parts.push(`<path d="M ${(x - 2.6).toFixed(1)} ${bottom} L ${x.toFixed(1)} ${yTop.toFixed(1)} L ${(x + 2.6).toFixed(1)} ${bottom} Z" fill="${dye.color}" opacity="${op}"/>`);
      }
    }
    // marker (locus) names across the top of the panel, each centred over
    // its allele size-range with a thin bracket and a white halo for legibility.
    kit.loci.filter((l) => l.dye === dyeKey).forEach((l) => {
      const al = allelesOf(l);
      const xs = xOf(sizeOf(l, al[0]));
      const xe = xOf(sizeOf(l, al[al.length - 1]));
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
      const label = esc(p.offladder ? "OL" : p.label);
      parts.push(
        `<rect x="${(x - 9).toFixed(1)}" y="${(yA - 8).toFixed(1)}" width="18" height="17" fill="#ffffff" opacity="0.82"/>` +
        `<text x="${x.toFixed(1)}" y="${yA.toFixed(1)}" font-size="8.5" font-weight="700" fill="${dye.color}" text-anchor="middle">${label}</text>` +
        `<text x="${x.toFixed(1)}" y="${(yA + 8).toFixed(1)}" font-size="7" fill="#8a929a" text-anchor="middle">${p.height}</text>`
      );
    }
  });

  // LIZ size-standard strip
  const lizTop = headerH + dyes.length * (panelH + gap);
  parts.push(`<rect x="${padL}" y="${lizTop}" width="${W - padL - padR}" height="${liziH}" fill="#fff7ef" stroke="#f0d9c0"/>`);
  parts.push(`<text x="6" y="${lizTop + 13}" font-size="10" font-weight="700" fill="${DYES.LIZ.color}">LIZ</text>`);
  for (let s = 100; s <= X1; s += 25) {
    const x = xOf(s);
    parts.push(`<path d="M ${(x - 1.5).toFixed(1)} ${lizTop + liziH} L ${x.toFixed(1)} ${lizTop + 4} L ${(x + 1.5).toFixed(1)} ${lizTop + liziH} Z" fill="${DYES.LIZ.color}" opacity="0.8"/>`);
  }

  // size axis
  const axisY = lizTop + liziH;
  for (let s = 100; s <= X1; s += 50) {
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
    const g = `<svg x="0" y="${y}" width="${r.width}" height="${r.height}" viewBox="0 0 ${r.width} ${r.height}">${stripOuter(r.svg)}</svg>`;
    y += r.height + gapY;
    return g;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${totalH}" width="${width}" height="${totalH}">${inner}</svg>`;
}

function stripOuter(svg) {
  return svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
}
