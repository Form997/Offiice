# HAI ĐẤT WRITER V4 — Kiến trúc hai chế độ

- Ngày bắt đầu: 17/11/2026
- Nhánh: `v4-development`
- Nền kế thừa: `v3-development`
- Trạng thái: Khởi tạo kiến trúc; chưa phải bản phát hành hoàn chỉnh.

## 1. Mục tiêu

Kết hợp hai cách làm việc trong cùng một tài liệu:

1. **Văn bản (Docs-like):** nhập liệu theo dòng, trang giấy A4/A5/Letter, định dạng đoạn, bảng, mục lục, đầu/chân trang và in.
2. **Thiết kế (Canva-like):** bố trí trực quan bằng các lớp đối tượng như hộp chữ, ảnh, hình khối, sơ đồ và biểu đồ; kéo-thả, đổi kích thước, căn chỉnh và sắp lớp.

Đây là cách xây dựng các tính năng tương tự về trải nghiệm, không sao chép mã nguồn hay nhận diện thương hiệu độc quyền của Google/Canva.

## 2. Nguyên tắc kiến trúc

- **Một tài liệu, hai chế độ:** chuyển đổi qua lại mà không tạo bản sao tài liệu.
- **Văn bản vẫn là nội dung có cấu trúc:** không biến toàn bộ văn bản thành ảnh hoặc canvas raster.
- **Thiết kế là lớp đối tượng có cấu trúc:** mỗi đối tượng có ID riêng, loại, vị trí, kích thước, thứ tự lớp và thuộc tính; không lưu thành ảnh chụp toàn trang.
- **Xuất tệp có dự phòng:** DOCX/PDF/HTML phải giữ được nội dung cốt lõi; những hiệu ứng không tương thích phải được cảnh báo hoặc chuyển đổi có kiểm soát.
- **Ưu tiên offline và thiết bị di động:** không bắt buộc tài khoản, Supabase hoặc API để soạn thảo cơ bản.
- **Bảo toàn V3:** không thay localStorage key `haidat-writer-documents-v2`, không xóa ID tài liệu, lịch sử, thư mục hay bản sao lưu hiện có.
- **Phát triển tách nhánh:** không sửa nhánh V3 và không tự gộp vào main.

## 3. Kiến trúc dự kiến

### Lớp tài liệu
- Giữ nội dung văn bản HTML hiện tại làm nguồn nội dung gốc trong giai đoạn chuyển tiếp.
- Bổ sung vùng metadata thiết kế tùy chọn theo từng tài liệu, ví dụ `design` hoặc `layoutObjects`.
- Mỗi đối tượng thiết kế có ID ổn định, loại đối tượng, tọa độ theo mm, kích thước, góc xoay, z-index, nội dung/nguồn ảnh và thuộc tính trình bày.
- Bộ đọc V3 phải tiếp tục đọc được tài liệu không có metadata thiết kế.

### Lớp hiển thị
- Chế độ Văn bản: trình soạn thảo theo dòng và trang.
- Chế độ Thiết kế: vùng làm việc theo trang, dùng DOM/SVG cho đối tượng có thể chọn và chỉnh sửa; tránh dùng canvas raster làm nguồn dữ liệu chính.
- Cùng một hệ tọa độ theo kích thước trang, có zoom, thước, đường căn và vùng an toàn in.
- Công cụ chọn, kéo, đổi kích thước, căn lề, nhóm/nhả nhóm, khóa lớp và bảng thuộc tính.

### Lớp lưu trữ
- Lưu nội dung văn bản và metadata thiết kế trong cùng bản ghi tài liệu.
- Lưu tự động theo cơ chế hiện có; chỉ ghi khi có thay đổi.
- Backup/restore phải mang theo metadata mới; bản sao V3 không có metadata vẫn hợp lệ.
- Không thay schema hiện hữu trước khi có kiểm tra tương thích và kiểm thử khôi phục.

### Lớp xuất bản
- DOCX: xuất văn bản và bảng trước; ánh xạ đối tượng thiết kế sang drawing/shape khi tương thích.
- PDF: dùng bố cục trang để in; kiểm tra phân trang và vùng tràn.
- HTML: giữ cấu trúc và kiểu dáng của đối tượng.
- Báo rõ phần tử nào có thể bị đơn giản hóa khi xuất sang định dạng không hỗ trợ đầy đủ.

## 4. Lộ trình phát triển

| Mốc | Nội dung | Điều kiện hoàn thành |
|---|---|---|
| V4.0 Foundation | Tạo nhánh riêng, đặc tả dữ liệu, kiểm kê tương thích, bộ kiểm tra hồi quy | Không làm thay đổi hành vi V3 |
| V4.1 Workspace | Thanh chuyển chế độ, vùng trang, zoom/thước và bố cục mobile | Chuyển chế độ không mất nội dung |
| V4.2 Design objects | Hộp chữ, hình khối, ảnh; chọn/kéo/đổi kích thước | Lưu, tải lại và undo/redo ổn định |
| V4.3 Layout tools | Căn chỉnh, thứ tự lớp, khóa, nhóm, lưới và đường căn | Thao tác chính xác bằng chuột và cảm ứng |
| V4.4 Export bridge | DOCX/PDF/HTML cho nội dung kết hợp | Kiểm tra mở lại trên ứng dụng ngoài |
| V4.5 QA & release | Android/desktop, offline, backup/restore, accessibility | Đạt checklist QA trước phát hành |

## 5. Rủi ro cần kiểm soát

- Trình soạn thảo hiện tại dùng một phần tử `contenteditable` đơn, chưa phải trình biên tập phân trang nhiều trang kiểu Google Docs.
- CSS trang hiện tại chủ yếu mô phỏng một tờ giấy; không được tuyên bố đã có phân trang tự động chính xác như Word/Docs.
- Bộ xuất DOCX hiện tại có giới hạn; đối tượng tự do cần được ánh xạ riêng và kiểm thử.
- Cảm ứng kéo-thả trên điện thoại cần vùng chạm đủ lớn, thao tác thay thế bằng nút khi cần.
- Thay đổi DOM nội dung có thể ảnh hưởng tìm kiếm/thay thế, mục lục, lịch sử, vệ sinh HTML và lưu tự động.

## 6. Tiêu chí không được đánh đổi

1. Không mất tài liệu V3.
2. Không đổi ID tài liệu khi chuyển chế độ.
3. Không âm thầm raster hóa văn bản.
4. Không tuyên bố DOCX/PDF hoàn hảo trước khi kiểm tra tệp xuất thực tế.
5. Không đưa khóa bí mật hoặc yêu cầu Supabase vào luồng soạn thảo offline.
6. Không phát hành nếu chưa thử thao tác thật trên Android và desktop.
