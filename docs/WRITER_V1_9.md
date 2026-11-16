# HAI ĐẤT WRITER V1.9 — Giao diện mới và cải thiện soạn thảo

Ngày: 16/11/2026

## Mục tiêu
Làm gọn vùng làm việc, tăng khả năng thao tác trên màn hình cảm ứng và giữ nguyên dữ liệu/tính năng đã có từ V1.8.

## Thay đổi giao diện
- Làm mới màu sắc, thanh tên tài liệu và bố cục vùng giấy.
- Thêm thanh định dạng nhanh ngay trên trang soạn thảo: hoàn tác/làm lại, đậm, nghiêng, gạch chân, căn lề, danh sách và ngắt trang.
- Bố cục ưu tiên một vùng giấy rộng; bảng công cụ phụ cũ được ẩn khỏi vùng làm việc để tránh chiếm chỗ.
- Tối ưu thanh tài liệu, Ribbon và trang giấy cho màn hình nhỏ; các nhóm công cụ có thể cuộn ngang khi cần.
- Thêm thanh trạng thái trực tiếp: số từ, số ký tự và thời gian đọc ước tính.

## Cải thiện thao tác soạn thảo
- Ghi nhớ vùng chọn văn bản trước khi bấm công cụ trên Ribbon hoặc thanh định dạng nhanh.
- Khôi phục vùng chọn trước khi áp dụng lệnh định dạng, nhằm giảm tình trạng mất vùng bôi đen khi thao tác.
- Bổ sung phím tắt Ctrl/Cmd + Enter để chèn ngắt trang.
- Bổ sung Ctrl/Cmd + Shift + L để tạo danh sách dấu đầu dòng.
- Giữ các phím tắt hiện có: Ctrl/Cmd + S, B, I, U và F.

## Tương thích và dữ liệu
- Giữ nguyên kho tài liệu localStorage hiện hữu; không đổi cấu trúc dữ liệu tài liệu.
- Giữ nguyên nhập/xuất HTML, TXT, DOCX, sao lưu/khôi phục, mục lục, chú thích, trích dẫn, mẫu văn bản và thiết lập trang.
- Tăng phiên bản cache ngoại tuyến lên `haidat-writer-v1-9`.

## Giới hạn và nghiệm thu
- Đây là trình soạn thảo web/PWA, chưa phải bộ máy dàn trang DOCX hoàn chỉnh.
- Chưa xác nhận Pages đã triển khai thành công và chưa thử thao tác thực tế trên mọi trình duyệt/thiết bị.
- Cần nghiệm thu riêng thao tác chọn chữ rồi bấm định dạng, nhập văn bản dài, bảng/ảnh, nhập xuất DOCX và in PDF.

## Kiểm tra kỹ thuật
- JavaScript được kiểm tra cú pháp bằng `new Function(app)`.
- Đã kiểm tra sự hiện diện của các điều khiển trạng thái, thanh định dạng nhanh, phiên bản script và cache.
- Không xóa dữ liệu trình duyệt hoặc thay đổi kho tài liệu người dùng.

## Phát hành
- Nhánh: `v1-development`
- Phiên bản: V1.9
- Ngày ghi nhận: 16/11/2026
