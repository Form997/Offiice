/**
 * HAI ĐẤT CALC — Standard Spreadsheet Function Library
 *
 * NGUYÊN TẮC ĐẶT TÊN HÀM (chuẩn Excel / Google Sheets — đúng & dễ làm):
 * 1. Tên hàm viết HOA không dấu: ^[A-Z][A-Z0-9_.]*$ (tương thích 100% Excel / Google Sheets).
 * 2. Theo mẫu nhất quán:
 *    - Điều kiện: <HÀM>IF (1 điều kiện), <HÀM>IFS (nhiều điều kiện) -> SUMIF/SUMIFS, COUNTIF/COUNTIFS, AVERAGEIF/AVERAGEIFS, MAXIFS/MINIFS.
 *    - Bắt lỗi: IFERROR, IFNA, ISERROR, ISERR, ISNA.
 *    - Kiểm tra kiểu: IS<KIỂU> -> ISBLANK, ISNUMBER, ISTEXT, ISLOGICAL, ISEVEN, ISODD.
 *    - Tra cứu: VLOOKUP, HLOOKUP, XLOOKUP, INDEX, MATCH, LOOKUP, CHOOSE, ROW, COLUMN, ROWS, COLUMNS.
 *    - Thống kê mẫu/tổng thể: <HÀM>.S (mẫu), <HÀM>.P (tổng thể), kèm alias ngắn quen thuộc (STDEV, VAR, RANK, PERCENTILE, QUARTILE).
 * 3. Mỗi hàm tự khai báo 1 chỗ duy nhất: { name, category, min, max, syntax, example, description, lazy?, run }.
 */

