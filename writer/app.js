(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const editor = $('#editor'), titleInput = $('#docTitle');
  const STORE = 'haidat-writer-documents-v2';
  const FOLDERS_STORE='haidat-writer-folders-v1';
  const HISTORY_STORE='haidat-writer-history-v1';
  const HISTORY_PER_DOCUMENT=6, HISTORY_MAX_CHARS=160000, HISTORY_TOTAL_CHARS=1100000, AUTO_HISTORY_INTERVAL=5*60*1000;
  const DEFAULT_FOLDERS=['Chưa phân loại','Công việc','Học tập','Cá nhân'];
  let folders=(()=>{try{const v=JSON.parse(localStorage.getItem(FOLDERS_STORE)||'null');return Array.isArray(v)&&v.length?v.filter(x=>typeof x==='string'&&x.trim()).slice(0,100):DEFAULT_FOLDERS.slice();}catch{return DEFAULT_FOLDERS.slice();}})();if(!folders.includes('Chưa phân loại'))folders.unshift('Chưa phân loại');
  let documents = [], activeId = null, saveTimer = null, deferredInstall = null, dirty = false, savedEditorRange = null, currentFileHandle = null, workDirectoryHandle = null;
  let baseDocuments=new Map(),storageRecoveryRaw=null;
  let statsTimer = null;
  const cloneJSON=value=>value===undefined?undefined:(typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value)));
  const sameJSON=(a,b)=>JSON.stringify(a===undefined?null:a)===JSON.stringify(b===undefined?null:b);

  const makeId = () => {
    const d=new Date(),date=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('');
    let id;
    do { const token=(window.crypto&&crypto.randomUUID?crypto.randomUUID().replace(/-/g,'').slice(0,8):Math.random().toString(36).slice(2,10)).toUpperCase(); id='HDW-'+date+'-'+token; }
    while(documents.some(x=>x&&x.id===id));
    return id;
  };
  function normalizeDocuments(items){
    const used=new Set(),now=Date.now();
    return items.map(d=>{
      const x={...d};
      if(typeof x.id!=='string'||!x.id.trim()||used.has(x.id))x.id=makeId();
      used.add(x.id);
      x.title=String(x.title||'Tài liệu chưa đặt tên').slice(0,120);
      x.html=typeof x.html==='string'?x.html:'<p><br></p>';
      x.createdAt=Number(x.createdAt)||Number(x.updatedAt)||now;
      x.updatedAt=Number(x.updatedAt)||x.createdAt;
      x.revision=Math.max(1,Number(x.revision)||1);
      x.appType='writer';x.schemaVersion=3;x.deletedAt=Number(x.deletedAt)||null;x.folder=folders.includes(x.folder)?x.folder:'Chưa phân loại';x.category=String(x.category||'Khác').slice(0,40);x.pinned=!!x.pinned;
      return x;
    });
  }
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
  function toRtfUnicode(text){return String(text||'').replace(/[\\{}]/g,m=>'\\'+m).replace(/\r?\n/g,'\\par\n').replace(/[^\x00-\x7F]/g,ch=>{const code=ch.charCodeAt(0);return '\\u'+(code>32767?code-65536:code)+'?';});}
  function makeFileBlob(ext){if(ext==='docx')return exportDocx(true);if(['html','htm'].includes(ext))return new Blob([makeHtmlFile()],{type:'text/html;charset=utf-8'});if(['txt','md','markdown','csv'].includes(ext))return new Blob([plainText()],{type:ext==='txt'?'text/plain;charset=utf-8':'text/markdown;charset=utf-8'});if(ext==='rtf')return new Blob(['{\\rtf1\\ansi\\ansicpg1258\\uc1\\deff0 '+toRtfUnicode(plainText())+'}'],{type:'application/rtf'});throw new Error('Chưa hỗ trợ lưu .'+ext+'. Hãy chọn DOCX, HTML, TXT, MD hoặc RTF.');}
  async function writeFile(h,b){const w=await h.createWritable();await w.write(b);await w.close();}
  async function saveAsFile(){
    clearTimeout(saveTimer);persist(false);
    if(window.showSaveFilePicker){try{const h=await window.showSaveFilePicker({suggestedName:safeName(current().title)+'.docx',types:[{description:'Word (.docx)',accept:{'application/vnd.openxmlformats-officedocument.wordprocessingml.document':['.docx']}},{description:'HTML (.html)',accept:{'text/html':['.html']}},{description:'Văn bản thuần (.txt)',accept:{'text/plain':['.txt']}},{description:'Rich Text (.rtf)',accept:{'application/rtf':['.rtf']}},{description:'Markdown (.md)',accept:{'text/markdown':['.md']}}]});await writeFile(h,makeFileBlob(extOf(h.name)));currentFileHandle=h;await storeHandle('file',h);setState('Đã lưu: '+h.name,'saved');return;}catch(e){if(e.name!=='AbortError')alert('Lỗi lưu tệp: '+e.message);return;}}
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
    try{const o={multiple:false,types:[{description:'Tài liệu',accept:{'application/vnd.openxmlformats-officedocument.wordprocessingml.document':['.docx'],'application/vnd.oasis.opendocument.text':['.odt'],'text/html':['.html','.htm'],'text/plain':['.txt','.md','.csv'],'application/rtf':['.rtf'],'application/msword':['.doc'],'application/pdf':['.pdf']}}]};if(workDirectoryHandle)o.startIn=workDirectoryHandle;const [h]=await window.showOpenFilePicker(o);const opened=await openAnyFile(await h.getFile());if(opened){currentFileHandle=h;await storeHandle('file',h);}}catch(e){if(e.name!=='AbortError')alert('Không mở được: '+e.message);}
  }
  function addLoadedFile(name,content){
    const title=name.replace(/\.[^.]+$/,'').slice(0,120)||'Tài liệu nhập';
    const html=sanitizeHTML(content||'<p><br></p>');
    const duplicate=documents.find(d=>d.title.trim().toLocaleLowerCase('vi')===title.trim().toLocaleLowerCase('vi')&&d.html===html);
    if(duplicate){
      if(confirm('Tài liệu này đã có trong Writer với cùng tên và nội dung. Mở tài liệu hiện có thay vì tạo bản trùng?')){
        loadDoc(duplicate.id);return true;
      }
    }
    const d={id:makeId(),title,html,createdAt:Date.now(),updatedAt:Date.now(),appType:'writer',schemaVersion:3,folder:'Chưa phân loại',category:'Khác',pinned:false};
    documents.push(d);loadDoc(d.id);scheduleSave();return true;
  }
  async function openAnyFile(file){
    if(!file)return false;const ext=extOf(file.name);
    try{
      if(ext==='docx')return await importDocx(file);
      if(ext==='doc')throw new Error('DOC cũ (Word 97–2003) chưa đọc trực tiếp được. Hãy chuyển sang DOCX bằng Word hoặc LibreOffice.');
      if(ext==='pdf')throw new Error('PDF chưa chuyển thành văn bản chỉnh sửa được; dùng In / Lưu PDF để xuất PDF.');
      if(ext==='odt')return await importODT(file);
      const raw=await file.text();let body='';
      if(['html','htm'].includes(ext))body=raw;
      else if(ext==='rtf')body='<p>'+escapeHTML(raw.replace(/\\par[d]?/g,'\n').replace(/\\[a-z]+-?\d* ?/gi,'').replace(/[{}]/g,'')).replace(/\n/g,'</p><p>')+'</p>';
      else if(ext==='csv'){body='<table><tbody>'+raw.split(/\r?\n/).filter(Boolean).map((r,i)=>'<tr>'+r.split(',').map(c=>(i===0?'<th>':'<td>')+escapeHTML(c)+(i===0?'</th>':'</td>')).join('')+'</tr>').join('')+'</tbody></table>';}
      else if(['txt','md','markdown'].includes(ext))body='<p>'+escapeHTML(raw).replace(/\r?\n/g,'</p><p>')+'</p>';
      else throw new Error('Định dạng .'+ext+' chưa hỗ trợ.');
      return addLoadedFile(file.name,body);
    }catch(e){alert('Không mở được '+file.name+': '+e.message);return false;}
  }
  async function openFromChosenFolder(){await openFromComputer();}
  function closeCurrentFile(){
    if(dirty&&!confirm('Tài liệu có thay đổi chưa lưu. Đóng tệp? Bản đang lưu trên thiết bị sẽ vẫn được giữ.'))return;
    if(dirty)persist(false);currentFileHandle=null;storeHandle('file',null).catch(()=>{});
    const now=Date.now(),d={id:makeId(),title:'Tài liệu mới',html:'<h1>Tài liệu mới</h1><p><br></p>',createdAt:now,updatedAt:now,revision:1,appType:'writer',schemaVersion:3,folder:'Chưa phân loại',category:'Khác',pinned:false};documents.push(d);loadDoc(d.id);persist(false);setState('Đã đóng tệp · bản nội bộ vẫn được giữ','saved');
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
          else if (key === 'class') { const allowedClasses=new Set(['page-break','section-break','hd-toc','hd-citation','hd-callout','hd-comment-mark','toc-updated','toc-level-h1','toc-level-h2','toc-level-h3']); if (!val.split(/\s+/).every(c=>allowedClasses.has(c))) child.removeAttribute(attr.name); }
          else if (key === 'data-comment-id') { if (!/^hdc-[a-z0-9-]+$/i.test(val)) child.removeAttribute(attr.name); }
          else if (key === 'href' && !/^(https?:|mailto:|tel:)/i.test(val) && !/^#hd-[a-z0-9-]+$/i.test(val)) child.removeAttribute(attr.name);
          else if (key === 'src' && child.tagName === 'IMG' && !/^(data:image\/(png|jpeg|gif|webp);base64,|https?:)/i.test(val)) child.removeAttribute(attr.name);
          else if (['face','color','size'].includes(key) && child.tagName === 'FONT') { /* safe legacy font attributes */ }
          else if (key === 'style') {
            const safe = val.split(';').filter(rule => /^(color|background-color|font-weight|font-style|text-decoration|text-align|font-size|font-family|display|width|max-width|height|line-height|margin-top|margin-bottom|text-indent|margin-left|margin-right|padding-left|padding-right|border-radius)\s*:/i.test(rule.trim()) && !/url\s*\(|expression|javascript/i.test(rule)).join(';');
            if (safe) child.setAttribute('style', safe); else child.removeAttribute('style');
          } else if (!['href','src','alt','title','colspan','rowspan','style','width','height','data-comment-id'].includes(key)) child.removeAttribute(attr.name);
        });
        clean(child);
      });
    };
    clean(parsed.body);
    return parsed.body.innerHTML;
  }

  function readVersionHistory(){try{const v=JSON.parse(localStorage.getItem(HISTORY_STORE)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch{return {};}}
  let versionHistory=readVersionHistory();
  function saveVersionHistory(){
    const ids=new Set(documents.map(d=>d.id)),candidate={};Object.entries(versionHistory).forEach(([id,list])=>{if(ids.has(id)&&Array.isArray(list))candidate[id]=list.slice();});
    let entries=Object.entries(candidate).flatMap(([id,list])=>list.map(v=>({id,v}))).sort((a,b)=>(a.v.createdAt||0)-(b.v.createdAt||0));
    let total=entries.reduce((n,x)=>n+String(x.v.html||'').length+String(x.v.design?JSON.stringify(x.v.design):'').length,0);
    while(total>HISTORY_TOTAL_CHARS&&entries.length){const old=entries.shift();total-=String(old.v.html||'').length+String(old.v.design?JSON.stringify(old.v.design):'').length;const list=candidate[old.id]||[];const index=list.findIndex(v=>v.versionId===old.v.versionId);if(index>=0)list.splice(index,1);if(!list.length)delete candidate[old.id];}
    try{localStorage.setItem(HISTORY_STORE,JSON.stringify(candidate));versionHistory=candidate;return true;}catch{return false;}
  }
  function renderVersionHistory(){
    const select=$('#versionHistoryList');if(!select)return;const doc=current(),list=doc?(versionHistory[doc.id]||[]):[];select.replaceChildren();
    list.slice().sort((a,b)=>b.createdAt-a.createdAt).forEach(v=>{const o=document.createElement('option');o.value=v.versionId;o.textContent=new Date(v.createdAt).toLocaleString('vi-VN')+' · '+v.reason+' · '+(v.wordCount||0)+' từ'+(v.design?' · Văn bản + Canvas':v.designOmitted?' · Canvas quá lớn, không kèm bố cục':'');select.append(o);});
    const has=list.length>0;['previewVersion','restoreVersion'].forEach(id=>{const b=$('#'+id);if(b)b.disabled=!has;});const count=$('#versionHistoryCount');if(count)count.textContent=list.length+'/'+HISTORY_PER_DOCUMENT+' mốc';
  }
  function recordVersionSnapshot(force=false,reason='Tự động'){
    const doc=current();if(!doc)return false;const content=editor.innerHTML;if(content.length>HISTORY_MAX_CHARS){if(force)alert('Nội dung quá lớn để lưu lịch sử (giới hạn 160.000 ký tự mỗi mốc). Hãy xuất bản sao lưu trước.');return false;}
    const design=doc.design===undefined?undefined:cloneJSON(doc.design),designSize=design===undefined?0:JSON.stringify(design).length,designOmitted=designSize>500000;
    const list=versionHistory[doc.id]||(versionHistory[doc.id]=[]),last=list[list.length-1];
    const designMatches=designOmitted?!!(last&&last.designOmitted):sameJSON(last&&last.design,design);
    if(last&&last.html===content&&last.title===doc.title&&designMatches&&!!last.designOmitted===designOmitted)return true;
    if(!force&&last&&Date.now()-last.createdAt<AUTO_HISTORY_INTERVAL)return false;
    const textContent=editor.innerText||editor.textContent||'';
    const snap={versionId:'HDWV-'+Date.now()+'-'+Math.random().toString(36).slice(2,7).toUpperCase(),createdAt:Date.now(),reason,html:content,title:doc.title,wordCount:(textContent.trim().match(/[\p{L}\p{N}]+/gu)||[]).length,charCount:textContent.length};
    if(design!==undefined&&!designOmitted)snap.design=design;else if(designOmitted)snap.designOmitted=true;
    list.push(snap);while(list.length>HISTORY_PER_DOCUMENT)list.shift();
    if(!saveVersionHistory()){list.pop();if(!list.length)delete versionHistory[doc.id];if(force)alert('Không đủ bộ nhớ để lưu mốc phiên bản.');return false;}
    renderVersionHistory();return true;
  }
  function previewSelectedVersion(){const doc=current(),id=$('#versionHistoryList').value,v=doc&&(versionHistory[doc.id]||[]).find(x=>x.versionId===id);if(!v){alert('Chọn một mốc lịch sử trước.');return;}const parsed=new DOMParser().parseFromString(v.html,'text/html');$('#versionPreviewTitle').textContent=(v.reason||'Phiên bản')+' · '+new Date(v.createdAt).toLocaleString('vi-VN');$('#versionPreviewText').value=parsed.body.innerText||parsed.body.textContent||'';const dlg=$('#versionPreviewDialog');if(dlg&&typeof dlg.showModal==='function')dlg.showModal();else alert($('#versionPreviewText').value.slice(0,4000));}
  function restoreSelectedVersion(){let doc=current();const id=$('#versionHistoryList').value,v=doc&&(versionHistory[doc.id]||[]).find(x=>x.versionId===id);if(!v){alert('Chọn một mốc lịch sử trước.');return;}if(!confirm('Khôi phục nội dung từ '+new Date(v.createdAt).toLocaleString('vi-VN')+'? Nội dung hiện tại sẽ được lưu thành một mốc riêng trước khi khôi phục.'))return;
    if(dirty&&!persist(false)){alert('Chưa thể lưu thay đổi hiện tại do xung đột hoặc lỗi bộ nhớ. Hãy xử lý trước khi khôi phục.');return;}doc=current();if(!recordVersionSnapshot(true,'Trước khi khôi phục')){alert('Không tạo được mốc bảo vệ trước khi khôi phục; dữ liệu hiện tại vẫn được giữ nguyên.');return;}doc.html=sanitizeHTML(v.html);if(Object.prototype.hasOwnProperty.call(v,'design'))doc.design=cloneJSON(v.design);doc.updatedAt=Date.now();editor.innerHTML=doc.html;dirty=false;if(!persist(false)){alert('Không thể ghi phiên bản khôi phục do xung đột hoặc lỗi bộ nhớ. Hãy tải lại bản mới nhất và thử lại.');return;}recordVersionSnapshot(true,'Khôi phục phiên bản');loadDoc(doc.id);renderVersionHistory();setState(Object.prototype.hasOwnProperty.call(v,'design')?'Đã khôi phục cả Writer và Canvas':'Đã khôi phục nội dung Writer'+(v.designOmitted?' · bố cục Canvas không có trong mốc này':''),'saved');}
  function persist(show=true) {
    const active=current();if(!active)return false;
    if(storageRecoveryRaw!==null){if(!confirm('Kho tài liệu hiện tại không đọc được. Ứng dụng đã cố giữ dữ liệu thô tại khóa haidat-writer-recovery-raw-v1. OK: cho phép thay thế kho lỗi bằng kho mới. Hủy: giữ nguyên kho cũ và chưa lưu đè.'))return false;storageRecoveryRaw=null;}
    try{
      const localDocs=documents.map(d=>cloneJSON(d)),activeLocal=localDocs.find(d=>d.id===active.id);
      if(!activeLocal)throw new Error('Không tìm thấy tài liệu đang mở.');
      activeLocal.title=titleInput.value.trim()||'Tài liệu chưa đặt tên';activeLocal.html=editor.innerHTML.replace(/\sclass="hd-img-selected"/g,'');
      activeLocal.appType='writer';activeLocal.schemaVersion=3;activeLocal.folder=folders.includes(activeLocal.folder)?activeLocal.folder:'Chưa phân loại';activeLocal.category=String(activeLocal.category||'Khác');activeLocal.pinned=!!activeLocal.pinned;activeLocal.createdAt=Number(activeLocal.createdAt)||activeLocal.updatedAt||Date.now();
      const raw=JSON.parse(localStorage.getItem(STORE)||'[]');if(!Array.isArray(raw))throw new Error('Kho tài liệu không hợp lệ.');
      const remoteDocs=raw.map(d=>cloneJSON(d)),remoteMap=new Map(remoteDocs.map(d=>[d.id,d])),localMap=new Map(localDocs.map(d=>[d.id,d]));
      const ids=[...new Set([...remoteDocs.map(d=>d.id),...localDocs.map(d=>d.id),...baseDocuments.keys()])],mergedDocs=[],conflicts=[];
      ids.forEach(id=>{
        const base=baseDocuments.get(id),local=localMap.get(id),remote=remoteMap.get(id);
        if(!local){
          if(!remote)return;
          if(!base){mergedDocs.push(remote);return;}
          const remoteChanged=Object.keys({...base,...remote}).some(key=>!['id','revision','updatedAt'].includes(key)&&!sameJSON(remote[key],base[key]));
          if(remoteChanged)conflicts.push(id+' (xóa tài liệu nhưng bản khác đã sửa)'); 
          return;
        }
        if(!remote){
          if(base){
            const localChanged=Object.keys({...base,...local}).some(key=>!['id','revision','updatedAt'].includes(key)&&!sameJSON(local[key],base[key]));
            if(localChanged)conflicts.push(id+' (tài liệu bị xóa ở cửa sổ khác)');
            return;
          }
          mergedDocs.push({...local,revision:1,updatedAt:Date.now()});return;
        }
        if(!base){
          if(sameJSON(local,remote)){mergedDocs.push(remote);return;}
          conflicts.push(id+' (ID mới trùng nhau)');return;
        }
        const fields=new Set([...Object.keys(base),...Object.keys(local),...Object.keys(remote)]);
        fields.delete('id');fields.delete('revision');fields.delete('updatedAt');
        const merged={...remote},changed=[];
        fields.forEach(key=>{
          const localChanged=!sameJSON(local[key],base[key]),remoteChanged=!sameJSON(remote[key],base[key]);
          if(localChanged&&remoteChanged&&!sameJSON(local[key],remote[key]))conflicts.push(id+' · '+key);
          else if(localChanged&&!sameJSON(local[key],remote[key])){merged[key]=cloneJSON(local[key]);changed.push(key);}
        });
        if(changed.length){merged.revision=Math.max(1,Number(remote.revision)||1,Number(base.revision)||1)+1;merged.updatedAt=Date.now();}
        mergedDocs.push(merged);
      });
      if(conflicts.length){
        setState('Xung đột dữ liệu · chưa ghi đè ('+conflicts.slice(0,3).join('; ')+')','error');
        if(show&&confirm('Phát hiện thay đổi trùng nhau ở cửa sổ khác.\\n\\nOK: tải dữ liệu mới nhất và bỏ các thay đổi chưa lưu.\\nHủy: giữ bản đang mở để bạn sao lưu thủ công.')){documents=normalizeDocuments(remoteDocs);baseDocuments=new Map(documents.map(d=>[d.id,cloneJSON(d)]));const next=documents.find(d=>d.id===activeId&&!d.deletedAt)||documents.find(d=>!d.deletedAt);if(next)loadDoc(next.id);setState('Đã tải dữ liệu mới nhất','saved');}
        return false;
      }
      documents=normalizeDocuments(mergedDocs);
      const saved=documents.find(d=>d.id===active.id);
      if(saved)recordVersionSnapshot(false,'Tự động');
      localStorage.setItem(STORE,JSON.stringify(documents));
      baseDocuments=new Map(documents.map(d=>[d.id,cloneJSON(d)]));
      dirty=false;
      if(show)setState('Đã lưu trên thiết bị'+(saved?' · phiên bản '+saved.revision:''),'saved');
      if(!documents.some(d=>d.id===activeId&&!d.deletedAt)){const next=documents.find(d=>!d.deletedAt);if(next)loadDoc(next.id);}
      renderDocList();return true;
    }catch(err){dirty=true;setState('Lưu thất bại · '+err.message+' · hãy xuất bản sao lưu','error');return false;}
  }
  function scheduleSave() {
    dirty=true; setState('Đang chờ lưu…','pending');
    clearTimeout(saveTimer);
    saveTimer=setTimeout(()=>persist(),500);
    clearTimeout(statsTimer);
    statsTimer=setTimeout(()=>updateStats(),250);
  }
  function renderFolderControls(){const filter=$('#folderFilter'),target=$('#docFolder');[filter,target].forEach((sel,i)=>{if(!sel)return;const old=sel.value;sel.replaceChildren();const first=document.createElement('option');first.value=i===0?'__all__':'__current__';first.textContent=i===0?'Tất cả thư mục':'Chuyển vào thư mục…';sel.append(first);folders.forEach(name=>{const o=document.createElement('option');o.value=name;o.textContent=name;sel.append(o);});if(i===0&&folders.includes(old))sel.value=old;});const d=documents.find(x=>x.id===activeId);if(target&&d&&folders.includes(d.folder))target.value=d.folder;}
  function renderDocList() {
    const list=$('#docList'); if(!list) return;
    const query=($('#documentSearch')?.value||'').trim().toLocaleLowerCase('vi'),folder=$('#folderFilter')?.value||'__all__',sort=$('#documentSort')?.value||'updated';
    list.replaceChildren();
    const visible=documents.filter(d=>!d.deletedAt&&(folder==='__all__'||d.folder===folder)&&(!query||d.title.toLocaleLowerCase('vi').includes(query)||d.id.toLocaleLowerCase('en').includes(query)||String(d.category||'').toLocaleLowerCase('vi').includes(query)));
    visible.sort((a,b)=>{if(!!a.pinned!==!!b.pinned)return a.pinned?-1:1;if(sort==='name')return a.title.localeCompare(b.title,'vi');if(sort==='oldest')return (a.createdAt||0)-(b.createdAt||0);return (b.updatedAt||0)-(a.updatedAt||0);}).forEach(doc=>{const o=document.createElement('option');o.value=doc.id;o.textContent=(doc.pinned?'★ ':'')+doc.title+' · '+(doc.category||'Khác');list.append(o);});
    if(documents.some(d=>d.id===activeId&&!d.deletedAt))list.value=activeId;
    renderFolderControls();
    const trash=$('#trashList');
    if(trash){trash.replaceChildren();documents.filter(d=>d.deletedAt).sort((a,b)=>b.deletedAt-a.deletedAt).forEach(doc=>{const o=document.createElement('option');o.value=doc.id;o.textContent=doc.title+' · '+new Date(doc.deletedAt).toLocaleDateString('vi-VN');trash.append(o);});}
    const count=$('#documentCount');if(count)count.textContent=documents.filter(d=>!d.deletedAt).length+' tài liệu';
  }
  function loadDoc(id) {
    const doc=documents.find(d=>d.id===id); if(!doc) return;
    clearTimeout(saveTimer); activeId=id; titleInput.value=doc.title; editor.innerHTML=sanitizeHTML(doc.html || '<p><br></p>');
    if(typeof selectImage==='function')selectImage(null);
    dirty=false;renderDocList();renderVersionHistory();updateStats();if(typeof renderComments==='function')renderComments();const identity=$('#docIdDisplay');if(identity)identity.textContent='ID: '+doc.id;const cat=$('#docCategory');if(cat)cat.value=doc.category||'Khác';const pin=$('#togglePin');if(pin)pin.textContent=doc.pinned?'★ Đã ghim':'☆ Ghim tài liệu';setState('Đã mở tài liệu','saved');
  }

  // Public, narrow bridge for the optional cloud-collaboration module.
  window.HD_WRITER = {
    getCurrentDocument(){ if(dirty)persist(false); const d=current(); return d?{...d,html:editor.innerHTML,title:titleInput.value.trim()||d.title}:null; },
    importCloudDocument(remote){
      if(!remote||typeof remote.id!=='string'||!/^HDW-[0-9]{8}-[A-Z0-9]{8}$/.test(remote.id))throw new Error('ID tài liệu đám mây không hợp lệ.');
      if(dirty)persist(false);
      const safe=sanitizeHTML(remote.content_html||'<p><br></p>');
      let d=documents.find(x=>x.id===remote.id);
      if(d&&d.html!==safe){
        if(!confirm('Tài liệu cùng ID đã có trên thiết bị nhưng nội dung khác bản kho chung.\n\nNếu tiếp tục, nội dung trên máy sẽ được lưu thành một mốc lịch sử trước khi cập nhật. Tiếp tục?'))throw new Error('Đã hủy cập nhật để giữ nguyên bản trên thiết bị.');
        const parsed=new DOMParser().parseFromString(d.html,'text/html'),txt=parsed.body.innerText||parsed.body.textContent||'';
        const list=versionHistory[remote.id]||(versionHistory[remote.id]=[]);
        list.push({versionId:'HDWV-'+Date.now()+'-CLOUD',createdAt:Date.now(),reason:'Trước khi cập nhật từ kho chung',html:d.html,title:d.title,wordCount:(txt.trim().match(/[\p{L}\p{N}]+/gu)||[]).length,charCount:txt.length});
        if(!saveVersionHistory()){list.pop();if(!list.length)delete versionHistory[remote.id];throw new Error('Không lưu được mốc bảo vệ bản trên máy; chưa cập nhật nội dung.');}
      }
      if(d){d.title=String(remote.title||d.title).slice(0,120);d.html=safe;d.updatedAt=Date.parse(remote.updated_at)||Date.now();d.deletedAt=null;}
      else{d={id:remote.id,title:String(remote.title||'Tài liệu từ kho chung').slice(0,120),html:safe,createdAt:Date.parse(remote.created_at)||Date.now(),updatedAt:Date.parse(remote.updated_at)||Date.now(),folder:'Chưa phân loại',category:'Khác',pinned:false,appType:'writer',schemaVersion:3};documents.push(d);}
      loadDoc(d.id);persist(false);return d.id;
    }
  };

  function cloneCurrentDocument(){
    if(dirty)persist(false);
    const source=current();
    if(!source||source.deletedAt){alert('Không tìm thấy tài liệu đang mở để nhân bản.');return;}
    const suggested='Bản sao - '+source.title;
    const chosen=prompt('Đặt tên cho tài liệu mới:',suggested);
    if(chosen===null)return;
    const title=String(chosen).trim().slice(0,120);
    if(!title){alert('Tên tài liệu không được để trống.');return;}
    const now=Date.now();
    const clone={
      ...source,
      id:makeId(),
      title,
      html:sanitizeHTML(editor.innerHTML),
      createdAt:now,
      updatedAt:now,
      deletedAt:null,
      pinned:false,
      appType:'writer',
      schemaVersion:3
    };
    const oldDocs=documents;
    const oldHistory=versionHistory;
    documents=[...documents,clone];
    try{
      localStorage.setItem(STORE,JSON.stringify(documents));
      activeId=clone.id;
      loadDoc(clone.id);
      const sourceHistory=oldHistory[source.id]||[];
      if(sourceHistory.length){
        const copied=sourceHistory.slice(-HISTORY_PER_DOCUMENT).map((v,i)=>({
          ...v,
          versionId:'HDWV-'+now+'-'+i+'-'+Math.random().toString(36).slice(2,6).toUpperCase(),
          createdAt:Number(v.createdAt)||now,
          reason:'Lịch sử từ bản gốc',
          html:sanitizeHTML(v.html)
        })).filter(v=>v.html.length<=HISTORY_MAX_CHARS);
        versionHistory={...oldHistory,[clone.id]:copied};
        if(!saveVersionHistory())delete versionHistory[clone.id];
      }
      recordVersionSnapshot(true,'Tạo từ bản sao');
      persist(false);
      renderVersionHistory();
      setState('Đã tạo bản sao độc lập','saved');
      alert('Đã tạo tài liệu mới.\nID mới: '+clone.id+'\nBản gốc vẫn được giữ nguyên.');
    }catch(err){
      documents=oldDocs;versionHistory=oldHistory;
      try{localStorage.setItem(STORE,JSON.stringify(oldDocs));}catch{}
      loadDoc(source.id);
      alert('Không thể nhân bản do bộ nhớ hoặc dữ liệu không hợp lệ: '+err.message);
    }
  }
  function createDoc() {
    if(dirty) persist(false);
    const doc={id:makeId(),title:'Tài liệu mới',html:'<h1>Tài liệu mới</h1><p><br></p>',createdAt:Date.now(),updatedAt:Date.now(),revision:1,folder:'Chưa phân loại',category:'Khác',pinned:false};
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
  let copiedFormat=null;
  function cssRgbToHex(val){
    if(!val)return '';
    if(/^#[0-9a-f]{6}$/i.test(val))return val.toLowerCase();
    const m=String(val).match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if(!m)return '';
    return '#'+[m[1],m[2],m[3]].map(n=>Math.max(0,Math.min(255,Number(n))).toString(16).padStart(2,'0')).join('');
  }
  function activeTableCell(){
    const sel=window.getSelection();
    let node=sel&&sel.rangeCount?sel.anchorNode:(savedEditorRange?savedEditorRange.startContainer:null);
    if(!node||!editor.contains(node))return null;
    if(node.nodeType!==Node.ELEMENT_NODE)node=node.parentElement;
    return node?node.closest('td,th'):null;
  }
  function focusTableCell(cell){
    if(!cell)return;
    const range=document.createRange();
    range.selectNodeContents(cell);range.collapse(true);
    const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);
    editor.focus();rememberEditorSelection();syncToolbarState();
  }
  function editTable(action){
    restoreEditorSelection();
    const cell=activeTableCell();
    if(!cell){alert('Hãy đặt con trỏ vào bên trong một ô của bảng trước.');return;}
    const row=cell.parentElement,table=cell.closest('table');
    if(!row||!table)return;
    const colIndex=cell.cellIndex,rowIndex=row.rowIndex,colCount=Math.max(1,...[...table.rows].map(r=>r.cells.length));
    if(action==='addRowAbove'||action==='addRowBelow'){
      const newRow=table.insertRow(action==='addRowAbove'?rowIndex:rowIndex+1);
      for(let i=0;i<colCount;i++){const td=newRow.insertCell();td.innerHTML='<br>';}
      focusTableCell(newRow.cells[Math.min(colIndex,newRow.cells.length-1)]);
    }else if(action==='addColLeft'||action==='addColRight'){
      const insertAt=action==='addColLeft'?colIndex:colIndex+1;
      [...table.rows].forEach(r=>{
        const el=document.createElement(r.cells[0]?.tagName==='TH'?'th':'td');
        el.innerHTML='<br>';
        if(insertAt>=r.cells.length)r.append(el);else r.insertBefore(el,r.cells[insertAt]);
      });
      focusTableCell(row.cells[Math.min(insertAt,row.cells.length-1)]);
    }else if(action==='delRow'){
      if(table.rows.length<=1){table.remove();}
      else{const nextRow=table.rows[rowIndex+1]||table.rows[rowIndex-1];row.remove();if(nextRow)focusTableCell(nextRow.cells[Math.min(colIndex,nextRow.cells.length-1)]);}
    }else if(action==='delCol'){
      if(colCount<=1){table.remove();}
      else{[...table.rows].forEach(r=>{if(r.cells[colIndex])r.deleteCell(colIndex);});if(row.cells.length)focusTableCell(row.cells[Math.min(colIndex,row.cells.length-1)]);}
    }else if(action==='delTable'){
      if(!confirm('Xóa toàn bộ bảng này?'))return;
      table.remove();editor.focus();
    }
    scheduleSave();syncToolbarState();
  }
  function renderOutline(){
    const list=$('#outlineList'),empty=$('#outlineEmpty');
    if(!list)return;
    const headings=[...editor.querySelectorAll('h1,h2,h3')].filter(h=>h.textContent.trim()&&!h.closest('#hd-toc'));
    list.replaceChildren();
    if(empty)empty.hidden=headings.length>0;
    if(!headings.length)return;
    ensureHeadingIds(headings);
    headings.forEach(h=>{
      const li=document.createElement('li');
      li.className='level-'+h.tagName.toLowerCase();
      const btn=document.createElement('button');
      btn.type='button';btn.textContent=h.textContent.trim();btn.title=h.textContent.trim();
      btn.addEventListener('click',()=>{
        h.scrollIntoView({behavior:'smooth',block:'center'});
        const range=document.createRange();range.selectNodeContents(h);range.collapse(true);
        const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);
        editor.focus();rememberEditorSelection();syncToolbarState();
      });
      li.append(btn);list.append(li);
    });
  }
  function setOutlineOpen(open){
    const pane=$('#outlinePane'),ws=$('#workspace');
    if(!pane||!ws)return;
    pane.hidden=!open;
    ws.classList.toggle('has-outline',open);
    const t1=$('#toggleOutline'),t2=$('#toggleOutlineView');
    if(t1)t1.setAttribute('aria-pressed',String(open));
    if(t2)t2.setAttribute('aria-pressed',String(open));
    try{localStorage.setItem('haidat-writer-outline-open-v1',String(open));}catch{}
    if(open)renderOutline();
  }
  function setFormatPainter(data){
    copiedFormat=data||null;
    const active=!!copiedFormat;
    const btn=$('#formatPainter');
    if(btn){btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',String(active));}
    document.querySelectorAll('[data-proxy="formatPainter"]').forEach(b=>{b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});
    editor.classList.toggle('format-painter-cursor',active);
  }
  function syncToolbarState(){
    const sel=window.getSelection();
    const inEditor=!!(sel&&sel.rangeCount&&editor.contains(sel.anchorNode));
    const tableBar=$('#tableContextBar');
    if(tableBar)tableBar.hidden=!activeTableCell();
    if(!inEditor)return;
    const cmds=['bold','italic','underline','strikeThrough','superscript','subscript','justifyLeft','justifyCenter','justifyRight','justifyFull','insertUnorderedList','insertOrderedList'];
    const states={};
    cmds.forEach(c=>{try{states[c]=!!document.queryCommandState(c);}catch{states[c]=false;}});
    document.querySelectorAll('[data-cmd]').forEach(btn=>{
      const c=btn.dataset.cmd;
      if(c in states){btn.classList.toggle('is-active',states[c]);btn.setAttribute('aria-pressed',String(states[c]));}
    });
    let el=sel.anchorNode.nodeType===Node.ELEMENT_NODE?sel.anchorNode:sel.anchorNode.parentElement;
    let block=el;
    while(block&&block!==editor&&!/^(P|H1|H2|H3|BLOCKQUOTE|PRE)$/.test(block.tagName))block=block.parentElement;
    const blockSel=$('#blockType');
    const blockTag=block&&block!==editor?block.tagName:'P';
    if(blockSel&&[...blockSel.options].some(o=>o.value===blockTag))blockSel.value=blockTag;
    if(el&&editor.contains(el)){
      const cs=getComputedStyle(el);
      const fontSel=$('#fontName');
      if(fontSel){
        const primary=String(cs.fontFamily||'').split(',')[0].replace(/["']/g,'').trim().toLowerCase();
        const match=[...fontSel.options].find(o=>o.value.toLowerCase()===primary);
        if(match)fontSel.value=match.value;
      }
      const hex=cssRgbToHex(cs.color);
      const colorInput=$('#textColor');
      if(colorInput&&hex)colorInput.value=hex;
    }
    const status=$('#editorSelectionStatus');
    if(status){
      const selectedText=sel.toString().trim();
      if(selectedText){
        const sw=(selectedText.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu)||[]).length;
        status.textContent='Đang chọn: '+sw.toLocaleString('vi-VN')+' từ · '+selectedText.length.toLocaleString('vi-VN')+' ký tự';
      }else{
        const names={P:'Đoạn văn',H1:'Tiêu đề 1',H2:'Tiêu đề 2',H3:'Tiêu đề 3',BLOCKQUOTE:'Trích dẫn',PRE:'Mã / văn bản thô'};
        status.textContent=(names[blockTag]||'Vùng soạn thảo')+(activeTableCell()?' · Trong bảng':'');
      }
    }
  }
  function updateStats() {
    const text=plainText().replace(/\u00a0/g,' ').trim();
    $('#wordCount').textContent=text ? (text.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu)||[]).length : 0;
    $('#charCount').textContent=text.length;
    $('#paraCount').textContent=[...editor.querySelectorAll('p,h1,h2,h3,h4,li,blockquote')].filter(el=>el.innerText.trim()).length;
    const words=Number($('#wordCount').textContent)||0,chars=Number($('#charCount').textContent)||0;
    const live=$('#editorLiveStats'),read=$('#editorReadTime'),pages=$('#editorPageEstimate');
    if(live)live.textContent=words.toLocaleString('vi-VN')+' từ · '+chars.toLocaleString('vi-VN')+' ký tự';
    if(read)read.textContent='Đọc khoảng '+(words?Math.max(1,Math.ceil(words/200)):0)+' phút';
    if(pages){
      const breaks=editor.querySelectorAll('.page-break,.section-break').length;
      const pageH=({A4:1123,A5:794,Letter:1055}[$('#paperSize')?.value]||1123);
      const byHeight=Math.max(1,Math.ceil(Math.max(1,editor.scrollHeight-24)/pageH));
      const est=Math.max(1,byHeight,breaks+1);
      pages.textContent='~'+est+' trang';
    }
    renderOutline();
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
    syncToolbarState();
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
    for(let r=0;r<rows;r++){html+='<tr>';for(let c=0;c<cols;c++)html+=r===0?'<th>Tiêu đề '+(c+1)+'</th>':'<td><br></td>';html+='</tr>';}
    html+='</tbody></table><p><br></p>'; command('insertHTML',html);
  }
  function insertLink() {
    restoreEditorSelection();
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
  function updateFindMatchCount(){
    const badge=$('#findMatchCount');if(!badge)return;
    const query=$('#findText')?.value||'';
    if(!query){badge.textContent='';badge.classList.remove('is-empty');return;}
    const needle=query.toLocaleLowerCase('vi');let total=0;
    findTextNodes().forEach(node=>{
      const lower=node.nodeValue.toLocaleLowerCase('vi');
      let from=0,at=-1;
      while((at=lower.indexOf(needle,from))>=0){total++;from=at+query.length;}
    });
    badge.textContent=total+' khớp';
    badge.classList.toggle('is-empty',total===0);
  }
  function findNextText(){
    const query=$('#findText').value;if(!query){$('#findText').focus();return false;}
    updateFindMatchCount();
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
        sel.removeAllRanges();sel.addRange(range);
        item.node.parentElement?.scrollIntoView({behavior:'smooth',block:'center'});
        editor.focus();rememberEditorSelection();syncToolbarState();return true;
      }
    }
    alert('Đã tìm hết tài liệu, không thấy nội dung này.');return false;
  }
  function replaceCurrent(){
    const query=$('#findText').value,replacement=$('#replaceText').value,sel=window.getSelection();
    if(!query){alert('Hãy nhập nội dung cần tìm.');return;}
    if(sel&&sel.rangeCount&&sel.toString().toLocaleLowerCase('vi')===query.toLocaleLowerCase('vi')&&editor.contains(sel.anchorNode)){
      document.execCommand('insertText',false,replacement);scheduleSave();scheduleTocUpdate();updateFindMatchCount();findNextText();
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
    updateFindMatchCount();
    if(count){scheduleSave();updateStats();scheduleTocUpdate();alert('Đã thay '+count+' vị trí.');}else alert('Không tìm thấy nội dung cần thay.');
  }

  try {
    const stored=JSON.parse(localStorage.getItem(STORE)||'[]');
    if(Array.isArray(stored)) documents=normalizeDocuments(stored.filter(d=>d&&typeof d==='object'));
    if(!documents.length) {
      const legacy=JSON.parse(localStorage.getItem('haidat-writer')||'null');
      documents=[{id:makeId(),title:legacy?.title||'Tài liệu chưa đặt tên',html:legacy?.html||editor.innerHTML,updatedAt:Date.now()}];
    }
  } catch { let raw=null;try{raw=localStorage.getItem(STORE);if(raw!==null)localStorage.setItem('haidat-writer-recovery-raw-v1',raw);}catch{}storageRecoveryRaw=raw!==null?raw:'__UNREADABLE_STORAGE__';documents=[{id:makeId(),title:'Tài liệu chưa đặt tên',html:editor.innerHTML,updatedAt:Date.now()}]; }
  documents=normalizeDocuments(documents);
  const requestedDocumentId=new URLSearchParams(location.search).get('documentId');
  const firstActive=documents.find(d=>d.id===requestedDocumentId&&!d.deletedAt)||documents.find(d=>!d.deletedAt);if(firstActive){activeId=firstActive.id;loadDoc(activeId);}else{const fresh={id:makeId(),title:'Tài liệu mới',html:'<h1>Tài liệu mới</h1><p><br></p>',createdAt:Date.now(),updatedAt:Date.now(),folder:'Chưa phân loại',category:'Khác',pinned:false};documents.push(fresh);activeId=fresh.id;loadDoc(fresh.id);}
  if(storageRecoveryRaw===null){try{localStorage.setItem(STORE,JSON.stringify(documents));}catch{storageRecoveryRaw='__UNREADABLE_STORAGE__';}}try{localStorage.setItem(FOLDERS_STORE,JSON.stringify(folders));}catch{}
  baseDocuments=new Map(documents.map(d=>[d.id,cloneJSON(d)]));
  if(storageRecoveryRaw!==null)setState('Cảnh báo: kho cũ không đọc được · chưa ghi đè dữ liệu · hãy sao lưu/khôi phục trước','error');

  const canvasLaunch=$('#canvasLaunch');
  if(canvasLaunch)canvasLaunch.addEventListener('click',event=>{if(dirty&&!persist(false)){event.preventDefault();return;}const d=current();if(d)canvasLaunch.href='canvas-studio.html?documentId='+encodeURIComponent(d.id);else event.preventDefault();});

  window.addEventListener('pageshow',event=>{if(!event.persisted)return;try{const latest=JSON.parse(localStorage.getItem(STORE)||'[]');if(!Array.isArray(latest))return;documents=normalizeDocuments(latest);baseDocuments=new Map(documents.map(d=>[d.id,cloneJSON(d)]));const active=documents.find(d=>d.id===activeId&&!d.deletedAt);if(active){loadDoc(active.id);setState('Đã đồng bộ thay đổi Canvas','saved');}}catch{setState('Không thể tải lại dữ liệu sau khi quay về','error');}});
  window.addEventListener('storage',event=>{if(event.key===STORE){try{const latest=JSON.parse(event.newValue||'[]');if(!Array.isArray(latest))return;if(dirty){setState('Có thay đổi từ cửa sổ khác · sẽ hợp nhất an toàn khi lưu','pending');return;}documents=normalizeDocuments(latest);baseDocuments=new Map(documents.map(d=>[d.id,cloneJSON(d)]));const active=documents.find(d=>d.id===activeId&&!d.deletedAt);if(active){loadDoc(active.id);setState('Đã đồng bộ dữ liệu Writer/Canvas từ cửa sổ khác','saved');}}catch{setState('Không thể đồng bộ thay đổi từ cửa sổ khác','error');}}else if(event.key===HISTORY_STORE){versionHistory=readVersionHistory();renderVersionHistory();}});
  editor.addEventListener('input',()=>{rememberEditorSelection();scheduleSave();scheduleTocUpdate();syncToolbarState();if($('#findText')?.value)updateFindMatchCount();});
  editor.addEventListener('keyup',syncToolbarState);
  editor.addEventListener('mouseup',()=>{
    rememberEditorSelection();
    if(copiedFormat){
      const sel=window.getSelection();
      if(sel&&sel.rangeCount&&!sel.isCollapsed&&editor.contains(sel.anchorNode)){
        document.execCommand('styleWithCSS',false,true);
        if(copiedFormat.fontFamily)document.execCommand('fontName',false,copiedFormat.fontFamily);
        if(copiedFormat.color)document.execCommand('foreColor',false,copiedFormat.color);
        if(copiedFormat.bg&&copiedFormat.bg!=='transparent')document.execCommand('hiliteColor',false,copiedFormat.bg);
        if(Boolean(document.queryCommandState('bold'))!==copiedFormat.bold)document.execCommand('bold',false,null);
        if(Boolean(document.queryCommandState('italic'))!==copiedFormat.italic)document.execCommand('italic',false,null);
        if(Boolean(document.queryCommandState('underline'))!==copiedFormat.underline)document.execCommand('underline',false,null);
        setFormatPainter(null);scheduleSave();setState('Đã áp dụng định dạng sao chép','saved');
      }
    }
    syncToolbarState();
  });
  editor.addEventListener('click',e=>{
    const link=e.target.closest('a[href]');
    if(!link||!editor.contains(link))return;
    const href=link.getAttribute('href')||'';
    if(href.startsWith('#hd-')){
      e.preventDefault();
      const target=editor.querySelector('#'+CSS.escape(href.slice(1)));
      if(target)target.scrollIntoView({behavior:'smooth',block:'center'});
    }else if((e.ctrlKey||e.metaKey)&&/^(https?:|mailto:|tel:)/i.test(href)){
      e.preventDefault();window.open(href,'_blank','noopener,noreferrer');
    }
  });
  editor.addEventListener('paste',e=>{
    const dt=e.clipboardData;if(!dt)return;
    const imgItem=[...(dt.items||[])].find(it=>it.kind==='file'&&it.type.startsWith('image/'));
    if(imgItem){
      const f=imgItem.getAsFile();
      if(f){e.preventDefault();addImage(f);return;}
    }
    const html=dt.getData('text/html'),text=dt.getData('text/plain');
    if(html){
      e.preventDefault();
      const clean=sanitizeHTML(html);
      document.execCommand('insertHTML',false,clean||escapeHTML(text).replace(/\r?\n/g,'<br>'));
      scheduleSave();updateStats();scheduleTocUpdate();syncToolbarState();
    }
  });
  editor.addEventListener('keydown',e=>{
    if(e.key==='Tab'){
      e.preventDefault();
      const cell=activeTableCell();
      if(cell){
        const table=cell.closest('table'),cells=[...table.querySelectorAll('td,th')],idx=cells.indexOf(cell);
        if(e.shiftKey){if(idx>0)focusTableCell(cells[idx-1]);}
        else if(idx+1<cells.length){focusTableCell(cells[idx+1]);}
        else{editTable('addRowBelow');}
        return;
      }
      const sel=window.getSelection();
      const node=sel?.anchorNode?(sel.anchorNode.nodeType===Node.ELEMENT_NODE?sel.anchorNode:sel.anchorNode.parentElement):null;
      if(node&&node.closest('li')){command(e.shiftKey?'outdent':'indent');return;}
      if(e.shiftKey)command('outdent');else command('insertText','\u00a0\u00a0\u00a0\u00a0');
    }
  });
  document.addEventListener('selectionchange',()=>{rememberEditorSelection();syncToolbarState();});
  document.addEventListener('pointerdown',e=>{if(e.target.closest('.ribbon,.editor-quickbar,.table-context-bar,.image-context-bar'))rememberEditorSelection();},true);
  $('#quickPageBreak').onclick=()=>command('insertHTML','<div class="page-break"></div><p><br></p>');
  const zoomControl=$('#editorZoom'),zoomSteps=['75','90','100','110','125','150'];
  const savedZoom=localStorage.getItem('haidat-writer-editor-zoom-v1');
  if(savedZoom&&zoomSteps.includes(savedZoom))zoomControl.value=savedZoom;
  function applyEditorZoom(){
    const value=zoomControl.value;
    editor.style.zoom=(Number(value)/100);
    const badge=$('#zoomBadge');if(badge)badge.textContent=value+'%';
    localStorage.setItem('haidat-writer-editor-zoom-v1',value);
    if(typeof renderRuler==='function')renderRuler();
    if(typeof positionImageHandle==='function')positionImageHandle();
  }
  zoomControl.addEventListener('change',applyEditorZoom);applyEditorZoom();
  const stepZoom=dir=>{const i=zoomSteps.indexOf(zoomControl.value),next=Math.max(0,Math.min(zoomSteps.length-1,(i<0?2:i)+dir));zoomControl.value=zoomSteps[next];applyEditorZoom();};
  $('#zoomOut').addEventListener('click',()=>stepZoom(-1));
  $('#zoomIn').addEventListener('click',()=>stepZoom(1));
  const focusToggle=$('#toggleFocusMode'),focusExit=$('#focusModeExit');
  function setFocusMode(enabled){document.body.classList.toggle('focus-mode',enabled);focusExit.hidden=!enabled;focusToggle.textContent=enabled?'Thoát chế độ tập trung':'Chế độ tập trung';if(enabled)editor.focus();}
  focusToggle.addEventListener('click',()=>setFocusMode(!document.body.classList.contains('focus-mode')));
  focusExit.addEventListener('click',()=>setFocusMode(false));
  $('#focusEditor').addEventListener('click',()=>{setFocusMode(false);editor.focus();editor.scrollIntoView({behavior:'smooth',block:'center'});});

  titleInput.addEventListener('input',scheduleSave);
  document.querySelectorAll('[data-cmd]').forEach(btn=>btn.addEventListener('click',()=>command(btn.dataset.cmd)));
  document.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>command(btn.dataset.action)));
  $('#applyParagraphSpacing').onclick=applyParagraphFormatting;
  $('#applyTemplate').onclick=applyDocumentTemplate;
  $('#findNext').onclick=findNextText;$('#replaceOne').onclick=replaceCurrent;$('#replaceAll').onclick=replaceAllText;
  $('#findText').addEventListener('input',updateFindMatchCount);
  $('#findText').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();findNextText();}});
  $('#replaceText').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();replaceCurrent();}});
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
  $('#saveVersion').onclick=()=>{if(dirty)persist(false);if(recordVersionSnapshot(true,'Mốc thủ công'))setState('Đã lưu mốc phiên bản','saved');};
  $('#previewVersion').onclick=previewSelectedVersion;$('#restoreVersion').onclick=restoreSelectedVersion;
  $('#closeVersionPreview').onclick=()=>$('#versionPreviewDialog').close();
  $('#versionPreviewDialog').addEventListener('click',e=>{if(e.target===$('#versionPreviewDialog'))$('#versionPreviewDialog').close();});
  $('#docList').onchange=e=>{if(dirty)persist(false);loadDoc(e.target.value);};
  $('#renameDoc').onclick=()=>{titleInput.focus();titleInput.select();};
  $('#copyDocId').onclick=async()=>{const id=current()?.id;if(!id)return;try{await navigator.clipboard.writeText(id);setState('Đã sao chép ID tài liệu','saved');}catch{prompt('ID tài liệu:',id);}};
  $('#deleteDoc').onclick=()=>{
    const doc=current();if(!doc)return;
    if(!confirm('Chuyển “'+doc.title+'” vào Thùng rác? Có thể khôi phục sau.'))return;
    doc.deletedAt=Date.now();doc.updatedAt=Date.now();
    const next=documents.find(d=>!d.deletedAt);
    if(next){activeId=next.id;loadDoc(next.id);}else{const now=Date.now(),fresh={id:makeId(),title:'Tài liệu mới',html:'<h1>Tài liệu mới</h1><p><br></p>',createdAt:now,updatedAt:now,revision:1,appType:'writer',schemaVersion:3,folder:'Chưa phân loại',category:'Khác',pinned:false};documents.push(fresh);activeId=fresh.id;loadDoc(fresh.id);}
    persist();setState('Đã chuyển tài liệu vào Thùng rác','saved');
  };
  $('#documentSearch').addEventListener('input',renderDocList);$('#folderFilter').addEventListener('change',renderDocList);$('#documentSort').addEventListener('change',renderDocList);
  $('#docFolder').addEventListener('change',e=>{const d=current();if(!d||!folders.includes(e.target.value))return;d.folder=e.target.value;d.updatedAt=Date.now();persist();setState('Đã chuyển tài liệu vào '+d.folder,'saved');});
  $('#docCategory').addEventListener('change',e=>{const d=current();if(!d)return;d.category=e.target.value;d.updatedAt=Date.now();persist();renderDocList();setState('Đã cập nhật phân loại','saved');});
  $('#togglePin').onclick=()=>{const d=current();if(!d)return;d.pinned=!d.pinned;d.updatedAt=Date.now();persist();loadDoc(d.id);setState(d.pinned?'Đã ghim tài liệu':'Đã bỏ ghim tài liệu','saved');};
  $('#createFolder').onclick=()=>{const v=prompt('Tên thư mục mới (tối đa 40 ký tự):');if(v===null)return;const name=v.trim().slice(0,40);if(!name){alert('Tên thư mục không được để trống.');return;}if(folders.some(x=>x.toLocaleLowerCase('vi')===name.toLocaleLowerCase('vi'))){alert('Thư mục đã tồn tại.');return;}if(folders.length>=100){alert('Đã đạt giới hạn 100 thư mục.');return;}folders.push(name);localStorage.setItem(FOLDERS_STORE,JSON.stringify(folders));renderFolderControls();$('#folderFilter').value=name;renderDocList();setState('Đã tạo thư mục '+name,'saved');};
  $('#deleteFolder').onclick=()=>{const name=$('#folderFilter').value;if(!folders.includes(name)){alert('Hãy chọn thư mục cụ thể để xóa.');return;}if(name==='Chưa phân loại'){alert('Không thể xóa thư mục mặc định “Chưa phân loại”.');return;}if(!confirm('Xóa thư mục “'+name+'”? Tài liệu bên trong chuyển về Chưa phân loại.'))return;documents.forEach(d=>{if(d.folder===name)d.folder='Chưa phân loại';});folders=folders.filter(x=>x!==name);if(!folders.includes('Chưa phân loại'))folders.unshift('Chưa phân loại');localStorage.setItem(FOLDERS_STORE,JSON.stringify(folders));persist();renderFolderControls();renderDocList();};
  $('#restoreTrash').onclick=()=>{const d=documents.find(x=>x.id===$('#trashList').value&&x.deletedAt);if(!d){alert('Chọn tài liệu trong Thùng rác trước.');return;}d.deletedAt=null;d.updatedAt=Date.now();loadDoc(d.id);persist();setState('Đã khôi phục tài liệu','saved');};
  $('#purgeTrash').onclick=()=>{const d=documents.find(x=>x.id===$('#trashList').value&&x.deletedAt);if(!d){alert('Chọn tài liệu trong Thùng rác trước.');return;}if(!confirm('Xóa vĩnh viễn “'+d.title+'”? Không thể khôi phục.'))return;documents=documents.filter(x=>x.id!==d.id);delete versionHistory[d.id];saveVersionHistory();persist();renderDocList();renderVersionHistory();};
  $('#saveNow').onclick=()=>{clearTimeout(saveTimer);persist();};
  $('#openLocalFile').onclick=openFromComputer;$('#saveFile').onclick=saveCurrentFile;$('#saveAsFile').onclick=saveAsFile;$('#closeFile').onclick=closeCurrentFile;$('#chooseWorkFolder').onclick=chooseWorkFolder;$('#openWorkFolder').onclick=openFromChosenFolder;
  initFileHandles();
  $('#exportHtml').onclick=exportHTML;
  $('#exportTxt').onclick=()=>{persist(false);download(safeName(current().title)+'.txt',plainText(),'text/plain;charset=utf-8');};
  $('#printDoc').onclick=()=>{persist(false);window.print();};
  ['openFile','openDocx'].forEach(id=>{const input=$('#'+id);if(input)input.onchange=e=>{const f=e.target.files[0];if(f)openAnyFile(f);e.target.value='';};});
  document.addEventListener('keydown',e=>{
    const mod=e.ctrlKey||e.metaKey,key=e.key.toLowerCase(),inEd=document.activeElement===editor||editor.contains(document.activeElement);
    if(e.key==='Escape'){
      const fp=$('#writerFindPopover');
      if(fp&&!fp.hidden){fp.hidden=true;$('#toggleWriterFind')?.setAttribute('aria-pressed','false');editor.focus();return;}
      if(typeof selectImage==='function')selectImage(null);
      if(copiedFormat){setFormatPainter(null);setState('Đã tắt sao chép định dạng','');}
      if(document.body.classList.contains('focus-mode'))setFocusMode(false);
    }
    if(mod && key==='f'){e.preventDefault();const fp=$('#writerFindPopover');if(fp)fp.hidden=false;$('#toggleWriterFind')?.setAttribute('aria-pressed','true');$('#findText')?.focus();$('#findText')?.select();}
    if(mod && key==='h'){e.preventDefault();const fp=$('#writerFindPopover');if(fp)fp.hidden=false;$('#toggleWriterFind')?.setAttribute('aria-pressed','true');$('#replaceText')?.focus();$('#replaceText')?.select();}
    if(mod && key==='s'){e.preventDefault();clearTimeout(saveTimer);persist();}
    if(!inEd)return;
    if(e.shiftKey && e.key==='F3'){e.preventDefault();if(typeof cycleChangeCase==='function')cycleChangeCase();}
    if(mod && e.altKey && key==='m'){e.preventDefault();if(typeof addComment==='function')addComment();}
    if(mod && e.key==='Enter'){e.preventDefault();command('insertHTML','<div class="page-break"></div><p><br></p>');}
    if(mod && e.shiftKey && (key==='l'||e.code==='Digit8')){e.preventDefault();command('insertUnorderedList');}
    if(mod && e.shiftKey && e.code==='Digit7'){e.preventDefault();command('insertOrderedList');}
    if(mod && !e.shiftKey && !e.altKey && key==='b'){e.preventDefault();command('bold');}
    if(mod && !e.shiftKey && !e.altKey && key==='i'){e.preventDefault();command('italic');}
    if(mod && !e.shiftKey && !e.altKey && key==='u'){e.preventDefault();command('underline');}
    if(mod && !e.shiftKey && !e.altKey && key==='k'){e.preventDefault();insertLink();}
    if(mod && !e.shiftKey && !e.altKey && key==='e'){e.preventDefault();command('justifyCenter');}
    if(mod && !e.shiftKey && !e.altKey && key==='l'){e.preventDefault();command('justifyLeft');}
    if(mod && !e.shiftKey && !e.altKey && key==='r'){e.preventDefault();command('justifyRight');}
    if(mod && !e.shiftKey && !e.altKey && key==='j'){e.preventDefault();command('justifyFull');}
    if(mod && !e.shiftKey && e.key==='\\'){e.preventDefault();command('removeFormat');}
    if(mod && e.altKey && ['Digit0','Digit1','Digit2','Digit3'].includes(e.code)){
      e.preventDefault();command('formatBlock',{Digit0:'P',Digit1:'H1',Digit2:'H2',Digit3:'H3'}[e.code]);
    }
  });
  window.addEventListener('beforeunload',()=>{if(dirty)persist(false);});
  if('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(registration=>{
      if(registration.waiting) setState('Có bản cập nhật WORK sẵn sàng · tải lại để dùng','saved');
    }).catch(()=>setState('Chưa bật được chế độ ngoại tuyến · vẫn có thể dùng khi có mạng','warning'));
  }
  const installButton=$('#install');
  window.addEventListener('beforeinstallprompt',e=>{
    e.preventDefault();
    deferredInstall=e;
    installButton.hidden=false;
    installButton.disabled=false;
    installButton.textContent='Cài ứng dụng';
    installButton.setAttribute('aria-label','Cài HAI ĐẤT OFFICE WORK lên thiết bị');
  });
  installButton.addEventListener('click',async()=>{
    if(!deferredInstall)return;
    const promptEvent=deferredInstall;
    deferredInstall=null;
    installButton.disabled=true;
    try{
      await promptEvent.prompt();
      const choice=await promptEvent.userChoice;
      if(choice&&choice.outcome==='accepted'){
        setState('Đã chấp nhận cài WORK · chờ thiết bị hoàn tất','saved');
      }else{
        setState('Chưa cài WORK · có thể cài lại từ trình duyệt','');
      }
    }catch(error){
      setState('Không mở được lời mời cài đặt · thử từ menu trình duyệt','warning');
    }finally{
      installButton.hidden=true;
      installButton.disabled=false;
    }
  });
  window.addEventListener('appinstalled',()=>{
    installButton.hidden=true;
    setState('WORK đã được cài trên thiết bị','saved');
  });

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
  function cssColorHex6(val){
    if(!val)return '';
    const v=String(val).trim();
    if(/^#[0-9a-f]{6}$/i.test(v))return v.slice(1).toUpperCase();
    if(/^#[0-9a-f]{3}$/i.test(v))return (v[1]+v[1]+v[2]+v[2]+v[3]+v[3]).toUpperCase();
    const hex=cssRgbToHex(v);
    return hex?hex.slice(1).toUpperCase():'';
  }
  function buildRPrXML(f){
    let p='';
    if(f.face)p+='<w:rFonts w:ascii="'+xmlEscape(f.face)+'" w:hAnsi="'+xmlEscape(f.face)+'" w:cs="'+xmlEscape(f.face)+'"/>';
    if(f.b)p+='<w:b/>';
    if(f.i)p+='<w:i/>';
    if(f.u)p+='<w:u w:val="single"/>';
    if(f.strike)p+='<w:strike/>';
    if(f.pt>0)p+='<w:sz w:val="'+Math.round(f.pt*2)+'"/><w:szCs w:val="'+Math.round(f.pt*2)+'"/>';
    if(f.color)p+='<w:color w:val="'+f.color+'"/>';
    if(f.bg)p+='<w:shd w:val="clear" w:color="auto" w:fill="'+f.bg+'"/>';
    if(f.vert==='sup')p+='<w:vertAlign w:val="superscript"/>';
    else if(f.vert==='sub')p+='<w:vertAlign w:val="subscript"/>';
    return p?'<w:rPr>'+p+'</w:rPr>':'';
  }
  function runXML(node,inherited={}){
    if(node.nodeType===Node.TEXT_NODE){
      if(!node.nodeValue)return '';
      return '<w:r>'+buildRPrXML(inherited)+'<w:t xml:space="preserve">'+xmlEscape(node.nodeValue)+'</w:t></w:r>';
    }
    if(node.nodeType!==Node.ELEMENT_NODE)return '';
    const tag=node.tagName,style=node.getAttribute?.('style')||'';
    if(tag==='BR')return '<w:r><w:br/></w:r>';
    if(tag==='IMG'||tag==='TABLE')return '';
    const fmt={...inherited};
    if(tag==='B'||tag==='STRONG'||/font-weight\s*:\s*(bold|[6-9]00)/i.test(style))fmt.b=true;
    if(tag==='I'||tag==='EM'||/font-style\s*:\s*italic/i.test(style))fmt.i=true;
    if(tag==='U'||/text-decoration[^:]*:\s*[^;]*underline/i.test(style))fmt.u=true;
    if(tag==='S'||tag==='STRIKE'||/text-decoration[^:]*:\s*[^;]*line-through/i.test(style))fmt.strike=true;
    const face=node.getAttribute?.('face')||((style.match(/font-family\s*:\s*([^;]+)/i)||[])[1]||'').replace(/["']/g,'').split(',')[0].trim();
    if(face)fmt.face=face;
    const size=node.getAttribute?.('size');
    const cssSize=(style.match(/font-size\s*:\s*([0-9.]+)\s*(pt|px)?/i)||[]);
    const pt=size?({1:8,2:10,3:12,4:14,5:18,6:24,7:36}[size]||12):(cssSize[1]?Number(cssSize[1])*(cssSize[2]==='px'?0.75:1):0);
    if(pt>0)fmt.pt=pt;
    const colorRaw=node.getAttribute?.('color')||((style.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i)||[])[1]||'');
    const colorHex=cssColorHex6(colorRaw);
    if(colorHex)fmt.color=colorHex;
    const bgRaw=(style.match(/background-color\s*:\s*([^;]+)/i)||[])[1]||'';
    const bgHex=cssColorHex6(bgRaw);
    if(bgHex)fmt.bg=bgHex;
    if(tag==='SUP')fmt.vert='sup';
    if(tag==='SUB')fmt.vert='sub';
    return [...node.childNodes].map(ch=>runXML(ch,fmt)).join('');
  }
  function paragraphXML(el,extra={}){
    if(el.classList?.contains('page-break')||el.classList?.contains('section-break'))return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
    const tag=el.tagName||'P',pParts=[];
    if(/^H[1-3]$/.test(tag))pParts.push('<w:pStyle w:val="Heading'+tag.slice(1)+'"/>');
    const align=el.style?.textAlign;
    if(align)pParts.push('<w:jc w:val="'+({left:'left',center:'center',right:'right',justify:'both'}[align]||'left')+'"/>');
    const parsePt=v=>{const m=String(v||'').match(/^([0-9.]+)\s*(pt|px)?$/i);return m?Number(m[1])*(m[2]==='px'?0.75:1):0;};
    const indLeft=extra.indentLeft||(tag==='BLOCKQUOTE'||el.classList?.contains('hd-callout')?360:Math.round(parsePt(el.style?.marginLeft)*20));
    const indFirst=Math.round(parsePt(el.style?.textIndent)*20);
    if(indLeft>0||indFirst>0)pParts.push('<w:ind'+(indLeft>0?' w:left="'+indLeft+'"':'')+(indFirst>0?' w:firstLine="'+indFirst+'"':'')+'/>');
    const beforeTw=Math.round(parsePt(el.style?.marginTop)*20),afterTw=Math.round(parsePt(el.style?.marginBottom)*20);
    const lh=Number(el.style?.lineHeight)||0;
    if(beforeTw>0||afterTw>0||(lh>=0.8&&lh<=4)){
      pParts.push('<w:spacing'+(beforeTw>0?' w:before="'+beforeTw+'"':'')+(afterTw>0?' w:after="'+afterTw+'"':'')+(lh>=0.8&&lh<=4?' w:line="'+Math.round(lh*240)+'" w:lineRule="auto"':'')+'/>');
    }
    const pPr=pParts.length?'<w:pPr>'+pParts.join('')+'</w:pPr>':'';
    const prefixRun=extra.prefix?'<w:r><w:t xml:space="preserve">'+xmlEscape(extra.prefix)+'</w:t></w:r>':'';
    return '<w:p>'+pPr+prefixRun+[...el.childNodes].map(ch=>runXML(ch,{})).join('')+'</w:p>';
  }
  function tableXML(table){
    const rows=[...table.rows].map(row=>'<w:tr>'+[...row.cells].map(cell=>{
      const blockChildren=[...cell.children].filter(ch=>/^(P|H[1-4]|DIV|UL|OL|BLOCKQUOTE)$/.test(ch.tagName));
      const inner=blockChildren.length?blocksToDocxXML(blockChildren):'<w:p>'+[...cell.childNodes].map(ch=>runXML(ch,cell.tagName==='TH'?{b:true}:{})).join('')+'</w:p>';
      return '<w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/></w:tcPr>'+inner+'</w:tc>';
    }).join('')+'</w:tr>').join('');
    return '<w:tbl><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4"/><w:left w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>'+rows+'</w:tbl>';
  }
  function blocksToDocxXML(nodes){
    let out='';
    for(const node of nodes){
      if(node.nodeType===Node.TEXT_NODE){
        if(node.nodeValue.trim())out+='<w:p><w:r><w:t xml:space="preserve">'+xmlEscape(node.nodeValue)+'</w:t></w:r></w:p>';
        continue;
      }
      if(node.nodeType!==Node.ELEMENT_NODE)continue;
      const tag=node.tagName;
      if(node.classList?.contains('page-break')||node.classList?.contains('section-break')){out+='<w:p><w:r><w:br w:type="page"/></w:r></w:p>';continue;}
      if(tag==='TABLE'){out+=tableXML(node);continue;}
      if(tag==='HR'){out+='<w:p><w:r><w:t>────────────────────────</w:t></w:r></w:p>';continue;}
      if(tag==='UL'||tag==='OL'){
        let idx=0;
        for(const li of [...node.children].filter(x=>x.tagName==='LI')){
          idx++;
          out+=paragraphXML(li,{prefix:tag==='OL'?(idx+'. '):'• ',indentLeft:360});
        }
        continue;
      }
      if((tag==='SECTION'||tag==='DIV')&&!node.classList?.contains('hd-callout')&&[...node.children].some(ch=>/^(P|H[1-4]|DIV|SECTION|UL|OL|TABLE|BLOCKQUOTE|HR)$/.test(ch.tagName))){
        out+=blocksToDocxXML(node.childNodes);continue;
      }
      out+=paragraphXML(node);
    }
    return out;
  }
  function exportDocx(returnBlob=false){
    persist(false);
    const body=blocksToDocxXML(editor.childNodes)||'<w:p/>';
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
  function xmlAttr(el,ns,name){return el?.getAttributeNS(ns,name)||'';}
  function docxFlagOn(rPr,ns,name){
    const el=rPr?.getElementsByTagNameNS(ns,name)[0];
    if(!el)return false;
    const v=xmlAttr(el,ns,'val').toLowerCase();
    return v!=='0'&&v!=='false'&&v!=='none';
  }
  function docxRPrCSS(rPr,ns){
    if(!rPr)return [];
    const css=[],face=rPr.getElementsByTagNameNS(ns,'rFonts')[0];
    const family=xmlAttr(face,ns,'eastAsia')||xmlAttr(face,ns,'ascii')||xmlAttr(face,ns,'hAnsi');
    if(family)css.push('font-family:'+family.replace(/[\"<>;]/g,''));
    const size=Number(xmlAttr(rPr.getElementsByTagNameNS(ns,'sz')[0],ns,'val'));if(size>0)css.push('font-size:'+(size/2)+'pt');
    const color=xmlAttr(rPr.getElementsByTagNameNS(ns,'color')[0],ns,'val');if(/^[0-9a-f]{6}$/i.test(color))css.push('color:#'+color);
    if(docxFlagOn(rPr,ns,'b'))css.push('font-weight:bold');
    if(docxFlagOn(rPr,ns,'i'))css.push('font-style:italic');
    if(docxFlagOn(rPr,ns,'u'))css.push('text-decoration:underline');
    return css;
  }
  function docxRunHTML(run,ns){
    const rPr=[...run.children].find(x=>x.localName==='rPr');
    const css=[],face=rPr?.getElementsByTagNameNS(ns,'rFonts')[0];
    const family=xmlAttr(face,ns,'eastAsia')||xmlAttr(face,ns,'ascii')||xmlAttr(face,ns,'hAnsi');
    if(family)css.push('font-family:'+family.replace(/["<>;]/g,'') );
    const size=Number(xmlAttr(rPr?.getElementsByTagNameNS(ns,'sz')[0],ns,'val'));
    if(size>0)css.push('font-size:'+(size/2)+'pt');
    const color=xmlAttr(rPr?.getElementsByTagNameNS(ns,'color')[0],ns,'val');
    if(/^[0-9a-f]{6}$/i.test(color))css.push('color:#'+color);
    const highlight=xmlAttr(rPr?.getElementsByTagNameNS(ns,'highlight')[0],ns,'val');
    const shade=xmlAttr(rPr?.getElementsByTagNameNS(ns,'shd')[0],ns,'fill');
    const bg=/^[0-9a-f]{6}$/i.test(shade)?shade:({yellow:'FFFF00',green:'00FF00',cyan:'00FFFF',magenta:'FF00FF',blue:'0000FF',red:'FF0000',darkBlue:'00008B',darkCyan:'008B8B',darkGreen:'006400',darkMagenta:'8B008B',darkRed:'8B0000',darkYellow:'808000',lightGray:'D3D3D3',darkGray:'A9A9A9',black:'000000'}[highlight]||'');
    if(bg)css.push('background-color:#'+bg);
    const has=x=>docxFlagOn(rPr,ns,x);
    let html='';
    for(const child of run.children){
      if(child.localName==='t'||child.localName==='delText')html+=escapeHTML(child.textContent);
      else if(child.localName==='tab')html+='&emsp;';
      else if(child.localName==='br'||child.localName==='cr')html+='<br>';
      else if(child.localName==='noBreakHyphen')html+='‑';
      else if(child.localName==='softHyphen')html+='­';
    }
    if(!html)return '';
    if(has('b'))html='<strong>'+html+'</strong>';
    if(has('i'))html='<em>'+html+'</em>';
    if(has('u'))html='<u>'+html+'</u>';
    if(has('strike')||has('dstrike'))html='<s>'+html+'</s>';
    const vert=xmlAttr(rPr?.getElementsByTagNameNS(ns,'vertAlign')[0],ns,'val');
    if(vert==='superscript')html='<sup>'+html+'</sup>';
    if(vert==='subscript')html='<sub>'+html+'</sub>';
    return css.length?'<span style="'+css.join(';')+'">'+html+'</span>':html;
  }
  function docxParagraphHTML(node,ns,styleMap,defaultCss){
    const pPr=[...node.children].find(x=>x.localName==='pPr');
    const pStyle=xmlAttr(pPr?.getElementsByTagNameNS(ns,'pStyle')[0],ns,'val');
    const tag=/Heading1/i.test(pStyle)?'h1':/Heading2/i.test(pStyle)?'h2':/Heading3/i.test(pStyle)?'h3':'p';
    const css=[...(styleMap?.[pStyle]||styleMap?.Normal||defaultCss||[])],jc=xmlAttr(pPr?.getElementsByTagNameNS(ns,'jc')[0],ns,'val');
    if(jc)css.push('text-align:'+({both:'justify',start:'left',end:'right',left:'left',right:'right',center:'center'}[jc]||'left'));
    const ind=pPr?.getElementsByTagNameNS(ns,'ind')[0];
    for(const [attr,prop] of [['left','margin-left'],['right','margin-right'],['firstLine','text-indent']]){
      const n=Number(xmlAttr(ind,ns,attr));if(n>0)css.push(prop+':'+(n/20)+'pt');
    }
    const spacing=pPr?.getElementsByTagNameNS(ns,'spacing')[0];
    for(const [attr,prop] of [['before','margin-top'],['after','margin-bottom']]){
      const n=Number(xmlAttr(spacing,ns,attr));if(n>0)css.push(prop+':'+(n/20)+'pt');
    }
    const runNodes=[];
    for(const ch of node.children){
      if(ch.localName==='r')runNodes.push(ch);
      else if(ch.localName==='hyperlink'||ch.localName==='ins'||ch.localName==='smartTag'){
        for(const sub of ch.children)if(sub.localName==='r')runNodes.push(sub);
      }
    }
    const runs=runNodes.map(r=>docxRunHTML(r,ns)).join('');
    const content=runs||'<br>';
    return '<'+tag+(css.length?' style="'+css.join(';')+'"':'')+'>'+content+'</'+tag+'>';
  }
  async function importODT(file){
    try{
      const xml=await unzipText(file,'content.xml'),doc=new DOMParser().parseFromString(xml,'application/xml');
      if(doc.querySelector('parsererror'))throw new Error('Tệp ODT lỗi XML.');
      const T='urn:oasis:names:tc:opendocument:xmlns:text:1.0',S='urn:oasis:names:tc:opendocument:xmlns:style:1.0',F='urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0';
      const styles=new Map();
      for(const st of [...doc.getElementsByTagNameNS(S,'style')]){
        const name=xmlAttr(st,S,'name'),tp=st.getElementsByTagNameNS(S,'text-properties')[0],pp=st.getElementsByTagNameNS(S,'paragraph-properties')[0],css=[];
        const pairs=[[xmlAttr(tp,S,'font-name'),'font-family'],[xmlAttr(tp,F,'font-size'),'font-size'],[xmlAttr(tp,F,'color'),'color'],[xmlAttr(pp,F,'text-align'),'text-align'],[xmlAttr(pp,F,'margin-left'),'margin-left'],[xmlAttr(pp,F,'text-indent'),'text-indent']];
        for(const [v,k] of pairs)if(v)css.push(k+':'+v);
        if(xmlAttr(tp,F,'font-weight')==='bold')css.push('font-weight:bold');
        if(xmlAttr(tp,F,'font-style')==='italic')css.push('font-style:italic');
        if(xmlAttr(tp, S,'text-underline-style')&&xmlAttr(tp,S,'text-underline-style')!=='none')css.push('text-decoration:underline');
        styles.set(name,css);
      }
      const inline=(node)=>[...node.childNodes].map(ch=>{
        if(ch.nodeType===Node.TEXT_NODE)return escapeHTML(ch.nodeValue);
        if(ch.nodeType!==Node.ELEMENT_NODE)return '';
        if(ch.namespaceURI===T&&ch.localName==='s')return ' '.repeat(Math.min(100,Number(xmlAttr(ch,T,'c'))||1));
        if(ch.namespaceURI===T&&ch.localName==='tab')return '&emsp;';
        if(ch.namespaceURI===T&&ch.localName==='line-break')return '<br>';
        if(ch.namespaceURI===T&&ch.localName==='span'){
          const css=styles.get(xmlAttr(ch,T,'style-name'))||[],inner=inline(ch);
          return css.length?'<span style="'+css.join(';')+'">'+inner+'</span>':inner;
        }
        return inline(ch);
      }).join('');
      let html='';
      const root=doc.getElementsByTagNameNS(T,'body')[0]?.getElementsByTagNameNS(T,'text')[0];
      if(!root)throw new Error('Không tìm thấy nội dung văn bản ODT.');
      for(const node of root.children){
        if(node.namespaceURI!==T||!['p','h'].includes(node.localName))continue;
        const style=styles.get(xmlAttr(node,T,'style-name'))||[];
        const tag=node.localName==='h'?'h2':'p',content=inline(node)||'<br>';
        html+='<'+tag+(style.length?' style="'+style.join(';')+'"':'')+'>'+content+'</'+tag+'>';
      }
      return addLoadedFile(file.name,html||'<p><br></p>');
    }catch(err){alert('Không mở được ODT: '+err.message);return false;}
  }
  async function importDocx(file){
    try{
      const xml=await unzipText(file,'word/document.xml'),doc=new DOMParser().parseFromString(xml,'application/xml');
      if(doc.querySelector('parsererror'))throw new Error('Không đọc được XML trong tài liệu Word.');
      const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
      const styleMap={};let defaultCss=[];
      try{
        const sx=await unzipText(file,'word/styles.xml'),sd=new DOMParser().parseFromString(sx,'application/xml');
        const defaults=sd.getElementsByTagNameNS(ns,'docDefaults')[0]?.getElementsByTagNameNS(ns,'rPrDefault')[0]?.getElementsByTagNameNS(ns,'rPr')[0];
        defaultCss=docxRPrCSS(defaults,ns);
        const defs=new Map();
        for(const st of [...sd.getElementsByTagNameNS(ns,'style')]){
          const id=xmlAttr(st,ns,'styleId')||st.getAttribute('w:styleId');if(!id)continue;
          const base=xmlAttr(st.getElementsByTagNameNS(ns,'basedOn')[0],ns,'val');
          const rp=st.getElementsByTagNameNS(ns,'rPr')[0];defs.set(id,{base,css:docxRPrCSS(rp,ns)});
        }
        const resolve=(id,seen=new Set())=>{if(!id||seen.has(id)||!defs.has(id))return [];seen.add(id);const x=defs.get(id);return [...resolve(x.base,seen),...x.css];};
        for(const id of defs.keys())styleMap[id]=resolve(id);
      }catch{}
      const body=doc.getElementsByTagNameNS(ns,'body')[0];if(!body)throw new Error('Tài liệu Word không có phần nội dung.');
      let html='';
      for(const node of body.children){
        if(node.localName==='p')html+=docxParagraphHTML(node,ns,styleMap,defaultCss);
        else if(node.localName==='tbl'){
          html+='<table><tbody>';
          for(const tr of [...node.children].filter(x=>x.localName==='tr')){
            html+='<tr>';
            for(const tc of [...tr.children].filter(x=>x.localName==='tc')){
              const blocks=[...tc.children].filter(x=>x.localName==='p').map(p=>docxParagraphHTML(p,ns,styleMap,defaultCss)).join('');
              html+='<td>'+blocks+'</td>';
            }
            html+='</tr>';
          }
          html+='</tbody></table>';
        }
      }
      return addLoadedFile(file.name,html||'<p><br></p>');
    }catch(err){alert('Không mở được DOCX: '+err.message);return false;}
  }
  function applyPageSettings(){
    const sizes={A4:[210,297],A5:[148,210],Letter:[216,279]},s=sizes[$('#paperSize').value]||sizes.A4;
    const margin=Math.max(5,Math.min(50,Number($('#pageMargin').value)||20));
    editor.style.width=s[0]+'mm';editor.style.minHeight=s[1]+'mm';editor.style.padding=margin+'mm';
    let style=$('#dynamicPrintStyle');if(!style){style=document.createElement('style');style.id='dynamicPrintStyle';document.head.append(style);}
    style.textContent='@page{size:'+$('#paperSize').value+';margin:'+margin+'mm}';
    try{localStorage.setItem('haidat-writer-page-settings',JSON.stringify({paper:$('#paperSize').value,margin}));}catch{}
    if(typeof renderRuler==='function')renderRuler();
    if(typeof positionImageHandle==='function')positionImageHandle();
    if(typeof applyPrintSettings==='function')applyPrintSettings();
  }


  // Print header/footer settings are stored separately from document body.
  const PRINT_STORE='haidat-writer-print-settings-v1';
  function readPrintSettings(){
    try{return JSON.parse(localStorage.getItem(PRINT_STORE)||'{}')||{};}catch{return {};}
  }
  function cssStringEscape(s){return String(s||'').replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/[\r\n]+/g,' ');}
  function applyPrintSettings(){
    const settings={header:$('#headerText').value.trim(),footer:$('#footerText').value.trim(),numbers:$('#showPageNumbers').checked};
    try{localStorage.setItem(PRINT_STORE,JSON.stringify(settings));}catch{}
    let style=$('#dynamicPrintStyle');
    if(!style){style=document.createElement('style');style.id='dynamicPrintStyle';document.head.append(style);}
    const paper=$('#paperSize').value,margin=Math.max(5,Math.min(50,Number($('#pageMargin').value)||20));
    const header=cssStringEscape(settings.header),footer=cssStringEscape(settings.footer);
    style.textContent='@page{size:'+paper+';margin:'+margin+'mm;'+
      '@top-center{content:"'+header+'";font:9pt Arial,sans-serif;color:#555}'+
      (settings.numbers?'@bottom-center{content:"'+(footer?footer+' · ':'')+'Trang " counter(page) " / " counter(pages);font:9pt Arial,sans-serif;color:#555}':'@bottom-center{content:"'+footer+'";font:9pt Arial,sans-serif;color:#555}')+'}'+
      '@media print{.page{position:relative}.print-running-header{display:none!important}.print-running-footer{display:none!important}}';
    const hPrev=$('#pageHeaderPreview'),fPrev=$('#pageFooterPreview');
    if(hPrev){hPrev.textContent=settings.header;hPrev.hidden=!settings.header;}
    if(fPrev){
      const fText=settings.numbers?(settings.footer?settings.footer+' · Trang 1':'Trang 1'):settings.footer;
      fPrev.textContent=fText;fPrev.hidden=!settings.footer&&!settings.numbers;
    }
  }
  function loadPrintSettings(){
    const p=readPrintSettings();
    $('#headerText').value=p.header||'';$('#footerText').value=p.footer||'';$('#showPageNumbers').checked=p.numbers!==false;
    applyPrintSettings();
  }
  function exportBackup(){
    if(dirty)persist(false);
    const payload={format:'HAI-DAT-WRITER-BACKUP',version:5,appType:'writer',createdAt:new Date().toISOString(),activeId,folders,documents,versionHistory,printSettings:readPrintSettings(),pageSettings:(()=>{try{return JSON.parse(localStorage.getItem('haidat-writer-page-settings')||'{}');}catch{return {};}})()};
    download('hai-dat-writer-backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(payload,null,2),'application/json;charset=utf-8');
    setState('Đã tạo bản sao lưu','saved');
  }
  function importBackup(file){
    if(!file)return;
    if(dirty&&!persist(false)){alert('Chưa thể lưu nội dung đang sửa. Đã hủy thao tác khôi phục để bảo toàn dữ liệu.');return;}
    if(file.size>20*1024*1024){alert('Bản sao lưu vượt quá 20 MB.');return;}
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const data=JSON.parse(String(reader.result||''));
        if(data.format!=='HAI-DAT-WRITER-BACKUP'||![1,2,3,4,5].includes(data.version)||!Array.isArray(data.documents)||!data.documents.length)throw new Error('Sai định dạng hoặc phiên bản bản sao lưu.');
        const mode=$('#backupMode')?.value||'merge';
        if(!window.HD_BACKUP_STUDIO||typeof window.HD_BACKUP_STUDIO.inspect!=='function')throw new Error('Thiếu mô-đun kiểm tra bản sao lưu. Hãy tải lại ứng dụng trước khi khôi phục.');
        const preview=window.HD_BACKUP_STUDIO.inspect(data,documents,mode);
        if(!preview.ok)throw new Error(preview.errors.join('\n'));
        if(!confirm(preview.message))return;
        if(mode==='replace'){
          const approved=confirm('CHẾ ĐỘ THAY THẾ TOÀN BỘ\\n\\nWriter sẽ tạo một tệp sao lưu dữ liệu hiện tại trước khi khôi phục. Hãy giữ tệp tải xuống ở nơi an toàn. Tiếp tục?');
          if(!approved)return;
          const safetyPayload={format:'HAI-DAT-WRITER-BACKUP',version:5,appType:'writer',createdAt:new Date().toISOString(),activeId,folders,documents,versionHistory,printSettings:readPrintSettings(),pageSettings:(()=>{try{return JSON.parse(localStorage.getItem('haidat-writer-page-settings')||'{}');}catch{return {};}})(),safetyCopy:true};
          download('hai-dat-writer-truoc-khi-thay-the-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json',JSON.stringify(safetyPayload,null,2),'application/json;charset=utf-8');
          if(!confirm('Đã yêu cầu tải bản sao lưu hiện tại xuống thiết bị. Chỉ bấm OK nếu trình duyệt đã tải tệp hoặc bạn đã tự sao lưu dữ liệu. Nếu chưa, hãy bấm Hủy.')){
            throw new Error('Đã hủy thay thế để bảo toàn dữ liệu hiện tại.');
          }
        }
        const importedFolders=Array.isArray(data.folders)?data.folders.map(x=>String(x).trim().slice(0,40)).filter(Boolean):[];
        const cleanFolders=[...new Set(mode==='merge'?[...folders,...importedFolders]:importedFolders)].slice(0,100);
        if(!cleanFolders.includes('Chưa phân loại'))cleanFolders.unshift('Chưa phân loại');
        const sourceDocs=data.documents.filter(d=>d&&typeof d==='object'&&typeof d.html==='string');
        const imported=normalizeDocuments(sourceDocs.map(d=>({...d,title:String(d.title||'Tài liệu khôi phục').slice(0,120),html:sanitizeHTML(d.html)})));
        imported.forEach((d,i)=>{const folder=String(sourceDocs[i].folder||'Chưa phân loại');d.folder=cleanFolders.includes(folder)?folder:'Chưa phân loại';});
        if(!imported.length)throw new Error('Không tìm thấy tài liệu hợp lệ trong bản sao lưu.');
        const nextDocs=mode==='merge'?documents.map(d=>({...d})):[];
        if(mode==='merge'){
          const byId=new Map(nextDocs.map((d,i)=>[d.id,i]));
          imported.forEach(incoming=>{
            const at=byId.get(incoming.id);
            if(at===undefined){byId.set(incoming.id,nextDocs.length);nextDocs.push(incoming);}
            else if((Number(incoming.updatedAt)||0)>=(Number(nextDocs[at].updatedAt)||0))nextDocs[at]=incoming;
          });
        }else nextDocs.push(...imported);
        const nextHistory=mode==='merge'?JSON.parse(JSON.stringify(versionHistory)):{};
        if(data.versionHistory&&typeof data.versionHistory==='object'&&!Array.isArray(data.versionHistory)){
          imported.forEach(d=>{
            const incoming=data.versionHistory[d.id];if(!Array.isArray(incoming))return;
            const existing=Array.isArray(nextHistory[d.id])?nextHistory[d.id]:[];
            const merged=new Map(existing.filter(v=>v&&typeof v.html==='string').map(v=>[String(v.versionId||('legacy-'+v.createdAt)),v]));
            incoming.filter(v=>v&&typeof v.html==='string'&&v.html.length<=HISTORY_MAX_CHARS).forEach((v,i)=>{
              const versionId=String(v.versionId||('backup-'+(Number(v.createdAt)||Date.now())+'-'+i));
              merged.set(versionId,{...v,versionId,html:sanitizeHTML(v.html),reason:String(v.reason||'Bản sao lưu').slice(0,40),createdAt:Number(v.createdAt)||Date.now()});
            });
            nextHistory[d.id]=[...merged.values()].sort((a,b)=>(Number(a.createdAt)||0)-(Number(b.createdAt)||0)).slice(-HISTORY_PER_DOCUMENT);
          });
        }
        const allowedHistoryIds=new Set(nextDocs.map(d=>d.id));
        Object.keys(nextHistory).forEach(id=>{if(!allowedHistoryIds.has(id)||!Array.isArray(nextHistory[id]))delete nextHistory[id];else nextHistory[id]=nextHistory[id].slice(-HISTORY_PER_DOCUMENT);});
        let historyEntries=Object.entries(nextHistory).flatMap(([id,list])=>list.map(v=>({id,v}))).sort((a,b)=>(Number(a.v.createdAt)||0)-(Number(b.v.createdAt)||0));
        let historyChars=historyEntries.reduce((n,x)=>n+String(x.v.html||'').length+String(x.v.design?JSON.stringify(x.v.design):'').length,0);
        while(historyChars>HISTORY_TOTAL_CHARS&&historyEntries.length){const oldest=historyEntries.shift();historyChars-=String(oldest.v.html||'').length+String(oldest.v.design?JSON.stringify(oldest.v.design):'').length;const list=nextHistory[oldest.id]||[];const at=list.findIndex(v=>v.versionId===oldest.v.versionId);if(at>=0)list.splice(at,1);if(!list.length)delete nextHistory[oldest.id];}
        const activeFromBackup=imported.find(d=>d.id===data.activeId&&!d.deletedAt);
        const currentActive=nextDocs.find(d=>d.id===activeId&&!d.deletedAt);
        let preferred=mode==='replace'?(activeFromBackup||nextDocs.find(d=>!d.deletedAt)):(activeFromBackup||currentActive||nextDocs.find(d=>!d.deletedAt));
        if(!preferred){preferred={id:makeId(),title:'Tài liệu mới',html:'<h1>Tài liệu mới</h1><p><br></p>',createdAt:Date.now(),updatedAt:Date.now(),folder:'Chưa phân loại',category:'Khác',pinned:false};nextDocs.push(preferred);}
        const oldValues={[STORE]:localStorage.getItem(STORE),[FOLDERS_STORE]:localStorage.getItem(FOLDERS_STORE),[HISTORY_STORE]:localStorage.getItem(HISTORY_STORE),[PRINT_STORE]:localStorage.getItem(PRINT_STORE),'haidat-writer-page-settings':localStorage.getItem('haidat-writer-page-settings')};
        try{
          localStorage.setItem(STORE,JSON.stringify(nextDocs));
          localStorage.setItem(FOLDERS_STORE,JSON.stringify(cleanFolders));
          localStorage.setItem(HISTORY_STORE,JSON.stringify(nextHistory));
          if(mode==='replace'&&data.printSettings&&typeof data.printSettings==='object')localStorage.setItem(PRINT_STORE,JSON.stringify({header:String(data.printSettings.header||'').slice(0,120),footer:String(data.printSettings.footer||'').slice(0,120),numbers:data.printSettings.numbers!==false}));
          if(mode==='replace'&&data.pageSettings&&typeof data.pageSettings==='object')localStorage.setItem('haidat-writer-page-settings',JSON.stringify({paper:['A4','A5','Letter'].includes(data.pageSettings.paper)?data.pageSettings.paper:'A4',margin:Math.max(5,Math.min(50,Number(data.pageSettings.margin)||20))}));
        }catch(storageError){
          Object.entries(oldValues).forEach(([key,value])=>{try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}catch{}});
          throw new Error('Bộ nhớ thiết bị không đủ. Dữ liệu trước khi khôi phục đã được giữ nguyên.');
        }
        documents=nextDocs;folders=cleanFolders;versionHistory=nextHistory;activeId=preferred.id;
        loadDoc(activeId);renderFolderControls();loadPrintSettings();
        const ps=JSON.parse(localStorage.getItem('haidat-writer-page-settings')||'{}');$('#paperSize').value=ps.paper||'A4';$('#pageMargin').value=ps.margin||20;applyPageSettings();
        setState(mode==='merge'?'Đã hợp nhất bản sao lưu':'Đã thay thế bằng bản sao lưu','saved');
        alert((mode==='merge'?'Hợp nhất':'Khôi phục')+' thành công. Có '+nextDocs.length+' tài liệu trong Writer.\nID tài liệu được giữ nguyên; bản trùng ID ưu tiên phiên bản cập nhật mới hơn.');
      }catch(err){alert('Không thể khôi phục: '+err.message);}
    };
    reader.readAsText(file);
  }
  function checkDataHealth(){
    if(dirty)persist(false);
    const ids=new Set(),duplicates=[],invalid=[],live=documents.filter(d=>!d.deletedAt),trashed=documents.length-live.length;
    documents.forEach((d,i)=>{
      if(!d||typeof d!=='object'){invalid.push('Bản ghi '+(i+1));return;}
      if(typeof d.id!=='string'||!d.id.trim())invalid.push('Tài liệu thiếu ID ở vị trí '+(i+1));
      else if(ids.has(d.id))duplicates.push(d.id);else ids.add(d.id);
      if(typeof d.html!=='string')invalid.push((d.title||d.id||'Tài liệu')+' · nội dung không hợp lệ');
    });
    let storageBytes=0,storageReadable=true;
    try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i)||'',v=localStorage.getItem(k)||'';storageBytes+=(k.length+v.length)*2;}}catch{storageReadable=false;}
    const historyEntries=Object.values(versionHistory).flatMap(x=>Array.isArray(x)?x:[]);
    const historyChars=historyEntries.reduce((n,v)=>n+String(v.html||'').length,0);
    const fmt=n=>n<1024?(n+' B'):(n<1024*1024?(n/1024).toFixed(1)+' KB':(n/1024/1024).toFixed(2)+' MB');
    const problems=duplicates.length+invalid.length;
    const report=[
      'KIỂM TRA KHO DỮ LIỆU HAI ĐẤT WRITER V3.0',
      'Thời điểm: '+new Date().toLocaleString('vi-VN'),
      'Tài liệu đang hoạt động: '+live.length,
      'Tài liệu trong thùng rác: '+trashed,
      'ID trùng: '+(duplicates.length?duplicates.join(', '):'Không phát hiện'),
      'Bản ghi bất thường: '+(invalid.length?invalid.join('; '):'Không phát hiện'),
      'Mốc lịch sử: '+historyEntries.length+' · '+fmt(historyChars*2)+' ước tính',
      'Dung lượng localStorage: '+(storageReadable?fmt(storageBytes)+' ước tính':'Không đọc được'),
      'Lưu ý: dung lượng ước tính theo UTF-16; giới hạn thực tế tùy trình duyệt và thiết bị.'
    ].join('\n');
    const status=$('#dataHealthStatus');
    status.textContent=(problems?'Cần xem lại '+problems+' vấn đề':'Kho dữ liệu không phát hiện lỗi cấu trúc')+' · '+live.length+' tài liệu · '+fmt(storageBytes);
    status.dataset.state=problems?'error':'saved';
    alert(report);
    return {problems,storageBytes,live:live.length,trashed};
  }
  $('#backupExport').onclick=exportBackup;
  $('#checkDataHealth').onclick=checkDataHealth;
  $('#cloneDoc').onclick=cloneCurrentDocument;
  $('#backupImport').onclick=()=>$('#backupFile').click();
  $('#backupFile').onchange=e=>{importBackup(e.target.files[0]);e.target.value='';};
  ['headerText','footerText','showPageNumbers'].forEach(id=>$('#'+id).addEventListener('change',applyPrintSettings));
  $('#headerText').addEventListener('input',applyPrintSettings);
  $('#footerText').addEventListener('input',applyPrintSettings);
  loadPrintSettings();


  $('#exportDocx').onclick=exportDocx;
  $('#paperSize').onchange=applyPageSettings;$('#pageMargin').onchange=applyPageSettings;
  $('#insertPageBreak').onclick=()=>command('insertHTML','<div class="page-break"></div><p><br></p>');
  $('#insertSectionBreak').onclick=()=>command('insertHTML','<div class="section-break"></div><p><br></p>');
  try{const ps=JSON.parse(localStorage.getItem('haidat-writer-page-settings')||'null');if(ps){$('#paperSize').value=ps.paper||'A4';$('#pageMargin').value=ps.margin||20;}}catch{}
  applyPageSettings();
  updateStats();
  // Ribbon tabs: switch panels without changing editor content or save state.
  const ribbonEl=document.querySelector('.ribbon'),ribbonCollapseBtn=$('#toggleRibbon');
  function setRibbonCollapsed(collapsed){
    if(!ribbonEl)return;
    ribbonEl.classList.toggle('is-collapsed',collapsed);
    if(ribbonCollapseBtn){ribbonCollapseBtn.textContent=collapsed?'⌄':'⌃';ribbonCollapseBtn.setAttribute('aria-expanded',String(!collapsed));}
  }
  if(ribbonCollapseBtn)ribbonCollapseBtn.addEventListener('click',()=>setRibbonCollapsed(!ribbonEl.classList.contains('is-collapsed')));
  document.querySelectorAll('.ribbon-tab').forEach(tab=>tab.addEventListener('click',()=>{
    const wasActive=tab.classList.contains('active');
    const mobile=window.matchMedia('(max-width:700px)').matches;
    const collapse=mobile&&wasActive&&!!document.querySelector('.ribbon-panel:not([hidden])');
    if(!collapse)setRibbonCollapsed(false);
    document.querySelectorAll('.ribbon-tab').forEach(t=>{
      const active=t===tab&&!collapse;
      t.classList.toggle('active',active);
      t.setAttribute('aria-selected',String(active));
      t.setAttribute('aria-expanded',String(active));
    });
    document.querySelectorAll('.ribbon-panel').forEach(panel=>{
      const active=!collapse&&panel.id==='panel-'+tab.dataset.tab;
      panel.hidden=!active;
      panel.classList.toggle('active',active);
    });
    if(mobile&&!collapse)tab.scrollIntoView({behavior:'smooth',block:'nearest',inline:'nearest'});
  }));
  // Ensure the Home writing tab is active on initial load without collapsing on phones.
  const homeTab=document.querySelector('.ribbon-tab[data-tab="home"]');
  if(homeTab&&!homeTab.classList.contains('active'))homeTab.click();
  document.querySelectorAll('.file-subtab').forEach(btn=>btn.addEventListener('click',()=>{
    const key=btn.dataset.fileTab;
    document.querySelectorAll('.file-subtab').forEach(b=>b.classList.toggle('active',b===btn));
    document.querySelectorAll('.file-subpanel').forEach(p=>{p.hidden=p.dataset.filePanel!==key;});
  }));
  const findPop=$('#writerFindPopover'),findToggle=$('#toggleWriterFind'),findClose=$('#closeWriterFind');
  if(findToggle&&findPop)findToggle.addEventListener('click',()=>{
    findPop.hidden=!findPop.hidden;
    findToggle.setAttribute('aria-pressed',String(!findPop.hidden));
    if(!findPop.hidden){$('#findText')?.focus();$('#findText')?.select();}
  });
  if(findClose&&findPop)findClose.addEventListener('click',()=>{
    findPop.hidden=true;
    findToggle?.setAttribute('aria-pressed','false');
    editor.focus();
  });
  // Keep the existing page controls and statistics in their corresponding ribbon tabs.
  const pagePanel=$('#pageSetupRibbon'), side=$('.sidepanel');
  if(pagePanel&&side){const labels=[...side.querySelectorAll('.setting')];labels.forEach(label=>pagePanel.append(label));const pageBreak=$('#insertPageBreak');if(pageBreak)pagePanel.append(pageBreak);}
  const syncRibbonStats=()=>{[['wordCount','ribbonWordCount'],['charCount','ribbonCharCount'],['paraCount','ribbonParaCount']].forEach(([a,b])=>{const x=$('#'+a),y=$('#'+b);if(x&&y)y.textContent=x.textContent;});};
  const statsObserver=new MutationObserver(syncRibbonStats);
  ['wordCount','charCount','paraCount'].forEach(id=>{const el=$('#'+id);if(el)statsObserver.observe(el,{childList:true,characterData:true,subtree:true});});
  syncRibbonStats();
  ['openFile','openDocx'].forEach(id=>{const input=$('#'+id);if(input){input.classList.add('ribbon-file-input');document.body.append(input);}});
  document.querySelectorAll('[data-proxy]').forEach(btn=>btn.addEventListener('click',()=>{
    const target=$('#'+btn.dataset.proxy);if(target)target.click();
  }));

  // Outline sidebar controls
  const toggleOutlineFn=()=>setOutlineOpen($('#outlinePane')?.hidden);
  $('#toggleOutline').addEventListener('click',toggleOutlineFn);
  $('#toggleOutlineView').addEventListener('click',toggleOutlineFn);
  $('#closeOutline').addEventListener('click',()=>setOutlineOpen(false));
  const savedOutline=(()=>{try{return localStorage.getItem('haidat-writer-outline-open-v1');}catch{return null;}})();
  if(savedOutline==='true'&&window.matchMedia('(min-width:961px)').matches)setOutlineOpen(true);

  // Format Painter
  $('#formatPainter').addEventListener('click',()=>{
    if(copiedFormat){setFormatPainter(null);setState('Đã tắt sao chép định dạng','');return;}
    restoreEditorSelection();
    const sel=window.getSelection();
    let el=sel&&sel.rangeCount?sel.anchorNode:null;
    if(!el||!editor.contains(el)){alert('Hãy đặt con trỏ vào đoạn chữ mẫu trước khi bấm Sao chép định dạng.');return;}
    if(el.nodeType!==Node.ELEMENT_NODE)el=el.parentElement;
    const cs=getComputedStyle(el);
    setFormatPainter({
      fontFamily:String(cs.fontFamily||'').split(',')[0].replace(/["']/g,'').trim(),
      color:cssRgbToHex(cs.color),
      bg:cs.backgroundColor&&!/rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)|transparent/i.test(cs.backgroundColor)?cssRgbToHex(cs.backgroundColor):'transparent',
      bold:Boolean(document.queryCommandState('bold')),
      italic:Boolean(document.queryCommandState('italic')),
      underline:Boolean(document.queryCommandState('underline'))
    });
    setState('Đã chép định dạng · quét chọn chữ đích để áp dụng (Esc để hủy)','pending');
  });

  // Insert & Table editing tools
  $('#insertHr').addEventListener('click',()=>command('insertHTML','<hr><p><br></p>'));
  $('#insertDate').addEventListener('click',()=>{
    const now=new Date().toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
    command('insertText',now);
  });
  $('#insertCallout').addEventListener('click',()=>command('insertHTML','<div class="hd-callout"><strong>Ghi chú:</strong> Nhập nội dung nổi bật tại đây…</div><p><br></p>'));
  $('#insertSymbol').addEventListener('click',()=>{const sym=$('#insertSymbolSelect')?.value;if(sym)command('insertText',sym);});
  $('#tableAddRowAbove').addEventListener('click',()=>editTable('addRowAbove'));
  $('#tableAddRowBelow').addEventListener('click',()=>editTable('addRowBelow'));
  $('#tableAddColLeft').addEventListener('click',()=>editTable('addColLeft'));
  $('#tableAddColRight').addEventListener('click',()=>editTable('addColRight'));
  $('#tableDelRow').addEventListener('click',()=>editTable('delRow'));
  $('#tableDelCol').addEventListener('click',()=>editTable('delCol'));
  $('#tableDelTable').addEventListener('click',()=>editTable('delTable'));

  // Keyboard shortcuts modal
  const shortcutsDlg=$('#shortcutsDialog');
  $('#openShortcuts').addEventListener('click',()=>{if(shortcutsDlg?.showModal)shortcutsDlg.showModal();else shortcutsDlg?.setAttribute('open','');});
  $('#closeShortcuts').addEventListener('click',()=>shortcutsDlg?.close?shortcutsDlg.close():shortcutsDlg?.removeAttribute('open'));
  shortcutsDlg?.addEventListener('click',e=>{if(e.target===shortcutsDlg)(shortcutsDlg.close?shortcutsDlg.close():shortcutsDlg.removeAttribute('open'));});

  // V7.2 — Interactive Horizontal Page Ruler
  const rulerEl=$('#pageRuler'),rulerL=$('#rulerMarginLeft'),rulerR=$('#rulerMarginRight'),rulerBtn=$('#toggleRuler');
  function renderRuler(){
    const el=$('#pageRuler'),ticks=$('#rulerTicks'),mL=$('#rulerMarginLeft'),mR=$('#rulerMarginRight');
    if(!el||!ticks)return;
    const widths={A4:210,A5:148,Letter:216},paperMm=widths[$('#paperSize')?.value]||210;
    const marginMm=Math.max(5,Math.min(50,Number($('#pageMargin')?.value)||20));
    const zoomFactor=(Number($('#editorZoom')?.value)||100)/100;
    const pxW=Math.round(paperMm*96/25.4*zoomFactor);
    el.style.width='min(100%,'+pxW+'px)';
    const pct=(marginMm/paperMm*100).toFixed(2)+'%';
    if(mL)mL.style.width=pct;
    if(mR)mR.style.width=pct;
    ticks.replaceChildren();
    for(let mm=5;mm<paperMm;mm+=5){
      const left=(mm/paperMm*100).toFixed(3)+'%';
      const isCm=mm%10===0;
      const t=document.createElement('span');
      t.className='ruler-tick '+(isCm?'major':'minor');
      t.style.left=left;
      ticks.append(t);
      if(isCm&&mm<paperMm-5){
        const n=document.createElement('span');
        n.className='ruler-num';n.style.left=left;n.textContent=String(mm/10);
        ticks.append(n);
      }
    }
  }
  function setRulerVisible(show){
    const el=$('#pageRuler'),btn=$('#toggleRuler');
    if(!el)return;
    el.hidden=!show;
    if(btn)btn.setAttribute('aria-pressed',String(show));
    try{localStorage.setItem('haidat-writer-ruler-visible-v1',String(show));}catch{}
    if(show)renderRuler();
  }
  if(rulerBtn)rulerBtn.addEventListener('click',()=>setRulerVisible(rulerEl.hidden));
  setRulerVisible((()=>{try{return localStorage.getItem('haidat-writer-ruler-visible-v1')!=='false';}catch{return true;}})());
  let rulerDrag=null;
  [rulerL,rulerR].forEach((handle,side)=>{
    if(!handle)return;
    handle.addEventListener('pointerdown',e=>{
      e.preventDefault();
      handle.setPointerCapture?.(e.pointerId);
      const widths={A4:210,A5:148,Letter:216},paperMm=widths[$('#paperSize')?.value]||210;
      rulerDrag={side,startX:e.clientX,startMargin:Number($('#pageMargin')?.value)||20,paperMm,rulerW:rulerEl.getBoundingClientRect().width||794};
    });
  });
  document.addEventListener('pointermove',e=>{
    if(!rulerDrag)return;
    const dx=e.clientX-rulerDrag.startX;
    const deltaMm=(dx/rulerDrag.rulerW)*rulerDrag.paperMm*(rulerDrag.side===0?1:-1);
    const next=Math.max(5,Math.min(50,Math.round(rulerDrag.startMargin+deltaMm)));
    if(Number($('#pageMargin').value)!==next){$('#pageMargin').value=String(next);applyPageSettings();}
  });
  document.addEventListener('pointerup',()=>{if(rulerDrag){rulerDrag=null;setState('Đã chỉnh lề trang: '+$('#pageMargin').value+' mm','saved');}});

  // V7.2 — Interactive Image Resizer, Alignment & Drag-and-Drop
  var selectedImage=null,imgDrag=null;
  const imgHandle=$('#imgResizeHandle'),imgSlider=$('#imgWidthSlider'),imgLabel=$('#imgWidthLabel');
  function positionImageHandle(){
    const h=$('#imgResizeHandle'),st=$('#pageStage');
    if(!h||!st)return;
    if(!selectedImage||!editor.contains(selectedImage)){h.hidden=true;return;}
    const stRect=st.getBoundingClientRect(),imRect=selectedImage.getBoundingClientRect();
    h.hidden=false;
    h.style.left=Math.round(imRect.right-stRect.left-7)+'px';
    h.style.top=Math.round(imRect.bottom-stRect.top-7)+'px';
  }
  function syncImageSlider(){
    const sl=$('#imgWidthSlider'),lb=$('#imgWidthLabel');
    if(!selectedImage||!sl)return;
    const edW=Math.max(100,editor.clientWidth-60);
    const pct=Math.max(15,Math.min(100,Math.round((selectedImage.getBoundingClientRect().width/edW)*100)));
    sl.value=String(pct);
    if(lb)lb.textContent=pct+'%';
  }
  function selectImage(img){
    const bar=$('#imageContextBar'),h=$('#imgResizeHandle');
    if(selectedImage&&selectedImage!==img)selectedImage.classList.remove('hd-img-selected');
    selectedImage=img&&editor.contains(img)?img:null;
    if(selectedImage){
      selectedImage.classList.add('hd-img-selected');
      if(bar)bar.hidden=false;
      syncImageSlider();positionImageHandle();
    }else{
      if(bar)bar.hidden=true;
      if(h)h.hidden=true;
    }
  }
  function setImageWidthPct(pct){
    const sl=$('#imgWidthSlider'),lb=$('#imgWidthLabel');
    if(!selectedImage)return;
    const p=Math.max(15,Math.min(100,Math.round(Number(pct)||100)));
    selectedImage.style.width=p+'%';selectedImage.style.height='auto';
    if(sl)sl.value=String(p);
    if(lb)lb.textContent=p+'%';
    positionImageHandle();scheduleSave();
  }
  editor.addEventListener('click',e=>{
    const im=e.target.closest('img');
    if(im&&editor.contains(im)){selectImage(im);return;}
    if(selectedImage)selectImage(null);
    const mark=e.target.closest('.hd-comment-mark');
    if(mark&&editor.contains(mark)){
      const cid=mark.getAttribute('data-comment-id');
      if(cid){setCommentsOpen(true);highlightCommentCard(cid);}
    }
  });
  document.addEventListener('click',e=>{
    if(selectedImage&&!e.target.closest('#editor,#imageContextBar,#imgResizeHandle'))selectImage(null);
  });
  document.querySelectorAll('[data-img-pct]').forEach(btn=>btn.addEventListener('click',()=>setImageWidthPct(btn.dataset.imgPct)));
  imgSlider?.addEventListener('input',()=>setImageWidthPct(imgSlider.value));
  $('#imgAlignLeft')?.addEventListener('click',()=>{if(!selectedImage)return;selectedImage.style.display='block';selectedImage.style.marginLeft='0';selectedImage.style.marginRight='auto';positionImageHandle();scheduleSave();});
  $('#imgAlignCenter')?.addEventListener('click',()=>{if(!selectedImage)return;selectedImage.style.display='block';selectedImage.style.marginLeft='auto';selectedImage.style.marginRight='auto';positionImageHandle();scheduleSave();});
  $('#imgAlignRight')?.addEventListener('click',()=>{if(!selectedImage)return;selectedImage.style.display='block';selectedImage.style.marginLeft='auto';selectedImage.style.marginRight='0';positionImageHandle();scheduleSave();});
  $('#imgDelete')?.addEventListener('click',()=>{if(!selectedImage)return;const im=selectedImage;selectImage(null);im.remove();scheduleSave();setState('Đã xóa ảnh','saved');});
  imgHandle?.addEventListener('pointerdown',e=>{
    if(!selectedImage)return;
    e.preventDefault();e.stopPropagation();
    imgHandle.setPointerCapture?.(e.pointerId);
    imgDrag={startX:e.clientX,startW:selectedImage.getBoundingClientRect().width,maxW:Math.max(120,editor.clientWidth-60)};
  });
  document.addEventListener('pointermove',e=>{
    if(!imgDrag||!selectedImage)return;
    const nextW=Math.max(60,Math.min(imgDrag.maxW,imgDrag.startW+(e.clientX-imgDrag.startX)));
    const pct=Math.max(15,Math.min(100,Math.round(nextW/imgDrag.maxW*100)));
    selectedImage.style.width=pct+'%';selectedImage.style.height='auto';
    if(imgSlider)imgSlider.value=String(pct);
    if(imgLabel)imgLabel.textContent=pct+'%';
    positionImageHandle();
  });
  document.addEventListener('pointerup',()=>{if(imgDrag){imgDrag=null;scheduleSave();setState('Đã đổi kích thước ảnh','saved');}});
  window.addEventListener('resize',()=>{if(selectedImage)positionImageHandle();},{passive:true});

  // Drag & drop image files onto the page
  const pageWrapEl=$('#pageWrap');
  if(pageWrapEl){
    pageWrapEl.addEventListener('dragover',e=>{if(e.dataTransfer&&[...(e.dataTransfer.types||[])].includes('Files')){e.preventDefault();pageWrapEl.classList.add('is-drop-target');}});
    pageWrapEl.addEventListener('dragleave',()=>pageWrapEl.classList.remove('is-drop-target'));
    pageWrapEl.addEventListener('drop',e=>{
      pageWrapEl.classList.remove('is-drop-target');
      const f=[...(e.dataTransfer?.files||[])].find(x=>x.type.startsWith('image/'));
      if(f){e.preventDefault();addImage(f);}
    });
  }

  // V7.2 — Table Column Border Drag-Resize & Cell Background Shading
  let colResize=null;
  editor.addEventListener('pointermove',e=>{
    if(colResize)return;
    const cell=e.target.closest('td,th');
    if(cell&&editor.contains(cell)){
      const r=cell.getBoundingClientRect();
      editor.style.cursor=(r.right-e.clientX<=7&&e.clientX<=r.right+2)?'col-resize':'';
    }else if(editor.style.cursor==='col-resize')editor.style.cursor='';
  });
  editor.addEventListener('pointerdown',e=>{
    const cell=e.target.closest('td,th');
    if(!cell||!editor.contains(cell))return;
    const r=cell.getBoundingClientRect();
    if(r.right-e.clientX<=7&&e.clientX<=r.right+2){
      e.preventDefault();
      colResize={table:cell.closest('table'),colIndex:cell.cellIndex,startX:e.clientX,startW:r.width};
    }
  });
  document.addEventListener('pointermove',e=>{
    if(!colResize)return;
    const nextW=Math.max(48,Math.round(colResize.startW+(e.clientX-colResize.startX)));
    [...colResize.table.rows].forEach(row=>{const c=row.cells[colResize.colIndex];if(c)c.style.width=nextW+'px';});
  });
  document.addEventListener('pointerup',()=>{if(colResize){colResize=null;editor.style.cursor='';scheduleSave();setState('Đã đổi độ rộng cột bảng','saved');}});
  $('#tableCellBg')?.addEventListener('input',e=>{
    restoreEditorSelection();
    const cell=activeTableCell();if(!cell)return;
    cell.style.backgroundColor=e.target.value;scheduleSave();
  });
  $('#tableClearCellBg')?.addEventListener('click',()=>{
    restoreEditorSelection();
    const cell=activeTableCell();if(!cell)return;
    cell.style.backgroundColor='';scheduleSave();
  });

  // V7.2 — Margin Comments / Review Notes Panel
  function docComments(){const d=current();if(!d)return [];if(!Array.isArray(d.comments))d.comments=[];return d.comments;}
  function setCommentsOpen(open){
    const pane=$('#commentsPane'),ws=$('#workspace');
    if(!pane||!ws)return;
    pane.hidden=!open;
    ws.classList.toggle('has-comments',open);
    $('#toggleComments')?.setAttribute('aria-pressed',String(open));
    $('#toggleCommentsView')?.setAttribute('aria-pressed',String(open));
    if(open)renderComments();
  }
  function highlightCommentCard(cid){
    const card=document.querySelector('[data-comment-card="'+CSS.escape(cid)+'"]');
    if(card){card.scrollIntoView({behavior:'smooth',block:'nearest'});card.style.boxShadow='0 0 0 2px var(--brand)';setTimeout(()=>{card.style.boxShadow='';},1500);}
  }
  function renderComments(){
    const list=$('#commentsList'),empty=$('#commentsEmpty'),badge=$('#commentCountBadge');
    const items=docComments(),unresolved=items.filter(c=>!c.resolved).length;
    if(badge)badge.textContent=String(unresolved);
    if(!list)return;
    list.replaceChildren();
    if(empty)empty.hidden=items.length>0;
    items.slice().sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).forEach(c=>{
      const card=document.createElement('div');
      card.className='comment-card'+(c.resolved?' is-resolved':'');
      card.dataset.commentCard=c.id;
      const quote=document.createElement('div');
      quote.className='comment-quote';
      quote.textContent='“'+(c.quote||'Toàn văn bản')+'”';
      quote.title='Bấm để nhảy tới vị trí bình luận';
      quote.addEventListener('click',()=>{
        const mark=editor.querySelector('.hd-comment-mark[data-comment-id="'+CSS.escape(c.id)+'"]');
        if(mark){mark.scrollIntoView({behavior:'smooth',block:'center'});mark.classList.add('is-focused');setTimeout(()=>mark.classList.remove('is-focused'),1600);}
      });
      const body=document.createElement('div');body.className='comment-body';body.textContent=c.text;
      const meta=document.createElement('div');meta.className='comment-meta';
      const time=document.createElement('span');time.textContent=new Date(c.createdAt||Date.now()).toLocaleString('vi-VN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'});
      const acts=document.createElement('div');acts.className='comment-actions';
      const resBtn=document.createElement('button');resBtn.type='button';resBtn.textContent=c.resolved?'Mở lại':'✓ Xong';
      resBtn.addEventListener('click',()=>{c.resolved=!c.resolved;renderComments();scheduleSave();});
      const delBtn=document.createElement('button');delBtn.type='button';delBtn.className='danger';delBtn.textContent='Xóa';
      delBtn.addEventListener('click',()=>{
        const d=current();if(!d)return;
        d.comments=docComments().filter(x=>x.id!==c.id);
        editor.querySelectorAll('.hd-comment-mark[data-comment-id="'+CSS.escape(c.id)+'"]').forEach(sp=>{sp.replaceWith(...sp.childNodes);});
        renderComments();scheduleSave();
      });
      acts.append(resBtn,delBtn);meta.append(time,acts);
      card.append(quote,body,meta);list.append(card);
    });
  }
  function addComment(){
    restoreEditorSelection();
    const sel=window.getSelection();
    const selectedText=(sel&&sel.rangeCount&&editor.contains(sel.anchorNode))?sel.toString().trim():'';
    const text=prompt(selectedText?'Bình luận cho “'+selectedText.slice(0,60)+'”:':'Nhập nội dung bình luận cho tài liệu:');
    if(!text||!text.trim())return;
    const cid='hdc-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);
    if(selectedText&&sel&&sel.rangeCount&&!sel.isCollapsed&&editor.contains(sel.anchorNode)){
      try{
        const range=sel.getRangeAt(0),span=document.createElement('span');
        span.className='hd-comment-mark';span.setAttribute('data-comment-id',cid);
        range.surroundContents(span);
      }catch{
        command('insertHTML','<span class="hd-comment-mark" data-comment-id="'+cid+'">'+escapeHTML(selectedText)+'</span>');
      }
    }
    docComments().push({id:cid,quote:(selectedText||titleInput.value||'Tài liệu').slice(0,80),text:text.trim().slice(0,1000),createdAt:Date.now(),resolved:false});
    setCommentsOpen(true);renderComments();scheduleSave();setState('Đã thêm bình luận','saved');
  }
  $('#addComment')?.addEventListener('click',addComment);
  $('#addCommentFromPane')?.addEventListener('click',addComment);
  $('#toggleComments')?.addEventListener('click',()=>setCommentsOpen($('#commentsPane')?.hidden));
  $('#toggleCommentsView')?.addEventListener('click',()=>setCommentsOpen($('#commentsPane')?.hidden));
  $('#closeComments')?.addEventListener('click',()=>setCommentsOpen(false));
  renderComments();

  // V7.2 — Change Case (Word Shift+F3)
  let caseCycleIdx=0;
  function applyChangeCase(mode){
    restoreEditorSelection();
    const sel=window.getSelection();
    if(!sel||!sel.rangeCount||sel.isCollapsed||!editor.contains(sel.anchorNode)){alert('Hãy bôi đen đoạn chữ cần đổi hoa/thường trước.');return;}
    const raw=sel.toString();
    let next=raw;
    if(mode==='upper')next=raw.toLocaleUpperCase('vi');
    else if(mode==='lower')next=raw.toLocaleLowerCase('vi');
    else if(mode==='title')next=raw.toLocaleLowerCase('vi').replace(/(^|[\s([{"'–—-])([\p{L}])/gu,(m,p,c)=>p+c.toLocaleUpperCase('vi'));
    else if(mode==='sentence')next=raw.toLocaleLowerCase('vi').replace(/(^|[.!?…]\s+)([\p{L}])/gu,(m,p,c)=>p+c.toLocaleUpperCase('vi'));
    command('insertText',next);
  }
  function cycleChangeCase(){
    const modes=['upper','lower','title'];
    applyChangeCase(modes[caseCycleIdx%modes.length]);
    caseCycleIdx++;
  }
  $('#changeCase')?.addEventListener('change',e=>{
    const mode=e.target.value;e.target.value='';
    if(mode)applyChangeCase(mode);
  });

  renderRuler();
  syncToolbarState();
})();
