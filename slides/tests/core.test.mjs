import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SLIDES,
  STORAGE_KEY,
  normalizeSlides,
  readSlides,
  writeSlides,
  escapeHtml,
  buildPresentationHtml
} from "../core.mjs";

test("normalizes missing, invalid, and empty slide collections", () => {
  assert.deepEqual(normalizeSlides(null), [...DEFAULT_SLIDES]);
  assert.deepEqual(normalizeSlides("invalid"), [...DEFAULT_SLIDES]);
  assert.deepEqual(normalizeSlides([null, 4, "x"]), [...DEFAULT_SLIDES]);
});

test("normalizes slide fields to strings and preserves valid entries", () => {
  assert.deepEqual(normalizeSlides([{ title: 4, body: null }, { title: "Tiêu đề", body: "Nội dung" }]), [
    { title: "", body: "" },
    { title: "Tiêu đề", body: "Nội dung" }
  ]);
});

test("reads saved slides and recovers from malformed JSON", () => {
  const storage = { getItem: () => '[{"title":"A","body":"B"}]' };
  assert.deepEqual(readSlides(storage), [{ title: "A", body: "B" }]);
  assert.deepEqual(readSlides({ getItem: () => "{" }), [...DEFAULT_SLIDES]);
  assert.deepEqual(readSlides({ getItem: () => { throw new Error("blocked"); } }), [...DEFAULT_SLIDES]);
});

test("writes valid JSON and reports storage failures", () => {
  let stored = "";
  const result = writeSlides({ setItem: (key, value) => { stored = key + ":" + value; } }, [{ title: "A", body: "B" }]);
  assert.equal(result.ok, true);
  assert.equal(stored.startsWith(STORAGE_KEY + ":"), true);
  assert.equal(writeSlides({ setItem: () => { throw new Error("quota"); } }, []).ok, false);
});

test("escapes HTML-sensitive characters", () => {
  assert.equal(escapeHtml('<>&"\''), "&lt;&gt;&amp;&quot;&#39;");
});

test("builds a navigable presentation document with escaped slide content", () => {
  const html = buildPresentationHtml([{ title: "<script>alert(1)</script>", body: "Dòng 1\nDòng 2" }]);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /Dòng 1<br>Dòng 2/);
  assert.match(html, /id="previous"/);
  assert.match(html, /id="next"/);
  assert.match(html, /addEventListener/);
  assert.match(html, /<\/script>/);
  assert.doesNotMatch(html, /<\\\/script>/);
});
