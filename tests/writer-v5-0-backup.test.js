'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const backup=require('../writer/backup-studio.js');

const good=(id,title,updatedAt=100)=>({id,title,updatedAt,html:'<p>nội dung</p>',design:{pages:[]}});
const payload=(documents,extra={})=>({format:'HAI-DAT-WRITER-BACKUP',version:5,documents,...extra});

test('accepts a valid backup and reports its document summary',()=>{
 const report=backup.inspect(payload([good('HDW-20261117-AB12CD34','Báo cáo')]),[],'merge');
 assert.equal(report.ok,true);assert.equal(report.validCount,1);assert.equal(report.designCount,1);
});
test('rejects an unknown backup format or unsupported version',()=>{
 assert.equal(backup.inspect({format:'other',version:5,documents:[good('HDW-20261117-AB12CD34','A')]},[],'merge').ok,false);
 assert.equal(backup.inspect(payload([good('HDW-20261117-AB12CD34','A')],{version:99}),[],'merge').ok,false);
});
test('rejects empty or entirely malformed document collections',()=>{
 assert.equal(backup.inspect(payload([]),[],'merge').ok,false);
 assert.equal(backup.inspect(payload([{id:'x',html:4}]),[],'merge').ok,false);
});
test('reports malformed rows, invalid IDs and duplicate IDs without mutating input',()=>{
 const docs=[good('HDW-20261117-AB12CD34','A'),good('HDW-20261117-AB12CD34','B'),{id:'bad',html:'<p>x</p>'},null];
 const before=JSON.stringify(docs),report=backup.inspect(payload(docs),[],'merge');
 assert.equal(report.ok,true);assert.equal(report.skipped,1);assert.equal(report.duplicates,1);assert.equal(report.invalidIds,1);
 assert.equal(JSON.stringify(docs),before);
});
test('merge preview distinguishes new, colliding, newer and retained records',()=>{
 const incoming=[good('HDW-20261117-AB12CD34','Newer',200),good('HDW-20261117-AB12CD35','Older',50),good('HDW-20261117-AB12CD36','Added',300)];
 const current=[good('HDW-20261117-AB12CD34','Local',100),good('HDW-20261117-AB12CD35','Local newer',100)];
 const report=backup.inspect(payload(incoming),current,'merge');
 assert.equal(report.added,1);assert.equal(report.collisions,2);assert.equal(report.incomingNewer,1);assert.equal(report.keptCurrent,1);
});
test('replace preview warns that existing documents will be replaced',()=>{
 const report=backup.inspect(payload([good('HDW-20261117-AB12CD34','A')]),[good('HDW-20261117-AB12CD35','Current')],'replace');
 assert.equal(report.ok,true);assert.match(report.message,/Thay thế toàn bộ/);assert.match(report.message,/sẽ thay toàn bộ/);
});
test('rejects an excessive document count',()=>{
 const docs=Array.from({length:10001},(_,i)=>good('HDW-20261117-'+String(i).padStart(8,'0'),'T'+i));
 assert.equal(backup.inspect(payload(docs),[],'merge').ok,false);
});

test('Writer, Export Studio, Service Worker and Canvas scripts parse',()=>{
 const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
 const app=fs.readFileSync(path.join(root,'writer/app.js'),'utf8');
 const exporter=fs.readFileSync(path.join(root,'writer/export-studio.js'),'utf8');
 const sw=fs.readFileSync(path.join(root,'writer/sw.js'),'utf8');
 const canvas=fs.readFileSync(path.join(root,'writer/canvas-studio.html'),'utf8');
 assert.doesNotThrow(()=>new Function(app));
 assert.doesNotThrow(()=>new Function(exporter));
 assert.doesNotThrow(()=>new Function(sw));
 const scripts=[...canvas.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(x=>x.trim());
 for(const script of scripts)assert.doesNotThrow(()=>new Function(script));
});
test('Writer loads backup preflight before the application and PWA precaches it',()=>{
 const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
 const html=fs.readFileSync(path.join(root,'writer/index.html'),'utf8');
 const sw=fs.readFileSync(path.join(root,'writer/sw.js'),'utf8');
 const appScript=html.match(/app\\.js\\?v=6\\.\\d+/);
 assert.ok(appScript,'V6 app script must have a versioned URL');
 assert.ok(html.indexOf('backup-studio.js?v=5.0')<html.indexOf(appScript[0]));
 assert.match(sw,/haidat-work-v6-\d+-r\d+/);
 assert.match(sw,/backup-studio\.js\?v=5\.0/);
});
