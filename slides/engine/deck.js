/**
 * HAI ĐẤT SLIDES — Pure Presentation Deck Engine (Zero DOM dependency, 100% unit-testable)
 * Logical 16:9 coordinate space: 960 x 540
 */

export const SLIDE_WIDTH = 960;
export const SLIDE_HEIGHT = 540;

export const SLIDE_THEMES = Object.freeze({
  forest: {
    id: "forest",
    name: "Rừng Xanh HAI ĐẤT",
    bg: "#123b31",
    bgGradient: "linear-gradient(135deg, #10352c 0%, #1a4f40 100%)",
    titleColor: "#f3faf6",
    textColor: "#d9ece3",
    accent: "#6ee7b7",
    shapeBg: "rgba(255,255,255,0.12)",
    shapeBorder: "rgba(167,243,208,0.45)",
    tableBg: "rgba(255,255,255,0.08)",
    tableHeadBg: "rgba(110,231,183,0.22)",
    tableBorder: "rgba(217,236,227,0.28)",
  },
  light: {
    id: "light",
    name: "Sáng Tối Giản",
    bg: "#ffffff",
    bgGradient: "linear-gradient(180deg, #ffffff 0%, #f4f7f5 100%)",
    titleColor: "#14382e",
    textColor: "#2e4139",
    accent: "#1f6f54",
    shapeBg: "#e9f3ee",
    shapeBorder: "#9bc2b0",
    tableBg: "#ffffff",
    tableHeadBg: "#e3f0ea",
    tableBorder: "#c5d6cd",
  },
  midnight: {
    id: "midnight",
    name: "Đêm Công Nghệ",
    bg: "#0f172a",
    bgGradient: "linear-gradient(135deg, #0b1220 0%, #1e293b 100%)",
    titleColor: "#f8fafc",
    textColor: "#cbd5e1",
    accent: "#38bdf8",
    shapeBg: "rgba(56,189,248,0.12)",
    shapeBorder: "rgba(56,189,248,0.45)",
    tableBg: "rgba(255,255,255,0.05)",
    tableHeadBg: "rgba(56,189,248,0.2)",
    tableBorder: "rgba(148,163,184,0.3)",
  },
  sand: {
    id: "sand",
    name: "Cát Ấm Chuyên Nghiệp",
    bg: "#faf6ef",
    bgGradient: "linear-gradient(135deg, #fdfaf4 0%, #f2e8d9 100%)",
    titleColor: "#3b2716",
    textColor: "#57412e",
    accent: "#b45309",
    shapeBg: "#f3e4cd",
    shapeBorder: "#d4b083",
    tableBg: "#fffdf9",
    tableHeadBg: "#ecd7ba",
    tableBorder: "#d8c0a2",
  },
  ocean: {
    id: "ocean",
    name: "Xanh Đại Dương",
    bg: "#0c3554",
    bgGradient: "linear-gradient(135deg, #0b2d48 0%, #15557a 100%)",
    titleColor: "#f0f9ff",
    textColor: "#d3eaf8",
    accent: "#7dd3fc",
    shapeBg: "rgba(255,255,255,0.11)",
    shapeBorder: "rgba(125,211,252,0.45)",
    tableBg: "rgba(255,255,255,0.07)",
    tableHeadBg: "rgba(125,211,252,0.22)",
    tableBorder: "rgba(211,234,248,0.28)",
  },
  slate: {
    id: "slate",
    name: "Thuyết Trình Hiện Đại",
    bg: "#f8fafc",
    bgGradient: "linear-gradient(135deg, #ffffff 0%, #eef2f6 100%)",
    titleColor: "#0f172a",
    textColor: "#334155",
    accent: "#2563eb",
    shapeBg: "#e0ecff",
    shapeBorder: "#93c5fd",
    tableBg: "#ffffff",
    tableHeadBg: "#e2e8f0",
    tableBorder: "#cbd5e1",
  },
});

