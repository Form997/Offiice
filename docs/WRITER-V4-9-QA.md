# HAI ĐẤT OFFICE — V4.9 QA Automation & Data Integrity Gate

**Ngày triển khai:** 17/11/2026  
**Nhánh:** `v4-development`  
**Trạng thái:** Bộ kiểm tra tĩnh tự động; chưa phải chứng nhận phát hành.

## Mục tiêu

V4.9 bổ sung một cổng kiểm tra có thể chạy lặp lại sau mỗi thay đổi mã. Bộ test tập trung vào các hợp đồng dễ bị phá vỡ khi nâng cấp: kho dữ liệu Writer, schema, ID, phục hồi kho lỗi, lịch sử/backup, đồng bộ Writer–Canvas, module xuất và phạm vi cache PWA.

## Chạy kiểm tra

Yêu cầu Node.js có hỗ trợ `node:test` (Node.js 18 trở lên được khuyến nghị):

```bash
node --test tests/writer-v4-9.test.js
```

Các test đọc mã nguồn hiện tại và kiểm tra những bất biến quan trọng. Không cần API, Supabase, CDN, khóa bí mật hoặc kết nối mạng.

## Các cổng kiểm tra

1. Giữ khóa kho `haidat-writer-documents-v2`, schemaVersion 3 và định dạng ID HDW.
2. Kho lỗi phải có đường phục hồi; không được tự ý ghi đè khi người dùng chưa xác nhận.
3. Giữ khóa lịch sử, backup version 5 và dữ liệu Canvas trong hợp đồng lịch sử/backup.
4. Writer và Canvas phải cùng tham chiếu kho tài liệu và revision.
5. Export Studio phải được tích hợp ở cả hai chế độ; không phụ thuộc CDN phổ biến.
6. Service Worker phải precache Canvas và Export Studio.
7. Dọn cache chỉ được giới hạn trong họ `haidat-writer-`, không xóa cache ứng dụng khác.
8. Giữ các khóa thư mục/lịch sử cục bộ.

## Giới hạn kiểm định

- Đây là kiểm tra tĩnh dựa trên mã nguồn, không chạy ứng dụng trong trình duyệt.
- Không chứng minh được thao tác lưu/khôi phục thực tế, tính đúng đắn của giao dịch localStorage, khả năng mở DOCX, chất lượng PDF/PNG/SVG hoặc hành vi offline thực tế.
- Không thay thế kiểm thử trên Android/Samsung A05, desktop, nhiều tab, dữ liệu lớn, quota, crash recovery và Word/LibreOffice.
- Nếu đổi tên khóa hoặc thiết kế lại schema, cần cập nhật test có chủ đích và đánh giá tương thích trước khi sửa assertion.

## Điều kiện phát hành

Giữ trạng thái `QA-PENDING-DEVICE` cho tới khi có bằng chứng kiểm thử trình duyệt và thiết bị thật. Không tự động merge sang V3/main hoặc triển khai production.

