# HAI ĐẤT WRITER V2.5

- Ngày phát triển: 17/11/2026
- Nhánh: `v1-development`
- Chủ đề: nhân bản tài liệu độc lập

## Tính năng mới

Thêm nút **Nhân bản** ngay cạnh nút Đổi tên trên thanh tên tài liệu.

Khi nhân bản:
1. Ứng dụng lưu nội dung đang chỉnh sửa trước.
2. Người dùng nhập tên cho bản sao.
3. Writer tạo ID mới theo chuẩn `HDW-YYYYMMDD-XXXXXXXX`.
4. Nội dung hiện tại, thư mục, loại tài liệu và cấu trúc trình bày được giữ lại.
5. Tài liệu gốc không bị đổi ID, tên hoặc nội dung.
6. Bản sao không tự ghim, không nằm trong thùng rác.
7. Nếu có lịch sử phiên bản hợp lệ của bản gốc, các mốc được sao chép sang ID mới và gắn nhãn "Lịch sử từ bản gốc". Lịch sử của hai tài liệu sau đó hoạt động độc lập.
8. Bản sao trở thành tài liệu đang mở sau khi tạo.

## Quy tắc ID

- Bản sao luôn nhận ID mới.
- ID bản gốc không thay đổi.
- Đổi tên hoặc chuyển thư mục không làm đổi ID.
- Nhân bản không dùng tên tài liệu làm khóa.

## Giới hạn

- Đây là bản sao nội dung trong kho Writer, không phải bản sao tệp DOCX đang mở trên ổ đĩa.
- Tệp ngoài chỉ được cập nhật khi người dùng dùng chức năng Lưu/Lưu thành.
- Nếu nội dung vượt giới hạn lịch sử 160.000 ký tự, tài liệu vẫn được nhân bản nhưng có thể không sao chép được mốc lịch sử quá lớn.
- Dữ liệu vẫn lưu cục bộ trong trình duyệt, chưa có đồng bộ đám mây.

## Kiểm tra kỹ thuật

- Kiểm tra cú pháp JavaScript.
- Kiểm tra nút và sự kiện nhân bản.
- Kiểm tra phiên bản script và Service Worker.
- Cần thử tương tác thực tế: tạo tài liệu, nhập nội dung, nhân bản, đổi tên bản sao, kiểm tra ID hai tài liệu và mở lại sau khi tải lại trang.

