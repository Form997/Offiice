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


## B5.5.12 — Gia cố tương tác con trỏ và hủy thao tác — 2026-11-21

Đợt kiểm tra mã nguồn phát hiện ba tình huống cần xử lý trước nghiệm thu thiết bị:

1. Đường căn resize trước đây bám theo vị trí con trỏ, không bám chính xác đường biên của tay nắm tại thời điểm bắt đầu. Khi người dùng chạm lệch tâm tay nắm, đường căn có thể lệch vài pixel dù kích thước cuối cùng vẫn tính theo delta con trỏ.
2. Chưa có phím Escape để hủy chủ động phiên resize đang giữ pointer capture.
3. Một pointer phụ (ví dụ ngón tay thứ hai trong khi pointer chính đang hoạt động ở nơi khác) có thể khởi tạo phiên resize nếu chưa có phiên resize nào được mở.

### Thay đổi

- Ghi nhận tâm hình học tay nắm lúc bắt đầu kéo; đường căn di chuyển theo cùng delta với phép tính kích thước, giúp đường căn bám đúng mép trục.
- Escape hủy phiên resize, ẩn đường căn và giải phóng pointer capture qua hàm hủy an toàn hiện có.
- Từ chối pointer có `isPrimary === false`; vẫn giữ khóa phiên khi đã có resize đang hoạt động.
- Bổ sung kiểm thử hợp đồng mã nguồn cho ba trường hợp trên.

### Phạm vi xác nhận

- Đây là sửa lỗi và kiểm thử hợp đồng mã nguồn; không thay đổi engine hình học, công thức, dữ liệu ô, định dạng, lưu trữ workbook hay schema.
- CI Node kiểm tra cú pháp và các hợp đồng; không phải mô phỏng Pointer Events trong trình duyệt.
- Cần nghiệm thu Chrome và Android thật cho Escape, pointer phụ, căn đường biên, cuộn, Freeze/Split và lưu–mở workbook.


## B5.5.13 — Giới hạn tọa độ đường căn trong vùng bảng — 2026-11-21

### Phát hiện và xử lý

Lớp phủ resize dùng chung được đặt trong #sheetPanes, trong khi sự kiện con trỏ phát ra từ nhiều lưới con. Phép đổi tọa độ phải dùng gốc và kích thước thực của lớp phủ chung, không lấy gốc của riêng một pane. Trước đây vị trí chỉ chặn ở mép đầu; khi kéo vượt khỏi mép cuối, đường căn có thể đi ra ngoài vùng bảng.

- Thêm module thuần sght/engine/axis-resize-guide.js.
- Tính vị trí theo công thức: tâm tay nắm ban đầu + delta con trỏ − gốc overlay.
- Giới hạn vị trí trong đoạn [0, extent], với extent là chiều rộng cho cột hoặc chiều cao cho hàng.
- Dùng cùng hàm cho pane thường, Freeze, Split và Quadrant; không thay đổi phép tính kích thước thực tế của hàng/cột.

### Kiểm thử

- Kiểm tra quy đổi từ tọa độ viewport về tọa độ overlay.
- Kiểm tra kéo vượt mép trái/trên và phải/dưới; đường căn không vượt giới hạn.
- Kiểm tra overlay có kích thước bằng 0 và từ chối trục không hợp lệ.
- Kiểm tra hợp đồng nối app với helper mới.

### Giới hạn nghiệm thu

Các kiểm tra trên là unit/source-contract tests bằng Node.js. Chúng không mô phỏng DOM layout, cuộn thật hoặc Pointer Events đa pane. Vẫn phải chạy checklist Chrome desktop và Android/Samsung A05 trong B5.5.11, đặc biệt: cuộn tới vị trí xa rồi resize, bật Freeze, Split dọc/ngang và Quadrant, kéo ở từng pane, kéo vượt mép bảng, sau đó lưu–mở workbook. Không tuyên bố đã nghiệm thu thiết bị khi chưa chạy các bước đó.



## B5.5.14 — Đồng nhất resize bằng bàn phím với vùng chọn — 2026-11-21

### Phát hiện và xử lý

B5.5.5 đã cho phép kéo tay nắm để đổi kích thước đồng loạt các hàng/cột trong vùng chọn. Tuy nhiên, phím mũi tên và Home trên tay nắm vẫn chỉ tác động một hàng/cột, tạo ra hai quy tắc khác nhau cho cùng một thao tác.

