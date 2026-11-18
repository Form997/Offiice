# HAI ĐẤT SGHT — Bảng tính

## Giao diện làm việc chuyên nghiệp — 2026-11-18

### Thanh công cụ và bố cục
- Thanh tiêu đề: tên ứng dụng, trạng thái lưu, hoàn tác/làm lại, lưu, tạo bảng mới, xuất CSV.
- Thanh trình đơn: Trang chủ, Chèn, Công thức, Dữ liệu, Xem, Tệp.
- Thanh công cụ: bảng tạm, định dạng ô cơ bản, hàm nhanh, thu phóng.
- Thanh địa chỉ và công thức: hiển thị ô đang chọn, nhập và áp dụng biểu thức.
- Vùng lưới: tiêu đề cột/hàng cố định khi cuộn.
- Thanh trang tính và thanh trạng thái ở cuối vùng làm việc.
- Bố cục co giãn, thanh công cụ cuộn ngang trên điện thoại.

### Lệnh đang hoạt động
- Hoàn tác/làm lại lịch sử chỉnh sửa trong phiên hiện tại.
- Lưu thủ công và tự lưu vào localStorage.
- Sao chép/cắt/dán khi trình duyệt cấp quyền clipboard; vẫn hỗ trợ dán bằng thao tác hệ thống.
- Xóa nội dung ô đang chọn.
- Tạo công thức nhanh SUM, AVERAGE, COUNT.
- Thu phóng lưới từ 60% đến 160%.
- Xuất CSV UTF-8.

### Nền tảng bảng tính
- Lưới hiện tại vẫn dựng 16 cột × 40 hàng; chưa triển khai lưới mở rộng không giới hạn.
- Chọn ô, nhập/sửa nội dung qua thanh công thức.
- Công thức tham chiếu ô, ví dụ `=A1+B1`, `=SUM(A1:A5)`.
- Phát hiện tham chiếu vòng ở mức cơ bản.
- Dán vùng dữ liệu dạng tab/newline từ clipboard.
- Bộ máy công thức độc lập tại `engine/core.js`, không dùng `eval()`, `new Function()` hay thư viện spreadsheet bên ngoài.

### Giới hạn còn lại
Đây là bản phát triển giao diện, chưa phải sản phẩm thay thế Excel/Google Sheets. Chưa có nhiều trang tính thực sự, định dạng ô được lưu, biểu đồ, lọc/sắp xếp, nhập XLSX, cộng tác trực tuyến, đồng bộ đám mây hoặc kiểm soát quyền. Một số mục trình đơn là khung điều hướng cho các mô-đun sẽ phát triển tiếp. Dữ liệu localStorage chỉ nằm trên trình duyệt/thiết bị hiện tại; xóa dữ liệu trình duyệt có thể làm mất bản lưu.

### Chạy thử
Mở `sght/index.html` qua GitHub Pages sau khi workflow triển khai hoàn tất. Khi chạy cục bộ, cần phục vụ thư mục qua HTTP vì ứng dụng dùng JavaScript module.

## Nhật ký phát triển
- 2026-11-18 — Bản lưới tương tác đầu tiên, nối với bộ máy công thức.
- 2026-11-18 — Hiện đại hóa bố cục: thanh tiêu đề, trình đơn, ribbon công cụ, thanh công thức, thanh trang tính và trạng thái; bổ sung hoàn tác/làm lại, clipboard, hàm nhanh và thu phóng. Ghi rõ lưới mở rộng vô hạn vẫn là hạng mục tiếp theo.

## SGHT Macro Studio — nền móng đầu tiên — 2026-11-19

- Thêm ngôn ngữ macro khai báo độc lập tại `automation/macro-engine.js`; không dùng `eval()`, `new Function()`, JavaScript tùy ý, truy cập mạng hay hệ thống tệp.
- Lệnh hiện hỗ trợ: `SET`, `COPY`, `CLEAR`, `SUM`; có dòng ghi chú bắt đầu bằng `#`.
- Có bước phân tích cú pháp và xem trước trước khi chạy; thực thi yêu cầu xác nhận rõ ràng.
- Giới hạn an toàn: tối đa 2.000 lệnh/macro và 10.000 ô/lệnh.
- Có thể hoàn tác bằng lịch sử chỉnh sửa hiện tại.
- Chưa phải VBA: chưa chạy trực tiếp mã VBA, chưa có trình gỡ lỗi, sự kiện, lịch chạy hay AI sinh macro. Các phần đó là các chặng kế tiếp.
- Bổ sung kiểm thử tự động cho phân tích, quyền thực thi, thao tác dữ liệu và giới hạn an toàn.