export const SLIDE_TRANSITIONS = Object.freeze(["none", "fade", "slide", "zoom"]);
export const SLIDE_LAYOUTS = Object.freeze(["title", "content", "two-column", "blank"]);

let _uidSeq = 0;
export function makeId(prefix = "el") {
  _uidSeq += 1;
  return `${prefix}_${Date.now().toString(36)}_${_uidSeq.toString(36)}`;
}

export function getTheme(themeId) {
  return SLIDE_THEMES[themeId] || SLIDE_THEMES.forest;
}

export function clamp(n, min, max) {
  const num = Number(n);
  if (!Number.isFinite(num)) return min;
  return Math.max(min, Math.min(max, num));
}

export function isSafeImageSrc(src) {
  if (typeof src !== "string") return false;
  const s = src.trim();
  return /^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,[a-z0-9+/=\s]+$/i.test(s);
}

export function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

export function createTextElement(opts = {}) {
  return {
    id: opts.id || makeId("txt"),
    type: "text",
    x: clamp(opts.x ?? 72, 0, SLIDE_WIDTH - 40),
    y: clamp(opts.y ?? 120, 0, SLIDE_HEIGHT - 30),
    w: clamp(opts.w ?? 420, 60, SLIDE_WIDTH),
    h: clamp(opts.h ?? 80, 32, SLIDE_HEIGHT),
    text: String(opts.text ?? "Nhấp đúp để nhập nội dung"),
    fontSize: clamp(opts.fontSize ?? 24, 12, 96),
    bold: Boolean(opts.bold),
    italic: Boolean(opts.italic),
    align: ["left", "center", "right"].includes(opts.align) ? opts.align : "left",
    color: typeof opts.color === "string" ? opts.color : "",
    bg: typeof opts.bg === "string" ? opts.bg : "transparent",
    role: opts.role || "body",
  };
}

export function createShapeElement(opts = {}) {
  const shapes = ["rect", "rounded", "circle", "pill", "line"];
  return {
    id: opts.id || makeId("shp"),
    type: "shape",
    shape: shapes.includes(opts.shape) ? opts.shape : "rounded",
    x: clamp(opts.x ?? 280, 0, SLIDE_WIDTH - 40),
    y: clamp(opts.y ?? 160, 0, SLIDE_HEIGHT - 20),
    w: clamp(opts.w ?? 260, 32, SLIDE_WIDTH),
    h: clamp(opts.h ?? 130, 8, SLIDE_HEIGHT),
    text: String(opts.text ?? ""),
    fontSize: clamp(opts.fontSize ?? 20, 12, 72),
    bold: Boolean(opts.bold),
    italic: Boolean(opts.italic),
    align: ["left", "center", "right"].includes(opts.align) ? opts.align : "center",
    color: typeof opts.color === "string" ? opts.color : "",
    bg: typeof opts.bg === "string" ? opts.bg : "",
    borderColor: typeof opts.borderColor === "string" ? opts.borderColor : "",
  };
}

export function createImageElement(src, opts = {}) {
  if (!isSafeImageSrc(src)) {
    throw new TypeError("Chỉ hỗ trợ ảnh cục bộ hợp lệ (PNG, JPG, WebP, GIF, SVG base64).");
  }
  return {
    id: opts.id || makeId("img"),
    type: "image",
    src: src.trim(),
    alt: String(opts.alt ?? "Hình ảnh"),
    x: clamp(opts.x ?? 260, 0, SLIDE_WIDTH - 40),
    y: clamp(opts.y ?? 110, 0, SLIDE_HEIGHT - 40),
    w: clamp(opts.w ?? 400, 48, SLIDE_WIDTH),
    h: clamp(opts.h ?? 260, 48, SLIDE_HEIGHT),
    radius: clamp(opts.radius ?? 10, 0, 80),
  };
}

