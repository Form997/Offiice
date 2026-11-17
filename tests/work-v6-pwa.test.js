'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=process.cwd();
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');

test('WORK V6 manifest is a standalone PWA with a declared icon',()=>{
  const manifest=JSON.parse(read('writer/manifest.webmanifest'));
  assert.equal(manifest.name,'HAI ĐẤT OFFICE · WORK');
  assert.equal(manifest.short_name,'WORK');
  assert.equal(manifest.display,'standalone');
  assert.equal(manifest.start_url,'./');
  assert.equal(manifest.scope,'./');
  assert.ok(manifest.icons.some(icon=>icon.src==='./icons/work.svg'));
  for(const icon of manifest.icons) assert.ok(fs.existsSync(path.join(root,'writer',icon.src.replace(/^\.\//,''))));
});

test('WORK V6 service worker precaches every declared local asset',()=>{
  const sw=read('writer/sw.js');
  const match=sw.match(/const FILES=\[([\s\S]*?)\];/);
  assert.ok(match,'FILES array must exist');
  const files=[...match[1].matchAll(/'([^']+)'/g)].map(item=>item[1]);
  assert.ok(files.includes('./icons/work.svg'));
  assert.ok(files.includes('./app.js?v=6.0'));
  for(const file of files){
    const local=file.split('?')[0].replace(/^\.\//,'');
    if(!local||local==='.')continue;
    assert.ok(fs.existsSync(path.join(root,'writer',local)),`Missing precache asset: ${file}`);
  }
  assert.match(sw,/haidat-work-v6-0-r3/);
  assert.match(sw,/key\.startsWith\('haidat-work-'\)/);
});

test('WORK V6 exposes install prompt and installed-state handling',()=>{
  const app=read('writer/app.js');
  const html=read('writer/index.html');
  assert.match(html,/<button id="install" hidden>/);
  assert.match(html,/app\.js\?v=6\.0/);
  assert.match(app,/beforeinstallprompt/);
  assert.match(app,/promptEvent\.userChoice/);
  assert.match(app,/appinstalled/);
  assert.match(app,/serviceWorker\.register\('\.\/sw\.js'\)/);
});

test('WORK V6 preserves the selected document when switching Writer and Canvas',()=>{
  const app=read('writer/app.js');
  const canvas=read('writer/canvas-studio.html');
  assert.match(app,/dirty&&!persist\(false\)\)\{event\.preventDefault\(\)/);
  const html=read('writer/index.html');
  assert.match(app,/new URLSearchParams\(location\.search\)\.get\('documentId'\)/);
  assert.match(app,/canvas-studio\.html\?documentId=/);
  assert.match(canvas,/id="returnWriter"/);
  assert.match(canvas,/index\.html\?documentId=/);
  assert.match(html,/id="canvasLaunch"/);
});
