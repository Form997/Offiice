# HAI ĐẤT OFFICE — Kiến trúc quyền truy cập theo ID tài liệu

- Ngày lập: 17/11/2026
- Dự án: HAI ĐẤT OFFICE / Writer
- Trạng thái: đặc tả kiến trúc, chưa bật chia sẻ trực tuyến
- Nguyên tắc: ID định danh tài liệu; ID không phải mật khẩu và không phải quyền truy cập.

## 1. Quy tắc định danh

1. Mỗi tài liệu mới có đúng một ID duy nhất, do hệ thống sinh.
2. ID bất biến trong suốt vòng đời tài liệu, kể cả đổi tên, chuyển thư mục, chỉnh sửa, sao lưu và khôi phục.
3. Nhân bản tạo một tài liệu mới và một ID mới; bản gốc giữ nguyên.
4. Người dùng có thể tìm/gửi yêu cầu bằng ID, nhưng biết ID không đồng nghĩa được đọc hoặc sửa.
5. Không nhúng quyền truy cập hay bí mật xác thực vào chuỗi ID.

## 2. Tài khoản và chủ thể được cấp quyền

- Mỗi cá nhân phải đăng nhập bằng tài khoản HAI ĐẤT OFFICE.
- Một nhóm/đội là thực thể riêng có danh sách thành viên và người quản lý.
- Quyền cấp cho nhóm chỉ có hiệu lực với thành viên hiện tại của nhóm; thay đổi thành viên phải được kiểm tra lại khi truy cập.
- Không cấp quyền bằng tên hiển thị hoặc email chưa được xác minh. Dùng user ID nội bộ bất biến.
- Chủ sở hữu là người có quyền cao nhất đối với tài liệu. Chuyển quyền sở hữu là thao tác riêng, cần xác nhận rõ ràng.

## 3. Ma trận quyền

| Quyền | Được phép | Không mặc nhiên được phép |
|---|---|---|
| Đọc | Xem nội dung và thông tin được phép hiển thị | Chỉnh sửa, tải bản sao |
| Chỉnh sửa | Đọc và thay đổi nội dung | Chia sẻ lại, chuyển quyền sở hữu, xóa tài liệu gốc |
| Sao chép | Tạo tài liệu độc lập với ID mới | Sửa tài liệu gốc hoặc tự cấp quyền cho người khác |

Quyền được lưu độc lập dưới dạng boolean: `can_read`, `can_edit`, `can_copy`.
Quy tắc phụ thuộc: `can_edit=true` đòi hỏi `can_read=true`; `can_copy=true` đòi hỏi `can_read=true`. Không tự suy diễn quyền chỉnh sửa từ quyền sao chép hoặc ngược lại.

## 4. Mô hình dữ liệu backend đề xuất

### documents
- `id`: ID tài liệu HAI ĐẤT, duy nhất.
- `owner_user_id`: tài khoản chủ sở hữu.
- `title`, `content`, `content_type`.
- `created_at`, `updated_at`, `deleted_at`.
- `version`: số phiên bản để phát hiện ghi đè đồng thời.

### document_permissions
- `id`: khóa bản ghi quyền.
- `document_id`: tham chiếu documents.id.
- `subject_type`: `user` hoặc `group`.
- `subject_id`: user ID hoặc group ID.
- `can_read`, `can_edit`, `can_copy`.
- `granted_by`, `created_at`, `updated_at`, `revoked_at`.
- Ràng buộc duy nhất cho một bộ (document_id, subject_type, subject_id) đang có hiệu lực.

### groups / group_members
- Nhóm có ID riêng, tên, người tạo/quản lý.
- Thành viên liên kết bằng user ID; có vai trò quản lý hoặc thành viên.
- Rời nhóm hoặc bị loại khỏi nhóm làm mất quyền được thừa hưởng từ nhóm ngay ở lần kiểm tra quyền kế tiếp.

### access_audit
- Ghi nhận cấp quyền, đổi quyền, thu hồi, yêu cầu truy cập, đọc, sửa, sao chép, chuyển chủ sở hữu.
- Lưu actor, tài liệu, đối tượng, hành động, thời điểm và kết quả.
- Không ghi nội dung tài liệu hoặc thông tin bí mật vào nhật ký.

## 5. Luồng nghiệp vụ

### Chủ sở hữu chia sẻ
1. Mở tài liệu và chọn Chia sẻ / Quyền truy cập.
2. Chọn Cá nhân hoặc Nhóm/đội.
3. Tìm đúng tài khoản/nhóm bằng định danh đã xác minh.
4. Đánh dấu riêng Đọc, Chỉnh sửa, Sao chép.
5. Xem lại người nhận và quyền, sau đó xác nhận.
6. Hệ thống lưu quyền và nhật ký kiểm toán.

