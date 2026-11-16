# HAI ĐẤT WRITER V1.6 — In ấn và sao lưu

Ngày: 16/11/2026

## Tính năng
- Thiết lập nội dung đầu trang, chân trang và tùy chọn số trang trong chế độ in.
- Cấu hình đầu/chân trang được lưu trên thiết bị, tách khỏi nội dung văn bản.
- Xuất toàn bộ danh sách tài liệu thành một tệp JSON sao lưu, gồm tài liệu, tài liệu đang mở, thiết lập trang và thiết lập in.
- Khôi phục từ JSON; kiểm tra định dạng, giới hạn tệp 20 MB, làm sạch HTML và hỏi xác nhận trước khi thay thế danh sách hiện tại.

## Giới hạn
- Số trang dùng CSS Paged Media `counter(page)` / `counter(pages)`; khả năng hiển thị tùy trình duyệt và hộp thoại in. Nên kiểm tra trên Chrome/Edge mới và bản PDF thực tế.
- Đầu trang/chân trang được thiết lập ở cấp ứng dụng, không phải các vùng Word section riêng biệt.
- Bản sao lưu JSON không đồng bộ đám mây và người dùng cần tự cất giữ tệp an toàn.
- Chưa xác nhận tương thích hoàn toàn DOCX hoặc nghiệm thu thao tác thực tế trên mọi thiết bị.

## Phát hành
- Tiếp tục từ nhánh `v1-development`, không khởi tạo lại dự án.
- Cache ngoại tuyến: `haidat-writer-v1-6`.
