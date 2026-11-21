# SGHT B5.5.11 — Kiểm định hình học và quy trình nghiệm thu resize

Ngày: 2026-11-21  
Nhánh: `v1-development`  
Phạm vi: kiểm định an toàn kích thước hàng/cột sau B5.5.10.

## Mục tiêu

B5.5.11 không bổ sung thao tác resize mới. Giai đoạn này kiểm tra tính nhất quán của hình học lưới thưa, các mốc tọa độ, giới hạn kích thước, cập nhật theo lô và khả năng tuần hoàn dữ liệu geometry. Mục tiêu là giảm rủi ro lệch vị trí ô khi cuộn xa hoặc dùng freeze/split.

## Kiểm định tự động được bổ sung

File: `sght/tests/grid-geometry-acceptance.test.mjs`

- Kiểm tra điểm đầu/cuối mỗi hàng và cột tùy biến; tọa độ đúng biên phải ánh xạ về đúng chỉ số.
- Đối chiếu offset, tổng kích thước vùng và tổng kích thước trục với phép cộng kích thước thực.
- Kiểm tra cập nhật đơn, cập nhật nhiều trục, cập nhật bản đồ; xác nhận đối tượng geometry nguồn không bị đột biến.
- Kiểm tra serialize → JSON → restore và reset override.
- Kiểm tra giới hạn chỉ số, tọa độ âm/không hữu hạn, kích thước ngoài min/max và giới hạn 5.000 mục/lần.
- Xác nhận lưới 100.000 hàng vẫn lưu override dạng sparse, không tạo mảng dày.

Các test này chạy bằng Node.js và kiểm tra module hình học thật. Chúng không giả lập DOM, Pointer Events hoặc trình duyệt.

## Quy trình nghiệm thu thủ công — Chrome desktop

- [ ] Mở workbook thử nghiệm đã sao lưu; ghi nhận một số ô có dữ liệu, công thức và định dạng.
- [ ] Kéo tăng/giảm chiều rộng một cột; kiểm tra đường biên, tiêu đề và ô dữ liệu thẳng hàng.
- [ ] Kéo tăng/giảm chiều cao một hàng; kiểm tra nội dung ô không bị thay đổi.
- [ ] Kéo biên rồi nhấn Escape hoặc hủy pointer; xác nhận kích thước trở về trước thao tác.
- [ ] Dùng AutoFit cột/hàng trên vùng chọn nhỏ và vùng lớn; kiểm tra giới hạn và phản hồi.
- [ ] Chọn nhiều hàng/cột, đặt cùng kích thước; xác nhận chỉ đúng các trục đã chọn bị thay đổi.
- [ ] Dùng chép kích thước và áp dụng kích thước; xác nhận không sao chép giá trị, công thức hoặc định dạng ô.
- [ ] Thử hoàn tác/làm lại kích thước nhiều lần; sau đó thử undo/redo dữ liệu ô riêng biệt.
- [ ] Thử cuộn xa, nhảy tới địa chỉ xa, freeze hàng/cột và split pane; không để header hoặc ô lệch tọa độ.
- [ ] Đổi sheet khi đang kéo; chuyển tab trình duyệt khi đang kéo; xác nhận phiên resize bị hủy an toàn.
- [ ] Lưu, tải lại trang, mở workbook; xác nhận geometry theo từng sheet vẫn đúng.
- [ ] Đối chiếu dữ liệu, công thức và định dạng trước/sau bằng các ô mẫu.

## Quy trình nghiệm thu cảm ứng — Android / Samsung A05

- [ ] Chạm và kéo tay nắm resize; không bị cuộn trang ngoài ý muốn.
- [ ] Kéo chậm, kéo nhanh, kéo sát mép màn hình; không mất pointer capture hoặc kẹt trạng thái.
- [ ] Chạm đa điểm trong lúc resize; pointer thứ hai không ghi đè phiên đầu.
- [ ] Chuyển ứng dụng hoặc khóa màn hình giữa lúc kéo; quay lại không còn đường căn hay phiên kéo treo.
- [ ] Lặp lại AutoFit, chọn nhiều hàng/cột, undo/redo và lưu–mở workbook.
- [ ] Theo dõi độ trễ, mức tiêu thụ bộ nhớ và hiện tượng giật trên workbook lớn.

## Cổng chất lượng và giới hạn kết luận

1. GitHub Actions phải xanh trên commit chứa B5.5.11.
2. Test Node xác nhận module hình học và hợp đồng dữ liệu; không được gọi đó là browser E2E.
3. Chỉ đánh dấu nghiệm thu giao diện sau khi checklist Chrome và Android được thực hiện, có ghi thiết bị/trình duyệt/kết quả.
4. Không tuyên bố đã đo RAM hoặc thử trên Samsung A05 nếu chưa có phép đo thực tế.
5. Không sửa engine công thức, dependency graph, sparse cell storage, cells, formats, clipboard dữ liệu hoặc schema workbook.
6. Không sửa nhánh `main`.

## Kết luận trạng thái

B5.5.11 bổ sung lớp kiểm định tự động cho hình học và một biên bản nghiệm thu thao tác thực tế. Các mục checklist chưa được chạy phải tiếp tục ở trạng thái chờ; CI xanh không thay thế thử nghiệm thiết bị.