export function createTableElement(opts = {}) {
  const rows = clamp(opts.rows ?? 3, 1, 10);
  const cols = clamp(opts.cols ?? 3, 1, 8);
  let data;
  if (Array.isArray(opts.data) && opts.data.length) {
    data = opts.data.slice(0, 10).map(r =>
      Array.isArray(r) ? r.slice(0, 8).map(v => String(v ?? "")) : [""]
    );
  } else {
    data = Array.from({ length: rows }, (_, ri) =>
      Array.from({ length: cols }, (_, ci) => (ri === 0 ? `Cột ${ci + 1}` : ""))
    );
  }
  return {
    id: opts.id || makeId("tbl"),
    type: "table",
    x: clamp(opts.x ?? 100, 0, SLIDE_WIDTH - 100),
    y: clamp(opts.y ?? 150, 0, SLIDE_HEIGHT - 60),
    w: clamp(opts.w ?? 760, 140, SLIDE_WIDTH),
    h: clamp(opts.h ?? 220, 72, SLIDE_HEIGHT),
    fontSize: clamp(opts.fontSize ?? 16, 11, 32),
    data,
  };
}

export function createSlide(layout = "content", opts = {}) {
  const id = opts.id || makeId("sld");
  const notes = String(opts.notes ?? "");
  const bg = typeof opts.bg === "string" ? opts.bg : "";

  if (layout === "blank") {
    return { id, layout: "blank", bg, notes, elements: [] };
  }
  if (layout === "title") {
    return {
      id,
      layout: "title",
      bg,
      notes,
      elements: [
        createShapeElement({
          shape: "line",
          x: 72,
          y: 162,
          w: 96,
          h: 6,
          bg: "",
        }),
        createTextElement({
          x: 72,
          y: 184,
          w: 816,
          h: 112,
          text: opts.title ?? "TIÊU ĐỀ BÀI TRÌNH CHIẾU",
          fontSize: 48,
          bold: true,
          align: "left",
          role: "title",
        }),
        createTextElement({
          x: 72,
          y: 306,
          w: 760,
          h: 96,
          text: opts.subtitle ?? "Phụ đề ngắn gọn · Nhấp đúp vào khối chữ để sửa trực tiếp",
          fontSize: 22,
          align: "left",
          role: "subtitle",
        }),
      ],
    };
  }
  if (layout === "two-column") {
    return {
      id,
      layout: "two-column",
      bg,
      notes,
      elements: [
        createTextElement({
          x: 60,
          y: 44,
          w: 840,
          h: 68,
          text: opts.title ?? "So sánh / Hai cột nội dung",
          fontSize: 34,
          bold: true,
          role: "title",
        }),
        createShapeElement({
          shape: "rounded",
          x: 60,
          y: 132,
          w: 405,
          h: 348,
          text: "",
        }),
        createTextElement({
          x: 82,
          y: 152,
          w: 360,
          h: 308,
          text: opts.leftBody ?? "• Ý chính cột trái 1\n• Ý chính cột trái 2\n• Số liệu minh họa",
          fontSize: 20,
          role: "body",
        }),
        createShapeElement({
          shape: "rounded",
          x: 495,
          y: 132,
          w: 405,
          h: 348,
          text: "",
        }),
        createTextElement({
          x: 517,
          y: 152,
          w: 360,
          h: 308,
          text: opts.rightBody ?? "• Ý chính cột phải 1\n• Ý chính cột phải 2\n• Kết luận ngắn gọn",
          fontSize: 20,
          role: "body",
        }),
      ],
    };
  }
  // Default: "content"
  return {
    id,
    layout: "content",
    bg,
    notes,
    elements: [
      createTextElement({
        x: 64,
        y: 46,
        w: 832,
        h: 70,
        text: opts.title ?? "Tiêu đề trang trình bày",
        fontSize: 34,
        bold: true,
        role: "title",
      }),
      createTextElement({
        x: 64,
        y: 132,
        w: 832,
        h: 344,
        text: opts.body ?? "• Ý trình bày thứ nhất\n• Ý trình bày thứ hai\n• Ý trình bày thứ ba",
        fontSize: 22,
        role: "body",
      }),
    ],
  };
}