## Macro Recorder — 2026-11-19

- Thêm máy ghi thao tác vào SGHT Macro Studio.
- Ghi thao tác nhập/sửa ô, xóa ô và dán vùng dữ liệu thành lệnh macro độc lập.
- Có nút bắt đầu/dừng ghi; khi dừng, mã được đưa vào trình soạn thảo để người dùng kiểm tra.
- Giới hạn 2.000 thao tác mỗi lượt ghi; tự dừng khi chạm giới hạn.
- Thao tác do macro đang chạy không bị ghi lặp vào recorder.
- Bổ sung kiểm thử cho trạng thái ghi, dừng, dán vùng và giới hạn.
- Chưa có ghi định dạng, chọn vùng, thao tác hàng/cột hoặc ghi sự kiện nền.

## Macro Library — 2026-11-19 (bổ sung sửa lỗi khởi tạo)

- Thêm thư viện macro cục bộ: lưu, đọc, cập nhật, nhân bản và xóa macro.
- Mỗi macro có tên, mô tả, mã lệnh, thời điểm tạo/cập nhật và số phiên bản.
- Kiểm tra cú pháp macro trước khi lưu; từ chối macro rỗng, lệnh sai và tên trùng.
- Hỗ trợ xuất một macro hoặc toàn bộ thư viện dưới dạng JSON SGHT; hỗ trợ nhập lại.
- Dữ liệu nằm trong localStorage của trình duyệt, không tự tải lên máy chủ.
- Giới hạn: tối đa 100 macro, 50.000 ký tự/macro, 1 MB/thư viện.
- Bổ sung kiểm thử CRUD, nhân bản, nhập/xuất, kiểm tra dữ liệu và giới hạn.
- Chưa có đồng bộ đám mây, chia sẻ quyền, lịch sử phiên bản có thể khôi phục hoặc chữ ký số.

## Macro Debugger — 2026-11-19

- Thêm phiên gỡ lỗi có phê duyệt rõ ràng trước khi thực thi.
- Hỗ trợ chạy từng lệnh, tiếp tục chạy đến hết, dừng phiên và hoàn tác toàn bộ thay đổi của phiên.
- Nhật ký từng bước ghi số bước, dòng lệnh, loại lệnh và giá trị ô trước/sau.
- Mỗi lệnh được thực thi theo giao dịch nhỏ; nếu lệnh gặp lỗi trong lúc ghi dữ liệu, các thay đổi của chính lệnh đó được phục hồi.
- Hoàn tác phiên dựa trên ảnh chụp giá trị trước khi từng ô bị thay đổi.
- Nhật ký giao diện giới hạn hiển thị 30 bước gần nhất để giảm tải thiết bị.
- Chưa có breakpoint tùy ý, watch expressions, step-into/over hoặc debugger cho mã VBA.


## Macro Breakpoints & Watch — 2026-11-19

- Bổ sung breakpoint theo số dòng lệnh thực tế trong macro; khi chạy tiếp, debugger tự dừng trước khi thực thi lệnh tại dòng đã đánh dấu.
- Có thể đặt nhiều breakpoint, bỏ qua điểm dừng bằng cách bấm Tiếp tục lần nữa hoặc thực thi thủ công bằng Chạy 1 bước.
- Bổ sung Watch cho tối đa 50 ô, chấp nhận nhiều địa chỉ phân cách bằng dấu phẩy, chấm phẩy hoặc khoảng trắng.
- Giá trị Watch được đọc khi cấu hình và cập nhật sau mỗi lệnh, hiển thị cạnh nhật ký bước.
- Địa chỉ Watch không hợp lệ và breakpoint không trỏ tới dòng lệnh sẽ bị từ chối, không âm thầm bỏ qua.
- Breakpoint chỉ áp dụng cho các dòng có lệnh đã phân tích; dòng ghi chú/trống không tạo điểm dừng.
- Vẫn yêu cầu phê duyệt trước khi thực thi; tiếp tục giữ cơ chế hoàn tác phiên và giới hạn nhật ký 30 bước trên giao diện.
- Chưa có conditional breakpoint, biểu thức Watch, step-into/over hoặc debugger VBA.


