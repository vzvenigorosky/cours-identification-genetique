# Anonymous usage counts (GoatCounter) — issue #102

**Status: shipped switched OFF.** Nothing is sent until you set the site code. The scripts and tests are in place; the account is yours to create.

## What it does

`assets/analytics.js` (loaded after `layout.js` on all 20 pages) sends small GET "pixel" requests to `https://CODE.goatcounter.com/count`, the documented GoatCounter tracking-pixel format (`?p=<name>&e=true` for an event). **No third-party JavaScript runs on the students' pages.**

| What is counted | Event name (as it appears in GoatCounter) |
|---|---|
| Every page view | the page path, e.g. `/ex_dossier.html` (path only, **never the query string**, so never a case seed) |
| Full case, each step button | `full-case/ask`, `toQuote`, `chkQuote`, `okQuote`, `chkSamp`, `okSamp`, `quant`, `chkAmp`, `runAmp`, `kin`, `cons`, `consCheck`, `rmp`, `reveal`, `tool-kin` / `tool-cons` / `tool-rmp` |
| Full case, which case was served | `full-case/case/<template>/<variant>`, e.g. `full-case/case/id-uncle/vague` |
| « Nouveau cas » on any exercise | `new-case/<page>`, e.g. `new-case/ex_rmp` |
| « Valider » (`#check`) on any exercise | `check/<page>` |
| Any element with `data-track="name"` | `name` |

**Never sent:** answers, selections, typed text, seeds, free text. Event names are sanitised (no leading `/`, safe characters, 80 characters max).

**Not sent at all:** on `localhost` / `file:`, when the browser asks not to be tracked (Do Not Track), when the code is empty, or when it is not a plain host label (a value such as `evil.example.com/x` is refused).

When it is on, the page footer says so: *« Mesure d'audience anonyme (GoatCounter) : seuls les pages consultées et les boutons d'étape sont comptés, jamais vos réponses. »*

## What you need to do

1. Create a free site at https://www.goatcounter.com (the service states it is free for non-commercial use).
2. Open `assets/analytics.js` and set `var SITE_CODE = "yourcode";` (the part before `.goatcounter.com`). Merge through a PR as usual.
3. Read the counts on `https://yourcode.goatcounter.com`: page views per exercise, and the events above.

Before step 2, **check with your data-protection officer.** What the GoatCounter documentation says (read on 2026-11-04):
- It builds a session key from site, User-Agent and IP address, keeps it **in memory for 8 hours only**, and states the IP and User-Agent "are never stored to the database or disk"; only a random identifier is stored.
- It says it "probably" does not need a GDPR consent notice, that national interpretation differs, and that it is not legal advice.
- The pages I read **do not mention cookies**, so I have not claimed "no cookie" anywhere. For France, whether the CNIL audience-measurement exemption applies to your setup is not something I verified.

## Reading the numbers (limits)

- Counts are **hits, not students**: GoatCounter counts a visit once per session, but one student on two devices, or a class behind one school network, is not distinguishable.
- A pixel cannot record the referrer or screen size (GoatCounter's own note), so those are empty.
- Adblockers can block the requests: expect an under-count.
- Step counts show where students stop (for example many `okQuote`, few `runAmp`), not whether they answered correctly: nothing about answers is ever sent.

## Adding more events

Add `data-track="my-event"` to any button or link; no JavaScript is needed. In JavaScript, call `window.Analytics && window.Analytics.event("name")`.

## Verification

`node tools/analytics-selftest.mjs` (`npm run analytics:test`, in PR CI): off by default; URL and event format; query string and hash never sent; Do Not Track, localhost, `file:` and malformed codes send nothing; name sanitising; click hooks; the footer line; every page that loads `layout.js` loads `analytics.js` right after it, once; the full-case events are all namespaced. Browser check (Playwright with the endpoint intercepted, site served under an `https` host): no code → 0 requests; with a code the whole full-case flow produced the expected sequence and no seed; Do Not Track → 0 requests.
