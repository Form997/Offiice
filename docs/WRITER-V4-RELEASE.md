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


### Đối chiếu nhánh sau cập nhật
- GitHub compare `v3-development...v4-development`: 21 commit ahead, 0 behind.
- 7 tệp thay đổi so với V3; tổng 171 dòng thêm, 1 dòng xóa (theo GitHub compare).
- Thống kê này gồm cả tài liệu kiến trúc/lộ trình và mã prototype; không phải số dòng tính riêng cho V4.1.
- Dung lượng byte chưa ghi vì chưa có phép đo blob/file size đáng tin cậy.
- Trạng thái: mã tích hợp ban đầu đã nằm trên nhánh V4; chưa có CI/browser/Android QA xác nhận. V4.1 vẫn đang phát triển.


## 17/11/2026 — V4.2 Object Studio (bản triển khai ban đầu)

### Nội dung đã ghi lên nhánh `v4-development`
- Bổ sung chọn nhiều đối tượng bằng Ctrl/Shift + chạm/bấm, chế độ Chọn nhiều dành cho màn hình cảm ứng và chọn toàn bộ bằng Ctrl+A.
- Kéo đồng thời các đối tượng đang chọn; khi chọn một đối tượng đã nhóm, các thành viên cùng nhóm được chọn chung.
- Bổ sung Nhóm/Tách nhóm bằng metadata `groupId`, không hợp nhất nội dung thành ảnh.
- Bổ sung căn trái, căn giữa theo trục ngang, căn trên; thêm trường góc xoay cho từng đối tượng.
- Xóa áp dụng cho toàn bộ lựa chọn; tiếp tục giữ dữ liệu đối tượng riêng biệt và lưu trong `design.items` của cùng tài liệu.

### Chưa hoàn tất / cần QA
- Chưa xác minh thao tác trên trình duyệt thật, Android cảm ứng và desktop.
- Bổ sung tiếp: tay nắm xoay trực quan cho đối tượng đơn; tay nắm resize theo tỉ lệ cho vùng chọn nhiều đối tượng; căn lề trái/giữa/trên theo trang; Ctrl+Shift+Z để làm lại.
- Bổ sung snapshot trước chỉnh sửa thuộc tính và trước khi sửa nội dung văn bản để hỗ trợ undo.
- Các thao tác nhóm, căn chỉnh và căn theo trang có gọi lưu tự động; thao tác kéo/xoay/resize được lưu qua sự kiện pointerup.
- Chưa chạy kiểm thử dữ liệu cũ, lưu offline, xung đột hai tab hoặc hiệu năng với nhiều đối tượng/ảnh lớn.
- Trạng thái mã: đã bổ sung các hạng mục tương tác còn thiếu trong phạm vi Object Studio ban đầu. Trạng thái QA: chưa xác minh bằng trình duyệt thật hoặc thiết bị Android/desktop; chưa đủ điều kiện tuyên bố V4.2 đạt phát hành.
- Không phát hành và không gộp vào V3/main.


## 17/11/2026 — V4.3 Image & Typography (triển khai ban đầu)

### Nội dung đã ghi lên nhánh v4-development
- Ảnh: thêm điều chỉnh khung cắt không phá hủy (crop X/Y, zoom), độ trong suốt và alt text; ảnh gốc vẫn được giữ trong data URL.
- Kiểu chữ: chọn phông chữ hệ thống, cỡ chữ, đậm/nghiêng, căn lề, chiều cao dòng, giãn chữ, màu và độ trong suốt.
- Bảng: thêm đối tượng bảng dạng dữ liệu ô; nhấp đúp sửa từng ô; thêm/xóa hàng và cột; bật/tắt hàng tiêu đề.
- Biểu đồ: thêm biểu đồ cột SVG có dữ liệu nhãn/giá trị chỉnh sửa được, màu cột và kích thước riêng.
- Mở rộng bảng thuộc tính theo loại đối tượng; các thuộc tính mới lưu trong design.items của cùng hồ sơ, không tạo ID tài liệu mới.
- Thêm autosave sau khi cập nhật thuộc tính và dữ liệu bảng/biểu đồ.