export function createDefaultDeck() {
  return {
    version: 2,
    title: "Bài trình chiếu chưa đặt tên",
    theme: "forest",
    transition: "fade",
    slides: [
      createSlide("title", {
        title: "HAI ĐẤT SLIDES",
        subtitle: "Trình chiếu gọn nhẹ, chạy 100% cục bộ ngoại tuyến.\nNhấp đúp vào chữ để sửa · Kéo thả tự do · Nhấn F5 để trình chiếu.",
        notes: "Chào mừng khán giả. Giới thiệu tổng quan nội dung bài trình bày.",
      }),
      createSlide("two-column", {
        title: "Cấu trúc trình bày rõ ràng",
        leftBody: "• Thêm nhanh Chữ, Hình khối, Ảnh, Bảng\n• Kéo thả & đổi cỡ trực tiếp trên khung 16:9\n• Tự căn giữa với đường dẫn thông minh",
        rightBody: "• 6 chủ đề màu sắc đồng bộ\n• Trình chiếu toàn màn hình (F5)\n• Xuất HTML độc lập hoặc In / Lưu PDF",
        notes: "Nhấn mạnh điểm gọn nhẹ và không cần internet khi thuyết trình.",
      }),
    ],
  };
}

/**
 * Migrate legacy V1 array [{ title, body }, ...] from localStorage('haidat-slides') cleanly to V2 Deck.
 */
export function migrateLegacyV1Slides(legacyArray) {
  if (!Array.isArray(legacyArray) || !legacyArray.length) return createDefaultDeck();
  const slides = legacyArray.map((item, idx) => {
    const title = String(item?.title ?? `Slide ${idx + 1}`);
    const body = String(item?.body ?? "");
    if (idx === 0) {
      return createSlide("title", { title, subtitle: body || "Bài trình chiếu HAI ĐẤT OFFICE" });
    }
    return createSlide("content", { title, body });
  });
  return {
    version: 2,
    title: String(legacyArray[0]?.title || "Bài trình chiếu HAI ĐẤT").slice(0, 80),
    theme: "forest",
    transition: "fade",
    slides,
  };
}

function normalizeElement(el) {
  if (!el || typeof el !== "object") return null;
  if (el.type === "text") return createTextElement(el);
  if (el.type === "shape") return createShapeElement(el);
  if (el.type === "image") {
    if (!isSafeImageSrc(el.src)) return null;
    return createImageElement(el.src, el);
  }
  if (el.type === "table") return createTableElement(el);
  return null;
}

export function normalizeDeck(input) {
  if (!input || typeof input !== "object") return createDefaultDeck();
  if (Array.isArray(input)) return migrateLegacyV1Slides(input);
  const theme = SLIDE_THEMES[input.theme] ? input.theme : "forest";
  const transition = SLIDE_TRANSITIONS.includes(input.transition) ? input.transition : "fade";
  const title = String(input.title ?? "Bài trình chiếu chưa đặt tên").trim().slice(0, 120) || "Bài trình chiếu chưa đặt tên";
  const rawSlides = Array.isArray(input.slides) && input.slides.length ? input.slides : createDefaultDeck().slides;
  const slides = rawSlides.slice(0, 120).map(s => ({
    id: typeof s?.id === "string" && s.id ? s.id : makeId("sld"),
    layout: SLIDE_LAYOUTS.includes(s?.layout) ? s.layout : "content",
    bg: typeof s?.bg === "string" ? s.bg : "",
    notes: String(s?.notes ?? ""),
    elements: Array.isArray(s?.elements) ? s.elements.map(normalizeElement).filter(Boolean) : [],
  }));
  return { version: 2, title, theme, transition, slides };
}

export function cloneDeck(deck) {
  return JSON.parse(JSON.stringify(deck));
}

