# HAI ĐẤT WRITER V2.3

- Ngày bắt đầu: 17/11/2026
- Nhánh phát triển: `v1-development`
- Nền tảng: PWA / trình duyệt; ưu tiên ngoại tuyến
- Trọng tâm: hợp nhất bản sao lưu an toàn hơn

## Điểm mới

1. **Hai chế độ phục hồi**
   - **Hợp nhất** (mặc định): giữ tài liệu hiện có và nhập tài liệu từ bản sao lưu.
   - **Thay thế toàn bộ**: thay danh sách tài liệu hiện tại bằng danh sách trong bản sao lưu; chỉ dùng khi người dùng chủ ý chọn.

2. **Đối chiếu theo ID bất biến**
   - ID trùng: giữ một tài liệu; ưu tiên bản có `updatedAt` mới hơn.
   - ID chưa có: thêm tài liệu mới.
   - Không dùng tên tệp làm khóa; hai tài liệu khác ID vẫn được giữ riêng dù trùng tên.

3. **Hợp nhất lịch sử phiên bản**
   - Gộp theo ID tài liệu và ID mốc phiên bản.
   - Giữ tối đa 6 mốc cho mỗi tài liệu.
   - Giới hạn tổng lịch sử 1.100.000 ký tự; mốc cũ nhất được loại trước nếu vượt giới hạn.
   - HTML nhập vào được làm sạch trước khi lưu.

4. **Bảo vệ khi bộ nhớ trình duyệt đầy**
   - Ghi dữ liệu phục hồi theo từng kho.
   - Nếu thao tác ghi thất bại, ứng dụng cố gắng phục hồi các giá trị lưu trữ trước đó và báo lỗi thay vì báo thành công.

5. **Đồng bộ giao diện**
   - Hiển thị V2.3.
   - Sửa bộ đếm lịch sử thành 6 mốc, đúng với giới hạn thực tế.
   - Tăng phiên bản cache Service Worker để trình duyệt nhận mã mới.

## Quy tắc hợp nhất

| Tình huống | Xử lý |
|---|---|
| ID chỉ có trong bản sao | Nhập thêm |
| ID chỉ có trên thiết bị | Giữ nguyên |
| ID có ở cả hai nơi | Bản có thời điểm cập nhật mới hơn được chọn |
| Cùng ID mốc lịch sử | Gộp một mốc, không nhân đôi |
| Khôi phục chế độ thay thế | Thay danh sách hiện tại sau khi xác nhận |

Tên tài liệu, thư mục, loại, trạng thái ghim và ID được giữ theo bản tài liệu được chọn.

## Kiểm tra trước phát hành

- Kiểm tra cú pháp JavaScript bằng trình biên dịch cú pháp.
- Kiểm tra ID HTML trùng lặp.
- Kiểm tra các thành phần chế độ phục hồi và phiên bản cache.
- Kiểm tra triển khai bằng GitHub Actions.

Các kiểm tra tĩnh không thay thế việc thử thao tác thực tế trên Android, iOS, Windows, macOS và Linux.

## Giới hạn

- Dữ liệu vẫn lưu cục bộ trong trình duyệt; chưa có đồng bộ đám mây.
- Bản sao lưu JSON tối đa 20 MB.
- Hợp nhất chỉ đối chiếu theo ID tài liệu; không tự trộn hai nội dung khác nhau thành một tài liệu.
- Nếu ID trùng, phiên bản có `updatedAt` lớn hơn thắng; nếu thời điểm bằng nhau, bản trong tệp sao lưu được ưu tiên.
- Phục hồi thay thế toàn bộ có thể ghi đè danh sách hiện tại; hãy xuất bản sao trước khi dùng.

## Quy trình thử nghiệm thủ công

1. Tạo tài liệu A trên thiết bị, xuất bản sao lưu.
2. Tạo tài liệu B sau khi xuất bản sao lưu.
3. Chọn **Hợp nhất · giữ tài liệu hiện có**, nhập bản sao lưu; xác nhận A và B đều còn.
4. Sửa A trên thiết bị và trong một bản sao lưu khác; nhập bản có thời điểm cập nhật mới hơn để kiểm tra quy tắc ID.
5. Thử **Thay thế toàn bộ** trên dữ liệu thử nghiệm, không dùng dữ liệu quan trọng.
6. Mở lịch sử phiên bản của tài liệu sau hợp nhất để kiểm tra các mốc.

