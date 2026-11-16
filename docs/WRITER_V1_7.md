# HAI ĐẤT WRITER V1.7 — Mục lục tự động

Ngày: 16/11/2026

## Chức năng
- Tạo mục lục từ các tiêu đề H1, H2, H3; mỗi dòng là liên kết nội bộ tới tiêu đề tương ứng.
- Tự cập nhật mục lục sau khi người dùng sửa, thêm hoặc xóa tiêu đề nếu bật tùy chọn.
- Có thể tắt/bật chế độ tự cập nhật; tùy chọn được lưu trên thiết bị.
- Cập nhật bằng nút Tham chiếu → Tạo / cập nhật mục lục bất cứ lúc nào.
- Mục lục tự loại chính nó khỏi danh sách tiêu đề, tránh lặp tiêu đề “MỤC LỤC”.
- Nếu tài liệu không còn tiêu đề, vùng mục lục cũ sẽ được gỡ khi cập nhật.

## Cách dùng
1. Chọn các dòng tiêu đề và đặt kiểu Tiêu đề 1, Tiêu đề 2 hoặc Tiêu đề 3.
2. Vào tab Tham chiếu và bấm Tạo / cập nhật mục lục.
3. Để bật chế độ tự động, đánh dấu “Tự cập nhật khi sửa tiêu đề”.
4. Chạm/click mục trong danh sách để nhảy đến tiêu đề trong tài liệu.

## Giới hạn
- Mục lục được tạo trong nội dung HTML của tài liệu, không phải trường TOC WordprocessingML chuyên dụng.
- Nếu thay đổi cấp tiêu đề, thêm/xóa tiêu đề, mục lục sẽ làm mới sau thao tác nhập; có độ trễ ngắn để tránh làm gián đoạn gõ phím.
- Số trang trong mục lục chưa được tự tính vì phân trang trình duyệt thay đổi theo kích thước màn hình và trình in.
- Cần nghiệm thu thực tế trên Chrome/Android/iOS và Word/LibreOffice trước khi dùng cho tài liệu nộp chính thức.

## Phát hành
- Phát triển nối tiếp trên `v1-development`.
- Cache ngoại tuyến: `haidat-writer-v1-7`.
