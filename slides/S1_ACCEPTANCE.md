# HAI ĐẤT SLIDES — S1 Stability

**Ngày bắt đầu:** 24/11/2026  
**Nhánh:** `slides-s1-stability`  
**Phạm vi:** chỉ thư mục `slides/` và workflow kiểm thử riêng.

## Mục tiêu

Ổn định nền tảng biên tập, lưu trữ cục bộ, trình chiếu, xuất HTML và chế độ ngoại tuyến trước khi mở rộng bộ dựng slide.

## Thay đổi

- Tách các hàm lõi độc lập vào `core.mjs`.
- Chuẩn hóa dữ liệu slide; phục hồi an toàn khi dữ liệu lưu bị hỏng hoặc sai định dạng.
- Bắt lỗi khi trình duyệt chặn hoặc hết dung lượng `localStorage`.
- Mã hóa nội dung người dùng trước khi đưa vào HTML trình chiếu, tránh diễn giải nội dung như markup.
- Dựng trang trình chiếu với nút điều hướng và phím mũi tên/trang cách.
- Chuyển ứng dụng sang ES module.
- Làm rõ trạng thái slide đang chọn, trạng thái nút điều hướng và thông báo lưu.
- Cô lập cache Service Worker theo tiền tố `haidat-slides-`, tránh xóa cache của WORK/CALC.
- Bổ sung kiểm thử Node.js cho chuẩn hóa dữ liệu, đọc/ghi lưu trữ, escape HTML và đầu ra trình chiếu.

## Kiểm thử

Chạy tại thư mục `slides/`:

```sh
npm test
node --check app.js
node --check core.mjs
node --check sw.js
```

Workflow GitHub Actions: `.github/workflows/slides-s1-tests.yml`.

## Chưa nằm trong S1

- Chèn ảnh, hình khối, bảng và biểu đồ.
- Nhập/xuất PPTX hoặc PDF.
- Đồng bộ PocketBase và lưu workbook/slide trên nhiều thiết bị.
- Kiểm thử Safari/iPhone và thiết bị gập thực tế.

S1 không thay đổi mã nguồn WORK/CALC và không gộp nhánh vào `main`.
