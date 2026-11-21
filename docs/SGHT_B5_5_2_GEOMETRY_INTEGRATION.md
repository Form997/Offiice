# SGHT B5.5.2 — Tích hợp hình học biến thiên vào lưới ảo và khung ghim

Ngày: 2026-11-21  
Nhánh: `v1-development`  
Phạm vi: renderer, virtual scrolling, freeze panes, split panes và metadata theo sheet.

## Mục tiêu

Đưa mô hình hình học thưa ở B5.5.1 vào các đường dựng giao diện hiện hữu, vẫn giữ nguyên kích thước mặc định 32 px/hàng và 108 px/cột. Khi chưa có override, cách bố trí và số pixel cơ sở không đổi.

## Thay đổi kỹ thuật

1. `engine/sparse-grid.js`
   - `getVirtualWindow` nhận thêm `geometry` tùy chọn.
   - Xác định hàng/cột đầu và cuối của viewport qua tọa độ pixel thực tế.
   - Tính offset và khoảng đệm ảo theo tổng kích thước biến thiên.
   - Khi không truyền `geometry`, giữ đường tính toán tương thích cũ.

2. `engine/freeze-panes.js`
   - `buildFreezeLayout` nhận `geometry.gridGeometry`.
   - Khoảng đệm sau vùng ghim được trừ theo tổng kích thước từng hàng/cột ghim.
   - Các caller cũ không truyền geometry vẫn dùng rowHeight/columnWidth như trước.

3. `app.js`
   - Khởi tạo geometry độc lập cho từng sheet.
   - Renderer dùng kích thước riêng cho tiêu đề cột, ô, hàng, cột ghim và vị trí sticky.
   - Điều hướng tới ô tính offset theo kích thước thật.
   - PageUp/PageDown và ngưỡng cuộn gần cuối dùng hình học biến thiên/cỡ cơ sở.
   - Các pane split dùng chung một geometry của sheet đang hoạt động.

4. `engine/workbook-sheets.js`
   - Chuẩn hóa và giữ trường metadata `geometry` theo từng sheet.
   - Sheet cũ thiếu trường này nhận metadata rỗng, tương ứng kích thước mặc định.
   - Không thay đổi nội dung cells, formats, history hoặc công thức.

5. Hiệu năng
   - Offset dùng chỉ mục tiền tố thưa và tìm kiếm nhị phân trên danh sách override.
   - Không tạo mảng 100.000 hàng hay 16.384 cột.
   - Bộ nhớ phụ trợ tỷ lệ theo số override được dùng trong geometry object.

## Kiểm thử được bổ sung

- Virtual window khi hàng 2 cao 48 px và cột 3 rộng 160 px.
- Freeze panes khi hai hàng đầu cao 40/60 px và hai cột đầu rộng 120/140 px.
- Metadata hình học được giữ riêng theo từng sheet.
- Các bài test cũ không truyền geometry tiếp tục bao phủ đường tương thích mặc định.

## Giới hạn còn lại

- Chưa có resize handles hoặc pointer drag để thay đổi kích thước trực tiếp.
- Chưa có thao tác chọn nhiều hàng/cột rồi đổi kích thước đồng loạt.
- Chưa có hộp thoại nhập số pixel hoặc lệnh reset từ giao diện.
- Chưa có Undo/Redo chuyên biệt cho thay đổi kích thước.
- Chưa chạy npm test, CI, kiểm thử trình duyệt/Android hoặc đo hiệu năng thiết bị thực.

## Bảo toàn

Không sửa engine tính toán công thức, sparse cell storage, clipboard, fill-series hay giá trị ô. Dữ liệu workbook hiện hữu được giữ nguyên; chỉ bổ sung metadata hình học ở cấp sheet. Không sửa nhánh `main`.
