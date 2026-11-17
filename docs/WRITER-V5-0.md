# HAI ĐẤT OFFICE — V5.0 Backup & Restore Safety Studio

**Ngày triển khai:** 17/11/2026  
**Nhánh:** `v5-development`  
**Phát triển từ:** `v4-development`

## Mục tiêu

V5.0 bổ sung bước kiểm tra trước khi nhập bản sao lưu. Người dùng được xem trước số tài liệu hợp lệ, bản ghi bị bỏ qua, ID trùng/sai định dạng, xung đột với kho hiện tại, số mốc lịch sử và số tài liệu có dữ liệu Canvas trước khi quyết định tiếp tục.

## Thay đổi

- Thêm `writer/backup-studio.js`: mô-đun kiểm tra độc lập, không CDN/API, có thể chạy trong trình duyệt và Node.js.
- Trước khi khôi phục, Writer hiển thị bản xem trước theo chế độ Hợp nhất hoặc Thay thế.
- Báo cáo số tài liệu mới, ID trùng trong tệp và với kho hiện tại, bản ghi sai cấu trúc, ID không đúng mẫu, history và Canvas design.
- Giới hạn preflight tối đa 10.000 tài liệu; cảnh báo HTML đơn lẻ trên 5 MB.
- Nếu tài liệu đang sửa chưa lưu thành công, thao tác khôi phục bị hủy thay vì tiếp tục với trạng thái chưa được bảo toàn.
- Service Worker V5.0 precache mô-đun mới và dùng cache key riêng `haidat-writer-v5-0-r1`.

## Kiểm thử

- Unit test: `tests/writer-v5-0-backup.test.js`.
- Giữ test V4.9: `tests/writer-v4-9.test.js`.
- GitHub Actions: `.github/workflows/writer-v5-qa.yml`, chạy `node --test tests/*.test.js` trên push/PR vào nhánh V5.
- Có thể chạy cục bộ bằng Node.js 20: `node --test tests/*.test.js`.

## Tương thích và an toàn

- Không đổi document ID, storage key, `schemaVersion: 3`, cấu trúc backup version 1–5 hoặc dữ liệu Canvas.
- Không tự động thay đổi chế độ nhập; người dùng phải xác nhận bản xem trước.
- Luồng thay thế toàn bộ hiện hữu vẫn yêu cầu tải bản sao an toàn và xác nhận riêng.
- Không sửa V3 hoặc V4; V5 làm việc trên nhánh riêng `v5-development`.

## Giới hạn

- Preflight là kiểm tra cấu trúc và thống kê, không phải xác minh mật mã/chữ ký số của backup.
- Chưa có checksum chống sửa đổi, mã hóa backup hoặc đồng bộ đám mây.
- Chưa có browser/device QA, Android/Samsung A05, desktop hoặc kiểm tra dung lượng quota. Không tuyên bố sẵn sàng production trước khi CI và QA thiết bị hoàn tất.
