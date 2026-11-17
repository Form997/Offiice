# HAI ĐẤT OFFICE V4.6 — Export Studio

- Ngày: 17/11/2026
- Nhánh: `v4-development`
- Trạng thái: triển khai ban đầu; chưa phải bản phát hành.
- Thành phần: `writer/export-studio.js`, tích hợp trong Writer và Canvas Studio.

## Mục tiêu

Xuất dữ liệu từ cùng một hồ sơ Writer/Canvas, không tạo ID mới, không gửi nội dung lên máy chủ và không cần thư viện CDN. Công cụ được cache cùng PWA để có thể dùng sau khi tải ứng dụng lần đầu.

## Định dạng

| Định dạng | Cách tạo | Nội dung / giới hạn |
|---|---|---|
| PDF | Mở cửa sổ in của trình duyệt | Người dùng chọn máy in hoặc “Lưu thành PDF”; chất lượng và phân trang phụ thuộc engine in |
| DOCX | Tạo gói Office Open XML/ZIP tại máy | Có nội dung Writer, ngắt trang, văn bản Canvas, bảng và dữ liệu biểu đồ. Ảnh Canvas hiện được thay bằng dòng mô tả; chưa nhúng bitmap |
| PNG | Dựng SVG thành ảnh qua Image + Canvas 2D | Một trang tạo một PNG; nhiều trang đóng gói ZIP. Ảnh nhúng dạng data URL được dựng nếu trình duyệt hỗ trợ |
| SVG | Dựng đối tượng Canvas thành SVG | Một trang tạo một SVG; nhiều trang đóng gói ZIP. Đây là đồ họa vector, ảnh bitmap nhúng vẫn là bitmap |
| HTML | Tạo tệp HTML tự chứa | Gồm nội dung Writer và các trang Canvas dạng SVG; phù hợp xem ngoại tuyến |
| JSON | Đóng gói bản ghi và lịch sử của tài liệu | Tạo JSON tương thích backup version 5 của Writer, gồm một tài liệu cùng lịch sử; có thể nhập bằng Khôi phục bản sao. Không chứa toàn bộ kho tài liệu/thùng rác/thư mục. |

## Kiến trúc

- Module độc lập `writer/export-studio.js`, không thêm dependency từ CDN.
- Nút “Xuất tệp” xuất hiện trong Writer và Canvas Studio; tài liệu được xác định bằng ID hiện hành hoặc tham số `documentId`.
- Đọc bản ghi từ `haidat-writer-documents-v2`; lịch sử từ `haidat-writer-history-v1`.
- Không ghi thay đổi vào nội dung gốc khi xuất. Canvas được yêu cầu lưu trước khi module đọc bản ghi.
- PNG/SVG lấy dữ liệu từ `design.pages[]`; tài liệu cũ chỉ có `design.items` được đọc như một trang.
- DOCX dùng gói ZIP không nén với các thành phần OOXML tối thiểu; không cần server.
- PDF không tự tải tệp PDF trực tiếp: trình duyệt mở hộp thoại in và người dùng chọn “Lưu thành PDF”.

## Kiểm thử và giới hạn

- Phân tích cú pháp tĩnh bằng Function constructor: `writer/app.js`, module Export Studio, JavaScript nội tuyến Canvas và `writer/sw.js` đều đạt.
- Kiểm tra tĩnh xác nhận module được nhúng trong Writer/Canvas và được precache bởi service worker.
- Harness logic giả lập xác nhận: JSON backup version 5 có một tài liệu và lịch sử; HTML chứa cả Writer + Canvas; SVG/PNG nhiều trang tạo gói ZIP; DOCX có chữ ký ZIP và bốn thành phần OOXML chính; luồng PDF gọi hộp thoại in.
- Các kiểm tra trên dùng môi trường giả lập, không chứng minh tải tệp và hiển thị thực tế trong trình duyệt.
- Chưa chạy browser runtime, chưa tạo và mở tệp bằng Microsoft Word/LibreOffice, chưa kiểm tra PNG/SVG trên Android, chưa xác minh PDF với các engine in khác nhau.
- Chưa kiểm tra tài liệu rất lớn, ảnh data URL lớn, lỗi bộ nhớ, popup bị chặn hoặc thiết bị không hỗ trợ Canvas 2D.
- DOCX hiện giữ văn bản/bảng/dữ liệu biểu đồ nhưng không nhúng ảnh Canvas; định dạng font và vị trí tuyệt đối Canvas không được bảo toàn hoàn toàn trong DOCX.
- PNG/SVG chỉ xuất phần đồ họa Canvas; nếu hồ sơ không có Canvas, module tạo trang SVG văn bản giản lược từ nội dung Writer.
- PDF là quy trình in của trình duyệt, không phải thư viện xuất PDF nhúng.
- Gói JSON hiện chứa bản ghi cùng lịch sử của ID đó, không bao gồm toàn bộ kho tài liệu/thùng rác/thư mục.

## Bảo toàn nhánh

Chỉ cập nhật `v4-development`. Không sửa, merge hoặc deploy `v3-development` hay `main`. Không thay đổi `schemaVersion: 3`, ID tài liệu hoặc khóa lưu trữ hiện có.