## Macro Version Control & History — 2026-11-19

- Thêm kho lịch sử phiên bản macro độc lập với danh sách macro hiện hành.
- Ghi lại snapshot khi người dùng tạo mới, lưu/cập nhật và khôi phục macro; giữ nội dung, tên, mô tả, số phiên bản, thời điểm và loại thao tác.
- Mỗi macro lưu tối đa 30 phiên bản gần nhất; toàn kho tối đa 2 MB. Khi gần chạm giới hạn, hệ thống rút gọn lịch sử mỗi macro còn 10 bản trước khi từ chối ghi nếu vẫn quá dung lượng.
- Xem nội dung của từng phiên bản, so sánh hai phiên bản theo từng dòng, phân biệt thêm/sửa/xóa.
- Khôi phục không ghi đè lịch sử cũ: nội dung phiên bản được chọn được lưu thành một phiên bản mới.
- Có thể xuất lịch sử của một macro dưới dạng JSON để sao lưu.
- Dữ liệu chỉ lưu trên localStorage của thiết bị; chưa đồng bộ nhiều thiết bị, chưa có tài khoản/người dùng phân quyền và chưa có chữ ký số.
\n\n## SGHT Macro Security & Permission Center — 2026-11-19\n\n- Thêm trung tâm quyền macro tại `automation/macro-security.js`.\n- Phân quyền theo nhóm lệnh `SET`, `COPY`, `CLEAR`, `SUM`; nhóm bị khóa sẽ bị chặn trước khi thực thi.\n- Xem trước số lệnh, nhóm lệnh, số ô duy nhất và phạm vi ô dự kiến tác động.\n- Thiết lập giới hạn theo phiên: tối đa 2.000 lệnh và 10.000 lượt ô; mặc định thận trọng 500 lệnh/5.000 lượt ô.\n- Kiểm tra quyền trước từng lệnh, hỗ trợ dừng khẩn cấp và khóa phiên mới cho tới khi người dùng chủ động mở khóa.\n- Nhật ký kiểm toán lưu tối đa 500 sự kiện trên localStorage; có phê duyệt, lệnh đã chạy, hoàn tất, dừng và đặt lại khóa.\n- Mọi phiên vẫn cần xác nhận trực tiếp; macro lưu/nhập không được tự chạy.\n- Giới hạn phạm vi: đây là lớp kiểm soát cho ngôn ngữ macro khai báo hiện có, không phải cơ chế cách ly hệ điều hành hay sandbox JavaScript tùy ý. Không có quyền mạng/tệp/hệ thống để cấp trong phiên bản này.\n- Bổ sung kiểm thử chính sách, phê duyệt, giới hạn, dừng khẩn cấp và nhật ký.\n

## SGHT AI Intelligence — Giai đoạn 7 — 2026-11-19

- Thêm mô-đun ngoại tuyến tại `ai/ai-intelligence.js`, độc lập với bộ máy công thức và Macro Studio.
- Phân tích bảng hiện tại: số ô có dữ liệu, số/nội dung chữ, số công thức, lỗi tính toán; thống kê tổng, trung bình, trung vị, nhỏ nhất/lớn nhất, tứ phân vị và phát hiện ngoại lệ theo quy tắc IQR.
- Gợi ý công thức dựa trên dữ liệu lân cận ô đang chọn; người dùng chọn gợi ý, kiểm tra trên thanh công thức rồi tự bấm Áp dụng.
- Soạn bản nháp macro từ các câu tiếng Việt thuộc tập lệnh giới hạn: nhập giá trị vào ô, xóa vùng, tính tổng vùng vào ô, sao chép vùng sang ô.
- Bản nháp được kiểm tra cú pháp và chuyển sang Macro Studio; không tự chạy, không bỏ qua phê duyệt và Trung tâm bảo mật Giai đoạn 6.
- Không gọi API, không gửi dữ liệu ra ngoài, không thực thi JavaScript tùy ý. Đây là lớp trợ lý phân tích quy tắc chạy cục bộ, chưa phải mô hình ngôn ngữ sinh nội dung tự do.
- Bổ sung kiểm thử cho thống kê, ngoại lệ, gợi ý công thức, sinh bản nháp và từ chối yêu cầu ngoài phạm vi.
- Chưa có dự báo chuỗi thời gian, hồi quy đa biến, biểu đồ tự sinh, kết nối mô hình AI trực tuyến hoặc học theo dữ liệu người dùng.


