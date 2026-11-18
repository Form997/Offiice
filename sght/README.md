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

## Macro Library — 2026-11-19 (bổ sung sửa lỗi khởi tạo)

- Thêm thư viện macro cục bộ: lưu, đọc, cập nhật, nhân bản và xóa macro.
- Mỗi macro có tên, mô tả, mã lệnh, thời điểm tạo/cập nhật và số phiên bản.
- Kiểm tra cú pháp macro trước khi lưu; từ chối macro rỗng, lệnh sai và tên trùng.
- Hỗ trợ xuất một macro hoặc toàn bộ thư viện dưới dạng JSON SGHT; hỗ trợ nhập lại.
- Dữ liệu nằm trong localStorage của trình duyệt, không tự tải lên máy chủ.
- Giới hạn: tối đa 100 macro, 50.000 ký tự/macro, 1 MB/thư viện.
- Bổ sung kiểm thử CRUD, nhân bản, nhập/xuất, kiểm tra dữ liệu và giới hạn.
- Chưa có đồng bộ đám mây, chia sẻ quyền, lịch sử phiên bản có thể khôi phục hoặc chữ ký số.

## Macro Debugger — 2026-11-19

- Thêm phiên gỡ lỗi có phê duyệt rõ ràng trước khi thực thi.
- Hỗ trợ chạy từng lệnh, tiếp tục chạy đến hết, dừng phiên và hoàn tác toàn bộ thay đổi của phiên.
- Nhật ký từng bước ghi số bước, dòng lệnh, loại lệnh và giá trị ô trước/sau.
- Mỗi lệnh được thực thi theo giao dịch nhỏ; nếu lệnh gặp lỗi trong lúc ghi dữ liệu, các thay đổi của chính lệnh đó được phục hồi.
- Hoàn tác phiên dựa trên ảnh chụp giá trị trước khi từng ô bị thay đổi.
- Nhật ký giao diện giới hạn hiển thị 30 bước gần nhất để giảm tải thiết bị.
- Chưa có breakpoint tùy ý, watch expressions, step-into/over hoặc debugger cho mã VBA.


## Macro Breakpoints & Watch — 2026-11-19

- Bổ sung breakpoint theo số dòng lệnh thực tế trong macro; khi chạy tiếp, debugger tự dừng trước khi thực thi lệnh tại dòng đã đánh dấu.
- Có thể đặt nhiều breakpoint, bỏ qua điểm dừng bằng cách bấm Tiếp tục lần nữa hoặc thực thi thủ công bằng Chạy 1 bước.
- Bổ sung Watch cho tối đa 50 ô, chấp nhận nhiều địa chỉ phân cách bằng dấu phẩy, chấm phẩy hoặc khoảng trắng.
- Giá trị Watch được đọc khi cấu hình và cập nhật sau mỗi lệnh, hiển thị cạnh nhật ký bước.
- Địa chỉ Watch không hợp lệ và breakpoint không trỏ tới dòng lệnh sẽ bị từ chối, không âm thầm bỏ qua.
- Breakpoint chỉ áp dụng cho các dòng có lệnh đã phân tích; dòng ghi chú/trống không tạo điểm dừng.
- Vẫn yêu cầu phê duyệt trước khi thực thi; tiếp tục giữ cơ chế hoàn tác phiên và giới hạn nhật ký 30 bước trên giao diện.
- Chưa có conditional breakpoint, biểu thức Watch, step-into/over hoặc debugger VBA.
