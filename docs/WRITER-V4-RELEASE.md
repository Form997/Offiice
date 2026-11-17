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
