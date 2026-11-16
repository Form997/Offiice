# HAI ĐẤT WRITER V1.10
Ngày bắt đầu: 16/11/2026

## Mục tiêu
Hoàn thiện nhóm định dạng văn bản theo hướng dễ thao tác, giữ định dạng tốt hơn khi lưu tài liệu và xuất DOCX.

## Nội dung
- Bổ sung thao tác chỉ số trên và chỉ số dưới trong nhóm định dạng chữ.
- Bật chế độ định dạng CSS khi dùng các lệnh định dạng của trình duyệt.
- Mở rộng bộ lọc HTML an toàn để giữ thẻ FONT và các thuộc tính phông chữ hợp lệ do trình duyệt sinh ra.
- Cải thiện xuất DOCX: chuyển phông chữ, cỡ chữ, màu chữ, màu nền đánh dấu, đậm, nghiêng, gạch chân, gạch ngang và chỉ số trên/dưới sang thuộc tính WordprocessingML tương ứng ở mức cơ bản.
- Chuẩn hóa nhãn phiên bản và bộ nhớ đệm Service Worker lên V1.10.

## Kiểm tra kỹ thuật
- Kiểm tra cú pháp JavaScript.
- Kiểm tra sự hiện diện của điều khiển định dạng và bộ chuyển DOCX.
- Kiểm tra đồng bộ phiên bản giữa HTML, JavaScript và Service Worker.

## Giới hạn cần biết
- Định dạng DOCX được hỗ trợ ở mức cơ bản; chưa bảo đảm tương thích toàn bộ với Microsoft Word/LibreOffice.
- Một số lệnh định dạng phụ thuộc vào khả năng `contenteditable/execCommand` của trình duyệt.
- Chưa thay thế kiểm thử tương tác thực tế trên mọi thiết bị; cần nghiệm thu trên Android, iOS và máy tính.

## Dung lượng
Dung lượng phát hành sẽ được ghi nhận theo kích thước thực tế của các tệp sau khi triển khai.