## SGHT Data Science — Giai đoạn 8 — 2026-11-19

- Thêm mô-đun thống kê độc lập `ai/data-science.js`, không dùng thư viện thống kê bên ngoài.
- Tương quan Pearson: hệ số r, R², số quan sát và phân loại độ lớn tương quan mang tính mô tả.
- Hồi quy tuyến tính đơn: hệ số chặn, hệ số góc, R², R² hiệu chỉnh, sai số chuẩn hệ số góc, giá trị dự báo và phần dư trong mô-đun.
- ANOVA một nhân tố: trung bình và độ lệch chuẩn từng nghiệm thức, SS, df, MS, F và p-value từ phân phối F.
- Giao diện nhận vùng dữ liệu trực tiếp từ bảng tính; vùng X/Y phải cùng số quan sát; ANOVA nhận cột mã nghiệm thức và cột kết quả.
- Kiểm tra cỡ mẫu, dữ liệu thiếu/không phải số, biến X không biến thiên và nhóm không đủ lặp.
- Kết quả không tự ghi vào ô, không sửa dữ liệu gốc.
- Giới hạn có chủ ý: chưa có hồi quy đa biến, LSD/Tukey hậu nghiệm, kiểm tra giả định bằng đồ thị, chuỗi thời gian hay biểu đồ tự sinh. ANOVA chỉ cho biết khác biệt tổng thể, không xác định cặp nghiệm thức khác nhau.
- Cảnh báo: kết luận thống kê còn tùy thiết kế thí nghiệm, tính độc lập, phân phối phần dư và đồng nhất phương sai; không suy ra quan hệ nhân quả chỉ từ tương quan/hồi quy.
- Bổ sung kiểm thử cho tương quan, hồi quy, ANOVA và trường hợp dữ liệu không hợp lệ.


## SGHT Data Science — Giai đoạn 9 — 2026-11-19

Mở rộng bộ phân tích thống kê nghiên cứu chạy ngoại tuyến, dùng dữ liệu trực tiếp từ vùng ô của bảng tính.

### Chức năng
- Thống kê mô tả: n, trung bình, trung vị, min/max, khoảng biến thiên, Q1/Q3, IQR, phương sai mẫu, độ lệch chuẩn mẫu và CV%.
- Hồi quy tuyến tính đơn: hệ số, R², R² hiệu chỉnh, dự báo nội mẫu, phần dư và chẩn đoán phần dư.
- Hồi quy tuyến tính đa biến OLS: ma trận nhiều biến độc lập, hệ số, sai số chuẩn, thống kê t, p-value, khoảng tin cậy 95%, R², R² hiệu chỉnh, F và p-value tổng thể; phát hiện ma trận suy biến/đa cộng tuyến hoàn hảo.
- Tương quan Pearson.
- ANOVA một nhân tố: bảng thành phần phương sai và p-value.
- Fisher LSD 0,05: so sánh từng cặp dựa trên MSE và bậc tự do sai số; cảnh báo khi ANOVA tổng thể chưa có ý nghĩa và cảnh báo về sai số đa so sánh.
- ANOVA hai nhân tố có lặp: kiểm định nhân tố A, B và tương tác A×B. Phiên bản này yêu cầu thiết kế cân bằng, đủ mọi tổ hợp và số lần lặp bằng nhau (ít nhất 2).
- Kiểm tra Levene sơ bộ về đồng nhất phương sai.
- Chẩn đoán phần dư: Jarque–Bera xấp xỉ, độ lệch, độ nhọn và Durbin–Watson mô tả.
- Dự báo xu thế tuyến tính cơ bản cho chuỗi số liệu theo thứ tự thời gian.

