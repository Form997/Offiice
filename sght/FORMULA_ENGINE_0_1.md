# HAI ĐẤT SGHT — Formula Engine 0.1

**Ngày bắt đầu:** 18-11-2026  
**Phạm vi:** nền móng bộ máy công thức tự phát triển.  
**Nguyên tắc:** không dùng `eval`, `new Function`, thư viện tính toán bên ngoài hoặc sao chép mã nguồn Excel/Google Sheets.

## Kiến trúc đầu tiên

- Tokenizer: nhận diện số, chuỗi, ô, vùng ô, tên hàm và toán tử.
- Parser: phân tích biểu thức theo độ ưu tiên toán tử.
- Evaluator: thực thi cây biểu thức an toàn.
- Function registry: đăng ký hàm theo hợp đồng `min/max/run/description`.
- Error model: lỗi có mã riêng như `#PARSE!`, `#DIV/0!`, `#VALUE!`, `#NAME?`, `#NUM!`.

## Hàm đã có trong nền móng 0.1

**Tổng hợp:** SUM, AVERAGE, MIN, MAX, COUNT, COUNTA.  
**Toán học:** ABS, SQRT, POWER, MOD, INT, TRUNC, ROUND, ROUNDUP, ROUNDDOWN, PI, EXP, LN, LOG10, SIN, COS, TAN, RADIANS, DEGREES.

## Cú pháp thử

```
=SUM(12, 15, 8)
=AVERAGE(6, 8, 10)
=ROUND(3.14159, 2)
=SQRT(144)
=2+3*4
```

Đối với tham chiếu ô và vùng ô, engine nhận adapter `getCell(ref)` và `getRange(ref)`; lớp bảng tính sẽ cung cấp adapter này ở giai đoạn tiếp theo.

## Giới hạn có chủ ý của 0.1

- Chưa có giao diện bảng tính và chưa kết nối lưới ô.
- Chưa có tham chiếu tuyệt đối/tương đối, tên vùng, phụ thuộc công thức và phát hiện vòng lặp.
- Chưa xử lý ngày giờ, định dạng số theo locale, ma trận động hay hàm điều kiện.
- ROUND dùng quy tắc làm tròn số dương theo half-up và đối xứng dấu; cần bộ đặc tả chính xác hơn trước khi tuyên bố tương thích hệ khác.
- Dấu phân cách tham số hiện dùng dấu phẩy; cấu hình theo ngôn ngữ sẽ bổ sung sau.

## Kiểm thử

Chạy `npm test` trong thư mục gốc. Các kiểm thử bao gồm ưu tiên toán tử, hàm, tham chiếu ô/vùng qua adapter và mã lỗi.
