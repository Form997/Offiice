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


## 17/11/2026 — V4.5 Document Integration (triển khai ban đầu)

### Nội dung đã ghi lên nhánh `v4-development`
- Thêm `revision` ở cấp bản ghi tài liệu; không đổi ID và không nâng `schemaVersion: 3`.
- Writer hợp nhất thay đổi theo từng trường dựa trên bản gốc và dữ liệu mới nhất trong localStorage; bảo toàn thay đổi độc lập và chặn ghi đè khi cùng trường có xung đột.
- Canvas kiểm tra revision/chữ ký `design`, bảo toàn nội dung Writer mới nhất khi chỉ có chỉnh sửa bố cục, và từ chối ghi nếu một cửa sổ khác đã thay đổi chính bố cục.
- Thêm lắng nghe sự kiện `storage` ở cả Writer và Canvas để nhận biết cập nhật giữa các cửa sổ cùng origin.
- Lịch sử phiên bản Writer có thể lưu cả `html` và `design`; khôi phục từ Writer phục hồi cả hai phần nếu snapshot có Canvas.
- Canvas ghi mốc trạng thái trước khi thay đổi bố cục; giới hạn snapshot và dung lượng lịch sử được ghi rõ để tránh che giấu giới hạn localStorage.
- Nâng định dạng backup lên version 5, vẫn nhập được version 1–5; backup chứa bản ghi, revision và lịch sử Canvas.
- Bổ sung nhãn lịch sử cho mốc có cả Writer + Canvas và đổi lối vào thành Canvas Studio V4.5.

### Kiểm tra tĩnh
- `writer/app.js` đã được trích xuất và phân tích cú pháp bằng `new Function(...)`: thành công.
- JavaScript nội tuyến trong `writer/canvas-studio.html` đã được trích xuất và phân tích cú pháp: thành công.
- Chưa chạy trình duyệt thật; kiểm tra cú pháp không xác nhận hành vi UI, đồng bộ nhiều tab hoặc độ bền lưu trữ.

### QA còn thiếu / giới hạn
- Chưa kiểm thử hai tab sửa đồng thời, hai tab cùng sửa một trường, phục hồi sau crash, localStorage quota hoặc tình huống ghi sát nhau.
- Đồng bộ chỉ hoạt động trong cùng trình duyệt/origin; chưa có đồng bộ nhiều thiết bị hoặc máy chủ.
- Writer snapshot có thể bỏ phần Canvas nếu JSON thiết kế vượt 500.000 ký tự; Canvas chặn lưu nếu snapshot bảo vệ đầy đủ vượt 650.000 ký tự.
- Lịch sử tối đa 6 mốc/tài liệu và tổng khoảng 1.100.000 ký tự ước tính; giới hạn thực tế của localStorage phụ thuộc trình duyệt.
- V4.5 chưa phải bản phát hành; không merge/deploy vào V3/main. Supabase vẫn để sau.

### Tệp chính
- `writer/app.js` — revision, hợp nhất thay đổi, lịch sử đầy đủ và backup v5.
- `writer/canvas-studio.html` — revision-aware save, snapshot Canvas và nhận biết xung đột.
- `writer/index.html` — nhãn V4.5 và mô tả lịch sử chung.
- `docs/WRITER-V4-DOCUMENT-INTEGRATION.md` — hợp đồng dữ liệu và quy tắc đồng bộ.


