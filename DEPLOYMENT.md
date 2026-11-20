# HAI ĐẤT OFFICE — Hướng dẫn xuất bản

## Ba địa chỉ ứng dụng sau khi GitHub Pages hoạt động

- Writer: https://form997.github.io/Offiice/writer/
- Calc: https://form997.github.io/Offiice/calc/
- Slides: https://form997.github.io/Offiice/slides/

Các địa chỉ trên là URL dự kiến theo tên tài khoản/kho GitHub; chỉ dùng được sau khi Pages triển khai thành công.

## Bật GitHub Pages lần đầu

1. Mở Settings của kho: https://github.com/Form997/Offiice/settings/pages
2. Tại **Build and deployment**, chọn **Source: GitHub Actions**.
3. Mở tab Actions: https://github.com/Form997/Offiice/actions
4. Chọn workflow **Deploy HAI DAT OFFICE to GitHub Pages** và chạy **Run workflow** trên nhánh `v1-development` nếu workflow chưa tự chạy.
5. Chờ job Deploy hoàn tất; kiểm tra URL Pages được GitHub cấp trong phần Deployments.

## Tự động cập nhật

Sau khi cấu hình lần đầu, mỗi lần có commit mới vào `v1-development`, workflow sẽ xuất bản lại cả ba ứng dụng. Nhánh `main` không bị thay đổi.

## Lưu ý

- Đây là ba ứng dụng web/PWA riêng nằm trong cùng một kho và cùng một website Pages, mỗi app có đường dẫn riêng.
- Không cần tạo ba kho GitHub hoặc ba tài khoản hosting.
- Nếu Pages chưa được bật hoặc Actions bị hạn chế quyền, các URL chưa hoạt động; không xem URL dự kiến là bản phát hành đã nghiệm thu.
