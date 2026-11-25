'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

const coreUrl = pathToFileURL(path.resolve(__dirname, '../calc/engine/core.js')).href;

function makeGridContext(grid, currentCell = 'C4') {
  const parseAddr = ref => {
    const m = ref.match(/^([A-Z]+)([0-9]+)$/);
    let c = 0;
    for (const ch of m[1]) c = c * 26 + ch.charCodeAt(0) - 64;
    return { r: Number(m[2]), c };
  };
  const colLbl = n => {
    let s = '';
    while (n > 0) { s = String.fromCharCode(65 + (n - 1) % 26) + s; n = Math.floor((n - 1) / 26); }
    return s;
  };
  return {
    currentCell,
    getCell: ref => (Object.hasOwn(grid, ref) ? grid[ref] : ''),
    getRange: ref => {
      const [a, b] = ref.split(':').map(parseAddr);
      const out = [];
      for (let r = Math.min(a.r, b.r); r <= Math.max(a.r, b.r); r++) {
        for (let c = Math.min(a.c, b.c); c <= Math.max(a.c, b.c); c++) {
          const k = colLbl(c) + r;
          out.push(Object.hasOwn(grid, k) ? grid[k] : '');
        }
      }
      return out;
    },
  };
}

test('Calc function registry follows naming standards and metadata completeness', async () => {
  const { listFormulaFunctions, FUNCTION_CATEGORIES, FUNCTION_NAME_PATTERN } = await import(coreUrl);
  const fns = listFormulaFunctions();
  const all = listFormulaFunctions({ includeAliases: true });
  assert.ok(fns.length >= 130, `Expected >= 130 canonical functions, got ${fns.length}`);
  assert.ok(all.length > fns.length, 'Expected compatibility aliases to be registered');
  for (const f of all) {
    assert.match(f.name, FUNCTION_NAME_PATTERN, `Invalid function name: ${f.name}`);
    assert.ok(FUNCTION_CATEGORIES[f.category], `Invalid category for ${f.name}: ${f.category}`);
    assert.ok(f.syntax.length > 0, `Missing syntax for ${f.name}`);
    assert.ok(f.description.length > 0, `Missing Vietnamese description for ${f.name}`);
  }
});

