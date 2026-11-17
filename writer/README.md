# HAI ĐẤT WRITER V3.0

## Phạm vi bản V3.0
- Kế thừa cấu trúc trình soạn thảo hiện có, không thay kho dữ liệu cục bộ.
- Giữ nguyên sáu thẻ Ribbon và các công cụ quản lý tài liệu.
- Bổ sung điều chỉnh thu phóng vùng soạn thảo (75–150%), lưu lựa chọn trên thiết bị.
- Bổ sung chế độ tập trung: ẩn thanh đầu trang, thanh tài liệu và Ribbon; vẫn giữ thanh định dạng nhanh và nút thoát.
- Cập nhật bộ nhớ đệm PWA để tránh trình duyệt giữ mã V2.x.

## Dữ liệu và bảo mật
- Dữ liệu tài liệu hiện vẫn được lưu cục bộ trong trình duyệt.
- Đồng bộ, đăng nhập và phân quyền trực tuyến chỉ hoạt động sau khi cấu hình Supabase và áp dụng chính sách RLS phù hợp.
- Không đưa khóa `service_role` hoặc khóa bí mật lên mã nguồn công khai.

## Triển khai
GitHub Pages: `https://form997.github.io/Offiice/writer/`

Nhánh phát triển: `v3-development`. Bản này chưa được gộp vào nhánh chính.


## V4 — định hướng phát triển
V4 phát triển trên nhánh riêng `v4-development`, kết hợp chế độ Văn bản kiểu Docs với chế độ Thiết kế trực quan kiểu Canva trong cùng tài liệu. V4 chưa thay đổi dữ liệu hoặc mã chạy V3 ở mốc Foundation.

- Kiến trúc: `../docs/WRITER-V4-ARCHITECTURE.md`
- Nhật ký: `../docs/WRITER-V4-RELEASE.md`
