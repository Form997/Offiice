import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../writer/index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../writer/app.js', import.meta.url), 'utf8');
const collaboration = readFileSync(new URL('../writer/collaboration.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../writer/style.css', import.meta.url), 'utf8');
const errors = [];

const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]);
const idSet = new Set(ids);
// These IDs are intentionally created at runtime rather than declared in index.html.
const runtimeIds = new Set(['dynamicPrintStyle']);
for (const id of new Set(ids)) {
  if (ids.filter(x => x === id).length > 1) errors.push(`Duplicate HTML id: ${id}`);
}
for (const [file, source] of [['app.js', app], ['collaboration.js', collaboration]]) {
  const refs = [
    ...[...source.matchAll(/\$\(\s*['"]#([A-Za-z][\w:-]*)['"]\s*\)/g)].map(m => m[1]),
    ...[...source.matchAll(/getElementById\(\s*['"]([A-Za-z][\w:-]*)['"]\s*\)/g)].map(m => m[1]),
  ];
  for (const id of refs) {
    if (!idSet.has(id) && !runtimeIds.has(id)) errors.push(`${file} references missing HTML id: ${id}`);
  }
}
for (const required of ['editorZoom','toggleFocusMode','focusModeExit','focusEditor','backupExport','backupImport','backupMode','backupFile','checkDataHealth']) {
  if (!idSet.has(required)) errors.push(`Missing required Writer control: ${required}`);
}
for (const required of ['.focus-mode .sidepanel','.focus-mode .workspace']) {
  if (!css.includes(required)) errors.push(`Missing focus-mode layout rule: ${required}`);
}
for (const required of ['HAI-DAT-WRITER-BACKUP','safetyCopy:true','Đã hủy thay thế để bảo toàn dữ liệu hiện tại']) {
  if (!app.includes(required)) errors.push(`Missing backup safety behavior: ${required}`);
}
if (!html.includes('app.js?v=3.0')) errors.push('index.html does not load app.js V3.0');
if (!html.includes('collaboration.js?v=3.0')) errors.push('index.html does not load collaboration.js V3.0');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Writer static checks passed: ${idSet.size} unique HTML IDs and literal DOM references checked.`);
