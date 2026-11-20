# HAI ĐẤT WRITER V2.6 — Nền tảng riêng tư và quản lý quyền truy cập

- Ngày phát triển: 17/11/2026
- Nhánh: `v1-development`
- Trạng thái: **đã cập nhật nhận diện quyền riêng tư; chia sẻ nhiều tài khoản chưa được bật**

## Thay đổi trong ứng dụng
- Nâng nhãn phiên bản Writer lên V2.6.
- Hiển thị trạng thái **Riêng tư · Chỉ trên thiết bị** cạnh ID tài liệu.
- Cập nhật cache service worker và phiên bản tài nguyên.
- Giữ nguyên toàn bộ ID và dữ liệu tài liệu hiện hữu.

## Quy tắc quyền bắt buộc
1. ID chỉ định danh tài liệu; biết ID không cấp quyền.
2. Mặc định riêng tư; chủ sở hữu phải cấp quyền rõ ràng.
3. Quyền cá nhân và quyền nhóm được quản lý riêng.
4. Các quyền độc lập: đọc, bình luận, chỉnh sửa, sao chép, tải xuống, chia sẻ tiếp, quản lý quyền.
5. Chỉnh sửa không tự động cho phép sao chép hoặc chia sẻ tiếp.
6. Thu hồi quyền phải có hiệu lực ở lần yêu cầu máy chủ kế tiếp.
7. Nhân bản tạo ID mới; không sao chép ACL của tài liệu gốc.
8. Mọi thao tác cấp/thu hồi quyền và truy cập quan trọng phải có nhật ký.

## Vì sao chưa bật chia sẻ thật?
Writer hiện vẫn lưu dữ liệu bằng localStorage trên từng trình duyệt. Chưa có máy chủ xác thực, kho tài liệu dùng chung, hay bộ kiểm tra quyền phía máy chủ. Chỉ thêm hộp kiểm trên giao diện sẽ không bảo vệ được nội dung và dễ khiến người dùng tưởng quyền đã có hiệu lực.

Muốn chia sẻ thật cần đăng nhập, API lưu tài liệu tập trung, bảng quyền theo tài liệu và chủ thể (cá nhân/nhóm), kiểm tra quyền ở mọi thao tác đọc/ghi/sao chép/tải xuống/chia sẻ, chính sách bảo mật tầng dữ liệu, nhật ký kiểm toán và sao lưu.

## Lộ trình
- **V2.6.x:** chốt mô hình dữ liệu, luồng yêu cầu quyền, giao diện quản lý quyền và kiểm thử bảo mật.
- **V2.7:** xác thực tài khoản, máy chủ tài liệu và cấp/thu hồi quyền thật sau khi chốt backend.
- **V2.8:** nhật ký hoạt động, bình luận, so sánh phiên bản và xử lý xung đột.
- **V3.0:** đồng bộ quyền giữa Writer, Calc và Slides.

## Giới hạn
- Trạng thái riêng tư chỉ phản ánh kiến trúc hiện tại, không phải cơ chế bảo mật mới.
- Chưa có đăng nhập, chia sẻ liên tài khoản, chia sẻ nhóm hoặc ACL hoạt động.
- Không thể thu hồi bản sao/tệp người nhận đã tải về trước đó; hạn chế tải không chống được chụp màn hình hay sao chép thủ công.
