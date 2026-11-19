const MAX_ENTRIES = 40;
const MAX_BYTES = 32 * 1024 * 1024;
const PERSISTED_MAX_BYTES = 24 * 1024 * 1024;

export function serializeWorkbook(cells = {}, formats = {}) {
  return JSON.stringify({ cells: { ...cells }, formats: { ...formats } });
}

export function restoreWorkbook(snapshot) {
  const state = typeof snapshot === "string" ? JSON.parse(snapshot) : snapshot;
  if (!state || typeof state !== "object" || !state.cells || typeof state.cells !== "object") {
    throw new TypeError("Bản ghi lịch sử bảng tính không hợp lệ.");
  }
  return {
    cells: Object.assign(Object.create(null), state.cells),
    formats: Object.assign(Object.create(null), state.formats || {})
  };
}

export function pushHistoryEntry(stack, snapshot, { maxEntries = MAX_ENTRIES, maxBytes = MAX_BYTES } = {}) {
  if (!Array.isArray(stack) || typeof snapshot !== "string") throw new TypeError("Ngăn xếp lịch sử hoặc bản chụp không hợp lệ.");
  if (stack.at(-1) === snapshot) return false;
  stack.push(snapshot);
  let bytes = stack.reduce((sum, entry) => sum + entry.length * 2, 0);
  while (stack.length > 1 && (stack.length > maxEntries || bytes > maxBytes)) {
    bytes -= stack.shift().length * 2;
  }
  return true;
}

export function moveHistory(from, to, currentSnapshot) {
  if (!Array.isArray(from) || !Array.isArray(to)) throw new TypeError("Ngăn xếp lịch sử không hợp lệ.");
  if (!from.length) return null;
  pushHistoryEntry(to, currentSnapshot);
  return restoreWorkbook(from.pop());
}

export function trimHistoryStacks(undoStack, redoStack, { maxEntries = MAX_ENTRIES, maxBytes = PERSISTED_MAX_BYTES } = {}) {
  if (!Array.isArray(undoStack) || !Array.isArray(redoStack)) throw new TypeError("Ngăn xếp lịch sử không hợp lệ.");
  while (undoStack.length > maxEntries) undoStack.shift();
  while (redoStack.length > maxEntries) redoStack.shift();
  let bytes = [...undoStack, ...redoStack].reduce((sum, entry) => sum + String(entry).length * 2, 0);
  while (bytes > maxBytes && (undoStack.length > 1 || redoStack.length > 1)) {
    const target = undoStack.length >= redoStack.length && undoStack.length > 1 ? undoStack : redoStack;
    bytes -= String(target.shift()).length * 2;
  }
  return { undo: undoStack.length, redo: redoStack.length, bytes };
}
