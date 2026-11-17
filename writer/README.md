# HAI ĐẤT WRITER V3.0

## Phạm vi bản V3.0
- Kế thừa cấu trúc trình soạn thảo hiện có, không thay kho dữ liệu cục bộ.
- Giữ nguyên sáu thẻ Ribbon và các công cụ quản lý tài liệu.
- Bổ sung điều chỉnh thu phóng vùng soạn thảo (75–150%), lưu lựa chọn trên thiết bị.
- Bổ sung chế độ tập trung: ẩn thanh đầu trang, thanh tài liệu và Ribbon; vẫn giữ thanh định dạng nhanh và nút thoát.
- Cập nhật bộ nhớ đệm PWA để tránh trình duyệt giữ mã V2.x.

## Dữ liệu và bảo mật
- Dữ liệu tài liệu hiện vẫn được lưu cục bộ trong trình duyệt.
- Đồng bộ, đăng nhập và phân quyền trực tuyến chỉ hoạt động sau khi cấu hình Supabase và áp dụng chính sách RLS phù hợp.
- Không đưa khóa `service_role` hoặc khóa bí mật lên mã nguồn công khai.

## Triển khai
GitHub Pages: `https://form997.github.io/Offiice/writer/`

Nhánh phát triển: `v3-development`. Bản này chưa được gộp vào nhánh chính.


## V4 — định hướng phát triển
V4 phát triển trên nhánh riêng `v4-development`, kết hợp chế độ Văn bản kiểu Docs với chế độ Thiết kế trực quan kiểu Canva trong cùng tài liệu. V4 chưa thay đổi dữ liệu hoặc mã chạy V3 ở mốc Foundation.

- Kiến trúc: `../docs/WRITER-V4-ARCHITECTURE.md`
- Nhật ký: `../docs/WRITER-V4-RELEASE.md`

### Canvas Studio — V4.1 đang phát triển
- Mở Canvas từ tài liệu Writer bằng nút **Canvas Studio V4**; Writer truyền ID tài liệu hiện hành.
- Khi mở bằng ID hợp lệ, Canvas đọc/ghi metadata `design` trong cùng bản ghi `haidat-writer-documents-v2`; không tạo ID mới và không thay nội dung HTML.
- Có lưu tự động cục bộ, kéo thả, đổi kích thước, bảng thuộc tính, lớp, undo/redo, lưới, zoom và pan cơ bản.
- Nếu mở trực tiếp không có ID, Canvas dùng vùng thử riêng.
- Đặc tả: `../docs/WRITER-V4-CANVAS-STUDIO.md`; lộ trình: `../docs/WRITER-V4-ARCHITECTURE.md`.
- V4.1 chưa hoàn tất QA; chưa xác nhận chạy thực tế trên Android/desktop, chưa kiểm thử xung đột hai tab, giới hạn bộ nhớ hoặc DOCX/PDF. Nhánh V3 vẫn độc lập.


### Object Studio — V4.2 đang phát triển
- Chọn nhiều bằng Ctrl/Shift + chạm/bấm; Ctrl+A chọn tất cả.
- Kéo đồng thời lựa chọn; đối tượng cùng nhóm được chọn chung.
- Nhóm/Tách nhóm, căn trái/căn giữa/căn trên, chỉnh góc xoay và xóa nhiều đối tượng.
- Dữ liệu vẫn là từng đối tượng có ID riêng trong metadata Canvas của tài liệu Writer; không tạo bản sao tài liệu.
- V4.2 mới ở mức triển khai ban đầu, chưa hoàn tất QA và chưa xác nhận undo/redo toàn diện hoặc thao tác trên Android/desktop.


#### Bổ sung hoàn thiện phạm vi tương tác V4.2
- Tay nắm kéo để xoay đối tượng; tay nắm đổi kích thước theo tỉ lệ cho vùng chọn nhiều đối tượng.
- Căn lề trái, căn giữa ngang, căn trên của lựa chọn theo trang A4; vẫn có căn tương đối giữa các đối tượng.
- Ctrl+Shift+Z làm lại; snapshot undo được tạo trước các thao tác chỉnh sửa đối tượng, thuộc tính và nội dung.
- Đây là hoàn thiện mã chức năng trên nhánh phát triển, không đồng nghĩa đã qua kiểm thử thiết bị hoặc sẵn sàng phát hành.


