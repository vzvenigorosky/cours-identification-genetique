// Loads a classic-script data file that assigns to `window.X` (as the browser
// does) so Node self-tests can inspect it. Shared by the MG1 and MG3 checks.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export function loadWindowData(relPath, name) {
  const file = fileURLToPath(new URL('../' + relPath, import.meta.url));
  const window = {};
  vm.runInNewContext(readFileSync(file, 'utf8'), { window }, { filename: file });
  if (!window[name]) throw new Error(`${relPath} did not define window.${name}`);
  return window[name];
}

// Walks a value and returns the path of every {fr,en} leaf lacking a non-empty
// string in either language, plus the count of well-formed bilingual leaves.
export function checkBilingual(node, path = '', out = { bad: [], ok: 0 }) {
  if (node && typeof node === 'object') {
    const keys = Object.keys(node);
    if ('fr' in node || 'en' in node) {
      const good = ['fr', 'en'].every(k => typeof node[k] === 'string' && node[k].trim());
      if (good) out.ok++; else out.bad.push(path);
      return out;
    }
    for (const k of keys) checkBilingual(node[k], `${path}.${k}`, out);
  }
  return out;
}
