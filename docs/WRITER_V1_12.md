# HAI ĐẤT WRITER V1.12 — Định danh tài liệu

- Ngày: 16/11/2026
- Mỗi tài liệu có một ID nội bộ tự sinh theo dạng `HDW-YYYYMMDD-XXXXXXXX`.
- Tên tài liệu do người dùng tự đặt và có thể đổi bất cứ lúc nào; đổi tên không làm đổi ID.
- ID được giữ khi lưu, đóng/mở lại, sao lưu và khôi phục.
- Dữ liệu tài liệu bổ sung `appType`, `schemaVersion`, `createdAt` và `updatedAt`.
- Tự bổ sung ID/metadata cho tài liệu cũ thiếu trường; không thay ID cũ hợp lệ để tránh làm đứt tham chiếu.
- Bản sao lưu nâng lên phiên bản 2; vẫn nhận bản sao lưu phiên bản 1. Khi khôi phục, ID trùng hoặc thiếu được cấp ID mới.
- Service worker cache: `haidat-writer-v1-12`; tham chiếu app script: `app.js?v=1.12`.

## Phạm vi và kiểm thử
- Kiểm tra cú pháp JavaScript, cấu trúc backup và đối chiếu các ID điều khiển tĩnh trong HTML.
- Chưa xác nhận thao tác thực tế trên mọi trình duyệt/thiết bị. File System Access API vẫn tùy thuộc trình duyệt và quyền người dùng.
