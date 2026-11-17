/* HAI ĐẤT OFFICE — Export Studio V4.6
 * Local-first export engine. No CDN, API, remote font or external dependency.
 * Formats: PDF (browser print), DOCX (minimal OOXML), PNG, SVG, HTML, JSON.
 */
(()=>{'use strict';
const STORE_KEY='haidat-writer-documents-v2',HISTORY_KEY='haidat-writer-history-v1';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=s=>String(s||'Tai-lieu').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-|-$/g,'').slice(0,70)||'Tai-lieu';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function currentId(){
 const q=new URLSearchParams(location.search).get('documentId');if(q)return q;
 const select=$('#docList');if(select&&select.value)return select.value;
 const label=$('#docIdDisplay')?.textContent||'';const m=label.match(/HDW-\d{8}-[A-Z0-9]{8}/i);return m?m[0]:null;
}
function record(){
 let docs=[];try{docs=JSON.parse(localStorage.getItem(STORE_KEY)||'[]')}catch{}
 if(!Array.isArray(docs))docs=[];
 const id=currentId();return docs.find(d=>d&&d.id===id)||docs[0]||{id:id||'preview',title:document.title||'Tài liệu',html:$('#editor')?.innerHTML||'',design:null};
}
function pagesOf(design){
 if(!design)return [];
 if(Array.isArray(design.pages)&&design.pages.length)return design.pages;
 if(Array.isArray(design.items)&&design.items.length)return [{id:'legacy-page',name:'Trang 1',items:design.items,settings:design.page||{}}];
 return [];
}
function dims(p){
 const s=p.settings||p;let w=Number(s.widthMm)||210,h=Number(s.heightMm)||297;
 if(s.orientation==='landscape'&&w<h){const t=w;w=h;h=t}
 if(s.orientation==='portrait'&&w>h){const t=w;w=h;h=t}
 return {w,h,pw:Math.round(w*96/25.4),ph:Math.round(h*96/25.4),m:s.margins||{top:20,right:20,bottom:20,left:20}};
}
function svgText(o){
 const size=Math.max(6,Number(o.size)||20),raw=String(o.text||''),maxChars=Math.max(5,Math.floor((Number(o.w)||240)/(size*.56)));
 const lines=[];raw.split(/\r?\n/).forEach(line=>{let words=line.split(/\s+/),part='';words.forEach(word=>{if(part&&part.length+word.length+1>maxChars){lines.push(part);part=word}else part+=(part?' ':'')+word});lines.push(part)});
 const anchor=({center:'middle',right:'end'}[o.align]||'start'),x=anchor==='middle'?(Number(o.w)||200)/2:anchor==='end'?(Number(o.w)||200):0;
 return '<text x="'+x+'" y="'+size+'" font-family="'+esc(o.fontFamily||'Arial')+'" font-size="'+size+'" font-weight="'+(o.bold?'700':(o.kind==='title'?'750':'400'))+'" font-style="'+(o.italic?'italic':'normal')+'" text-anchor="'+anchor+'" fill="'+esc(o.color||'#20343d')+'" opacity="'+(o.opacity==null?1:o.opacity)+'" letter-spacing="'+(Number(o.letterSpacing)||0)+'">'+lines.map((line,i)=>'<tspan x="'+x+'" dy="'+(i===0?0:size*(Number(o.lineHeight)||1.35))+'">'+esc(line)+'</tspan>').join('')+'</text>';
}
function svgTable(o){
 const rows=Array.isArray(o.data)?o.data:[],cols=Math.max(1,...rows.map(r=>Array.isArray(r)?r.length:0)),cw=(Number(o.w)||300)/cols,rh=(Number(o.h)||150)/Math.max(1,rows.length),out=[];
 rows.forEach((r,ri)=>(Array.isArray(r)?r:[]).forEach((v,ci)=>{const x=ci*cw,y=ri*rh;out.push('<rect x="'+x+'" y="'+y+'" width="'+cw+'" height="'+rh+'" fill="'+(ri===0&&o.header!==false?'#e7f3f0':'#fff')+'" stroke="'+esc(o.tableBorder||'#aebdc2')+'"/>','<text x="'+(x+5)+'" y="'+(y+Math.min(rh-4,18))+'" font-family="Arial" font-size="12" font-weight="'+(ri===0&&o.header!==false?'700':'400')+'" fill="#20343d">'+esc(v)+'</text>')}));return out.join('');
}
function svgChart(o){
 const data=o.chart||{},labels=Array.isArray(data.labels)?data.labels:[],values=Array.isArray(data.values)?data.values:[],w=Number(o.w)||360,h=Number(o.h)||210,max=Math.max(1,...values.map(v=>Number(v)||0)),gap=w/Math.max(1,labels.length),bw=Math.min(42,gap*.58),out=['<path d="M28 8 V'+(h-28)+' H'+(w-8)+'" fill="none" stroke="#aebdc2"/>'];
 labels.forEach((label,i)=>{const v=Math.max(0,Number(values[i])||0),bh=(h-70)*v/max,x=28+i*gap+(gap-bw)/2,y=h-28-bh;out.push('<rect x="'+x+'" y="'+y+'" width="'+bw+'" height="'+bh+'" rx="3" fill="'+esc(o.chartColor||'#167d70')+'"/>','<text x="'+(x+bw/2)+'" y="'+Math.max(10,y-4)+'" text-anchor="middle" font-size="10" fill="#52646b">'+esc(v)+'</text>','<text x="'+(x+bw/2)+'" y="'+(h-8)+'" text-anchor="middle" font-size="10" fill="#52646b">'+esc(String(label).slice(0,12))+'</text>')});return out.join('');
}
function svgObject(o,i){
 const x=Number(o.x)||0,y=Number(o.y)||0,w=Math.max(1,Number(o.w)||160),h=Math.max(1,Number(o.h)||50),rot=Number(o.rotation)||0;
 let body='';
 if(o.kind==='image'&&o.src){body='<defs><clipPath id="clip'+i+'"><rect width="'+w+'" height="'+h+'"/></clipPath></defs><image href="'+esc(o.src)+'" x="0" y="0" width="'+w+'" height="'+h+'" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip'+i+')"/>'}
 else if(o.kind==='shape')body='<rect width="'+w+'" height="'+h+'" rx="4" fill="'+esc(o.bg||'#e1f2ee')+'" opacity="'+(o.opacity==null?1:o.opacity)+'"/>'+ (o.text?svgText(o):'');
 else if(o.kind==='line')body='<rect width="'+w+'" height="4" fill="'+esc(o.color||'#20343d')+'"/>';
 else if(o.kind==='table')body=svgTable(o);
 else if(o.kind==='chart')body=svgChart(o);
 else body=svgText(o);
 return '<g transform="translate('+x+' '+y+') rotate('+rot+' '+(w/2)+' '+(h/2)+')" opacity="'+(o.opacity==null?1:o.opacity)+'">'+body+'</g>';
}
function pageSvg(p,index){
 const d=dims(p),items=Array.isArray(p.items)?p.items:[];
 return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="'+d.pw+'" height="'+d.ph+'" viewBox="0 0 '+d.pw+' '+d.ph+'"><rect width="100%" height="100%" fill="#fff"/>'+items.map(svgObject).join('')+'</svg>';
}
function writerSvg(rec){
 const root=document.createElement('div');root.innerHTML=rec.html||'';const text=(root.innerText||root.textContent||rec.title||'').split(/\r?\n/),lines=text.slice(0,100),w=794,h=Math.max(1123,lines.length*26+100);
 return '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'"><rect width="100%" height="100%" fill="#fff"/>'+lines.map((line,i)=>'<text x="70" y="'+(85+i*26)+'" font-family="Arial" font-size="16" fill="#17212b">'+esc(line.slice(0,100))+'</text>').join('')+'</svg>';
}
function svgPages(rec){
 const ps=pagesOf(rec.design);return ps.length?ps.map(pageSvg):[writerSvg(rec)];
}
function canvasHtml(p,i){
 const d=dims(p);return '<section class="canvas-page" style="width:'+d.w+'mm;height:'+d.h+'mm"><div class="canvas-art"><svg xmlns="http://www.w3.org/2000/svg" width="'+d.pw+'" height="'+d.ph+'" viewBox="0 0 '+d.pw+' '+d.ph+'"><rect width="100%" height="100%" fill="#fff"/>'+(p.items||[]).map(svgObject).join('')+'</svg></div></section>';
}
function fullHtml(rec,includeWriter=true){
 const ps=pagesOf(rec.design),writer=includeWriter&&rec.html?'<section class="writer-page">'+rec.html+'</section>':'';
 const canv=ps.map(canvasHtml).join('');
 return '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(rec.title||'Tài liệu')+'</title><style>*{box-sizing:border-box}body{margin:0;background:#e8ecef;color:#17212b;font:12pt/1.55 Arial,sans-serif}.writer-page{max-width:210mm;min-height:297mm;margin:12mm auto;padding:20mm;background:#fff;box-shadow:0 2px 12px #0002}.canvas-page{position:relative;margin:12mm auto;background:#fff;box-shadow:0 2px 12px #0002;overflow:hidden}.canvas-art,.canvas-art svg{width:100%;height:100%;display:block}@media print{body{background:#fff}.writer-page,.canvas-page{margin:0;box-shadow:none;break-after:page;page-break-after:always}@page{margin:0}}</style></head><body>'+writer+canv+'</body></html>';
}
function zip(files,mime){
 const enc=new TextEncoder(),crcTable=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);t[n]=c>>>0}return t})();
 const crc=b=>{let c=0xffffffff;for(const v of b)c=crcTable[(c^v)&255]^(c>>>8);return(c^0xffffffff)>>>0},u16=n=>[n&255,n>>>8&255],u32=n=>[n&255,n>>>8&255,n>>>16&255,n>>>24&255];
 const chunks=[],central=[];let offset=0;
 Object.entries(files).forEach(([name,data])=>{const n=enc.encode(name),d=typeof data==='string'?enc.encode(data):data,c=crc(d);
 const local=new Uint8Array([...u32(0x04034b50),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(c),...u32(d.length),...u32(d.length),...u16(n.length),...u16(0),...n,...d]);chunks.push(local);
 central.push(new Uint8Array([...u32(0x02014b50),...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(c),...u32(d.length),...u32(d.length),...u16(n.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset),...n]));offset+=local.length});
 const size=central.reduce((n,x)=>n+x.length,0),end=new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(central.length),...u16(central.length),...u32(size),...u32(offset),...u16(0)]);
 return new Blob([...chunks,...central,end],{type:mime||'application/zip'});
}
function xmlText(text){
 return String(text??'').split(/\r?\n/).map((line,i)=>(i?'<w:r><w:br/></w:r>':'')+'<w:r><w:t xml:space="preserve">'+esc(line)+'</w:t></w:r>').join('');
}
function wordParagraph(text,style){
 return '<w:p>'+(style?'<w:pPr><w:pStyle w:val="'+style+'"/></w:pPr>':'')+xmlText(text)+'</w:p>';
}
function wordTable(rows){
 const rr=(rows||[]).map(row=>'<w:tr>'+(row||[]).map(cell=>'<w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/></w:tcPr>'+wordParagraph(cell)+'</w:tc>').join('')+'</w:tr>').join('');
 return '<w:tbl><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4"/><w:left w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>'+rr+'</w:tbl>';
}
function writerWord(html){
 const doc=new DOMParser().parseFromString('<div>'+String(html||'')+'</div>','text/html'),root=doc.body.firstElementChild,out=[];
 const walk=el=>{if(el.nodeType===3){if(el.nodeValue.trim())out.push(wordParagraph(el.nodeValue));return}if(el.nodeType!==1)return;if(el.tagName==='DIV'){[...el.childNodes].forEach(walk);return}if(el.tagName==='TABLE'){out.push(wordTable([...el.rows].map(r=>[...r.cells].map(c=>c.innerText||c.textContent))));return}
 if(el.classList?.contains('page-break')||el.classList?.contains('section-break')){out.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');return}
 if(['P','H1','H2','H3','H4','LI','BLOCKQUOTE','PRE','DIV'].includes(el.tagName)){const style=({H1:'Heading1',H2:'Heading2',H3:'Heading3'})[el.tagName];out.push(wordParagraph(el.innerText||el.textContent,style));return}
 [...el.children].forEach(walk)};
 [...root.children].forEach(walk);return out.join('');
}
function canvasWord(p){
 const out=[];(p.items||[]).forEach(o=>{
 if(o.kind==='table'){out.push(wordTable(o.data||[]));return}
 if(o.kind==='chart'){const c=o.chart||{};out.push(wordParagraph('Biểu đồ: '+(c.labels||[]).map((v,i)=>v+' — '+((c.values||[])[i]??'')).join('; ')));return}
 if(o.kind==='image'){out.push(wordParagraph('[Hình ảnh: '+(o.alt||o.text||'Ảnh Canvas')+' — xem bản HTML/SVG/PNG để giữ hình gốc]'));return}
 if(o.kind==='line'){out.push(wordParagraph('────────────────────────'));return}
 if(o.text)out.push(wordParagraph(o.text,o.kind==='title'?'Heading1':null));
 });return out.join('');
}
function docxBlob(rec,includeWriter=true){
 const body=[];if(includeWriter&&rec.html)body.push(writerWord(rec.html));
 const ps=pagesOf(rec.design);ps.forEach((p,i)=>{body.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>',canvasWord(p))});
 const documentXML='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+(body.join('')||'<w:p/>')+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>';
 const files={'[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>','_rels/.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>','word/document.xml':documentXML,'word/styles.xml':'<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/></w:style></w:styles>'};
 return zip(files,'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
}
function download(blob,name){
 if(!(blob instanceof Blob)||!blob.size)throw new Error('Tệp xuất rỗng; không tạo tải xuống.');
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);
}
async function svgToPng(svg){
 const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob);
 try{const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('Không dựng được SVG thành ảnh PNG.'));img.src=url});
 const w=img.naturalWidth||794,h=img.naturalHeight||1123,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Thiết bị không cấp được Canvas 2D.');ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
 return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Không tạo được PNG.')),'image/png'));
 }finally{URL.revokeObjectURL(url)}
}
async function run(format){
 const rec=record();if(!rec||!rec.id)throw new Error('Không tìm thấy tài liệu để xuất.');
 const name=safe(rec.title||'Tai-lieu'),ps=pagesOf(rec.design),includeWriter=$('#hdExportWriter')?.checked!==false;
 if(format==='json'){
  let history={};try{history=JSON.parse(localStorage.getItem(HISTORY_KEY)||'{}')}catch{}
  const payload={format:'HAI-DAT-WRITER-BACKUP',version:5,appType:'writer',createdAt:new Date().toISOString(),activeId:rec.id,folders:[rec.folder||'Chưa phân loại'],documents:[rec],versionHistory:{[rec.id]:history[rec.id]||[]},printSettings:{},pageSettings:{}};
  download(new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}),name+'.haidat.json');return 'JSON';
 }
 if(format==='html'){download(new Blob([fullHtml(rec,includeWriter)],{type:'text/html;charset=utf-8'}),name+'.html');return 'HTML'}
 if(format==='docx'){download(docxBlob(rec,includeWriter),name+'.docx');return 'DOCX'}
 if(format==='pdf'){
  const win=window.open('','_blank');if(!win)throw new Error('Trình duyệt chặn cửa sổ in. Hãy cho phép cửa sổ bật lên rồi thử lại.');
  win.document.open();win.document.write(fullHtml(rec,includeWriter));win.document.close();
  setTimeout(()=>{try{win.focus();win.print()}catch{}},700);return 'PDF · mở hộp thoại In, chọn Lưu thành PDF';
 }
 const svgs=svgPages(rec);
 if(format==='svg'){
  if(svgs.length===1){download(new Blob([svgs[0]],{type:'image/svg+xml;charset=utf-8'}),name+'.svg')}
  else{const files={};svgs.forEach((s,i)=>files[name+'-trang-'+String(i+1).padStart(2,'0')+'.svg']=s);download(zip(files,'application/zip'),name+'-SVG.zip')}
  return 'SVG';
 }
 if(format==='png'){
  const files={};for(let i=0;i<svgs.length;i++){const blob=await svgToPng(svgs[i]);files[name+'-trang-'+String(i+1).padStart(2,'0')+'.png']=new Uint8Array(await blob.arrayBuffer())}
  if(files&&Object.keys(files).length===1){const b=new Blob([files[Object.keys(files)[0]]],{type:'image/png'});download(b,name+'.png')}
  else download(zip(files,'application/zip'),name+'-PNG.zip');
  return 'PNG';
 }
 throw new Error('Định dạng xuất chưa được hỗ trợ.');
}
function init(){
 const host=document.createElement('div');host.innerHTML='<style>#hdExportOpen{position:fixed;right:16px;bottom:18px;z-index:9998;border:0;border-radius:999px;background:#155e54;color:#fff;padding:12px 17px;font:700 14px Arial;box-shadow:0 4px 18px #0003;cursor:pointer}#hdExportDialog{width:min(440px,calc(100vw - 28px));border:1px solid #d5dfdc;border-radius:16px;padding:20px;box-shadow:0 18px 60px #0004;font:14px/1.5 Arial;color:#17212b}#hdExportDialog::backdrop{background:#10231f88}#hdExportDialog h2{margin:0 0 8px;font-size:20px}#hdExportDialog p{color:#52646b;margin:0 0 14px}#hdExportDialog select{width:100%;padding:11px;border:1px solid #bdcbc7;border-radius:8px;background:#fff;font-size:15px}#hdExportDialog label{display:flex;gap:8px;align-items:center;margin:12px 0}#hdExportDialog .hd-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:18px}#hdExportDialog button{border:0;border-radius:8px;padding:10px 14px;font-weight:700;cursor:pointer}#hdExportGo{background:#155e54;color:#fff}#hdExportCancel{background:#edf2f0;color:#20343d}#hdExportStatus{min-height:22px;margin-top:12px;color:#155e54;font-size:13px}</style><button id="hdExportOpen" type="button">⇩ Xuất tệp</button><dialog id="hdExportDialog"><h2>Export Studio · V4.6</h2><p>Xuất tài liệu Writer và bố cục Canvas từ cùng một ID. Tệp được tạo ngay trên thiết bị, không gửi lên máy chủ.</p><select id="hdExportFormat" aria-label="Định dạng xuất"><option value="pdf">PDF · In / Lưu thành PDF</option><option value="docx">DOCX · Microsoft Word</option><option value="png">PNG · ảnh trang</option><option value="svg">SVG · đồ họa vector</option><option value="html">HTML · trang web ngoại tuyến</option><option value="json">JSON · dữ liệu có thể khôi phục</option></select><label id="hdExportWriterWrap"><input type="checkbox" id="hdExportWriter" checked> Kèm nội dung Writer (nếu có)</label><small>PNG/SVG: một trang tạo một ảnh; nhiều trang được đóng gói thành ZIP. DOCX giữ văn bản/bảng/biểu đồ dạng dữ liệu; ảnh Canvas được ghi chú thay vì nhúng bitmap.</small><div class="hd-actions"><button id="hdExportCancel" type="button">Đóng</button><button id="hdExportGo" type="button">Tạo tệp</button></div><div id="hdExportStatus" role="status" aria-live="polite"></div></dialog>';
 document.body.append(host);const dlg=$('#hdExportDialog');
 $('#hdExportOpen').addEventListener('click',()=>{const r=record();$('#hdExportStatus').textContent='Tài liệu: '+(r.title||r.id)+' · '+(r.id||'chưa có ID');if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','')});
 $('#hdExportCancel').addEventListener('click',()=>dlg.close?dlg.close():dlg.removeAttribute('open'));
 $('#hdExportGo').addEventListener('click',async()=>{const btn=$('#hdExportGo');btn.disabled=true;$('#hdExportStatus').textContent='Đang chuẩn bị dữ liệu…';
 try{if($('#save')){$('#save').click();await wait(800)}else await wait(350);const result=await run($('#hdExportFormat').value);$('#hdExportStatus').textContent='Đã tạo lệnh xuất: '+result+'. Kiểm tra tệp tải xuống hoặc hộp thoại in.'}
 catch(e){$('#hdExportStatus').textContent='Không xuất được: '+(e.message||e)}
 finally{btn.disabled=false}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.HaiDatExportStudio={version:'4.6',run};
})();