export function addSlideAfter(deck, index, layout = "content") {
  const next = cloneDeck(deck);
  if (next.slides.length >= 120) throw new RangeError("Tối đa 120 slide trong một bài trình chiếu.");
  const insertAt = clamp(index + 1, 0, next.slides.length);
  next.slides.splice(insertAt, 0, createSlide(layout));
  return { deck: next, activeIndex: insertAt };
}

export function duplicateSlideAt(deck, index) {
  const next = cloneDeck(deck);
  if (next.slides.length >= 120) throw new RangeError("Tối đa 120 slide trong một bài trình chiếu.");
  const src = next.slides[index];
  if (!src) return { deck: next, activeIndex: 0 };
  const copy = cloneDeck(src);
  copy.id = makeId("sld");
  copy.elements = copy.elements.map(el => ({ ...el, id: makeId(el.type.slice(0, 3)) }));
  next.slides.splice(index + 1, 0, copy);
  return { deck: next, activeIndex: index + 1 };
}

export function deleteSlideAt(deck, index) {
  const next = cloneDeck(deck);
  if (next.slides.length <= 1) return { deck: next, activeIndex: 0, deleted: false };
  next.slides.splice(index, 1);
  return { deck: next, activeIndex: Math.min(index, next.slides.length - 1), deleted: true };
}

export function moveSlide(deck, fromIndex, toIndex) {
  const next = cloneDeck(deck);
  const len = next.slides.length;
  if (fromIndex < 0 || fromIndex >= len || toIndex < 0 || toIndex >= len || fromIndex === toIndex) {
    return { deck: next, activeIndex: fromIndex, moved: false };
  }
  const [item] = next.slides.splice(fromIndex, 1);
  next.slides.splice(toIndex, 0, item);
  return { deck: next, activeIndex: toIndex, moved: true };
}

export function duplicateElementInSlide(slide, elementId) {
  const idx = slide.elements.findIndex(e => e.id === elementId);
  if (idx === -1) return null;
  const copy = JSON.parse(JSON.stringify(slide.elements[idx]));
  copy.id = makeId(copy.type.slice(0, 3));
  copy.x = clamp(copy.x + 24, 0, SLIDE_WIDTH - copy.w);
  copy.y = clamp(copy.y + 24, 0, SLIDE_HEIGHT - copy.h);
  slide.elements.push(copy);
  return copy;
}

export function reorderElementInSlide(slide, elementId, direction) {
  const idx = slide.elements.findIndex(e => e.id === elementId);
  if (idx === -1) return false;
  if (direction === "front" && idx < slide.elements.length - 1) {
    const [el] = slide.elements.splice(idx, 1);
    slide.elements.push(el);
    return true;
  }
  if (direction === "back" && idx > 0) {
    const [el] = slide.elements.splice(idx, 1);
    slide.elements.unshift(el);
    return true;
  }
  if (direction === "up" && idx < slide.elements.length - 1) {
    [slide.elements[idx], slide.elements[idx + 1]] = [slide.elements[idx + 1], slide.elements[idx]];
    return true;
  }
  if (direction === "down" && idx > 0) {
    [slide.elements[idx], slide.elements[idx - 1]] = [slide.elements[idx - 1], slide.elements[idx]];
    return true;
  }
  return false;
}

/**
 * Snap dragged element x/y gently to slide center lines (within threshold px).
 */
export function snapElementPosition(x, y, w, h, threshold = 8) {
  let nx = clamp(Math.round(x), 0, Math.max(0, SLIDE_WIDTH - w));
  let ny = clamp(Math.round(y), 0, Math.max(0, SLIDE_HEIGHT - h));
  let snapX = false;
  let snapY = false;
  const centerX = SLIDE_WIDTH / 2 - w / 2;
  const centerY = SLIDE_HEIGHT / 2 - h / 2;
  if (Math.abs(nx - centerX) <= threshold) { nx = Math.round(centerX); snapX = true; }
  if (Math.abs(ny - centerY) <= threshold) { ny = Math.round(centerY); snapY = true; }
  return { x: nx, y: ny, snapX, snapY };
}

