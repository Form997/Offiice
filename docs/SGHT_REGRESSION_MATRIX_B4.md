# SGHT — Ma trận kiểm thử hồi quy B4

- Ngày lập: 2026-11-21
- Repository: `Form997/Offiice`
- Nhánh đích: `v1-development`
- Căn cứ kiểm kê: B1 và B2; B2 ghi nhận 177 nút HTML, 22 nút disabled mặc định và các phân hệ workbook, grid, công thức, dữ liệu, Pivot, Data Science, AI, Macro, tài khoản.
- Mục đích: khóa các hành vi hiện có thành bộ tiêu chí kiểm thử trước khi thay đổi HTML/CSS/JS giao diện.
- Trạng thái: **kế hoạch kiểm thử tĩnh; chưa chạy test, chưa xác nhận pass/fail**.

## 1. Quy tắc kiểm thử

1. Dùng workbook mẫu riêng; không chạy thử trên dữ liệu người dùng.
2. Mỗi ca phải ghi: mã ca, môi trường, dữ liệu đầu vào, thao tác, kết quả mong đợi, kết quả thực tế, ảnh/log và trạng thái.
3. Không đánh dấu PASS chỉ vì nút có listener hoặc không báo lỗi JavaScript.
4. Sau mỗi thay đổi giao diện, chạy lại toàn bộ nhóm P0 và các nhóm bị ảnh hưởng.
5. So sánh dữ liệu trước/sau bằng giá trị ô, công thức, kiểu dữ liệu, cấu trúc sheet và tệp xuất; không chỉ nhìn bằng mắt.
6. Các ca phụ thuộc backend phải ghi rõ cấu hình và dịch vụ; không giả lập thành công nếu backend chưa có.
7. Mọi lỗi phải có bước tái hiện, mức độ ảnh hưởng và commit gây ra lỗi.

## 2. Mức độ ưu tiên và điều kiện chặn

| Mức | Ý nghĩa | Điều kiện |
|---|---|---|
| P0 | Bảo toàn dữ liệu và thao tác cốt lõi | Không được phát hành giao diện mới nếu còn lỗi |
| P1 | Tính năng làm việc thường xuyên | Phải đạt trước khi mở rộng người dùng |
| P2 | Chuyên sâu / phụ thuộc môi trường | Có thể hoãn có ghi rõ giới hạn |
| P3 | Trình bày, tiện ích | Không được làm suy giảm P0/P1 |

**Tiêu chí chặn:** mất dữ liệu, sai công thức, dán lệch vùng, sai workbook/sheet, treo trang, không thể hoàn tác, lộ dữ liệu giữa phiên hoặc lỗi bảo mật đều là lỗi chặn.

## 3. Ma trận hồi quy

### A. Khởi động, workbook và lưu trữ

| ID | Ưu tiên | Ca kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| WB-01 | P0 | Mở ứng dụng lần đầu, workbook trống | Tạo vùng làm việc hợp lệ; không lỗi console nghiêm trọng |
| WB-02 | P0 | Nhập dữ liệu nhiều kiểu rồi tải lại trang | Dữ liệu đã lưu được khôi phục nguyên vẹn |
| WB-03 | P0 | Đổi tên workbook, tải lại | Tên mới được giữ; không đổi nhầm tên sheet |
| WB-04 | P0 | Tạo sheet mới bằng điểm vào duy nhất | Sheet mới xuất hiện, chọn được, không ghi đè sheet cũ |
| WB-05 | P0 | Đổi tên/chuyển sheet liên tục | Dữ liệu mỗi sheet độc lập và giữ nguyên |
| WB-06 | P1 | Workbook có nhiều sheet và dữ liệu lớn | Chuyển sheet đúng; không nhân đôi tab hoặc mất trạng thái |
| WB-07 | P1 | Xuất CSV | Tệp có tiêu đề, hàng/cột, Unicode và dấu phân cách đúng |
| WB-08 | P1 | Đóng/mở lại sau nhiều thao tác | Trạng thái lưu và dữ liệu nhất quán |

### B. Lưới, vùng chọn, cuộn và thao tác ô