test('Calc formula engine evaluates standard functions across all 8 categories', async () => {
  const { evaluateFormula } = await import(coreUrl);
  const ctx = makeGridContext({
    A1: 'SP', B1: 'Vung', C1: 'SoLuong', D1: 'Gia',
    A2: 'Tao', B2: 'Bac', C2: 10, D2: 25000,
    A3: 'Cam', B3: 'Nam', C3: 20, D3: 15000,
    A4: 'Tao', B4: 'Nam', C4: 30, D4: 20000,
    A5: 'Le', B5: 'Bac', C5: 0, D5: 30000,
    E2: 100, E3: 200, E4: 300, E5: 400,
  });

  // Syntax upgrades: $A$1, semicolon arg separator, &, postfix %, lazy IF/IFERROR/IFNA
  assert.equal(evaluateFormula('=SUM($C$2:$C$5)', ctx), 60);
  assert.equal(evaluateFormula('=IF(C5=0; 0; D5/C5)', ctx), 0);
  assert.equal(evaluateFormula('=IFERROR(10/C5, "Loi")', ctx), 'Loi');
  assert.equal(evaluateFormula('=IFNA(VLOOKUP("Xoai", A2:D5, 4, FALSE), "Khong")', ctx), 'Khong');
  assert.equal(evaluateFormula('=A2 & " - " & B2', ctx), 'Tao - Bac');
  assert.equal(evaluateFormula('=200*15%', ctx), 30);
  assert.equal(evaluateFormula('=Z9 + 5', ctx), 5);

  // Math & Conditional
  assert.equal(evaluateFormula('=SUMIF(A2:A5, "Tao", C2:C5)', ctx), 40);
  assert.equal(evaluateFormula('=SUMIFS(C2:C5, A2:A5, "Tao", B2:B5, "Nam")', ctx), 30);
  assert.equal(evaluateFormula('=SUMPRODUCT(C2:C4, D2:D4)', ctx), 1150000);

  // Logic
  assert.equal(evaluateFormula('=IFS(C4>=25,"Cao",C4>=15,"TB",TRUE,"Thap")', ctx), 'Cao');
  assert.equal(evaluateFormula('=SWITCH(B2,"Bac","Mien Bac","Nam","Mien Nam","Khac")', ctx), 'Mien Bac');
  assert.equal(evaluateFormula('=AND(C2>5, OR(B2="Bac", B2="Trung"), NOT(C5>0))', ctx), true);

  // Stats
  assert.equal(evaluateFormula('=COUNTIF(A2:A5, "T*")', ctx), 2);
  assert.equal(evaluateFormula('=COUNTIFS(B2:B5, "Bac", C2:C5, ">0")', ctx), 1);
  assert.equal(evaluateFormula('=AVERAGEIF(A2:A5, "Tao", C2:C5)', ctx), 20);
  assert.equal(evaluateFormula('=MEDIAN(E2:E5)', ctx), 250);
  assert.equal(evaluateFormula('=ROUND(STDEV(E2:E5), 2)', ctx), 129.1);
  assert.equal(evaluateFormula('=RANK.EQ(300, E2:E5, 0)', ctx), 2);

  // Lookup
  assert.equal(evaluateFormula('=VLOOKUP("Cam", $A$2:$D$5, 4, FALSE)', ctx), 15000);
  assert.equal(evaluateFormula('=HLOOKUP("Gia", A1:D5, 2, FALSE)', ctx), 25000);
  assert.equal(evaluateFormula('=XLOOKUP("Le", A2:A5, D2:D5, 0)', ctx), 30000);
  assert.equal(evaluateFormula('=XLOOKUP("Mit", A2:A5, D2:D5, "Het")', ctx), 'Het');
  assert.equal(evaluateFormula('=INDEX(D2:D5, MATCH("Cam", A2:A5, 0))', ctx), 15000);
  assert.equal(evaluateFormula('=ROWS(A1:D5)*10 + COLUMNS(A1:D5)', ctx), 54);
  assert.equal(evaluateFormula('=ROW()*10 + COLUMN()', ctx), 43);

  // Text
  assert.equal(evaluateFormula('=LEFT("HD-2026",2) & MID("HD-2026",4,2) & RIGHT("HD-2026",2)', ctx), 'HD2026');
  assert.equal(evaluateFormula('=TEXTJOIN(", ", TRUE, A2:A4)', ctx), 'Tao, Cam, Tao');
  assert.equal(evaluateFormula('=PROPER(TRIM("  hai   dat  "))', ctx), 'Hai Dat');
  assert.equal(evaluateFormula('=TEXT(1250000, "#,##0")', ctx), '1,250,000');
  assert.equal(evaluateFormula('=NUMBERVALUE("1.250,5", ",", ".")', ctx), 1250.5);

  // Date
  assert.equal(evaluateFormula('=DATEDIF("2020-01-15", "2026-11-24", "Y")', ctx), 6);
  assert.equal(evaluateFormula('=EDATE("2026-01-31", 1)', ctx), '2026-02-28');
  assert.equal(evaluateFormula('=EOMONTH("2026-02-10", 0)', ctx), '2026-02-28');
  assert.equal(evaluateFormula('=NETWORKDAYS("2026-11-02", "2026-11-08")', ctx), 5);

  // Finance & Info
  assert.equal(evaluateFormula('=ROUND(PMT(12%/12, 12, 12000000), 0)', ctx), -1066185);
  assert.equal(evaluateFormula('=SLN(50000000, 5000000, 5)', ctx), 9000000);
  assert.equal(evaluateFormula('=AND(ISBLANK(Z9), ISNUMBER(C2), ISERROR(1/0), ISEVEN(10), ISODD(7))', ctx), true);
});