### Cách dùng
- Mở nút **Data Science** trên thanh công cụ.
- Nhập vùng ô theo cú pháp ví dụ `A2:A20` hoặc ma trận `A2:C20`.
- Hồi quy đa biến: vùng X là ma trận nhiều cột, vùng Y là một cột cùng số dòng.
- LSD/Levene: một vùng mã nghiệm thức và một vùng kết quả tương ứng.
- ANOVA hai nhân tố: ba vùng nhãn A, nhãn B và kết quả Y, mỗi tổ hợp cần cùng số lần lặp.
- Dự báo: vùng một chiều theo thứ tự thời gian, không bỏ trống; chọn số kỳ dự báo.

### Giới hạn và nguyên tắc diễn giải
- Không có Tukey HSD, Dunnett, Scheffé, Games–Howell, hồi quy logistic, hồi quy phi tuyến, mô hình hỗn hợp, ANCOVA, PCA hay chuỗi thời gian mùa vụ trong giai đoạn này; không được xem LSD là thay thế tương đương cho các thủ tục đó.
- ANOVA hai nhân tố chỉ hỗ trợ thiết kế cân bằng có lặp; chưa xử lý thiết kế mất ô, không cân bằng hoặc không lặp.
- Levene hiện dùng độ lệch tuyệt đối quanh trung bình; với dữ liệu nhạy ngoại lệ nên xem thêm Brown–Forsythe quanh trung vị.
- Jarque–Bera trả p-value xấp xỉ; Durbin–Watson là chỉ báo, không có ngưỡng kết luận phổ quát ở đây.
- Hồi quy đa biến dùng phương trình OLS và ma trận phương trình chuẩn; cảnh báo ma trận suy biến nhưng chưa cung cấp VIF/condition index để đánh giá đa cộng tuyến gần hoàn hảo.
- Dự báo xu thế không có mùa vụ, khoảng dự báo, hay biến giải thích ngoại sinh.
- Các phép kiểm định yêu cầu quan sát độc lập và thiết kế thí nghiệm phù hợp. Kết quả p-value không thay thế đánh giá chuyên môn, kiểm tra giả định, ngẫu nhiên hóa và bố trí thí nghiệm. Không suy ra quan hệ nhân quả chỉ từ tương quan/hồi quy.
- Mọi phân tích chỉ đọc dữ liệu bảng tính, không tự ghi kết quả vào ô; không gửi dữ liệu ra ngoài thiết bị.

- So sánh LSD có bổ sung p-value hiệu chỉnh Holm để người dùng tham khảo khi có nhiều cặp; p gốc và p Holm được hiển thị riêng.
- Bổ sung kiểm tra Brown–Forsythe (độ lệch tuyệt đối quanh trung vị) bên cạnh Levene quanh trung bình.
- Biểu đồ cột trung bình từng nghiệm thức kèm thanh ±1 SD; đây là mô tả, không phải khoảng tin cậy.
- Xuất kết quả đang xem thành CSV UTF-8 có BOM để mở thuận tiện bằng bảng tính.


## SGHT Data Science — Giai đoạn 9.1 — 2026-11-19

### Hậu nghiệm và chẩn đoán hồi quy
- Tukey–Kramer HSD: so sánh tất cả cặp trung bình, hỗ trợ cỡ mẫu nhóm không bằng nhau dưới giả định phương sai đồng nhất; trả chênh lệch, q, p đã điều chỉnh theo studentized range và khoảng tin cậy đồng thời.
- Games–Howell: so sánh từng cặp khi phương sai và cỡ mẫu có thể không bằng nhau; dùng sai số chuẩn riêng và bậc tự do Welch–Satterthwaite.
- VIF: hồi quy phụ từng biến X trên các biến X còn lại; báo R² phụ, VIF, ma trận tương quan, trị riêng và chỉ số điều kiện.
- Giao diện: nhập alpha; chạy Tukey/Games–Howell từ vùng mã nhóm và kết quả; chạy VIF từ ma trận X nhiều cột; kết quả có thể xuất CSV qua nút xuất báo cáo.

