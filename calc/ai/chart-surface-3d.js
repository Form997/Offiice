/** Xác thực lưới mặt đáp ứng để dựng phối cảnh 3D ngoại tuyến. */
export function buildSurface3DData(grid,{title="Mặt đáp ứng 3D"}={}){
 if(!Array.isArray(grid)||grid.length<2||grid.length>101||grid.some(r=>!Array.isArray(r)||r.length!==grid[0].length||r.length<2||r.length>101))throw new RangeError("Lưới 3D phải là ma trận chữ nhật từ 2×2 đến 101×101.");
 const rows=grid.map(row=>row.map(p=>({x:Number(p.x1??p.x),y:Number(p.x2??p.y),z:Number(p.predicted??p.z)})));
 if(rows.flat().some(p=>![p.x,p.y,p.z].every(Number.isFinite)))throw new TypeError("Lưới 3D có tọa độ không hữu hạn.");
 const x=[...new Set(rows.flat().map(p=>p.x))],y=[...new Set(rows.flat().map(p=>p.y))];
 if(x.length!==rows[0].length||y.length!==rows.length)throw new RangeError("Tọa độ X1/X2 của lưới 3D phải biến thiên đều theo hai chiều.");
 return {type:"surface3d",title:String(title),grid:rows,rows:rows.length,columns:rows[0].length,domain:{x:[Math.min(...x),Math.max(...x)],y:[Math.min(...y),Math.max(...y)],z:[Math.min(...rows.flat().map(p=>p.z)),Math.max(...rows.flat().map(p=>p.z))]},warning:"Bề mặt là dự báo từ mô hình mặt đáp ứng, không phải phép đo thực nghiệm tại mọi điểm trên lưới."};
}
export function projectSurface3D(data,{yaw=.75,pitch=.55,scale=1}={}){
 if(!data||data.type!=="surface3d")throw new TypeError("Cần dữ liệu mặt 3D đã xác thực.");
 const {grid,domain}=data,cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),zSpan=domain.z[1]-domain.z[0]||1;
 const project=p=>{const x=(p.x-domain.x[0])/(domain.x[1]-domain.x[0]||1)-.5,y=(p.y-domain.y[0])/(domain.y[1]-domain.y[0]||1)-.5,z=(p.z-domain.z[0])/zSpan-.5,rx=x*cy-y*sy,ry=x*sy+y*cy;return {x:rx*scale,y:(ry*cp-z*sp)*scale,z:ry*sp+z*cp,value:p.z};};
 const points=grid.map(row=>row.map(project)),facets=[];
 for(let r=0;r<grid.length-1;r++)for(let c=0;c<grid[0].length-1;c++){const quad=[points[r][c],points[r][c+1],points[r+1][c+1],points[r+1][c]];facets.push({points:quad,depth:quad.reduce((s,p)=>s+p.z,0)/4,value:quad.reduce((s,p)=>s+p.value,0)/4});}
 return facets.sort((a,b)=>a.depth-b.depth);
}
