# Nguyên tắc đặt tên & đăng ký hàm — HAI ĐẤT CALC (SGHT)

Tài liệu này quy định chuẩn đặt tên, phân nhóm và cấu trúc đăng ký hàm bảng tính trong `calc/engine/core.js` và `calc/engine/functions-standard.js` nhằm đảm bảo **tương thích chuẩn công thức mở OpenFormula (ODF)**, **dễ nhớ cho người dùng** và **dễ mở rộng cho lập trình viên**.

---

## 1. Quy tắc đặt tên hàm (bắt buộc)

1. **Chữ HOA tiếng Anh không dấu theo chuẩn công thức bảng tính quốc tế (OpenFormula):**
   - Định dạng regex: `^[A-Z][A-Z0-9_]*(\.[A-Z0-9_]+)*$`
   - Không đặt tên hàm gốc có dấu tiếng Việt để tương thích 100% khi nhập/xuất CSV, đối chiếu công thức theo chuẩn bảng tính quốc tế và tránh lỗi gõ bộ gõ Telex/VNI.
   - Mọi nhãn nhóm, cú pháp gợi ý, ví dụ và giải thích đều trình bày bằng **tiếng Việt dễ hiểu**.

2. **Đặt tên theo mẫu (Pattern-based — đoán được ngay tên hàm):**
   | Mẫu tên | Quy tắc | Ví dụ |
   |---|---|---|
   | `<HÀM>IF` / `<HÀM>IFS` | 1 điều kiện (`IF`) / nhiều điều kiện (`IFS`) | `SUMIF`, `SUMIFS`, `COUNTIF`, `COUNTIFS`, `AVERAGEIF`, `AVERAGEIFS`, `MAXIFS`, `MINIFS` |
   | `IF<TÌNH_HUỐNG>` | Rẽ nhánh & xử lý lỗi | `IF`, `IFS`, `IFERROR`, `IFNA`, `SWITCH` |
   | `IS<KIỂU>` | Kiểm tra kiểu dữ liệu (luôn trả `TRUE`/`FALSE`) | `ISBLANK`, `ISNUMBER`, `ISTEXT`, `ISLOGICAL`, `ISERROR`, `ISERR`, `ISNA`, `ISEVEN`, `ISODD` |
   | `<CHIỀU>LOOKUP` | Tra cứu theo chiều | `VLOOKUP` (dọc), `HLOOKUP` (ngang), `XLOOKUP` (hiện đại 2 chiều) |
   | `<HÀM>.S` / `<HÀM>.P` | Thống kê mẫu (Sample) / tổng thể (Population) | `STDEV.S`, `STDEV.P`, `VAR.S`, `VAR.P` |
   | `<HÀM>.INC` / `.EQ` / `.SNGL` | Chuẩn hiện đại kèm **alias ngắn** quen thuộc | `RANK.EQ` (`RANK`), `PERCENTILE.INC` (`PERCENTILE`), `QUARTILE.INC` (`QUARTILE`), `MODE.SNGL` (`MODE`) |
   | `ROUND<HƯỚNG>` | Làm tròn theo hướng rõ nghĩa | `ROUND`, `ROUNDUP`, `ROUNDDOWN`, `MROUND`, `CEILING.MATH` (`CEILING`), `FLOOR.MATH` (`FLOOR`) |

3. **Alias tương thích ngược (dùng `registerFormulaAlias`):**
   - Không nhân bản code cho tên cũ (`STDEV`, `VAR`, `RANK`, `CONCATENATE`, `CEILING`, `FLOOR`…).
   - Đăng ký 1 hàm chuẩn rồi khai báo `alias("STDEV", "STDEV.S")` — vừa gõ được cả 2 tên, vừa không làm trùng lặp danh sách thư viện hàm.

---

## 2. 8 nhóm hàm chuẩn (`FUNCTION_CATEGORIES`)