test('Calc keyboard shortcut helpers behave like Excel/Google Sheets', async () => {
  const shortcutsUrl = pathToFileURL(path.resolve(__dirname, '../calc/engine/shortcuts.js')).href;
  const {
    cycleReferenceAtCursor,
    findDataEdge,
    findContiguousRegion,
    computeAutoSumFormula,
    CALC_SHORTCUT_GROUPS,
  } = await import(shortcutsUrl);

  // F4 cycles A1 -> $A$1 -> A$1 -> $A1 -> A1 and supports ranges A1:B5
  const r1 = cycleReferenceAtCursor('=SUM(A1:B5)', 6);
  assert.equal(r1.value, '=SUM($A$1:$B$5)');
  const r2 = cycleReferenceAtCursor(r1.value, 6);
  assert.equal(r2.value, '=SUM(A$1:B$5)');
  const r3 = cycleReferenceAtCursor(r2.value, 6);
  assert.equal(r3.value, '=SUM($A1:$B5)');
  const r4 = cycleReferenceAtCursor(r3.value, 6);
  assert.equal(r4.value, '=SUM(A1:B5)');

  // Ctrl+Arrow data-edge jump
  const sheet = { A1: '10', A2: '20', A3: '30', A6: '60', B2: '15', C2: '25' };
  assert.deepEqual(findDataEdge(sheet, { r: 1, c: 1 }, 1, 0, 100, 26), { r: 3, c: 1 });
  assert.deepEqual(findDataEdge(sheet, { r: 3, c: 1 }, 1, 0, 100, 26), { r: 6, c: 1 });
  assert.deepEqual(findDataEdge(sheet, { r: 6, c: 1 }, 1, 0, 100, 26), { r: 100, c: 1 });
  assert.deepEqual(findDataEdge(sheet, { r: 2, c: 1 }, 0, 1, 100, 26), { r: 2, c: 3 });

  // Ctrl+A contiguous region detection
  const region = findContiguousRegion(sheet, { r: 2, c: 1 }, 100, 26);
  assert.equal(region.start, 'A1');
  assert.equal(region.end, 'C3');

  // Alt+= smart AutoSum (above first, else left, never self-referencing!)
  assert.equal(computeAutoSumFormula(sheet, { r: 4, c: 1 }), '=SUM(A1:A3)');
  assert.equal(computeAutoSumFormula(sheet, { r: 2, c: 4 }), '=SUM(A2:C2)');
  assert.equal(computeAutoSumFormula(sheet, { r: 10, c: 10 }), '=SUM()');

  assert.ok(Array.isArray(CALC_SHORTCUT_GROUPS) && CALC_SHORTCUT_GROUPS.length === 3);
});

