# SGHT B5.5 — Kiểm tra tiền triển khai kéo thả và kích thước lưới
Ngày kiểm tra: 21/11/2026
Nhánh: `v1-development`
Phạm vi: chỉ kiểm tra mã nguồn mới nhất; chưa sửa engine hoặc dữ liệu.

## 1. Tệp và phiên bản đã đọc
- `sght/index.html` — blob `ea8984f0b85d37046d563afe21f8957b5d9a9c70`
- `sght/app.js` — blob `52497775d180407e1cb19ea090e463eafd1a3839`
- `sght/style.css` — blob `7da566b8184a08f2748434dc6a2d5aa4e102fe5f`
- `sght/README.md` — blob `a3ddc02c4108e4a758e1dfebadb31bc288428774`
- `sght/engine/sparse-grid.js` — blob `de7d01d3154c589fb3f9769784044a32a4b58eca`
- `sght/engine/freeze-panes.js` — blob `59c08dd4477a1b6b395b436a0db9b16017d75880`
- `sght/engine/history.js` — blob `9b47e86d03b76b276084af42c41796c31db50417`
- `sght/engine/workbook-sheets.js` — blob `1354cb65670ea4535769598d4ff8dcd9071f8abc`

## 2. Hiện trạng xác minh được
- Lưới hiện dùng kích thước đồng nhất: hàng 32 px, cột 108 px.
- `getVirtualWindow` tính hàng/cột nhìn thấy, offset và vùng đệm bằng một `rowHeight` và một `columnWidth` cố định.
- `buildFreezeLayout` tính vùng ghim bằng phép nhân số hàng/cột ghim với hai kích thước cố định.
- `choose()`, cuộn gần cuối lưới và các pane chia vùng cũng dùng cùng hai hằng số kích thước.
- Bộ dựng DOM hiện có tiêu đề hàng/cột nhưng chưa có tay nắm kéo đổi kích thước.
- Kéo di chuyển vùng dữ liệu hiện dùng HTML Drag and Drop trên lưới chính; chưa thấy đường xử lý tương đương được nối cho các lưới phụ/chia vùng. Kéo điền dữ liệu đã có Pointer Events riêng.
- `workbook-sheets.js` chuẩn hóa từng sheet bằng danh sách trường cho phép; trường kích thước mới sẽ bị loại nếu không mở rộng schema.
- `storeActiveSheet()` là điểm ghi trạng thái trang tính vào workbook.
- `history.js` hiện chụp dữ liệu ô và định dạng; thay đổi chiều rộng/cao không nằm trong snapshot undo/redo hiện tại.

## 3. Vì sao chưa thể chỉ thêm CSS resize
Đổi chiều rộng riêng từng cột hoặc chiều cao riêng từng hàng sẽ làm sai vị trí ô nếu vẫn giữ phép tính offset đồng nhất. Sai lệch sẽ xuất hiện khi cuộn xa, ghim hàng/cột, chia hai hoặc bốn pane, điều hướng tới địa chỉ và tự mở rộng lưới. Chỉ gắn `resize: col-resize` hoặc đổi style của một `th` không giải quyết các phép tính này.

## 4. Phương án triển khai B5.5 theo lớp an toàn
### B5.5.1 — Hình học lưới
- Bổ sung mô-đun hình học giao diện riêng, không đụng công thức, dependency graph hay tính toán workbook.
- Hỗ trợ kích thước mặc định và kích thước tùy biến theo chỉ số hàng/cột; giới hạn min/max để tránh ô quá nhỏ hoặc quá lớn.
- Có hàm tổng kích thước, offset trước/sau một chỉ số và tìm chỉ số từ tọa độ cuộn.
- Bảo đảm dữ liệu thưa: không cấp phát mảng kích thước cho 100.000 hàng hoặc 16.384 cột; chỉ lưu các kích thước đã tùy biến.

### B5.5.2 — Tích hợp lưới ảo và freeze/split
- Chuyển `getVirtualWindow`, `buildFreezeLayout`, dựng spacer và `choose()` sang hình học mới.
- Đồng bộ cả bốn pane; kiểm tra scroll anchoring để khi đổi kích thước không làm nhảy sai vùng đang xem.
- Tính lại vị trí tay nắm, vùng chọn và tiêu đề hàng/cột.

### B5.5.3 — Giao diện kéo thay đổi kích thước
- Tay nắm ở ranh giới tiêu đề cột/hàng; Pointer Events hỗ trợ chuột, bút và cảm ứng.
- Xem trước kích thước trong lúc kéo; thả mới xác nhận, Escape/pointercancel khôi phục.
- Có thao tác bàn phím và lệnh đặt kích thước chính xác; có giới hạn và phản hồi trực quan.

### B5.5.4 — Workbook, undo/redo và kéo vùng
- Mở rộng `workbook-sheets.js` để chuẩn hóa và lưu kích thước riêng theo từng sheet; giữ tương thích workbook cũ.
- Bổ sung giao dịch undo/redo cho thay đổi kích thước mà không làm hỏng lịch sử dữ liệu ô.
- Nâng cấp kéo di chuyển/sao chép vùng với vùng xem trước, cảnh báo ghi đè và hỗ trợ pane phụ; giữ công thức và định dạng theo quy tắc đã kiểm thử.
- Chỉ xác nhận hoàn tất sau kiểm thử dữ liệu, freeze/split, undo/redo, cuộn ảo và thao tác cảm ứng.

## 5. Quyết định bảo toàn
- Không sửa `main`.
- Không thay đổi công thức, engine tính toán, sparse cell storage, dữ liệu workbook hiện hữu hoặc khóa lưu trữ ở bước tiền triển khai này.
- Không ghi nhận B5.5 là đã hoàn thành tính năng resize; đây là kiểm tra tiền triển khai để tránh tạo giao diện kéo giả nhưng làm lệch tọa độ dữ liệu.
- Chưa chạy trình duyệt, Android, kiểm thử runtime, kiểm thử hồi quy hoặc xác nhận GitHub Pages deployment.
