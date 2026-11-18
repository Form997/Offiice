# HAI ĐẤT WRITER V1.4.1 — Ribbon và tham chiếu ổn định

Ngày: 16/11/2026

## Lỗi được xử lý
- Sửa ký tự xuống dòng bị ghi nhầm thành chuỗi escape trong JavaScript, nguyên nhân làm toàn bộ app script không thể phân tích cú pháp và khiến các nút điều khiển ngừng hoạt động.
- Chuẩn hóa các biểu thức chính quy dùng để lọc HTML, đếm từ, nhận diện tệp HTML/TXT và xử lý xuống dòng khi mở TXT.
- Cho phép bộ lọc HTML giữ lại SECTION, ID neo nội bộ và các class hợp lệ của mục lục/chú thích/danh mục tài liệu; nhờ đó các phần tham chiếu không bị làm phẳng khi tải lại tài liệu.
- Loại tiêu đề “MỤC LỤC” khỏi danh sách tiêu đề khi cập nhật mục lục để tránh tự đưa mục lục vào chính nó.
- Cập nhật nhãn phiên bản và cache ngoại tuyến.

## Kiểm tra đã thực hiện
- Kiểm tra phân tích cú pháp JavaScript bằng bộ biên dịch JavaScript: đạt.
- Kiểm tra đối chiếu các nút Ribbon với ID điều khiển và hàm xử lý trong mã nguồn.
- Đã đẩy mã lên nhánh v1-development; cần kiểm thử thao tác thực tế trên trình duyệt Android/iOS và máy tính trước khi nghiệm thu cuối cùng.

## Cách làm mới ứng dụng
Sau khi GitHub Pages triển khai xong, đóng hẳn tab Writer rồi mở lại đường dẫn. Nếu ứng dụng đã cài PWA và vẫn giữ bản cũ, tải lại trang hoặc xóa dữ liệu trang web/cache của Writer rồi mở lại. Dữ liệu tài liệu được lưu trong localStorage; không xóa dữ liệu trang web nếu chưa xuất bản sao lưu.
