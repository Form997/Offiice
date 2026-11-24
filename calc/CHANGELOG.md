# HAI ĐẤT CALC — Nhật ký phát triển

## V2.0 — Tích hợp lõi bảng tính SGHT — 24/11/2026

- CALC trở thành ứng dụng bảng tính chính; SGHT là lõi bên trong, không còn là ứng dụng triển khai riêng.
- Chuyển 124 tệp SGHT gốc (1.111.701 byte, khoảng 1.085,6 KiB hoặc 8.893.608 bit) vào calc/, gồm app, engine, AI, automation, server, tests và tài liệu.
- Giữ nguyên engine công thức, sparse grid, virtual scrolling, workbook, định dạng, clipboard, dữ liệu, Pivot, biểu đồ, Dashboard, Macro và Data Science.
- Tích hợp CSS iOS/màn hình gập, manifest và service worker cho CALC.
- Giữ cơ chế lưu cục bộ hiện tại; không tự đổi dữ liệu. PocketBase + IndexedDB + đồng bộ thủ công/tự động là giai đoạn kế tiếp, chưa hoàn tất ở đây.
- Chuyển đường dẫn cũ /sght/ sang /calc/ để tương thích.
- Kiểm thử Node.js được chuyển đường dẫn sang calc/; chờ GitHub Actions xác nhận sau commit.
- Chưa tuyên bố đã kiểm thử Safari iPhone, Android, Samsung A05, bàn phím ảo hay thao tác DOM thực tế.
- Nhánh v1-development; không sửa main. Ngày bắt đầu SGHT: 18/11/2026. Ngày tích hợp: 24/11/2026.
