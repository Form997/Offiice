# HAI ĐẤT OFFICE — Writer V2.9

Ngày: 17/11/2026  
Nhánh: `v1-development`

## Mục tiêu

Gia cố an toàn khi đồng bộ thủ công với kho chung, tập trung vào hai tình huống dễ làm mất dữ liệu: hai người cùng sửa một tài liệu và mở bản cloud trùng ID với bản đang lưu trên thiết bị.

## Điểm mới

1. **Chống ghi đè phiên bản cloud cũ**
   - Khi cập nhật tài liệu đã có trên kho, Writer đọc số phiên bản hiện tại.
   - Lệnh ghi chỉ thành công nếu số phiên bản vẫn đúng với lần đọc trước đó.
   - Nếu người khác đã cập nhật trước, Writer báo xung đột và không ghi đè.
   - Nếu tài liệu đã bị xóa hoặc quyền ghi bị thu hồi, Writer báo riêng; bản cục bộ vẫn còn.

2. **Bảo vệ bản cục bộ trước khi tải nội dung cloud**
   - Khi mở tài liệu có cùng ID nhưng nội dung khác, Writer hỏi xác nhận.
   - Nếu người dùng đồng ý, bản trên máy được lưu thành một mốc lịch sử trước khi thay nội dung.
   - Nếu không ghi được mốc bảo vệ, thao tác cập nhật bị dừng.
   - Nếu người dùng hủy, nội dung trên máy không bị thay đổi.

3. **Làm mới bộ nhớ đệm**
   - Tăng phiên bản ứng dụng và service worker lên V2.9 để tải đúng mã mới.

## Cách xử lý khi gặp xung đột

1. Không bấm đồng bộ lại liên tục.
2. Mở tài liệu cloud mới nhất bằng ID.
3. Đối chiếu nội dung với bản cục bộ; dùng lịch sử phiên bản để khôi phục khi cần.
4. Chỉnh sửa trên bản mới nhất rồi đồng bộ lại.

## Giới hạn

- Đây là kiểm soát xung đột theo số phiên bản (optimistic concurrency), chưa phải chỉnh sửa cộng tác thời gian thực.
- Chưa có tự động hòa trộn hai bản sửa; người dùng phải đối chiếu và chọn nội dung cần giữ.
- Đồng bộ vẫn là thao tác thủ công.
- Chưa có lịch sử phiên bản cloud độc lập; lịch sử bảo vệ bản cục bộ nằm trong trình duyệt.
- Supabase chưa được cấu hình hoặc chạy migration trên dự án thật. Chưa thể xác nhận runtime RLS, Auth hay đồng bộ thực tế.
- Chưa kiểm thử tương tác trên thiết bị thật; các kiểm tra mã tĩnh không thay thế nghiệm thu trình duyệt.

## Kiểm thử nghiệm thu sau khi tạo Supabase

- Hai tài khoản mở cùng một tài liệu; tài khoản A cập nhật trước, tài khoản B thử đồng bộ phiên bản cũ: B phải nhận cảnh báo xung đột và không ghi đè A.
- Tài khoản bị thu hồi quyền chỉnh sửa thử đồng bộ: máy chủ từ chối, bản cục bộ vẫn còn.
- Mở cloud khi cùng ID đã có nội dung khác trên máy: phải hỏi xác nhận.
- Hủy hộp thoại: bản cục bộ không đổi.
- Đồng ý cập nhật: lịch sử phải có mốc “Trước khi cập nhật từ kho chung”.
- Nếu lưu mốc thất bại do hết dung lượng: không được thay nội dung cục bộ.

## An toàn

- ID tài liệu chỉ là mã định danh, không phải mật khẩu hay quyền truy cập.
- Chỉ dùng Project URL và publishable/anon key ở ứng dụng trình duyệt.
- Không đưa service_role/secret key vào HTML, JavaScript, PWA hoặc GitHub Pages.
