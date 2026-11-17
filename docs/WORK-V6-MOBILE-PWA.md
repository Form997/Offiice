# HAI ĐẤT OFFICE — WORK V6.0 (Mobile PWA)

- Nhánh phát triển: `v5-development` (V6 được triển khai nối tiếp trên nhánh tích hợp hiện hành; không sửa nhánh V3/V4).
- Định hướng: PWA cài lên màn hình chính, ưu tiên điện thoại Android; desktop vẫn hỗ trợ.
- Tên ứng dụng: WORK. Hai chế độ làm việc bên trong: Writer và Canvas.
- Dữ liệu: tiếp tục dùng chung kho tài liệu hiện tại, giữ ID tài liệu và schemaVersion 3; không tự ý chuyển đổi hoặc xóa dữ liệu.
- Ngoại tuyến: Service Worker precache shell, stylesheet mobile và các module đang được tham chiếu. Lần đầu vẫn cần Internet để tải ứng dụng; dữ liệu cục bộ vẫn phụ thuộc dung lượng trình duyệt.
- Mobile UX: vùng chạm tối thiểu 44px, cỡ chữ input 16px để tránh tự phóng đại trên iOS, ribbon cuộn ngang, quickbar cuộn ngang, vùng soạn thảo dễ chạm, thanh trạng thái có safe-area.
- Bảo toàn: không thay cơ chế lưu tài liệu, không đổi ID, không thay kho dữ liệu, không bật Supabase khi chưa cấu hình.

## Kiểm định còn phải thực hiện
1. GitHub Actions chạy test hiện có và xác nhận kết quả.
2. Android Chrome: cài PWA, mở Writer/Canvas, nhập liệu, bàn phím, xoay màn hình.
3. Offline: cài lần đầu có mạng, bật chế độ máy bay, mở lại app, mở tài liệu và xuất bản sao lưu.
4. Kiểm tra quota localStorage, khôi phục backup, chuyển qua lại hai chế độ và cập nhật Service Worker.
5. Kiểm tra Samsung A05 thực tế và ít nhất một trình duyệt desktop.
6. Xác nhận lời mời cài đặt, trạng thái chấp nhận/từ chối và sự kiện appinstalled trên Chrome Android.
7. Kiểm tra biểu tượng SVG trên trình duyệt mục tiêu; nếu Chrome yêu cầu PNG 192×192 và 512×512 thì bổ sung hai biểu tượng raster trước khi công bố cài đặt rộng rãi.

Trạng thái: **Đang phát triển; đã hoàn thiện xử lý lời mời cài PWA và làm mới cache Service Worker; chưa xác nhận QA thiết bị, chưa phải bản phát hành production.**
