# HAI ĐẤT OFFICE — WORK V6.0.0-beta.1

**Ngày công bố:** 17/11/2026  
**Kênh:** Public beta · PWA ưu tiên điện thoại  
**Nhánh nguồn:** `v6-development`

## Giới thiệu

WORK V6 là ứng dụng làm việc văn bản của HAI ĐẤT OFFICE. Trong cùng một ứng dụng có hai chế độ:
- **Writer:** soạn thảo văn bản.
- **Canvas:** bố trí và thiết kế tài liệu.

Hai chế độ dùng chung kho tài liệu và giữ nguyên ID tài liệu. V6 ưu tiên trải nghiệm di động, hỗ trợ cài đặt dạng PWA và lưu dữ liệu cục bộ.

## Điểm mới trong V6

- Giao diện mobile-first: vùng chạm lớn, ribbon và quickbar cuộn ngang, bố cục thích ứng.
- PWA manifest, biểu tượng ứng dụng và Service Worker cache shell.
- Luồng mời cài ứng dụng, phản hồi chấp nhận/từ chối và thông báo sau cài.
- Giữ ID tài liệu khi chuyển Writer ↔ Canvas.
- Ngăn rời Writer sang Canvas nếu lưu tài liệu thất bại.
- Giữ `schemaVersion: 3`, không di trú/xóa kho tài liệu hiện hữu.
- Thêm test tĩnh cho manifest, tài nguyên precache, luồng cài PWA và điều hướng.

## Truy cập

- Ứng dụng WORK: https://form997.github.io/Offiice/writer/
- Mã nguồn V6: https://github.com/Form997/Offiice/tree/v6-development
- Hướng dẫn và kiểm định: [WORK V6 Mobile PWA](WORK-V6-MOBILE-PWA.md)

Đường dẫn ứng dụng chỉ được xem là hoạt động sau khi GitHub Pages workflow hoàn tất thành công.

## Trạng thái và giới hạn

Đây là **bản beta công khai**, chưa phải bản ổn định. Chưa có bằng chứng QA thực tế trên Samsung A05/Chrome Android, chưa xác nhận cài đặt PWA trên thiết bị, chưa xác nhận toàn bộ luồng offline, quota lưu trữ và xuất/nhập tài liệu trong trình duyệt thực tế. Bộ test đã được thêm vào repository nhưng chưa có kết quả CI được xác nhận tại thời điểm công bố.

Không dùng bản beta làm nơi lưu trữ duy nhất cho tài liệu quan trọng; hãy xuất bản sao lưu định kỳ. Chưa có tài khoản/đồng bộ cloud; Supabase vẫn để sau.

## Quy tắc phát hành

- V3 và V4 được giữ nguyên.
- V6 tiếp tục phát triển trên `v6-development`.
- Chỉ chuyển sang stable sau khi CI và kiểm thử thiết bị hoàn tất.


## Giao diện di động V6.1 — giai đoạn 2 (18/11/2026)

- Bổ sung thanh thao tác nhanh cố định ở cạnh dưới màn hình, thuận tiện thao tác một tay.
- Tăng khoảng trống an toàn phía dưới để thanh công cụ không che nội dung.
- Cập nhật phiên bản CSS trong trang Writer và Service Worker; đổi cache key để thiết bị nhận bộ giao diện mới.
- Sắp xếp ribbon theo các nhóm chức năng dạng thẻ trên màn hình nhỏ, giảm cuộn ngang trong từng nhóm.
- Trạng thái: đã ghi mã nguồn trên nhánh `v6-development`; cần chạy CI và kiểm thử trực tiếp trên điện thoại trước khi xác nhận phát hành.


## Giao diện di động V6.2 — Focus Workspace (18/11/2026)

- Mặc định mở thẻ **Trang chủ** trên điện thoại để ưu tiên công cụ viết thay vì bảng quản lý tệp.
- Thu gọn khu vực tên tài liệu; thao tác ít dùng (tài liệu mới, đổi tên, nhân bản, xóa) không chiếm chỗ trên màn hình nhỏ. Các chức năng quản lý vẫn có trong thẻ **Tệp**.
- Sắp xếp sáu thẻ Tệp / Trang chủ / Chèn / Bố trí / Tham chiếu / Xem thành lưới điều hướng dễ chạm.
- Giới hạn chiều cao bảng công cụ và cho cuộn bên trong, giữ vùng giấy làm việc dễ tiếp cận.
- Tối ưu chế độ tập trung trên điện thoại, ẩn phần đầu trang và điều hướng để dành diện tích cho nội dung.
- Làm mới cache Service Worker và phiên bản tài nguyên để thiết bị nhận CSS/JS V6.2.
- Trạng thái: cập nhật mã nguồn trên nhánh `v6-development`; chờ CI, kiểm thử trình duyệt di động và GitHub Pages.