- Phím mũi tên nay gọi chung `axisResizeTargets(axis,index)`, nên áp dụng cho toàn bộ hàng/cột đang chọn khi tay nắm nằm trong vùng chọn; nếu tay nắm nằm ngoài vùng chọn thì chỉ tác động trục đó.
- Giữ nguyên bước 5 px, Shift + mũi tên 20 px và giới hạn kích thước của B5.5.1.
- Phím Home khôi phục mặc định cho toàn bộ trục đang chọn, không chỉ trục có tay nắm đang focus.
- Lệnh đặt lại theo lô dùng `setAxisSizes`, giới hạn 5.000 trục qua hàm xác định mục tiêu hiện hữu và giữ metadata hình học dạng thưa.
- Mỗi lần thao tác vẫn là một giao dịch hình học riêng, có thể Undo/Redo bằng lịch sử kích thước; không ghi snapshot dữ liệu ô.

### Kiểm thử và giới hạn

- Bổ sung source-contract test xác nhận đường bàn phím dùng cùng bộ chọn mục tiêu và đường đặt lại theo lô.
- Bổ sung unit test cho đặt lại nhiều hàng/cột về mặc định, giữ nguyên geometry nguồn và loại bỏ override mặc định khỏi metadata thưa.
- Chờ workflow CI chạy trên commit B5.5.14. Các unit/source-contract tests không thay thế thao tác bàn phím thật trên Chrome/Android; chưa xác nhận Samsung A05 hoặc hiệu năng thiết bị.
- Không sửa engine công thức, giá trị ô, định dạng, clipboard, workbook schema, Freeze/Split hoặc nhánh `main`. Nhánh phát triển: `v1-development`.


## B5.5.15 — Tự cuộn vùng bảng khi resize sát mép — 2026-11-21

### Thay đổi

- Khi đang kéo tay nắm đổi kích thước hàng/cột, nếu con trỏ áp sát mép trái/phải hoặc trên/dưới của pane chứa tay nắm, pane đó tự cuộn theo đúng trục đang resize.
- Tốc độ cuộn tăng dần theo khoảng cách con trỏ tới mép, giới hạn tối đa 16 px mỗi khung hình; vùng kích hoạt mép là 44 px và tự thu hẹp với pane hẹp.
- Chỉ tác động pane chứa tay nắm hiện hành (.sheet-scroll), nhờ vậy luồng cuộn đồng bộ sẵn có của Freeze/Split/Quadrant tiếp tục nhận sự kiện scroll gốc.
- Dừng vòng lặp requestAnimationFrame khi rời vùng kích hoạt, hết biên cuộn, thả pointer, pointercancel, mất focus, đổi sheet hoặc hủy resize. Không tạo timer nền và không chạy khi không có phiên kéo.
- Không tự thay đổi kích thước chỉ vì pane đang cuộn; kích thước vẫn tính theo delta con trỏ như trước. Người dùng tiếp tục rê con trỏ để điều chỉnh kích thước.

### Kiểm thử và giới hạn

- Thêm helper thuần axis-resize-autoscroll.js và unit/source-contract tests cho mép đầu/cuối, vùng giữa, tốc độ giới hạn, pane hẹp, dữ liệu tọa độ không hợp lệ và đường dừng vòng lặp.
- Các test tự động không mô phỏng cuộn DOM/Pointer Events thật. Cần nghiệm thu Chrome desktop, Freeze Panes, Split dọc/ngang, Quadrant và Android/Samsung A05; chưa có đo RAM hoặc hiệu năng thiết bị thật.
- Không sửa engine công thức, cell data, định dạng, clipboard, workbook schema hoặc nhánh main. Nhánh phát triển: v1-development.

## B5.5.16 — Gia cố vòng đời tự cuộn khi resize — 2026-11-21

### Phát hiện và xử lý

