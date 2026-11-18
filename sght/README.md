# HAI ĐẤT SGHT — Bảng tính

## Giao diện làm việc chuyên nghiệp — 2026-11-18

### Thanh công cụ và bố cục
- Thanh tiêu đề: tên ứng dụng, trạng thái lưu, hoàn tác/làm lại, lưu, tạo bảng mới, xuất CSV.
- Thanh trình đơn: Trang chủ, Chèn, Công thức, Dữ liệu, Xem, Tệp.
- Thanh công cụ: bảng tạm, định dạng ô cơ bản, hàm nhanh, thu phóng.
- Thanh địa chỉ và công thức: hiển thị ô đang chọn, nhập và áp dụng biểu thức.
- Vùng lưới: tiêu đề cột/hàng cố định khi cuộn.
- Thanh trang tính và thanh trạng thái ở cuối vùng làm việc.
- Bố cục co giãn, thanh công cụ cuộn ngang trên điện thoại.

### Lệnh đang hoạt động
- Hoàn tác/làm lại lịch sử chỉnh sửa trong phiên hiện tại.
- Lưu thủ công và tự lưu vào localStorage.
- Sao chép/cắt/dán khi trình duyệt cấp quyền clipboard; vẫn hỗ trợ dán bằng thao tác hệ thống.
- Xóa nội dung ô đang chọn.
- Tạo công thức nhanh SUM, AVERAGE, COUNT.
- Thu phóng lưới từ 60% đến 160%.
- Xuất CSV UTF-8.

### Nền tảng bảng tính
- Lưới hiện tại vẫn dựng 16 cột × 40 hàng; chưa triển khai lưới mở rộng không giới hạn.
- Chọn ô, nhập/sửa nội dung qua thanh công thức.
- Công thức tham chiếu ô, ví dụ `=A1+B1`, `=SUM(A1:A5)`.
- Phát hiện tham chiếu vòng ở mức cơ bản.
- Dán vùng dữ liệu dạng tab/newline từ clipboard.
- Bộ máy công thức độc lập tại `engine/core.js`, không dùng `eval()`, `new Function()` hay thư viện spreadsheet bên ngoài.

### Giới hạn còn lại
Đây là bản phát triển giao diện, chưa phải sản phẩm thay thế Excel/Google Sheets. Chưa có nhiều trang tính thực sự, định dạng ô được lưu, biểu đồ, lọc/sắp xếp, nhập XLSX, cộng tác trực tuyến, đồng bộ đám mây hoặc kiểm soát quyền. Một số mục trình đơn là khung điều hướng cho các mô-đun sẽ phát triển tiếp. Dữ liệu localStorage chỉ nằm trên trình duyệt/thiết bị hiện tại; xóa dữ liệu trình duyệt có thể làm mất bản lưu.

### Chạy thử
Mở `sght/index.html` qua GitHub Pages sau khi workflow triển khai hoàn tất. Khi chạy cục bộ, cần phục vụ thư mục qua HTTP vì ứng dụng dùng JavaScript module.

## Nhật ký phát triển
- 2026-11-18 — Bản lưới tương tác đầu tiên, nối với bộ máy công thức.
- 2026-11-18 — Hiện đại hóa bố cục: thanh tiêu đề, trình đơn, ribbon công cụ, thanh công thức, thanh trang tính và trạng thái; bổ sung hoàn tác/làm lại, clipboard, hàm nhanh và thu phóng. Ghi rõ lưới mở rộng vô hạn vẫn là hạng mục tiếp theo.

## SGHT Macro Studio — nền móng đầu tiên — 2026-11-19

- Thêm ngôn ngữ macro khai báo độc lập tại `automation/macro-engine.js`; không dùng `eval()`, `new Function()`, JavaScript tùy ý, truy cập mạng hay hệ thống tệp.
- Lệnh hiện hỗ trợ: `SET`, `COPY`, `CLEAR`, `SUM`; có dòng ghi chú bắt đầu bằng `#`.
- Có bước phân tích cú pháp và xem trước trước khi chạy; thực thi yêu cầu xác nhận rõ ràng.
- Giới hạn an toàn: tối đa 2.000 lệnh/macro và 10.000 ô/lệnh.
- Có thể hoàn tác bằng lịch sử chỉnh sửa hiện tại.
- Chưa phải VBA: chưa chạy trực tiếp mã VBA, chưa có trình gỡ lỗi, sự kiện, lịch chạy hay AI sinh macro. Các phần đó là các chặng kế tiếp.
- Bổ sung kiểm thử tự động cho phân tích, quyền thực thi, thao tác dữ liệu và giới hạn an toàn.


## Macro Recorder — 2026-11-19

- Thêm máy ghi thao tác vào SGHT Macro Studio.
- Ghi thao tác nhập/sửa ô, xóa ô và dán vùng dữ liệu thành lệnh macro độc lập.
- Có nút bắt đầu/dừng ghi; khi dừng, mã được đưa vào trình soạn thảo để người dùng kiểm tra.
- Giới hạn 2.000 thao tác mỗi lượt ghi; tự dừng khi chạm giới hạn.
- Thao tác do macro đang chạy không bị ghi lặp vào recorder.
- Bổ sung kiểm thử cho trạng thái ghi, dừng, dán vùng và giới hạn.
- Chưa có ghi định dạng, chọn vùng, thao tác hàng/cột hoặc ghi sự kiện nền.