### Phương pháp số và giới hạn
- Studentized-range CDF/quantile được tính bằng tích phân Simpson số trên phân phối chuẩn và chi-bình phương. Đây là xấp xỉ số, không phải bảng giá trị tới hạn tra cứu; kết quả có thể sai khác nhẹ so với phần mềm thống kê chuyên dụng. Metadata kết quả nêu rõ phương pháp.
- Tukey–Kramer yêu cầu quan sát độc lập, phần dư gần chuẩn và phương sai đồng nhất. Không dùng Tukey khi phương sai khác biệt đáng kể; cân nhắc Games–Howell.
- Games–Howell không giả định phương sai đồng nhất; vẫn yêu cầu thiết kế và quan sát độc lập phù hợp, và phân phối không quá lệch/ngoại lệ chi phối.
- VIF 5 và 10 chỉ là ngưỡng cảnh báo kinh nghiệm. Chỉ số điều kiện là chẩn đoán bổ sung, không tự quyết định loại biến.
- Không diễn giải p-value như xác suất giả thuyết không đúng; không suy ra nhân quả từ so sánh/hồi quy.


## SGHT Data Science — Giai đoạn 9.2 — 2026-11-19

### ANCOVA — phân tích hiệp phương sai
- Nhận cột mã nhóm, biến phụ thuộc Y và một hiệp biến liên tục X; các vùng phải cùng số dòng.
- Ước lượng mô hình OLS có hiệu ứng nhóm và hiệp biến với giả định độ dốc chung.
- Kiểm định hiệu ứng nhóm bằng so sánh mô hình lồng nhau; báo F, p và partial eta-squared.
- Kiểm tra đồng nhất độ dốc bằng mô hình bổ sung tương tác nhóm × hiệp biến.
- Báo trung bình nhóm đã hiệu chỉnh tại trung bình chung của hiệp biến và khoảng tin cậy t 95% (hoặc alpha do người dùng chọn).
- Nếu tương tác nhóm × hiệp biến đáng kể, không diễn giải hiệu ứng nhóm theo mô hình độ dốc chung.

### Kiểm định phi tham số
- Kruskal–Wallis: xử lý đồng hạng bằng hiệu chỉnh tie; báo H, bậc tự do, p xấp xỉ chi-bình phương, thứ hạng trung bình và epsilon-squared.
- Dunn hậu nghiệm: so sánh cặp trên thứ hạng, p xấp xỉ chuẩn và hiệu chỉnh Holm.
- Dunn được hiển thị cùng cảnh báo chỉ nên diễn giải sau kiểm định Kruskal–Wallis tổng thể có ý nghĩa.
- Kruskal–Wallis kiểm tra phân phối/thứ hạng; chỉ diễn giải như khác biệt trung vị khi hình dạng phân phối giữa nhóm tương tự.

### Kích thước hiệu ứng, khoảng tin cậy và công suất
- ANOVA một nhân tố: eta-squared (η²), omega-squared (ω²), Cohen f.
- Khoảng tin cậy t cho trung bình từng nhóm và khoảng tin cậy chênh lệch cặp dựa trên phương sai gộp ANOVA.
- Công suất ANOVA một nhân tố cân bằng: dùng Cohen f, số nhóm, số quan sát mỗi nhóm và alpha; phân phối F không trung tâm tính bằng hỗn hợp Poisson của phân phối F trung tâm.
- Ước tính số lần lặp tối thiểu mỗi nhóm để đạt công suất mục tiêu (mặc định 80%), giới hạn tìm kiếm 500 quan sát/nhóm.

### Giới hạn phương pháp
- ANCOVA hiện hỗ trợ một hiệp biến liên tục và hiệu ứng nhóm một nhân tố; chưa hỗ trợ nhiều hiệp biến, hiệp biến phân loại, thiết kế khối, dữ liệu thiếu hoặc mô hình hỗn hợp.
- ANCOVA cần quan sát độc lập, quan hệ tuyến tính Y–hiệp biến, đồng nhất độ dốc, phương sai phần dư phù hợp và không có điểm ảnh hưởng quá mức. Kiểm định tương tác không có ý nghĩa không chứng minh độ dốc hoàn toàn bằng nhau.
- Kruskal–Wallis/Dunn dùng xấp xỉ tiệm cận; mẫu nhỏ, nhiều đồng hạng hoặc phân phối rất lệch cần đối chiếu phần mềm thống kê chuyên dụng.
- Dunn dùng xấp xỉ chuẩn; không cung cấp khoảng tin cậy phi tham số cho chênh lệch trung vị.
- Khoảng tin cậy chênh lệch trong ANOVA dùng MSE gộp, không phải hiệu chỉnh đồng thời cho mọi cặp; không thay thế Tukey/Games–Howell.
- Công suất chỉ cho ANOVA một nhân tố cân bằng; không dùng cho ANCOVA, thiết kế khối, hai nhân tố hoặc cỡ mẫu không cân bằng. Cohen f phải được xác định trước từ nghiên cứu thí điểm/tài liệu chuyên môn.
- Không dùng công suất hậu nghiệm để “chứng minh” kết quả; ưu tiên lập kế hoạch cỡ mẫu trước thí nghiệm.
- Mọi mô-đun chạy ngoại tuyến, chỉ đọc vùng dữ liệu, không tự sửa ô và không gửi dữ liệu ra ngoài thiết bị.


