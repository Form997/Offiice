import {
  STORAGE_KEY,
  readSlides,
  writeSlides,
  normalizeSlides,
  buildPresentationHtml
} from "./core.mjs";

const $ = (selector) => document.querySelector(selector);
const storage = (() => {
  try {
    return window.localStorage;
  } catch {
    return {
      getItem() { throw new Error("Local storage is unavailable"); },
      setItem() { throw new Error("Local storage is unavailable"); }
    };
  }
})();
let slides = readSlides(storage, STORAGE_KEY);
let activeIndex = 0;
let installPrompt = null;

function setStatus(message) {
  $("#count").textContent = message;
}

function commitEditor() {
  const current = slides[activeIndex];
  if (!current) return;
  current.title = $("#heading").value;
  current.body = $("#body").value;
}

function persist(showMessage = false) {
  const result = writeSlides(storage, slides, STORAGE_KEY);
  if (!result.ok) {
    setStatus("Chưa lưu được · bộ nhớ thiết bị có thể đã đầy");
    if (showMessage) {
      window.alert("Không thể lưu bài trình chiếu trên thiết bị này. Hãy kiểm tra quyền lưu trữ và dung lượng còn trống.");
    }
    return false;
  }
  if (showMessage) {
    setStatus("Đã lưu · " + slides.length + " slide");
    window.alert("Đã lưu bài trình chiếu trên thiết bị này.");
  }
  return true;
}

function render() {
  slides = normalizeSlides(slides);
  activeIndex = Math.max(0, Math.min(activeIndex, slides.length - 1));
  const current = slides[activeIndex];
  $("#heading").value = current.title;
  $("#body").value = current.body;
  $("#list").replaceChildren();

  slides.forEach((slide, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = slide.title.trim() || "Slide " + (index + 1);
    button.setAttribute("aria-current", index === activeIndex ? "true" : "false");
    button.style.margin = "4px 0";
    button.addEventListener("click", () => {
      commitEditor();
      activeIndex = index;
      render();
      persist();
    });
    item.append(button);
    $("#list").append(item);
  });

  setStatus("Slide " + (activeIndex + 1) + "/" + slides.length);
  $("#prev").disabled = activeIndex === 0;
  $("#next").disabled = activeIndex === slides.length - 1;
}

function updateFromEditor() {
  commitEditor();
  if (persist()) setStatus("Slide " + (activeIndex + 1) + "/" + slides.length + " · đã tự lưu");
}

$("#heading").addEventListener("input", updateFromEditor);
$("#body").addEventListener("input", updateFromEditor);

$("#add").addEventListener("click", () => {
  commitEditor();
  slides.push({ title: "Slide mới", body: "" });
  activeIndex = slides.length - 1;
  render();
  persist();
  $("#heading").focus();
  $("#heading").select();
});

$("#prev").addEventListener("click", () => {
  commitEditor();
  activeIndex = Math.max(0, activeIndex - 1);
  render();
  persist();
});

$("#next").addEventListener("click", () => {
  commitEditor();
  activeIndex = Math.min(slides.length - 1, activeIndex + 1);
  render();
  persist();
});

$("#save").addEventListener("click", () => {
  commitEditor();
  persist(true);
});

$("#present").addEventListener("click", () => {
  commitEditor();
  persist();
  const presentation = window.open("", "_blank");
  if (!presentation) {
    window.alert("Trình duyệt đang chặn cửa sổ trình chiếu. Hãy cho phép mở cửa sổ bật lên rồi thử lại.");
    return;
  }
  presentation.document.open();
  presentation.document.write(buildPresentationHtml(slides));
  presentation.document.close();
});

$("#export").addEventListener("click", () => {
  commitEditor();
  persist();
  const blob = new Blob([buildPresentationHtml(slides)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "hai-dat-slides.html";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  $("#install").hidden = false;
});

$("#install").addEventListener("click", async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  $("#install").hidden = true;
});

render();

if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  navigator.serviceWorker.register("./sw.js").catch((error) => {
    console.warn("HAI ĐẤT SLIDES: không đăng ký được service worker.", error);
  });
}
