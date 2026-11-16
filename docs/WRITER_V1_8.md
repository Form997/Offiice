# HAI ĐẤT WRITER V1.8 — Bố cục đoạn, mẫu văn bản và ngắt phần

Ngày: 16/11/2026

## Nội dung nâng cấp
- Bổ sung điều khiển giãn dòng 1.0, 1.15, 1.5 và 2.0.
- Bổ sung khoảng cách sau đoạn 0, 6, 12 và 18 pt.
- Khi con trỏ nằm trong một đoạn, lệnh áp dụng chỉ tác động đoạn đó; khi không xác định được đoạn, áp dụng cho các đoạn văn, tiêu đề, danh sách và trích dẫn trong tài liệu.
- Thêm mẫu khởi tạo cho báo cáo, công văn/thư, biên bản và bài nghiên cứu.
- Thêm lệnh ngắt phần sang trang mới; lệnh ngắt trang cũ vẫn giữ nguyên.
- Bổ sung CSS cho màn hình và chế độ in; cập nhật cache ngoại tuyến V1.8.

## Cách dùng
1. Mở tab Tệp, chọn mẫu văn bản rồi bấm Áp dụng mẫu. Mẫu thay nội dung hiện tại; ứng dụng hỏi xác nhận trước khi thay.
2. Trong tab Trang chủ, đặt con trỏ vào đoạn cần định dạng, chọn giãn dòng và khoảng cách sau đoạn, rồi bấm Áp dụng đoạn.
3. Trong tab Bố trí, dùng Ngắt trang hoặc Ngắt phần sang trang mới khi cần.

## Giới hạn đã biết
- Ngắt phần hiện tạo ranh giới ngắt sang trang mới, chưa có cấu hình khổ giấy/lề/đầu chân trang độc lập cho từng phần.
- Header/footer và số trang khi in vẫn phụ thuộc khả năng CSS Paged Media của trình duyệt; số trang có thể khác nhau giữa Chrome, Safari, Firefox và hộp thoại in.
- Bộ xuất DOCX hiện là bộ xuất OOXML tối giản; không cam kết giữ nguyên mọi định dạng phức tạp khi mở bằng Microsoft Word/LibreOffice.
- Chưa thay thế việc nghiệm thu thực tế trên thiết bị và trình soạn thảo Word/LibreOffice.

## Kiểm tra kỹ thuật
- JavaScript được kiểm tra cú pháp bằng trình biên dịch JavaScript.
- Đã kiểm tra sự hiện diện của các điều khiển V1.8, bộ xử lý sự kiện, phiên bản script và cache.
- Chưa xác nhận GitHub Pages đã hoàn tất triển khai hoặc thử nghiệm tương tác trên thiết bị thật.

## Phát hành
- Nhánh: `v1-development`
- Phiên bản giao diện: V1.8
- Cache ngoại tuyến: `haidat-writer-v1-8`
