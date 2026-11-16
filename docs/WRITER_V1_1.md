# HAI ĐẤT WRITER V1.1

- Ngày bắt đầu nâng cấp: 16/11/2026
- Nhánh phát triển: `v1-development`
- Phạm vi: nâng cấp riêng ứng dụng `writer/`; không thay đổi Calc và Slides.

## Đã bổ sung
- Quản lý nhiều tài liệu độc lập trên cùng thiết bị: tạo, chọn, đổi tên và xóa.
- Tự lưu sau khi ngừng nhập; lưu ngay bằng nút hoặc Ctrl/Cmd + S; hiển thị trạng thái lưu.
- Định dạng đoạn: tiêu đề 1–3, trích dẫn, văn bản thô; phông và cỡ chữ.
- Định dạng ký tự: đậm, nghiêng, gạch chân, gạch ngang, màu chữ và màu đánh dấu.
- Căn trái/giữa/phải/đều; danh sách có thứ tự/vô thứ tự; tăng/giảm lề.
- Chèn liên kết, bảng và ảnh (ảnh tối đa 8 MB).
- Mở tệp HTML/TXT; làm sạch một số thẻ và thuộc tính nguy hiểm khi nhập HTML.
- Xuất HTML/TXT; in hoặc lưu PDF qua hộp thoại in của trình duyệt.
- Thống kê số từ, ký tự và đoạn; phím tắt Ctrl/Cmd + B/I/U/S.
- Giao diện thích ứng điện thoại và máy tính; bố cục in khổ A4; đổi cache PWA để nhận bản mới.

## Giới hạn còn lại
- Chưa hỗ trợ nhập/xuất DOCX chuẩn Microsoft Word, ODT hoặc RTF.
- Chưa có đánh số trang, đầu/chân trang, mục lục tự động, chú thích cuối trang, theo dõi thay đổi, nhận xét, trộn thư.
- Chưa có đồng bộ đám mây, tài khoản, cộng tác thời gian thực hoặc sao lưu tự động ngoài thiết bị.
- Lưu cục bộ phụ thuộc dung lượng trình duyệt; cần tải bản HTML/TXT để sao lưu.
- Một số lệnh định dạng dựa trên API chỉnh sửa nội dung của trình duyệt; hành vi có thể khác nhau giữa các trình duyệt.

## Kiểm thử và nghiệm thu
Bản cập nhật đã được ghi lên nhánh phát triển. Chưa coi là nghiệm thu hoàn chỉnh cho tới khi kiểm tra thao tác trên Android và ít nhất một trình duyệt máy tính, bao gồm tạo/mở tài liệu, định dạng, chèn ảnh/bảng, tải tệp và in PDF.

## Dung lượng
Dung lượng phát sinh của từng tệp và tổng thay đổi cần được xác nhận bằng thống kê Git sau khi kiểm tra; không ước đoán số liệu.
