# SGHT B5.5.18 — Runbook kiểm thử biên và nghiệm thu hình học

Ngày lập: 21/11/2026  
Nhánh: `v1-development`  
Phạm vi: kiểm thử tự động cấp module và chuẩn hóa bằng chứng nghiệm thu thủ công.  
Trạng thái ban đầu: chưa chạy kiểm thử vật lý trên Chrome desktop hoặc Samsung A05.

## 1. Mục tiêu

Bổ sung kiểm thử cho các trường hợp biên chưa được thể hiện rõ trong B5.5.17:
- Ranh giới offset tại hàng/cột có kích thước nhỏ nhất, lớn nhất và kích thước tùy biến ở vị trí xa.
- Cận cuối lưới 100.000 hàng × 16.384 cột.
- Virtual window khi viewport chạm hàng/cột cuối.
- Workbook cũ không có metadata geometry.
- Hai sheet có geometry khác nhau; serialize/restore không làm lẫn metadata.
- Tạo geometry mới không làm thay đổi đối tượng nguồn.

## 2. Kiểm thử tự động

File mới: `sght/tests/axis-resize-boundary.test.mjs`.

Năm nhóm kiểm thử:
1. Ánh xạ offset ↔ chỉ số tại ranh giới của hàng/cột tùy biến.
2. Giới hạn kích thước 20–240 px cho hàng và 40–500 px cho cột; đặt về mặc định phải loại override khỏi sparse map.
3. Virtual window tại hàng 100.000 và cột 16.384; không vượt cận lưới, không tạo vùng spacer âm.
4. Khả năng đọc workbook cũ không có geometry và bảo toàn geometry độc lập giữa nhiều sheet.
5. Tính bất biến: cập nhật geometry tạo bản mới, không sửa đối tượng nguồn.

Các test được tự thu nhận bởi lệnh `node --test sght/tests/*.test.mjs` trong `npm test`. Chúng kiểm tra module thật bằng Node.js; không mô phỏng DOM, layout CSS, Pointer Events hoặc thao tác cảm ứng.

## 3. Dữ liệu chuẩn bị cho nghiệm thu giao diện

Tạo bản sao workbook thử nghiệm, không dùng workbook sản xuất duy nhất. Ghi các giá trị nhận diện:
- A1 = `SGHT-B5.5.18`
- B1 = `=1+1` (kết quả mong đợi: 2)
- C1 = `012345` (giữ nguyên chuỗi có số 0 đầu)
- D1 = `1.234,56` (nội dung văn bản mẫu)
- A2:D2 có định dạng khác nhau, trong đó A2 in đậm và B2 có màu nền.
- Sheet thứ hai có dữ liệu riêng và một kích thước hàng/cột tùy chỉnh khác sheet đầu.

Sau mỗi nhóm thao tác, kiểm tra lại giá trị, công thức và định dạng của các ô mẫu. Không chỉ nhìn vị trí ô.

## 4. Biên bản chạy thử thủ công

### Chrome desktop
- [ ] Resize cột ở đầu bảng, giữa bảng và gần cột 16.384.
- [ ] Resize hàng ở đầu bảng, giữa bảng và gần hàng 100.000.
- [ ] Đặt kích thước tại min/max; thử nhập/điều chỉnh vượt giới hạn.
- [ ] Thử kéo, Escape, pointercancel, mất focus và đổi sheet giữa lúc kéo.
- [ ] Thử bàn phím mũi tên, Shift + mũi tên và Home trên tay nắm.
- [ ] Thử AutoFit và resize nhiều hàng/cột; kiểm tra Undo/Redo độc lập với lịch sử dữ liệu.
- [ ] Thử Freeze, Split ngang, Split dọc và Quadrant; resize trong từng pane.
- [ ] Cuộn sát mép để kích hoạt auto-scroll; xác nhận không kẹt vòng lặp.
- [ ] Lưu, tải lại trang và xác nhận geometry của từng sheet còn nguyên.
- [ ] Đối chiếu A1:D2 trước/sau; không mất công thức, chuỗi số 0 đầu hoặc định dạng.

### Android / Samsung A05
- [ ] Chạm/kéo tay nắm theo chiều ngang và dọc; trang không cuộn ngoài ý muốn.
- [ ] Kéo chậm, kéo nhanh, kéo sát mép và thử hủy thao tác.
- [ ] Thử pointer đa điểm; pointer phụ không chiếm phiên resize.
- [ ] Thử Freeze/Split/Quadrant và resize trong từng pane.
- [ ] Lưu, đóng/mở lại trang; xác nhận geometry từng sheet.
- [ ] Ghi nhận độ trễ, hiện tượng giật, mức RAM nếu có công cụ đo đáng tin cậy.

### Bằng chứng cần ghi
| Trường | Giá trị ghi nhận |
|---|---|
| Ngày/giờ và múi giờ | |
| Thiết bị / hệ điều hành | |
| Trình duyệt / phiên bản | |
| Kích thước màn hình / zoom | |
| Workbook thử nghiệm | |
| Nhóm thao tác | |
| Kết quả: đạt / lỗi / chưa chạy | |
| Mô tả lỗi và bước tái hiện | |
| Ảnh hoặc video bằng chứng | |

## 5. Điều kiện kết luận

- Test tự động xanh chỉ xác nhận logic module và hợp đồng dữ liệu.
- Chỉ ghi "đạt nghiệm thu giao diện" khi checklist tương ứng đã được chạy và có bằng chứng thiết bị/trình duyệt.
- Không suy diễn rằng CI Linux đã kiểm tra Chrome hoặc Samsung A05.
- Không ghi số đo RAM/độ trễ nếu chưa đo trên thiết bị thật.
- Nếu phát hiện lỗi runtime, tạo bước sửa riêng, thêm test tái hiện trước khi sửa.
- Không thay đổi engine công thức, dependency graph, sparse cell storage, dữ liệu ô, định dạng, clipboard hoặc workbook schema trong phạm vi kiểm thử này.
- Không sửa nhánh `main`.

## 6. Kết luận phạm vi B5.5.18

B5.5.18 đóng các khoảng trống kiểm thử biên và chuẩn hóa cách ghi bằng chứng nghiệm thu. Đây chưa phải xác nhận đã thao tác thật trên Chrome desktop hoặc Samsung A05.