| ID | Ưu tiên | Ca kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| GRID-01 | P0 | Chọn một ô bằng chuột | Địa chỉ ô và viền chọn đồng bộ |
| GRID-02 | P0 | Chọn vùng bằng kéo chuột | Vùng đầu/cuối và số ô chính xác |
| GRID-03 | P0 | Chọn vùng bằng Shift + phím mũi tên | Vùng chọn mở rộng đúng |
| GRID-04 | P0 | Nhập/sửa ô, Enter, Tab, Escape | Quy tắc xác nhận/hủy và di chuyển đúng |
| GRID-05 | P0 | Cuộn dọc/ngang tới vùng xa | Nhãn hàng/cột và dữ liệu không lệch |
| GRID-06 | P0 | Sao chép/dán một ô và vùng nhiều ô | Giá trị, công thức và kích thước vùng đúng |
| GRID-07 | P0 | Cắt/dán và xóa vùng | Không nhân đôi dữ liệu; vùng nguồn/đích đúng |
| GRID-08 | P1 | Kéo fill handle theo hàng/cột | Chuỗi, tham chiếu công thức và vùng đích đúng |
| GRID-09 | P1 | Chọn vùng lớn | Không treo giao diện; cuộn và vùng chọn vẫn phản hồi |
| GRID-10 | P1 | Chạm giữ/kéo trên màn hình cảm ứng | Không phụ thuộc hover; không cuộn trang ngoài ý muốn |
| GRID-11 | P1 | Chạm hai lần để sửa ô | Con trỏ và nội dung chỉnh sửa đúng |
| GRID-12 | P1 | Nhấn giữ mở menu ngữ cảnh | Menu đúng vị trí, không bị cắt khỏi màn hình |

### C. Công thức, tính toán và lịch sử

| ID | Ưu tiên | Ca kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| FORM-01 | P0 | Công thức cộng/trừ/nhân/chia cơ bản | Kết quả số đúng |
| FORM-02 | P0 | Tham chiếu tương đối và tuyệt đối | Sao chép công thức cho kết quả đúng |
| FORM-03 | P0 | Công thức tham chiếu sheet khác | Tên sheet và địa chỉ tham chiếu đúng |
| FORM-04 | P0 | Công thức lỗi cú pháp / chia 0 | Hiển thị lỗi có kiểm soát; không làm hỏng workbook |
| FORM-05 | P0 | Sửa ô nguồn có ô phụ thuộc | Tính toán lại đúng và không dùng cache cũ |
| FORM-06 | P1 | Hàm tổng hợp và thống kê | Đối chiếu với bộ kết quả chuẩn |
| FORM-07 | P0 | Undo/redo nhập, xóa, định dạng, dán | Khôi phục đúng thứ tự và không bỏ sót dữ liệu |
| FORM-08 | P1 | Undo/redo sau khi chuyển sheet | Không áp thao tác nhầm sheet |
| FORM-09 | P1 | Chẩn đoán công thức và sửa lỗi dạng preview | Preview không sửa dữ liệu; chỉ áp dụng sau xác nhận |

### D. Định dạng và trình bày bảng

| ID | Ưu tiên | Ca kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| FMT-01 | P1 | Font, cỡ chữ, màu chữ, màu nền | Áp dụng đúng vùng chọn |
| FMT-02 | P1 | Căn lề ngang/dọc và xuống dòng | Hiển thị nhất quán khi cuộn |
| FMT-03 | P1 | Định dạng số, phần trăm, ngày | Giá trị nền không bị biến đổi ngoài ý muốn |
| FMT-04 | P1 | Viền ô và xóa định dạng | Chỉ tác động vùng đã chọn |
| FMT-05 | P1 | Định dạng sau copy/paste | Hành vi nhất quán với tùy chọn dán |

### E. Dữ liệu, bảng, Pivot và biểu đồ

| ID | Ưu tiên | Ca kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| DATA-01 | P1 | Sắp xếp tăng/giảm có hàng tiêu đề | Toàn hàng đi cùng nhau; không xáo trộn cột độc lập |
| DATA-02 | P1 | Lọc theo điều kiện và bỏ lọc | Hiện đúng bản ghi; dữ liệu gốc không mất |
| DATA-03 | P1 | Xóa trùng lặp | Giữ đúng bản ghi theo cột khóa được chọn |
| DATA-04 | P1 | Tạo bảng và đổi tên bảng | Phạm vi và tên bảng hợp lệ |
| DATA-05 | P1 | Tổng phụ theo nhóm | Nhóm và phép tổng hợp đúng |
| PIV-01 | P1 | Nạp danh sách trường Pivot | Đọc đúng tiêu đề và kiểu dữ liệu |
| PIV-02 | P1 | Kéo/chọn trường vào hàng, cột, giá trị | Bố trí và phép tổng hợp đúng |
| PIV-03 | P1 | Đổi kiểu biểu đồ Pivot | Biểu đồ phản ánh dữ liệu hiện hành |
| PIV-04 | P1 | Đổi tên, nhân bản, xóa, sắp xếp biểu đồ | Không tác động nhầm biểu đồ khác |
| PIV-05 | P1 | Xuất biểu đồ PNG/PDF | Tệp mở được, nội dung không bị cắt |

