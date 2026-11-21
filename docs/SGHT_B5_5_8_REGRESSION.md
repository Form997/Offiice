# SGHT B5.5.8 — Ma trận kiểm thử hồi quy kích thước hàng/cột

Ngày: 2026-11-21  
Nhánh: `v1-development`  
Phạm vi: B5.5.1–B5.5.7

## Mục tiêu bảo toàn

- Geometry là metadata bố cục riêng, lưu dạng sparse map theo từng sheet.
- Không thay đổi dữ liệu ô, công thức, định dạng, dependency engine, clipboard nội dung, fill-series hoặc lịch sử dữ liệu.
- Virtual scrolling, freeze và split tiếp tục dùng tọa độ hình học biến thiên.
- Thao tác resize, AutoFit và áp dụng kích thước phải giới hạn khối lượng; undo/redo kích thước tách biệt với undo/redo dữ liệu.

## Ma trận kiểm thử tự động

| ID | Nhóm | Nội dung kiểm tra | Tệp kiểm thử |
|---|---|---|---|
| G01 | Geometry | Mặc định 32/108 px, offset, range, biên và reset | grid-geometry.test.mjs |
| G02 | Sparse | Override thưa, giới hạn 100.000 hàng / 16.384 cột, không tạo mảng dày | grid-geometry.test.mjs |
| G03 | Bulk | Đổi nhiều hàng/cột, loại chỉ số trùng, chặn quá 5.000 | grid-geometry.test.mjs |
| G04 | Virtualization | Vùng nhìn thấy, overscan, offset theo kích thước biến thiên | sparse-grid.test.mjs và B5.5.8 |
| G05 | Freeze | Tổng chiều cao/độ rộng vùng ghim theo kích thước tùy chỉnh | freeze-panes.test.mjs và B5.5.8 |
| G06 | Workbook | Geometry riêng từng sheet, round-trip, bảo toàn cells/formats/formulas | workbook-sheets.test.mjs và B5.5.8 |
| G07 | Resize UI | Bắt đầu kéo, chụp vùng đích, thả chuột, hủy pointer, đổi sheet khi đang kéo | B5.5.8 wiring contract; cần browser E2E |
| G08 | AutoFit | Giới hạn 5.000 trục / 100.000 ô, cập nhật sparse map và lịch sử | B5.5.8 wiring contract; cần browser E2E |
| G09 | Clipboard kích thước | Chép hàng/cột, áp dụng liên sheet, không ảnh hưởng clipboard ô | axis-dimension-clipboard.test.mjs và B5.5.8 |
| G10 | History | Undo/redo geometry không ghi đè lịch sử dữ liệu | B5.5.8 model round-trip; cần browser E2E |
| G11 | Split/quadrant | Kéo resize trên các pane, đồng bộ scroll và giữ hình học | split-panes.test.mjs; cần browser E2E |
| G12 | Touch | Pointer capture, pointercancel, thao tác ngón tay trên Android | Chưa tự động; cần thiết bị thật |

## Kiểm thử thủ công bắt buộc trước nghiệm thu

1. Tạo workbook có dữ liệu, công thức tham chiếu, định dạng, hai sheet; ghi lại kết quả công thức.
2. Đổi kích thước một hàng/cột, nhiều hàng/cột; thử giới hạn min/max và nhập pixel chính xác.
3. Kéo tay nắm trong lưới chính, pane split và bốn pane quadrant; thử pointercancel và kéo ra khỏi vùng lưới.
4. AutoFit cột/hàng với nội dung ngắn, dài, tiếng Việt có dấu, công thức, ô trống; kiểm tra nội dung xuống dòng.
5. Chép kích thước hàng/cột ở sheet nguồn, chuyển sheet, áp dụng cho vùng đích; kiểm tra clipboard ô không đổi.
6. Undo/redo kích thước nhiều lần; sau đó Undo/Redo dữ liệu và định dạng; xác nhận hai lịch sử không lẫn nhau.
7. Lưu, tải lại trang, mở lại workbook; xác nhận geometry từng sheet và công thức/dữ liệu còn nguyên.
8. Thử Chrome desktop và Android/touch; quan sát vùng cuộn, freeze, split, hiệu năng và bộ nhớ.

## Trạng thái B5.5.8

- Đã thêm kiểm thử tích hợp mô hình geometry + virtualization + freeze + workbook + dimension clipboard.
- Đã thêm kiểm thử hợp đồng nối mã giao diện (static wiring contract). Đây không thay thế kiểm thử DOM/browser thực.
- Các bộ test Node hiện có được tự động thu nhận bởi lệnh `npm test` qua glob `sght/tests/*.test.mjs`; không cần thêm package hoặc dependency.
- Chưa thực thi `npm test` trong môi trường này; chưa có kết quả CI xác nhận.
- Chưa chạy browser E2E, Chrome, Android, đo RAM/hiệu năng workbook lớn hoặc xác nhận GitHub Pages deployment. Các mục này vẫn là điều kiện nghiệm thu thực địa, không được đánh dấu đạt chỉ dựa trên kiểm tra mã tĩnh.
- Không sửa engine tính toán, dữ liệu workbook, công thức, định dạng, clipboard nội dung, hoặc nhánh `main`.

## Rủi ro còn mở

- AutoFit hiện đo chữ xấp xỉ bằng Canvas 2D / fallback theo ký tự; chưa xử lý merged cells và chưa mô phỏng chính xác mọi font/style.
- Pointer capture và các tay nắm trên pane phải được kiểm chứng trong trình duyệt thật.
- Geometry history hiện được tách khỏi lịch sử dữ liệu; đây là chủ ý tương thích, người dùng cần nhận biết hai cụm Undo/Redo riêng.
