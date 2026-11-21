import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { calculateAxisResizeAutoScrollDelta } from "../engine/axis-resize-autoscroll.js";

const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");

test("không tự cuộn khi con trỏ ở vùng giữa pane", () => {
  assert.equal(calculateAxisResizeAutoScrollDelta({coordinate:500,start:100,end:900}),0);
});

test("tự cuộn ngược về đầu pane khi con trỏ áp sát mép đầu", () => {
  assert.equal(calculateAxisResizeAutoScrollDelta({coordinate:100,start:100,end:900}),-16);
  assert.equal(calculateAxisResizeAutoScrollDelta({coordinate:122,start:100,end:900}),-8);
});

test("tự cuộn về cuối pane khi con trỏ áp sát mép cuối", () => {
  assert.equal(calculateAxisResizeAutoScrollDelta({coordinate:900,start:100,end:900}),16);
  assert.equal(calculateAxisResizeAutoScrollDelta({coordinate:878,start:100,end:900}),8);
});

test("giới hạn tốc độ và xử lý pane rất hẹp hoặc tọa độ không hữu hạn", () => {
  assert.equal(calculateAxisResizeAutoScrollDelta({coordinate:10,start:10,end:30,edgeSize:44,maxSpeed:12}),-12);
  assert.equal(calculateAxisResizeAutoScrollDelta({coordinate:20,start:10,end:30,edgeSize:44,maxSpeed:12}),0);
  assert.equal(calculateAxisResizeAutoScrollDelta({coordinate:NaN,start:0,end:100}),-16);
  assert.equal(calculateAxisResizeAutoScrollDelta({coordinate:0,start:10,end:10}),0);
  assert.equal(calculateAxisResizeAutoScrollDelta({coordinate:0,start:0,end:100,maxSpeed:0}),0);
});

test("ứng dụng chọn đúng trục cuộn và chỉ cuộn trong pane chứa tay nắm", () => {
  assert.match(appSource, /drag\.handle\?\.closest\?\.\("\.sheet-scroll"\)/);
  assert.match(appSource, /horizontal=drag\.axis===\"column\"/);
  assert.match(appSource, /scroll\.scrollLeft=next;else scroll\.scrollTop=next/);
  assert.match(appSource, /calculateAxisResizeAutoScrollDelta\(\{coordinate,start,end,edgeSize:44,maxSpeed:16\}\)/);
});

test("vòng lặp tự cuộn được dừng khi kết thúc hoặc hủy resize", () => {
  assert.match(appSource, /function stopAxisResizeAutoScroll\(\)/);
  assert.match(appSource, /stopAxisResizeAutoScroll\(\);axisResizeDrag=null;resizeGuide\.hidden=true/);
  assert.match(appSource, /function cancelAxisResize\(\)[\s\S]*?stopAxisResizeAutoScroll\(\)/);
  assert.match(appSource, /axisResizeAutoScrollFrame=requestAnimationFrame\(axisResizeAutoScrollTick\)/);
});