### Người khác truy cập bằng ID
1. Nhập ID tài liệu hoặc mở lời mời được gửi.
2. Máy chủ xác thực tài khoản.
3. Máy chủ kiểm tra quyền trực tiếp và quyền thông qua nhóm.
4. Nếu không có quyền: chỉ cho gửi yêu cầu truy cập; không trả nội dung tài liệu.
5. Nếu có quyền: chỉ mở đúng thao tác được cho phép.

### Thu hồi
- Chủ sở hữu bỏ chọn quyền hoặc thu hồi toàn bộ quyền.
- Việc thu hồi có hiệu lực ở lần gọi máy chủ kế tiếp; phiên đang mở phải kiểm tra lại trước khi lưu.
- Không thể bảo đảm thu hồi bản sao ngoại tuyến mà người nhận đã tải hợp lệ trước đó. Giao diện phải nói rõ điều này.

### Sao chép
- Chỉ hiển thị và thực thi khi `can_copy=true`.
- Bản sao là tài liệu độc lập, ID mới, chủ sở hữu mặc định là người tạo bản sao.
- Không sao chép quyền chia sẻ của bản gốc sang bản sao.
- Không làm thay đổi nội dung, ID hoặc quyền của bản gốc.

## 6. Yêu cầu an toàn bắt buộc

- Kiểm tra quyền ở máy chủ cho mọi lần đọc, ghi, tải và sao chép; không tin trạng thái checkbox hoặc JavaScript phía trình duyệt.
- Áp dụng Row Level Security (RLS) hoặc lớp kiểm soát tương đương cho mọi bảng và tệp lưu trữ.
- Không để ID tài liệu là bearer token hoặc URL bí mật.
- Không lưu access token trong localStorage nếu có phương án cookie phiên an toàn hơn.
- Dùng TLS, xác thực phiên, giới hạn tốc độ và nhật ký kiểm toán.
- Khi lưu đồng thời, dùng version/ETag hoặc cơ chế tương đương để tránh ghi đè âm thầm.
- Sao lưu và khôi phục phải giữ nguyên document ID, owner và ACL hợp lệ; không tự cấp quyền mới khi nhập backup.
- Dữ liệu đang ở localStorage trên thiết bị hiện tại không tự động trở thành dữ liệu chia sẻ. Cần quy trình đồng bộ/chuyển lên máy chủ có xác nhận.

## 7. Phạm vi triển khai theo giai đoạn

### Giai đoạn A — hiện tại
- Giữ nguyên ID tài liệu hiện có.
- Hoàn thiện giao diện và luồng yêu cầu quyền, nhưng mọi quyền phải được đánh dấu rõ là bản nháp/chưa có hiệu lực nếu chưa kết nối máy chủ.
- Không giả lập chia sẻ giữa các thiết bị bằng localStorage.

### Giai đoạn B — tài khoản và máy chủ
- Đăng ký, đăng nhập, đăng xuất, khôi phục tài khoản.
- Tạo schema và chính sách RLS.
- Đồng bộ tài liệu từ thiết bị lên tài khoản theo quy trình xác nhận, phát hiện trùng ID và xung đột.

### Giai đoạn C — cộng tác
- Cấp quyền cá nhân/nhóm, thu hồi quyền, yêu cầu truy cập.
- Kiểm tra quyền ở máy chủ cho từng hành động.
- Nhật ký hoạt động và xử lý chỉnh sửa đồng thời.

## 8. Tiêu chí nghiệm thu

1. Biết ID nhưng chưa được cấp quyền thì không đọc được nội dung.
2. Người chỉ có quyền Đọc không thể lưu thay đổi hoặc sao chép.
3. Người có quyền Chỉnh sửa có thể sửa nhưng không mặc nhiên được cấp quyền cho người khác.
4. Người có quyền Sao chép tạo được bản mới với ID mới; bản gốc không đổi.
5. Thu hồi quyền ngăn truy cập/lưu tiếp theo từ máy chủ.
6. Thành viên bị loại khỏi nhóm mất quyền thừa hưởng từ nhóm.
7. Backup/restore không biến người nhận backup thành chủ sở hữu nếu không có quy trình chuyển quyền.
8. Kiểm tra quyền phía máy chủ vẫn đúng khi người dùng sửa request hoặc gọi API trực tiếp.

## 9. Trạng thái hiện tại và giới hạn

Writer hiện lưu tài liệu trong localStorage của trình duyệt. Vì vậy chưa có danh tính người dùng dùng chung, máy chủ lưu tài liệu hoặc kiểm tra quyền từ xa. Đặc tả này là nền tảng để triển khai thật; không được quảng bá là đã chia sẻ trực tuyến cho đến khi backend, RLS và kiểm thử truy cập trái phép hoàn tất.
