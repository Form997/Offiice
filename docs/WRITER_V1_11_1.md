# Writer V1.11.1 — Hotfix khởi động và mở tệp

- Ngày: 16/11/2026
- Sửa lỗi khởi động: loại bỏ binding tới `#universalOpenFile` không tồn tại.
- Trên trình duyệt không hỗ trợ File System Access API, nút Mở tệp chuyển sang ô chọn tệp thực có.
- Hai ô chọn tệp HTML/TXT và DOCX/ODT dùng chung bộ xử lý mở tệp, bao gồm các định dạng đã hỗ trợ.
- Mở rộng bộ lọc định dạng ở ô chọn tệp thông thường để hỗ trợ DOCX, ODT, HTML, TXT, MD, CSV và RTF.
- Tăng phiên bản tham chiếu app.js và cache service worker để tránh giữ mã V1.11 lỗi.
- Không thay đổi kho tài liệu nội bộ, localStorage hay IndexedDB của người dùng.

## Giới hạn
Đây là hotfix liên kết giao diện và bộ chọn tệp. Các giới hạn nhập DOC/ODT/RTF/CSV và khả năng truy cập thư mục tùy trình duyệt vẫn như V1.11.
