# SGHT — Kiểm kê giao diện B1 (Đại tu toàn diện)

- Ngày kiểm kê: 2026-11-20
- Repository: `Form997/Offiice`
- Nhánh kiểm kê: `v1-development`
- Commit nguồn được kiểm tra: `1a61e3e384719b0644155ec1e774542a54c5938d`
- `main` tại thời điểm kiểm tra: `1c70090411e44fa51b9a2736368711463f2a6dce` (không thay đổi)
- Phạm vi: kiểm kê tĩnh cấu trúc HTML/CSS/JavaScript và cây mã nguồn; chưa sửa giao diện, chưa chạy kiểm thử trình duyệt.

## 1. Quy mô hiện tại

| Hạng mục | Kết quả |
|---|---:|
| Tổng tệp trong repository | 165 |
| Tệp thuộc SGHT | 111 |
| Tệp HTML giao diện chính | 1 |
| Tệp CSS giao diện chính | 1 |
| Tệp JavaScript giao diện chính | 1 |
| Tệp kiểm thử SGHT | 44 |
| Module engine | 29 |
| Module AI | 12 |
| Module automation/macro | 6 |
| Module server | 15 |

Ba tệp giao diện chính:
- `sght/index.html`: 60.648 byte theo Git tree; 282 dòng.
- `sght/style.css`: 51.369 byte theo Git tree; 296 dòng.
- `sght/app.js`: 248.310 byte theo Git tree; 1.231 dòng.

Lưu ý: kích thước trên là kích thước blob được Git ghi nhận tại commit kiểm tra; số ký tự đọc được qua API có thể khác do cách biểu diễn Unicode.

## 2. Mật độ giao diện

Phân tích HTML:
- 392 thuộc tính `id`, không phát hiện ID trùng trong tài liệu.
- 177 nút `button`.
- 99 trường `input`, 36 trường `select`, 2 `textarea`, 1 `form`.
- 9 tab ribbon: Home, Insert, Formulas, Data, View, File, AI, Data Science, Macro.
- Có nhiều khu vực chức năng/panel: bảng tính, công cụ dữ liệu, pivot chart, dashboard, data science, AI, Macro Studio, lịch sử macro, bảo mật macro, debugger, công thức, chẩn đoán công thức, tài khoản và tìm kiếm.

Đây là mật độ điều khiển lớn đối với một màn hình làm việc đơn nhất, đặc biệt khi cùng lúc hiển thị ribbon, nhiều nhóm công cụ, panel chuyên sâu và lưới bảng tính. Cần tổ chức lại theo ngữ cảnh và cấp độ sử dụng, không chỉ thu nhỏ kích thước nút.

## 3. CSS và khả năng thích ứng

- 36 khối `@media`, phần lớn lặp lại các breakpoint 680px, 640px và 600px.
- 72 lần dùng `!important`.
- Có 9 quy tắc `position: sticky`, 1 quy tắc `position: fixed`, 27 khai báo overflow.
- Có nhiều selector lặp lại và các lớp responsive được bổ sung rải rác.

Nhận định: CSS có dấu hiệu tích lũy qua nhiều đợt mở rộng. Trước khi đại tu cần gom design tokens, chuẩn hóa breakpoint, loại bỏ override trùng sau khi đối chiếu giao diện, và xây layout responsive có chủ đích. Không xóa quy tắc chỉ dựa trên thống kê.

## 4. JavaScript giao diện và sự kiện

- `app.js` có 165 khai báo hàm theo phép quét tĩnh.
- Có 254 lời gọi `addEventListener`, 517 lời gọi `querySelector/querySelectorAll`.
- Có 17 phép gán `.innerHTML =`; cần rà soát ngữ cảnh dữ liệu và escaping, không mặc định tất cả đều không an toàn.
- Có các thao tác pointerdown/pointermove/pointerup cho vùng chọn và fill handle; đây là khu vực cần kiểm thử kỹ vì người dùng phản ánh thao tác kéo thả lê thê.

### Các dấu hiệu chức năng cần xác minh/sửa

