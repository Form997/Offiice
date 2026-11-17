import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../writer/index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../writer/app.js', import.meta.url), 'utf8');
const collaboration = readFileSync(new URL('../writer/collaboration.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../writer/style.css', import.meta.url), 'utf8');
const errors = [];

const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]);
const idSet = new Set(ids);
for (const id of new Set(ids)) {
  if (ids.filter(x => x === id).length > 1) errors.push(`Duplicate HTML id: ${id}`);
}
for (const [file, source] of [['app.js', app], ['collaboration.js', collaboration]]) {
  const refs = [...source.matchAll(/(?:\$\(|getElementById\()\s*['"]([A-Za-z][\w:-]*)['"]\s*\)?/g)].map(m => m[1]);
  for (const id of new Set(refs)) if (!idSet.has(id)) errors.push(`${file} references missing HTML id: ${id}`);
}
for (const required of ['editorZoom','toggleFocusMode','focusModeExit','focusEditor']) {
  if (!idSet.has(required)) errors.push(`Missing V3.0 control: ${required}`);
}
for (const required of ['.focus-mode .sidepanel','.focus-mode .workspace']) {
  if (!css.includes(required)) errors.push(`Missing focus-mode layout rule: ${required}`);
}
if (!html.includes('app.js?v=3.0')) errors.push('index.html does not load app.js V3.0');
if (!html.includes('collaboration.js?v=3.0')) errors.push('index.html does not load collaboration.js V3.0');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Writer static checks passed: ${idSet.size} unique HTML IDs checked.`);
