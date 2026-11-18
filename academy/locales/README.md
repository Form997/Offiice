# Quy chuẩn gói ngôn ngữ HAI ĐẤT OFFICE ACADEMY

## Nguyên tắc
- Mã ngôn ngữ theo BCP-47, ví dụ vi, en, fr, ja, zh-Hans, ar.
- Mỗi bài giữ nguyên một mã ID. Bản dịch không tạo bản sao bài học.
- complete chỉ dùng khi toàn bộ trường bắt buộc đã được dịch, hiệu đính thuật ngữ và kiểm tra hiển thị.
- starter nghĩa là bản dịch khởi đầu, chưa được chứng nhận đầy đủ.
- planned nghĩa là dự kiến hỗ trợ, chưa có nội dung dịch; giao diện phải báo đang dùng ngôn ngữ dự phòng.
- Không tự động ghi đè tiếng Việt hoặc bản gốc khi thêm bản dịch.
- Giữ nguyên mã lệnh, công thức, số liệu, đơn vị, tên tệp và mã bài; chỉ dịch phần văn xuôi cần thiết.
- Với ngôn ngữ RTL, đặt direction: rtl và kiểm tra hỗn hợp chữ, số, công thức và dấu câu.

## Trạng thái hiện tại
- Tiếng Việt (vi): bản nội dung gốc.
- English (en): gói khởi đầu đã có nội dung cho 14 bài; cần hiệu đính chuyên môn trước khi nâng trạng thái thành complete.
- Các ngôn ngữ khác: chưa được dịch; không được quảng bá là đã sẵn sàng chỉ vì bộ đọc hỗ trợ Unicode.

## Quy trình thêm ngôn ngữ
1. Sao chép cấu trúc locale hiện có, không sửa mã bài.
2. Dịch tiêu đề, mục tiêu, tiêu đề mục, đoạn văn, bước, bài tập và checklist.
3. Rà soát thuật ngữ UI của Writer, Calc, Slides; giữ nguyên công thức và dữ liệu mẫu.
4. Kiểm tra ngữ pháp bởi người đọc thành thạo ngôn ngữ đích và người hiểu nghiệp vụ.
5. Chạy node --test tests/academy.test.js.
6. Kiểm thử trên trình duyệt ở màn hình rộng và màn hình điện thoại; với RTL phải kiểm thử riêng.
7. Chỉ sau khi đạt các bước trên mới chuyển trạng thái sang complete.

## Quy tắc chất lượng
- Không dịch tên sản phẩm/ứng dụng theo cách làm người dùng không nhận ra.
- Không dịch sai dấu thập phân, dấu phân cách hàng nghìn, ngày tháng, đơn vị đo.
- Bản dịch phải bảo toàn cảnh báo, giới hạn và ý nghĩa thao tác của bản gốc.
- Khi thiếu một trường dịch, bộ đọc dùng ngôn ngữ dự phòng và phải thông báo rõ.