## SGHT Data Science — Giai đoạn 9.3 · Đáp ứng liều lượng phân bón — 2026-11-19

### Mô hình được bổ sung
- **Bậc hai:** Y = a + bD + cD²; ước lượng cực đại nội tại khi hệ số bậc hai âm, giới hạn điểm ước lượng trong miền liều lượng đã khảo sát.
- **Tuyến tính–bão hòa:** Y = a + b·min(D,k); tìm điểm bắt đầu bão hòa k bằng cách thử các mức liều lượng quan sát ở bên trong miền dữ liệu.
- **Bậc hai–bão hòa:** Y = a + b·min(D,k) + c·min(D,k)²; mô hình liên tục tại điểm gãy và giữ mức dự báo ổn định sau điểm bão hòa.
- **So sánh mô hình:** xếp hạng theo AICc; kèm R², R² hiệu chỉnh, SSE, RMSE, hệ số và liều lượng tối ưu/điểm gãy.
- Giao diện đọc trực tiếp hai vùng ô: liều lượng D và năng suất Y; không tự ghi đè dữ liệu bảng tính.
- Mô-đun độc lập `ai/dose-response.js`, không dùng thư viện thống kê bên ngoài, chạy ngoại tuyến.

### Cách dùng
1. Mở **Data Science**.
2. Nhập vùng liều lượng phân bón (ví dụ `A2:A13`) và vùng năng suất (ví dụ `B2:B13`).
3. Chọn một mô hình để khớp riêng hoặc bấm **So sánh cả 3 mô hình & chọn theo AICc**.
4. Đọc điểm tối ưu/điểm bão hòa cùng R², RMSE và cảnh báo phương pháp.

### Giới hạn cần nhớ
- Cần ít nhất 5 quan sát, 3 mức liều lượng khác nhau và dữ liệu số đầy đủ.
- Điểm gãy của mô hình bão hòa được tìm trên các mức liều lượng đã quan sát, chưa có khoảng tin cậy cho điểm gãy.
- Chưa có Mitscherlich, mô hình phi tuyến tổng quát, bootstrap, khoảng tin cậy cho liều tối ưu, kiểm định lack-of-fit hoặc khoảng dự báo.
- AICc chỉ hỗ trợ so sánh mô hình trên cùng dữ liệu; không chứng minh mô hình đúng. Cần xem đồ thị, phần dư, thiết kế thí nghiệm và cơ chế sinh học.
- Không ngoại suy mức bón vượt miền thí nghiệm; liều tối ưu thống kê không tự động là khuyến cáo nông học hay kinh tế.


## SGHT Data Science — Giai đoạn 9.4 · Mitscherlich và chẩn đoán mô hình — 2026-11-19

### 1. Mô hình Mitscherlich phi tuyến
Bổ sung mô hình đáp ứng tăng dần, lợi ích biên giảm dần:
`Y = A − B·exp(−kD)`
- `A`: tiệm cận năng suất theo mô hình.
- `B`: biên độ chênh lệch giữa tiệm cận và mức dự báo tại liều 0.
- `k`: hệ số hiệu lực/độ cong của đáp ứng.
- Ước lượng tham số bằng tìm kiếm một chiều trên log(k), kết hợp nghiệm bình phương tối thiểu tuyến tính có điều kiện và tinh chỉnh golden-section.
- Báo năng suất nền mô hình, tiệm cận, liều đạt 50% biên độ đáp ứng và đáp ứng biên tại liều 0.
- Báo sai số chuẩn tham số từ xấp xỉ tuyến tính hóa Jacobian và ma trận hiệp phương sai; không coi đó là khoảng tin cậy chính xác trong mẫu nhỏ.
- Mitscherlich không có cực đại hữu hạn: mô hình tiến dần tới tiệm cận. Không được gọi A là liều tối ưu.

