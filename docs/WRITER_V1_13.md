# HAI ĐẤT WRITER V1.13 — Quản lý vòng đời tài liệu

- Ngày: 17/11/2026
- Hiển thị ID tài liệu nội bộ ngay tại thanh tên; có nút sao chép ID.
- ID vẫn độc lập với tên tài liệu; đổi tên không đổi ID.
- Khi nhập tệp, Writer kiểm tra tài liệu trùng tên và nội dung. Người dùng có thể mở bản đang có hoặc chủ động nhập thêm một bản.
- Mở tệp qua File System Access chỉ gắn handle vào tài liệu sau khi quá trình nhập thành công; lỗi nhập không làm thay đổi tệp đang gắn.
- Luồng mở DOCX/ODT và các định dạng còn lại dùng chung bộ xử lý nhập; bỏ trình xử lý DOCX riêng có thể ghi đè sự kiện mở.
- Giữ nguyên kho tài liệu, cấu trúc sao lưu và các tính năng định dạng của V1.12.
- Service worker cache: `haidat-writer-v1-13`; tham chiếu app script: `app.js?v=1.13`.

## Kiểm thử và giới hạn
- Đã rà soát các đường đi mở tệp, chống tạo bản trùng và gắn file handle.
- Kiểm tra cú pháp JavaScript và sự hiện diện của ID điều khiển trước khi phát hành.
- ID được lưu bền trong kho tài liệu nội bộ và bản sao lưu JSON. Các định dạng xuất như DOCX/TXT/RTF hiện chưa nhúng ID vào metadata chuẩn của tệp; khi nhập lại từ tệp xuất, ứng dụng có thể cấp ID mới.
- Chưa xác nhận thao tác thực tế trên mọi trình duyệt/thiết bị. File System Access API phụ thuộc trình duyệt hỗ trợ và quyền truy cập.
