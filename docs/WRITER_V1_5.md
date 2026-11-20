# HAI ĐẤT WRITER V1.5 — Tìm kiếm và thay thế

Ngày: 16/11/2026

## Chức năng
- Tìm tiếp từ hoặc cụm từ trong nội dung tài liệu, không phân biệt hoa/thường theo quy tắc tiếng Việt.
- Thay thế vị trí đang chọn; nếu chưa chọn đúng kết quả thì nút Thay sẽ chuyển tới kết quả kế tiếp.
- Thay thế tất cả trong các nút văn bản của tài liệu.
- Phím tắt Ctrl+F / Cmd+F đưa con trỏ tới ô tìm kiếm.
- Tích hợp công cụ vào nhóm Trang chủ của Ribbon; giao diện tự co trên màn hình nhỏ.

## Phạm vi và lưu ý
- Tìm kiếm theo từng nút văn bản; cụm từ bị chia qua nhiều định dạng khác nhau (ví dụ nửa đậm, nửa thường) có thể không được nhận diện như một chuỗi liên tục.
- Thay thế tất cả giữ cấu trúc định dạng từng nút văn bản, nhưng không xử lý văn bản nằm trong thuộc tính ảnh hoặc liên kết.
- Không tuyên bố đã kiểm thử tương tác thực tế trên mọi trình duyệt/thiết bị. Cần kiểm tra trên Android, iOS và máy tính sau khi Pages triển khai.

## Phát hành
- Phát triển tiếp trên nhánh `v1-development`; không sửa nhánh ổn định `main`.
- Cache ngoại tuyến được nâng lên `haidat-writer-v1-5`.
