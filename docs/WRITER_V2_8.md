# HAI ĐẤT OFFICE — Writer V2.8

## Nội dung nâng cấp
- Thêm khu vực Kho chung & chia sẻ ngay trong Ribbon Tệp.
- Đồng bộ tài liệu đang mở lên bảng `hd_documents` bằng ID hiện có; không tự đổi ID.
- Mở tài liệu từ kho bằng ID, chỉ khi chính sách RLS cho phép đọc.
- Sao chép tài liệu trên máy chủ qua RPC bảo vệ quyền `can_copy`; bản sao có ID mới và người sao chép trở thành chủ sở hữu.
- Chủ sở hữu cấp hoặc thu hồi quyền riêng cho tài khoản hoặc nhóm: Đọc, Chỉnh sửa, Sao chép.
- Tạo nhóm và thêm thành viên bằng UUID tài khoản; nhóm dùng chung quyền theo membership.
- Không bật bất kỳ chức năng chia sẻ nào nếu chưa có Supabase client/đăng nhập.

## Cách dùng khi hệ thống được tạo
1. Tạo Supabase project và chạy migration V2.7 trong `supabase/migrations/202611170001_writer_collaboration.sql`.
2. Điền Project URL và publishable/anon key vào `writer/supabase-config.js` (không dùng service_role/secret key).
3. Đăng ký/đăng nhập tài khoản.
4. Mở tài liệu cần chia sẻ → Tệp → Kho chung & chia sẻ → Đưa tài liệu lên kho chung.
5. Chọn Cá nhân hoặc Nhóm/đội, nhập UUID đối tượng, tích quyền rồi Lưu quyền. Muốn thu hồi thì nhập lại đúng đối tượng và bấm Thu hồi.
6. Người được cấp quyền đăng nhập, nhập ID vào ô kho chung và chọn Mở theo ID. Nếu được cấp Sao chép, dùng Sao chép từ kho để tạo tài liệu mới mang ID riêng.

## Giới hạn và an toàn
- V2.8 là tích hợp giao diện và thao tác cloud đầu tiên; chưa có giao diện tra cứu email để tìm UUID người dùng, chưa có hộp thư duyệt yêu cầu truy cập, chưa có màn hình quản trị danh sách nhóm/thành viên.
- UUID là mã định danh đối tượng, không phải mật khẩu; ID tài liệu không tự cấp quyền.
- RLS ở Supabase là lớp quyết định cuối cùng. Chỉ chủ sở hữu mới được thay đổi quyền; người dùng không có quyền đọc sẽ không tải được nội dung qua API.
- Đồng bộ là thao tác thủ công theo tài liệu; chưa có đồng bộ nền đa thiết bị, xử lý xung đột nhiều người cùng sửa, hoặc lịch sử phiên bản cloud.
- Khi người khác sửa tài liệu cloud, bản cục bộ không tự cập nhật; cần mở lại từ kho chung. Không ghi đè nếu RLS từ chối.
- Quyền Sao chép được thực thi qua RPC `hd_copy_document`; bản sao nhận ID mới, chủ sở hữu mới và không kế thừa ACL của bản gốc. Không thể ngăn chụp màn hình hoặc chép thủ công nội dung đã được đọc.
- Chưa chạy migration trên dự án Supabase thật và chưa kiểm thử tương tác trên trình duyệt/điện thoại. Không xem đây là nghiệm thu production.

## Kiểm thử cần thực hiện sau khi tạo dự án
- Tài khoản A tải tài liệu lên kho, cấp Đọc cho B; B mở theo ID được.
- B không thể cập nhật nếu chưa có Chỉnh sửa.
- C không có quyền không đọc được chỉ bằng ID.
- A cấp Chỉnh sửa/Sao chép cho B; API vẫn phải tuân theo RLS.
- Thu hồi quyền; request tiếp theo của B bị từ chối.
- Tạo nhóm, thêm B, cấp quyền nhóm; xóa B khỏi nhóm thì quyền kế thừa chấm dứt ở request tiếp theo.
