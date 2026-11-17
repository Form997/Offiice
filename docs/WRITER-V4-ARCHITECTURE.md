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
| V4.2 Object Studio | Chọn nhiều, xoay bằng tay nắm, nhóm/tách nhóm, kéo và resize nhiều đối tượng, căn theo đối tượng/trang | Undo/redo nhất quán, kiểm thử nhóm và xác minh thao tác trên thiết bị |
| V4.3 Image & Typography | Khung cắt ảnh không phá hủy, độ trong suốt, kiểu chữ, bảng ô chỉnh sửa được, biểu đồ cột có dữ liệu | Dữ liệu cấu trúc lưu được, kiểm tra ảnh lớn và khả năng hiển thị |
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
- Đã bổ sung tay nắm xoay trực quan cho đối tượng đơn, tay nắm resize theo tỉ lệ cho vùng chọn nhiều đối tượng, căn lề trái/giữa/trên theo trang và Ctrl+Shift+Z để làm lại.
- Undo snapshot được tạo cho thao tác kéo, resize, xoay, căn chỉnh, nhóm/tách nhóm, xóa, thuộc tính và trước khi sửa nội dung văn bản.
- Chức năng đã được ghi mã; chưa chạy browser automation hoặc kiểm thử thực tế Android/desktop. Cần xác minh các thao tác liên tục, lưu tự động, dữ liệu ảnh và giới hạn bộ nhớ trước khi đánh dấu V4.2 hoàn tất.


## V4.3 — Image & Typography (triển khai ban đầu)
- Ảnh: khung cắt không phá hủy bằng object-fit/object-position, điều chỉnh tâm cắt ngang/dọc và mức phóng trong khung; có mô tả thay thế (alt text) và độ trong suốt. Tệp ảnh được nhúng dạng data URL vào dữ liệu Canvas cục bộ.
- Chữ: phông chữ hệ thống (Arial, Georgia, Times New Roman, Verdana, Tahoma, Trebuchet MS, Courier New, system-ui), cỡ chữ, đậm/nghiêng, căn trái/giữa/phải/đều, chiều cao dòng, giãn chữ, màu và độ trong suốt.
- Bảng: đối tượng bảng có mảng dữ liệu từng ô; nhấp đúp để sửa ô, thêm/xóa hàng và cột, bật/tắt hàng tiêu đề.
- Biểu đồ: đối tượng biểu đồ cột SVG dựng từ nhãn và giá trị số; sửa dữ liệu bằng hai trường riêng, đổi màu cột và kích thước.
- Các trường mới là thuộc tính mở rộng tùy chọn trong design.items; không đổi ID tài liệu và không xóa nội dung HTML cũ.
- Giới hạn hiện tại: cắt ảnh là crop hiển thị không phá hủy, chưa xuất thành tệp ảnh crop mới; phông chữ không được nhúng; biểu đồ hiện là biểu đồ cột cơ bản; chưa có kéo-thả nhập Excel, biểu đồ nhiều chuỗi hay công cụ thiết kế bảng nâng cao.
- Chưa chạy browser QA/Android/desktop, chưa kiểm tra ảnh lớn, localStorage quota, khả năng in hoặc xuất PDF/DOCX. Không xem đây là bản phát hành.