| Mã nhóm (`category`) | Tên hiển thị | Phạm vi |
|---|---|---|
| `math` | Toán học | Cộng, tích, làm tròn, lượng giác, logarit, lũy thừa, điều kiện `SUMIF/SUMIFS`, `SUBTOTAL` |
| `logic` | Logic & Điều kiện | `IF`, `IFS`, `SWITCH`, `AND`, `OR`, `XOR`, `NOT`, `IFERROR`, `IFNA` |
| `stats` | Thống kê | `AVERAGE*`, `COUNT*`, `MIN*`, `MAX*`, `MEDIAN`, `MODE.SNGL`, `STDEV.*`, `VAR.*`, `RANK.EQ`, `PERCENTILE.INC`, `CORREL`, `SLOPE`, `INTERCEPT` |
| `lookup` | Tra cứu | `VLOOKUP`, `HLOOKUP`, `XLOOKUP`, `INDEX`, `MATCH`, `LOOKUP`, `CHOOSE`, `ROW`, `COLUMN`, `ROWS`, `COLUMNS` |
| `text` | Văn bản | `CONCAT`, `TEXTJOIN`, `LEFT`, `RIGHT`, `MID`, `LEN`, `TRIM`, `UPPER`, `LOWER`, `PROPER`, `FIND`, `SEARCH`, `SUBSTITUTE`, `REPLACE`, `TEXT`, `VALUE`, `NUMBERVALUE` |
| `date` | Ngày & Giờ | `TODAY`, `NOW`, `DATE`, `YEAR`, `MONTH`, `DAY`, `WEEKDAY`, `DAYS`, `DATEDIF`, `EDATE`, `EOMONTH`, `NETWORKDAYS`, `TIME`, `HOUR`, `MINUTE`, `SECOND` |
| `finance` | Tài chính | `PMT`, `PV`, `FV`, `NPV`, `NPER`, `RATE`, `SLN` |
| `info` | Kiểm tra | `ISBLANK`, `ISNUMBER`, `ISTEXT`, `ISLOGICAL`, `ISERROR`, `ISERR`, `ISNA`, `ISEVEN`, `ISODD`, `N`, `TYPE` |

---

## 3. Cú pháp mở rộng được bộ máy hỗ trợ

- Tham chiếu cố định `$A$1`, `$A$1:$C$20` và tham chiếu liên trang `'Trang tính 2'!A1:B5`.
- Dấu tách tham số hỗ trợ cả dấu phẩy `,` và dấu chấm phẩy `;` (`=IF(A1>5; "Đạt"; "Trượt")`).
- Toán tử nối chuỗi `&` (`="Tổng: " & TEXT(SUM(A1:A5), "#,##0")`).
- Toán tử phần trăm hậu tố `%` (`=200*15%`, `=PMT(8%/12, 60, 200000000)`).
- Đánh giá lười (`lazy: true`) cho `IF`, `IFS`, `SWITCH`, `AND`, `OR`, `IFERROR`, `IFNA`, `ISERROR`, `ISERR`, `ISNA` để tránh lỗi ở nhánh không chạy (ví dụ `=IF(B1=0, 0, A1/B1)`).

---

## 4. Cách thêm hàm mới (Single Source of Truth — chỉ sửa 1 chỗ)

Trong `calc/engine/functions-standard.js`, gọi `add(...)` một lần duy nhất:

```js
add(
  "TENHAM",          // 1. Tên viết HOA theo quy tắc
  "math",            // 2. Nhóm trong FUNCTION_CATEGORIES
  1, 2,              // 3. minArgs, maxArgs (Infinity nếu không giới hạn)
  a => { /* ... */ },// 4. Hàm xử lý thuần, dùng helpers trong h (toNumber, matchCriteria...)
  "TENHAM(x, [y])",  // 5. Cú pháp gợi ý tiếng Việt
  "=TENHAM(A1, 2)",  // 6. Ví dụ chạy được ngay
  "Mô tả ngắn gọn.", // 7. Giải thích tiếng Việt
  false              // 8. lazy = true nếu cần bắt lỗi hoặc đánh giá điều kiện
);
```

Khi đăng ký xong, hàm mới **tự động** xuất hiện đồng bộ tại 4 nơi:
1. Bộ tính công thức `evaluateFormula()`
2. Menu tự gợi ý khi gõ `=` trên thanh công thức (`#formulaSuggest`)
3. Ngăn kéo `fx Thư viện hàm` (`#functionLibraryPanel`)
4. Bộ đề xuất sửa lỗi chính tả tên hàm (`suggestFormulaRepairs`)

---

> **Ghi chú tiêu chuẩn mở:** Tên hàm trong HAI ĐẤT CALC tuân theo chuẩn công thức mở quốc tế (OASIS OpenFormula / ODF). HAI ĐẤT OFFICE là dự án độc lập, không liên kết hay đại diện cho bất kỳ bên thứ ba nào (xem [Trang Pháp lý](../legal/) và [`LICENSE`](../LICENSE)).
