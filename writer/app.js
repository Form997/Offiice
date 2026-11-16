(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const editor = $('#editor'), titleInput = $('#docTitle');
  const STORE = 'haidat-writer-documents-v2';
  let documents = [], activeId = null, saveTimer = null, deferredInstall = null, dirty = false, savedEditorRange = null, currentFileHandle = null, workDirectoryHandle = null;

  const makeId = () => 'doc-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const safeName = (name) => (name || 'van-ban').replace(/[\\/:*?"<>|]+/g, '-').trim().slice(0, 90) || 'van-ban';
  const setState = (text, state='') => { const el=$('#saveState'); el.textContent=text; el.dataset.state=state; };

  const FILE_DB='haidat-writer-file-handles-v1', FILE_STORE='handles';
  function handleDB(){return new Promise((resolve,reject)=>{if(!('indexedDB' in window)){resolve(null);return;}const r=indexedDB.open(FILE_DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(FILE_STORE))r.result.createObjectStore(FILE_STORE);};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
  async function storeHandle(k,v){const db=await handleDB();if(!db)return;return new Promise((resolve,reject)=>{const tx=db.transaction(FILE_STORE,'readwrite');tx.objectStore(FILE_STORE).put(v,k);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};});}
  async function readHandle(k){const db=await handleDB();if(!db)return null;return new Promise((resolve,reject)=>{const tx=db.transaction(FILE_STORE,'readonly'),r=tx.objectStore(FILE_STORE).get(k);r.onsuccess=()=>{db.close();resolve(r.result||null);};r.onerror=()=>{db.close();reject(r.error);};});}
  async function permission(h,write=false){if(!h)return false;const o={mode:write?'readwrite':'read'};if(await h.queryPermission(o)==='granted')return true;return await h.requestPermission(o)==='granted';}
  async function initFileHandles(){try{workDirectoryHandle=await readHandle('directory');currentFileHandle=await readHandle('file');if(workDirectoryHandle)$('#workFolderStatus').textContent='Thư mục làm việc: '+workDirectoryHandle.name;}catch{}}
  function extOf(n){return (String(n).match(/\.([^.]+)$/)||[])[1]?.toLowerCase()||'docx';}
  function makeHtmlFile(){const d=current();return '<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>'+escapeHTML(d.title)+'</title></head><body>'+editor.innerHTML+'</body></html>';}
  function makeFileBlob(ext){if(ext==='docx')return exportDocx(true);if(['html','htm'].includes(ext))return new Blob([makeHtmlFile()],{type:'text/html;charset=utf-8'});if(['txt','md','markdown','csv'].includes(ext))return new Blob([plainText()],{type:ext==='txt'?'text/plain;charset=utf-8':'text/markdown;charset=utf-8'});if(ext==='rtf')return new Blob(['{\\rtf1\\ansi '+plainText().replace(/[{}\\]/g,' ')+'}'],{type:'application/rtf'});throw new Error('Chưa hỗ trợ lưu .'+ext+'. Hãy chọn DOCX, HTML, TXT, MD hoặc RTF.');}
  async function writeFile(h,b){const w=await h.createWritable();await w.write(b);await w.close();}
  async function saveAsFile(){
    clearTimeout(saveTimer);persist(false);
    if(window.showSaveFilePicker){try{const h=await window.showSaveFilePicker({suggestedName:safeName(current().title)+'.docx',types:[{description:'Word',accept:{'application/vnd.openxmlformats-officedocument.wordprocessingml.document':['.docx']}},{description:'HTML',accept:{'text/html':['.html']}},{description:'Text',accept:{'text/plain':['.txt']}},{description:'RTF',accept:{'application/rtf':['.rtf']}},{description:'Markdown',accept:{'text/markdown':['.md']}}]});await writeFile(h,makeFileBlob(extOf(h.name)));currentFileHandle=h;await storeHandle('file',h);setState('Đã lưu: '+h.name,'saved');return;}catch(e){if(e.name!=='AbortError')alert('Lỗi lưu tệp: '+e.message);return;}}
    const b=makeFileBlob('docx'),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=safeName(current().title)+'.docx';a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);setState('Đã tải DOCX xuống thiết bị','saved');
  }
  async function saveCurrentFile(){
    clearTimeout(saveTimer);persist(false);
    try{if(currentFileHandle&&await permission(currentFileHandle,true)){await writeFile(currentFileHandle,makeFileBlob(extOf(currentFileHandle.name)));setState('Đã lưu: '+currentFileHandle.name,'saved');return;}}catch(e){setState('Không ghi được tệp hiện tại','error');}
    if(workDirectoryHandle&&await permission(workDirectoryHandle,true)){try{const n=safeName(current().title)+'.docx',h=await workDirectoryHandle.getFileHandle(n,{create:true});await writeFile(h,makeFileBlob('docx'));currentFileHandle=h;await storeHandle('file',h);setState('Đã lưu trong '+workDirectoryHandle.name,'saved');return;}catch(e){alert('Lỗi thư mục: '+e.message);return;}}
    await saveAsFile();
  }
  async function chooseWorkFolder(){
    if(!window.showDirectoryPicker){alert('Chọn thư mục trực tiếp cần Chrome hoặc Edge mới trên máy tính. Trình duyệt này vẫn dùng được hộp thoại Mở/Lưu thành.');return;}
    try{const h=await window.showDirectoryPicker({id:'haidat-writer-workspace',mode:'readwrite'});if(!await permission(h,true))return;workDirectoryHandle=h;await storeHandle('directory',h);$('#workFolderStatus').textContent='Thư mục làm việc: '+h.name;setState('Đã chọn thư mục','saved');}catch(e){if(e.name!=='AbortError')alert(e.message);}
  }
  async function openFromComputer(){
    if(!window.showOpenFilePicker){$('#openFile').click();return;}
    try{const o={multiple:false,types:[{description:'Tài liệu',accept:{'application/vnd.openxmlformats-officedocument.wordprocessingml.document':['.docx'],'application/vnd.oasis.opendocument.text':['.odt'],'text/html':['.html','.htm'],'text/plain':['.txt','.md','.csv'],'application/rtf':['.rtf']}}]};if(workDirectoryHandle)o.startIn=workDirectoryHandle;const [h]=await window.showOpenFilePicker(o);await openAnyFile(await h.getFile());currentFileHandle=h;await storeHandle('file',h);}catch(e){if(e.name!=='AbortError')alert('Không mở được: '+e.message);}
  }
  function addLoadedFile(name,content){const d={id:makeId(),title:name.replace(/\.[^.]+$/,''),html:sanitizeHTML(content||'<p><br></p>'),updatedAt:Date.now()};documents.push(d);loadDoc(d.id);scheduleSave();}
  async function openAnyFile(file){
    if(!file)return;const ext=extOf(file.name);
    try{
      if(ext==='docx'){await importDocx(file);return;}
      if(ext==='doc')throw new Error('DOC cũ (Word 97–2003) chưa đọc trực tiếp được. Hãy chuyển sang DOCX bằng Word hoặc LibreOffice.');
      if(ext==='pdf')throw new Error('PDF chưa chuyển thành văn bản chỉnh sửa được; dùng In / Lưu PDF để xuất PDF.');
      if(ext==='odt'){const x=await unzipText(file,'content.xml'),d=new DOMParser().parseFromString(x,'application/xml');if(d.querySelector('parsererror'))throw new Error('Tệp ODT lỗi XML.');const ns='urn:oasis:names:tc:opendocument:xmlns:text:1.0';addLoadedFile(file.name,[...d.getElementsByTagNameNS(ns,'p'),...d.getElementsByTagNameNS(ns,'h')].map(p=>'<p>'+escapeHTML(p.textContent)+'</p>').join(''));return;}
      const raw=await file.text();let body='';
      if(['html','htm'].includes(ext))body=raw;
      else if(ext==='rtf')body='<p>'+escapeHTML(raw.replace(/\\par[d]?/g,'\n').replace(/\\[a-z]+-?\d* ?/gi,'').replace(/[{}]/g,'')).replace(/\n/g,'</p><p>')+'</p>';
      else if(ext==='csv'){body='<table><tbody>'+raw.split(/\r?\n/).filter(Boolean).map((r,i)=>'<tr>'+r.split(',').map(c=>(i===0?'<th>':'<td>')+escapeHTML(c)+(i===0?'</th>':'</td>')).join('')+'</tr>').join('')+'</tbody></table>';}
      else if(['txt','md','markdown'].includes(ext))body='<p>'+escapeHTML(raw).replace(/\r?\n/g,'</p><p>')+'</p>';
      else throw new Error('Định dạng .'+ext+' chưa hỗ trợ.');
      addLoadedFile(file.name,body);
    }catch(e){alert('Không mở được '+file.name+': '+e.message);}
  }
  async function openFromChosenFolder(){await openFromComputer();}
  function closeCurrentFile(){
    if(dirty&&!confirm('Tài liệu có thay đổi chưa lưu. Đóng tệp? Bản đang lưu trên thiết bị sẽ vẫn được giữ.'))return;
    if(dirty)persist(false);currentFileHandle=null;storeHandle('file',null).catch(()=>{});
    const d={id:makeId(),title:'Tài liệu mới',html:'<h1>Tài liệu mới</h1><p><br></p>',updatedAt:Date.now()};documents.push(d);loadDoc(d.id);persist(false);setState('Đã đóng tệp · bản nội bộ vẫn được giữ','saved');
  }

  const current = () => documents.find(d => d.id === activeId);
  const plainText = () => editor.innerText || editor.textContent || '';

  function sanitizeHTML(input) {
    const parsed = new DOMParser().parseFromString(input, 'text/html');
    const allowed = new Set(['P','BR','DIV','SECTION','SPAN','FONT','H1','H2','H3','H4','BLOCKQUOTE','PRE','B','STRONG','I','EM','U','S','STRIKE','UL','OL','LI','A','TABLE','THEAD','TBODY','TR','TH','TD','IMG','HR','SUB','SUP']);
    const clean = (node) => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === Node.COMMENT_NODE) { child.remove(); return; }
        if (child.nodeType !== Node.ELEMENT_NODE) return;
        if (!allowed.has(child.tagName)) { clean(child); child.replaceWith(...child.childNodes); return; }
        [...child.attributes].forEach(attr => {
          const key=attr.name.toLowerCase(), val=attr.value;
          if (key.startsWith('on') || key === 'contenteditable') child.removeAttribute(attr.name);
          else if (key === 'id') { if (!/^hd-[a-z0-9-]+$/i.test(val)) child.removeAttribute(attr.name); }
          else if (key === 'class') { const allowedClasses=new Set(['page-break','section-break','hd-toc','hd-citation','toc-level-h1','toc-level-h2','toc-level-h3']); if (!val.split(/\s+/).every(c=>allowedClasses.has(c))) child.removeAttribute(attr.name); }
          else if (key === 'href' && !/^(https?:|mailto:|tel:)/i.test(val) && !/^#hd-[a-z0-9-]+$/i.test(val)) child.removeAttribute(attr.name);
          else if (key === 'src' && child.tagName === 'IMG' && !/^(data:image\/(png|jpeg|gif|webp);base64,|https?:)/i.test(val)) child.removeAttribute(attr.name);
          else if (['face','color','size'].includes(key) && child.tagName === 'FONT') { /* safe legacy font attributes */ }
          else if (key === 'style') {
            const safe = val.split(';').filter(rule => /^(color|background-color|font-weight|font-style|text-decoration|text-align|font-size|font-family|width|max-width|height|line-height|margin-top|margin-bottom|text-indent)\s*:/i.test(rule.trim()) && !/url\s*\(|expression|javascript/i.test(rule)).join(';');
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
    const text=plainText().replace(/\u00a0/g,' ').trim();
    $('#wordCount').textContent=text ? (text.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu)||[]).length : 0;
    $('#charCount').textContent=text.length;
    $('#paraCount').textContent=[...editor.querySelectorAll('p,h1,h2,h3,h4,li,blockquote')].filter(el=>el.innerText.trim()).length;
    const words=Number($('#wordCount').textContent)||0,chars=Number($('#charCount').textContent)||0;
    const live=$('#editorLiveStats'),read=$('#editorReadTime');
    if(live)live.textContent=words.toLocaleString('vi-VN')+' từ · '+chars.toLocaleString('vi-VN')+' ký tự';
    if(read)read.textContent='Đọc khoảng '+(words?Math.max(1,Math.ceil(words/200)):0)+' phút';
  }
  function rememberEditorSelection(){
    const sel=window.getSelection();
    if(!sel||!sel.rangeCount)return;
    const range=sel.getRangeAt(0);
    if(editor.contains(range.commonAncestorContainer))savedEditorRange=range.cloneRange();
  }
  function restoreEditorSelection(){
    if(!savedEditorRange)return false;
    if(!editor.contains(savedEditorRange.commonAncestorContainer)){savedEditorRange=null;return false;}
    const sel=window.getSelection();sel.removeAllRanges();sel.addRange(savedEditorRange);return true;
  }
  function command(cmd,value=null) {
    restoreEditorSelection();
    document.execCommand('styleWithCSS',false,true);
    editor.focus();
    document.execCommand(cmd,false,value);
    rememberEditorSelection();
    scheduleSave();
  }

  function applyParagraphFormatting(){
    restoreEditorSelection();
    const line=Number($('#lineSpacing').value)||1.15,after=Number($('#paragraphAfter').value)||0;
    const sel=window.getSelection();
    let block=sel&&sel.anchorNode?(sel.anchorNode.nodeType===Node.ELEMENT_NODE?sel.anchorNode:sel.anchorNode.parentElement):null;
    while(block&&block!==editor&&!/^(P|H1|H2|H3|H4|LI|BLOCKQUOTE)$/.test(block.tagName))block=block.parentElement;
    const targets=block&&block!==editor?[block]:[...editor.querySelectorAll('p,h1,h2,h3,h4,li,blockquote')];
    targets.forEach(el=>{el.style.lineHeight=String(line);el.style.marginBottom=after+'pt';});
    scheduleSave();setState('Đã áp dụng định dạng đoạn','saved');
  }
  const TEMPLATE_HTML={
    report:'<h1>BÁO CÁO</h1><p><strong>Đơn vị:</strong> …</p><p><strong>Thời gian:</strong> …</p><h2>I. MỤC ĐÍCH</h2><p>…</p><h2>II. NỘI DUNG</h2><p>…</p><h2>III. KẾT QUẢ</h2><p>…</p><h2>IV. KIẾN NGHỊ</h2><p>…</p><p>…, ngày … tháng … năm …</p><p style="text-align:right"><strong>NGƯỜI LẬP BÁO CÁO</strong></p>',
    letter:'<p style="text-align:center"><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p><p style="text-align:center">Độc lập - Tự do - Hạnh phúc</p><p style="text-align:right">…, ngày … tháng … năm …</p><h1 style="text-align:center">TÊN VĂN BẢN</h1><p><strong>Kính gửi:</strong> …</p><p>…</p><p>Trân trọng.</p><p style="text-align:right"><strong>NGƯỜI KÝ</strong></p>',
    minutes:'<h1 style="text-align:center">BIÊN BẢN</h1><p><strong>Thời gian:</strong> …</p><p><strong>Địa điểm:</strong> …</p><p><strong>Thành phần tham dự:</strong> …</p><h2>I. NỘI DUNG CUỘC HỌP</h2><p>…</p><h2>II. KẾT LUẬN</h2><p>…</p><p>Biên bản kết thúc hồi … giờ … cùng ngày.</p><p style="text-align:right"><strong>CHỦ TRÌ / THƯ KÝ</strong></p>',
    thesis:'<h1 style="text-align:center">TÊN ĐỀ TÀI NGHIÊN CỨU</h1><p style="text-align:center">Tác giả: …</p><h2>TÓM TẮT</h2><p>…</p><h2>1. ĐẶT VẤN ĐỀ</h2><p>…</p><h2>2. VẬT LIỆU VÀ PHƯƠNG PHÁP</h2><p>…</p><h2>3. KẾT QUẢ VÀ THẢO LUẬN</h2><p>…</p><h2>4. KẾT LUẬN VÀ KIẾN NGHỊ</h2><p>…</p><h2>TÀI LIỆU THAM KHẢO</h2><p>…</p>'
  };
  function applyDocumentTemplate(){
    const key=$('#documentTemplate').value;
    if(!key||!TEMPLATE_HTML[key]){alert('Hãy chọn một mẫu văn bản.');return;}
    if(editor.innerText.trim()&&!confirm('Áp dụng mẫu sẽ thay nội dung tài liệu hiện tại. Nên sao lưu trước. Tiếp tục?'))return;
    editor.innerHTML=TEMPLATE_HTML[key];scheduleSave();updateStats();editor.focus();
  }

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
      const html=/\.html?$/i.test(file.name)||file.type==='text/html' ? raw : '<p>'+escapeHTML(raw).replace(/\r?\n/g,'</p><p>')+'</p>';
      const doc={id:makeId(),title:file.name.replace(/\.(html?|txt)$/i,''),html:sanitizeHTML(html),updatedAt:Date.now()};
      documents.push(doc); loadDoc(doc.id); scheduleSave();
    };
    reader.readAsText(file);
  }

  // Reference tools are stored as semantic HTML inside each document.
  function safeHeadingId(index){return 'hd-heading-'+index;}
  function ensureHeadingIds(headings){
    const used=new Set();
    headings.forEach((h,i)=>{
      let id=h.id;
      if(!/^hd-heading-[a-z0-9-]+$/i.test(id||'')||used.has(id)){
        id=safeHeadingId(i+1);
        let suffix=1;while(used.has(id)||editor.querySelector('#'+CSS.escape(id)))id=safeHeadingId(i+1)+'-'+(++suffix);
        h.id=id;
      }
      used.add(id);
    });
  }
  function renderToc(showMessage=false){
    const headings=[...editor.querySelectorAll('h1,h2,h3')].filter(h=>h.textContent.trim()&&!h.closest('#hd-toc'));
    const existing=editor.querySelector('#hd-toc');
    if(!headings.length){
      if(existing)existing.remove();
      if(showMessage)alert('Chưa có tiêu đề. Hãy định dạng đoạn bằng Tiêu đề 1, 2 hoặc 3 trước.');
      return false;
    }
    ensureHeadingIds(headings);
    const items=headings.map(h=>{
      const level=h.tagName.toLowerCase();
      return '<li class="toc-level-'+level+'"><a href="#'+escapeHTML(h.id)+'">'+escapeHTML(h.textContent.trim())+'</a></li>';
    }).join('');
    const toc='<section class="hd-toc" id="hd-toc"><h2>MỤC LỤC</h2><ol>'+items+'</ol><p class="toc-updated">Tự cập nhật theo các tiêu đề trong tài liệu</p></section>';
    if(existing)existing.outerHTML=toc;
    else editor.insertAdjacentHTML('afterbegin',toc);
    return true;
  }
  function buildToc(){
    if(renderToc(true)){scheduleSave();setState('Đã tạo / cập nhật mục lục','saved');}
  }
  const TOC_AUTO_STORE='haidat-writer-toc-auto-v1';
  let tocUpdateTimer=null;
  function scheduleTocUpdate(){
    if(!editor.querySelector('#hd-toc'))return;
    if(localStorage.getItem(TOC_AUTO_STORE)==='false')return;
    clearTimeout(tocUpdateTimer);
    tocUpdateTimer=setTimeout(()=>{
      if(renderToc(false)){scheduleSave();}
    },350);
  }
  function insertFootnote(){
    const note=prompt('Nội dung chú thích:');if(!note||!note.trim())return;
    const notes=editor.querySelector('#hd-footnotes')||(()=>{editor.insertAdjacentHTML('beforeend','<section id="hd-footnotes"><h2>CHÚ THÍCH</h2><ol></ol></section>');return editor.querySelector('#hd-footnotes');})();
    const list=notes.querySelector('ol'),n=list.children.length+1,id='hd-footnote-'+n;
    list.insertAdjacentHTML('beforeend','<li id="'+id+'">'+escapeHTML(note.trim())+' <a href="#hd-footnote-ref-'+n+'" aria-label="Trở lại vị trí chú thích">↩</a></li>');
    command('insertHTML','<sup><a id="hd-footnote-ref-'+n+'" href="#'+id+'">['+n+']</a></sup>');
    scheduleSave();
  }
  function addCitation(){
    const author=prompt('Tác giả / cơ quan:');if(!author||!author.trim())return;
    const title=prompt('Tên tài liệu:');if(!title||!title.trim())return;
    const year=prompt('Năm xuất bản (có thể để trống):')||'';
    const publisher=prompt('Nhà xuất bản / tạp chí / đường dẫn (có thể để trống):')||'';
    const list=editor.querySelector('#hd-bibliography-list')||(()=>{editor.insertAdjacentHTML('beforeend','<section id="hd-bibliography"><h2>TÀI LIỆU THAM KHẢO</h2><ol id="hd-bibliography-list"></ol></section>');return editor.querySelector('#hd-bibliography-list');})();
    const n=list.children.length+1,entry=[author.trim(),title.trim(),year.trim(),publisher.trim()].filter(Boolean).join('. ');
    list.insertAdjacentHTML('beforeend','<li data-citation="'+n+'">'+escapeHTML(entry)+'.</li>');
    command('insertHTML','<span class="hd-citation">['+n+']</span>');
    scheduleSave();
  }
  function buildBibliography(){
    const list=editor.querySelector('#hd-bibliography-list');
    if(!list||!list.children.length){alert('Chưa có tài liệu tham khảo. Hãy dùng “Thêm trích dẫn” trước.');return;}
    editor.querySelector('#hd-bibliography').scrollIntoView({behavior:'smooth',block:'center'});
    scheduleSave();
  }

  function findTextNodes() {
    const walker=document.createTreeWalker(editor,NodeFilter.SHOW_TEXT,{
      acceptNode(node){return node.nodeValue && node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;}
    });
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);return nodes;
  }
  function findNextText(){
    const query=$('#findText').value;if(!query){$('#findText').focus();return;}
    const nodes=findTextNodes(),sel=window.getSelection();
    let startIndex=0,startOffset=0;
    if(sel&&sel.focusNode){
      const i=nodes.indexOf(sel.focusNode);
      if(i>=0){startIndex=i;startOffset=sel.focusOffset;}
    }
    const ordered=nodes.slice(startIndex).map((node,i)=>({node,from:i===0?startOffset:0})).concat(nodes.slice(0,startIndex).map(node=>({node,from:0})));
    const q=query.toLocaleLowerCase('vi');
    for(const item of ordered){
      const value=item.node.nodeValue,at=value.toLocaleLowerCase('vi').indexOf(q,item.from);
      if(at>=0){
        const range=document.createRange();range.setStart(item.node,at);range.setEnd(item.node,at+query.length);
        sel.removeAllRanges();sel.addRange(range);editor.focus();return true;
      }
    }
    alert('Đã tìm hết tài liệu, không thấy nội dung này.');return false;
  }
  function replaceCurrent(){
    const query=$('#findText').value,replacement=$('#replaceText').value,sel=window.getSelection();
    if(!query){alert('Hãy nhập nội dung cần tìm.');return;}
    if(sel&&sel.rangeCount&&sel.toString().toLocaleLowerCase('vi')===query.toLocaleLowerCase('vi')&&editor.contains(sel.anchorNode)){
      document.execCommand('insertText',false,replacement);scheduleSave();findNextText();
    }else findNextText();
  }
  function replaceAllText(){
    const query=$('#findText').value,replacement=$('#replaceText').value;
    if(!query){alert('Hãy nhập nội dung cần tìm.');return;}
    const needle=query.toLocaleLowerCase('vi');let count=0;
    findTextNodes().forEach(node=>{
      const source=node.nodeValue,lower=source.toLocaleLowerCase('vi');
      let from=0,at=-1,output='',localCount=0;
      while((at=lower.indexOf(needle,from))>=0){output+=source.slice(from,at)+replacement;from=at+query.length;count++;localCount++;}
      if(localCount)node.nodeValue=output+source.slice(from);
    });
    if(count){scheduleSave();alert('Đã thay '+count+' vị trí.');}else alert('Không tìm thấy nội dung cần thay.');
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

  editor.addEventListener('input',()=>{rememberEditorSelection();scheduleSave();scheduleTocUpdate();});
  document.addEventListener('selectionchange',rememberEditorSelection);
  document.addEventListener('pointerdown',e=>{if(e.target.closest('.ribbon,.editor-quickbar'))rememberEditorSelection();},true);
  $('#quickPageBreak').onclick=()=>command('insertHTML','<div class="page-break"></div><p><br></p>');
  titleInput.addEventListener('input',scheduleSave);
  document.querySelectorAll('[data-cmd]').forEach(btn=>btn.addEventListener('click',()=>command(btn.dataset.cmd)));
  document.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>command(btn.dataset.action)));
  $('#applyParagraphSpacing').onclick=applyParagraphFormatting;
  $('#applyTemplate').onclick=applyDocumentTemplate;
  $('#findNext').onclick=findNextText;$('#replaceOne').onclick=replaceCurrent;$('#replaceAll').onclick=replaceAllText;
  $('#findText').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();findNextText();}});
  $('#blockType').addEventListener('change',e=>command('formatBlock',e.target.value));
  // Enable CSS-based formatting so browser-generated styles survive sanitizing and reload.
  document.execCommand('styleWithCSS',false,true);
  $('#fontName').addEventListener('change',e=>command('fontName',e.target.value));
  $('#fontSize').addEventListener('change',e=>command('fontSize',e.target.value));
  $('#textColor').addEventListener('input',e=>command('foreColor',e.target.value));
  $('#highlightColor').addEventListener('input',e=>command('hiliteColor',e.target.value));
  $('#outdent').onclick=()=>command('outdent'); $('#indent').onclick=()=>command('indent');
  $('#addLink').onclick=insertLink; $('#addTable').onclick=insertTable;
  $('#insertToc').onclick=buildToc;
  const tocAutoToggle=$('#tocAutoUpdate');
  tocAutoToggle.checked=localStorage.getItem('haidat-writer-toc-auto-v1')!=='false';
  tocAutoToggle.addEventListener('change',()=>{localStorage.setItem('haidat-writer-toc-auto-v1',String(tocAutoToggle.checked));if(tocAutoToggle.checked&&editor.querySelector('#hd-toc')){renderToc(false);scheduleSave();}}); $('#insertFootnote').onclick=insertFootnote;
  $('#addCitation').onclick=addCitation; $('#buildBibliography').onclick=buildBibliography;
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
  $('#openLocalFile').onclick=openFromComputer;$('#saveFile').onclick=saveCurrentFile;$('#saveAsFile').onclick=saveAsFile;$('#closeFile').onclick=closeCurrentFile;$('#chooseWorkFolder').onclick=chooseWorkFolder;$('#openWorkFolder').onclick=openFromChosenFolder;
  initFileHandles();
  $('#exportHtml').onclick=exportHTML;
  $('#exportTxt').onclick=()=>{persist(false);download(safeName(current().title)+'.txt',plainText(),'text/plain;charset=utf-8');};
  $('#printDoc').onclick=()=>{persist(false);window.print();};
  ['openFile','openDocx'].forEach(id=>{const input=$('#'+id);if(input)input.onchange=e=>{const f=e.target.files[0];if(f)openAnyFile(f);e.target.value='';};});
  document.addEventListener('keydown',e=>{
    const mod=e.ctrlKey||e.metaKey;
    if(mod && e.key.toLowerCase()==='f'){e.preventDefault();$('#findText').focus();$('#findText').select();}
    if(mod && e.key.toLowerCase()==='s'){e.preventDefault();clearTimeout(saveTimer);persist();}
    if(mod && e.key==='Enter' && document.activeElement===editor){e.preventDefault();command('insertHTML','<div class="page-break"></div><p><br></p>');}
    if(mod && e.shiftKey && e.key.toLowerCase()==='l' && document.activeElement===editor){e.preventDefault();command('insertUnorderedList');}
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
    if(node.nodeType===Node.TEXT_NODE)return node.nodeValue?'<w:r><w:t xml:space="preserve">'+xmlEscape(node.nodeValue)+'</w:t></w:r>':'';
    if(node.nodeType!==Node.ELEMENT_NODE)return '';
    const tag=node.tagName,style=node.getAttribute?.('style')||'';
    if(tag==='BR')return '<w:r><w:br/></w:r>';
    if(tag==='IMG'||tag==='TABLE')return '';
    let props='';
    if(tag==='B'||tag==='STRONG'||/font-weight\s*:\s*(bold|[6-9]00)/i.test(style))props+='<w:b/>';
    if(tag==='I'||tag==='EM'||/font-style\s*:\s*italic/i.test(style))props+='<w:i/>';
    if(tag==='U'||/text-decoration\s*:\s*[^;]*underline/i.test(style))props+='<w:u w:val="single"/>';
    if(tag==='S'||tag==='STRIKE'||/text-decoration\s*:\s*[^;]*line-through/i.test(style))props+='<w:strike/>';
    const face=node.getAttribute?.('face')||((style.match(/font-family\s*:\s*([^;]+)/i)||[])[1]||'').replace(/["']/g,'').split(',')[0].trim();
    if(face)props+='<w:rFonts w:ascii="'+xmlEscape(face)+'" w:hAnsi="'+xmlEscape(face)+'"/>';
    const size=node.getAttribute?.('size');
    const cssSize=(style.match(/font-size\s*:\s*([0-9.]+)\s*(pt|px)?/i)||[]);
    const pt=size?({1:8,2:10,3:12,4:14,5:18,6:24,7:36}[size]||12):(cssSize[1]?Number(cssSize[1])*(cssSize[2]==='px'?0.75:1):0);
    if(pt>0)props+='<w:sz w:val="'+Math.round(pt*2)+'"/>';
    const color=node.getAttribute?.('color')||((style.match(/(?:^|;)\s*color\s*:\s*(#[0-9a-f]{6})/i)||[])[1]||'');
    if(color)props+='<w:color w:val="'+color.replace('#','').toUpperCase()+'"/>';
    const bg=(style.match(/background-color\s*:\s*(#[0-9a-f]{6})/i)||[])[1];
    if(bg)props+='<w:shd w:val="clear" w:color="auto" w:fill="'+bg.replace('#','').toUpperCase()+'"/>';
    if(tag==='SUP')props+='<w:vertAlign w:val="superscript"/>';
    if(tag==='SUB')props+='<w:vertAlign w:val="subscript"/>';
    let inner=[...node.childNodes].map(runXML).join('');
    if(props)inner=inner.replace(/<w:r>/g,'<w:r><w:rPr>'+props+'</w:rPr>');
    return inner;
  }
  function paragraphXML(el){
    if(el.classList?.contains('page-break')||el.classList?.contains('section-break'))return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
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
  function exportDocx(returnBlob=false){
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
    const blob=zipStore(files);
    if(returnBlob)return blob;
    const url=URL.createObjectURL(blob),a=document.createElement('a');
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
    if(typeof applyPrintSettings==='function')applyPrintSettings();
  }


  // Print header/footer settings are stored separately from document body.
  const PRINT_STORE='haidat-writer-print-settings-v1';
  function readPrintSettings(){
    try{return JSON.parse(localStorage.getItem(PRINT_STORE)||'{}')||{};}catch{return {};}
  }
  function applyPrintSettings(){
    const settings={header:$('#headerText').value.trim(),footer:$('#footerText').value.trim(),numbers:$('#showPageNumbers').checked};
    try{localStorage.setItem(PRINT_STORE,JSON.stringify(settings));}catch{}
    let style=$('#dynamicPrintStyle');
    if(!style){style=document.createElement('style');style.id='dynamicPrintStyle';document.head.append(style);}
    const paper=$('#paperSize').value,margin=Math.max(5,Math.min(50,Number($('#pageMargin').value)||20));
    const header=escapeHTML(settings.header),footer=escapeHTML(settings.footer);
    style.textContent='@page{size:'+paper+';margin:'+margin+'mm;'+
      '@top-center{content:"'+header+'";font:9pt Arial,sans-serif;color:#555}'+
      (settings.numbers?'@bottom-center{content:"'+(footer?footer+' · ':'')+'Trang " counter(page) " / " counter(pages);font:9pt Arial,sans-serif;color:#555}':'@bottom-center{content:"'+footer+'";font:9pt Arial,sans-serif;color:#555}')+'}'+
      '@media print{.page{position:relative}.print-running-header{display:none!important}.print-running-footer{display:none!important}}';
  }
  function loadPrintSettings(){
    const p=readPrintSettings();
    $('#headerText').value=p.header||'';$('#footerText').value=p.footer||'';$('#showPageNumbers').checked=p.numbers!==false;
    applyPrintSettings();
  }
  function exportBackup(){
    if(dirty)persist(false);
    const payload={format:'HAI-DAT-WRITER-BACKUP',version:1,createdAt:new Date().toISOString(),activeId,documents,printSettings:readPrintSettings(),pageSettings:(()=>{try{return JSON.parse(localStorage.getItem('haidat-writer-page-settings')||'{}');}catch{return {};}})()};
    download('hai-dat-writer-backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(payload,null,2),'application/json;charset=utf-8');
    setState('Đã tạo bản sao lưu','saved');
  }
  function importBackup(file){
    if(!file)return;
    if(file.size>20*1024*1024){alert('Bản sao lưu vượt quá 20 MB.');return;}
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const data=JSON.parse(String(reader.result||''));
        if(data.format!=='HAI-DAT-WRITER-BACKUP'||data.version!==1||!Array.isArray(data.documents)||!data.documents.length)throw new Error('Sai định dạng hoặc phiên bản bản sao lưu.');
        const restored=data.documents.filter(d=>d&&typeof d.id==='string'&&typeof d.html==='string').map(d=>({id:d.id,title:String(d.title||'Tài liệu khôi phục').slice(0,120),html:sanitizeHTML(d.html),updatedAt:Number(d.updatedAt)||Date.now()}));
        if(!restored.length)throw new Error('Không tìm thấy tài liệu hợp lệ trong bản sao lưu.');
        if(!confirm('Khôi phục '+restored.length+' tài liệu? Danh sách hiện tại sẽ được thay thế. Hãy chắc chắn đã sao lưu dữ liệu đang có.'))return;
        documents=restored;activeId=restored.some(d=>d.id===data.activeId)?data.activeId:restored[0].id;
        localStorage.setItem(STORE,JSON.stringify(documents));
        if(data.printSettings&&typeof data.printSettings==='object')localStorage.setItem(PRINT_STORE,JSON.stringify({header:String(data.printSettings.header||'').slice(0,120),footer:String(data.printSettings.footer||'').slice(0,120),numbers:data.printSettings.numbers!==false}));
        if(data.pageSettings&&typeof data.pageSettings==='object')localStorage.setItem('haidat-writer-page-settings',JSON.stringify({paper:['A4','A5','Letter'].includes(data.pageSettings.paper)?data.pageSettings.paper:'A4',margin:Math.max(5,Math.min(50,Number(data.pageSettings.margin)||20))}));
        loadDoc(activeId);loadPrintSettings();
        const ps=JSON.parse(localStorage.getItem('haidat-writer-page-settings')||'{}');$('#paperSize').value=ps.paper||'A4';$('#pageMargin').value=ps.margin||20;applyPageSettings();
        setState('Đã khôi phục bản sao lưu','saved');alert('Khôi phục thành công '+restored.length+' tài liệu.');
      }catch(err){alert('Không thể khôi phục: '+err.message);}
    };
    reader.readAsText(file);
  }
  $('#backupExport').onclick=exportBackup;
  $('#backupImport').onclick=()=>$('#backupFile').click();
  $('#backupFile').onchange=e=>{importBackup(e.target.files[0]);e.target.value='';};
  ['headerText','footerText','showPageNumbers'].forEach(id=>$('#'+id).addEventListener('change',applyPrintSettings));
  $('#headerText').addEventListener('input',applyPrintSettings);
  $('#footerText').addEventListener('input',applyPrintSettings);
  loadPrintSettings();


  $('#exportDocx').onclick=exportDocx;
  $('#openDocx').onchange=e=>{const f=e.target.files[0];if(f)importDocx(f);e.target.value='';};
  $('#paperSize').onchange=applyPageSettings;$('#pageMargin').onchange=applyPageSettings;
  $('#insertPageBreak').onclick=()=>command('insertHTML','<div class="page-break"></div><p><br></p>');
  $('#insertSectionBreak').onclick=()=>command('insertHTML','<div class="section-break"></div><p><br></p>');
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
  ['openFile','openDocx'].forEach(id=>{const input=$('#'+id);if(input){input.classList.add('ribbon-file-input');document.body.append(input);}});
  document.querySelectorAll('[data-proxy]').forEach(btn=>btn.addEventListener('click',()=>{
    const target=$('#'+btn.dataset.proxy);if(!target)return;
    if(target.type==='file')target.click();else target.click();
  }));

})();