1. Nút `openDashboard` và các nút `dashboardAddChart`, `dashboardAddKpi`, `dashboardSaveTemplate`, `dashboardLoadTemplate` hiện có trong HTML nhưng không tìm thấy chuỗi ID tương ứng trong `app.js`. Panel `dashboardPanel` mặc định bị ẩn. Đây là nhóm nghi vấn chưa được nối sự kiện, cần kiểm tra runtime và hoàn thiện hoặc ẩn khỏi giao diện cho tới khi dùng được.
2. Nút `addSheet` bị đặt `disabled`; title ghi “Nhiều trang tính chưa được triển khai”. Trong khi đó mã nguồn đã có `createWorkbookSheetUI`, `renderSheetTabs`, `switchWorkbookSheet` và nút `newSheet` có listener tạo trang tính. Hai điểm vào tạo trang tính không nhất quán; nút `addSheet` còn gắn listener chỉ hiện thông báo tính năng tương lai nhưng bị disabled nên không thể kích hoạt.
3. Có 22 nút mang thuộc tính disabled trong HTML. Phần lớn có thể là trạng thái hợp lệ theo ngữ cảnh (undo/redo, debugger, tìm kiếm, MFA/Passkey, phục hồi); không được coi tất cả là nút chết. Tuy nhiên phải có lý do, trạng thái và hướng dẫn rõ ràng cho người dùng.
4. Bộ đếm sự kiện tĩnh không chứng minh chức năng hoạt động. Cần lập ma trận kiểm thử từng nút/luồng, kiểm tra handler, trạng thái disabled, kết quả, lỗi và khả năng thao tác cảm ứng.

## 5. Kiến trúc hiện tại: phần nên bảo toàn

Cây mã nguồn cho thấy SGHT đã có các module riêng cho:
- sparse grid và grid capacity;
- workbook sheets, history, clipboard, fill series;
- freeze panes và split panes;
- calculation scheduler, dependency engine, formula cache;
- data tools, search;
- chart/AI/data science;
- macro engine, recorder, library, history, debugger và security;
- authentication, MFA, Passkey và account lifecycle.

Do đó đại tu không nên viết lại lõi bảng tính. Cần ưu tiên tái tổ chức presentation layer, phân tách controller/view, quản lý trạng thái panel và chuẩn hóa sự kiện; chỉ sửa engine khi kiểm thử phát hiện lỗi cụ thể.

## 6. Rủi ro/điểm đau cần xử lý theo thứ tự

P0 — Khung làm việc:
- Quá nhiều nhóm công cụ cạnh tranh diện tích với lưới.
- Thiếu phân cấp rõ giữa thao tác thường dùng và công cụ chuyên sâu.
- Panel mở/đóng và trạng thái hiển thị cần được quản lý tập trung.

P0 — Tính đúng của điều khiển:
- Rà soát nút mồ côi, nút bị khóa vĩnh viễn, handler placeholder và chức năng chưa hoàn tất.
- Không hiển thị nút như thể đã sẵn sàng nếu chưa có luồng hoàn chỉnh.

P1 — Trải nghiệm bảng tính:
- Giảm phụ thuộc vào kéo thả; cung cấp thao tác chạm, menu ngữ cảnh và lệnh bàn phím.
- Kiểm thử fill handle, chọn vùng, cuộn đồng bộ, freeze/split trên màn hình cảm ứng.
- Bảo đảm thanh công thức và vùng lưới không bị panel che khuất.

P1 — Responsive:
- Xây layout desktop/tablet/mobile theo breakpoint thống nhất.
- Trên điện thoại, dùng thanh công cụ theo ngữ cảnh và panel dạng drawer/bottom sheet; không ép ribbon desktop thu nhỏ nguyên xi.

P2 — Bảo trì:
- Chuẩn hóa design tokens và CSS layers.
- Giảm selector override và `!important` sau khi có baseline visual.
- Tách app controller lớn thành các module giao diện có ranh giới rõ, tránh thay đổi engine không cần thiết.

## 7. Kế hoạch tiếp theo

- B2: lập bản đồ DOM/layout chi tiết, phân nhóm toàn bộ 177 nút và các trường nhập liệu theo tác vụ; gắn trạng thái “đang hoạt động / phụ thuộc điều kiện / placeholder / nghi vấn chưa nối”.
- B3: chốt kiến trúc giao diện mới và wireframe desktop + mobile.
- B4: lập ma trận kiểm thử hồi quy trước khi thay đổi UI.
- B5 trở đi: triển khai từng lớp giao diện, không xóa chức năng cũ nếu chưa có phương án thay thế và kiểm thử.

## 8. Giới hạn của kiểm kê B1

Đây là kiểm kê mã nguồn tĩnh từ commit đã nêu. Chưa chạy ứng dụng trên Chrome/Android/desktop, chưa đo thời gian phản hồi, chưa mô phỏng thao tác kéo thả và chưa xác nhận mọi nút ở runtime. Các dấu hiệu “không tìm thấy ID trong JS” là nghi vấn mạnh nhưng vẫn phải đối chiếu runtime trước khi kết luận cuối cùng.

## 9. Thay đổi mã nguồn

B1 chỉ thêm tài liệu kiểm kê. Không sửa `index.html`, `style.css`, `app.js`, engine, dữ liệu người dùng hoặc schema. Không thay đổi nhánh `main`; không triển khai sản phẩm ở bước này.
