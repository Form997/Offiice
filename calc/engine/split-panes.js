export const SPLIT_MODES = Object.freeze(["none","horizontal","vertical","quadrant"]);
const clamp = (value,min,max,fallback) => Number.isFinite(Number(value)) ? Math.min(max,Math.max(min,Number(value))) : fallback;
const position = value => ({top:clamp(value?.top,0,Number.MAX_SAFE_INTEGER,0),left:clamp(value?.left,0,Number.MAX_SAFE_INTEGER,0)});
export function normalizeSplitSettings(value={}) {
 const mode=value&&SPLIT_MODES.includes(value.mode)?value.mode:"none";
 return {mode,ratio:clamp(value?.ratio,0.2,0.8,0.5),positions:{primary:position(value?.positions?.primary),secondary:position(value?.positions?.secondary)}};
}
export function synchronizedAxis(mode){if(mode==="horizontal")return "x";if(mode==="vertical")return "y";return null;}
export function splitViewportState(mode,primary,secondary){const normalized=normalizeSplitSettings({mode}).mode;const a=position(primary),b=position(secondary);if(normalized==="horizontal")b.left=a.left;if(normalized==="vertical")b.top=a.top;return {primary:a,secondary:b,synchronizedAxis:synchronizedAxis(normalized)};}
export function splitRatioFromPointer(mode,point,rect){if(!rect||!Number.isFinite(point))return 0.5;const extent=mode==="horizontal"?rect.height:rect.width;const offset=mode==="horizontal"?point-rect.top:point-rect.left;if(!(extent>0))return 0.5;return clamp(offset/extent,0.2,0.8,0.5);}

export const QUADRANT_PANES = Object.freeze(["topLeft","topRight","bottomLeft","bottomRight"]);
export function normalizeQuadrantPositions(value={}) {
 const out={};
 for(const key of QUADRANT_PANES) out[key]=position(value?.[key]);
 return out;
}
export function synchronizeQuadrantPositions(source,positions) {
 const p=normalizeQuadrantPositions(positions);
 if(source==="topLeft"){p.topRight.top=p.topLeft.top;p.bottomLeft.left=p.topLeft.left;}
 else if(source==="topRight")p.bottomRight.left=p.topRight.left;
 else if(source==="bottomLeft")p.bottomRight.top=p.bottomLeft.top;
 else if(source==="bottomRight"){p.topRight.left=p.bottomRight.left;p.bottomLeft.top=p.bottomRight.top;}
 return p;
}
export function quadrantScrollTargets(source) {
 return ({topLeft:["topRight","bottomLeft"],topRight:["bottomRight"],bottomLeft:["bottomRight"],bottomRight:["topRight","bottomLeft"]})[source]||[];
}
