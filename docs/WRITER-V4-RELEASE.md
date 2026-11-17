# HAI ĐẤT WRITER V4 — Nhật ký phát triển

## 17/11/2026 — Khởi tạo V4.0 Foundation

### Nội dung
- Tạo nhánh `v4-development` từ `v3-development`; giữ nguyên nhánh V3.
- Chốt kiến trúc hai chế độ trong cùng tài liệu: Văn bản (Docs-like) và Thiết kế (Canva-like).
- Định hướng đối tượng thiết kế dạng dữ liệu có cấu trúc, không dùng ảnh chụp trang làm nguồn nội dung.
- Đặt nguyên tắc tương thích dữ liệu V3, offline-first, mobile-first và kiểm thử xuất DOCX/PDF/HTML.
- Ghi nhận giới hạn kỹ thuật hiện tại: editor là một vùng `contenteditable`, trang A4 đang mô phỏng bằng CSS; chưa phải engine phân trang nhiều trang hoàn chỉnh.

### Tệp
- `docs/WRITER-V4-ARCHITECTURE.md`
- `docs/WRITER-V4-RELEASE.md`
- `writer/README.md` (cập nhật phạm vi V4)

### Kiểm thử / giới hạn
- Đã xác nhận nhánh V4 được tạo từ nhánh V3.
- Chưa thay đổi mã chạy của Writer trong mốc Foundation.
- Chưa chạy browser QA, Android QA, DOCX round-trip hoặc CI cho V4.
- Chưa phát hành và chưa gộp vào main.

### Thống kê thay đổi
- So với V3: 3 tệp thay đổi, 110 dòng thêm, 0 dòng xóa (theo GitHub compare).
- Đây là thống kê dòng mã/tài liệu; chưa ghi dung lượng byte vì chưa có phép đo blob đáng tin cậy trong phiên này.


## 17/11/2026 — Canvas Studio prototype

### Nội dung
- Tạo `writer/canvas-studio.html` làm không gian Canvas tương tác thử nghiệm.
- Có công cụ thêm hộp chữ, tiêu đề, hình khối, ảnh, đường kẻ và ghi chú.
- Có kéo thả, đổi kích thước, chỉnh thuộc tính, danh sách lớp, sắp lớp, undo/redo, lưới và zoom.
- Thêm lối vào Canvas Studio từ thanh tài liệu Writer.
- Ghi rõ ranh giới dữ liệu và lộ trình tích hợp trong `docs/WRITER-V4-CANVAS-STUDIO.md`.

### An toàn dữ liệu
- Canvas prototype lưu bằng khóa riêng `haidat-writer-v4-canvas-preview`.
- Chưa đọc/ghi kho tài liệu V3; không thay đổi ID, HTML, lịch sử, thư mục hoặc backup hiện có.
- Không được xem đây là tính năng chuyển đổi Văn bản/Canvas đồng bộ trong cùng hồ sơ ở thời điểm này.

### Kiểm thử / giới hạn
- Đã ghi mã và tài liệu lên nhánh `v4-development`.
- Chưa xác nhận kiểm thử trình duyệt thực tế, Android, thao tác cảm ứng, accessibility hoặc xuất DOCX/PDF.
- Chưa gộp vào V3/main và chưa phát hành chính thức.


### Bổ sung V4.1 — lưu tự động và quay về Writer
- Thêm lưu tự động có độ trễ ngắn sau thao tác Canvas và thay đổi thuộc tính.
- Khi quay lại Writer từ bộ nhớ trang (back-forward cache), nạp lại bản ghi cùng ID từ kho cục bộ để nhận metadata Canvas mới nhất.
- Khi ID gốc không còn hoặc kho dữ liệu không hợp lệ, dừng lưu và báo lỗi thay vì tạo bản ghi khác.
- Vẫn chưa có kiểm thử trình duyệt/Android/desktop; lưu tự động hiện là mã triển khai ban đầu, cần QA thực tế.