- Helper tự cuộn nay từ chối tọa độ, mép pane hoặc giá trị tốc độ không hữu hạn; tọa độ lỗi không còn bị ép thành 0 rồi vô tình kích hoạt cuộn về đầu bảng.
- Mỗi khung hình kiểm tra trang tính vẫn là trang đang hoạt động, tay nắm còn gắn trong DOM và pane `.sheet-scroll` còn tồn tại, vẫn chứa đúng tay nắm. Nếu cấu trúc bị thay thế trong lúc kéo, phiên resize được hủy an toàn.
- Khi con trỏ rời vùng kích hoạt hoặc pane đã tới giới hạn cuộn, vòng lặp không tiếp tục chạy vô ích; lượt pointermove sau có thể khởi động lại.
- Giữ nguyên tốc độ tối đa 16 px/khung hình, vùng kích hoạt 44 px, giới hạn resize và logic đồng bộ cuộn của Freeze/Split/Quadrant.

### Kiểm thử và giới hạn

- Bổ sung kiểm thử tọa độ NaN/Infinity, mép pane lỗi, vùng pane hẹp, điều kiện pane/handle bị tháo khỏi DOM và dừng vòng lặp tại biên cuộn.
- Unit/source-contract tests không thay thế mô phỏng DOM/Pointer Events thật. Vẫn cần nghiệm thu Chrome desktop, Freeze/Split/Quadrant và Android/Samsung A05; chưa có đo RAM hay hiệu năng thiết bị thật.
- Không sửa engine công thức, dữ liệu ô, định dạng, clipboard, workbook schema hoặc nhánh `main`. Nhánh phát triển: `v1-development`.

## B5.5.17 — Kiểm thử tích hợp toàn tuyến resize — 2026-11-21

### Mục tiêu

Khép vòng kiểm thử tự động cho các mô-đun đã hình thành trong B5.5.1–B5.5.16, tập trung vào đường đi chung giữa hình học hàng/cột, virtual scrolling, Freeze Panes, Split/Quadrant và lưu–mở workbook. Bước này không bổ sung hành vi giao diện mới và không thay thế nghiệm thu thủ công trên thiết bị.

### Thay đổi

- Thêm `sght/tests/axis-resize-integration.test.mjs` để kiểm tra geometry tùy chỉnh đi xuyên suốt virtual window và Freeze Panes, bao gồm offset, hàng/cột ghim và phần vùng cuộn còn lại.
- Kiểm tra round-trip workbook giữ nguyên geometry, Freeze, Split, giá trị ô, công thức và định dạng.
- Kiểm tra đồng bộ vị trí Quadrant theo trục liên kết, không làm đột biến trạng thái đầu vào.
- Kiểm tra phối hợp phép tính đường căn và edge auto-scroll, gồm trường hợp tọa độ lỗi.
- Kiểm tra metadata hình học vẫn thưa ở lưới 100.000 hàng và giới hạn cập nhật theo lô 5.000 trục.

### Phạm vi bảo toàn

Không sửa runtime `app.js`, engine công thức, sparse cell storage, clipboard nội dung, dữ liệu workbook hoặc schema. Không thêm dependency; test được thu nhận tự động bởi glob `sght/tests/*.test.mjs` trong `npm test`.

### Giới hạn nghiệm thu

Đây là kiểm thử tích hợp cấp module bằng Node.js, chưa phải browser E2E. Chỉ xác nhận CI sau khi workflow trên commit mới hoàn tất. Vẫn cần thao tác thật trên Chrome desktop và Android/Samsung A05: resize bằng chuột/cảm ứng, bàn phím, AutoFit, nhiều hàng/cột, Undo/Redo, tự cuộn, Freeze, Split từng chế độ, đổi sheet giữa lúc kéo và lưu–mở workbook. Chưa có số đo RAM hoặc hiệu năng thiết bị thật.

Nhánh `v1-development`; không sửa hoặc hợp nhất vào `main`. Ngày: 21/11/2026.


## B5.5.18 — Kiểm thử biên hình học và tương thích workbook — 2026-11-21

- Bổ sung kiểm thử offset tại các ranh giới, kích thước min/max, reset override, viewport tại hàng/cột cuối, workbook cũ và geometry độc lập theo sheet.
- Runbook chi tiết: `docs/SGHT_B5_5_18_ACCEPTANCE_RUNBOOK.md`.
- Các kiểm thử tự động chạy bằng Node.js; không mô phỏng DOM, CSS layout hoặc Pointer Events.
- Checklist Chrome desktop và Android/Samsung A05 vẫn ở trạng thái chờ cho tới khi có biên bản chạy thật. Không ghi nhận CI là nghiệm thu thiết bị.
- Không thay đổi runtime, công thức, cell data, định dạng, clipboard hoặc schema workbook.
