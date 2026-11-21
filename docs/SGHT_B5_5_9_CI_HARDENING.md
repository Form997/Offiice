# SGHT B5.5.9 — Sửa kiểm thử hồi quy và xác lập cổng CI

Ngày: 2026-11-21  
Nhánh: `v1-development`  
Phạm vi: B5.5.1–B5.5.8

## Phát hiện từ lần chạy CI B5.5.8

Workflow `SGHT authentication and spreadsheet QA` chạy trên commit `16f3c55960f9c2c17dba7ac0bdd598d441c30065` đã thực thi `npm test`:

- Tổng số: 376 test.
- Đạt: 375.
- Không đạt: 1.
- Job kiểm thử engine thất bại; job kiểm tra API xác thực đạt.
- Test lỗi: `mã giao diện nối drag, cancel, AutoFit, clipboard và lịch sử hình học`.
- Nguyên nhân: assertion tìm chuỗi `targets, startSize, previewSize:startSize` độc lập, trong khi mã giao diện đóng gói trạng thái kéo trong `axisResizeDrag={pointerId:event.pointerId,axis,index,targets,startSize,previewSize:startSize,...}`. Đây là assertion cũ, không khớp cấu trúc mã hiện tại.

## Sửa trong B5.5.9

- Cập nhật assertion để kiểm tra đúng đối tượng `axisResizeDrag` và các trường trạng thái thực tế.
- Không thay đổi `app.js`, engine công thức, dữ liệu workbook, geometry runtime hoặc thao tác resize.
- Không đổi dependency hay mở rộng phạm vi workflow.
- Workflow hiện hữu tự chạy lại khi commit mới thay đổi `sght/**`.

## Tiêu chí xác nhận

1. Workflow chạy lại trên commit B5.5.9.
2. `npm test` đạt toàn bộ test, không có test thất bại.
3. Job kiểm tra API xác thực vẫn đạt.
4. Chỉ khi CI xanh mới xem phần kiểm thử Node là đạt; vẫn cần Chrome desktop, Android/touch, lưu–mở workbook và đo hiệu năng thực tế trước khi nghiệm thu toàn bộ B5.5.

## Trạng thái

- Đã sửa assertion tĩnh bị lỗi theo cấu trúc mã nguồn hiện tại.
- Chờ kết quả workflow chạy trên commit B5.5.9; không tự suy diễn rằng test đã đạt.
- Không sửa hoặc hợp nhất vào `main`.


# SGHT B5.5.10 — Gia cố vòng đời thao tác resize

Ngày: 2026-11-21  
Nhánh: `v1-development`

## Phạm vi

B5.5.10 tập trung vào tình huống thao tác kéo đổi kích thước bị gián đoạn; không mở rộng chức năng bảng tính.

## Thay đổi

- Thêm `cancelAxisResize()`: xóa trạng thái kéo đang hoạt động, ẩn đường căn và chủ động nhả pointer capture nếu phần tử còn giữ capture.
- Khi chuyển trạng thái sang sheet khác, hủy phiên kéo trước khi đổi `activeSheetId`; thao tác chưa thả sẽ không được ghi vào sheet mới.
- Khi cửa sổ mất focus, trang bị pagehide hoặc tài liệu chuyển sang hidden, hủy thao tác đang kéo thay vì chờ pointerup có thể không đến.
- Chặn pointer thứ hai ghi đè trạng thái của phiên resize đầu tiên; ngăn thao tác đa điểm chạm làm mất dấu pointer đang điều khiển.
- Bổ sung regression contract cho các nhánh hủy, đổi sheet, blur, pagehide, visibilitychange và release pointer capture.

## Bảo toàn

Không thay đổi công thức, dependency engine, sparse cell storage, giá trị ô, định dạng, clipboard ô, dữ liệu workbook hoặc schema hình học. Không thay đổi giới hạn kích thước hàng/cột và giới hạn 5.000 trục mỗi thao tác.

## Kiểm thử và giới hạn

- Bộ test Node được bổ sung kiểm tra hợp đồng mã nguồn; đây không phải mô phỏng Pointer Events trên trình duyệt.
- Chờ GitHub Actions chạy trên commit B5.5.10.
- Vẫn cần thử thao tác chuột, bút, cảm ứng; đổi sheet giữa lúc kéo; chuyển tab ứng dụng; freeze/split; lưu–mở workbook trên Chrome desktop và Android.
- Không tuyên bố kiểm thử vật lý trên Samsung A05 hoặc đo RAM nếu chưa thực hiện.

## Tiêu chí nghiệm thu

1. CI xanh toàn bộ.
2. Kéo rồi thả: chỉ ghi một giao dịch kích thước.
3. Kéo rồi pointercancel/blur/pagehide/đổi sheet: không ghi thay đổi dở dang.
4. Pointer thứ hai không làm thay đổi phiên kéo hiện tại.
5. Sau hủy, có thể bắt đầu thao tác resize mới bình thường.
