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
