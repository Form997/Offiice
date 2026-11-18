# HAI ĐẤT WRITER V2.2 — Lịch sử phiên bản

- Ngày cập nhật: 17/11/2026
- Nền tảng: tiếp nối V2.1, giữ nguyên Ribbon, kho tài liệu, thư mục, phân loại, ghim và thùng rác.
- Tự động lưu mốc nội dung khi có thay đổi, tối đa một mốc mỗi 5 phút.
- Cho phép người dùng tạo mốc thủ công trước các lần chỉnh sửa lớn.
- Danh sách lịch sử hiển thị thời gian, loại mốc và số từ.
- Xem trước nội dung phiên bản ở chế độ chỉ đọc.
- Khôi phục nội dung phiên bản cũ; trước khi khôi phục, Writer lưu mốc nội dung hiện tại để có đường quay lại.
- Giữ tên tài liệu và ID HDW hiện tại khi khôi phục nội dung; khôi phục không đổi định danh tài liệu.
- Xóa vĩnh viễn tài liệu sẽ xóa cả lịch sử của tài liệu đó; chuyển vào Thùng rác không xóa lịch sử.
- Sao lưu JSON phiên bản 4 bao gồm lịch sử; vẫn nhận bản sao lưu phiên bản 1, 2 và 3.
- Giới hạn: tối đa 6 mốc/tài liệu, tối đa 160.000 ký tự HTML/mốc và khoảng 1,1 triệu ký tự lịch sử toàn ứng dụng. Nội dung vượt giới hạn không được lưu vào lịch sử; tài liệu hiện tại vẫn được lưu bình thường.
- Lưu trữ lịch sử tại localStorage riêng `haidat-writer-history-v1`; dữ liệu vẫn chỉ nằm trên trình duyệt/thiết bị hiện tại, chưa đồng bộ đám mây.
- Service Worker cache: `haidat-writer-v2-2-r1`; script: `app.js?v=2.2`.

## Kiểm tra
- Đã kiểm tra cú pháp JavaScript.
- Đã kiểm tra không có ID HTML trùng lặp và đủ các điều khiển lịch sử.
- Cần kiểm thử thao tác thực tế trên trình duyệt/thiết bị sau khi Pages triển khai thành công.
- DOCX tiếp tục dùng bộ nhập/xuất OOXML cơ bản; chưa tương thích toàn phần với Word.

## V2.1 — Mốc quản lý tài liệu
V2.1 được giữ làm nền quản lý tài liệu: thư mục, phân loại, ghim, sắp xếp, tìm kiếm và thùng rác. Không thay đổi ID hoặc tên tài liệu khi cập nhật lên V2.2.