### Image & Typography — V4.3 đang phát triển
- Ảnh: điều chỉnh crop hiển thị theo ngang/dọc/zoom, độ trong suốt, mô tả alt text; ảnh gốc vẫn được giữ.
- Văn bản: phông chữ, cỡ chữ, đậm/nghiêng, căn lề, chiều cao dòng, giãn chữ, màu và opacity.
- Bảng: sửa nội dung từng ô, thêm/xóa hàng/cột và bật/tắt hàng tiêu đề.
- Biểu đồ cột: chỉnh sửa nhãn, giá trị và màu; được lưu dưới dạng dữ liệu cấu trúc và dựng SVG khi hiển thị.
- Giới hạn: chưa nhúng font, chưa nén ảnh, chưa có biểu đồ nhiều chuỗi; crop hiện không phá hủy; chưa kiểm thử trình duyệt/Android/desktop hoặc xuất PDF/DOCX.


### Multi-page Studio — V4.4 đang phát triển
- Một tài liệu Writer có thể chứa nhiều trang Canvas, mỗi trang giữ danh sách đối tượng riêng.
- Có chuyển trang, thêm/xóa trang, đổi thứ tự và chọn trang bằng danh sách.
- Có khổ A4/A3/A5/Letter/tùy chỉnh, chiều dọc/ngang, kích thước mm, bốn lề và đường hướng dẫn vùng in.
- Dữ liệu mới lưu trong `design.pages[]` và `activePageId`; `design.items` vẫn phản chiếu trang đang mở để hỗ trợ dữ liệu V4 cũ.
- Tài liệu cũ chỉ có `design.items` được nạp thành trang đầu tiên; không đổi ID và không nhân bản tài liệu.
- Giới hạn: chưa có tự động tràn văn bản giữa các trang; vùng in chỉ là đường hướng dẫn; chưa có thumbnail trang hoặc kéo-thả thứ tự; chưa kiểm thử trình duyệt/Android/desktop và in/xuất thực tế.

- Khi thêm trang, có thể chọn mẫu trang trắng, bìa tài liệu, trang nội dung hoặc bảng dữ liệu. Các mẫu là đối tượng Canvas có thể chỉnh sửa, không phải ảnh nền.


### Document Integration — V4.5 đang phát triển
- Writer và Canvas lưu chung một bản ghi tài liệu, một ID; thêm revision ở cấp bản ghi, không đổi schemaVersion 3.
- Writer hợp nhất các trường độc lập (ví dụ HTML và bố cục) và chặn lưu khi cùng trường bị sửa khác nhau ở hai cửa sổ.
- Canvas kiểm tra revision và chữ ký bố cục trước khi lưu; không ghi đè bố cục mới hơn ở cửa sổ khác.
- Lịch sử Writer có thể chứa cả HTML và Canvas; lệnh khôi phục phục hồi cả hai khi snapshot có dữ liệu thiết kế. Canvas tạo mốc trước khi lưu bố cục.
- Backup version 5 chứa dữ liệu thiết kế, revision và lịch sử; vẫn nhập version 1–5.
- Giới hạn: localStorage cùng trình duyệt/origin; chưa đồng bộ liên thiết bị; chưa kiểm thử browser/Android/desktop hoặc hai tab sửa đồng thời; revision là phát hiện xung đột lạc quan, không phải khóa giao dịch phân tán tuyệt đối.


### Export Studio — V4.6 đang phát triển
- Nút **Xuất tệp** được tích hợp trong Writer và Canvas; dùng cùng ID tài liệu và dữ liệu cục bộ hiện hành.
- Định dạng: PDF (mở hộp thoại in để lưu PDF), DOCX, PNG, SVG, HTML và JSON.
- HTML chứa nội dung Writer và các trang Canvas; SVG/PNG xuất từng trang, nhiều trang đóng ZIP; JSON tạo backup version 5 có thể nhập bằng Khôi phục bản sao, gồm một tài liệu và lịch sử tương ứng; không phải backup toàn kho.
- DOCX tạo tại máy, giữ văn bản/bảng/dữ liệu biểu đồ; ảnh Canvas hiện được ghi chú thay vì nhúng. Bố cục tuyệt đối Canvas và font có thể khác bản gốc.
- Module không phụ thuộc CDN/API và được đưa vào precache PWA. Lần đầu vẫn cần tải ứng dụng/module để cache.
- Chưa kiểm thử trên trình duyệt thật, Word/LibreOffice, Android/desktop; chưa xác nhận PDF/PNG/SVG trên mọi engine. Chưa xem V4.6 là bản phát hành.
- Đặc tả: `../docs/WRITER-V4-EXPORT-STUDIO.md`.
