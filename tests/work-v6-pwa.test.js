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
  assert.ok(files.includes('./app.js?v=7.0'));
  for(const file of files){
    const local=file.split('?')[0].replace(/^\.\//,'');
    if(!local||local==='.')continue;
    assert.ok(fs.existsSync(path.join(root,'writer',local)),`Missing precache asset: ${file}`);
  }
  assert.match(sw,/haidat-work-v7-0-r1/);
  assert.match(sw,/key\.startsWith\('haidat-work-'\)/);
});

test('WORK V6 exposes install prompt and installed-state handling',()=>{
  const app=read('writer/app.js');
  const html=read('writer/index.html');
  assert.match(html,/<button id="install" hidden>/);
  assert.match(html,/app\.js\?v=7\.0/);
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

test('WORK V6.3 mobile workspace keeps its responsive stylesheet and touch navigation',()=>{
  const html=read('writer/index.html');
  const css=read('writer/mobile-v6.css');
  assert.match(html,/<meta name="viewport" content="width=device-width,initial-scale=1">/);
  assert.match(html,/mobile-v6\.css\?v=6\.4/);
  assert.match(html,/app\.js\?v=7\.0/);
  assert.match(html,/<nav class="ribbon" aria-label="Thanh công cụ Writer">/);
  assert.match(css,/env\(safe-area-inset-top,0px\)/);
  assert.match(css,/env\(safe-area-inset-bottom,0px\)/);
  assert.match(css,/button,\.file-button\{min-height:44px\}/);
  assert.match(css,/\.ribbon-tabs\{[\s\S]*?overflow-x:auto/);
  assert.match(css,/\.ribbon-panel\[hidden\]\{display:none!important\}/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});

test('WORK V6.4 appearance controls persist theme and reading size without changing document formatting',()=>{
  const html=read('writer/index.html');
  const css=read('writer/mobile-v6.css');
  const sw=read('writer/sw.js');
  assert.match(html,/id="writerTheme"/);
  assert.match(html,/id="writerReadingSize"/);
  assert.match(html,/id="resetAppearance"/);
  assert.match(html,/haidat-writer-appearance-v1/);
  assert.match(html,/localStorage\.setItem\(KEY/);
  assert.match(css,/data-writer-theme="green"/);
  assert.match(css,/data-writer-theme="light"/);
  assert.match(css,/data-writer-theme="dark"/);
  assert.match(css,/--writer-reading-size:16px/);
  assert.match(css,/font-size:var\(--writer-reading-size\)!important/);
  assert.match(sw,/haidat-work-v7-0-r1/);
  assert.match(sw,/mobile-v6\.css\?v=6\.4/);
});

test('WORK V7 imports DOCX font and paragraph formatting instead of flattening runs',()=>{
  const app=read('writer/app.js');
  assert.match(app,/function docxRunHTML\(run,ns\)/);
  assert.match(app,/eastAsia/);
  assert.match(app,/font-size:/);
  assert.match(app,/background-color:/);
  assert.match(app,/function docxParagraphHTML\(node,ns,styleMap,defaultCss\)/);
  assert.match(app,/margin-left/);
  assert.match(app,/text-align:/);
  assert.match(app,/async function importDocx\(file\)/);
});
test('WORK V7 imports common ODT text and paragraph styles',()=>{
  const app=read('writer/app.js');
  assert.match(app,/async function importODT\(file\)/);
  assert.match(app,/text-properties/);
  assert.match(app,/paragraph-properties/);
  assert.match(app,/font-family/);
  assert.match(app,/text-underline-style/);
});
test('WORK V7 clearly identifies unsupported and lossy file formats',()=>{
  const app=read('writer/app.js');
  const html=read('writer/index.html');
  assert.match(app,/DOC cũ \(Word 97–2003\) chưa đọc trực tiếp được/);
  assert.match(app,/PDF chưa chuyển thành văn bản chỉnh sửa được/);
  assert.match(html,/RTF: chuyển đổi có giới hạn/);
  assert.match(html,/DOC\/PDF: chưa nhập trực tiếp/);
  assert.match(html,/app\.js\?v=7\.0/);
});

test('WORK V7 resolves DOCX document defaults and based-on paragraph styles',()=>{
  const app=read('writer/app.js');
  assert.match(app,/word\/styles\.xml/);
  assert.match(app,/docDefaults/);
  assert.match(app,/basedOn/);
  assert.match(app,/const resolve=\(id,seen=new Set\(\)\)/);
  assert.match(app,/docxParagraphHTML\(node,ns,styleMap,defaultCss\)/);
});