export function registerStandardFunctions({ add, alias, h }) {
  const {
    fail, flatten, isNumeric, toNumber, toInt, toStringVal, toBoolean,
    matchCriteria, asMatrix, parseExcelDate, formatIsoDate, formatIsoDateTime,
    daysBetween, isRange, parseCellAddress,
  } = h;

  const numValues = args => flatten(args).filter(isNumeric);
  const allNumbersStrict = (args, name) => flatten(args).map(v => toNumber(v, name));

  const collectConditional = (criteriaRange, criteria, targetRange, fnName) => {
    const cVals = isRange(criteriaRange) ? criteriaRange.values : [criteriaRange];
    const tVals = targetRange === undefined ? cVals : (isRange(targetRange) ? targetRange.values : [targetRange]);
    const len = Math.min(cVals.length, tVals.length);
    const matched = [];
    for (let i = 0; i < len; i++) {
      if (matchCriteria(cVals[i], criteria)) matched.push(tVals[i]);
    }
    if (len === 0 && targetRange !== undefined && !isRange(criteriaRange)) fail("#VALUE!", `${fnName} cần vùng dữ liệu hợp lệ.`);
    return matched;
  };

  const collectMultiConditional = (targetRange, pairs, fnName) => {
    if (pairs.length < 2 || pairs.length % 2 !== 0) fail("#ARGS!", `${fnName} cần các cặp (vùng_điều_kiện, điều_kiện).`);
    const tVals = targetRange ? (isRange(targetRange) ? targetRange.values : [targetRange]) : null;
    const critRanges = [];
    const crits = [];
    for (let i = 0; i < pairs.length; i += 2) {
      critRanges.push(isRange(pairs[i]) ? pairs[i].values : [pairs[i]]);
      crits.push(pairs[i + 1]);
    }
    const len = tVals ? tVals.length : critRanges[0].length;
    for (const r of critRanges) {
      if (r.length !== len) fail("#VALUE!", `${fnName}: các vùng điều kiện phải có cùng kích thước.`);
    }
    const matched = [];
    for (let idx = 0; idx < len; idx++) {
      let ok = true;
      for (let p = 0; p < critRanges.length; p++) {
        if (!matchCriteria(critRanges[p][idx], crits[p])) { ok = false; break; }
      }
      if (ok) matched.push(tVals ? tVals[idx] : 1);
    }
    return matched;
  };

  const gcd2 = (a, b) => { a = Math.abs(Math.trunc(a)); b = Math.abs(Math.trunc(b)); while (b) { const t = b; b = a % b; a = t; } return a; };
  const factorial = n => {
    if (n < 0 || n > 170) fail("#NUM!", "FACT nhận số nguyên từ 0 đến 170.");
    let r = 1; for (let i = 2; i <= Math.trunc(n); i++) r *= i; return r;
  };

  // =========================================================================
  // 1. TOÁN HỌC (math)
  // =========================================================================
  add("SUM", "math", 0, Infinity,
    a => numValues(a).reduce((s, n) => s + n, 0),
    "SUM(số1, [số2], ...)", "=SUM(A1:A10)", "Cộng tất cả các giá trị số trong vùng hoặc danh sách.");

  add("SUMIF", "math", 2, 3,
    a => collectConditional(a[0], a[1], a[2], "SUMIF").filter(isNumeric).reduce((s, n) => s + n, 0),
    "SUMIF(vùng_điều_kiện, điều_kiện, [vùng_tổng])", '=SUMIF(A2:A10, ">100", B2:B10)', "Cộng các ô thỏa mãn một điều kiện.");

  add("SUMIFS", "math", 3, Infinity,
    a => collectMultiConditional(a[0], a.slice(1), "SUMIFS").filter(isNumeric).reduce((s, n) => s + n, 0),
    "SUMIFS(vùng_tổng, vùng_đk1, đk1, [vùng_đk2, đk2], ...)", '=SUMIFS(C2:C10, A2:A10, "Bắc", B2:B10, ">50")', "Cộng các ô thỏa mãn đồng thời nhiều điều kiện.");

  add("SUMPRODUCT", "math", 1, Infinity,
    a => {
      const arrays = a.map(x => (isRange(x) ? x.values : [x]));
      const len = arrays[0].length;
      for (const arr of arrays) if (arr.length !== len) fail("#VALUE!", "SUMPRODUCT yêu cầu các vùng cùng kích thước.");
      let total = 0;
      for (let i = 0; i < len; i++) {
        let prod = 1;
        for (const arr of arrays) {
          const v = arr[i];
          prod *= typeof v === "number" ? v : (typeof v === "boolean" ? (v ? 1 : 0) : 0);
        }
        total += prod;
      }
      return total;
    },
    "SUMPRODUCT(vùng1, [vùng2], ...)", "=SUMPRODUCT(B2:B10, C2:C10)", "Nhân tương ứng từng cặp phần tử rồi cộng tổng.");

  add("PRODUCT", "math", 1, Infinity,
    a => { const v = numValues(a); return v.length ? v.reduce((p, n) => p * n, 1) : 0; },
    "PRODUCT(số1, [số2], ...)", "=PRODUCT(A1:A5)", "Nhân tất cả các giá trị số với nhau.");

  add("ABS", "math", 1, 1,
    a => Math.abs(toNumber(a[0], "ABS")),
    "ABS(số)", "=ABS(-25)", "Trả về giá trị tuyệt đối của số.");

  add("SIGN", "math", 1, 1,
    a => Math.sign(toNumber(a[0], "SIGN")),
    "SIGN(số)", "=SIGN(-8)", "Trả về dấu của số (-1, 0 hoặc 1).");

  add("SQRT", "math", 1, 1,
    a => { const n = toNumber(a[0], "SQRT"); if (n < 0) fail("#NUM!", "Không lấy căn bậc hai của số âm."); return Math.sqrt(n); },
    "SQRT(số)", "=SQRT(81)", "Tính căn bậc hai của số không âm.");

  add("POWER", "math", 2, 2,
    a => Math.pow(toNumber(a[0], "POWER"), toNumber(a[1], "POWER")),
    "POWER(cơ_số, số_mũ)", "=POWER(2, 10)", "Tính lũy thừa cơ_số ^ số_mũ.");

  add("MOD", "math", 2, 2,
    a => { const x = toNumber(a[0], "MOD"), y = toNumber(a[1], "MOD"); if (y === 0) fail("#DIV/0!", "MOD không thể chia cho 0."); const r = x % y; return r !== 0 && Math.sign(r) !== Math.sign(y) ? r + y : r; },
    "MOD(số_bị_chia, số_chia)", "=MOD(17, 5)", "Trả về phần dư của phép chia, cùng dấu số chia.");

  add("QUOTIENT", "math", 2, 2,
    a => { const x = toNumber(a[0], "QUOTIENT"), y = toNumber(a[1], "QUOTIENT"); if (y === 0) fail("#DIV/0!", "QUOTIENT không thể chia cho 0."); return Math.trunc(x / y); },
    "QUOTIENT(tử_số, mẫu_số)", "=QUOTIENT(17, 5)", "Lấy phần nguyên của phép chia.");

  add("INT", "math", 1, 1,
    a => Math.floor(toNumber(a[0], "INT")),
    "INT(số)", "=INT(8.9)", "Làm tròn xuống số nguyên gần nhất.");

  add("TRUNC", "math", 1, 2,
    a => { const n = toNumber(a[0], "TRUNC"), d = a.length > 1 ? toInt(a[1], "TRUNC") : 0, p = 10 ** d; return Math.trunc(n * p) / p; },
    "TRUNC(số, [số_chữ_số])", "=TRUNC(3.14159, 2)", "Cắt bỏ phần thập phân không làm tròn.");

  add("ROUND", "math", 1, 2,
    a => { const n = toNumber(a[0], "ROUND"), d = a.length > 1 ? toInt(a[1], "ROUND") : 0, p = 10 ** d; return Math.sign(n) * Math.round((Math.abs(n) + Number.EPSILON) * p) / p; },
    "ROUND(số, [số_chữ_số])", "=ROUND(3.146, 2)", "Làm tròn số đến số chữ số thập phân chỉ định.");

  add("ROUNDUP", "math", 1, 2,
    a => { const n = toNumber(a[0], "ROUNDUP"), d = a.length > 1 ? toInt(a[1], "ROUNDUP") : 0, p = 10 ** d; return Math.sign(n) * Math.ceil((Math.abs(n) - 1e-12) * p) / p; },
    "ROUNDUP(số, [số_chữ_số])", "=ROUNDUP(3.11, 1)", "Làm tròn lên (xa số 0).");

  add("ROUNDDOWN", "math", 1, 2,
    a => { const n = toNumber(a[0], "ROUNDDOWN"), d = a.length > 1 ? toInt(a[1], "ROUNDDOWN") : 0, p = 10 ** d; return Math.sign(n) * Math.floor((Math.abs(n) + 1e-12) * p) / p; },
    "ROUNDDOWN(số, [số_chữ_số])", "=ROUNDDOWN(3.99, 1)", "Làm tròn xuống (về phía 0).");

  add("MROUND", "math", 2, 2,
    a => { const n = toNumber(a[0], "MROUND"), m = toNumber(a[1], "MROUND"); if (m === 0) return 0; if (Math.sign(n) !== 0 && Math.sign(n) !== Math.sign(m)) fail("#NUM!", "MROUND yêu cầu 2 đối số cùng dấu."); return Math.round(n / m) * m; },
    "MROUND(số, bội_số)", "=MROUND(13, 5)", "Làm tròn số về bội số gần nhất.");

  add("CEILING.MATH", "math", 1, 2,
    a => { const n = toNumber(a[0], "CEILING.MATH"), sig = a.length > 1 ? Math.abs(toNumber(a[1], "CEILING.MATH")) : 1; if (sig === 0) return 0; return Math.ceil(n / sig) * sig; },
    "CEILING.MATH(số, [bội_số])", "=CEILING.MATH(12.2, 5)", "Làm tròn lên tới bội số gần nhất.");
  alias("CEILING", "CEILING.MATH");

  add("FLOOR.MATH", "math", 1, 2,
    a => { const n = toNumber(a[0], "FLOOR.MATH"), sig = a.length > 1 ? Math.abs(toNumber(a[1], "FLOOR.MATH")) : 1; if (sig === 0) return 0; return Math.floor(n / sig) * sig; },
    "FLOOR.MATH(số, [bội_số])", "=FLOOR.MATH(14.8, 5)", "Làm tròn xuống tới bội số gần nhất.");
  alias("FLOOR", "FLOOR.MATH");

  add("EVEN", "math", 1, 1,
    a => { const n = toNumber(a[0], "EVEN"); if (n === 0) return 0; const up = Math.ceil(Math.abs(n)); return Math.sign(n) * (up % 2 === 0 ? up : up + 1); },
    "EVEN(số)", "=EVEN(3.2)", "Làm tròn xa 0 đến số nguyên chẵn gần nhất.");

  add("ODD", "math", 1, 1,
    a => { const n = toNumber(a[0], "ODD"); if (n === 0) return 1; const up = Math.ceil(Math.abs(n)); return Math.sign(n) * (up % 2 === 1 ? up : up + 1); },
    "ODD(số)", "=ODD(2.1)", "Làm tròn xa 0 đến số nguyên lẻ gần nhất.");

  add("GCD", "math", 1, Infinity,
    a => { const nums = allNumbersStrict(a, "GCD"); if (nums.some(n => n < 0)) fail("#NUM!", "GCD không nhận số âm."); return nums.reduce((acc, n) => gcd2(acc, n), 0); },
    "GCD(số1, [số2], ...)", "=GCD(24, 36)", "Ước chung lớn nhất.");

  add("LCM", "math", 1, Infinity,
    a => { const nums = allNumbersStrict(a, "LCM"); if (nums.some(n => n < 0)) fail("#NUM!", "LCM không nhận số âm."); return nums.reduce((acc, n) => { const k = Math.trunc(n); return acc === 0 || k === 0 ? 0 : Math.abs(acc * k) / gcd2(acc, k); }, 1); },
    "LCM(số1, [số2], ...)", "=LCM(6, 8)", "Bội chung nhỏ nhất.");

  add("FACT", "math", 1, 1,
    a => factorial(toNumber(a[0], "FACT")),
    "FACT(n)", "=FACT(5)", "Tính giai thừa n!.");

  add("COMBIN", "math", 2, 2,
    a => { const n = toInt(a[0], "COMBIN"), k = toInt(a[1], "COMBIN"); if (n < 0 || k < 0 || k > n) fail("#NUM!", "COMBIN cần 0 ≤ k ≤ n."); return Math.round(factorial(n) / (factorial(k) * factorial(n - k))); },
    "COMBIN(n, k)", "=COMBIN(10, 3)", "Số tổ hợp chập k của n phần tử.");

  add("PERMUT", "math", 2, 2,
    a => { const n = toInt(a[0], "PERMUT"), k = toInt(a[1], "PERMUT"); if (n < 0 || k < 0 || k > n) fail("#NUM!", "PERMUT cần 0 ≤ k ≤ n."); return Math.round(factorial(n) / factorial(n - k)); },
    "PERMUT(n, k)", "=PERMUT(5, 2)", "Số chỉnh hợp chập k của n phần tử.");

  add("PI", "math", 0, 0, () => Math.PI, "PI()", "=PI()", "Hằng số toán học π (3.14159265358979).");

  add("EXP", "math", 1, 1,
    a => Math.exp(toNumber(a[0], "EXP")),
    "EXP(x)", "=EXP(1)", "Tính e mũ x.");

  add("LN", "math", 1, 1,
    a => { const n = toNumber(a[0], "LN"); if (n <= 0) fail("#NUM!", "LN chỉ nhận số dương."); return Math.log(n); },
    "LN(số)", "=LN(10)", "Logarit tự nhiên cơ số e.");

  add("LOG", "math", 1, 2,
    a => { const n = toNumber(a[0], "LOG"), base = a.length > 1 ? toNumber(a[1], "LOG") : 10; if (n <= 0 || base <= 0 || base === 1) fail("#NUM!", "LOG cần số > 0 và cơ số > 0, ≠ 1."); return Math.log(n) / Math.log(base); },
    "LOG(số, [cơ_số])", "=LOG(8, 2)", "Logarit theo cơ số bất kỳ (mặc định cơ số 10).");

  add("LOG10", "math", 1, 1,
    a => { const n = toNumber(a[0], "LOG10"); if (n <= 0) fail("#NUM!", "LOG10 chỉ nhận số dương."); return Math.log10(n); },
    "LOG10(số)", "=LOG10(1000)", "Logarit cơ số 10.");

  add("SIN", "math", 1, 1, a => Math.sin(toNumber(a[0], "SIN") * Math.PI / 180), "SIN(góc_độ)", "=SIN(30)", "Tính sin của góc theo độ.");
  add("COS", "math", 1, 1, a => Math.cos(toNumber(a[0], "COS") * Math.PI / 180), "COS(góc_độ)", "=COS(60)", "Tính cos của góc theo độ.");
  add("TAN", "math", 1, 1, a => Math.tan(toNumber(a[0], "TAN") * Math.PI / 180), "TAN(góc_độ)", "=TAN(45)", "Tính tan của góc theo độ.");
  add("ASIN", "math", 1, 1, a => { const n = toNumber(a[0], "ASIN"); if (n < -1 || n > 1) fail("#NUM!", "ASIN nhận giá trị từ -1 đến 1."); return Math.asin(n) * 180 / Math.PI; }, "ASIN(x)", "=ASIN(0.5)", "Arcsin trả về góc theo độ.");
  add("ACOS", "math", 1, 1, a => { const n = toNumber(a[0], "ACOS"); if (n < -1 || n > 1) fail("#NUM!", "ACOS nhận giá trị từ -1 đến 1."); return Math.acos(n) * 180 / Math.PI; }, "ACOS(x)", "=ACOS(0.5)", "Arccos trả về góc theo độ.");
  add("ATAN", "math", 1, 1, a => Math.atan(toNumber(a[0], "ATAN")) * 180 / Math.PI, "ATAN(x)", "=ATAN(1)", "Arctan trả về góc theo độ.");
  add("RADIANS", "math", 1, 1, a => toNumber(a[0], "RADIANS") * Math.PI / 180, "RADIANS(độ)", "=RADIANS(180)", "Đổi góc từ độ sang radian.");
  add("DEGREES", "math", 1, 1, a => toNumber(a[0], "DEGREES") * 180 / Math.PI, "DEGREES(radian)", "=DEGREES(PI())", "Đổi góc từ radian sang độ.");

  add("RAND", "math", 0, 0, () => Math.random(), "RAND()", "=RAND()", "Số ngẫu nhiên thập phân từ 0 đến < 1.");
  add("RANDBETWEEN", "math", 2, 2,
    a => { const lo = Math.ceil(toNumber(a[0], "RANDBETWEEN")), hi = Math.floor(toNumber(a[1], "RANDBETWEEN")); if (lo > hi) fail("#NUM!", "RANDBETWEEN cần cận dưới ≤ cận trên."); return Math.floor(Math.random() * (hi - lo + 1)) + lo; },
    "RANDBETWEEN(nhỏ_nhất, lớn_nhất)", "=RANDBETWEEN(1, 100)", "Số nguyên ngẫu nhiên trong khoảng cho trước.");

  add("SUBTOTAL", "math", 2, Infinity,
    a => {
      const code = toInt(a[0], "SUBTOTAL") % 100;
      const vals = numValues(a.slice(1));
      const all = flatten(a.slice(1));
      if (code === 1) { if (!vals.length) fail("#DIV/0!", "Không có số."); return vals.reduce((s, n) => s + n, 0) / vals.length; }
      if (code === 2) return vals.length;
      if (code === 3) return all.filter(v => v !== null && v !== undefined && v !== "").length;
      if (code === 4) return vals.length ? Math.max(...vals) : 0;
      if (code === 5) return vals.length ? Math.min(...vals) : 0;
      if (code === 6) return vals.length ? vals.reduce((p, n) => p * n, 1) : 0;
      if (code === 9) return vals.reduce((s, n) => s + n, 0);
      fail("#VALUE!", "SUBTOTAL hỗ trợ mã 1(AVG), 2(COUNT), 3(COUNTA), 4(MAX), 5(MIN), 6(PRODUCT), 9(SUM).");
    },
    "SUBTOTAL(mã_hàm, vùng1, ...)", "=SUBTOTAL(9, B2:B20)", "Tính tổng phụ theo mã hàm (9=SUM, 1=AVERAGE, 2=COUNT, 4=MAX, 5=MIN).");

  // =========================================================================
  // 2. LOGIC & ĐIỀU KIỆN (logic) — hỗ trợ lazy (không đánh giá nhánh thừa)
  // =========================================================================
  add("IF", "logic", 2, 3,
    thunks => {
      const cond = toBoolean(thunks[0](), "IF");
      if (cond) return thunks[1]();
      return thunks.length >= 3 ? thunks[2]() : false;
    },
    "IF(điều_kiện, nếu_đúng, [nếu_sai])", '=IF(B2>=5, "Đạt", "Chưa đạt")', "Kiểm tra điều kiện và trả về một trong hai giá trị.", true);

  add("IFS", "logic", 2, Infinity,
    thunks => {
      if (thunks.length % 2 !== 0) fail("#ARGS!", "IFS cần số tham số chẵn theo từng cặp (điều_kiện, kết_quả).");
      for (let i = 0; i < thunks.length; i += 2) {
        if (toBoolean(thunks[i](), "IFS")) return thunks[i + 1]();
      }
      fail("#N/A", "Không có điều kiện nào trong IFS đúng.");
    },
    "IFS(đk1, kq1, đk2, kq2, ...)", '=IFS(A1>=8, "Giỏi", A1>=6.5, "Khá", TRUE, "Trung bình")', "Kiểm tra tuần tự nhiều điều kiện thay cho IF lồng nhau.", true);

  add("SWITCH", "logic", 3, Infinity,
    thunks => {
      const target = thunks[0]();
      const hasDefault = thunks.length % 2 === 0;
      const limit = hasDefault ? thunks.length - 1 : thunks.length;
      for (let i = 1; i < limit; i += 2) {
        const candidate = thunks[i]();
        const same = typeof target === "string" && typeof candidate === "string"
          ? target.toLocaleLowerCase() === candidate.toLocaleLowerCase()
          : target === candidate;
        if (same) return thunks[i + 1]();
      }
      if (hasDefault) return thunks[thunks.length - 1]();
      fail("#N/A", "SWITCH không tìm thấy nhánh khớp.");
    },
    "SWITCH(giá_trị, khớp1, kq1, ..., [mặc_định])", '=SWITCH(A1, 1, "Một", 2, "Hai", "Khác")', "So khớp một giá trị với danh sách các trường hợp.", true);

  add("AND", "logic", 1, Infinity,
    thunks => {
      let seen = false;
      for (const fn of thunks) {
        const val = fn();
        const items = isRange(val) ? val.values : [val];
        for (const item of items) {
          if (item === "" || item === null || item === undefined) continue;
          if (typeof item === "string") continue;
          seen = true;
          if (!Boolean(item)) return false;
        }
      }
      if (!seen) fail("#VALUE!", "AND cần ít nhất một giá trị logic.");
      return true;
    },
    "AND(đk1, [đk2], ...)", "=AND(A1>0, B1<100)", "Trả về TRUE nếu tất cả các điều kiện đều đúng.", true);

  add("OR", "logic", 1, Infinity,
    thunks => {
      let seen = false;
      for (const fn of thunks) {
        const val = fn();
        const items = isRange(val) ? val.values : [val];
        for (const item of items) {
          if (item === "" || item === null || item === undefined) continue;
          if (typeof item === "string") continue;
          seen = true;
          if (Boolean(item)) return true;
        }
      }
      if (!seen) fail("#VALUE!", "OR cần ít nhất một giá trị logic.");
      return false;
    },
    "OR(đk1, [đk2], ...)", '=OR(A1="VIP", B1>=1000)', "Trả về TRUE nếu có ít nhất một điều kiện đúng.", true);

  add("XOR", "logic", 1, Infinity,
    a => {
      let trues = 0, seen = 0;
      for (const item of flatten(a)) {
        if (item === "" || item === null || item === undefined || typeof item === "string") continue;
        seen++;
        if (Boolean(item)) trues++;
      }
      if (!seen) fail("#VALUE!", "XOR cần giá trị logic.");
      return trues % 2 === 1;
    },
    "XOR(đk1, [đk2], ...)", "=XOR(A1>0, B1>0)", "Trả về TRUE nếu số điều kiện đúng là số lẻ.");

  add("NOT", "logic", 1, 1,
    a => !toBoolean(a[0], "NOT"),
    "NOT(logic)", "=NOT(A1=0)", "Đảo ngược giá trị logic TRUE ↔ FALSE.");

  add("IFERROR", "logic", 2, 2,
    thunks => {
      try { return thunks[0](); }
      catch { return thunks[1](); }
    },
    "IFERROR(biểu_thức, giá_trị_nếu_lỗi)", "=IFERROR(A1/B1, 0)", "Trả về giá trị dự phòng nếu công thức phát sinh bất kỳ lỗi nào.", true);

  add("IFNA", "logic", 2, 2,
    thunks => {
      try { return thunks[0](); }
      catch (err) { if (err?.code === "#N/A") return thunks[1](); throw err; }
    },
    "IFNA(biểu_thức, giá_trị_nếu_NA)", '=IFNA(VLOOKUP(A1, D1:E10, 2, FALSE), "Không thấy")', "Trả về giá trị dự phòng khi công thức gặp lỗi #N/A.", true);

  add("TRUE", "logic", 0, 0, () => true, "TRUE()", "=TRUE()", "Trả về giá trị logic TRUE.");
  add("FALSE", "logic", 0, 0, () => false, "FALSE()", "=FALSE()", "Trả về giá trị logic FALSE.");

  // =========================================================================
  // 3. THỐNG KÊ (stats)
  // =========================================================================
  add("AVERAGE", "stats", 1, Infinity,
    a => { const v = numValues(a); if (!v.length) fail("#DIV/0!", "Không có giá trị số để tính trung bình."); return v.reduce((s, n) => s + n, 0) / v.length; },
    "AVERAGE(số1, [số2], ...)", "=AVERAGE(B2:B10)", "Tính trung bình cộng các giá trị số.");

  add("AVERAGEA", "stats", 1, Infinity,
    a => {
      const vals = flatten(a).filter(v => v !== null && v !== undefined && v !== "").map(v => typeof v === "number" ? v : (typeof v === "boolean" ? (v ? 1 : 0) : 0));
      if (!vals.length) fail("#DIV/0!", "Không có dữ liệu.");
      return vals.reduce((s, n) => s + n, 0) / vals.length;
    },
    "AVERAGEA(vùng1, ...)", "=AVERAGEA(A1:A10)", "Trung bình cộng gồm cả chữ (tính là 0) và TRUE/FALSE.");

  add("AVERAGEIF", "stats", 2, 3,
    a => { const v = collectConditional(a[0], a[1], a[2], "AVERAGEIF").filter(isNumeric); if (!v.length) fail("#DIV/0!", "AVERAGEIF không tìm thấy ô số khớp điều kiện."); return v.reduce((s, n) => s + n, 0) / v.length; },
    "AVERAGEIF(vùng_đk, điều_kiện, [vùng_tb])", '=AVERAGEIF(A2:A10, ">0", B2:B10)', "Trung bình cộng các ô thỏa một điều kiện.");

  add("AVERAGEIFS", "stats", 3, Infinity,
    a => { const v = collectMultiConditional(a[0], a.slice(1), "AVERAGEIFS").filter(isNumeric); if (!v.length) fail("#DIV/0!", "AVERAGEIFS không có ô khớp."); return v.reduce((s, n) => s + n, 0) / v.length; },
    "AVERAGEIFS(vùng_tb, vùng_đk1, đk1, ...)", '=AVERAGEIFS(C2:C10, A2:A10, "Nam", B2:B10, ">=5")', "Trung bình cộng theo nhiều điều kiện.");

  add("MEDIAN", "stats", 1, Infinity,
    a => { const v = numValues(a).sort((x, y) => x - y); if (!v.length) fail("#NUM!", "MEDIAN cần ít nhất 1 số."); const m = Math.floor(v.length / 2); return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2; },
    "MEDIAN(số1, [số2], ...)", "=MEDIAN(A1:A10)", "Tìm số trung vị của tập dữ liệu.");

  add("MODE.SNGL", "stats", 1, Infinity,
    a => {
      const v = numValues(a); const freq = new Map(); let bestVal = null, bestCnt = 1;
      for (const n of v) { const c = (freq.get(n) || 0) + 1; freq.set(n, c); if (c > bestCnt) { bestCnt = c; bestVal = n; } }
      if (bestVal === null) fail("#N/A", "Không có giá trị nào xuất hiện lặp lại.");
      return bestVal;
    },
    "MODE.SNGL(số1, [số2], ...)", "=MODE.SNGL(A1:A20)", "Tìm giá trị xuất hiện nhiều nhất.");
  alias("MODE", "MODE.SNGL");

  add("MIN", "stats", 1, Infinity,
    a => { const v = numValues(a); return v.length ? Math.min(...v) : 0; },
    "MIN(số1, [số2], ...)", "=MIN(A1:A10)", "Giá trị nhỏ nhất.");

  add("MINIFS", "stats", 3, Infinity,
    a => { const v = collectMultiConditional(a[0], a.slice(1), "MINIFS").filter(isNumeric); return v.length ? Math.min(...v) : 0; },
    "MINIFS(vùng_min, vùng_đk1, đk1, ...)", '=MINIFS(B2:B10, A2:A10, "Kho A")', "Giá trị nhỏ nhất theo nhiều điều kiện.");

  add("MAX", "stats", 1, Infinity,
    a => { const v = numValues(a); return v.length ? Math.max(...v) : 0; },
    "MAX(số1, [số2], ...)", "=MAX(A1:A10)", "Giá trị lớn nhất.");

  add("MAXIFS", "stats", 3, Infinity,
    a => { const v = collectMultiConditional(a[0], a.slice(1), "MAXIFS").filter(isNumeric); return v.length ? Math.max(...v) : 0; },
    "MAXIFS(vùng_max, vùng_đk1, đk1, ...)", '=MAXIFS(B2:B10, A2:A10, "Kho A")', "Giá trị lớn nhất theo nhiều điều kiện.");

  add("COUNT", "stats", 0, Infinity,
    a => numValues(a).length,
    "COUNT(vùng1, [vùng2], ...)", "=COUNT(A1:A20)", "Đếm số ô chứa giá trị số.");

  add("COUNTA", "stats", 0, Infinity,
    a => flatten(a).filter(v => v !== null && v !== undefined && v !== "").length,
    "COUNTA(vùng1, [vùng2], ...)", "=COUNTA(A1:A20)", "Đếm số ô không trống (số, chữ, logic).");

  add("COUNTBLANK", "stats", 1, Infinity,
    a => flatten(a).filter(v => v === null || v === undefined || v === "").length,
    "COUNTBLANK(vùng)", "=COUNTBLANK(A1:A20)", "Đếm số ô trống trong vùng.");

  add("COUNTIF", "stats", 2, 2,
    a => collectConditional(a[0], a[1], undefined, "COUNTIF").length,
    "COUNTIF(vùng, điều_kiện)", '=COUNTIF(A2:A20, ">=5")', "Đếm số ô thỏa mãn một điều kiện.");

  add("COUNTIFS", "stats", 2, Infinity,
    a => collectMultiConditional(null, a, "COUNTIFS").length,
    "COUNTIFS(vùng_đk1, đk1, [vùng_đk2, đk2], ...)", '=COUNTIFS(A2:A20, "Nam", B2:B20, ">18")', "Đếm số dòng thỏa đồng thời nhiều điều kiện.");

  const varianceOf = (vals, sample) => {
    const minN = sample ? 2 : 1;
    if (vals.length < minN) fail("#DIV/0!", sample ? "Cần ít nhất 2 số để tính phương sai/độ lệch chuẩn mẫu." : "Cần ít nhất 1 số.");
    const mean = vals.reduce((s, n) => s + n, 0) / vals.length;
    return vals.reduce((s, n) => s + (n - mean) ** 2, 0) / (sample ? vals.length - 1 : vals.length);
  };

  add("VAR.S", "stats", 1, Infinity, a => varianceOf(numValues(a), true), "VAR.S(vùng1, ...)", "=VAR.S(A1:A10)", "Phương sai mẫu (n-1).");
  alias("VAR", "VAR.S");
  add("VAR.P", "stats", 1, Infinity, a => varianceOf(numValues(a), false), "VAR.P(vùng1, ...)", "=VAR.P(A1:A10)", "Phương sai tổng thể (n).");
  alias("VARP", "VAR.P");

  add("STDEV.S", "stats", 1, Infinity, a => Math.sqrt(varianceOf(numValues(a), true)), "STDEV.S(vùng1, ...)", "=STDEV.S(A1:A10)", "Độ lệch chuẩn mẫu (n-1).");
  alias("STDEV", "STDEV.S");
  add("STDEV.P", "stats", 1, Infinity, a => Math.sqrt(varianceOf(numValues(a), false)), "STDEV.P(vùng1, ...)", "=STDEV.P(A1:A10)", "Độ lệch chuẩn tổng thể (n).");
  alias("STDEVP", "STDEV.P");

  add("LARGE", "stats", 2, 2,
    a => { const v = numValues([a[0]]).sort((x, y) => y - x), k = toInt(a[1], "LARGE"); if (k < 1 || k > v.length) fail("#NUM!", "LARGE: thứ hạng k vượt phạm vi."); return v[k - 1]; },
    "LARGE(vùng, k)", "=LARGE(A1:A10, 2)", "Lấy giá trị lớn thứ k trong vùng.");

  add("SMALL", "stats", 2, 2,
    a => { const v = numValues([a[0]]).sort((x, y) => x - y), k = toInt(a[1], "SMALL"); if (k < 1 || k > v.length) fail("#NUM!", "SMALL: thứ hạng k vượt phạm vi."); return v[k - 1]; },
    "SMALL(vùng, k)", "=SMALL(A1:A10, 2)", "Lấy giá trị nhỏ thứ k trong vùng.");

  add("RANK.EQ", "stats", 2, 3,
    a => {
      const target = toNumber(a[0], "RANK.EQ");
      const vals = numValues([a[1]]);
      const asc = a.length > 2 && Boolean(toNumber(a[2], "RANK.EQ"));
      if (!vals.includes(target)) fail("#N/A", "Không tìm thấy giá trị cần xếp hạng trong vùng.");
      return 1 + vals.filter(v => (asc ? v < target : v > target)).length;
    },
    "RANK.EQ(số, vùng, [0=giảm|1=tăng])", "=RANK.EQ(B2, $B$2:$B$10, 0)", "Xếp hạng một số trong vùng dữ liệu.");
  alias("RANK", "RANK.EQ");

  const percentileInc = (vals, p) => {
    if (!vals.length || p < 0 || p > 1) fail("#NUM!", "Phân vị p phải nằm trong [0, 1].");
    const sorted = [...vals].sort((x, y) => x - y);
    const pos = p * (sorted.length - 1);
    const lo = Math.floor(pos), hi = Math.ceil(pos);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
  };

  add("PERCENTILE.INC", "stats", 2, 2,
    a => percentileInc(numValues([a[0]]), toNumber(a[1], "PERCENTILE.INC")),
    "PERCENTILE.INC(vùng, k)", "=PERCENTILE.INC(A1:A20, 0.9)", "Tính phân vị thứ k (k từ 0 đến 1).");
  alias("PERCENTILE", "PERCENTILE.INC");

  add("QUARTILE.INC", "stats", 2, 2,
    a => { const q = toInt(a[1], "QUARTILE.INC"); if (q < 0 || q > 4) fail("#NUM!", "QUARTILE nhận 0, 1, 2, 3 hoặc 4."); return percentileInc(numValues([a[0]]), q / 4); },
    "QUARTILE.INC(vùng, tứ_phân_vị_0_4)", "=QUARTILE.INC(A1:A20, 3)", "Tính tứ phân vị (0=Min, 1=Q1, 2=Median, 3=Q3, 4=Max).");
  alias("QUARTILE", "QUARTILE.INC");

  const pairedXY = (rawY, rawX, fnName) => {
    const ys = isRange(rawY) ? rawY.values : [rawY];
    const xs = isRange(rawX) ? rawX.values : [rawX];
    if (xs.length !== ys.length) fail("#N/A", `${fnName}: hai vùng phải cùng độ dài.`);
    const px = [], py = [];
    for (let i = 0; i < xs.length; i++) if (isNumeric(xs[i]) && isNumeric(ys[i])) { px.push(xs[i]); py.push(ys[i]); }
    if (px.length < 2) fail("#DIV/0!", `${fnName} cần ít nhất 2 cặp số.`);
    const mx = px.reduce((s, n) => s + n, 0) / px.length, my = py.reduce((s, n) => s + n, 0) / py.length;
    let sxx = 0, syy = 0, sxy = 0;
    for (let i = 0; i < px.length; i++) { const dx = px[i] - mx, dy = py[i] - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
    return { mx, my, sxx, syy, sxy };
  };

  add("CORREL", "stats", 2, 2,
    a => { const { sxx, syy, sxy } = pairedXY(a[0], a[1], "CORREL"); if (sxx === 0 || syy === 0) fail("#DIV/0!", "Phương sai bằng 0."); return sxy / Math.sqrt(sxx * syy); },
    "CORREL(vùng1, vùng2)", "=CORREL(A2:A10, B2:B10)", "Hệ số tương quan Pearson giữa hai dãy số.");

  add("SLOPE", "stats", 2, 2,
    a => { const { sxx, sxy } = pairedXY(a[0], a[1], "SLOPE"); if (sxx === 0) fail("#DIV/0!", "Giá trị X không đổi."); return sxy / sxx; },
    "SLOPE(vùng_Y, vùng_X)", "=SLOPE(B2:B10, A2:A10)", "Hệ số góc đường hồi quy tuyến tính.");

  add("INTERCEPT", "stats", 2, 2,
    a => { const { mx, my, sxx, sxy } = pairedXY(a[0], a[1], "INTERCEPT"); if (sxx === 0) fail("#DIV/0!", "Giá trị X không đổi."); return my - (sxy / sxx) * mx; },
    "INTERCEPT(vùng_Y, vùng_X)", "=INTERCEPT(B2:B10, A2:A10)", "Hệ số chặn (tung độ gốc) đường hồi quy tuyến tính.");

  // =========================================================================
  // 4. TRA CỨU & THAM CHIẾU (lookup)
  // =========================================================================
  const sameLookupValue = (a, b) => {
    if (typeof a === "string" && typeof b === "string") return a.toLocaleLowerCase() === b.toLocaleLowerCase();
    return a === b;
  };
  const compareLookup = (a, b) => {
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a ?? "").toLocaleLowerCase().localeCompare(String(b ?? "").toLocaleLowerCase());
  };

  add("VLOOKUP", "lookup", 3, 4,
    a => {
      const needle = a[0], mat = asMatrix(a[1], "VLOOKUP"), colIdx = toInt(a[2], "VLOOKUP");
      const approx = a.length >= 4 ? toBoolean(a[3], "VLOOKUP") : true;
      if (colIdx < 1 || colIdx > mat.cols) fail("#REF!", `VLOOKUP: cột trả về ${colIdx} nằm ngoài bảng (${mat.cols} cột).`);
      if (!approx) {
        for (let r = 0; r < mat.rows; r++) if (sameLookupValue(mat.grid[r][0], needle)) return mat.grid[r][colIdx - 1];
        fail("#N/A", "VLOOKUP không tìm thấy giá trị khớp chính xác.");
      }
      let matchRow = -1;
      for (let r = 0; r < mat.rows; r++) {
        const cell = mat.grid[r][0];
        if (cell === "" || cell === null || cell === undefined) continue;
        if (typeof cell === typeof needle && compareLookup(cell, needle) <= 0) matchRow = r;
      }
      if (matchRow < 0) fail("#N/A", "VLOOKUP không tìm thấy giá trị phù hợp.");
      return mat.grid[matchRow][colIdx - 1];
    },
    "VLOOKUP(giá_trị_tìm, bảng_dò, cột_trả_về, [FALSE=chính_xác])", '=VLOOKUP(A2, $E$2:$G$20, 2, FALSE)', "Dò tìm theo cột đầu tiên bên trái của bảng và trả về giá trị cùng hàng.");

  add("HLOOKUP", "lookup", 3, 4,
    a => {
      const needle = a[0], mat = asMatrix(a[1], "HLOOKUP"), rowIdx = toInt(a[2], "HLOOKUP");
      const approx = a.length >= 4 ? toBoolean(a[3], "HLOOKUP") : true;
      if (rowIdx < 1 || rowIdx > mat.rows) fail("#REF!", `HLOOKUP: hàng trả về ${rowIdx} nằm ngoài bảng (${mat.rows} hàng).`);
      if (!approx) {
        for (let c = 0; c < mat.cols; c++) if (sameLookupValue(mat.grid[0][c], needle)) return mat.grid[rowIdx - 1][c];
        fail("#N/A", "HLOOKUP không tìm thấy giá trị khớp chính xác.");
      }
      let matchCol = -1;
      for (let c = 0; c < mat.cols; c++) {
        const cell = mat.grid[0][c];
        if (cell === "" || cell === null || cell === undefined) continue;
        if (typeof cell === typeof needle && compareLookup(cell, needle) <= 0) matchCol = c;
      }
      if (matchCol < 0) fail("#N/A", "HLOOKUP không tìm thấy giá trị phù hợp.");
      return mat.grid[rowIdx - 1][matchCol];
    },
    "HLOOKUP(giá_trị_tìm, bảng_dò, hàng_trả_về, [FALSE=chính_xác])", '=HLOOKUP("Q1", A1:E4, 3, FALSE)', "Dò tìm theo hàng đầu tiên của bảng và trả về giá trị cùng cột.");

  add("XLOOKUP", "lookup", 3, 6,
    a => {
      const needle = a[0];
      const lookupArr = isRange(a[1]) ? a[1].values : [a[1]];
      const returnArr = isRange(a[2]) ? a[2].values : [a[2]];
      const hasFallback = a.length >= 4;
      const matchMode = a.length >= 5 ? toInt(a[4], "XLOOKUP") : 0; // 0 exact, -1 exact or smaller, 1 exact or larger, 2 wildcard
      const searchMode = a.length >= 6 ? toInt(a[5], "XLOOKUP") : 1; // 1 first-to-last, -1 last-to-first
      if (lookupArr.length !== returnArr.length) fail("#VALUE!", "XLOOKUP: vùng dò và vùng trả về phải cùng độ dài.");
      const indices = Array.from({ length: lookupArr.length }, (_, i) => (searchMode === -1 ? lookupArr.length - 1 - i : i));
      let foundIdx = -1;
      if (matchMode === 0) {
        foundIdx = indices.find(i => sameLookupValue(lookupArr[i], needle)) ?? -1;
      } else if (matchMode === 2) {
        foundIdx = indices.find(i => matchCriteria(lookupArr[i], String(needle))) ?? -1;
      } else if (matchMode === -1 || matchMode === 1) {
        let bestIdx = -1;
        for (const i of indices) {
          const v = lookupArr[i];
          if (sameLookupValue(v, needle)) { bestIdx = i; break; }
          if (typeof v !== typeof needle) continue;
          const cmp = compareLookup(v, needle);
          if (matchMode === -1 && cmp < 0 && (bestIdx === -1 || compareLookup(v, lookupArr[bestIdx]) > 0)) bestIdx = i;
          if (matchMode === 1 && cmp > 0 && (bestIdx === -1 || compareLookup(v, lookupArr[bestIdx]) < 0)) bestIdx = i;
        }
        foundIdx = bestIdx;
      }
      if (foundIdx === -1) {
        if (hasFallback) return a[3];
        fail("#N/A", "XLOOKUP không tìm thấy kết quả.");
      }
      return returnArr[foundIdx];
    },
    "XLOOKUP(tìm, vùng_dò, vùng_kết_quả, [nếu_không_thấy], [kiểu_khớp])", '=XLOOKUP(A2, D2:D20, E2:E20, "Chưa có")', "Hàm tra cứu hiện đại 2 chiều, thay thế VLOOKUP/HLOOKUP và cho phép đặt giá trị mặc định.");

  add("INDEX", "lookup", 2, 3,
    a => {
      const mat = asMatrix(a[0], "INDEX");
      const r = toInt(a[1], "INDEX");
      const c = a.length >= 3 ? toInt(a[2], "INDEX") : (mat.rows === 1 ? r : 1);
      const rr = (a.length < 3 && mat.rows === 1) ? 1 : r;
      if (rr < 1 || rr > mat.rows || c < 1 || c > mat.cols) fail("#REF!", "INDEX vượt kích thước vùng.");
      return mat.grid[rr - 1][c - 1];
    },
    "INDEX(vùng, số_hàng, [số_cột])", "=INDEX(A2:C10, 3, 2)", "Trả về giá trị tại vị trí hàng và cột trong vùng.");

  add("MATCH", "lookup", 2, 3,
    a => {
      const needle = a[0];
      const arr = isRange(a[1]) ? a[1].values : [a[1]];
      const type = a.length >= 3 ? toInt(a[2], "MATCH") : 1;
      if (type === 0) {
        const idx = arr.findIndex(v => (typeof needle === "string" && /[*?]/.test(needle) ? matchCriteria(v, needle) : sameLookupValue(v, needle)));
        if (idx === -1) fail("#N/A", "MATCH không tìm thấy giá trị khớp chính xác.");
        return idx + 1;
      }
      let best = -1;
      for (let i = 0; i < arr.length; i++) {
        if (typeof arr[i] !== typeof needle) continue;
        const cmp = compareLookup(arr[i], needle);
        if (type > 0 && cmp <= 0) best = i;
        else if (type < 0 && cmp >= 0) best = i;
      }
      if (best === -1) fail("#N/A", "MATCH không tìm thấy vị trí phù hợp.");
      return best + 1;
    },
    "MATCH(giá_trị_tìm, vùng_1_chiều, [0=chính_xác])", '=MATCH("Hà Nội", A2:A20, 0)', "Tìm vị trí (bắt đầu từ 1) của giá trị trong cột hoặc hàng.");

  add("LOOKUP", "lookup", 2, 3,
    a => {
      const needle = a[0];
      const vec = isRange(a[1]) ? a[1].values : [a[1]];
      const res = a.length >= 3 ? (isRange(a[2]) ? a[2].values : [a[2]]) : vec;
      let best = -1;
      for (let i = 0; i < vec.length; i++) if (typeof vec[i] === typeof needle && compareLookup(vec[i], needle) <= 0) best = i;
      if (best === -1 || best >= res.length) fail("#N/A", "LOOKUP không tìm thấy giá trị.");
      return res[best];
    },
    "LOOKUP(giá_trị_tìm, vùng_tìm, [vùng_kết_quả])", "=LOOKUP(75, A2:A5, B2:B5)", "Dò tìm gần đúng trên vùng đã sắp tăng dần.");

  add("CHOOSE", "lookup", 2, Infinity,
    a => { const idx = toInt(a[0], "CHOOSE"); if (idx < 1 || idx >= a.length) fail("#VALUE!", `CHOOSE: chỉ số ${idx} vượt phạm vi.`); return a[idx]; },
    "CHOOSE(chỉ_số, giá_trị1, giá_trị2, ...)", '=CHOOSE(2, "Thấp", "Trung bình", "Cao")', "Chọn một giá trị từ danh sách theo số thứ tự.");

  add("ROWS", "lookup", 1, 1, a => (isRange(a[0]) ? a[0].rows : 1), "ROWS(vùng)", "=ROWS(A1:C10)", "Trả về số hàng của vùng.");
  add("COLUMNS", "lookup", 1, 1, a => (isRange(a[0]) ? a[0].cols : 1), "COLUMNS(vùng)", "=COLUMNS(A1:C10)", "Trả về số cột của vùng.");
  add("ROW", "lookup", 0, 1,
    (a, ctx) => {
      if (a.length === 0) { const p = parseCellAddress(ctx?.currentCell || "A1"); return p ? p.r : 1; }
      if (isRange(a[0])) { const p = parseCellAddress(String(a[0].ref || "").split(":")[0]); return p ? p.r : 1; }
      const p = parseCellAddress(ctx?.currentCell || "A1"); return p ? p.r : 1;
    },
    "ROW([vùng])", "=ROW()", "Trả về số thứ tự hàng của ô hiện tại hoặc đầu vùng.");
  add("COLUMN", "lookup", 0, 1,
    (a, ctx) => {
      if (a.length === 0) { const p = parseCellAddress(ctx?.currentCell || "A1"); return p ? p.c : 1; }
      if (isRange(a[0])) { const p = parseCellAddress(String(a[0].ref || "").split(":")[0]); return p ? p.c : 1; }
      const p = parseCellAddress(ctx?.currentCell || "A1"); return p ? p.c : 1;
    },
    "COLUMN([vùng])", "=COLUMN()", "Trả về số thứ tự cột (A=1, B=2...) của ô hiện tại.");

  // =========================================================================
  // 5. VĂN BẢN (text)
  // =========================================================================
  add("CONCAT", "text", 1, Infinity,
    a => flatten(a).map(toStringVal).join(""),
    "CONCAT(chuỗi1, [chuỗi2], ...)", '=CONCAT(A2, " ", B2)', "Nối nhiều chuỗi hoặc vùng ô lại với nhau.");
  alias("CONCATENATE", "CONCAT");

  add("TEXTJOIN", "text", 3, Infinity,
    a => {
      const delim = toStringVal(a[0]);
      const ignoreEmpty = toBoolean(a[1], "TEXTJOIN");
      const items = flatten(a.slice(2)).map(toStringVal).filter(s => !ignoreEmpty || s !== "");
      return items.join(delim);
    },
    "TEXTJOIN(ký_tự_nối, bỏ_ô_trống, chuỗi1, ...)", '=TEXTJOIN(", ", TRUE, A2:A6)', "Nối các chuỗi bằng dấu phân cách và tùy chọn bỏ qua ô trống.");

  add("LEFT", "text", 1, 2,
    a => { const s = toStringVal(a[0]), n = a.length > 1 ? toInt(a[1], "LEFT") : 1; if (n < 0) fail("#VALUE!", "LEFT cần số ký tự ≥ 0."); return s.slice(0, n); },
    "LEFT(chuỗi, [số_ký_tự])", '=LEFT("HD-2026", 2)', "Lấy n ký tự từ bên trái chuỗi.");

  add("RIGHT", "text", 1, 2,
    a => { const s = toStringVal(a[0]), n = a.length > 1 ? toInt(a[1], "RIGHT") : 1; if (n < 0) fail("#VALUE!", "RIGHT cần số ký tự ≥ 0."); return n === 0 ? "" : s.slice(-n); },
    "RIGHT(chuỗi, [số_ký_tự])", '=RIGHT("HD-2026", 4)', "Lấy n ký tự từ bên phải chuỗi.");

  add("MID", "text", 3, 3,
    a => { const s = toStringVal(a[0]), start = toInt(a[1], "MID"), count = toInt(a[2], "MID"); if (start < 1 || count < 0) fail("#VALUE!", "MID cần vị trí ≥ 1 và số ký tự ≥ 0."); return s.slice(start - 1, start - 1 + count); },
    "MID(chuỗi, vị_trí_bắt_đầu, số_ký_tự)", '=MID("SP-105-VN", 4, 3)', "Trích chuỗi con từ vị trí chỉ định (bắt đầu từ 1).");

  add("LEN", "text", 1, 1, a => toStringVal(a[0]).length, "LEN(chuỗi)", '=LEN("Xin chào")', "Đếm số ký tự trong chuỗi.");

  add("TRIM", "text", 1, 1, a => toStringVal(a[0]).trim().replace(/\s+/g, " "), "TRIM(chuỗi)", '=TRIM("  Hai   Đất  ")', "Xóa khoảng trắng thừa ở đầu, cuối và giữa các từ.");

  add("CLEAN", "text", 1, 1, a => toStringVal(a[0]).replace(/[\x00-\x1F\x7F]/g, ""), "CLEAN(chuỗi)", "=CLEAN(A1)", "Loại bỏ các ký tự điều khiển không in được.");

  add("UPPER", "text", 1, 1, a => toStringVal(a[0]).toLocaleUpperCase("vi-VN"), "UPPER(chuỗi)", '=UPPER("hai đất")', "Chuyển toàn bộ chuỗi sang CHỮ IN HOA.");
  add("LOWER", "text", 1, 1, a => toStringVal(a[0]).toLocaleLowerCase("vi-VN"), "LOWER(chuỗi)", '=LOWER("HAI ĐẤT")', "Chuyển toàn bộ chuỗi sang chữ thường.");
  add("PROPER", "text", 1, 1,
    a => toStringVal(a[0]).toLocaleLowerCase("vi-VN").replace(/(^|[\s\-/.,;:(])(\p{L})/gu, (_, sep, ch) => sep + ch.toLocaleUpperCase("vi-VN")),
    "PROPER(chuỗi)", '=PROPER("nguyễn văn an")', "Viết Hoa Chữ Cái Đầu Mỗi Từ (hỗ trợ tiếng Việt).");

  add("FIND", "text", 2, 3,
    a => { const sub = toStringVal(a[0]), str = toStringVal(a[1]), start = a.length > 2 ? toInt(a[2], "FIND") : 1; if (start < 1) fail("#VALUE!", "FIND cần vị trí bắt đầu ≥ 1."); const pos = str.indexOf(sub, start - 1); if (pos === -1) fail("#VALUE!", "FIND không tìm thấy chuỗi."); return pos + 1; },
    "FIND(chuỗi_tìm, chuỗi_nguồn, [từ_vị_trí])", '=FIND("-", "SP-2026")', "Tìm vị trí chuỗi con (CÓ phân biệt chữ hoa/thường).");

  add("SEARCH", "text", 2, 3,
    a => {
      const pat = toStringVal(a[0]), str = toStringVal(a[1]), start = a.length > 2 ? toInt(a[2], "SEARCH") : 1;
      if (start < 1) fail("#VALUE!", "SEARCH cần vị trí bắt đầu ≥ 1.");
      const slice = str.slice(start - 1);
      const rx = new RegExp(pat.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, "."), "i");
      const m = rx.exec(slice);
      if (!m) fail("#VALUE!", "SEARCH không tìm thấy chuỗi.");
      return start + m.index;
    },
    "SEARCH(chuỗi_tìm, chuỗi_nguồn, [từ_vị_trí])", '=SEARCH("sp", "Mã SP-01")', "Tìm vị trí chuỗi con (KHÔNG phân biệt hoa/thường, hỗ trợ * và ?).");

  add("SUBSTITUTE", "text", 3, 4,
    a => {
      const str = toStringVal(a[0]), oldStr = toStringVal(a[1]), newStr = toStringVal(a[2]);
      if (!oldStr) return str;
      if (a.length < 4) return str.split(oldStr).join(newStr);
      const nth = toInt(a[3], "SUBSTITUTE");
      if (nth < 1) fail("#VALUE!", "SUBSTITUTE: lần xuất hiện phải ≥ 1.");
      let count = 0, idx = 0;
      while ((idx = str.indexOf(oldStr, idx)) !== -1) {
        count++;
        if (count === nth) return str.slice(0, idx) + newStr + str.slice(idx + oldStr.length);
        idx += oldStr.length;
      }
      return str;
    },
    "SUBSTITUTE(chuỗi, cũ, mới, [lần_thứ])", '=SUBSTITUTE("2025-01", "2025", "2026")', "Thay thế chuỗi cũ bằng chuỗi mới.");

  add("REPLACE", "text", 4, 4,
    a => { const str = toStringVal(a[0]), start = toInt(a[1], "REPLACE"), len = toInt(a[2], "REPLACE"), rep = toStringVal(a[3]); if (start < 1 || len < 0) fail("#VALUE!", "REPLACE: tham số vị trí/độ dài không hợp lệ."); return str.slice(0, start - 1) + rep + str.slice(start - 1 + len); },
    "REPLACE(chuỗi, từ_vị_trí, số_ký_tự, chuỗi_mới)", '=REPLACE("ABCDEF", 2, 3, "123")', "Thay thế một đoạn ký tự theo vị trí và độ dài.");

  add("REPT", "text", 2, 2,
    a => { const s = toStringVal(a[0]), n = toInt(a[1], "REPT"); if (n < 0 || s.length * n > 32767) fail("#VALUE!", "REPT vượt giới hạn chuỗi."); return s.repeat(n); },
    "REPT(chuỗi, số_lần)", '=REPT("★", 5)', "Lặp lại một chuỗi n lần.");

  add("EXACT", "text", 2, 2,
    a => toStringVal(a[0]) === toStringVal(a[1]),
    "EXACT(chuỗi1, chuỗi2)", '=EXACT("Abc", "abc")', "So sánh 2 chuỗi có khớp chính xác cả chữ hoa/thường không.");

  add("VALUE", "text", 1, 1,
    a => {
      if (isNumeric(a[0])) return a[0];
      const raw = toStringVal(a[0]).trim().replace(/,/g, "");
      const pct = raw.endsWith("%");
      const n = Number(pct ? raw.slice(0, -1) : raw);
      if (!raw || !Number.isFinite(n)) fail("#VALUE!", "VALUE không chuyển được thành số.");
      return pct ? n / 100 : n;
    },
    "VALUE(chuỗi_số)", '=VALUE("1,250.5")', "Chuyển chuỗi dạng số sang giá trị số thực.");

  add("NUMBERVALUE", "text", 1, 3,
    a => {
      const dec = a.length >= 2 ? toStringVal(a[1]) : ".", grp = a.length >= 3 ? toStringVal(a[2]) : ",";
      let s = toStringVal(a[0]).replace(/\s+/g, "");
      if (grp) s = s.split(grp).join("");
      if (dec && dec !== ".") s = s.replace(dec, ".");
      const n = Number(s);
      if (!s || !Number.isFinite(n)) fail("#VALUE!", "NUMBERVALUE không chuyển được thành số.");
      return n;
    },
    "NUMBERVALUE(chuỗi, [dấu_thập_phân], [dấu_hàng_nghìn])", '=NUMBERVALUE("1.250,5", ",", ".")', "Chuyển chuỗi số theo chuẩn dấu Việt Nam/quốc tế sang số.");

  add("TEXT", "text", 2, 2,
    a => {
      const val = a[0], fmt = toStringVal(a[1]);
      if (/[ymd]/i.test(fmt) && !fmt.includes("#") && !fmt.includes("0")) {
        const d = parseExcelDate(val);
        if (d) {
          const pad = n => String(n).padStart(2, "0");
          return fmt
            .replace(/yyyy/gi, String(d.getFullYear()))
            .replace(/yy/gi, String(d.getFullYear()).slice(-2))
            .replace(/mm/gi, pad(d.getMonth() + 1))
            .replace(/dd/gi, pad(d.getDate()));
        }
      }
      const n = toNumber(val, "TEXT");
      if (fmt.includes("%")) {
        const decMatch = fmt.match(/\.(0+)/);
        const dp = decMatch ? decMatch[1].length : 0;
        return (n * 100).toFixed(dp) + "%";
      }
      const decMatch = fmt.match(/\.(0+|#+)/);
      const dp = decMatch ? decMatch[1].length : 0;
      const useGroup = fmt.includes(",");
      return new Intl.NumberFormat("en-US", { useGrouping: useGroup, minimumFractionDigits: dp, maximumFractionDigits: dp }).format(n);
    },
    "TEXT(giá_trị, định_dạng)", '=TEXT(1250000, "#,##0")', "Định dạng số hoặc ngày thành chuỗi theo mẫu.");

  add("CHAR", "text", 1, 1, a => { const c = toInt(a[0], "CHAR"); if (c < 1 || c > 65535) fail("#VALUE!", "Mã ký tự không hợp lệ."); return String.fromCharCode(c); }, "CHAR(mã_số)", "=CHAR(65)", "Trả về ký tự ứng với mã số.");
  add("CODE", "text", 1, 1, a => { const s = toStringVal(a[0]); if (!s.length) fail("#VALUE!", "Chuỗi rỗng."); return s.charCodeAt(0); }, "CODE(chuỗi)", '=CODE("A")', "Trả về mã số ký tự đầu tiên.");
  add("T", "text", 1, 1, a => (typeof a[0] === "string" ? a[0] : ""), "T(giá_trị)", "=T(A1)", "Trả về chuỗi nếu là văn bản, ngược lại trả chuỗi rỗng.");

  // =========================================================================
  // 6. NGÀY & GIỜ (date)
  // =========================================================================
  const requireDate = (v, name) => {
    const d = parseExcelDate(v);
    if (!d) fail("#VALUE!", `${name} cần ngày hợp lệ (vd "2026-11-24", "24/11/2026" hoặc hàm DATE).`);
    return d;
  };

  add("TODAY", "date", 0, 0, () => formatIsoDate(new Date()), "TODAY()", "=TODAY()", "Trả về ngày hiện tại (YYYY-MM-DD).");
  add("NOW", "date", 0, 0, () => formatIsoDateTime(new Date()), "NOW()", "=NOW()", "Trả về ngày và giờ hiện tại.");

  add("DATE", "date", 3, 3,
    a => { const y = toInt(a[0], "DATE"), m = toInt(a[1], "DATE"), d = toInt(a[2], "DATE"); return formatIsoDate(new Date(y, m - 1, d)); },
    "DATE(năm, tháng, ngày)", "=DATE(2026, 11, 24)", "Tạo ngày từ năm, tháng, ngày.");

  add("YEAR", "date", 1, 1, a => requireDate(a[0], "YEAR").getFullYear(), "YEAR(ngày)", "=YEAR(TODAY())", "Lấy năm từ một ngày.");
  add("MONTH", "date", 1, 1, a => requireDate(a[0], "MONTH").getMonth() + 1, "MONTH(ngày)", "=MONTH(TODAY())", "Lấy tháng (1–12) từ một ngày.");
  add("DAY", "date", 1, 1, a => requireDate(a[0], "DAY").getDate(), "DAY(ngày)", "=DAY(TODAY())", "Lấy ngày trong tháng (1–31).");

  add("WEEKDAY", "date", 1, 2,
    a => {
      const dow = requireDate(a[0], "WEEKDAY").getDay(); // 0=Sun..6=Sat
      const mode = a.length > 1 ? toInt(a[1], "WEEKDAY") : 1;
      if (mode === 1) return dow + 1; // 1=CN..7=T7
      if (mode === 2) return dow === 0 ? 7 : dow; // 1=T2..7=CN
      if (mode === 3) return dow === 0 ? 6 : dow - 1; // 0=T2..6=CN
      fail("#NUM!", "WEEKDAY hỗ trợ kiểu trả về 1, 2 hoặc 3.");
    },
    "WEEKDAY(ngày, [kiểu_1_2_3])", "=WEEKDAY(TODAY(), 2)", "Trả về thứ trong tuần (kiểu 2: Thứ Hai=1 .. Chủ Nhật=7).");

  add("ISOWEEKNUM", "date", 1, 1,
    a => {
      const d = requireDate(a[0], "ISOWEEKNUM");
      const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const dayNum = tmp.getUTCDay() || 7;
      tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
      return Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
    },
    "ISOWEEKNUM(ngày)", "=ISOWEEKNUM(TODAY())", "Trả về số tuần theo chuẩn ISO trong năm (1–53).");

  add("DAYS", "date", 2, 2,
    a => daysBetween(requireDate(a[1], "DAYS"), requireDate(a[0], "DAYS")),
    "DAYS(ngày_kết_thúc, ngày_bắt_đầu)", '=DAYS("2026-12-31", TODAY())', "Tính số ngày giữa hai mốc thời gian.");

  add("DATEDIF", "date", 3, 3,
    a => {
      const start = requireDate(a[0], "DATEDIF"), end = requireDate(a[1], "DATEDIF");
      const unit = toStringVal(a[2]).toUpperCase();
      if (end < start) fail("#NUM!", "DATEDIF: ngày kết thúc phải ≥ ngày bắt đầu.");
      if (unit === "D") return daysBetween(start, end);
      let years = end.getFullYear() - start.getFullYear();
      let months = end.getMonth() - start.getMonth();
      let days = end.getDate() - start.getDate();
      if (days < 0) { months--; const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0); days += prevMonth.getDate(); }
      if (months < 0) { years--; months += 12; }
      if (unit === "Y") return years;
      if (unit === "M") return years * 12 + months;
      if (unit === "YM") return months;
      if (unit === "MD") return days;
      if (unit === "YD") { const anniv = new Date(start.getFullYear() + years, start.getMonth(), start.getDate()); return daysBetween(anniv, end); }
      fail("#NUM!", 'DATEDIF hỗ trợ đơn vị "Y", "M", "D", "YM", "MD", "YD".');
    },
    'DATEDIF(ngày_đầu, ngày_cuối, "Y"|"M"|"D")', '=DATEDIF("2020-01-15", TODAY(), "Y")', "Tính khoảng cách theo năm, tháng hoặc ngày (rất tiện tính tuổi / thâm niên).");

  add("EDATE", "date", 2, 2,
    a => {
      const d = requireDate(a[0], "EDATE"), addM = toInt(a[1], "EDATE");
      const targetMonth = d.getMonth() + addM;
      const lastDay = new Date(d.getFullYear(), targetMonth + 1, 0).getDate();
      return formatIsoDate(new Date(d.getFullYear(), targetMonth, Math.min(d.getDate(), lastDay)));
    },
    "EDATE(ngày_đầu, số_tháng)", "=EDATE(TODAY(), 6)", "Cộng hoặc trừ đúng số tháng từ một ngày.");

  add("EOMONTH", "date", 2, 2,
    a => { const d = requireDate(a[0], "EOMONTH"), addM = toInt(a[1], "EOMONTH"); return formatIsoDate(new Date(d.getFullYear(), d.getMonth() + addM + 1, 0)); },
    "EOMONTH(ngày_đầu, số_tháng)", "=EOMONTH(TODAY(), 0)", "Trả về ngày cuối cùng của tháng sau khi cộng/trừ số tháng.");

  add("NETWORKDAYS", "date", 2, 3,
    a => {
      const s = requireDate(a[0], "NETWORKDAYS"), e = requireDate(a[1], "NETWORKDAYS");
      const holidays = new Set(a.length >= 3 ? flatten([a[2]]).map(v => parseExcelDate(v)).filter(Boolean).map(formatIsoDate) : []);
      const sign = e >= s ? 1 : -1;
      const cur = new Date(sign === 1 ? s : e), end = sign === 1 ? e : s;
      let count = 0;
      for (let d = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate()); d <= end; d.setDate(d.getDate() + 1)) {
        const wd = d.getDay();
        if (wd !== 0 && wd !== 6 && !holidays.has(formatIsoDate(d))) count++;
      }
      return sign * count;
    },
    "NETWORKDAYS(ngày_đầu, ngày_cuối, [ngày_lễ])", '=NETWORKDAYS("2026-11-01", "2026-11-30")', "Đếm số ngày làm việc (trừ Thứ Bảy, Chủ Nhật và ngày lễ).");

  add("TIME", "date", 3, 3,
    a => {
      const hh = toInt(a[0], "TIME"), mm = toInt(a[1], "TIME"), ss = toInt(a[2], "TIME");
      const total = ((hh * 3600 + mm * 60 + ss) % 86400 + 86400) % 86400;
      const h2 = Math.floor(total / 3600), m2 = Math.floor((total % 3600) / 60), s2 = total % 60;
      return [h2, m2, s2].map(n => String(n).padStart(2, "0")).join(":");
    },
    "TIME(giờ, phút, giây)", "=TIME(14, 30, 0)", "Tạo chuỗi thời gian HH:MM:SS.");

  const extractTimePart = (val, part, fnName) => {
    const s = toStringVal(val);
    const m = s.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (m) return Number(m[part] || 0);
    if (isNumeric(val)) { const sec = Math.round((((val % 1) + 1) % 1) * 86400); return part === 1 ? Math.floor(sec / 3600) : (part === 2 ? Math.floor((sec % 3600) / 60) : sec % 60); }
    fail("#VALUE!", `${fnName} cần giá trị giờ hợp lệ (vd "14:30:00" hoặc NOW()).`);
  };
  add("HOUR", "date", 1, 1, a => extractTimePart(a[0], 1, "HOUR"), "HOUR(thời_gian)", "=HOUR(NOW())", "Lấy giờ (0–23).");
  add("MINUTE", "date", 1, 1, a => extractTimePart(a[0], 2, "MINUTE"), "MINUTE(thời_gian)", "=MINUTE(NOW())", "Lấy phút (0–59).");
  add("SECOND", "date", 1, 1, a => extractTimePart(a[0], 3, "SECOND"), "SECOND(thời_gian)", "=SECOND(NOW())", "Lấy giây (0–59).");

  // =========================================================================
  // 7. TÀI CHÍNH (finance)
  // =========================================================================
  add("PMT", "finance", 3, 5,
    a => {
      const rate = toNumber(a[0], "PMT"), nper = toNumber(a[1], "PMT"), pv = toNumber(a[2], "PMT");
      const fv = a.length >= 4 ? toNumber(a[3], "PMT") : 0, type = a.length >= 5 ? toInt(a[4], "PMT") : 0;
      if (nper === 0) fail("#NUM!", "PMT: số kỳ phải khác 0.");
      if (rate === 0) return -(pv + fv) / nper;
      const pvif = (1 + rate) ** nper;
      let pmt = rate / (pvif - 1) * -(pv * pvif + fv);
      if (type === 1) pmt /= (1 + rate);
      return pmt;
    },
    "PMT(lãi_kỳ, số_kỳ, số_tiền_vay, [fv], [kiểu])", "=PMT(8%/12, 60, 200000000)", "Tính khoản thanh toán định kỳ cố định (trả góp / vay ngân hàng).");

  add("PV", "finance", 3, 5,
    a => {
      const rate = toNumber(a[0], "PV"), nper = toNumber(a[1], "PV"), pmt = toNumber(a[2], "PV");
      const fv = a.length >= 4 ? toNumber(a[3], "PV") : 0, type = a.length >= 5 ? toInt(a[4], "PV") : 0;
      if (rate === 0) return -(pmt * nper + fv);
      const pvif = (1 + rate) ** nper;
      return -(pmt * (1 + rate * type) * (pvif - 1) / rate + fv) / pvif;
    },
    "PV(lãi_kỳ, số_kỳ, khoản_trả_kỳ, [fv], [kiểu])", "=PV(6%/12, 36, -5000000)", "Tính giá trị hiện tại của một khoản đầu tư hoặc khoản vay.");

  add("FV", "finance", 3, 5,
    a => {
      const rate = toNumber(a[0], "FV"), nper = toNumber(a[1], "FV"), pmt = toNumber(a[2], "FV");
      const pv = a.length >= 4 ? toNumber(a[3], "FV") : 0, type = a.length >= 5 ? toInt(a[4], "FV") : 0;
      if (rate === 0) return -(pv + pmt * nper);
      const pvif = (1 + rate) ** nper;
      return -(pv * pvif + pmt * (1 + rate * type) * (pvif - 1) / rate);
    },
    "FV(lãi_kỳ, số_kỳ, góp_mỗi_kỳ, [pv], [kiểu])", "=FV(7%/12, 120, -2000000, 0)", "Tính giá trị tương lai (lãi kép tích lũy).");

  add("NPV", "finance", 2, Infinity,
    a => {
      const rate = toNumber(a[0], "NPV");
      if (rate <= -1) fail("#DIV/0!", "Lãi suất chiết khấu phải > -100%.");
      const flows = numValues(a.slice(1));
      return flows.reduce((acc, cf, i) => acc + cf / ((1 + rate) ** (i + 1)), 0);
    },
    "NPV(lãi_chiết_khấu, dòng_tiền1, [dòng_tiền2], ...)", "=NPV(10%, B2:B6)", "Giá trị hiện tại ròng của chuỗi dòng tiền đều kỳ.");

  add("NPER", "finance", 3, 5,
    a => {
      const rate = toNumber(a[0], "NPER"), pmt = toNumber(a[1], "NPER"), pv = toNumber(a[2], "NPER");
      const fv = a.length >= 4 ? toNumber(a[3], "NPER") : 0, type = a.length >= 5 ? toInt(a[4], "NPER") : 0;
      if (rate === 0) { if (pmt === 0) fail("#DIV/0!", "NPER không xác định."); return -(pv + fv) / pmt; }
      const z = pmt * (1 + rate * type) / rate;
      const ratio = (z - fv) / (pv + z);
      if (ratio <= 0) fail("#NUM!", "NPER không có nghiệm thực.");
      return Math.log(ratio) / Math.log(1 + rate);
    },
    "NPER(lãi_kỳ, trả_kỳ, số_tiền_vay, [fv], [kiểu])", "=NPER(8%/12, -5000000, 100000000)", "Tính số kỳ cần thiết để trả hết khoản vay hoặc đạt mục tiêu.");

  add("RATE", "finance", 3, 6,
    a => {
      const nper = toNumber(a[0], "RATE"), pmt = toNumber(a[1], "RATE"), pv = toNumber(a[2], "RATE");
      const fv = a.length >= 4 ? toNumber(a[3], "RATE") : 0, type = a.length >= 5 ? toInt(a[4], "RATE") : 0;
      let r = a.length >= 6 ? toNumber(a[5], "RATE") : 0.1;
      for (let iter = 0; iter < 100; iter++) {
        const f = Math.abs(r) < 1e-10
          ? pv + pmt * nper + fv
          : pv * (1 + r) ** nper + pmt * (1 + r * type) * (((1 + r) ** nper - 1) / r) + fv;
        if (Math.abs(f) < 1e-9) return r;
        const eps = 1e-7;
        const r2 = r + eps;
        const f2 = pv * (1 + r2) ** nper + pmt * (1 + r2 * type) * (((1 + r2) ** nper - 1) / r2) + fv;
        const df = (f2 - f) / eps;
        if (!Number.isFinite(df) || Math.abs(df) < 1e-12) fail("#NUM!", "RATE không hội tụ.");
        r -= f / df;
        if (r <= -1) r = -0.99;
      }
      fail("#NUM!", "RATE không hội tụ sau 100 vòng lặp.");
    },
    "RATE(số_kỳ, trả_kỳ, số_tiền_vay, [fv], [kiểu], [ước_đoán])", "=RATE(36, -3200000, 100000000)", "Tính lãi suất mỗi kỳ của khoản vay hoặc đầu tư.");

  add("SLN", "finance", 3, 3,
    a => { const cost = toNumber(a[0], "SLN"), salvage = toNumber(a[1], "SLN"), life = toNumber(a[2], "SLN"); if (life === 0) fail("#DIV/0!", "Thời gian sử dụng phải khác 0."); return (cost - salvage) / life; },
    "SLN(nguyên_giá, giá_trị_thu_hồi, số_năm)", "=SLN(50000000, 5000000, 5)", "Tính khấu hao đường thẳng mỗi kỳ.");

  // =========================================================================
  // 8. THÔNG TIN & KIỂM TRA (info)
  // =========================================================================
  add("ISBLANK", "info", 1, 1, a => a[0] === "" || a[0] === null || a[0] === undefined, "ISBLANK(ô)", "=ISBLANK(A1)", "Trả về TRUE nếu ô hoàn toàn trống.");
  add("ISNUMBER", "info", 1, 1, a => isNumeric(a[0]), "ISNUMBER(giá_trị)", "=ISNUMBER(A1)", "Trả về TRUE nếu giá trị là số.");
  add("ISTEXT", "info", 1, 1, a => typeof a[0] === "string" && a[0] !== "", "ISTEXT(giá_trị)", "=ISTEXT(A1)", "Trả về TRUE nếu giá trị là văn bản.");
  add("ISLOGICAL", "info", 1, 1, a => typeof a[0] === "boolean", "ISLOGICAL(giá_trị)", "=ISLOGICAL(A1)", "Trả về TRUE nếu giá trị là TRUE hoặc FALSE.");
  add("ISEVEN", "info", 1, 1, a => Math.trunc(toNumber(a[0], "ISEVEN")) % 2 === 0, "ISEVEN(số)", "=ISEVEN(4)", "Trả về TRUE nếu số là số chẵn.");
  add("ISODD", "info", 1, 1, a => Math.abs(Math.trunc(toNumber(a[0], "ISODD"))) % 2 === 1, "ISODD(số)", "=ISODD(5)", "Trả về TRUE nếu số là số lẻ.");

  add("ISERROR", "info", 1, 1, thunks => { try { thunks[0](); return false; } catch { return true; } }, "ISERROR(biểu_thức)", "=ISERROR(A1/B1)", "Trả về TRUE nếu biểu thức phát sinh bất kỳ lỗi nào.", true);
  add("ISERR", "info", 1, 1, thunks => { try { thunks[0](); return false; } catch (e) { return e?.code !== "#N/A"; } }, "ISERR(biểu_thức)", "=ISERR(A1/B1)", "Trả về TRUE nếu có lỗi trừ #N/A.", true);
  add("ISNA", "info", 1, 1, thunks => { try { thunks[0](); return false; } catch (e) { return e?.code === "#N/A"; } }, "ISNA(biểu_thức)", "=ISNA(VLOOKUP(A1, D1:E5, 2, FALSE))", "Trả về TRUE nếu kết quả là lỗi #N/A.", true);

  add("N", "info", 1, 1, a => (isNumeric(a[0]) ? a[0] : (typeof a[0] === "boolean" ? (a[0] ? 1 : 0) : 0)), "N(giá_trị)", "=N(TRUE)", "Chuyển giá trị thành số (TRUE→1, chữ→0).");
  add("TYPE", "info", 1, 1,
    thunks => {
      try {
        const v = thunks[0]();
        if (isNumeric(v)) return 1;
        if (typeof v === "string") return 2;
        if (typeof v === "boolean") return 4;
        if (isRange(v)) return 64;
        return 2;
      } catch { return 16; }
    },
    "TYPE(giá_trị)", "=TYPE(A1)", "Trả về mã kiểu dữ liệu (1=Số, 2=Chữ, 4=Logic, 16=Lỗi, 64=Mảng).", true);
}
