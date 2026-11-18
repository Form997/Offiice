# HAI ĐẤT SGHT — Bảng tính

## Bản giao diện đầu tiên

SGHT có lưới ô làm việc trực tiếp, không còn chỉ là thư mục chứa bộ máy công thức.

### Đã có
- Lưới 16 cột × 40 hàng hiển thị; địa chỉ ô dạng A1, B1...
- Chọn ô, nhập/sửa nội dung qua thanh công thức.
- Công thức tham chiếu ô, ví dụ `=A1+B1`, `=SUM(A1:A5)`.
- Tính lại các ô khi dữ liệu nguồn thay đổi.
- Phát hiện tham chiếu vòng ở mức cơ bản.
- Dán vùng dữ liệu dạng tab/newline từ clipboard.
- Tự lưu dữ liệu và tên bảng tính trong localStorage của trình duyệt.
- Xuất dữ liệu thô thành CSV UTF-8.
- Giao diện co giãn, ưu tiên điện thoại.

### Chạy thử
Mở `sght/index.html` qua GitHub Pages sau khi workflow triển khai hoàn tất. Khi chạy cục bộ, cần phục vụ thư mục qua HTTP (ví dụ máy chủ tĩnh) vì ứng dụng dùng JavaScript module.

### Phạm vi chưa có
Đây là bản nền giao diện, chưa phải sản phẩm thay thế Excel/Google Sheets. Chưa có nhiều trang tính, định dạng ô, biểu đồ, lọc/sắp xếp, nhập XLSX, cộng tác trực tuyến, đồng bộ đám mây, hay kiểm soát quyền. Dữ liệu localStorage chỉ nằm trên trình duyệt/thiết bị hiện tại; xóa dữ liệu trình duyệt có thể làm mất bản lưu.

### Bộ máy công thức
Ứng dụng dùng bộ máy độc lập tại `engine/core.js`; không dùng `eval()`, `new Function()` hay thư viện spreadsheet bên ngoài. Các giới hạn tương thích hàm được ghi trong `FORMULA_ENGINE_0_1.md`.

## Nhật ký
- 2026-11-18: Tạo lưới bảng tính tương tác đầu tiên và nối với bộ máy công thức SGHT.
