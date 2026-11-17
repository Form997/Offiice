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


## V4.4 — Multi-page Studio (triển khai ban đầu)

### Mô hình dữ liệu nhiều trang
- Mở rộng metadata Canvas thành `design.pages[]`; mỗi trang có `id`, `name`, `items[]` và `settings` riêng.
- `design.activePageId` xác định trang đang mở. `design.items` tiếp tục phản chiếu đối tượng của trang hiện hành để giữ đường tương thích với mã V4.1–V4.3; `design.page` tiếp tục lưu thông số trang hiện hành theo dạng tương thích.
- Không tạo hồ sơ Writer mới và không đổi ID tài liệu. Nội dung HTML, thư mục và các trường khác của bản ghi tiếp tục được giữ nguyên.
- Tài liệu cũ chỉ có `design.items` được nạp thành trang đầu tiên. Cấu trúc nhiều trang được ghi bền vững khi người dùng lưu hoặc có thay đổi phát sinh autosave; không tự động ghi đè dữ liệu chỉ vì mở tài liệu.

### Chức năng
- Chọn trang bằng danh sách, chuyển trang trước/sau, thêm trang, xóa trang (có xác nhận) và đổi thứ tự trang lên/xuống.
- Mỗi trang có lớp đối tượng riêng; chuyển trang không trộn đối tượng giữa các trang.
- Khổ giấy A4, A3, A5, Letter và tùy chỉnh; chiều dọc/ngang; chiều rộng/cao tùy chỉnh theo mm.
- Thiết lập lề trên/phải/dưới/trái và bật/tắt đường gợi ý vùng in.
- Undo/redo lưu trạng thái cả bộ trang, không chỉ danh sách đối tượng của một trang.

### Giới hạn cần giữ rõ
- Đường vùng in hiện là đường hướng dẫn trực quan; chưa phải engine in, dàn trang hoặc xuất PDF/DOCX.
- Chưa có luồng văn bản tự động tràn từ trang này sang trang khác; đối tượng vẫn có tọa độ độc lập trong từng trang.
- Chưa có thumbnail trang, kéo-thả sắp thứ tự hoặc kiểm tra nội dung tràn khỏi lề.
- Chưa kiểm thử browser thực tế, Android/desktop, khôi phục sau crash, localStorage quota, nhiều tab hoặc khả năng in/xuất.

- Mẫu trang dựng sẵn: trang trắng, bìa tài liệu, trang nội dung và trang bảng dữ liệu; mẫu tạo các đối tượng Canvas có thể sửa riêng, không phải ảnh nền.


## V4.5 — Document Integration (triển khai ban đầu)

### Một bản ghi, một revision
- Writer và Canvas tiếp tục dùng cùng bản ghi trong `haidat-writer-documents-v2`; ID tài liệu không đổi, không tạo hồ sơ phụ.
- Thêm trường `revision` ở cấp bản ghi để đánh dấu lần lưu. Trường này độc lập với `schemaVersion: 3`; không ép chuyển đổi schema V3.
- Writer hợp nhất thay đổi theo từng trường giữa bản đang mở và bản mới nhất trong localStorage. Những thay đổi độc lập (ví dụ Writer sửa HTML, Canvas sửa `design`) được giữ chung; nếu cùng một trường bị sửa khác nhau ở hai cửa sổ, hệ thống chặn ghi đè và báo xung đột.
- Canvas kiểm tra revision và chữ ký dữ liệu `design`; nếu bố cục đã đổi từ cửa sổ khác, Canvas từ chối lưu đè. Nếu chỉ nội dung Writer đổi, Canvas có thể ghi `design` lên bản ghi mới nhất mà vẫn giữ HTML mới.
- Sự kiện `storage` giúp các cửa sổ cùng nguồn gốc nhận biết cập nhật. Khi Writer đang có chỉnh sửa cục bộ, nó giữ nội dung đó và thực hiện hợp nhất khi lưu.

