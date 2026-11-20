# HAI ĐẤT WRITER V1.11 — Quản lý tệp và thư mục làm việc
Ngày cập nhật: 16/11/2026

## Chức năng
- Mở tệp, Lưu, Lưu thành, Đóng tệp.
- Chọn thư mục làm việc trên máy tính; lưu handle trong IndexedDB khi trình duyệt hỗ trợ và được cấp quyền.
- Mở hộp thoại tệp bắt đầu từ thư mục làm việc đã chọn khi trình duyệt cho phép.
- Lưu DOCX, HTML, TXT, Markdown, RTF; mở DOCX, ODT (nội dung văn bản cơ bản), HTML, TXT, Markdown, CSV, RTF.
- Đóng tệp không xóa bản tài liệu nội bộ; dữ liệu localStorage hiện có được giữ nguyên.

## Giới hạn tương thích
- Chọn thư mục và ghi thẳng vào vị trí chỉ định cần File System Access API, hiện phù hợp nhất Chrome/Edge máy tính.
- Trình duyệt khác dùng hộp thoại tệp/tải xuống; ứng dụng web không được tự ý truy cập đường dẫn thư mục tùy ý.
- DOC cũ (Word 97–2003) chưa đọc trực tiếp; chuyển sang DOCX.
- PDF chưa chuyển thành văn bản chỉnh sửa; dùng In / Lưu PDF để xuất.
- DOCX/ODT nhập ở mức nội dung cơ bản; chưa bảo đảm giữ toàn bộ bố cục, hình ảnh, biểu đồ và đối tượng nhúng.
- Quyền thư mục có thể cần cấp lại sau khi đóng phiên hoặc thay đổi cài đặt trình duyệt.

## Kiểm tra
- JavaScript syntax: đạt.
- Điều khiển Mở/Lưu/Lưu thành/Đóng/Thư mục: có mặt.
- File System Access API và IndexedDB: có mặt.
- Chưa kiểm thử thao tác thực tế trên mọi trình duyệt/thiết bị.
