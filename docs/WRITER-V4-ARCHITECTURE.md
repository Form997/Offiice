# HAI ĐẤT WRITER V4 — Kiến trúc hai chế độ

- Ngày cập nhật: 17/11/2026
- Nhánh: `v4-development`
- Nền kế thừa: `v3-development`
- Quyết định đã chốt: triển khai đầy đủ V4.1–V4.8; một tài liệu, một ID, hai chế độ; offline bắt buộc.

## Mục tiêu
Một hồ sơ tài liệu có thể mở ở chế độ Văn bản hoặc Canvas mà không nhân bản tài liệu. Nội dung văn bản HTML hiện hữu vẫn là nguồn dữ liệu gốc; metadata Canvas là phần mở rộng có phiên bản.

## Hợp đồng dữ liệu
- Kho cũ giữ nguyên key `haidat-writer-documents-v2`.
- Không đổi ID `HDW-YYYYMMDD-XXXXXXXX`, không xóa trường V3.
- Mở rộng tùy chọn: `design: { version, page, items, updatedAt }`.
- Bản ghi không có `design` vẫn là tài liệu V3 hợp lệ.
- Mỗi đối tượng có ID ổn định, kind, tọa độ, kích thước, z-order và thuộc tính.
- Lưu Canvas cập nhật đúng bản ghi cùng ID; không tạo bản sao tài liệu.
- Backup/restore phải bảo toàn nguyên vẹn trường `design`; khôi phục có cảnh báo khi thay thế dữ liệu.

## Nguyên tắc ngoại tuyến
- Soạn thảo và lưu trên thiết bị, không phụ thuộc đăng nhập, Supabase hay API.
- Canvas sử dụng cùng kho localStorage hiện có ở giai đoạn đầu.
- Không ghi đè dữ liệu khi không tìm thấy ID hoặc phát hiện dữ liệu kho không hợp lệ.
- Cần kiểm thử hạn mức lưu trữ, ảnh nhúng, phục hồi sau đóng tab và xung đột hai tab trước phát hành.

## Các mốc V4
| Mốc | Phạm vi | Điều kiện hoàn thành |
|---|---|---|
| V4.1 Canvas Engine | Mở Canvas theo ID, khung trang, zoom/pan, thước, lưới, autosave | Hai chế độ đọc/ghi cùng hồ sơ, giữ ID |
| V4.2 Object Studio | Chọn nhiều, xoay, nhóm/tách nhóm, kéo nhiều đối tượng, resize, căn trái/giữa/trên | Undo/redo nhất quán cho mọi thao tác và kiểm thử nhóm |
| V4.3 Image & Typography | Cắt ảnh, độ trong suốt, phông chữ, bảng, biểu đồ | Nội dung chỉnh sửa được, lưu ổn định |
| V4.4 Multi-page Studio | Nhiều trang, thứ tự trang, mẫu, lề và vùng in | Phân trang và xem trước nhất quán |
| V4.5 Document Integration | Đồng bộ mô hình văn bản/Canvas, lịch sử và backup | Không mất dữ liệu khi chuyển chế độ |
| V4.6 Export Studio | PDF, DOCX, PNG, SVG, HTML, JSON | Kiểm tra tệp xuất thực tế và nêu giới hạn |
| V4.7 Mobile & Performance | Android, cảm ứng, tài liệu lớn, hiệu năng | Kiểm thử trên điện thoại và desktop |
| V4.8 Final QA | Offline, hồi quy V3, phục hồi, bảo mật, accessibility | Đạt checklist phát hành; chưa tự động merge |

## An toàn và giới hạn
- Nhánh V3 không sửa đổi; không merge vào main khi chưa có phê duyệt.
- V3 hiện dùng một vùng contenteditable; chưa có engine phân trang kiểu Word/Docs.
- Canvas dùng DOM/SVG và dữ liệu có cấu trúc, không raster hóa toàn trang.
- DOCX/PDF có thể giản lược một số đối tượng; chỉ tuyên bố tương thích sau khi kiểm thử tệp thực.
- Không tuyên bố QA đã đạt nếu chưa chạy trên trình duyệt, Android và desktop thực tế.

## V4.2 — trạng thái triển khai Object Studio
- Đã bổ sung chọn nhiều bằng Ctrl/Shift + chạm/bấm; Ctrl+A chọn toàn bộ đối tượng.
- Có thể kéo đồng thời các đối tượng đang chọn; thành viên cùng `groupId` được chọn chung khi chọn một phần tử trong nhóm.
- Có lệnh Nhóm/Tách nhóm, căn trái/căn giữa/căn trên và thuộc tính góc xoay.
- Xóa đối tượng áp dụng cho toàn bộ lựa chọn. Mô hình đối tượng vẫn là các bản ghi riêng, không gộp thành ảnh.
- Đây là mức triển khai ban đầu; chưa xác nhận undo/redo bao phủ toàn bộ thao tác thuộc tính, chưa có resize đồng loạt, xoay bằng tay nắm trực quan, căn theo trang và kiểm thử trình duyệt.