### Lịch sử phiên bản chung
- Mốc lịch sử giữ `html` và có thể kèm `design`; danh sách lịch sử Writer hiện rõ mốc nào có cả Văn bản + Canvas.
- Lệnh Khôi phục trong Writer khôi phục cả HTML lẫn `design` khi mốc có dữ liệu Canvas. Mốc cũ chỉ có HTML vẫn hoạt động và không tự xóa bố cục hiện tại.
- Canvas tạo mốc bảo vệ trạng thái trước khi ghi bố cục mới. Lịch sử tiếp tục dùng khóa `haidat-writer-history-v1`, tối đa 6 mốc/tài liệu và giới hạn tổng hiện hành 1.100.000 ký tự ước tính.
- Nếu bố cục Canvas quá lớn (trên ngưỡng 500.000 ký tự JSON trong snapshot Writer hoặc tổng snapshot Canvas vượt 650.000 ký tự), snapshot đầy đủ có thể bị bỏ qua hoặc thao tác lưu Canvas bị chặn để tránh ghi mà không có mốc bảo vệ.

### Sao lưu
- Bản sao lưu Writer tăng định dạng lên version 5; xuất kèm `design`, `revision` và lịch sử có dữ liệu Canvas.
- Bộ nhập vẫn chấp nhận backup version 1–5; khi hợp nhất, bản ghi cùng ID vẫn được xử lý theo quy tắc cập nhật mới hơn hiện có.

### Ranh giới kỹ thuật
- Đồng bộ chỉ trong cùng trình duyệt/origin qua localStorage; chưa có đồng bộ liên thiết bị hoặc máy chủ.
- Revision là cơ chế phát hiện và hợp nhất lạc quan, không phải khóa giao dịch phân tán tuyệt đối. Hai lần ghi đồng thời sát nhau vẫn cần kiểm thử thực tế.
- Không có Supabase, tài khoản hoặc chia sẻ cộng tác trong V4.5.


## V4.6 — Export Studio (triển khai ban đầu)
- Thêm module ngoại tuyến `writer/export-studio.js`, dùng chung trong Writer và Canvas, xác định hồ sơ theo ID hiện hành.
- Có xuất PDF qua hộp thoại in trình duyệt, DOCX OOXML cục bộ, PNG, SVG, HTML và JSON.
- HTML chứa nội dung Writer và trang Canvas dạng SVG; SVG/PNG xuất từng trang, nhiều trang đóng gói ZIP; JSON tạo backup Writer version 5 tương thích chức năng Khôi phục bản sao, gồm một bản ghi và lịch sử của ID; không phải backup toàn kho.
- DOCX giữ văn bản Writer/Canvas, bảng và dữ liệu biểu đồ; ảnh Canvas hiện thay bằng dòng mô tả. PDF phụ thuộc engine in; chưa phải bộ máy PDF độc lập.
- Không dùng CDN/API cho module; service worker precache module để dùng ngoại tuyến sau lần tải đầu.
- Chưa có browser QA, kiểm thử DOCX bằng Word/LibreOffice, PDF cross-browser, PNG/SVG Android, tài liệu lớn hoặc kiểm thử phục hồi. V4.6 chưa được xem là hoàn tất QA/phát hành.
- Đặc tả: `docs/WRITER-V4-EXPORT-STUDIO.md`.


## V4.7 — Mobile & Performance (triển khai ban đầu)
- Tối ưu vùng thao tác màn hình nhỏ: nút cảm ứng tối thiểu 44 px ở Writer; thanh công cụ cuộn ngang; vùng trang hỗ trợ cuộn quán tính.
- Canvas: thu gọn thanh công cụ và bảng thêm đối tượng; bảng thuộc tính thích ứng; tăng vùng chạm và hỗ trợ giảm chuyển động theo thiết lập hệ điều hành.
- Tự tính lại mức thu phóng “Vừa trang” khi xoay màn hình hoặc đổi kích thước cửa sổ nhỏ; giữ nguyên kích thước/tọa độ thiết kế gốc.
- Kiểm tra loại ảnh; cảnh báo từ 1 MB và yêu cầu xác nhận trên 3 MB. Không tự nén ảnh, không khẳng định đã giải quyết quota localStorage.
- Chưa có virtualized rendering; mỗi lần render vẫn dựng lại các đối tượng của trang hiện hành. Chưa benchmark Android/desktop thực tế.
