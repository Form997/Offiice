const DEFAULT_MAX_RESULTS = 10000;

function normalize(value, caseSensitive) {
  const text = String(value ?? "").normalize("NFC");
  return caseSensitive ? text : text.toLocaleLowerCase();
}

function matches(value, query, wholeCell, caseSensitive) {
  const candidate = normalize(value, caseSensitive);
  const needle = normalize(query, caseSensitive);
  return wholeCell ? candidate === needle : candidate.includes(needle);
}

function parseAddress(address) {
  const match = /^([A-Z]+)([1-9][0-9]*)$/i.exec(address);
  if (!match) return null;
  let column = 0;
  for (const char of match[1].toUpperCase()) column = column * 26 + char.charCodeAt(0) - 64;
  return { row: Number(match[2]), column };
}

export function searchCells(cells, query, options = {}) {
  const text = String(query ?? "");
  if (!text.length) return { matches: [], total: 0, truncated: false };
  const { caseSensitive = false, wholeCell = false, mode = "display", displayValue = (_address, value) => value, maxResults = DEFAULT_MAX_RESULTS, scope = null } = options;
  if (!["display", "raw", "both"].includes(mode)) throw new RangeError("Chế độ tìm kiếm không hợp lệ.");
  const limit = Number.isInteger(maxResults) && maxResults > 0 ? maxResults : DEFAULT_MAX_RESULTS;
  const matchesFound = [];
  let total = 0;
  const addresses = Object.keys(cells || {}).filter(address => { const point=parseAddress(address); return point && String(cells[address] ?? "") !== "" && (!scope || (point.row>=scope.startRow && point.row<=scope.endRow && point.column>=scope.startCol && point.column<=scope.endCol)); });
  addresses.sort((left, right) => {
    const a = parseAddress(left), b = parseAddress(right);
    return a.row - b.row || a.column - b.column;
  });
  for (const address of addresses) {
    const rawValue = String(cells[address] ?? "");
    const rawMatch = mode !== "display" && matches(rawValue, text, wholeCell, caseSensitive);
    let shownMatch = false;
    if (mode !== "raw") {
      let shown = rawValue;
      try { shown = displayValue(address, rawValue); } catch { shown = rawValue; }
      shownMatch = matches(shown, text, wholeCell, caseSensitive);
    }
    if (!rawMatch && !shownMatch) continue;
    total++;
    if (matchesFound.length < limit) {
      matchesFound.push({ address, matchedIn: rawMatch && shownMatch ? "both" : rawMatch ? "raw" : "display" });
    }
  }
  return { matches: matchesFound, total, truncated: total > matchesFound.length };
}

export function replaceCells(cells, query, replacement, options = {}) {
  const needle=String(query ?? ""), substitute=String(replacement ?? "");
  if(!needle.length) return {cells:{...(cells||{})},changed:0,addresses:[]};
  const {caseSensitive=false,wholeCell=false,scope=null,onlyAddress=null}=options;
  const next={...(cells||{})},addresses=[];
  const escaped=needle.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  const pattern=new RegExp(escaped,"giu");
  for(const address of Object.keys(next)){
    if(onlyAddress&&address!==onlyAddress)continue;
    const point=parseAddress(address);
    if(!point||String(next[address]??"")==="")continue;
    if(scope&&(point.row<scope.startRow||point.row>scope.endRow||point.column<scope.startCol||point.column>scope.endCol))continue;
    const raw=String(next[address]);
    const normalized=caseSensitive?raw:raw.toLocaleLowerCase();
    const target=caseSensitive?needle:needle.toLocaleLowerCase();
    if(wholeCell){
      if(normalized!==target)continue;
      if(raw!==substitute){next[address]=substitute;addresses.push(address);}
      continue;
    }
    if(!pattern.test(raw))continue;
    pattern.lastIndex=0;
    const updated=raw.replace(pattern,substitute);
    if(updated!==raw){next[address]=updated;addresses.push(address);}
  }
  return {cells:next,changed:addresses.length,addresses};
}
