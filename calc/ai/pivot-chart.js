/** Deterministic data model for SGHT Pivot charts. */
export function buildPivotChartModel(pivot, { measureIndex = 0, limit = 24 } = {}) {
 if(!pivot||!Array.isArray(pivot.rows)||!Array.isArray(pivot.measures))throw new TypeError("Kết quả Pivot không hợp lệ.");
 if(!Number.isInteger(measureIndex)||measureIndex<0||measureIndex>=pivot.measures.length)throw new RangeError("Chỉ tiêu biểu đồ không tồn tại.");
 if(!Number.isInteger(limit)||limit<1||limit>100)throw new RangeError("Số nhóm biểu đồ phải từ 1 đến 100.");
 const measure=pivot.measures[measureIndex],columns=Array.isArray(pivot.columns)&&pivot.columns.length?pivot.columns:["Tổng"],rows=pivot.rows.slice(0,limit);
 const categories=rows.map(row=>row.labels.map(value=>String(value||"(Trống)")).join(" · "));
 const series=columns.map(column=>({name:String(column||"(Trống)"),values:rows.map(row=>{const metric=row.metrics?.[measureIndex],value=column==="Tổng"&&columns.length===1?metric?.total:metric?.values?.[column],number=Number(value??0);if(!Number.isFinite(number))throw new TypeError("Pivot chứa giá trị biểu đồ không hữu hạn.");return number;})}));
 return{title:measure.label||("Chỉ tiêu "+(measureIndex+1)),operation:measure.operation,categories,series,includedRows:pivot.includedRows,groupCount:pivot.rowCount,truncated:pivot.rows.length>rows.length};
}
