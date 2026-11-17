'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

const app = read('writer/app.js');
const canvas = read('writer/canvas-studio.html');
const exporter = read('writer/export-studio.js');
const sw = read('writer/sw.js');
const writerPage = read('writer/index.html');

test('Writer retains the established local store and schema contract', () => {
  assert.match(app, /haidat-writer-documents-v2/);
  assert.match(app, /schemaVersion\s*=\s*3/);
  assert.match(app, /schemaVersion:3/);
  assert.match(app, /HDW-/);
});

test('unreadable storage is not silently replaced', () => {
  assert.match(app, /haidat-writer-recovery-raw-v1/);
  assert.match(app, /storageRecoveryRaw\s*!==\s*null/);
  assert.match(app, /if\s*\(!confirm\([\s\S]*?Hủy:[\s\S]*?\)\)\s*return\s*false/);
});

test('Writer history and backup preserve Canvas-capable data', () => {
  assert.match(app, /haidat-writer-history-v1/);
  assert.match(app, /version\s*:\s*5/);
  assert.match(app, /design/);
});

test('Writer and Canvas use the same document store contract', () => {
  assert.match(app, /haidat-writer-documents-v2/);
  assert.match(canvas, /haidat-writer-documents-v2/);
  assert.match(canvas, /revision/);
});

test('export module remains local and is integrated into both modes', () => {
  assert.match(writerPage, /export-studio\.js/);
  assert.match(canvas, /export-studio\.js/);
  for (const format of ['DOCX', 'PNG', 'SVG', 'HTML', 'JSON']) {
    assert.ok(exporter.includes(format), `missing export format: ${format}`);
  }
  assert.doesNotMatch(exporter, /https?:\/\/(?:cdn\.|unpkg\.com|cdnjs\.)/i);
});

test('service worker precaches Canvas and Export Studio', () => {
  assert.match(sw, /canvas-studio\.html/);
  assert.match(sw, /export-studio\.js/);
});

test('service worker cleanup is restricted to this application cache family', () => {
  assert.match(sw, /startsWith\(['"]haidat-writer-['"]\)/);
  assert.match(sw, /k\s*!==\s*CACHE/);
});

test('Writer and Canvas retain explicit local-first storage keys', () => {
  assert.match(app, /haidat-writer-folders-v1/);
  assert.match(app, /haidat-writer-history-v1/);
  assert.match(canvas, /localStorage/);
});
