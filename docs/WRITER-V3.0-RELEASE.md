# HAI ĐẤT WRITER V3.0 — Ghi chú phát hành

- Ngày bắt đầu: 17/11/2026
- Nhánh: `v3-development`
- Nền kế thừa: `v1-development` của kho `Form997/Offiice`
- Mục tiêu: nâng cấp trải nghiệm viết, giữ dữ liệu cục bộ và tránh thay đổi phá vỡ cấu trúc cũ.

## Điểm mới
1. Thu phóng vùng soạn thảo 75%, 90%, 100%, 110%, 125%, 150%; lựa chọn được lưu trên thiết bị.
2. Chế độ tập trung ẩn phần đầu trang, thanh quản lý tài liệu và Ribbon để dành không gian viết.
3. Có nút thoát chế độ tập trung ngay trên thanh định dạng nhanh; phím Escape chưa được gán để tránh xung đột với hộp thoại.
4. Cập nhật phiên bản giao diện và cache PWA lên V3.0.

## Giữ nguyên
- ID riêng từng tài liệu, kho tài liệu cục bộ, thư mục, ghim, thùng rác và lịch sử phiên bản.
- Sáu thẻ Ribbon, mục lục, chú thích, trích dẫn, bảng, ảnh, xuất DOCX/HTML/TXT và in PDF.
- Cấu hình Supabase để trống mặc định; không chứa khóa bí mật.

## Kiểm thử
- Đã rà soát điểm gắn sự kiện theo ID của hai nút mới và các phần tử giao diện.
- Chưa chạy kiểm thử trình duyệt thực tế trên Android/desktop trong phiên này.
- Chưa xác nhận đồng bộ Supabase hoặc phân quyền trực tuyến vì chưa có cấu hình dự án.

## Dung lượng
- Ghi nhận theo commit sau khi GitHub hoàn tất; không ước đoán dung lượng trước khi lưu.
