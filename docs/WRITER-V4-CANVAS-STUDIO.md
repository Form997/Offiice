# HAI ĐẤT WRITER V4 — Canvas Studio

- Ngày: 17/11/2026
- Nhánh: `v4-development`
- Trạng thái: Prototype tương tác độc lập; chưa tích hợp vào bản ghi tài liệu V3.

## Mục tiêu trải nghiệm

Canvas là không gian bố trí trực quan theo trang giấy. Người dùng thêm và sắp xếp các thành phần độc lập trên trang, thay vì chỉ nhập văn bản theo dòng. Canvas không phải Canva và không phải một ảnh chụp trang: các thành phần phải còn cấu trúc, có thể chọn và chỉnh sửa.

## Prototype hiện có

Tệp: `writer/canvas-studio.html`

- Thanh công cụ: hoàn tác/làm lại, thứ tự lớp, xóa, lưới, vừa trang và thu phóng.
- Bảng thành phần: hộp văn bản, tiêu đề, hình khối, ảnh, đường kẻ và ghi chú.
- Vùng trang A4 theo tọa độ pixel; đối tượng có vị trí, kích thước, màu, cỡ chữ và ID riêng.
- Kéo thả bằng Pointer Events; đổi kích thước bằng tay nắm; sửa chữ bằng nhấp đúp.
- Bảng thuộc tính và danh sách lớp.
- Chèn ảnh cục bộ; giao diện co lại cho màn hình nhỏ.
- Lưu bản thử vào localStorage bằng khóa riêng `haidat-writer-v4-canvas-preview`.

## Ranh giới dữ liệu hiện tại

Prototype chưa đọc hoặc ghi `haidat-writer-documents-v2`, không sửa HTML nội dung, ID tài liệu, lịch sử phiên bản, thư mục hoặc bản sao lưu V3. Đây là chủ ý an toàn, không phải đồng bộ tài liệu đã hoàn tất.

## Kiến trúc tích hợp đích

1. Mở Canvas từ cùng tài liệu Writer; dùng document ID hiện hữu.
2. Thêm metadata thiết kế có phiên bản vào bản ghi tài liệu; giữ nguyên HTML văn bản.
3. Đối tượng có ID ổn định, loại, tọa độ theo mm, kích thước, góc xoay, z-order, khóa/ẩn, nội dung và kiểu.
4. Chuyển Văn bản ↔ Canvas không tạo bản sao và không mất thay đổi.
5. Lưu tự động theo cùng cơ chế lưu tài liệu; backup/restore mang theo metadata.
6. Undo/redo phải bao phủ thao tác thêm, xóa, di chuyển, thay kích thước, sửa nội dung và sắp lớp.
7. Xuất PDF/HTML trước; DOCX ánh xạ đối tượng theo khả năng định dạng và phải kiểm tra bằng tệp thực.

## Việc còn thiếu trước khi gọi là V4.1 hoàn chỉnh

- Tích hợp chung bản ghi và ID tài liệu.
- Chọn nhiều đối tượng, căn chỉnh, phân phối, nhóm/nhả nhóm, khóa/ẩn lớp.
- Xoay, lưới hút, đường căn, lề an toàn và đơn vị mm.
- Bàn phím trợ năng, thao tác cảm ứng ổn định, bảng thuộc tính mobile dễ dùng.
- Kiểm thử lưu/tải lại, tải ảnh, undo/redo, Android và desktop.
- Kiểm thử xuất tệp và xác nhận không ảnh hưởng dữ liệu V3.

## Không tuyên bố

Prototype chưa phải trình biên tập phân trang tương đương Google Docs/Word; chưa có đồng bộ Canvas với nội dung văn bản; chưa có kiểm thử trình duyệt thực tế hoặc xuất DOCX/PDF từ các đối tượng Canvas.