### F. Freeze, split, zoom và điều hướng

| ID | Ưu tiên | Ca kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| VIEW-01 | P1 | Cố định hàng đầu/cột đầu/nhiều hàng cột | Vùng cố định đúng ranh giới |
| VIEW-02 | P1 | Bỏ cố định | Lưới trở về trạng thái cuộn bình thường |
| VIEW-03 | P1 | Chia khung và cuộn từng khung | Hai vùng cuộn theo cấu hình, không lệch dữ liệu |
| VIEW-04 | P1 | Thu/phóng và đặt lại 100% | Lưới và thanh công cụ không vỡ |
| VIEW-05 | P1 | Điều hướng bằng bàn phím | Không mất focus và không kẹt trong panel |

### G. Dashboard, Data Science, AI và Macro

| ID | Ưu tiên | Ca kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| DASH-01 | P1 | Mở/đóng Dashboard | Có một luồng mở/đóng hoàn chỉnh; không panel mồ côi |
| DASH-02 | P1 | Thêm biểu đồ và KPI | Widget xuất hiện, cấu hình và xóa được |
| DASH-03 | P1 | Lưu/nạp mẫu Dashboard | Khôi phục đúng cấu trúc và nguồn dữ liệu |
| DS-01 | P2 | Hồi quy các phân tích thống kê | Kết quả khớp bộ dữ liệu chuẩn và tài liệu phương pháp |
| DS-02 | P2 | Dữ liệu thiếu, ngoại lệ, cỡ mẫu nhỏ | Cảnh báo/điều kiện áp dụng được nêu rõ |
| AI-01 | P2 | AI khi chưa cấu hình dịch vụ / offline | Báo trạng thái rõ, không giả báo thành công |
| AI-02 | P2 | Gửi yêu cầu và nhận kết quả khi có cấu hình | Kết quả gắn đúng workbook; lỗi mạng được xử lý |
| MAC-01 | P1 | Ghi, dừng và phát lại macro | Lệnh và thứ tự thực thi đúng |
| MAC-02 | P1 | Lưu, nhập, xuất macro | Nội dung và metadata không bị hỏng |
| MAC-03 | P1 | Debug step/continue/stop | Trạng thái phiên đúng; không chạy ngoài ý muốn |
| MAC-04 | P0 | Macro không tin cậy / quyền hạn chế | Không thực thi khi chưa được cấp quyền |
| MAC-05 | P1 | Rollback macro lỗi | Khôi phục workbook về trạng thái trước chạy |

### H. Tài khoản, bảo mật và quyền riêng tư

| ID | Ưu tiên | Ca kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| SEC-01 | P0 | Không có backend xác thực | Không hiển thị trạng thái đăng nhập giả |
| SEC-02 | P0 | Đăng nhập/đăng xuất khi backend hoạt động | Phiên và trạng thái UI đồng bộ |
| SEC-03 | P0 | Hết hạn phiên và thu hồi phiên | Không tiếp tục thao tác được bằng phiên hết hạn |
| SEC-04 | P1 | MFA/Passkey trên trình duyệt hỗ trợ và không hỗ trợ | Báo điều kiện rõ, không kẹt giao diện |
| SEC-05 | P0 | Nhập dữ liệu/macro độc hại | Không thực thi nội dung không tin cậy |
| SEC-06 | P0 | Hai tài khoản hoặc hai workbook khác nhau | Không rò rỉ dữ liệu giữa phiên/người dùng |

### I. Responsive, trợ năng và hiệu năng

