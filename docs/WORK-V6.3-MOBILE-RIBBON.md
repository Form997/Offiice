# HAI ĐẤT OFFICE WORK V6.3 — Refined Mobile Ribbon

**Ngày cập nhật:** 18/11/2026  
**Nhánh:** `v6-development`  
**Trạng thái:** Đã ghi mã nguồn; chờ CI, Pages và kiểm thử thiết bị.

## Mục tiêu
Làm thanh công cụ trên điện thoại gọn, trang trọng, dễ điều hướng; không thu nhỏ nguyên xi giao diện máy tính.

## Thay đổi
- Chuyển sáu nhóm Tệp / Trang chủ / Chèn / Bố trí / Tham chiếu / Xem thành thanh tab ngang có thể vuốt.
- Tab đang chọn có tương phản rõ, vùng chạm tối thiểu 42px và tự cuộn vào tầm nhìn.
- Chạm lại tab đang mở để thu gọn bảng lệnh; chạm tab khác để mở nhóm tương ứng.
- Giới hạn chiều cao bảng lệnh trên điện thoại, giữ diện tích vùng giấy.
- Tinh chỉnh bóng, viền, bo góc và nền theo bảng màu xanh lá trầm.
- Tăng phiên bản tài nguyên và cache Service Worker lên V6.3 để nhận bản cập nhật.

## Bảo toàn
- Không đổi schema tài liệu v3, ID tài liệu, dữ liệu localStorage hay luồng Writer/Canvas.
- Không sửa nhánh V3/V4 và không hợp nhất vào main.

## Kiểm định còn phải làm
- Chạy CI và kiểm tra lỗi JavaScript.
- Kiểm tra tab ribbon trên Chrome Android, gồm thao tác chạm lại để đóng/mở.
- Kiểm tra PWA/offline sau khi Service Worker cập nhật.
- Xác nhận GitHub Pages triển khai thành công trước khi công bố bản chạy thật.
