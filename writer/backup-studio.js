(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.HD_BACKUP_STUDIO=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const ID_RE=/^HDW-\\d{8}-[A-Z0-9]{8}$/;
  function inspect(data,currentDocuments,mode){
    const errors=[],warnings=[],source=Array.isArray(data&&data.documents)?data.documents:[];
    if(!data||data.format!=='HAI-DAT-WRITER-BACKUP')errors.push('Không đúng định dạng HAI-DAT-WRITER-BACKUP.');
    if(![1,2,3,4,5].includes(Number(data&&data.version)))errors.push('Phiên bản backup không được hỗ trợ.');
    if(!source.length)errors.push('Bản sao lưu không có tài liệu.');
    const valid=source.filter(d=>d&&typeof d==='object'&&!Array.isArray(d)&&typeof d.html==='string');
    const skipped=source.length-valid.length;
    if(!valid.length)errors.push('Không tìm thấy bản ghi tài liệu hợp lệ có nội dung HTML.');
    if(source.length>10000)errors.push('Số lượng tài liệu vượt giới hạn an toàn 10.000 bản ghi.');
    const seen=new Set(),duplicates=[],invalidIds=[];
    valid.forEach((d,i)=>{
      const id=typeof d.id==='string'?d.id:'';
      if(!ID_RE.test(id))invalidIds.push('Bản ghi '+(i+1));
      if(id&&seen.has(id))duplicates.push(id);else if(id)seen.add(id);
      if(d.html.length>5*1024*1024)warnings.push('Tài liệu '+(d.title||id||i+1)+' có nội dung HTML trên 5 MB.');
    });
    if(skipped)warnings.push(skipped+' bản ghi không hợp lệ sẽ bị bỏ qua.');
    if(duplicates.length)warnings.push(duplicates.length+' ID bị trùng trong chính tệp backup; bản ghi trùng có thể được cấp ID mới.');
    if(invalidIds.length)warnings.push(invalidIds.length+' bản ghi có ID không đúng định dạng; hệ thống sẽ chuẩn hóa ID khi nhập.');
    const current=Array.isArray(currentDocuments)?currentDocuments:[];
    const currentById=new Map(current.filter(d=>d&&d.id).map(d=>[d.id,d]));
    let added=0,collisions=0,incomingNewer=0,keptCurrent=0;
    valid.forEach(d=>{
      const old=currentById.get(d.id);
      if(!old){added++;return;}
      collisions++;
      if((Number(d.updatedAt)||0)>=(Number(old.updatedAt)||0))incomingNewer++;
      else keptCurrent++;
    });
    if(mode==='replace'&&current.length)warnings.push('Chế độ thay thế sẽ thay toàn bộ '+current.length+' tài liệu đang có sau khi tạo bản sao an toàn.');
    if(mode==='merge'&&collisions)warnings.push(collisions+' ID đã tồn tại trên thiết bị; '+incomingNewer+' bản từ backup có ngày cập nhật mới hơn hoặc bằng, '+keptCurrent+' bản hiện tại sẽ được giữ.');
    const historyCount=valid.reduce((n,d)=>n+(data.versionHistory&&Array.isArray(data.versionHistory[d.id])?data.versionHistory[d.id].length:0),0);
    const designCount=valid.filter(d=>d.design&&typeof d.design==='object').length;
    const lines=[
      'KIỂM TRA TRƯỚC KHI KHÔI PHỤC',
      'Phiên bản backup: '+data.version,
      'Chế độ: '+(mode==='replace'?'Thay thế toàn bộ':'Hợp nhất, giữ tài liệu hiện có'),
      'Tài liệu đọc được: '+valid.length+'/'+source.length,
      'Tài liệu mới dự kiến: '+(mode==='merge'?added:valid.length),
      'ID trùng với kho hiện tại: '+collisions,
      'Mốc lịch sử nhận diện: '+historyCount,
      'Tài liệu có dữ liệu Canvas: '+designCount
    ];
    if(warnings.length)lines.push('CẢNH BÁO:',...warnings.map(x=>'• '+x));
    lines.push('Chưa có dữ liệu nào bị thay đổi. Tiếp tục nhập bản sao lưu?');
    return {ok:errors.length===0,errors,warnings,validCount:valid.length,sourceCount:source.length,skipped,duplicates:duplicates.length,invalidIds:invalidIds.length,collisions,added,incomingNewer,keptCurrent,historyCount,designCount,message:lines.join('\\n')};
  }
  return Object.freeze({inspect});
});
