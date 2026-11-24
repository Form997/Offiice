import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
const css = await readFile(new URL("../style.css", import.meta.url), "utf8");

test("S2 editor markup exposes every control required by the application", () => {
  const ids = [...app.matchAll(/\$\("#([A-Za-z0-9_-]+)"\)/g)].map((match) => match[1]);
  for (const id of new Set(ids)) {
    assert.match(html, new RegExp('id="' + id + '"'), "Missing DOM element #" + id);
  }
});

test("live title edits update the active slide navigator label", () => {
  assert.match(app, /function updateActiveListLabel\(\)/);
  assert.match(app, /updateActiveListLabel\(\);/);
});

test("S2.1 supports keyboard save and page-hide persistence", () => {
  assert.match(app, /event\.metaKey/);
  assert.match(app, /event\.ctrlKey/);
  assert.match(app, /addEventListener\("pagehide"/);
});

test("mobile styles include safe areas, touch targets and horizontal slide navigation", () => {
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /min-height:44px/);
  assert.match(css, /scroll-snap-type:x proximity/);
});
