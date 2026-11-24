const test = require('node:test');
const assert = require('node:assert/strict');

test('HAI DAT SLIDES engine: defaults, V1 migration, slide CRUD & layout presets', async () => {
  const {
    SLIDE_WIDTH,
    SLIDE_HEIGHT,
    SLIDE_THEMES,
    createDefaultDeck,
    migrateLegacyV1Slides,
    normalizeDeck,
    addSlideAfter,
    duplicateSlideAt,
    deleteSlideAt,
    moveSlide,
    getSlideLabel,
  } = await import('../slides/engine/deck.js');

  assert.equal(SLIDE_WIDTH, 960);
  assert.equal(SLIDE_HEIGHT, 540);
  assert.ok(Object.keys(SLIDE_THEMES).length >= 6);

  const def = createDefaultDeck();
  assert.equal(def.version, 2);
  assert.equal(def.slides.length, 2);
  assert.ok(getSlideLabel(def.slides[0], 0).includes('HAI ĐẤT SLIDES'));

  // Legacy V1 migration preserves title & body cleanly
  const migrated = migrateLegacyV1Slides([
    { title: 'Báo cáo Quý 4', body: 'Phòng Kế hoạch' },
    { title: 'Doanh thu', body: 'Tăng 25%\nMở rộng 3 chi nhánh' },
  ]);
  assert.equal(migrated.slides.length, 2);
  assert.equal(migrated.title, 'Báo cáo Quý 4');
  assert.ok(migrated.slides[1].elements.some(e => e.text.includes('Tăng 25%')));

  // Add, duplicate, move, delete slides (never deletes last remaining slide)
  const added = addSlideAfter(def, 0, 'two-column');
  assert.equal(added.deck.slides.length, 3);
  assert.equal(added.activeIndex, 1);
  assert.equal(added.deck.slides[1].layout, 'two-column');

  const dup = duplicateSlideAt(added.deck, 1);
  assert.equal(dup.deck.slides.length, 4);
  assert.notEqual(dup.deck.slides[1].id, dup.deck.slides[2].id);

  const moved = moveSlide(dup.deck, 0, 2);
  assert.equal(moved.moved, true);
  assert.equal(moved.activeIndex, 2);

  const del = deleteSlideAt(moved.deck, 2);
  assert.equal(del.deleted, true);
  assert.equal(del.deck.slides.length, 3);

  const oneSlide = normalizeDeck({ title: 'Single', slides: [def.slides[0]] });
  const cantDel = deleteSlideAt(oneSlide, 0);
  assert.equal(cantDel.deleted, false);
  assert.equal(cantDel.deck.slides.length, 1);
});

test('HAI DAT SLIDES engine: elements, snap guides, z-order, undo/redo & safe standalone HTML export', async () => {
  const {
    createDefaultDeck,
    createTextElement,
    createShapeElement,
    createImageElement,
    createTableElement,
    duplicateElementInSlide,
    reorderElementInSlide,
    snapElementPosition,
    pushDeckHistory,
    moveDeckHistory,
    exportStandaloneHtml,
  } = await import('../slides/engine/deck.js');

  const deck = createDefaultDeck();
  const slide = deck.slides[0];

  const t = createTextElement({ text: 'Xin chào <script>alert(1)</script>', x: 100, y: 100, w: 300, h: 60 });
  const s = createShapeElement({ shape: 'pill', text: 'Nhãn' });
  const tbl = createTableElement({ rows: 2, cols: 2 });
  slide.elements.push(t, s, tbl);

  // Safe image validation rejects javascript: URLs and accepts valid base64 PNG
  assert.throws(() => createImageElement('javascript:alert(1)'));
  const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const img = createImageElement(tinyPng, { alt: 'Pixel' });
  slide.elements.push(img);

  // Duplicate & z-order
  const copy = duplicateElementInSlide(slide, t.id);
  assert.ok(copy && copy.id !== t.id && copy.x === t.x + 24);
  assert.equal(reorderElementInSlide(slide, t.id, 'front'), true);
  assert.equal(slide.elements.at(-1).id, t.id);

  // Snap to center lines (960x540 -> center x for w=200 is 380, center y for h=100 is 220)
  const snapped = snapElementPosition(376, 224, 200, 100, 8);
  assert.equal(snapped.x, 380);
  assert.equal(snapped.y, 220);
  assert.equal(snapped.snapX, true);
  assert.equal(snapped.snapY, true);

  // Undo / Redo history
  const undo = [], redo = [];
  assert.equal(pushDeckHistory(undo, deck), true);
  const modified = createDefaultDeck();
  modified.title = 'Tiêu đề mới';
  const restored = moveDeckHistory(undo, redo, modified);
  assert.equal(restored.title, deck.title);
  assert.equal(redo.length, 1);

  // Standalone HTML export escapes XSS and preserves safe embedded image + 16:9 print rules
  const html = exportStandaloneHtml(deck);
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(html.includes(tinyPng));
  assert.ok(html.includes('@media print'));
});
