(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const editor = $('#editor'), titleInput = $('#docTitle');
  const STORE = 'haidat-writer-documents-v2';
  let documents = [], activeId = null, saveTimer = null, deferredInstall = null, dirty = false;

  const makeId = () => 'doc-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const safeName = (name) => (name || 'van-ban').replace(/[\\/:*?"<>|]+/g, '-').trim().slice(0, 90) || 'van-ban';
  const setState = (text, state='') => { const el=$('#saveState'); el.textContent=text; el.dataset.state=state; };
  const current = () => documents.find(d => d.id === activeId);
  const plainText = () => editor.innerText || editor.textContent || '';

  function sanitizeHTML(input) {
    const parsed = new DOMParser().parseFromString(input, 'text/html');
    const allowed = new Set(['P','BR','DIV','SPAN','H1','H2','H3','H4','BLOCKQUOTE','PRE','B','STRONG','I','EM','U','S','STRIKE','UL','OL','LI','A','TABLE','THEAD','TBODY','TR','TH','TD','IMG','HR','SUB','SUP']);
    const clean = (node) => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === Node.COMMENT_NODE) { child.remove(); return; }
        if (child.nodeType !== Node.ELEMENT_NODE) return;
        if (!allowed.has(child.tagName)) { clean(child); child.replaceWith(...child.childNodes); return; }
        [...child.attributes].forEach(attr => {
          const key=attr.name.toLowerCase(), val=attr.value;
          if (key.startsWith('on') || key === 'contenteditable' || key === 'id') child.removeAttribute(attr.name);\n          else if (key === 'class') { if (!(child.tagName === 'DIV' && val.split(/\\s+/).includes('page-break'))) child.removeAttribute(attr.name); }
          else if (key === 'href' && !/^(https?:|mailto:|tel:)/i.test(val)) child.removeAttribute(attr.name);
          else if (key === 'src' && child.tagName === 'IMG' && !/^(data:image\\/(png|jpeg|gif|webp);base64,|https?:)/i.test(val)) child.removeAttribute(attr.name);
          else if (key === 'style') {
            const safe = val.split(';').filter(rule => /^(color|background-color|font-weight|font-style|text-decoration|text-align|font-size|font-family|width|max-width|height)\\s*:/i.test(rule.trim()) && !/url\\s*\\(|expression|javascript/i.test(rule)).join(';');
            if (safe) child.setAttribute('style', safe); else child.removeAttribute('style');
          } else if (!['href','src','alt','title','colspan','rowspan','style','width','height'].includes(key)) child.removeAttribute(attr.name);
        });
        clean(child);
      });
    };
    clean(parsed.body);
    return parsed.body.innerHTML;
  }

  function persist(show=true) {
    const doc=current(); if (!doc) return;
    doc.title=titleInput.value.trim() || 'Tài liệu chưa đặt tên';
    doc.html=editor.innerHTML;
    doc.updatedAt=Date.now();
    try {
      localStorage.setItem(STORE, JSON.stringify(documents));
      dirty=false; if(show) setState('Đã lưu trên thiết bị','saved');
      renderDocList();
    } catch (err) {
      setState('Không đủ bộ nhớ · hãy xuất tệp','error');
    }
  }
  function scheduleSave() {
    dirty=true; setState('Đang chờ lưu…','pending');
    clearTimeout(saveTimer);
    saveTimer=setTimeout(()=>persist(),500);
    updateStats();
  }
  function renderDocList() {
    const list=$('#docList'); if(!list) return;
    list.replaceChildren();
    documents.slice().sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).forEach(doc=>{
      const option=document.createElement('option'); option.value=doc.id; option.textContent=doc.title || 'Chưa đặt tên'; list.append(option);
    });
    list.value=activeId;
  }
  function loadDoc(id) {
    const doc=documents.find(d=>d.id===id); if(!doc) return;
    clearTimeout(saveTimer); activeId=id; titleInput.value=doc.title; editor.innerHTML=sanitizeHTML(doc.html || '<p><br></p>');
    dirty=false; renderDocList(); updateStats(); setState('Đã mở tài liệu','saved');
  }
  function createDoc() {
    if(dirty) persist(false);
    const doc={id:makeId(),title:'Tài liệu mới',html:'<h1>Tài liệu mới</h1><p><br></p>',updatedAt:Date.now()};
    documents.push(doc); loadDoc(doc.id); titleInput.focus(); titleInput.select(); scheduleSave();
  }
  function download(name,data,type) {
    const url=URL.createObjectURL(new Blob([data],{type}));
    const a=document.createElement('a'); a.href=url; a.download=name; document.body.append(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  function exportHTML() {
    persist(false);
    const doc=current();
    const output='<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escapeHTML(doc.title)+'</title><style>body{max-width:850px;margin:40px auto;padding:0 24px;font:12pt/1.65 Arial,sans-serif}table{border-collapse:collapse;width:100%}td,th{border:1px solid #777;padding:6px}img{max-width:100%;height:auto}</style></head><body>'+editor.innerHTML+'</body></html>';
    download(safeName(doc.title)+'.html',output,'text/html;charset=utf-8');
  }
  function escapeHTML(s) { return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function updateStats() {
    const text=plainText().replace(/\\u00a0/g,' ').trim();
    $('#wordCount').textContent=text ? (text.match(/[\\p{L}\\p{N}]+(?:[’'-][\\p{L}\\p{N}]+)*/gu)||[]).length : 0;
    $('#charCount').textContent=text.length;
    $('#paraCount').textContent=[...editor.querySelectorAll('p,h1,h2,h3,h4,li,blockquote')].filter(el=>el.innerText.trim()).length;
  }
  function command(cmd,value=null) { editor.focus(); document.execCommand(cmd,false,value); scheduleSave(); }
  function insertTable() {
    const rows=Math.max(1,Math.min(20,Number(prompt('Số hàng (1–20):','3'))||0));
    const cols=Math.max(1,Math.min(10,Number(prompt('Số cột (1–10):','3'))||0));
    if(!rows||!cols) return;
    let html='<table><tbody>';
    for(let r=0;r<rows;r++){html+='<tr>';for(let c=0;c<cols;c++)html+='<td><br></td>';html+='</tr>';}
    html+='</tbody></table><p><br></p>'; command('insertHTML',html);
  }
  function insertLink() {
    const url=prompt('Nhập địa chỉ liên kết (https://…):'); if(!url) return;
    if(!/^(https?:|mailto:|tel:)/i.test(url)){alert('Chỉ hỗ trợ liên kết http, https, mailto hoặc tel.');return;}
    const selection=window.getSelection();
    if(!selection || !selection.toString()) { const label=prompt('Tên hiển thị liên kết:',url)||url; command('insertHTML','<a href="'+escapeHTML(url)+'">'+escapeHTML(label)+'</a>'); }
    else command('createLink',url);
  }
  function addImage(file) {
    if(!file || !file.type.startsWith('image/')) return;
    if(file.size>8*1024*1024){alert('Ảnh lớn hơn 8 MB. Hãy chọn ảnh nhỏ hơn.');return;}
    const reader=new FileReader();
    reader.onload=()=>{command('insertHTML','<img src="'+reader.result+'" alt="'+escapeHTML(file.name)+'">');};
    reader.readAsDataURL(file);
  }
  function openFile(file) {
    if(!file) return;
    const reader=new FileReader();
    reader.onload=()=>{
      const raw=String(reader.result||'');
      const html=/\\.html?$/i.test(file.name)||file.type==='text/html' ? raw : '<p>'+escapeHTML(raw).replace(/\\r?\\n/g,'</p><p>')+'</p>';
      const doc={id:makeId(),title:file.name.replace(/\\.(html?|txt)$/i,''),html:sanitizeHTML(html),updatedAt:Date.now()};
      documents.push(doc); loadDoc(doc.id); scheduleSave();
    };
    reader.readAsText(file);
  }

  try {
    const stored=JSON.parse(localStorage.getItem(STORE)||'[]');
    if(Array.isArray(stored)) documents=stored.filter(d=>d && typeof d.id==='string');
    if(!documents.length) {
      const legacy=JSON.parse(localStorage.getItem('haidat-writer')||'null');
      documents=[{id:makeId(),title:legacy?.title||'Tài liệu chưa đặt tên',html:legacy?.html||editor.innerHTML,updatedAt:Date.now()}];
    }
  } catch { documents=[{id:makeId(),title:'Tài liệu chưa đặt tên',html:editor.innerHTML,updatedAt:Date.now()}]; }
  activeId=documents[0].id; loadDoc(activeId);

  editor.addEventListener('input',scheduleSave);
  titleInput.addEventListener('input',scheduleSave);
  document.querySelectorAll('[data-cmd]').forEach(btn=>btn.addEventListener('click',()=>command(btn.dataset.cmd)));
  document.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>command(btn.dataset.action)));
  $('#blockType').addEventListener('change',e=>command('formatBlock',e.target.value));
  $('#fontName').addEventListener('change',e=>command('fontName',e.target.value));
  $('#fontSize').addEventListener('change',e=>command('fontSize',e.target.value));
  $('#textColor').addEventListener('input',e=>command('foreColor',e.target.value));
  $('#highlightColor').addEventListener('input',e=>command('hiliteColor',e.target.value));
  $('#outdent').onclick=()=>command('outdent'); $('#indent').onclick=()=>command('indent');
  $('#addLink').onclick=insertLink; $('#addTable').onclick=insertTable;
  $('#addImage').onclick=()=>$('#imageFile').click();
  $('#imageFile').onchange=e=>{addImage(e.target.files[0]);e.target.value='';};
  $('#clearFormat').onclick=()=>command('removeFormat');
  $('#newDoc').onclick=createDoc;
  $('#docList').onchange=e=>{if(dirty)persist(false);loadDoc(e.target.value);};
  $('#renameDoc').onclick=()=>{titleInput.focus();titleInput.select();};
  $('#deleteDoc').onclick=()=>{
    if(documents.length===1){if(!confirm('Xóa nội dung tài liệu hiện tại?'))return;current().html='<p><br></p>';current().title='Tài liệu chưa đặt tên';loadDoc(activeId);scheduleSave();return;}
    if(!confirm('Xóa hẳn tài liệu này khỏi thiết bị?'))return;
    documents=documents.filter(d=>d.id!==activeId);activeId=documents[0].id;loadDoc(activeId);persist();
  };
  $('#saveNow').onclick=()=>{clearTimeout(saveTimer);persist();};
  $('#exportHtml').onclick=exportHTML;
  $('#exportTxt').onclick=()=>{persist(false);download(safeName(current().title)+'.txt',plainText(),'text/plain;charset=utf-8');};
  $('#printDoc').onclick=()=>{persist(false);window.print();};
  $('#openFile').onchange=e=>{openFile(e.target.files[0]);e.target.value='';};
  document.addEventListener('keydown',e=>{
    const mod=e.ctrlKey||e.metaKey;
    if(mod && e.key.toLowerCase()==='s'){e.preventDefault();clearTimeout(saveTimer);persist();}
    if(mod && e.key.toLowerCase()==='b' && document.activeElement===editor){e.preventDefault();command('bold');}
    if(mod && e.key.toLowerCase()==='i' && document.activeElement===editor){e.preventDefault();command('italic');}
    if(mod && e.key.toLowerCase()==='u' && document.activeElement===editor){e.preventDefault();command('underline');}
  });
  window.addEventListener('beforeunload',()=>{if(dirty)persist(false);});
  if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;$('#install').hidden=false;});
  $('#install').onclick=async()=>{if(deferredInstall){deferredInstall.prompt();deferredInstall=null;}};

  // DOCX: build a minimal Office Open XML package locally (no server/API).
  const encoder = new TextEncoder();
  const xmlEscape = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const crcTable = (()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let x=n;for(let k=0;k<8;k++)x=(x&1)?(0xedb88320^(x>>>1)):(x>>>1);t[n]=x>>>0;}return t;})();
  function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
  function zipStore(files){
    const chunks=[],central=[];let offset=0;
    const u16=n=>[n&255,(n>>>8)&255],u32=n=>[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255];
    for(const [name,data] of Object.entries(files)){
      const n=encoder.encode(name),d=typeof data==='string'?encoder.encode(data):data,crc=crc32(d);
      const local=new Uint8Array([...u32(0x04034b50),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(d.length),...u32(d.length),...u16(n.length),...u16(0),...n,...d]);
      chunks.push(local);
      central.push(new Uint8Array([...u32(0x02014b50),...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(d.length),...u32(d.length),...u16(n.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset),...n]));
      offset+=local.length;
    }
    const centralSize=central.reduce((s,x)=>s+x.length,0),end=new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(central.length),...u16(central.length),...u32(centralSize),...u32(offset),...u16(0)]);
    return new Blob([...chunks,...central,end],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  }
  function runXML(node){
    const tag=node.tagName,style=node.getAttribute?.('style')||'';
    if(tag==='BR')return '<w:r><w:br/></w:r>';
    if(tag==='IMG')return '';
    if(tag==='TABLE')return '';
    if(node.nodeType===Node.TEXT_NODE)return node.nodeValue?'<w:r><w:t xml:space="preserve">'+xmlEscape(node.nodeValue)+'</w:t></w:r>':'';
    if(node.nodeType!==Node.ELEMENT_NODE)return '';
    let props='';
    if(tag==='B'||tag==='STRONG')props+='<w:b/>';
    if(tag==='I'||tag==='EM')props+='<w:i/>';
    if(tag==='U')props+='<w:u w:val="single"/>';
    if(tag==='S'||tag==='STRIKE')props+='<w:strike/>';
    if(props) return '<w:r><w:rPr>'+props+'</w:rPr><w:t>'+xmlEscape(node.textContent||'')+'</w:t></w:r>';
    return [...node.childNodes].map(runXML).join('');
  }
  function paragraphXML(el){
    if(el.classList?.contains('page-break'))return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
    let pPr='';
    const tag=el.tagName;
    if(/^H[1-3]$/.test(tag))pPr='<w:pPr><w:pStyle w:val="Heading'+tag.slice(1)+'"/></w:pPr>';
    else if(tag==='BLOCKQUOTE')pPr='<w:pPr><w:ind w:left="360"/></w:pPr>';
    const align=el.style?.textAlign;if(align)pPr=pPr.replace('</w:pPr>','<w:jc w:val="'+({left:'left',center:'center',right:'right',justify:'both'}[align]||'left')+'"/></w:pPr>');
    return '<w:p>'+pPr+[...el.childNodes].map(runXML).join('')+'</w:p>';
  }
  function tableXML(table){
    const rows=[...table.rows].map(row=>'<w:tr>'+[...row.cells].map(cell=>'<w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/></w:tcPr>'+([...cell.children].map(ch=>paragraphXML(ch)).join('')||'<w:p>'+xmlEscape(cell.textContent||'')+'</w:p>')+'</w:tc>').join('')+'</w:tr>').join('');
    return '<w:tbl><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4"/><w:left w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>'+rows+'</w:tbl>';
  }
  function exportDocx(){
    persist(false);
    const body=[...editor.children].map(el=>el.tagName==='TABLE'?tableXML(el):paragraphXML(el)).join('')||'<w:p/>';
    const paper=$('#paperSize').value,margin=Math.round(Number($('#pageMargin').value||20)*56.7);
    const dimensions={A4:[11906,16838],A5:[8391,11906],Letter:[12240,15840]}[paper]||[11906,16838];
    const documentXML='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+body+'<w:sectPr><w:pgSz w:w="'+dimensions[0]+'" w:h="'+dimensions[1]+'"/><w:pgMar w:top="'+margin+'" w:right="'+margin+'" w:bottom="'+margin+'" w:left="'+margin+'" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>';
    const files={
      '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
      '_rels/.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
      'word/document.xml':documentXML,
      'word/styles.xml':'<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/></w:style></w:styles>'
    };
    const blob=zipStore(files),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=safeName(current().title)+'.docx';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
  }
  async function unzipText(file,target){
    const buf=await file.arrayBuffer(),view=new DataView(buf);let eocd=-1;
    for(let p=view.byteLength-22;p>=Math.max(0,view.byteLength-65558);p--){if(view.getUint32(p,true)===0x06054b50){eocd=p;break;}}
    if(eocd<0)throw new Error('Tệp DOCX không có cấu trúc ZIP hợp lệ.');
    const count=view.getUint16(eocd+10,true),start=view.getUint32(eocd+16,true),decoder=new TextDecoder();
    let pos=start;
    for(let i=0;i<count;i++){
      if(view.getUint32(pos,true)!==0x02014b50)break;
      const method=view.getUint16(pos+10,true),compressed=view.getUint32(pos+20,true),nameLen=view.getUint16(pos+28,true),extra=view.getUint16(pos+30,true),comment=view.getUint16(pos+32,true),localOffset=view.getUint32(pos+42,true);
      const name=decoder.decode(new Uint8Array(buf,pos+46,nameLen));
      if(name===target){
        const localName=view.getUint16(localOffset+26,true),localExtra=view.getUint16(localOffset+28,true),dataStart=localOffset+30+localName+localExtra;
        let bytes=new Uint8Array(buf,dataStart,compressed);
        if(method===8){if(typeof DecompressionStream==='undefined')throw new Error('Trình duyệt này chưa hỗ trợ giải nén DOCX. Hãy thử Chrome hoặc Edge mới.');const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));bytes=new Uint8Array(await new Response(stream).arrayBuffer());}
        else if(method!==0)throw new Error('Kiểu nén DOCX chưa được hỗ trợ.');
        return decoder.decode(bytes);
      }
      pos+=46+nameLen+extra+comment;
    }
    throw new Error('Không tìm thấy nội dung chính trong DOCX.');
  }
  async function importDocx(file){
    try{
      const xml=await unzipText(file,'word/document.xml'),doc=new DOMParser().parseFromString(xml,'application/xml');
      if(doc.querySelector('parsererror'))throw new Error('Không đọc được XML trong tài liệu Word.');
      const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
      const body=doc.getElementsByTagNameNS(ns,'body')[0];if(!body)throw new Error('Tài liệu Word không có phần nội dung.');
      let html='';
      const textOf=el=>[...el.getElementsByTagNameNS(ns,'t')].map(t=>t.textContent).join('');
      for(const node of body.children){
        if(node.localName==='p'){
          const pPr=node.getElementsByTagNameNS(ns,'pPr')[0],style=pPr?.getElementsByTagNameNS(ns,'pStyle')[0]?.getAttributeNS(ns,'val')||'';
          const tag=/Heading1/i.test(style)?'h1':/Heading2/i.test(style)?'h2':/Heading3/i.test(style)?'h3':'p';
          let inner='';
          for(const run of [...node.children].filter(x=>x.localName==='r')){
            let t=[...run.getElementsByTagNameNS(ns,'t')].map(x=>xmlEscape(x.textContent)).join('');
            if([...run.getElementsByTagNameNS(ns,'br')].length)t+='<br>';
            const rp=run.getElementsByTagNameNS(ns,'rPr')[0];
            if(rp?.getElementsByTagNameNS(ns,'b').length)t='<strong>'+t+'</strong>';
            if(rp?.getElementsByTagNameNS(ns,'i').length)t='<em>'+t+'</em>';
            if(rp?.getElementsByTagNameNS(ns,'u').length)t='<u>'+t+'</u>';
            inner+=t;
          }
          html+='<'+tag+'>'+inner+'</'+tag+'>';
        } else if(node.localName==='tbl'){
          html+='<table><tbody>';
          for(const tr of [...node.children].filter(x=>x.localName==='tr')){
            html+='<tr>';
            for(const tc of [...tr.children].filter(x=>x.localName==='tc'))html+='<td>'+[...tc.getElementsByTagNameNS(ns,'p')].map(p=>xmlEscape(textOf(p))).join('<br>')+'</td>';
            html+='</tr>';
          }
          html+='</tbody></table>';
        }
      }
      const newDoc={id:makeId(),title:file.name.replace(/\.docx$/i,''),html:sanitizeHTML(html||'<p><br></p>'),updatedAt:Date.now()};
      documents.push(newDoc);loadDoc(newDoc.id);scheduleSave();
    }catch(err){alert('Không mở được DOCX: '+err.message);}
  }
  function applyPageSettings(){
    const sizes={A4:[210,297],A5:[148,210],Letter:[216,279]},s=sizes[$('#paperSize').value]||sizes.A4;
    const margin=Math.max(5,Math.min(50,Number($('#pageMargin').value)||20));
    editor.style.width=s[0]+'mm';editor.style.minHeight=s[1]+'mm';editor.style.padding=margin+'mm';
    let style=$('#dynamicPrintStyle');if(!style){style=document.createElement('style');style.id='dynamicPrintStyle';document.head.append(style);}
    style.textContent='@page{size:'+$('#paperSize').value+';margin:'+margin+'mm}';
    try{localStorage.setItem('haidat-writer-page-settings',JSON.stringify({paper:$('#paperSize').value,margin}));}catch{}
  }

  $('#exportDocx').onclick=exportDocx;
  $('#openDocx').onchange=e=>{const f=e.target.files[0];if(f)importDocx(f);e.target.value='';};
  $('#paperSize').onchange=applyPageSettings;$('#pageMargin').onchange=applyPageSettings;
  $('#insertPageBreak').onclick=()=>command('insertHTML','<div class="page-break"></div><p><br></p>');
  try{const ps=JSON.parse(localStorage.getItem('haidat-writer-page-settings')||'null');if(ps){$('#paperSize').value=ps.paper||'A4';$('#pageMargin').value=ps.margin||20;}}catch{}
  applyPageSettings();
  updateStats();
  // Ribbon tabs: switch panels without changing editor content or save state.
  document.querySelectorAll('.ribbon-tab').forEach(tab=>tab.addEventListener('click',()=>{
    document.querySelectorAll('.ribbon-tab').forEach(t=>{const active=t===tab;t.classList.toggle('active',active);t.setAttribute('aria-selected',String(active));});
    document.querySelectorAll('.ribbon-panel').forEach(panel=>{const active=panel.id==='panel-'+tab.dataset.tab;panel.hidden=!active;panel.classList.toggle('active',active);});
  }));
  // Keep the existing page controls and statistics in their corresponding ribbon tabs.
  const pagePanel=$('#pageSetupRibbon'), side=$('.sidepanel');
  if(pagePanel&&side){const labels=[...side.querySelectorAll('.setting')];labels.forEach(label=>pagePanel.append(label));const pageBreak=$('#insertPageBreak');if(pageBreak)pagePanel.append(pageBreak);}
  const statsPanel=$('#panel-view');
  const syncRibbonStats=()=>{[['wordCount','ribbonWordCount'],['charCount','ribbonCharCount'],['paraCount','ribbonParaCount']].forEach(([a,b])=>{const x=$('#'+a),y=$('#'+b);if(x&&y)y.textContent=x.textContent;});};
  const statsObserver=new MutationObserver(syncRibbonStats);
  ['wordCount','charCount','paraCount'].forEach(id=>{const el=$('#'+id);if(el)statsObserver.observe(el,{childList:true,characterData:true,subtree:true});});
  syncRibbonStats();
  $('#focusEditor').onclick=()=>{editor.focus();editor.scrollIntoView({behavior:'smooth',block:'center'});};
  document.querySelectorAll('[data-proxy]').forEach(btn=>btn.addEventListener('click',()=>{
    const target=$('#'+btn.dataset.proxy);if(!target)return;
    if(target.type==='file')target.click();else target.click();
  }));

})();