| ID | Ưu tiên | Ca kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| UX-01 | P1 | Desktop rộng | Lưới là vùng trung tâm; ribbon không chiếm quá nhiều chiều cao |
| UX-02 | P1 | Tablet dọc/ngang | Panel chuyển bố cục hợp lý, không tràn ngang ngoài chủ đích |
| UX-03 | P1 | Điện thoại màn hình nhỏ | Có thanh công cụ theo ngữ cảnh; thao tác chính không cần kéo thả chính xác |
| UX-04 | P1 | Phóng to trình duyệt 200% | Không mất chức năng hoặc che nút quan trọng |
| UX-05 | P1 | Tab/Shift+Tab và focus bàn phím | Thứ tự focus hợp lý, focus nhìn thấy |
| UX-06 | P1 | Nhãn trợ năng và thông báo trạng thái | Control có tên dễ hiểu; lỗi được thông báo |
| PERF-01 | P1 | Workbook mẫu nhỏ, vừa, lớn | Thời gian mở/nhập/cuộn được đo và ghi lại |
| PERF-02 | P1 | Cuộn lưới ảo hóa nhiều hàng/cột | Không render toàn bộ lưới; không tăng RAM vô hạn |
| PERF-03 | P1 | Nhiều thao tác liên tiếp | Không rò listener, không nhân đôi sự kiện |
| PERF-04 | P1 | Thiết bị RAM thấp | Ứng dụng không treo; có giới hạn/cảnh báo khi quá tải |

## 4. Bộ dữ liệu kiểm thử chuẩn

Tạo workbook `SGHT-REGRESSION-FIXTURE-01` gồm:
- Sheet `NhapLieu`: mã mẫu, nhóm, ngày, số lượng, đơn giá, ghi chú tiếng Việt có dấu.
- Sheet `TinhToan`: công thức tham chiếu tương đối, tuyệt đối, liên sheet, hàm tổng hợp và ô cố ý gây lỗi.
- Sheet `ThongKe`: dữ liệu nhóm đủ để chạy Pivot và các phân tích thống kê cơ bản.
- Sheet `BienTap`: vùng trống, ô định dạng khác nhau, chuỗi số/ngày và dữ liệu trùng.
- Bộ dữ liệu lớn được sinh riêng theo kích thước tăng dần; không trộn vào fixture nhỏ.

Lưu bản gốc chỉ đọc và checksum của tệp fixture. Mỗi lần chạy test tạo bản sao mới.

## 5. Ma trận môi trường tối thiểu

| Môi trường | Mục tiêu |
|---|---|
| Chrome desktop, độ rộng 1366px trở lên | Hồi quy giao diện chính và bàn phím/chuột |
| Chrome Android, màn hình nhỏ | Cảm ứng, cuộn, nhập liệu, menu và panel |
| Tablet portrait/landscape | Chuyển bố cục và vùng thao tác |
| Trình duyệt không hỗ trợ API tùy chọn | Fallback AI, Passkey, clipboard và xuất tệp |

Thiết bị RAM 4 GB và điện thoại Samsung A05 là mốc kiểm tra hiệu năng thực tế; phải ghi phiên bản hệ điều hành/trình duyệt và dung lượng workbook.

## 6. Mẫu ghi kết quả

| Trường | Nội dung cần ghi |
|---|---|
| Test ID | Ví dụ GRID-06 |
| Build/commit | SHA chính xác |
| Môi trường | Thiết bị, hệ điều hành, trình duyệt |
| Tiền điều kiện | Workbook và trạng thái phiên |
| Các bước | Từng thao tác có thể tái hiện |
| Mong đợi / thực tế | Ghi riêng, không nhập làm một |
| Bằng chứng | Ảnh, console, file xuất, checksum |
| Trạng thái | NOT RUN / PASS / FAIL / BLOCKED |
| Lỗi liên quan | Mã lỗi, issue hoặc commit |

## 7. Cổng nghiệm thu trước đại tu

- [ ] Đóng băng fixture và kết quả chuẩn.
- [ ] Chạy toàn bộ P0 trên phiên bản giao diện hiện tại để lấy baseline.
- [ ] Chạy P1 cốt lõi: workbook, grid, công thức, clipboard, định dạng, freeze/split.
- [ ] Ghi nhận các tính năng bị BLOCKED do backend hoặc trình duyệt.
- [ ] Có ảnh chụp desktop, tablet và mobile trước khi thay đổi.
- [ ] Có số đo thời gian mở workbook, nhập ô, cuộn và mức RAM.
- [ ] Không bắt đầu thay HTML/CSS/JS diện rộng khi chưa có baseline P0.

## 8. Giới hạn và thay đổi

B4 là đặc tả kiểm thử hồi quy, không phải báo cáo kết quả chạy thử. Chưa thực thi Chrome/Android, chưa đo hiệu năng, chưa xác nhận các ca PASS. Bước này chỉ thêm tài liệu; không sửa HTML, CSS, JavaScript, engine, dữ liệu hay schema. Không triển khai ứng dụng và không hợp nhất vào `main`.
