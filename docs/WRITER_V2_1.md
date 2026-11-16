# HAI ĐẤT WRITER V2.1 — Quản lý thư mục và phân loại

- Ngày cập nhật mã: 17/11/2026
- Giữ nguyên giao diện Ribbon sáu thẻ và kho tài liệu V2.0.
- Bổ sung thư mục tài liệu: tạo thư mục, lọc theo thư mục, chuyển tài liệu giữa các thư mục và xóa thư mục.
- Khi xóa thư mục, tài liệu bên trong được chuyển về “Chưa phân loại”; không xóa nội dung.
- Bổ sung loại tài liệu: Báo cáo, Công văn, Nghiên cứu, Biên bản, Ghi chú, Khác.
- Bổ sung ghim tài liệu; tài liệu đã ghim được ưu tiên lên đầu danh sách.
- Bổ sung sắp xếp theo cập nhật mới nhất, tên A–Z hoặc cũ nhất.
- Tìm kiếm theo tên, ID hoặc loại tài liệu.
- Nâng metadata tài liệu lên schemaVersion 3; giữ nguyên ID HDW, tên, nội dung, ngày tạo và trạng thái thùng rác.
- Backup nâng lên phiên bản 3, kèm danh sách thư mục; vẫn nhận bản sao lưu phiên bản 1 và 2.
- Nếu khôi phục bản sao lưu mà tài liệu đang chọn đã nằm trong thùng rác, Writer tự chọn tài liệu còn hoạt động; nếu tất cả đều trong thùng rác, tạo một tài liệu mới mà không xóa tài liệu cũ.
- Cache Service Worker: `haidat-writer-v2-1`; script: `app.js?v=2.1`.

## Lưu trữ dữ liệu
- Danh sách tài liệu vẫn nằm trong khóa localStorage hiện hữu `haidat-writer-documents-v2`, tránh làm mất dữ liệu người dùng.
- Danh sách thư mục lưu riêng tại `haidat-writer-folders-v1`.
- Tên tệp do người dùng đặt; ID tự sinh của tài liệu không đổi khi đổi tên hoặc chuyển thư mục.
- Dữ liệu chỉ lưu trên trình duyệt/thiết bị hiện tại; chưa có đồng bộ đám mây.

## Kiểm tra và giới hạn
- Đã kiểm tra cú pháp JavaScript bằng trình phân tích cú pháp.
- Đã kiểm tra ID HTML trùng lặp và sự hiện diện của các điều khiển V2.1.
- Chưa thay thế kiểm thử thao tác thực tế trên Android, iOS và trình duyệt máy tính.
- Chưa có lịch sử phiên bản nội dung; đây là hạng mục riêng cần thiết kế snapshot/khôi phục ở bản sau.
- DOCX vẫn là bộ nhập/xuất OOXML cơ bản, chưa tương thích toàn phần với Microsoft Word.
