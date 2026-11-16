# HAI ĐẤT WRITER V2.0 — Ribbon-first document management

- Ngày phát hành mã: 17/11/2026
- Giữ giao diện Ribbon sáu thẻ: Tệp, Trang chủ, Chèn, Bố trí, Tham chiếu, Xem.
- Nâng schema tài liệu nội bộ lên phiên bản 2; giữ nguyên ID, tên, nội dung và mốc thời gian khi nâng cấp dữ liệu V1.
- Bổ sung tìm kiếm kho tài liệu theo tên hoặc ID.
- Xóa mềm vào Thùng rác; có thể khôi phục hoặc xóa vĩnh viễn sau xác nhận.
- Khi xóa tài liệu đang mở, Writer chuyển sang tài liệu còn hoạt động hoặc tạo tài liệu mới; không để trạng thái trỏ vào tài liệu đã xóa.
- Backup/restore tiếp tục mang theo danh sách tài liệu; trường deletedAt được bảo toàn trong dữ liệu.
- Cache: `haidat-writer-v2-0`; script: `app.js?v=2.0`.

## Nâng cấp dữ liệu
- Không đổi khóa localStorage hiện có.
- Không tự xóa dữ liệu cũ.
- Chuẩn hóa tài liệu khi nạp: giữ ID hợp lệ, bổ sung metadata còn thiếu và gắn schemaVersion=2.
- Thùng rác dùng cờ deletedAt trong cùng kho tài liệu, tránh tách kho và mất liên kết ID.

## Kiểm thử / giới hạn
- Chưa xác nhận tương tác thực tế trên thiết bị sau triển khai.
- Thùng rác hiện lưu cục bộ trên trình duyệt; chưa đồng bộ đám mây.
- Chưa có phân quyền, cộng tác thời gian thực hoặc khôi phục phiên bản lịch sử.
- DOCX vẫn là bộ nhập/xuất OOXML cơ bản, chưa đạt tương thích toàn phần với Microsoft Word.