test('Calc core ops: insert/delete rows & columns with formula, merge & geometry shifting', async () => {
  const {
    shiftFormulaReferences,
    insertOrDeleteAxis,
    mergeRange,
    unmergeRange,
    expandBoundsForMerges,
    computeDoubleClickFillTarget,
  } = await import('../calc/engine/sheet-ops.js');

  // Formula shifting on row insert / delete
  assert.equal(shiftFormulaReferences('=SUM(A1:A5)+B3', 'row', 3, 1), '=SUM(A1:A6)+B4');
  assert.equal(shiftFormulaReferences('=SUM(A1:A5)+B3', 'row', 3, -1), '=SUM(A1:A4)+#REF!');
  assert.equal(shiftFormulaReferences("='Sheet 2'!A3+A3", 'row', 2, 1), "='Sheet 2'!A3+A4");
  assert.equal(shiftFormulaReferences('="A3"&A3', 'row', 2, 1), '="A3"&A4');

  // Insert row at 2 shifts cells, formats, merges, and rowHeights
  const base = {
    cells: { A1: 'Header', A2: '10', A3: '=A2*2' },
    formats: { A2: { bold: true } },
    merges: [{ startRow: 2, endRow: 3, startCol: 2, endCol: 3 }],
    geometry: { rowHeights: { 2: 48 }, columnWidths: { 1: 150 } },
  };
  const inserted = insertOrDeleteAxis(base, 'row', 2, 1);
  assert.equal(inserted.cells.A1, 'Header');
  assert.equal(inserted.cells.A2, undefined);
  assert.equal(inserted.cells.A3, '10');
  assert.equal(inserted.cells.A4, '=A3*2');
  assert.equal(inserted.formats.A3.bold, true);
  assert.deepEqual(inserted.merges, [{ startRow: 3, endRow: 4, startCol: 2, endCol: 3 }]);
  assert.equal(inserted.geometry.rowHeights[3], 48);

  // Delete column A shifts B -> A and marks deleted refs #REF!
  const colDel = insertOrDeleteAxis(
    { cells: { A1: '10', B1: '20', C1: '=A1+B1' }, formats: {}, merges: [], geometry: { rowHeights: {}, columnWidths: { 2: 140 } } },
    'col', 1, -1
  );
  assert.equal(colDel.cells.A1, '20');
  assert.equal(colDel.cells.B1, '=#REF!+A1');
  assert.equal(colDel.geometry.columnWidths[1], 140);

  // Merge & unmerge cells
  const m1 = mergeRange({ A1: 'Tiêu đề', B1: 'Phụ', A2: 'X' }, {}, [], { startRow: 1, endRow: 1, startCol: 1, endCol: 3 });
  assert.equal(m1.changed, true);
  assert.equal(m1.cells.A1, 'Tiêu đề');
  assert.equal(m1.cells.B1, undefined);
  assert.equal(m1.clearedCount, 1);
  assert.deepEqual(m1.merges, [{ startRow: 1, endRow: 1, startCol: 1, endCol: 3 }]);

  const exp = expandBoundsForMerges(m1.merges, { startRow: 1, endRow: 2, startCol: 2, endCol: 2 });
  assert.equal(exp.start, 'A1');
  assert.equal(exp.end, 'C2');

  const unm = unmergeRange(m1.merges, { startRow: 1, endRow: 1, startCol: 2, endCol: 2 });
  assert.equal(unm.removedCount, 1);
  assert.equal(unm.merges.length, 0);

  // Double-click fill handle adjacent column detection
  const fillTarget = computeDoubleClickFillTarget({ A1: '1', A2: '2', A3: '3', A4: '4', B1: '=A1*10' }, { startRow: 1, endRow: 1, startCol: 2, endCol: 2 });
  assert.equal(fillTarget.start, 'B1');
  assert.equal(fillTarget.end, 'B4');
});

