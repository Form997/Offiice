# HAI ĐẤT SLIDES – S2 UI acceptance

**Ngày bắt đầu:** 24/11/2026  
**Phạm vi:** Chỉ thư mục `slides/` trên nhánh `slides-s1-stability`.

## Mục tiêu giao diện
- Tổ chức lại vùng làm việc thành thanh thương hiệu, nhóm lệnh, danh sách trang, vùng biên soạn và khung xem trước.
- Giảm cảm giác dàn trải; phân cấp chữ, khoảng cách, nút và bảng điều khiển nhất quán.
- Bố cục thích ứng cho màn hình rộng, máy tính bảng, điện thoại dọc/ngang và vùng an toàn màn hình.
- Giữ thao tác chạm đủ lớn, không phụ thuộc hover, hỗ trợ bàn phím và giảm chuyển động theo cài đặt hệ thống.
- Khung xem trước cập nhật trực tiếp bằng `textContent`, không diễn giải nội dung người dùng thành HTML.

## Bảo toàn chức năng S1
- Thêm slide, chuyển trang, chọn trang.
- Tự lưu và lưu thủ công vào bộ nhớ cục bộ.
- Trình chiếu trong cửa sổ riêng, xuất HTML.
- Cài PWA và chạy ngoại tuyến theo cơ chế S1.
- Không thay đổi `core.mjs`, quy tắc lưu dữ liệu hoặc cấu trúc workbook của CALC.

## Kiểm tra tự động
- Chạy lại bộ kiểm thử lõi S1.
- Kiểm tra cú pháp `app.js`, `core.mjs`, `sw.js`.
- Kiểm tra cấu trúc HTML và các ID mà JavaScript sử dụng.

## Kiểm tra thủ công còn phải thực hiện
- Android Chrome: nhập nội dung dài, bàn phím ảo, thêm/chuyển slide, lưu và mở lại.
- iPhone Safari: nhập liệu, cuộn vùng biên soạn, trình chiếu và tải HTML.
- Màn hình gập: chuyển đổi trạng thái gập/mở và xoay ngang/dọc.
- Desktop: danh sách dài, nội dung nhiều dòng, cửa sổ trình chiếu bật lên.

**Lưu ý:** Kiểm thử tự động không thay thế kiểm thử trên thiết bị thật. S2 chưa được xem là nghiệm thu cuối cho tới khi các ca thủ công được thực hiện.