### Bổ sung kiểm tra logic V4.5 (harness mô phỏng localStorage)
- Hợp nhất thành công khi Writer sửa HTML và Canvas sửa `design` độc lập: giữ cả hai thay đổi, revision tăng.
- Khi hai cửa sổ cùng sửa trường HTML thành hai giá trị khác nhau: hàm persist từ chối ghi và không thay dữ liệu đang lưu.
- Thao tác chuyển tài liệu vào thùng rác vẫn được lưu khi tài liệu khác đang mở.
- Xóa vĩnh viễn một tài liệu khỏi bộ nhớ cục bộ vẫn được phản ánh khi một tài liệu khác đang mở.
- Đây là kiểm tra logic của hàm persist với localStorage giả lập; không thay thế kiểm thử trình duyệt thật, đồng bộ đa tab hoặc Canvas runtime.
- Service worker được nâng cache key lên `haidat-writer-v4-5-r1`, đổi URL cache-bust sang `app.js?v=4.5` và precache `canvas-studio.html`.
- Kích thước UTF-8 hiện tại (không phải phần tăng thêm): `app.js` 84,931 byte; `canvas-studio.html` 48,334 byte; `sw.js` 1,129 byte.


## 17/11/2026 — V4.6 Export Studio (triển khai ban đầu)

### Nội dung đã ghi lên nhánh `v4-development`
- Tạo `writer/export-studio.js`: module xuất tệp độc lập, không thêm thư viện CDN hoặc API.
- Tích hợp nút **Xuất tệp** trong Writer và Canvas Studio; định vị hồ sơ bằng ID hiện hành, đọc dữ liệu cùng lịch sử từ localStorage.
- PDF: mở cửa sổ in, người dùng chọn “Lưu thành PDF”.
- DOCX: tạo gói OOXML/ZIP tại thiết bị; giữ nội dung văn bản Writer/Canvas, bảng và dữ liệu biểu đồ.
- PNG/SVG: dựng đối tượng Canvas theo từng trang; nhiều trang được đóng gói ZIP.
- HTML: xuất nội dung Writer và trang Canvas dạng SVG; JSON: xuất bản ghi cùng lịch sử của tài liệu hiện hành.
- Nâng service worker cache key lên `haidat-writer-v4-6-r1`, precache `export-studio.js?v=4.6` và đổi cache-bust app.js sang V4.6.
- Không thay ID, khóa lưu trữ hoặc `schemaVersion: 3`; không chạm V3.

### Kiểm tra đã thực hiện
- Module `writer/export-studio.js` được phân tích cú pháp tĩnh bằng Function constructor: thành công.
- Kiểm tra nhánh hiện có và so sánh V3/V4 trước khi sửa: V4 có 73 commit ahead, 0 behind tại thời điểm bắt đầu mốc này.

### Giới hạn và QA còn thiếu
- Chưa chạy browser runtime hoặc thao tác tải tệp thật trên Android/desktop.
- Chưa mở DOCX bằng Word/LibreOffice để xác nhận round-trip; ảnh Canvas hiện được thay bằng dòng mô tả trong DOCX.
- PDF phụ thuộc hộp thoại in và engine của trình duyệt; chưa kiểm thử nhiều trình duyệt.
- Chưa xác minh PNG/SVG với ảnh nhúng lớn, dữ liệu lớn, popup bị chặn hoặc thiết bị không hỗ trợ Canvas 2D.
- PNG/SVG xuất phần đồ họa Canvas; nếu không có Canvas thì tạo SVG giản lược từ văn bản Writer. JSON là gói của một tài liệu và lịch sử tương ứng, không phải backup toàn kho.
- V4.6 mới ở mức triển khai ban đầu; chưa đủ điều kiện tuyên bố phát hành.

### Tệp chính
- `writer/export-studio.js` — bộ xuất PDF/DOCX/PNG/SVG/HTML/JSON.
- `writer/index.html` và `writer/canvas-studio.html` — tích hợp giao diện.
- `writer/sw.js` — cache ngoại tuyến V4.6.
- `docs/WRITER-V4-EXPORT-STUDIO.md` — đặc tả và giới hạn.

### Bảo toàn nhánh
- Chỉ cập nhật `v4-development`; không merge/deploy vào `v3-development` hoặc `main`.
- Supabase vẫn để sau; module xuất không cần tài khoản hoặc khóa bí mật.
