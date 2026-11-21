# SGHT B5.5.3 — Tay nắm kéo thay đổi kích thước hàng/cột

Ngày: 2026-11-21  
Nhánh: `v1-development`

## Hành vi

- Mép phải tiêu đề cột là vùng kéo đổi độ rộng.
- Mép dưới tiêu đề hàng là vùng kéo đổi chiều cao.
- Tay nắm xuất hiện trên lưới chính, pane Split và hai pane phụ của chế độ bốn góc.
- Trong lúc kéo, đường căn hiển thị vị trí con trỏ và nhãn cỡ dự kiến; chưa ghi vào workbook.
- Thả pointer xác nhận kích thước; pointercancel hoặc mất pointer capture hủy thao tác.
- Kích thước được làm tròn theo pixel và giới hạn: hàng 20–240 px; cột 40–500 px.
- Dùng bàn phím khi tay nắm được focus: ArrowLeft/Right cho cột, ArrowUp/Down cho hàng; bước 5 px, giữ Shift bước 20 px; Home trả về mặc định.

## Lưu trữ và bảo toàn

- Gọi `setAxisSize` / `resetAxisSize` từ `engine/grid-geometry.js`.
- Lưu qua metadata `geometry` của sheet và cơ chế save hiện có.
- Không sửa cells, formats, công thức, sparse storage, clipboard hay fill-series.
- Không tạo mảng theo tổng số hàng/cột.

## Giới hạn

- Chưa có Undo/Redo cho thao tác đổi kích thước.
- Chưa có đổi kích thước nhiều hàng/cột cùng lúc.
- Chưa có hộp thoại nhập chính xác số pixel.
- Đường căn xem trước là đường hướng dẫn; kích thước lưới chỉ cập nhật sau khi thả pointer.

## Kiểm định

Đã kiểm tra lại các tệp và nội dung cập nhật trên GitHub. Chưa chạy `npm test`, chưa thực thi kiểm thử trình duyệt, chưa thử trên thiết bị Android và chưa xác nhận triển khai GitHub Pages. Đây là kiểm tra mã nguồn, không phải xác nhận runtime.