test('Calc smart fill series, range-aware borders, number formatting & merge history', async () => {
  const { fillRange } = await import('../calc/engine/fill-series.js');
  const { applyBorderToRange, formatCellDisplayValue, cellFormatStyle } = await import('../calc/engine/cell-format.js');
  const { serializeWorkbook, restoreWorkbook } = await import('../calc/engine/history.js');

  // Smart series: dates, Vietnamese cycles, zero-padded text-number, formulas with $ locks
  const dateFill = fillRange({ A1: '2026-11-25' }, {}, { start: 'A1', end: 'A1' }, { start: 'A1', end: 'A3' });
  assert.equal(dateFill.cells.A2, '2026-11-26');
  assert.equal(dateFill.cells.A3, '2026-11-27');

  const vnDay = fillRange({ A1: 'Thứ 6' }, {}, { start: 'A1', end: 'A1' }, { start: 'A1', end: 'A4' });
  assert.equal(vnDay.cells.A2, 'Thứ 7');
  assert.equal(vnDay.cells.A3, 'Chủ nhật');
  assert.equal(vnDay.cells.A4, 'Thứ 2');

  const vnMonth = fillRange({ A1: 'Tháng 11' }, {}, { start: 'A1', end: 'A1' }, { start: 'A1', end: 'A3' });
  assert.equal(vnMonth.cells.A2, 'Tháng 12');
  assert.equal(vnMonth.cells.A3, 'Tháng 1');

  const codeFill = fillRange({ A1: 'SP01' }, {}, { start: 'A1', end: 'A1' }, { start: 'A1', end: 'A3' });
  assert.equal(codeFill.cells.A2, 'SP02');
  assert.equal(codeFill.cells.A3, 'SP03');

  const formulaFill = fillRange({ B1: '=A1*$D$1' }, {}, { start: 'B1', end: 'B1' }, { start: 'B1', end: 'B3' });
  assert.equal(formulaFill.cells.B2, '=A2*$D$1');
  assert.equal(formulaFill.cells.B3, '=A3*$D$1');

  // Range-aware outer borders only apply to outer perimeter
  const outer = applyBorderToRange({}, { startRow: 1, endRow: 2, startCol: 1, endCol: 2 }, 'outer');
  assert.equal(outer.A1.borderTop, 'thin');
  assert.equal(outer.A1.borderLeft, 'thin');
  assert.equal(outer.A1.borderRight, '');
  assert.equal(outer.A1.borderBottom, '');
  assert.equal(outer.B2.borderRight, 'thin');
  assert.equal(outer.B2.borderBottom, 'thin');
  assert.ok(cellFormatStyle(outer.B2).borderBottom.includes('solid'));

  // Number formatting (VNĐ, %, thousands, date, custom decimals)
  assert.ok(formatCellDisplayValue(1250000, { numberFormat: 'currency', decimals: 0 }).includes('₫'));
  assert.ok(formatCellDisplayValue(0.255, { numberFormat: 'percent', decimals: 1 }).includes('%'));
  assert.equal(formatCellDisplayValue('2026-11-25', { numberFormat: 'date' }), '25/11/2026');
  assert.equal(formatCellDisplayValue(1234.5, { numberFormat: 'thousands', decimals: 2 }).length > 5, true);

  // History preserves merges across serialize/restore
  const snap = serializeWorkbook({ A1: 'Hi' }, {}, [{ startRow: 1, endRow: 1, startCol: 1, endCol: 2 }]);
  const restored = restoreWorkbook(snap);
  assert.deepEqual(restored.merges, [{ startRow: 1, endRow: 1, startCol: 1, endCol: 2 }]);
});

