import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const file = fileURLToPath(new URL('../assets/analytics.js', import.meta.url));
const src = readFileSync(file, 'utf8');

// A minimal browser: records every Image().src, every click listener, footer children.
function boot({ code, host = 'student.github.io', protocol = 'https:', path = '/cours/ex_dossier.html', dnt, search = '?seed=424242', title = 'Dossier' } = {}) {
  const sent = [], listeners = {}, footer = [];
  const win = {
    location: { protocol, hostname: host, pathname: path, search, hash: '#x' },
    navigator: { doNotTrack: dnt },
    Image: class { constructor() { this.set = null; } set src(v) { sent.push(v); } },
    I18N: { apply() { win.applied = (win.applied || 0) + 1; } },
    document: {
      title, readyState: 'complete',
      addEventListener(t, fn) { listeners[t] = fn; },
      querySelector: sel => (sel === '.site-footer' ? { appendChild: n => footer.push(n) } : null),
      createElement: () => ({ attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } })
    }
  };
  if (code !== undefined) win.ANALYTICS_CODE = code;
  vm.runInNewContext(src, win, { filename: file });
  const click = (selectorsMatch) => listeners.click({ target: { closest: sel => selectorsMatch[sel] || null } });
  return { win, sent, footer, click, listeners };
}
const q = u => Object.fromEntries(new URL(u).searchParams);

// --- shipped state: OFF (no code configured) ---
assert.match(src, /var SITE_CODE = "";/, 'the shipped code is empty: analytics is off until the owner sets it');
{
  const a = boot({});
  assert.equal(a.win.Analytics.enabled(), false); assert.deepEqual(a.sent, []);
  assert.equal(a.win.Analytics.event('x'), false); assert.equal(a.win.Analytics.pageview(), false); assert.deepEqual(a.sent, []);
  assert.deepEqual(a.listeners, {}, 'no click listener when off'); assert.equal(a.footer.length, 0, 'no footer line when off');
}

// --- on: page view, events, URL format ---
{
  const a = boot({ code: 'cours-genetique' });
  assert.equal(a.win.Analytics.enabled(), true);
  assert.equal(a.sent.length, 1, 'one page view on load');
  const pv = new URL(a.sent[0]);
  assert.equal(pv.origin, 'https://cours-genetique.goatcounter.com'); assert.equal(pv.pathname, '/count');
  assert.equal(pv.searchParams.get('p'), '/cours/ex_dossier.html'); assert.equal(pv.searchParams.get('t'), 'Dossier'); assert.equal(pv.searchParams.get('e'), null, 'a page view is not an event');
  assert(!/seed|424242|#x/.test(a.sent[0]), 'neither the query string nor the hash is ever sent');
  assert.equal(a.win.Analytics.event('full-case/okQuote'), true);
  const ev = q(a.sent[1]); assert.equal(ev.p, 'full-case/okQuote'); assert.equal(ev.e, 'true'); assert(ev.rnd, 'cache buster');
  assert.equal(q(a.sent[1]).t, undefined);
  // names: no leading slash (GoatCounter rule), lower case, safe alphabet, bounded length
  a.win.Analytics.event('/Évènement avec espaces & <b>HTML</b>?x=1'); const odd = q(a.sent[2]).p;
  assert(!odd.startsWith('/') && /^[A-Za-z0-9\-_\/.:]+$/.test(odd), odd);
  a.win.Analytics.event('x'.repeat(300)); assert.equal(q(a.sent[3]).p.length, 80);
  assert.equal(a.win.Analytics.event(''), false); assert.equal(a.win.Analytics.event('///'), false);
  assert.equal(a.footer.length, 1, 'the footer discloses the measurement when on');
  assert(/jamais vos réponses/.test(a.footer[0].attrs['data-fr']) && /never your answers/.test(a.footer[0].attrs['data-en']));
  assert(!/cookie|personal|personnelle/i.test(a.footer[0].attrs['data-fr'] + a.footer[0].attrs['data-en']), 'the footer claims only what our own code guarantees'); assert.equal(a.win.applied, 1);
}

// --- when it must stay silent ---
for (const [label, opts] of [
  ['Do Not Track', { code: 'abc', dnt: '1' }], ['localhost', { code: 'abc', host: 'localhost' }], ['127.0.0.1', { code: 'abc', host: '127.0.0.1' }],
  ['file:', { code: 'abc', protocol: 'file:', host: '' }],
  ['host injection', { code: 'evil.example.com/x' }], ['uppercase', { code: 'ABC' }], ['leading dash', { code: '-abc' }], ['slash', { code: 'a/b' }], ['empty', { code: '' }], ['overlong', { code: 'a'.repeat(64) }]
]) { const a = boot(opts); assert.equal(a.sent.length, 0, label); assert.equal(a.win.Analytics.enabled(), false, label); assert.equal(a.win.Analytics.event('z'), false, label); }
assert.equal(boot({ code: 'a'.repeat(63) }).win.Analytics.enabled(), true, 'a 63-character label is valid');

// --- click hooks ---
{
  const a = boot({ code: 'abc', path: '/cours/ex_rmp.html' }); a.sent.length = 0;
  a.click({ '[data-track]': { getAttribute: () => 'my event' } }); assert.equal(q(a.sent.pop()).p, 'my-event');
  a.click({ '#newCase, #check': { id: 'newCase' } }); assert.equal(q(a.sent.pop()).p, 'new-case/ex_rmp');
  a.click({ '#newCase, #check': { id: 'check' } }); assert.equal(q(a.sent.pop()).p, 'check/ex_rmp');
  a.click({}); assert.equal(a.sent.length, 0, 'other clicks are not counted');
  a.listeners.click({ target: null }); assert.equal(a.sent.length, 0);
}

// --- wiring: every page that loads layout.js loads analytics.js right after it; dossier-ui only sends event names ---
const root = fileURLToPath(new URL('..', import.meta.url));
let pages = 0;
for (const f of readdirSync(root).filter(x => x.endsWith('.html'))) {
  const h = readFileSync(root + f, 'utf8');
  if (!h.includes('assets/layout.js')) continue;
  pages++;
  assert(/assets\/layout\.js"><\/script>\s*\n\s*<script src="assets\/analytics\.js"><\/script>/.test(h), f + ' loads analytics.js right after layout.js');
  assert.equal(h.split('assets/analytics.js').length - 1, 1, f + ' loads it once');
}
assert(pages >= 20, 'pages checked: ' + pages);
const ui = readFileSync(root + 'assets/dossier-ui.js', 'utf8');
const calls = [...ui.matchAll(/track\(([^)]*)\)/g)].map(m => m[1]);
assert(calls.length >= 2 && calls.every(c => /^'full-case\//.test(c)), 'full-case events are all namespaced: ' + calls.join(' | '));
assert(!/Analytics\.event\([^)]*(seed|\.value|answer)/i.test(ui), 'no seed or input value goes into an event');
console.log('analytics self-test: OK (' + pages + ' pages)');
