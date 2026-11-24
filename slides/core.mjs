export const STORAGE_KEY = "haidat-slides";
export const DEFAULT_SLIDES = Object.freeze([
  { title: "HAI ĐẤT OFFICE", body: "Bài trình chiếu đầu tiên\nNhấn “Thêm slide” để tiếp tục." }
]);

export function normalizeSlides(value) {
  if (!Array.isArray(value)) return DEFAULT_SLIDES.map((slide) => ({ ...slide }));
  const valid = value
    .filter((slide) => slide && typeof slide === "object" && !Array.isArray(slide))
    .map((slide) => ({
      title: typeof slide.title === "string" ? slide.title : "",
      body: typeof slide.body === "string" ? slide.body : ""
    }));
  return valid.length ? valid : DEFAULT_SLIDES.map((slide) => ({ ...slide }));
}

export function readSlides(storage, key = STORAGE_KEY) {
  try {
    const raw = storage.getItem(key);
    return raw === null ? normalizeSlides(null) : normalizeSlides(JSON.parse(raw));
  } catch {
    return normalizeSlides(null);
  }
}

export function writeSlides(storage, slides, key = STORAGE_KEY) {
  try {
    storage.setItem(key, JSON.stringify(normalizeSlides(slides)));
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

export function buildPresentationHtml(input) {
  const slides = normalizeSlides(input);
  const sections = slides.map((slide, index) =>
    '<section class="slide" aria-label="Slide ' + (index + 1) + '">' +
      '<h1>' + escapeHtml(slide.title) + '</h1>' +
      '<div class="body">' + escapeHtml(slide.body).replace(/\r?\n/g, "<br>") + '</div>' +
    '</section>'
  ).join("");
  const script = [
    'const slides=[...document.querySelectorAll(".slide")];',
    'let current=0;',
    'function show(){slides.forEach((slide,index)=>{slide.hidden=index!==current;});',
    'document.getElementById("position").textContent=(current+1)+" / "+slides.length;}',
    'function move(step){current=Math.max(0,Math.min(slides.length-1,current+step));show();}',
    'document.getElementById("previous").addEventListener("click",()=>move(-1));',
    'document.getElementById("next").addEventListener("click",()=>move(1));',
    'document.addEventListener("keydown",event=>{if(event.key==="ArrowRight"||event.key===" "){event.preventDefault();move(1);}',
    'if(event.key==="ArrowLeft"){event.preventDefault();move(-1);}});',
    'show();'
  ].join("");
  return '<!doctype html><html lang="vi"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
    '<title>Trình chiếu HAI ĐẤT</title><style>' +
    '*{box-sizing:border-box}body{margin:0;background:#102c28;color:#fff;font:clamp(20px,3vw,38px)/1.55 system-ui}' +
    '.slide{min-height:100dvh;padding:8vw 9vw 100px}.slide h1{font-size:1.5em;line-height:1.15}' +
    '.body{white-space:normal;overflow-wrap:anywhere}nav{position:fixed;bottom:16px;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:12px}' +
    'button{font:inherit;font-size:16px;padding:10px 18px;border:0;border-radius:8px;cursor:pointer}#position{font-size:14px}' +
    '</style></head><body>' + sections +
    '<nav><button id="previous" type="button">← Trước</button><span id="position" aria-live="polite"></span>' +
    '<button id="next" type="button">Sau →</button></nav><scr' + 'ipt>' + script + '</scr' + 'ipt></body></html>';
}
