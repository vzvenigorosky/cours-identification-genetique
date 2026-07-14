#!/usr/bin/env node
/* ============================================================
   Batch EPG generator (exam authoring).
   Reuses the same core as the in-browser lab (assets/epg).

   Examples:
     node tools/epg-cli.mjs --kit globalfiler --type mixture2 --ratio 3:1 --n 30 --seed 42 --out out/
     node tools/epg-cli.mjs --kit yfilerplus --type parent-child --n 10 --out out/ --png

   Writes NNN.svg + NNN.json per case and a manifest.csv.
   --png also rasterises each SVG (needs Playwright/Chromium).
   ============================================================ */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateCase, CASE_TYPES } from "../assets/epg/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const a = { kit: "globalfiler", type: "clean", n: 10, seed: "1", out: "out", width: 1300, png: false };
  for (let i = 2; i < argv.length; i++) {
    const t = argv[i];
    const val = argv[i + 1];
    switch (t) {
      case "--kit": a.kit = val; i++; break;
      case "--type": a.type = val; i++; break;
      case "--n": a.n = parseInt(val, 10); i++; break;
      case "--seed": a.seed = val; i++; break;
      case "--ratio": a.ratio = val.split(":").map(Number); i++; break;
      case "--template": a.template = parseFloat(val); i++; break;
      case "--degradation": a.degradation = parseFloat(val); i++; break;
      case "--width": a.width = parseInt(val, 10); i++; break;
      case "--out": a.out = val; i++; break;
      case "--png": a.png = true; break;
      case "--help": case "-h": a.help = true; break;
      default: break;
    }
  }
  return a;
}

function help() {
  console.log(`EPG batch generator
  --kit         globalfiler | yfilerplus         (default globalfiler)
  --type        ${CASE_TYPES.join(" | ")}
  --n           number of cases                   (default 10)
  --seed        base seed (string or number)      (default 1)
  --ratio       mixture ratio e.g. 3:1            (mixtures only)
  --template    template RFU                       (optional)
  --degradation degradation k 0..4                 (optional)
  --width       SVG width px                        (default 1300)
  --out         output directory                    (default out)
  --png         also rasterise to PNG (Playwright)`);
}

async function loadChromium() {
  const tries = ["playwright", "playwright-core", "/opt/node22/lib/node_modules/playwright/index.js"];
  for (const m of tries) {
    try {
      const mod = await import(m);
      const chromium = mod.chromium || (mod.default && mod.default.chromium);
      if (chromium) return chromium;
    } catch (_) { /* next */ }
  }
  return null;
}

async function main() {
  const a = parseArgs(process.argv);
  if (a.help) return help();
  if (!CASE_TYPES.includes(a.type)) {
    console.error(`Unknown --type "${a.type}". Valid: ${CASE_TYPES.join(", ")}`);
    process.exit(1);
  }
  fs.mkdirSync(a.out, { recursive: true });

  let chromium = null, browser = null, page = null;
  if (a.png) {
    chromium = await loadChromium();
    if (!chromium) console.warn("⚠ Playwright not found — skipping PNG output.");
    else { browser = await chromium.launch(); page = await browser.newPage(); }
  }

  const manifest = [["index", "seed", "kit", "type", "detail", "svg", "json"].join(",")];
  const pad = String(a.n).length;

  for (let i = 0; i < a.n; i++) {
    const seed = `${a.seed}-${i}`;
    const c = generateCase({
      kit: a.kit, type: a.type, seed,
      ratio: a.ratio, template: a.template, degradation: a.degradation, width: a.width
    });
    const base = String(i + 1).padStart(pad, "0");
    const svgFile = `${base}.svg`, jsonFile = `${base}.json`;
    fs.writeFileSync(path.join(a.out, svgFile), c.svg);
    fs.writeFileSync(path.join(a.out, jsonFile), JSON.stringify({ seed, spec: { kit: a.kit, type: a.type, ratio: a.ratio }, answerKey: c.answerKey }, null, 2));

    if (page) {
      await page.setContent(`<!doctype html><body style="margin:0">${c.svg}</body>`);
      const el = await page.$("svg");
      await el.screenshot({ path: path.join(a.out, `${base}.png`) });
    }

    const detail = c.answerKey.relationship || c.answerKey.mixtureRatioLabel || (a.type === "degraded" ? `k=${c.answerKey.degradation}` : "single");
    manifest.push([i + 1, seed, a.kit, a.type, detail, svgFile, jsonFile].join(","));
  }

  fs.writeFileSync(path.join(a.out, "manifest.csv"), manifest.join("\n") + "\n");
  if (browser) await browser.close();
  console.log(`✓ ${a.n} × ${a.kit}/${a.type} → ${a.out}/ (svg + json${a.png && page ? " + png" : ""}, manifest.csv)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