test('Calc XLSX/CSV I/O: RFC 4180 CSV, multi-sheet XLSX round-trip, DEFLATE ZIP & Print HTML', async () => {
  const {
    parseCsv,
    serializeCsv,
    exportWorkbookToXlsx,
    importXlsxToWorkbook,
    buildPrintTableHtml,
  } = await import('../calc/engine/xlsx-csv-io.js');

  // 1) RFC 4180 CSV with BOM, semicolon delimiter, quoted multiline & escaped quotes
  const vnCsv = '\ufeff"Sản phẩm";"Đơn giá";"Ghi chú"\r\n"Cà phê ""Đậm""";45000;"Dòng 1\nDòng 2"\r\nTrà đào;35000;Mới';
  const parsedCsv = parseCsv(vnCsv);
  assert.equal(parsedCsv.delimiter, ';');
  assert.equal(parsedCsv.rows, 3);
  assert.equal(parsedCsv.cells.A2, 'Cà phê "Đậm"');
  assert.equal(parsedCsv.cells.B2, '45000');
  assert.equal(parsedCsv.cells.C2, 'Dòng 1\nDòng 2');
  const outCsv = serializeCsv(parsedCsv.cells);
  assert.ok(outCsv.startsWith('\ufeff'));
  assert.equal(parseCsv(outCsv).cells.A2, 'Cà phê "Đậm"');

  // 2) Multi-sheet XLSX export & import round-trip (formulas, VN text, formats, borders, merges, freeze, geometry)
  const sheets = [
    {
      id: 'sheet-1',
      name: 'Doanh thu Q4',
      cells: { A1: 'BÁO CÁO QUÝ 4', A2: 'Sản phẩm', B2: 'Doanh thu', C2: 'Tỷ lệ', A3: 'Cà phê', B3: '1500000', C3: '0.6', A4: 'Tổng', B4: '=SUM(B3:B3)' },
      formats: {
        A1: { bold: true, align: 'center', background: '#e3f1e9', color: '#145744' },
        B3: { numberFormat: 'currency', borderBottom: 'thin' },
        C3: { numberFormat: 'percent' },
        B4: { bold: true, numberFormat: 'currency', borderBottom: 'double' },
      },
      merges: [{ startRow: 1, endRow: 1, startCol: 1, endCol: 3 }],
      freeze: { rows: 2, columns: 0 },
      geometry: { columnWidths: { 1: 180, 2: 140 }, rowHeights: { 1: 42 } },
    },
    {
      id: 'sheet-2',
      name: 'Ghi chú',
      cells: { A1: 'Hoàn toàn cục bộ', B1: 'TRUE' },
      formats: {},
      merges: [],
      freeze: { rows: 0, columns: 0 },
      geometry: { columnWidths: {}, rowHeights: {} },
    },
  ];

  const xlsxBytes = exportWorkbookToXlsx(sheets, (sid, addr) => (sid === 'sheet-1' && addr === 'B4' ? 1500000 : null));
  assert.ok(xlsxBytes instanceof Uint8Array && xlsxBytes.length > 500);
  // Valid PKZIP local header signature PK\x03\x04
  assert.equal(xlsxBytes[0], 0x50);
  assert.equal(xlsxBytes[1], 0x4b);

  const imported = await importXlsxToWorkbook(xlsxBytes);
  assert.equal(imported.sheets.length, 2);
  assert.equal(imported.sheets[0].name, 'Doanh thu Q4');
  assert.equal(imported.sheets[0].cells.A1, 'BÁO CÁO QUÝ 4');
  assert.equal(imported.sheets[0].cells.B3, '1500000');
  assert.equal(imported.sheets[0].cells.B4, '=SUM(B3:B3)');
  assert.equal(imported.sheets[0].formats.A1.bold, true);
  assert.equal(imported.sheets[0].formats.A1.align, 'center');
  assert.equal(imported.sheets[0].formats.B3.numberFormat, 'currency');
  assert.equal(imported.sheets[0].formats.C3.numberFormat, 'percent');
  assert.equal(imported.sheets[0].formats.B4.borderBottom, 'double');
  assert.deepEqual(imported.sheets[0].merges, [{ startRow: 1, endRow: 1, startCol: 1, endCol: 3 }]);
  assert.deepEqual(imported.sheets[0].freeze, { rows: 2, columns: 0 });
  assert.ok(imported.sheets[0].geometry.columnWidths[1] >= 170);
  assert.equal(imported.sheets[1].name, 'Ghi chú');
  assert.equal(imported.sheets[1].cells.B1, 'TRUE');

  // 3) Print table HTML builder preserves merges, repeating <thead>, gridlines, and escapes XSS
  const printHtml = buildPrintTableHtml({
    sheetName: 'Doanh thu <script>',
    cells: { A1: 'Tiêu đề', A2: '<b>Item</b>', B2: '100' },
    formats: { A1: { bold: true } },
    merges: [{ startRow: 1, endRow: 1, startCol: 1, endCol: 2 }],
    repeatHeaderRow: true,
    showGridlines: true,
    showHeaders: true,
  });
  assert.ok(printHtml.includes('<thead>'));
  assert.ok(printHtml.includes('colspan="2"'));
  assert.ok(printHtml.includes('&lt;b&gt;Item&lt;/b&gt;'));
  assert.ok(!printHtml.includes('<script>'));
});


