# HAI ĐẤT WRITER V1.2

- Ngày nâng cấp: 16/11/2026
- Nhánh: `v1-development`
- Phạm vi: DOCX cơ bản và thiết lập trang; không thay đổi Calc/Slides.

## Đã bổ sung
- Xuất DOCX dạng Office Open XML trực tiếp trong trình duyệt, không cần API.
- Mở DOCX đọc nội dung đoạn, tiêu đề cấp 1–3, định dạng đậm/nghiêng/gạch chân cơ bản và bảng.
- Thiết lập khổ giấy A4, A5, Letter; chỉnh lề trang theo mm.
- Chèn dấu ngắt trang và giữ dấu ngắt trang trong tài liệu đã lưu.
- Lưu tùy chọn trang trên thiết bị; làm mới cache PWA V1.2.

## Giới hạn DOCX cần biết
- Đây là bộ chuyển đổi DOCX cơ bản, không thay thế hoàn toàn Microsoft Word.
- Chưa bảo toàn đầy đủ hình ảnh nhúng, biểu đồ, SmartArt, textbox, header/footer, footnote/endnote, section phức tạp, tracked changes, comments, field và macro.
- Nhập DOCX dùng khả năng giải nén ZIP của trình duyệt (`DecompressionStream('deflate-raw')`) với tệp nén Deflate; trình duyệt cũ có thể không hỗ trợ.
- DOCX xuất hiện hỗ trợ nội dung văn bản, tiêu đề, một số định dạng ký tự, bảng và thiết lập trang; danh sách, màu sắc, phông chữ chi tiết và ảnh chưa được chuyển đổi đầy đủ.
- Tệp có thể khác bố cục khi mở bằng các phiên bản Word/LibreOffice khác nhau.

## Kiểm thử còn phải thực hiện
- Mở tệp DOCX thực tế được tạo bởi Microsoft Word và LibreOffice.
- Xuất DOCX rồi mở lại bằng Word/LibreOffice; đối chiếu tiếng Việt, dấu, bảng và khổ giấy.
- Kiểm tra Chrome/Edge Android, Safari iOS và trình duyệt máy tính.
- Kiểm tra tải HTML/TXT, in PDF, lưu cục bộ và cập nhật PWA.
- Chưa tuyên bố nghiệm thu hoàn chỉnh cho tới khi các phép thử trên được chạy.

## Dung lượng
Dung lượng phát sinh cần lấy từ GitHub repository size hoặc thống kê Git sau khi hoàn tất kiểm thử; không ước lượng thay cho số đo.