### 2. Chẩn đoán sai số và độ phù hợp
- Phân rã tổng SSE thành sai số thuần (pure error) và thiếu phù hợp (lack of fit) khi có các lần lặp tại cùng mức liều.
- Báo số mức liều lặp, SSE và bậc tự do tương ứng.
- Báo trung bình, độ lệch chuẩn, độ lệch (skewness), độ nhọn dư thừa (excess kurtosis) và Durbin–Watson của phần dư.
- Các chỉ báo phần dư không tự động chứng minh giả định đúng; thứ tự quan sát, độc lập, phương sai không đổi và thiết kế thí nghiệm vẫn phải được xem xét.

### 3. So sánh mô hình
- Bảng so sánh 9.3 mở rộng để thử cả Mitscherlich khi nghiệm thỏa điều kiện.
- Sửa số tham số hiệu dụng trong AICc của mô hình điểm gãy: tính thêm tham số điểm gãy đã được ước lượng.
- Không xếp hạng một mô hình không hội tụ như thể đó là mô hình hợp lệ.

### 4. Giới hạn khoa học
- Mitscherlich hiện yêu cầu liều lượng không âm, ít nhất 6 quan sát và ít nhất 4 mức liều khác nhau.
- Sai số chuẩn phi tuyến dùng xấp xỉ Jacobian; chưa có bootstrap tham số, profile likelihood hoặc khoảng tin cậy tin cậy cho tiệm cận và liều.
- Phân rã lack-of-fit hiện báo thống kê F nhưng chưa tính p-value; chỉ có ý nghĩa khi có lặp tại cùng liều và đủ bậc tự do.
- Chưa có mô hình kinh tế tối ưu (giá phân, giá nông sản, chi phí), đáp ứng đa dinh dưỡng, mô hình ngẫu nhiên theo địa điểm/mùa vụ, hoặc mô hình sai số không đồng nhất.
- Không ngoại suy ngoài miền liều thí nghiệm. Mức tối ưu kinh tế cần hàm lợi nhuận biên và giá đầu vào/đầu ra, không thể suy ra từ R² hay AICc.


## SGHT Data Science — Giai đoạn 10 · Mặt đáp ứng hai yếu tố — 2026-11-19

- Thêm mô-đun độc lập ngoại tuyến `ai/response-surface.js` để khớp mô hình bậc hai hai yếu tố: \(Y=b_0+b_1X_1+b_2X_2+b_{11}X_1^2+b_{22}X_2^2+b_{12}X_1X_2\).
- Tự mã hóa hai yếu tố quanh trung điểm và nửa khoảng biến thiên nhằm giảm vấn đề thang đo; báo hệ số theo biến mã hóa cùng thông tin quy đổi.
- Báo R², R² hiệu chỉnh, RMSE, SSE, AICc, phần dư và bậc tự do.
- Giải điểm dừng của mặt bậc hai, phân loại cực đại/cực tiểu/yên ngựa; kiểm tra điểm dừng có nằm trong miền khảo sát hay không.
- Tìm cực đại dự báo có chặn trong hình chữ nhật miền quan sát bằng cách xét điểm dừng hợp lệ, các cạnh, đỉnh và nghiệm cực trị một chiều trên cạnh; không tự chọn nghiệm ngoại suy.
- Sinh lưới dự báo 21×21 để làm nền cho bản đồ đường đồng mức ở bước giao diện kế tiếp.
- Tích hợp vùng nhập X1, X2, Y trong Data Science; phân tích chỉ đọc bảng, không ghi đè dữ liệu gốc.
- Giới hạn: mô hình hiện là mặt đáp ứng bậc hai hai yếu tố, không phải mô hình hỗn hợp; thiết kế suy biến/đa cộng tuyến hoàn hảo bị từ chối. Cần đủ điểm tâm/lặp, xem phần dư, kiểm tra điều kiện thí nghiệm và xác nhận độc lập. Cực đại dự báo không đồng nghĩa tối ưu kinh tế hay khuyến cáo phân bón.
- Kiểm thử: phục hồi mặt bậc hai tổng hợp, cực đại nội miền, cực đại có chặn và từ chối dữ liệu thiếu/thiết kế suy biến.
