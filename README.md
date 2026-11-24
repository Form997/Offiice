# HAI ĐẤT OFFICE

Ba ứng dụng web độc lập:
- **WRITER** — soạn thảo và quản lý tài liệu: [Mở WRITER](./writer/).
- **CALC (SGHT)** — ứng dụng bảng tính chính; CALC là ứng dụng triển khai, SGHT là lõi bảng tính bên trong: [Mở CALC](./calc/).
- **SLIDES** — tạo và trình chiếu nội dung: [Mở SLIDES](./slides/).

## CALC và lõi SGHT

Mã nguồn SGHT được tích hợp vào calc/: app.js, engine/, ai/, automation/, server/ và tests/. CALC giữ nguyên engine công thức, lưới thưa, ảo hóa, workbook, định dạng, clipboard, Pivot, biểu đồ, Dashboard, Macro và Data Science. Các tính năng chưa có kiểm thử trình duyệt hoặc backend triển khai không được xem là đã nghiệm thu.

## Lưu trữ và đồng bộ

Lần tích hợp này giữ nguyên cơ chế lưu cục bộ hiện hữu; không tự chuyển đổi dữ liệu. Chưa bật đồng bộ đám mây/cộng tác thời gian thực. PocketBase + IndexedDB và đồng bộ thủ công/tự động là giai đoạn riêng, cần chuyển đổi dữ liệu và kiểm thử tương thích.

## Chạy và kiểm thử

Yêu cầu Node.js 22 trở lên. Chạy `npm test` từ thư mục gốc. Phục vụ website qua HTTP/HTTPS để chạy JavaScript module. CALC: https://form997.github.io/Offiice/calc/.

## Triển khai

GitHub Pages triển khai từ nhánh v1-development. Nhánh main được giữ nguyên; không tự động hợp nhất.