export function pushDeckHistory(stack, deck, maxEntries = 40) {
  const snap = JSON.stringify(deck);
  if (stack.at(-1) === snap) return false;
  stack.push(snap);
  while (stack.length > maxEntries) stack.shift();
  return true;
}

export function moveDeckHistory(from, to, currentDeck) {
  if (!from.length) return null;
  pushDeckHistory(to, currentDeck);
  return normalizeDeck(JSON.parse(from.pop()));
}

export function getSlideLabel(slide, index) {
  const titleEl = slide.elements.find(e => e.type === "text" && e.role === "title" && e.text.trim())
    || slide.elements.find(e => e.type === "text" && e.text.trim());
  if (titleEl) {
    const firstLine = titleEl.text.split(/\r?\n/)[0].trim();
    if (firstLine) return firstLine.slice(0, 38);
  }
  return `Slide ${index + 1}`;
}

export function renderElementMarkup(el, theme) {
  const baseStyle = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.w}px;height:${el.h}px;box-sizing:border-box;`;
  if (el.type === "text") {
    const color = el.color || (el.role === "title" ? theme.titleColor : theme.textColor);
    const bg = el.bg && el.bg !== "transparent" ? `background:${escapeHtml(el.bg)};border-radius:8px;` : "";
    const weight = el.bold ? "700" : "400";
    const style = el.italic ? "italic" : "normal";
    const htmlText = escapeHtml(el.text).replace(/\n/g, "<br>");
    return `<div style="${baseStyle}${bg}padding:8px 12px;color:${escapeHtml(color)};font-size:${el.fontSize}px;font-weight:${weight};font-style:${style};text-align:${el.align};line-height:1.4;white-space:pre-wrap;word-break:break-word;overflow:hidden">${htmlText}</div>`;
  }
  if (el.type === "shape") {
    const fill = el.bg || (el.shape === "line" ? theme.accent : theme.shapeBg);
    const border = el.shape === "line" ? "none" : `2px solid ${el.borderColor || theme.shapeBorder}`;
    const radius = el.shape === "circle" ? "50%" : el.shape === "pill" ? "999px" : el.shape === "rounded" ? "14px" : el.shape === "line" ? "999px" : "2px";
    const color = el.color || theme.titleColor;
    const weight = el.bold ? "700" : "600";
    const style = el.italic ? "italic" : "normal";
    const textHtml = el.shape === "line" ? "" : escapeHtml(el.text).replace(/\n/g, "<br>");
    return `<div style="${baseStyle}background:${escapeHtml(fill)};border:${escapeHtml(border)};border-radius:${radius};display:flex;align-items:center;justify-content:${el.align === "left" ? "flex-start" : el.align === "right" ? "flex-end" : "center"};padding:${el.shape === "line" ? "0" : "10px 14px"};color:${escapeHtml(color)};font-size:${el.fontSize}px;font-weight:${weight};font-style:${style};text-align:${el.align};line-height:1.35;overflow:hidden">${textHtml}</div>`;
  }
  if (el.type === "image") {
    if (!isSafeImageSrc(el.src)) return "";
    return `<img src="${el.src}" alt="${escapeHtml(el.alt)}" style="${baseStyle}object-fit:contain;border-radius:${el.radius || 0}px">`;
  }
  if (el.type === "table") {
    const rowsHtml = el.data.map((row, ri) => {
      const cellsHtml = row.map(cell => {
        const tag = ri === 0 ? "th" : "td";
        const bg = ri === 0 ? theme.tableHeadBg : theme.tableBg;
        const color = ri === 0 ? theme.titleColor : theme.textColor;
        return `<${tag} style="border:1px solid ${escapeHtml(theme.tableBorder)};padding:6px 10px;background:${escapeHtml(bg)};color:${escapeHtml(color)};font-weight:${ri === 0 ? 700 : 400};text-align:left;vertical-align:middle">${escapeHtml(cell)}</${tag}>`;
      }).join("");
      return `<tr>${cellsHtml}</tr>`;
    }).join("");
    return `<div style="${baseStyle}overflow:hidden;border-radius:8px"><table style="width:100%;height:100%;border-collapse:collapse;table-layout:fixed;font-size:${el.fontSize}px">${rowsHtml}</table></div>`;
  }
  return "";
}

/**
 * Generate a 100% self-contained, offline standalone HTML presentation file (also print-to-PDF ready at 16:9).
 */
export function exportStandaloneHtml(deck) {
  const safeDeck = normalizeDeck(deck);
  const theme = getTheme(safeDeck.theme);
  const slidesHtml = safeDeck.slides.map((s, idx) => {
    const bgStyle = s.bg ? `background:${escapeHtml(s.bg)}` : `background:${theme.bgGradient}`;
    const els = s.elements.map(el => renderElementMarkup(el, theme)).join("");
    return `<section class="hd-slide${idx === 0 ? " active" : ""}" data-index="${idx}"><div class="hd-stage" style="${bgStyle}">${els}</div></section>`;
  }).join("\n");

  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(safeDeck.title)} — HAI ĐẤT SLIDES</title>
<style>
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#0b1116;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;overflow:hidden}
.hd-wrap{position:fixed;inset:0;display:grid;place-items:center}
.hd-slide{display:none;width:960px;height:540px;transform-origin:center center}
.hd-slide.active{display:block;animation:${safeDeck.transition === "fade" ? "hdFade .28s ease" : safeDeck.transition === "slide" ? "hdSlide .28s ease" : safeDeck.transition === "zoom" ? "hdZoom .28s ease" : "none"}}
.hd-stage{position:relative;width:960px;height:540px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.5)}
.hd-hud{position:fixed;bottom:14px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;background:rgba(15,23,28,.78);color:#e7f1ec;font-size:13px;backdrop-filter:blur(6px)}
.hd-hud button{border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.1);color:#fff;border-radius:999px;padding:4px 12px;cursor:pointer;font:inherit}
.hd-hud button:hover{background:rgba(255,255,255,.24)}
@keyframes hdFade{from{opacity:.2}to{opacity:1}}
@keyframes hdSlide{from{opacity:.3;translate:40px 0}to{opacity:1;translate:0 0}}
@keyframes hdZoom{from{opacity:.3;scale:.96}to{opacity:1;scale:1}}
@media print{
  @page{size:254mm 142.875mm;margin:0}
  html,body{overflow:visible;background:#fff}
  .hd-wrap{position:static;display:block}
  .hd-slide{display:block!important;transform:none!important;page-break-after:always;break-after:page}
  .hd-stage{box-shadow:none}
  .hd-hud{display:none!important}
}
</style>
</head>
<body>
<div class="hd-wrap">${slidesHtml}</div>
<div class="hd-hud"><button id="prevBtn">← Trước</button><span id="counter">1 / ${safeDeck.slides.length}</span><button id="nextBtn">Sau →</button></div>
<script>
const slides=[...document.querySelectorAll('.hd-slide')];let i=0;
function fit(){const s=Math.min(innerWidth/960,innerHeight/540);slides.forEach(el=>el.style.transform='scale('+s+')');}
function show(n){i=Math.max(0,Math.min(slides.length-1,n));slides.forEach((el,idx)=>el.classList.toggle('active',idx===i));document.getElementById('counter').textContent=(i+1)+' / '+slides.length;}
document.getElementById('prevBtn').onclick=()=>show(i-1);
document.getElementById('nextBtn').onclick=()=>show(i+1);
window.addEventListener('resize',fit);
window.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowDown'||e.key===' ')show(i+1);else if(e.key==='ArrowLeft'||e.key==='ArrowUp'||e.key==='Backspace')show(i-1);else if(e.key==='Home')show(0);else if(e.key==='End')show(slides.length-1);});
fit();show(0);
</script>
</body>
</html>`;
}