### Giới hạn và kiểm thử còn thiếu
- Crop hiện là khung hiển thị không phá hủy; chưa tạo file ảnh đã cắt riêng.
- Phông chữ dùng font hệ thống, chưa nhúng font vào tài liệu; biểu đồ mới hỗ trợ dạng cột cơ bản.
- Ảnh nhúng dạng data URL có thể làm tăng nhanh dung lượng localStorage; chưa có nén ảnh, cảnh báo quota hoặc kho media riêng.
- Chưa chạy browser QA, Android/desktop QA, kiểm thử in, xuất DOCX/PDF, phục hồi sau crash hoặc xung đột nhiều tab.
- Mã đã được ghi lên nhánh phát triển; chưa phát hành, chưa merge vào V3/main.

### Đối chiếu nhánh sau cập nhật V4.3
- GitHub compare `v3-development...v4-development`: 44 commit ahead, 0 behind tại thời điểm ghi nhận trước commit nhật ký này.
- 7 tệp khác biệt so với V3: 355 dòng thêm, 1 dòng xóa theo GitHub compare; số liệu gồm cả lịch sử V4.0–V4.3, không phải riêng V4.3.
- Tệp Canvas Studio có 32.755 ký tự theo nội dung fetch; đây không phải phép đo dung lượng byte.
- Kiểm tra tĩnh: JavaScript trong trang Canvas phân tích cú pháp thành công; chưa thay thế kiểm thử giao diện trên trình duyệt/thiết bị.


## 17/11/2026 — V4.4 Multi-page Studio (triển khai ban đầu)

### Nội dung đã ghi lên nhánh `v4-development`
- Nâng Canvas từ một trang mô phỏng thành mô hình nhiều trang trong cùng hồ sơ Writer.
- Thêm chuyển trang, thêm trang, xóa trang có xác nhận, đổi thứ tự trang lên/xuống và chọn trang bằng danh sách.
- Tách riêng `items[]` theo từng trang; chuyển trang không làm lẫn đối tượng.
- Bổ sung khổ A4/A3/A5/Letter/tùy chỉnh, chiều dọc/ngang, kích thước tùy chỉnh theo mm, bốn lề và đường gợi ý vùng in.
- Mở rộng undo/redo để chụp trạng thái cả bộ trang.
- Lưu `design.pages[]` và `activePageId`; vẫn duy trì `design.items` và `design.page` cho khả năng tương thích với dữ liệu Canvas cũ.
- Tài liệu cũ có `design.items` được đưa vào trang đầu tiên khi nạp; cấu trúc mới được lưu khi người dùng lưu hoặc phát sinh autosave.
- Không tạo ID tài liệu mới; không thay đổi HTML Writer và các trường dữ liệu khác.

### Kiểm tra tĩnh
- JavaScript trong `writer/canvas-studio.html` đã được trích xuất và phân tích cú pháp bằng `new Function(...)`: thành công.
- Kiểm tra này chỉ xác nhận cú pháp JavaScript; không chứng minh giao diện hoặc các thao tác hoạt động đúng trong trình duyệt.

### Giới hạn / QA còn thiếu
- Đường vùng in hiện chỉ là hướng dẫn trực quan, chưa có engine in hoặc xuất PDF/DOCX.
- Chưa tự động tràn văn bản giữa các trang; chưa có thumbnail trang, kéo-thả sắp thứ tự hoặc cảnh báo đối tượng vượt lề.
- Chưa chạy browser QA, Android/desktop QA, kiểm thử khôi phục crash, quota localStorage, xung đột nhiều tab hoặc in/xuất thực tế.
- V4.4 là mã triển khai ban đầu trên nhánh phát triển, chưa được xem là bản phát hành.
- V3 vẫn độc lập; không merge, không deploy và không phát hành chính thức.

### Tệp và commit
- `writer/canvas-studio.html` — commit tính năng: `c047220c82487e47850a729110118e9ded4d2ff2`.
- Cập nhật kiến trúc, README và nhật ký trong các commit tài liệu kế tiếp.

### Bổ sung mẫu trang V4.4
- Thêm bộ chọn mẫu khi tạo trang: trang trắng, bìa tài liệu, trang nội dung và trang bảng dữ liệu.
- Mẫu sinh các đối tượng văn bản/đường kẻ/bảng có cấu trúc; người dùng tiếp tục chỉnh sửa từng đối tượng như bình thường.
- Các bố cục mẫu được căn theo khung A4 mặc định; khi đổi sang khổ khác, người dùng cần tự rà soát vị trí và kích thước.
