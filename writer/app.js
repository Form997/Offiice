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
        if (!allowed.has(child.tagName)) { child.replaceWith(...child.childNodes); return; }
        [...child.attributes].forEach(attr => {
          const key=attr.name.toLowerCase(), val=attr.value;
          if (key.startsWith('on') || key === 'contenteditable' || key === 'id' || key === 'class') child.removeAttribute(attr.name);
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
  updateStats();
})();