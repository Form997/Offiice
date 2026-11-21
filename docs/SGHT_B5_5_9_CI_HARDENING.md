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
