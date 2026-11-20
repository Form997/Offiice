# HAI ĐẤT WRITER V2.4

- Ngày phát triển: 17/11/2026
- Nhánh: `v1-development`
- Chủ đề: kiểm tra sức khỏe kho dữ liệu cục bộ

## Tính năng mới

Thêm nút **Kiểm tra kho dữ liệu** trong nhóm sao lưu của thẻ Tệp.

Báo cáo kiểm tra gồm:
- Số tài liệu đang hoạt động và số tài liệu trong thùng rác.
- ID tài liệu trùng.
- Bản ghi thiếu ID hoặc nội dung không đúng kiểu dữ liệu.
- Số mốc lịch sử và dung lượng HTML lịch sử ước tính.
- Dung lượng localStorage ước tính theo UTF-16.

Kết quả được hiển thị trong hộp thoại và trạng thái ngay cạnh nút kiểm tra. Nếu phát hiện ID trùng hoặc bản ghi bất thường, trạng thái được đánh dấu để người dùng chú ý.

## Cách dùng

1. Mở Writer.
2. Vào thẻ **Tệp**.
3. Trong nhóm sao lưu, bấm **Kiểm tra kho dữ liệu**.
4. Đọc báo cáo. Nếu có vấn đề, xuất bản sao lưu trước khi thực hiện thao tác dọn dẹp hoặc phục hồi.

## Cách tính và giới hạn

- Dung lượng được ước tính bằng 2 byte cho mỗi ký tự JavaScript (UTF-16), chưa tính đầy đủ overhead nội bộ của trình duyệt.
- Không có API trình duyệt thống nhất để đọc chính xác quota localStorage còn trống; số liệu không phải phần trăm dung lượng tối đa.
- Kiểm tra không tự sửa, xóa hay thay đổi tài liệu.
- Kiểm tra không thay thế bản sao lưu và không đảm bảo khôi phục được dữ liệu khi thiết bị hỏng hoặc dữ liệu trình duyệt bị xóa.

## Kiểm tra kỹ thuật

- Kiểm tra cú pháp JavaScript.
- Kiểm tra ID HTML trùng lặp.
- Kiểm tra nút, trạng thái và trình xử lý sự kiện.
- Kiểm tra phiên bản tệp JavaScript và Service Worker.

Kiểm thử tương tác thực tế trên các trình duyệt/thiết bị vẫn cần được thực hiện sau triển khai.
