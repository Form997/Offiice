# SGHT B5.5.1 — Đặc tả bộ hình học lưới biến thiên
Ngày: 21/11/2026
Nhánh: `v1-development`

## Mục tiêu
Tách phép tính kích thước hàng/cột ra khỏi engine công thức và dữ liệu ô. Mô-đun này chỉ mô tả hình học giao diện; không đọc, sửa hoặc tuần tự hóa nội dung workbook.

## Hợp đồng API
Tệp: `sght/engine/grid-geometry.js`

- `createGridGeometry(input?)`: chuẩn hóa cấu hình; mặc định hàng 32 px, cột 108 px.
- `getAxisSize(geometry, axis, index)`: kích thước của hàng/cột tại chỉ số 1-based.
- `getAxisOffset(geometry, axis, index)`: tọa độ pixel trước hàng/cột; index có thể bằng count + 1 để lấy tổng chiều dài trục.
- `getAxisRangeSize(geometry, axis, start, end)`: tổng kích thước đoạn bao gồm hai đầu.
- `findAxisIndexAtOffset(geometry, axis, offset)`: tìm phần tử chứa tọa độ pixel bằng tìm kiếm nhị phân.
- `setAxisSize(geometry, axis, index, size)`: trả về geometry mới, không mutate đầu vào.
- `resetAxisSize(geometry, axis, index)`: xóa override và dùng kích thước mặc định.
- `serializeGridGeometry(geometry)`: trả metadata gọn, map override được sắp theo chỉ số.

## Giới hạn và bộ nhớ
- Hàng: 20–240 px; mặc định 32 px.
- Cột: 40–500 px; mặc định 108 px.
- Tối đa 100.000 hàng, 16.384 cột.
- Chỉ các hàng/cột đã chỉnh mới có khóa trong map; không tạo mảng kích thước toàn trục.
- Dữ liệu override không hợp lệ bị bỏ qua khi chuẩn hóa; lệnh đặt kích thước trực tiếp ngoài giới hạn ném RangeError.

## Ví dụ
```js
import { createGridGeometry, setAxisSize, getAxisOffset, findAxisIndexAtOffset } from "./engine/grid-geometry.js";

let geometry = createGridGeometry();
geometry = setAxisSize(geometry, "column", 3, 160);
const startOfColumn4 = getAxisOffset(geometry, "column", 4); // 376 px
const columnAtX400 = findAxisIndexAtOffset(geometry, "column", 400); // 4
```

## Kiểm thử
Tệp: `sght/tests/grid-geometry.test.mjs`; được nhận bởi script `npm test` hiện tại qua glob `sght/tests/*.test.mjs`. Script cũng kiểm tra cú pháp mô-đun mới bằng `node --check`.

Các test bao gồm mặc định, offset biến thiên, tổng vùng, tìm ngược tọa độ, reset, từ chối giới hạn, chuẩn hóa map thưa và không cấp phát mảng theo tổng số hàng/cột.

## Phạm vi chưa làm
- Chưa tích hợp hình học mới vào `getVirtualWindow`, `buildFreezeLayout`, renderer hoặc các pane chia vùng.
- Chưa thêm tay nắm kéo đổi kích thước.
- Chưa lưu geometry trong workbook từng sheet.
- Chưa tích hợp undo/redo cho resize.
- Chưa đổi thuật toán kéo di chuyển/sao chép vùng.

Các phần trên thuộc B5.5.2–B5.5.4. Giữ nguyên engine công thức và cấu trúc dữ liệu ô trong giai đoạn này.
