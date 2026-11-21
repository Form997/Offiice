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


## SGHT Macro Security & Permission Center — 2026-11-19

- Thêm trung tâm quyền macro tại `automation/macro-security.js`.
- Phân quyền theo nhóm lệnh `SET`, `COPY`, `CLEAR`, `SUM`; nhóm bị khóa sẽ bị chặn trước khi thực thi.
- Xem trước số lệnh, nhóm lệnh, số ô duy nhất và phạm vi ô dự kiến tác động.
- Thiết lập giới hạn theo phiên: tối đa 2.000 lệnh và 10.000 lượt ô; mặc định thận trọng 500 lệnh/5.000 lượt ô.
- Kiểm tra quyền trước từng lệnh, hỗ trợ dừng khẩn cấp và khóa phiên mới cho tới khi người dùng chủ động mở khóa.
- Nhật ký kiểm toán lưu tối đa 500 sự kiện trên localStorage; có phê duyệt, lệnh đã chạy, hoàn tất, dừng và đặt lại khóa.
- Mọi phiên vẫn cần xác nhận trực tiếp; macro lưu/nhập không được tự chạy.
- Giới hạn phạm vi: đây là lớp kiểm soát cho ngôn ngữ macro khai báo hiện có, không phải cơ chế cách ly hệ điều hành hay sandbox JavaScript tùy ý. Không có quyền mạng/tệp/hệ thống để cấp trong phiên bản này.
- Bổ sung kiểm thử chính sách, phê duyệt, giới hạn, dừng khẩn cấp và nhật ký.


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


## SGHT Chart Studio — Giai đoạn 11 · Bộ biểu đồ khoa học — 2026-11-19

- Thêm mô-đun `ai/chart-engine.js` chuẩn hóa dữ liệu cho 7 dạng: biểu đồ đường, phân tán, cột, histogram, box plot, phần dư theo giá trị dự báo và bản đồ nhiệt mặt đáp ứng.
- Histogram hỗ trợ 3–40 khoảng; tổng tần số phải bằng số quan sát hợp lệ.
- Box plot hiển thị Q1, trung vị, Q3, râu theo quy tắc 1,5×IQR và các điểm ngoại lệ Tukey.
- Biểu đồ phần dư đánh dấu đường 0; biểu đồ đường sắp theo X; biểu đồ phân tán giữ nguyên cặp quan sát.
- Bản đồ nhiệt dùng lưới dự báo từ mặt đáp ứng Giai đoạn 10, tô đậm theo mức dự báo; ghi rõ đây là heatmap lưới, chưa phải đường đồng mức nội suy.
- SVG được dựng trực tiếp, không tải thư viện ngoài; co giãn theo chiều rộng màn hình, có nhãn trợ năng. Dữ liệu không gửi ra ngoài.
- Hạn chế: chưa có xuất PNG/SVG riêng, nhiều chuỗi trên cùng biểu đồ, thanh sai số tùy chọn, CI/prediction bands, tương tác zoom/pan, bản đồ đường đồng mức nội suy và biểu đồ 3D.
- Kiểm thử module: dữ liệu đường/phân tán, histogram, box plot/ngoại lệ, phần dư, heatmap và dữ liệu không hợp lệ.


## SGHT Chart Studio — Giai đoạn 12 · Đường đồng mức & độ bất định — 2026-11-19

- Thêm mô-đun ngoại tuyến `ai/chart-uncertainty.js`, không dùng thư viện bên ngoài.
- Đường đồng mức nội suy bằng marching squares từ lưới mặt đáp ứng 21×21 của Giai đoạn 10; người dùng chọn 2–20 mức. Kiểm tra lưới chữ nhật, tọa độ nhất quán và dữ liệu hữu hạn.
- Biểu đồ trung bình theo nhóm với thanh sai số có ba chế độ tách biệt: ±1 SD, ±1 SE và CI 95% cho trung bình. CI dùng xấp xỉ phân vị t theo khai triển Cornish–Fisher; ghi rõ giả định và độ xấp xỉ.
- Hồi quy tuyến tính có dải CI 95% cho trung bình đáp ứng và khoảng dự đoán 95% cho một quan sát cá thể; hai dải được vẽ riêng để tránh đánh đồng.
- Không tự sửa dữ liệu bảng; phân tích và vẽ hoàn toàn trên thiết bị.
- Giới hạn: contour là nội suy tuyến tính từng ô lưới, phụ thuộc độ phân giải lưới; không phải phép đo mới hay bề mặt 3D. Dải hồi quy dựa trên OLS đơn, giả định tuyến tính, độc lập và phương sai phần dư phù hợp. CI nhóm dùng mẫu t độc lập; không thay thế mô hình phân cấp hay hiệu chỉnh đa so sánh.
- Chưa có bootstrap/profile likelihood, nhiều chuỗi trên cùng biểu đồ, xuất ảnh PNG/SVG/PDF, zoom/pan hoặc biểu đồ 3D.
- Kiểm thử riêng: marching squares, lưới lỗi/không biến thiên, phân biệt SD/SE/CI và phân biệt CI đường trung bình với khoảng dự đoán cá thể.


## SGHT Scientific Visualization Pro — Giai đoạn 13 · Xuất biểu đồ — 2026-11-19

### Chức năng mới
- Bổ sung thao tác xuất biểu đồ SVG vector, PNG độ phân giải 2× và in/lưu PDF thông qua hộp thoại in của trình duyệt.
- SVG được sao chép từ biểu đồ hiện hành, giữ nguyên viewBox và nhãn; PNG dựng từ SVG bằng canvas, không cần thư viện ngoài.
- Chế độ in tập trung vào biểu đồ đang hiển thị, ẩn các vùng giao diện khác; người dùng chọn “Save as PDF” trong hộp thoại in nếu trình duyệt/hệ điều hành hỗ trợ.
- Các thao tác xuất chỉ chạy khi người dùng bấm nút; dữ liệu không tải lên máy chủ.
- Không tự lưu tệp xuống một vị trí cố định; trình duyệt quyết định nơi lưu và có thể yêu cầu quyền tải xuống.

### Cách dùng
1. Dựng một biểu đồ trong Data Science → Scientific Visualization Pro.
2. Chọn **Xuất SVG** để lấy ảnh vector có thể phóng to; **Xuất PNG 2×** để dùng trong tài liệu; hoặc **In / lưu PDF** rồi chọn máy in PDF/lưu PDF trong hộp thoại.
3. Nếu PNG không được hỗ trợ do giới hạn trình duyệt, dùng SVG hoặc chức năng in PDF thay thế.

### Giới hạn
- PDF được tạo qua hộp thoại in của trình duyệt, không phải bộ sinh PDF nhúng; bố cục cuối cùng tùy trình duyệt và hệ điều hành.
- PNG dùng canvas và có thể bị chặn bởi chính sách trình duyệt; SVG là lựa chọn vector ưu tiên.
- Chưa có chỉnh sửa màu sắc/trục/chú giải nâng cao, nhiều chuỗi trên cùng đồ thị, zoom/pan, biểu đồ 3D tương tác, mẫu biểu đồ có đồng bộ đa thiết bị.
- Xuất ảnh chỉ bao gồm biểu đồ đang hiển thị; không tự đính kèm dữ liệu gốc hoặc bảng kết quả thống kê.


## SGHT Scientific Visualization Studio — Giai đoạn 14 · Nhiều chuỗi & tương tác biểu đồ — 2026-11-19

### Chức năng mới
- Vẽ từ 2 đến 12 chuỗi Y trên cùng biểu đồ đường hoặc phân tán, dùng chung một vùng X.
- Mỗi chuỗi có tên riêng, màu phân biệt và chú giải tự động; dữ liệu phải có cùng số dòng, không tự nội suy, không tự điền giá trị thiếu.
- Có ô đặt tiêu đề biểu đồ và trường nhập nhanh nhiều vùng Y, phân cách bằng dấu phẩy.
- Tương tác trực tiếp trên vùng SVG: cuộn chuột để phóng to/thu nhỏ, kéo để dịch chuyển, nút khôi phục để trở về toàn cảnh.
- Giữ nguyên xuất SVG, PNG 2× và in/lưu PDF từ Giai đoạn 13; thao tác xử lý hoàn toàn trên thiết bị.

### Cách dùng nhiều chuỗi
1. Chọn **Biểu đồ đường** hoặc **Biểu đồ phân tán**.
2. Nhập X, ví dụ `A2:A20`.
3. Nhập nhiều vùng Y, ví dụ `B2:B20,C2:C20,D2:D20`.
4. Đặt tên chuỗi theo cùng thứ tự, ví dụ `Đối chứng,Nghiệm thức 1,Nghiệm thức 2`.
5. Dựng biểu đồ; cuộn để zoom, kéo để pan, dùng nút khôi phục khi cần.

### Kiểm soát và giới hạn
- Chỉ hỗ trợ 2–12 chuỗi; mọi chuỗi phải cùng số quan sát với X.
- Nhiều chuỗi hiện dùng chung một trục Y. Nếu biến có đơn vị hoặc độ lớn khác nhau, không nên đặt chung trục mà chưa chuẩn hóa hoặc thiết kế trục phụ có kiểm soát.
- Zoom/pan hiện là tương tác trên SVG, không làm thay đổi dữ liệu hay kết quả thống kê; xuất ảnh phản ánh vùng xem hiện tại.
- Chưa có trục Y thứ hai, bộ chỉnh sửa màu/kiểu nét riêng từng chuỗi, mẫu biểu đồ lưu trữ, 3D tương tác, xuất báo cáo nghiên cứu PDF có bố cục nhiều trang.
- Không gọi tính năng 3D là đã hoàn thành; cần mô hình dữ liệu 3D, điều khiển camera và kiểm thử hiệu năng riêng.

### Kiểm thử
- Kiểm tra nhiều chuỗi cùng X, giữ nguyên thứ tự cặp quan sát.
- Từ chối số dòng không khớp và số chuỗi vượt giới hạn.


## SGHT Scientific Chart Professional — Giai đoạn 15 · 2026-11-19

### Chức năng
- Tùy chỉnh màu chuỗi bằng mã HEX và kiểu nét solid/dash/dot cho biểu đồ nhiều chuỗi.
- Hỗ trợ chỉ định một chuỗi Y dùng trục phụ bên phải; các chuỗi còn lại dùng trục trái. Chỉ áp dụng cho biểu đồ đường/phân tán nhiều chuỗi; người dùng phải kiểm tra ý nghĩa đơn vị và tránh gây hiểu nhầm do hai thang đo.
- Lưu, nạp và xóa tối đa 30 mẫu cấu hình biểu đồ trong localStorage. Mẫu chỉ lưu cấu hình, không lưu dữ liệu bảng tính.
- Bổ sung mặt đáp ứng 3D tương tác từ lưới dự báo hai yếu tố đã khớp; kéo chuột để xoay góc nhìn. Đây là phép chiếu phối cảnh SVG ngoại tuyến, không phải WebGL hay mô phỏng vật lý.
- Bổ sung chế độ in báo cáo nghiên cứu nhiều trang từ vùng kết quả Data Science; người dùng chọn lưu PDF trong hộp thoại in của trình duyệt.

### 3D và diễn giải
- Bề mặt 3D biểu diễn giá trị dự báo của mô hình mặt đáp ứng bậc hai; không phải phép đo thực nghiệm ở mọi điểm.
- Lưới phải chữ nhật, hữu hạn, tối đa 101×101; mặt đáp ứng hiện tại dùng lưới 21×21.
- Xoay bằng cách kéo trực tiếp bề mặt. Dữ liệu và mô hình không bị thay đổi.
- Báo cáo PDF dùng engine in của trình duyệt, phân trang tùy thiết bị; không phải bộ sinh PDF nhúng có cam kết dàn trang giống nhau trên mọi máy.

### Mẫu biểu đồ và giới hạn
- Tối đa 30 mẫu, lưu cục bộ; không đồng bộ giữa thiết bị.
- Màu chuỗi nhận mã HEX hợp lệ; kiểu nét nhận solid, dash hoặc dot.
- Trục Y phụ chỉ là trục hiển thị, không chuẩn hóa dữ liệu và không chứng minh hai đại lượng có quan hệ.
- Chưa có WebGL 3D, bề mặt nhiều mô hình, tùy chỉnh nhãn trục đầy đủ, template chia sẻ đám mây hoặc trình biên tập báo cáo kéo-thả.


## SGHT Basic Reliability Review — Giai đoạn 16 — 2026-11-19

- Sửa `MOD` để phần dư mang cùng dấu với số chia, gồm cả trường hợp số chia âm.
- Phát hiện kết quả tràn miền số ở các phép toán nhị phân và trả mã `#NUM!` thay vì hiển thị `Infinity`/`NaN`.
- Giới hạn vùng tham chiếu công thức ở mức 100.000 ô mỗi lần đọc để tránh công thức vô tình quét vùng quá lớn.
- Giữ nguyên khoảng trắng có chủ ý khi nhập văn bản; chỉ xem nội dung toàn khoảng trắng là ô trống.
- Xuất CSV theo giá trị đã tính/hiển thị của ô, không xuất chuỗi công thức thô.
- Đã ghi rõ các phần chưa hoàn thiện: lưới hiện tại 16×40; nhiều trang tính chưa hoạt động; định dạng in đậm/in nghiêng chưa lưu. Không quảng bá các nút này như tính năng đã hoàn tất.


## Giai đoạn 17 — Định dạng ô và thao tác vùng (2026-11-19)

- Định dạng ô lưu cùng workbook: phông chữ, cỡ chữ, đậm/nghiêng, màu chữ, màu nền, căn ngang/dọc, định dạng số (chung, số 2 chữ số, số nguyên, phần trăm, VND) và viền.
- Định dạng áp dụng trên vùng chọn; có thao tác xóa định dạng.
- Chọn vùng bằng kéo chuột hoặc Shift + phím mũi tên; trạng thái vùng và số ô được hiển thị.
- Sao chép/cắt/dán vùng dạng TSV; hỗ trợ nút công cụ, Ctrl/Cmd+C/X/V và dán dữ liệu bảng tính từ ứng dụng khác.
- Undo/Redo ghi nhận cả nội dung và định dạng. Vùng thao tác giới hạn 10.000 ô; dán hiện giới hạn 1.000 hàng × 100 cột.
- Sao chép/dán giữ nguyên chuỗi công thức, chưa tự điều chỉnh tham chiếu tương đối như Excel. Kéo chuột hiện dùng để chọn vùng, chưa triển khai kéo di chuyển hoặc điền chuỗi.


## SGHT Grid Scalability — Giai đoạn 18.1 · Nền móng lưới thưa và cửa sổ ảo — 2026-11-19

- Thêm mô-đun độc lập `engine/sparse-grid.js` cho địa chỉ ô theo chỉ số nguyên an toàn, không đóng khung ở 16 cột × 40 hàng.
- Chuyển đổi nhãn cột theo cơ số 26 (A…Z, AA…AAA…), phân tích địa chỉ hàng/cột lớn và từ chối địa chỉ vượt miền số nguyên an toàn của JavaScript.
- Tính biên dữ liệu thực sự từ các ô có giá trị hoặc định dạng; không tạo ma trận ô rỗng.
- Tính cửa sổ hiển thị ảo theo vị trí cuộn, kích thước viewport và overscan; mô-đun chỉ trả về phạm vi cần dựng, không cấp phát toàn bộ lưới.
- Bổ sung cập nhật sparse map theo copy-on-write để giữ nguyên bản đồ nguồn khi thao tác.
- Kiểm thử địa chỉ lớn, dữ liệu thưa, cửa sổ ảo, biên lưới và tính bất biến.
- **Phạm vi 18.1:** đây là nền móng thuật toán, chưa thay thế renderer 16×40 hiện tại. Chưa công bố lưới vô hạn/ảo hóa đã tích hợp cho giao diện; bước 18.2 sẽ nối cửa sổ ảo vào vùng cuộn, bàn phím, chọn vùng, định dạng, clipboard và hoàn tác.

## Giai đoạn 18.2 — Tích hợp lưới ảo vào giao diện — 2026-11-19

- Kết nối engine/sparse-grid.js với bộ dựng lưới: chỉ dựng các hàng/cột đang nhìn thấy và một dải overscan, không dựng 100.000 ô cùng lúc.
- Mở rộng vùng thao tác giao diện từ 16 cột × 40 hàng lên 100 cột × 1.000 hàng; địa chỉ ô, bàn phím, chọn vùng, công thức, định dạng và clipboard hiện có tiếp tục dùng chung bản đồ dữ liệu thưa.
- Dùng các dải đệm ảo trên/dưới/trái/phải để giữ hình học cuộn; cuộn ngang/dọc sẽ dựng lại đúng cửa sổ hiển thị.
- Chọn ô bằng bàn phím hoặc hộp địa chỉ sẽ tự cuộn ô vào vùng nhìn thấy. Tô chọn chỉ duyệt những ô đang được dựng, tránh lặp qua toàn bộ vùng lớn.
- Dữ liệu và định dạng vẫn lưu theo địa chỉ ô trong localStorage; không chuyển dữ liệu sang ma trận ô rỗng.
- Giới hạn minh bạch của 18.2: giao diện hiện hỗ trợ tối đa 1.000 hàng × 100 cột trong bước này để giữ tương thích với vùng dán hiện hành. Bộ địa chỉ và thuật toán nền có thể biểu diễn tọa độ lớn hơn, nhưng mở rộng động và cuộn phân đoạn vượt giới hạn giao diện sẽ thuộc bước tiếp theo; chưa tuyên bố lưới vô hạn.

## SGHT Dynamic Grid — Giai đoạn 18.3 · Mở rộng lưới theo nhu cầu — 2026-11-19

### Triển khai
- Chuyển kích thước giao diện từ hằng số cố định sang giới hạn logic có thể tăng theo nhu cầu; lưới khởi đầu 100 cột × 1.000 hàng.
- Khi cuộn gần mép dưới hoặc mép phải, SGHT tự tăng kích thước lưới theo từng khối. Việc mở rộng chỉ thay đổi miền địa chỉ và khoảng cuộn; không tạo hàng loạt ô rỗng trong bộ nhớ.
- Khi điều hướng tới địa chỉ lớn, dán vùng hoặc thả vùng dữ liệu, hệ thống mở rộng miền lưới trước khi thực hiện thao tác.
- Giữ renderer ảo hóa: chỉ dựng cửa sổ nhìn thấy và overscan; dữ liệu/định dạng vẫn lưu theo địa chỉ trong sparse maps và localStorage.
- Bổ sung chính sách mở rộng độc lập tại engine/grid-capacity.js cùng kiểm thử giới hạn, mở rộng khối, địa chỉ xa và dữ liệu đầu vào không hợp lệ.

### Giới hạn kỹ thuật được công bố
- Giới hạn logic hiện tại: **100.000 hàng × 16.384 cột** (tối đa 1.638.400.000 vị trí địa chỉ về mặt lý thuyết, không phải số ô được cấp phát).
- Đây là lưới mở rộng động có giới hạn an toàn, **không phải lưới vô hạn**. Trình duyệt vẫn có giới hạn chiều dài cuộn vật lý, bộ nhớ, localStorage và hiệu năng tính toán; cuộn phân đoạn để vượt giới hạn pixel trình duyệt chưa được triển khai.
- Công thức đọc vùng vẫn có giới hạn an toàn riêng 100.000 ô/lần; thao tác vùng/undo và dung lượng lưu trữ cũng có giới hạn riêng.
- Xuất CSV hiện tạo hình chữ nhật từ A1 tới ô có dữ liệu xa nhất; tệp rất thưa nhưng có địa chỉ xa có thể tạo CSV lớn. Cần đánh giá riêng trước khi xuất workbook quy mô lớn.
- Kiểm thử đơn vị chứng minh chính sách mở rộng và giới hạn; chưa thay thế kiểm thử trình duyệt trên nhiều thiết bị hoặc kiểm thử tải quy mô tối đa.


## SGHT View & Freeze Panes — Giai đoạn 18.4 · Ghim vùng hiển thị — 2026-11-19

- Bổ sung cố định đồng thời hàng đầu và cột đầu: người dùng nhập số hàng (0–20) và cột (0–10), sau đó chọn Ghim; 0 nghĩa là không ghim chiều đó.
- Vùng hàng/cột ghim được dựng lại trong renderer ảo hóa khi cuộn xa; phần đệm ảo được tính lại để không nhân đôi địa chỉ và không làm mất hình học cuộn.
- Ô giao giữa hàng ghim và cột ghim có lớp ưu tiên cao nhất; tiêu đề cột và số hàng giữ đúng vị trí khi cuộn ngang/dọc.
- Cấu hình ghim lưu cùng workbook trong localStorage; tải lại trang vẫn giữ cấu hình. Lệnh Bỏ ghim xóa cả hai chiều; tạo bảng mới trở về trạng thái không ghim.
- Ghim thanh ứng dụng, dải thẻ lệnh, thanh công cụ và thanh công thức bằng sticky positioning để giữ thao tác chính trong tầm nhìn khi cuộn trang.
- Không sửa nội dung ô, công thức hay định dạng khi ghim/bỏ ghim. Không thay đổi cấu trúc lưu trữ dữ liệu ô hiện có; thuộc tính freeze là trường bổ sung tương thích ngược.
- Giới hạn có chủ ý: tối đa 20 hàng và 10 cột đầu để tránh che khuất vùng làm việc trên màn hình nhỏ. Đây là cố định từ mép đầu bảng; ghim vùng tùy chọn tại một địa chỉ bất kỳ chưa thuộc bước này.
- Chưa tuyên bố hỗ trợ nhiều vùng ghim độc lập hoặc chia cửa sổ thành nhiều pane có cuộn riêng.


## SGHT Split View — Giai đoạn 18.5 · Chia vùng xem độc lập — 2026-11-19

- Bổ sung hai viewport của cùng một trang tính; cả hai đọc/ghi chung bản đồ ô và định dạng, dùng chung địa chỉ ô, vùng chọn, công thức và trạng thái dữ liệu.
- **Chia ngang:** hai khung trên/dưới có vị trí cuộn dọc độc lập; cuộn ngang được đồng bộ để giữ cùng cột tham chiếu.
- **Chia dọc:** hai khung trái/phải có vị trí cuộn ngang độc lập; cuộn dọc được đồng bộ để giữ cùng hàng tham chiếu.
- Chọn ô ở khung nào cũng cập nhật thanh địa chỉ/công thức và vùng chọn trên cả hai khung. Bàn phím và dán văn bản dạng bảng được hỗ trợ trong khung phụ.
- Cấu hình bật/tắt chia vùng được lưu cùng workbook; bảng mới trở về chế độ một khung. Không nhân đôi dữ liệu ô trong bộ nhớ.
- Giới hạn: 18.5 cung cấp chế độ hai khung (ngang **hoặc** dọc), chưa phải bố cục bốn góc phần tư đồng thời; chưa có kéo thanh chia để đổi tỷ lệ hoặc lưu vị trí cuộn riêng của từng khung. Ghim hàng/cột 18.4 vẫn là cơ chế riêng.
- Kiểm thử: kiểm tra chế độ hợp lệ, chế độ mặc định và đồng bộ trục; cần kiểm thử trình duyệt thực tế trên nhiều kích thước màn hình trước khi coi là kiểm định giao diện hoàn tất.


## SGHT Split View — Giai đoạn 18.6 · Kéo chỉnh và ghi nhớ vùng chia — 2026-11-19

- Thanh phân cách hỗ trợ kéo bằng chuột/cảm ứng; tỷ lệ hai vùng giới hạn 20–80%.
- Có thể điều chỉnh bằng bàn phím khi thanh phân cách được focus: phím mũi tên thay đổi 2%, Home/End đưa về biên 20%/80%.
- Tỷ lệ chia và vị trí cuộn của cả hai khung được lưu trong cấu hình workbook; cấu hình cũ chỉ lưu mode được nâng cấp an toàn với mặc định 50% và vị trí đầu trang.
- Chọn ô trong khung phụ cuộn ô vào tầm nhìn ở chính khung phụ.
- Tự lưu vị trí cuộn có trì hoãn 300 ms để tránh ghi localStorage liên tục trong lúc cuộn.
- Giới hạn: vẫn là hai khung ngang hoặc dọc; chưa hỗ trợ bốn phần tư đồng thời. Tỷ lệ chia giới hạn 20–80%.
- Kiểm thử tự động bao gồm chuẩn hóa cấu hình cũ/mới, giới hạn tỷ lệ, vị trí cuộn, đồng bộ trục và tính tỷ lệ từ con trỏ. Cần xác nhận thao tác thực tế trên trình duyệt/điện thoại trước khi kết luận UX hoàn tất.


## SGHT Four-Quadrant Split — Giai đoạn 18.7 · Chia bốn góc phần tư — 2026-11-19

- Bổ sung chế độ **Bốn góc phần tư**: trên-trái, trên-phải, dưới-trái và dưới-phải cùng hiển thị một trang tính, dùng chung dữ liệu ô, công thức, định dạng và vùng chọn; không nhân bản workbook.
- Bốn viewport có vị trí cuộn độc lập theo trục, với liên kết: trên-trái đồng bộ hàng với trên-phải và đồng bộ cột với dưới-trái; trên-phải đồng bộ cột với dưới-phải; dưới-trái đồng bộ hàng với dưới-phải.
- Trạng thái cuộn bốn khung được lưu trong workbook và khôi phục khi mở lại; cấu hình hai khung cũ vẫn được chuẩn hóa để tương thích.
- Chế độ hai khung ngang/dọc 18.5–18.6 vẫn được giữ.
- Giới hạn: một tỷ lệ chia chung áp dụng cho cả hai trục; thanh giao hiện là chỉ báo bố cục, chưa kéo chỉnh độc lập theo từng trục. Chưa xác minh tương tác thực tế trên trình duyệt/điện thoại. Ghim hàng/cột vẫn là cơ chế riêng.
- Kiểm thử engine bao gồm chuẩn hóa bốn vị trí, đồ thị đồng bộ và các trục độc lập; kiểm thử tự động không thay thế kiểm thử UX trên thiết bị thật.


## SGHT AutoFill — Giai đoạn 18.8 · Kéo thả điền dữ liệu — 2026-11-19

- Thêm nút kéo điền tại góc phải-dưới vùng đang chọn; kéo tới ô đích để mở rộng vùng và thả để điền.
- Hỗ trợ kéo theo bốn hướng trên khung đơn, hai khung và bốn góc phần tư.
- Điền lặp giá trị/văn bản, sao chép định dạng và ngoại suy cấp số cộng khi nguồn là dãy số ít nhất hai phần tử theo một chiều.
- Công thức A1 được dịch tham chiếu tương đối; tham chiếu có dấu $ được giữ cố định theo hàng/cột. Chuỗi trong dấu ngoặc kép không bị sửa.
- Mỗi lần điền là một giao dịch undo duy nhất; vùng đích được chọn và lưu cùng workbook.
- Giới hạn mỗi lần điền: 100.000 ô; vẫn tuân theo giới hạn logic của lưới.
- Chưa nhận diện chuỗi ngày, ngày làm việc, danh sách tùy chỉnh hoặc văn bản có hậu tố số. Chưa kiểm thử kéo cảm ứng trực tiếp trên thiết bị thật.


## SGHT 18.9 — Lịch sử thao tác và tìm kiếm — 2026-11-19

### Hoàn tác / Làm lại
- Chuẩn hóa bản chụp trạng thái dữ liệu và định dạng ô bằng mô-đun độc lập `engine/history.js`.
- Giới hạn lịch sử ở 40 mốc cho mỗi chiều; tự loại mốc cũ khi vượt ngân sách bộ nhớ ước tính 32 MiB (một mốc lớn được giữ riêng để không làm mất khả năng hoàn tác).
- Hoàn tác/Làm lại khôi phục đồng thời nội dung, công thức và định dạng ô; thao tác khôi phục tạo mốc đối ứng để có thể làm lại.
- Nút tự khóa/mở theo trạng thái lịch sử; hỗ trợ Ctrl+Z, Ctrl+Y và Ctrl+Shift+Z.
- Một thao tác đã ghi nhận tạo một mốc; thao tác mới sau khi hoàn tác xóa nhánh Làm lại.
- Lịch sử hiện là bộ nhớ phiên làm việc, chưa lưu xuyên lần tải lại trang; chưa phải lịch sử cộng tác hoặc lịch sử theo từng ô.

### Tìm kiếm
- Tìm theo giá trị hiển thị, nội dung gốc/công thức hoặc cả hai.
- Tùy chọn phân biệt hoa thường và khớp toàn bộ nội dung ô.
- Duyệt kết quả trước/sau, vòng từ cuối về đầu; chọn và cuộn đến ô tìm thấy.
- Tô sáng tất cả kết quả đang hiển thị và làm nổi bật kết quả hiện hành.
- Chỉ duyệt các ô có dữ liệu trong kho thưa (sparse storage), không quét hàng tỷ ô trống của lưới logic.
- Lưu tối đa 10.000 địa chỉ kết quả để điều hướng; nếu có nhiều hơn, giao diện báo kết quả bị giới hạn ở 10.000 địa chỉ đầu.
- Ctrl+F mở tìm kiếm; Enter đi tới kết quả kế tiếp, Shift+Enter về kết quả trước, Esc xóa tìm kiếm.

### Phạm vi chưa bao gồm
- Undo/Redo chưa khôi phục các thiết lập giao diện như chia vùng, ghim hàng/cột, zoom hoặc tên tệp.
- Chưa có lịch sử thao tác sau khi đóng/mở lại trình duyệt, lịch sử cộng tác nhiều người dùng, hoặc tìm kiếm trong nhiều trang tính (SGHT hiện chưa có nhiều trang tính).
- Tìm kiếm theo giá trị hiển thị tính lại công thức khi chạy tìm; kết quả không phải chỉ mục tìm kiếm nền thời gian thực.


## SGHT 18.10 — Lịch sử bền vững và Tìm/Thay thế theo vùng — 2026-11-19

### Lịch sử thao tác
- Lưu ngăn xếp Undo/Redo cùng workbook trong localStorage; khi mở lại cùng workbook trên cùng trình duyệt, người dùng có thể tiếp tục hoàn tác/làm lại các giao dịch đã lưu.
- Giới hạn 40 mốc mỗi chiều và thu gọn tổng lịch sử ở mức ngân sách ước tính 24 MiB để giảm nguy cơ vượt dung lượng lưu trữ trình duyệt.
- Bản ghi cũ không có trường history vẫn được mở như bình thường; lịch sử khởi tạo rỗng.
- Lịch sử không phải bản sao lưu độc lập: nếu người dùng xóa dữ liệu trang web hoặc bộ nhớ trình duyệt bị xóa/hỏng, các mốc cũng mất. Việc ghi lịch sử phụ thuộc khả năng lưu localStorage.

### Tìm / Thay thế
- Bổ sung thay thế một ô hiện hành hoặc thay thế hàng loạt.
- Có thể giới hạn tìm kiếm và thay thế trong hình chữ nhật vùng ô đang chọn; bỏ chọn để thao tác trên toàn bộ các ô có dữ liệu.
- Tìm kiếm tiếp tục hỗ trợ giá trị hiển thị, nội dung gốc/công thức, phân biệt hoa thường và khớp toàn ô.
- Thay thế chỉ tác động nội dung gốc đã lưu trong ô. Không thể thay thế trực tiếp kết quả công thức đã tính; nếu tìm theo giá trị hiển thị, thao tác thay thế bị khóa để tránh sửa sai dữ liệu nguồn.
- Thay thế hàng loạt yêu cầu xác nhận và được ghi thành một giao dịch Undo/Redo duy nhất; định dạng ô được giữ nguyên.
- Chuỗi tìm kiếm được xử lý như văn bản thuần, không diễn giải ký tự đặc biệt thành biểu thức chính quy.

### Giới hạn
- Lịch sử chỉ đi theo workbook đang lưu trên cùng trình duyệt/thiết bị; chưa đồng bộ đám mây, chưa có nhật ký người dùng và chưa có phục hồi theo thời điểm.
- Không hỗ trợ thay thế trong kết quả tính toán của công thức, tên trang tính hoặc metadata.
- Vùng chọn là hình chữ nhật từ ô đầu đến ô cuối; không hỗ trợ nhiều vùng rời rạc trong một lệnh.


## SGHT 18.11 — Quản lý vùng dữ liệu — 2026-11-19

- Sắp xếp hàng trong vùng chữ nhật đang chọn theo một cột khóa: tăng/giảm, kiểu tự nhận diện/văn bản/số; di chuyển đồng bộ nội dung và định dạng của cả hàng trong vùng.
- Lọc tối đa hai điều kiện trên một cột, kết hợp AND/OR; hỗ trợ bằng, khác, chứa, lớn hơn, nhỏ hơn, ô trống và không trống.
- Lọc màu nền theo màu được chọn; có thể kết hợp với điều kiện giá trị.
- Bộ lọc chỉ ẩn hàng khỏi khung hiển thị, không xóa hoặc sửa dữ liệu. Bỏ lọc sẽ hiện lại dữ liệu.
- Loại hàng trùng lặp theo toàn bộ các cột trong vùng chọn, giữ lần xuất hiện đầu tiên; yêu cầu xác nhận và ghi thành một giao dịch Undo.
- Tạo định nghĩa vùng dữ liệu có cấu trúc có tên, hàng tiêu đề và danh sách tên cột; lưu trong workbook cục bộ.
- Giới hạn: vùng cấu trúc hiện là metadata được quản lý trong giao diện, chưa có Table Reference như [@Column] trong công thức, chưa tự mở rộng khi nhập hàng mới, chưa có bộ lọc theo danh sách giá trị riêng lẻ hoặc nhiều cột đồng thời.
- Chưa kiểm thử thao tác trực tiếp trên trình duyệt/điện thoại; kiểm thử engine không thay thế xác nhận UX.


## SGHT 18.12 — Bảng dữ liệu thông minh — 2026-11-19

- Vùng dữ liệu có cấu trúc tự mở rộng khi nhập dữ liệu liền kề ngay dưới hàng cuối và trong phạm vi các cột của bảng; cập nhật phạm vi, metadata và công thức tham chiếu bảng.
- Bộ lọc hỗ trợ điều kiện trên hai cột độc lập, AND/OR, lọc màu và danh sách giá trị duy nhất có thể chọn/bỏ chọn. Danh sách giá trị được nạp theo vùng hiện chọn.
- Tổng hợp theo nhóm: tổng, trung bình, đếm số, nhỏ nhất, lớn nhất. Báo cáo xem trước, không ghi đè dữ liệu nguồn.
- Tham chiếu cột bảng trong công thức: =SUM(TenBang[TenCot]); tham chiếu được chuyển thành vùng địa chỉ thực tại thời điểm tính. Tên bảng/cột phải khớp với định nghĩa vùng. Chưa hỗ trợ tham chiếu hàng hiện tại [@Cot], hàng tổng cộng, hoặc tham chiếu liên bảng trong workbook nhiều sheet.
- Giới hạn tự mở rộng: chỉ nhận dữ liệu ghi liền kề ở hàng ngay sau bảng và trong các cột của bảng; thao tác chèn hàng/cột chưa tự tái cấu trúc metadata.
- Bộ lọc và báo cáo nhóm là chế độ hiển thị; báo cáo tổng hợp chưa được ghi thành vùng ô để tránh ghi đè dữ liệu nguồn.
- Chưa kiểm thử tương tác thủ công trên trình duyệt/điện thoại.


## SGHT Data Tools — Giai đoạn 18.13 — 2026-11-19

- **Tổng phụ nhiều cấp:** nhóm lồng nhau tối đa 5 cấp; sắp xếp nhóm ổn định; tính Tổng, Trung bình, Đếm số, Nhỏ nhất, Lớn nhất. Báo cáo có đường dẫn nhóm, không ghi vào vùng nguồn.
- **Pivot Table:** chọn 1–2 trường hàng trong giao diện (bộ máy hỗ trợ 1–4), một trường cột tùy chọn, trường giá trị và phép tổng hợp; dựng ma trận chéo, tổng hàng và tổng cộng. Kết quả là bản xem trước, không sửa dữ liệu gốc.
- **Bộ lọc mở rộng:** lớn hơn/nhỏ hơn hoặc bằng, khoảng số bao gồm hai đầu, bắt đầu/kết thúc bằng, không chứa; lọc ngày trước/sau/trong khoảng. Ngày nhận ISO `YYYY-MM-DD` và Việt Nam `DD/MM/YYYY`, từ chối ngày không hợp lệ.
- Các bộ lọc tiếp tục kết hợp với AND/OR, danh sách giá trị và màu nền. Lọc không xóa dữ liệu nguồn.
- Bổ sung kiểm thử cho phân cấp nhóm, Pivot Table, khoảng số, điều kiện chuỗi và ngày.
- Giới hạn: Pivot hiện là bản xem trước, chưa có kéo-thả trường, Pivot Chart liên kết tự cập nhật hoặc tổng hợp theo nhiều phép tính cùng lúc; tổng phụ nhiều cấp tối đa 5 cấp.


## SGHT Pivot Table — Giai đoạn 18.14 — 2026-11-19

- **Bộ thiết kế Pivot tương tác:** nạp tên trường từ hàng tiêu đề của vùng chọn; kéo-thả trường vào Hàng, Cột, Giá trị và Bộ lọc. Có thao tác thêm trường bằng chạm để dùng trên điện thoại.
- Hỗ trợ tối đa 4 trường hàng, 1 trường cột, 4 chỉ tiêu giá trị và 4 trường lọc.
- Mỗi chỉ tiêu giá trị có phép tính riêng: Tổng, Trung bình, Đếm, Nhỏ nhất, Lớn nhất.
- Bộ lọc Pivot cho phép chọn nhiều giá trị trên từng trường; bỏ chọn toàn bộ nghĩa là không có dòng nào thỏa bộ lọc.
- **Tự làm mới:** cấu hình Pivot được lưu cùng workbook trên thiết bị; báo cáo được tính lại khi giao diện bảng tính render sau thao tác thay đổi dữ liệu. Thay đổi bố trí và bộ lọc cũng cập nhật báo cáo.
- Engine vẫn hỗ trợ API Pivot cũ để tương thích; bổ sung kiểm thử nhiều chỉ tiêu và lọc trường.
- Giới hạn: một trường cột duy nhất; Pivot chưa có bộ lọc điều kiện số/ngày, chưa có tổng phụ phân cấp trong chính Pivot, chưa có Pivot Chart liên kết. Kết quả là báo cáo hiển thị, chưa ghi thành vùng ô có thể chỉnh sửa.


## SGHT Pivot Chart — Giai đoạn 18.15 · Biểu đồ liên kết — 2026-11-19

- Biểu đồ lấy trực tiếp kết quả Pivot Table hiện hành; không tạo bản sao dữ liệu độc lập. Thay đổi dữ liệu nguồn, trường Hàng/Cột/Giá trị, phép tổng hợp hoặc bộ lọc sẽ dựng lại Pivot và biểu đồ trong cùng chu kỳ render.
- Hỗ trợ biểu đồ cột nhóm, đường nhiều chuỗi và vành khuyên cho một chuỗi không âm. Khi Pivot có trường Cột, mỗi giá trị trường Cột trở thành một chuỗi riêng.
- Có thể chọn chỉ tiêu trong tối đa 4 phép tổng hợp Pivot; loại biểu đồ, chỉ tiêu được chọn được lưu cùng workbook trên thiết bị.
- Biểu đồ giới hạn 24 nhóm đầu để giữ khả năng đọc trên điện thoại; bảng Pivot vẫn giữ toàn bộ nhóm. Trạng thái báo rõ khi biểu đồ bị rút gọn.
- Xuất biểu đồ dạng SVG có thể mở bằng trình duyệt hoặc phần mềm đồ họa; không thay đổi dữ liệu workbook.
- Biểu đồ vành khuyên từ chối giá trị âm, tổng bằng 0 và Pivot có nhiều chuỗi; trong trường hợp đó hãy dùng Cột nhóm hoặc Đường.
- Giới hạn: chưa đồng bộ đám mây, chưa có xuất PNG/PDF hoặc tùy chỉnh sâu màu, trục và nhãn dữ liệu. Chưa thay thế kiểm thử tương tác thực tế trên nhiều thiết bị.
- Engine pivot-chart.js kiểm tra chỉ tiêu, giới hạn nhóm, cấu trúc series và giá trị hữu hạn bằng kiểm thử độc lập.


## SGHT Pivot Chart Studio — Giai đoạn 18.16 · Tùy chỉnh và xuất biểu đồ — 2026-11-20

- Bổ sung tiêu đề biểu đồ, nhãn trục X/Y, bật/tắt chú giải và nhãn số liệu; cấu hình áp dụng trực tiếp lên SVG Pivot Chart đang liên kết với báo cáo.
- Cho phép tùy chỉnh bảng màu tối đa 8 màu HEX, gán tuần tự cho các chuỗi hoặc lát vành khuyên; mã màu không hợp lệ bị từ chối trước khi áp dụng.
- Định dạng số: tự động, số nguyên, 1 hoặc 2 chữ số thập phân và phần trăm. Giá trị gốc của Pivot không bị thay đổi.
- Lưu cấu hình thiết kế cùng workbook trong localStorage trên thiết bị; dữ liệu Pivot vẫn là nguồn duy nhất để dựng biểu đồ.
- Xuất SVG, chuyển SVG sang PNG độ phân giải 2× bằng Canvas; tùy chọn In/Lưu PDF dùng hộp thoại in của trình duyệt (người dùng chọn đích PDF).
- Tương thích cấu hình cũ 18.15: thiếu trường mới sẽ được chuẩn hóa về mặc định; kiểu biểu đồ và chỉ tiêu cũ tiếp tục được giữ.
- Giới hạn: PNG phụ thuộc hỗ trợ Canvas của trình duyệt; PDF phụ thuộc hộp thoại in và trình điều khiển PDF của thiết bị. Trục tự động, không có thang log/đảo trục; màu tùy chỉnh áp dụng tuần tự, chưa hỗ trợ chọn màu riêng từng chuỗi. Chưa kiểm thử thủ công trên thiết bị thật.


## SGHT Chart Manager — Giai đoạn 18.17 · Quản lý nhiều biểu đồ Pivot — 2026-11-20

- Một Pivot có thể quản lý tối đa 20 cấu hình biểu đồ độc lập. Mỗi biểu đồ giữ loại biểu đồ, chỉ tiêu, tiêu đề, nhãn trục, chú giải, nhãn số, định dạng số và bảng màu riêng.
- Thêm biểu đồ mới, chọn biểu đồ đang làm việc, nhân bản cấu hình, đổi tên, xóa (luôn giữ tối thiểu một biểu đồ) và sắp xếp thứ tự lên/xuống.
- Biểu đồ đang chọn được dựng từ Pivot hiện hành; khi dữ liệu nguồn, trường Pivot hoặc bộ lọc thay đổi, biểu đồ đang chọn tự làm mới. Chuyển sang biểu đồ khác nạp cấu hình riêng tương ứng.
- Lưu danh sách biểu đồ và lựa chọn hiện hành cùng workbook trong localStorage. Workbook 18.15/18.16 cũ tự chuyển cấu hình biểu đồ đơn thành biểu đồ đầu tiên, không xóa cấu hình cũ.
- Xóa hoặc nhân bản cấu hình biểu đồ không sửa dữ liệu ô, công thức, định dạng, Undo/Redo hoặc vùng nguồn.
- Giới hạn: các biểu đồ dùng chung một Pivot nguồn; mỗi lần chỉ hiển thị và xuất biểu đồ đang chọn, chưa có bảng điều khiển nhiều biểu đồ cùng lúc hoặc bố cục dashboard kéo-thả. Tối đa 20 biểu đồ trên một Pivot. Chưa kiểm thử thủ công trên thiết bị thật.


## SGHT Dashboard Studio — Giai đoạn 18.18 · 2026-11-20

- Dashboard gồm nhiều thẻ biểu đồ Pivot và KPI; tối đa 24 thẻ. Mỗi thẻ có thể sắp xếp lên/xuống, đổi độ rộng hoặc xóa.
- Biểu đồ hiển thị bản sao SVG của Pivot Chart đang hoạt động; KPI đọc tổng cộng từ chỉ tiêu Pivot. Dashboard làm mới cùng chu kỳ Pivot.
- Lưu/nạp mẫu theo tên, tối đa 30 mẫu; bố cục và mẫu lưu cùng workbook trong localStorage. Workbook cũ được khởi tạo dashboard rỗng.
- Mọi thẻ dùng chung một Pivot nguồn; chưa có nhiều Pivot độc lập, bộ lọc chéo, kéo-thả tự do, resize kéo góc hoặc xuất toàn dashboard PDF/PNG. Chưa kiểm thử thủ công trên trình duyệt/thiết bị thật.


## SGHT Dashboard đa nguồn — Giai đoạn 18.19 · 2026-11-20

- Mỗi thẻ biểu đồ/KPI lưu một bản cấu hình Pivot độc lập (vùng nguồn, trường hàng/cột, tối đa 4 chỉ tiêu và bộ lọc riêng). Thêm thẻ sẽ chụp cấu hình Pivot hiện hành; nút “Lấy Pivot hiện hành” thay nguồn cho riêng thẻ đang chọn.
- Mỗi thẻ được tính lại trực tiếp từ dữ liệu ô hiện hành bằng Pivot engine; biểu đồ và KPI không còn phụ thuộc vào SVG/giá trị tổng của một Pivot hiển thị chung. KPI chọn được chỉ tiêu riêng.
- Bộ lọc dashboard dùng chung theo số cột; lựa chọn được áp dụng cho mọi nguồn Pivot có chứa cột tương ứng. Cấu hình lọc riêng của từng Pivot vẫn được giữ.
- Lưu cấu hình nguồn độc lập và bộ lọc chung cùng workbook/mẫu. Chuẩn hóa dữ liệu cũ 18.18: thẻ cũ không có nguồn hiển thị trạng thái yêu cầu gán Pivot, không tự đoán nguồn dữ liệu.
- Giới hạn: mọi nguồn vẫn lấy từ cùng trang tính hiện hành; bộ lọc liên kết nhận diện trường theo số cột (không theo tên trường), biểu đồ dashboard dùng dạng cột gọn; chưa có nhiều sheet, nguồn ngoài, cross-filter bằng cách bấm trực tiếp cột biểu đồ, hay kéo-thả tự do. Chưa kiểm thử thủ công trên thiết bị thật.


## SGHT Dashboard tương tác nâng cao — Giai đoạn 18.20 · 2026-11-20

- Kéo thả thẻ Dashboard để đổi thứ tự; nút lên/xuống vẫn là phương án bàn phím và cảm ứng thay thế.
- Thẻ dùng tay nắm resize của trình duyệt; kích thước được lưu theo từng thẻ, giới hạn 240–1.400 px và 180–1.000 px.
- Nhấn hoặc dùng Enter/Space trên cột biểu đồ để lọc chéo các thẻ khác có cùng trường và chứa cột đó. Thẻ nguồn được loại khỏi bộ lọc của chính nó; mỗi bộ lọc có nút bỏ lọc. Bộ lọc chung 18.19 vẫn độc lập.
- Xuất PNG toàn Dashboard độ phân giải 2× qua SVG/foreignObject/Canvas; xuất PDF mở hộp thoại in và áp dụng bố cục in riêng.
- Kéo thả dùng chuột/trackpad; điện thoại dùng nút lên/xuống. Resize dựa vào tay nắm gốc của trình duyệt.
- Lọc chéo nhận diện trường theo số cột (như 18.19), không sửa dữ liệu nguồn hay cấu hình Pivot gốc. PNG phụ thuộc hỗ trợ foreignObject/Canvas; PDF phụ thuộc hộp thoại in.
- Cần kiểm thử thủ công trên các trình duyệt/thiết bị mục tiêu trước khi xác nhận UX.



## SGHT Dashboard Studio chuyên nghiệp — Giai đoạn 18.21 · 2026-11-20

- Mỗi thẻ biểu đồ chọn độc lập: cột, thanh ngang, đường, miền, tròn hoặc vành khuyên; giữ cấu hình khi lưu Dashboard/mẫu.
- KPI có phép tổng hợp Pivot, trung bình theo nhóm, nhỏ nhất, lớn nhất và chênh lệch lớn nhất–nhỏ nhất; chọn chỉ tiêu và phép tính riêng từng thẻ.
- Mỗi thẻ lưu chủ đề hiển thị sáng, xanh rừng hoặc tối; có bố cục trình chiếu toàn màn hình và nút thoát.
- Nhiều thẻ nguồn có thể phát sinh bộ lọc chéo độc lập trên cùng một cột; không ghi đè lẫn nhau. Bộ lọc hiện vẫn dựa trên vị trí cột trong cùng trang tính, chưa phải định danh trường xuyên nhiều sheet.
- Sửa hành vi ResizeObserver 18.20: không còn tự ghi kích thước nội dung sau mỗi lần quan sát gây vòng lặp lưu; kích thước tùy chỉnh đã lưu tiếp tục được khôi phục. Thay đổi kích thước thủ công cần kiểm tra lại trên trình duyệt mục tiêu.
- Giới hạn: chưa có bộ lọc ngày chuyên biệt, nhóm thời gian tự động, kéo-thả căn lưới nâng cao, nhiều sheet/nguồn ngoài, lịch sử phiên bản Dashboard hoặc kiểm thử hiệu năng 100.000+ dòng.
- Xuất PDF vẫn dùng hộp thoại in; PNG 2× vẫn tùy thuộc hỗ trợ SVG foreignObject/Canvas của trình duyệt.


## SGHT Workbook đa trang tính — Giai đoạn 18.22 · 2026-11-20

- Một workbook hỗ trợ tối đa 100 trang tính; mỗi trang có ID ổn định, tên riêng, kho ô thưa (sparse cells), định dạng, cấu hình ghim/chia vùng, bảng dữ liệu và Pivot/Chart riêng.
- Có thể thêm trang tính, chuyển qua lại bằng thanh tab, đổi tên trang tính; tên không được trùng. Không cho xóa trang cuối cùng; xóa trang khác cần xác nhận.
- Workbook cũ chỉ có một trang được tự động chuyển thành trang tính đầu tiên; dữ liệu và định dạng cũ được giữ. Mỗi trang lưu độc lập trong cùng bản ghi workbook localStorage.
- Tạo trang tính mới không còn xóa dữ liệu trang hiện hành. Nút “Trang tính mới” thêm trang trắng.
- Nguồn Pivot của từng thẻ Dashboard gắn với ID trang tính; cấu hình cũ không có ID được tự động gắn vào trang đầu tiên của workbook để tránh trỏ nhầm khi mở nhiều trang.
- Giới hạn: lưu cục bộ trên trình duyệt/thiết bị, chưa có đồng bộ đám mây, liên kết công thức giữa trang tính, bảo vệ trang tính, sao chép/di chuyển trang hoặc kiểm thử thủ công đa thiết bị.


## SGHT Formula Engine 18.23 — Tham chiếu chéo trang tính — 2026-11-20

- Nhận diện tham chiếu ô/vùng ở trang khác: `=VatTu!A1`, `=SUM(VatTu!B2:B20)`.
- Hỗ trợ tên trang có dấu, khoảng trắng và dấu nháy đơn: `='Vật tư'!B2`, `='Vật tư O''Brien'!C3`.
- Hỗ trợ địa chỉ tuyệt đối trong tham chiếu chéo; ký hiệu `$` được chuẩn hóa về địa chỉ ô.
- Ứng dụng tra cứu tên trang theo chuẩn hóa NFKC, không phân biệt hoa/thường. Khi đổi tên trang, công thức tham chiếu trong workbook được viết lại sang tên mới; xóa trang nguồn để lại tham chiếu không tồn tại và trả `#REF!`.
- Công thức đọc trực tiếp dữ liệu nguồn hiện hành; phát hiện vòng tham chiếu xuyên trang bằng khóa trang + địa chỉ ô. Giới hạn vùng 100.000 ô mỗi lần đọc.
- Chưa có đồ thị phụ thuộc gia tăng, nên kết quả ở trang đang mở chưa tự làm mới tức thời khi trang nguồn khác thay đổi; chưa hỗ trợ tham chiếu có cấu trúc xuyên trang.
- Kiểm thử parser tham chiếu đơn/vùng, tiếng Việt, dấu nháy đơn, địa chỉ tuyệt đối, lỗi #REF! và tương thích công thức nội trang.


## SGHT 18.24 — Dependency Engine (bộ quản lý phụ thuộc công thức) — 2026-11-20

- Xây dựng đồ thị phụ thuộc công thức toàn workbook, gồm tham chiếu cùng trang, chéo trang và vùng ô.
- Bộ quét bỏ qua chuỗi văn bản; hỗ trợ tên trang tiếng Việt, khoảng trắng, dấu nháy đơn và địa chỉ tuyệt đối.
- Khi sửa, dán, điền, xóa, cắt, di chuyển hoặc chạy macro thay đổi ô, SGHT cập nhật cạnh phụ thuộc của ô bị tác động, tìm toàn bộ phụ thuộc bắc cầu và xóa cache đúng phạm vi.
- Bộ lập lịch Kahn xác định thứ tự topo nguồn → phụ thuộc; Tarjan tách thành viên chu trình thực khỏi các ô phía sau bị chặn.
- Cache kết quả theo khóa trang tính + địa chỉ; kiểm tra vòng lặp trước khi đọc cache.
- Đổi tên, thêm, xóa trang và Undo/Redo dựng lại đồ thị để tránh cạnh cũ.
- Vùng trên 100.000 ô không bị bung thành hàng triệu nút; được ghi nhận là vùng chưa lập chỉ mục.
- Bộ lập lịch hiện cung cấp thứ tự và phạm vi invalidation; chưa triển khai worker nền song song.



## SGHT Calculation Scheduler 18.25 — Điều phối tính toán thông minh — 2026-11-20

- Đưa kế hoạch topo từ Dependency Engine vào hàng đợi tính toán thực thi, thay vì chỉ ghi nhận phạm vi invalidation.
- Ưu tiên công thức thuộc trang tính đang mở; trong đó các ô hiện diện trong vùng lưới đang hiển thị được ưu tiên trước. Công thức ở trang khác vẫn được xử lý sau theo thứ tự phụ thuộc.
- Chia công việc thành từng đợt tối đa 64 công thức, nhường lượt cho trình duyệt giữa các đợt để giảm nguy cơ khóa giao diện khi workbook có nhiều công thức.
- Khi phát sinh lần sửa mới hoặc workbook được nạp/đổi cấu trúc, đợt cũ bị hủy; revision token ngăn kết quả cũ ghi đè tiến trình mới.
- Lỗi ở một công thức được ghi nhận riêng, không làm dừng toàn bộ các công thức còn lại trong hàng đợi. Công thức hiển thị vẫn có thể được tính tức thời theo nhu cầu khi render.
- Hiển thị tiến độ, số công thức đã xử lý/còn lại, số đợt, lỗi và thời gian thực thi ở thanh trạng thái.
- Đây là bộ điều phối chia đợt trên luồng chính bằng lịch nhường lượt của trình duyệt; chưa dùng Web Worker/worker pool, chưa tính song song và chưa có kiểm thử hiệu năng quy mô lớn.



## SGHT 18.26 — Calculation Performance Engine — 2026-11-20

- Thay cache Map không giới hạn bằng FormulaResultCache LRU: khi đạt ngưỡng, mục ít được truy cập gần đây nhất bị loại trước.
- Có hai ngưỡng bảo vệ: tối đa 50.000 kết quả và 16 MiB dung lượng ước tính; một kết quả đơn lẻ vượt ngân sách sẽ không được lưu.
- Các thao tác has/get cập nhật độ gần đây; invalidation chỉ xóa khóa bị ảnh hưởng, còn rebuild workbook giải phóng toàn bộ cache.
- Thu thập số lượt trúng/trượt, ghi cache, eviction, invalidation, mục bị bỏ qua do quá lớn, số mục hiện giữ, dung lượng ước tính và tỷ lệ hit.
- Thanh trạng thái sau đợt tính hiển thị dung lượng cache và tỷ lệ hit để hỗ trợ chẩn đoán hiệu năng.
- Dung lượng là ước tính có tính bảo thủ theo kiểu dữ liệu, không phải số byte heap thực tế do trình duyệt cấp phát; chưa phải profiler bộ nhớ hoặc benchmark hiệu năng đa thiết bị.


## SGHT 18.27 — Formula Diagnostics & Benchmark — 2026-11-20

- Bổ sung bảng chẩn đoán có nút chạy chủ động, chọn quy mô mô phỏng 250 / 1.000 / 2.000 công thức; không tự khởi chạy khi mở workbook.
- Báo cáo tách thời gian dựng Dependency Graph, lập kế hoạch topo, thực thi Calculation Scheduler theo từng đợt và kiểm tra cache LRU; kèm số công thức, cạnh phụ thuộc, số nút bị ảnh hưởng, chu trình, nút bị chặn, lỗi và tỷ lệ cache hit.
- Báo cáo bổ sung ảnh chụp trạng thái workbook đang mở: số trang, công thức, phụ thuộc, vùng chưa lập chỉ mục, kế hoạch gần nhất, scheduler và cache; thao tác chẩn đoán không sửa dữ liệu workbook.
- Bộ benchmark tạo chuỗi công thức mô phỏng xác định, dùng callback số học đơn giản để đo pipeline đồ thị/lập lịch/cache. Đây chưa phải phép đo toàn bộ parser công thức, render giao diện hay tốc độ thiết bị thực tế; không dùng số đo tổng hợp để cam kết tốc độ workbook thực.
- Dung lượng cache vẫn là ước tính của engine, không phải số byte heap trình duyệt. Chưa có profiler theo từng công thức, Web Worker hoặc benchmark đa trình duyệt/thiết bị.
- Có kiểm thử xác định cho tạo dữ liệu mô phỏng, số liệu các giai đoạn, cache và snapshot chẩn đoán.


## SGHT 18.28 — Formula Error Intelligence — 2026-11-20

- Bổ sung bộ phân loại lỗi công thức: #DIV/0!, #VALUE!, #REF!, #NAME?, #NUM!, #PARSE!, #ARGS!, #CYCLE!, #OP! và #CALC!, kèm giải thích nguyên nhân thường gặp và các bước kiểm tra.
- Phân tích ô đang chọn bằng đồ thị phụ thuộc workbook: lần theo các công thức nguồn, ghi nhận lỗi theo từng ô, xác định các nút lỗi gốc có thể quan sát được và đánh dấu thành viên chu trình khi bộ máy tính trả về #CYCLE!.
- Có lệnh quét lỗi toàn workbook theo yêu cầu, giới hạn 5.000 công thức mỗi lượt; báo cáo tổng số lỗi, phân bố theo mã và danh sách tối đa 200 lỗi đầu tiên.
- Các thao tác chỉ đọc nội dung workbook; không tự sửa công thức, giá trị hay định dạng. Việc đánh giá công thức có thể cập nhật cache kết quả nội bộ.
- Truy nguyên là phân tích theo đồ thị tĩnh hiện có; tham chiếu động/chưa lập chỉ mục và lỗi phụ thuộc ngoài đồ thị có thể khiến đường nguyên nhân chưa đầy đủ. “Nguyên nhân gốc” là nút lỗi sâu nhất quan sát được, không phải kết luận chắc chắn về ý định nhập liệu.
- Có giới hạn số nút truy vết và số công thức quét để tránh khóa giao diện trên workbook lớn; chưa có chạy nền Web Worker.


## SGHT 18.29 — Formula Suggestions & Auto-Fix Preview — 2026-11-20

- Bổ sung bộ đề xuất sửa công thức có kiểm soát. Phiên bản này chỉ tự đề xuất đổi tên hàm khi mã lỗi là #NAME? và có đúng một hàm SGHT được hỗ trợ gần tên nhập (khoảng cách chỉnh sửa tối đa 2 ký tự).
- Hiển thị công thức hiện tại và công thức đề xuất; người dùng phải bấm “Thử công thức” để đánh giá bằng Formula Engine trước. Nếu phép thử còn lỗi, nút áp dụng bị khóa.
- Chỉ áp dụng sau khi người dùng xác nhận lần nữa; kiểm tra công thức gốc và trang tính chưa thay đổi để chống áp dụng đề xuất đã cũ. Ghi thay đổi qua luồng setValue/snapshot hiện có, nên có thể Undo/Redo.
- Không tự bọc IFERROR/IF hoặc đoán cách thay mẫu số, dữ liệu hay tham chiếu: các cách sửa đó có thể làm đổi ý nghĩa phép tính. Lỗi chia cho 0, #REF!, #VALUE! và các lỗi chưa có quy tắc an toàn chỉ nhận hướng dẫn kiểm tra, không nhận công thức thay thế giả định.
- Bộ gợi ý là heuristic xác định, chưa gọi mô hình AI và không gửi dữ liệu ra ngoài. Không tự sửa hàng loạt.
- Giới hạn: mới hỗ trợ sửa tên hàm gần giống; chưa có bộ sửa cú pháp tổng quát, sửa tham chiếu, sửa kiểu dữ liệu hoặc AI đề xuất. Kết quả preview dùng dữ liệu workbook hiện tại; trước khi áp dụng SGHT kiểm tra lại ô gốc. Chưa kiểm thử thủ công trên trình duyệt/điện thoại thật.


## SGHT 18.30 — Formula Audit & Repair History — 2026-11-20

- Bổ sung sổ kiểm toán riêng cho luồng sửa công thức: có đề xuất, không có quy tắc sửa an toàn, thử thành công/thất bại, áp dụng, từ chối, đề xuất hết hiệu lực.
- Mỗi sự kiện ghi mã sự kiện, thời điểm ISO, ID/tên trang tính, địa chỉ ô, công thức trước/sau, kết quả thử và ghi chú. Danh sách hiển thị 30 sự kiện mới nhất; dữ liệu lưu tối đa 1.000 sự kiện.
- Nhật ký được lưu trong localStorage bằng khóa riêng, tách khỏi dữ liệu workbook và không bị Undo/Redo của ô xóa theo. Có thể xuất toàn bộ nhật ký đang lưu thành JSON.
- Khi áp dụng công thức, nhật ký ghi lại công thức trước/sau và kết quả preview. Thao tác sửa ô vẫn đi qua setValue và lịch sử Undo/Redo của workbook.
- Giới hạn: nhật ký chỉ nằm trên trình duyệt/thiết bị hiện tại, không đồng bộ đám mây và có thể mất khi xóa dữ liệu trang web. Đây không phải nhật ký chống sửa đổi hay bằng chứng pháp lý; người có quyền truy cập trình duyệt có thể sửa/xóa localStorage. Nếu hết quota, ứng dụng cảnh báo và khuyến nghị xuất JSON. Undo/Redo vẫn được ghi trong lịch sử workbook hiện hữu; nhật ký này chưa đối chiếu tự động từng Undo/Redo với một bản sửa cụ thể.
- Chưa kiểm thử thủ công trên trình duyệt/điện thoại thật.


## SGHT 18.31 — Formula Version Control — 2026-11-20

- Bổ sung lịch sử phiên bản công thức theo từng ô; ghi lại thay đổi khi giá trị trước hoặc sau là công thức, gồm công thức trước/sau, thời điểm, trang tính, địa chỉ và nguồn thao tác.
- Ghi nhận cả trường hợp công thức bị thay bằng hằng số/xóa (mốc sau không còn công thức), nhưng chỉ cho khôi phục trực tiếp các mốc có công thức hợp lệ.
- Xem lịch sử ô đang chọn, so sánh hai phiên bản cùng ô, khôi phục bản cũ qua `setValue`; việc khôi phục tạo mốc phiên bản mới và vẫn có thể Undo/Redo theo lịch sử workbook.
- Lịch sử phiên bản tách riêng khỏi Undo/Redo và Formula Repair Audit; Undo/Redo không xóa các mốc phiên bản đã ghi.
- Giới hạn 50 mốc/ô, 5.000 mốc toàn workbook; có xuất JSON để sao lưu. Lưu localStorage trên thiết bị, không đồng bộ đám mây, không chống sửa đổi; xóa dữ liệu trang web có thể làm mất lịch sử.
- Chỉ ghi thay đổi đi qua `setValue`; các thao tác dán vùng, xóa vùng, điền chuỗi, sắp xếp và một số thao tác hàng loạt hiện chưa được ghi nhận đầy đủ như phiên bản từng ô. Đây là giới hạn cần mở rộng ở giai đoạn kế tiếp.
- Chưa kiểm thử thủ công trên trình duyệt/điện thoại thật.


## SGHT 18.32 — Formula Version Coverage & Integrity — 2026-11-20

- Mở rộng ghi lịch sử phiên bản công thức ra khỏi thao tác sửa đơn ô: dán vùng (clipboard và TSV), điền chuỗi/kéo chốt, xóa vùng, cắt vùng, di chuyển vùng, thay thế một/tất cả, sắp xếp, loại bản ghi trùng và các lệnh SET/CLEAR trong Macro.
- Mỗi thay đổi chỉ được ghi khi công thức trước hoặc sau có dạng công thức và nội dung thực sự thay đổi; công thức bị xóa/thay bằng hằng số vẫn giữ được mốc trước đó.
- Phân loại nguồn thao tác riêng (`paste`, `fill`, `clear`, `cut`, `move`, `replace`, `replace-all`, `sort`, `remove-duplicates`, `macro`...) để thuận tiện truy vết.
- Giữ nguyên cơ chế lưu phiên bản giới hạn 50 mốc/ô và 5.000 mốc/workbook; không sao chép toàn bộ workbook chỉ để tạo nhật ký thay đổi.
- Kiểm thử CI: 239/239 bài hiện có đạt; `node --check sght/app.js` đạt; triển khai GitHub Pages thành công.
- Giới hạn còn lại: lịch sử phiên bản được ghi theo các thao tác đã tích hợp tại giao diện; thao tác Undo/Redo khôi phục workbook chưa tự tạo sự kiện phiên bản ngược/tiến tương ứng. Macro ghi theo từng lệnh SET/CLEAR, vì vậy một phiên chạy có thể tạo nhiều mốc cho cùng ô. Chưa kiểm thử thủ công trên thiết bị thật.


## SGHT 18.33 — Undo/Redo Version Synchronization — 2026-11-20

- Đồng bộ lịch sử phiên bản công thức với cả hai chiều Hoàn tác và Làm lại: sau khi workbook được khôi phục, SGHT so sánh bản đồ ô trước/sau trên trang tính hiện hành.
- Chỉ tạo mốc cho ô có công thức ở ít nhất một phía và nội dung thực sự thay đổi; thay đổi dữ liệu thường không sinh mốc công thức.
- Công thức được khôi phục, bị gỡ hoặc thay đổi do Undo/Redo đều có bản ghi riêng với nguồn `undo` hoặc `redo`; lịch sử cũ không bị viết ngược hay xóa.
- Bổ sung kiểm thử cho hoàn tác công thức, làm lại công thức, xóa/khôi phục công thức, bỏ qua giá trị thường và dữ liệu đầu vào không hợp lệ.
- So sánh được thực hiện trên các ô đã lưu (sparse map), không quét toàn bộ lưới 100.000 × 16.384; chi phí tỷ lệ theo số ô có dữ liệu của trang tính.
- Giới hạn: chỉ đồng bộ các ô của trang tính đang hoạt động trong giao dịch Undo/Redo hiện hữu; lịch sử vẫn lưu localStorage và không chống sửa đổi. Chưa kiểm thử thủ công trên trình duyệt/điện thoại thật.


## SGHT 18.34 — Formula Transaction Grouping — 2026-11-20

- Mỗi mốc Undo của thao tác chỉnh sửa tạo mã giao dịch; các thay đổi công thức được ghi sau mốc đó nhận chung mã.
- Undo và Redo tạo mã giao dịch riêng, giữ lịch sử gốc và phân biệt nguồn thao tác.
- Formula Version Control gom phiên bản theo giao dịch, hiển thị mã, thời điểm, nguồn, số ô và thay đổi trước/sau; bộ đếm phân biệt phiên bản với giao dịch.
- Dữ liệu cũ không có mã giao dịch được giữ nguyên và xem như nhóm đơn lẻ. Giới hạn 50 mốc/ô, 5.000 mốc/workbook; nhóm chỉ gồm các mốc còn lưu. Dữ liệu localStorage, không đồng bộ đám mây, không chống sửa đổi. Một số luồng không gọi snapshot có thể tạo nhóm riêng cho từng mốc. Chưa kiểm thử thủ công trên thiết bị thật.


## SGHT 18.35 — Transaction Restore & Rollback — 2026-11-20

- Bắt đầu phát triển: 20/11/2026; hoàn tất triển khai sau khi CI và GitHub Pages đạt trạng thái thành công.
- Kiểm thử tự động: 251/251 đạt; triển khai GitHub Pages: thành công. Chưa xác nhận kiểm thử thủ công trên trình duyệt/điện thoại thật.
- Quy mô mã nguồn của giai đoạn: 348,3 KiB tổng dung lượng UTF-8 của 5 tệp thay đổi được cập nhật (ước tính theo tổng dung lượng UTF-8 của các tệp thay đổi; không phải dung lượng bộ nhớ khi chạy).
- Bổ sung danh sách giao dịch lịch sử trên toàn workbook; chọn một giao dịch để xem các ô bị ảnh hưởng và giá trị trước/sau.
- Bản xem trước kiểm tra đồng thời từng ô với trạng thái sau giao dịch đã ghi. Nếu có xung đột, thiếu trang tính, địa chỉ trùng hoặc dữ liệu đã thay đổi, toàn bộ thao tác bị chặn; không khôi phục một phần.
- Khi hợp lệ, người dùng xác nhận một lần; SGHT tạo đúng một snapshot Undo, đảo ngược các ô trong giao dịch, ghi các mốc phiên bản nguồn `transaction-rollback`, dựng lại dependency engine và lưu workbook.
- Từ giai đoạn này, mỗi phiên bản mới lưu thêm giá trị thô trước/sau, kể cả khi một phía là hằng số hoặc ô trống. Nhờ đó rollback không nhầm hằng số cũ thành ô trống.
- Các mốc lịch sử cũ vốn chỉ lưu công thức trước/sau không có đủ dữ liệu để phục hồi chính xác hằng số; giao dịch cũ chỉ được khôi phục nếu kiểm tra được trạng thái an toàn. Không tự suy đoán dữ liệu đã mất.
- Giới hạn: rollback chỉ áp dụng cho giao dịch thuộc một trang tính và trang đó phải đang hoạt động; lịch sử vẫn lưu localStorage, không đồng bộ đám mây và không chống sửa đổi. Cần kiểm thử thủ công trên trình duyệt/điện thoại thật.


## SGHT 18.36 — Transaction Audit & Integrity — 2026-11-20

- Bổ sung mô-đun kiểm định chỉ đọc `sght/engine/formula-version-integrity.js`; không ghi lại, chuẩn hóa hay sửa lịch sử gốc trong lúc kiểm tra.
- Kiểm tra cấu trúc bản ghi, trường bắt buộc, timestamp, mã phiên bản trùng, transactionId thiếu, giao dịch trộn trang tính/nguồn, ô lặp trong một giao dịch, cặp formula/value không khớp, bản ghi legacy thiếu giá trị thô và điểm nối chuỗi giá trị của cùng ô.
- Phân loại phát hiện thành lỗi và cảnh báo; giới hạn phần hiển thị 250 phát hiện đầu, báo cáo JSON giữ toàn bộ kết quả đã kiểm tra.
- Đọc trực tiếp dữ liệu JSON gốc trong localStorage để phát hiện các bản ghi mà bước normalize thông thường có thể loại bỏ; dữ liệu nguồn không bị thay đổi.
- Xuất báo cáo JSON có schema, thời điểm kiểm tra, số lượng bản ghi/giao dịch/ô, trạng thái và danh sách phát hiện.
- Giới hạn quan trọng: đây là kiểm tra nhất quán nội bộ, không phải chữ ký số hoặc chuỗi hash neo tin cậy. Người có quyền sửa localStorage vẫn có thể thay lịch sử và báo cáo; không thể chứng minh lịch sử chưa từng bị sửa nếu không có bản sao/điểm neo bên ngoài. Bản ghi legacy có thể phát sinh cảnh báo do thiếu dữ liệu thô.
- Kiểm định tự động và triển khai được ghi nhận theo kết quả CI sau commit; chưa tuyên bố kiểm thử thủ công trên thiết bị thật.


## SGHT 18.37 — Immutable Audit Archive — 2026-11-20

- Bổ sung mô-đun `sght/engine/formula-audit-archive.js` tạo kho lưu trữ kiểm toán theo chuỗi SHA-256.
- Mỗi checkpoint đóng gói lịch sử phiên bản, số bản ghi, báo cáo kiểm định, thời điểm, số thứ tự, hash payload, hash gói và hash của checkpoint trước; checkpoint đầu tiên dùng mốc `GENESIS`.
- Có thao tác tạo checkpoint, xác minh toàn chuỗi, xuất gói JSON và nhập gói JSON. Nhập chỉ chấp nhận chuỗi hợp lệ có phần đầu trùng kho hiện tại và có checkpoint mới nối tiếp; từ chối chuỗi bị sửa, nhánh khác, bản nhập cũ hoặc không có phần mở rộng.
- Kho được lưu riêng trong localStorage dưới khóa `haidat-sght-formula-audit-archive-v1`; dữ liệu workbook và lịch sử công thức không bị thay thế khi nhập.
- SHA-256 phát hiện thay đổi so với hash đã lưu/đối chiếu; nó không chứng minh nguồn gốc nếu kẻ sửa dữ liệu có thể thay cả payload lẫn hash. Muốn có bằng chứng mạnh hơn cần giữ tệp xuất ngoài thiết bị, ký số hoặc neo hash lên dịch vụ tin cậy độc lập. Không tuyên bố localStorage là bất biến hay chống giả mạo.
- Web Crypto yêu cầu môi trường hỗ trợ `crypto.subtle` (thông thường HTTPS/localhost); nếu không khả dụng, thao tác hash báo lỗi rõ ràng.
- Kiểm thử tự động: 283/283 đạt; GitHub Pages triển khai thành công. Chưa tuyên bố kiểm thử thủ công trên thiết bị thật.
- Bắt đầu phát triển và phát hành: 20/11/2026. Mã nguồn và tài liệu cập nhật trong giai đoạn: khoảng 350 KiB UTF-8 (ước tính theo 5 tệp chính; không phải mức RAM khi chạy).

## SGHT 18.38 — Digital Signature & Trusted Anchor — 2026-11-20

- Bổ sung `sght/engine/formula-audit-signature.js`: chữ ký số ECDSA P-256/SHA-256 cho hash đầu chuỗi archive, số checkpoint, thời điểm ký và fingerprint khóa công khai.
- Tạo cặp khóa; xuất khóa riêng đã mã hóa bằng PBKDF2-SHA-256 (310.000 vòng) + AES-256-GCM; nạp lại khóa bằng mật khẩu. Khóa riêng chỉ nằm trong bộ nhớ phiên làm việc sau khi nạp, không ghi vào localStorage.
- Gói chữ ký mang theo archive, khóa công khai, fingerprint và chữ ký; có thể xuất/nhập để xác minh độc lập.
- Phân biệt rõ chữ ký hợp lệ với danh tính đã tin cậy. Nếu không cung cấp fingerprint đã xác minh qua kênh độc lập, kết quả là `valid-untrusted-key`; không tự tuyên bố người ký là ai.
- Trust anchor hiện là fingerprint công khai được người dùng đối chiếu thủ công và lưu ngoài hệ thống. Chưa có máy chủ, tổ chức chứng thực, HSM, timestamp authority hay cơ chế thu hồi khóa.
- Giới hạn: ECDSA/Web Crypto cần trình duyệt hỗ trợ; mất khóa riêng/mật khẩu không thể khôi phục. Chưa kiểm thử thủ công trên thiết bị thật.
- Kiểm thử tự động: 307/307 đạt; GitHub Pages triển khai thành công (20/11/2026).
- Commit hoàn tất: `9e2a3f908151e9bae025436a11345a30ad9f3984`. Mã nguồn, kiểm thử, giao diện và tài liệu: khoảng 365 KiB UTF-8 (ước tính; không phải RAM khi chạy).

## SGHT 18.39 — Trusted Identity Registry & Key Lifecycle — 2026-11-20

- Bổ sung `sght/engine/identity-registry.js`: sổ danh tính, khóa công khai, fingerprint SHA-256, trạng thái pending/active/rotated/revoked/expired và nhật ký sự kiện.
- Danh tính mới mặc định pending; phê duyệt đòi hỏi mã người phê duyệt khác người được duyệt và ghi căn cứ xác minh. Chỉ danh tính active mới được đăng ký khóa.
- Quản lý vòng đời khóa: đăng ký, đặt hạn, tự đánh dấu hết hạn, thay thế khóa (giữ khóa cũ ở trạng thái rotated), thu hồi và tra cứu hiệu lực.
- Xuất/nhập sổ JSON có kiểm tra cấu trúc, mã trùng, fingerprint, tham chiếu danh tính và sự kiện.
- Giao diện cho thao tác danh tính, phê duyệt, khóa, thay thế/thu hồi và kiểm tra fingerprint.
- Giới hạn bảo mật: sổ hiện lưu localStorage, nhật ký append-only theo quy ước ứng dụng nhưng không chống sửa bởi người có quyền sửa localStorage. Mã người thao tác là nhãn khai báo, chưa được xác thực. Chưa có tài khoản, MFA, SSO, CA, máy chủ tập trung, chữ ký quản trị trên registry hay đồng bộ đa thiết bị. Chưa dùng sổ này để tự động phê duyệt chữ ký archive; bước tích hợp đó cần một trust store đã được xác thực.
- Khi phát hiện sổ localStorage sai cấu trúc/JSON hỏng, giao diện khóa thao tác ghi để tránh vô tình ghi đè; người dùng phải nhập bản sao hợp lệ.
- Kiểm thử tự động: 312/312 đạt; GitHub Pages triển khai thành công. Chưa kiểm thử thủ công trên thiết bị thật.
- Commit triển khai chức năng: `4b11754a9ee8fbc4447a2ee8021c34cc4ab07466`. Cập nhật mã nguồn, giao diện, kiểm thử và tài liệu khoảng 390 KiB UTF-8 (ước tính).

## SGHT 18.40 — Multi-user Authentication & RBAC Foundation — 2026-11-20

- Bổ sung `sght/engine/auth-rbac.js`: mô hình vai trò admin, signer, auditor, viewer và quyền tách nhỏ cho workbook, công thức, macro, ký số, kiểm toán, quản lý danh tính/tài khoản.
- Tạo tài khoản đầu tiên theo quy trình bootstrap quản trị; tài khoản tiếp theo cần phiên quản trị có quyền `users.manage`. Có đăng nhập/đăng xuất, đổi vai trò, khóa/mở tài khoản và xuất nhật ký.
- Mật khẩu không lưu dạng rõ: dùng PBKDF2-SHA-256, salt ngẫu nhiên 16 byte, 310.000 vòng, kết quả 256 bit.
- Bổ sung giao diện thử nghiệm tài khoản và phân quyền trong khu vực quản trị SGHT.
- Giới hạn bắt buộc: đây là prototype chạy hoàn toàn trong trình duyệt, tài khoản và verifier nằm trong localStorage; người dùng có quyền sửa dữ liệu phía máy khách có thể giả mạo role/session hoặc gọi trực tiếp hàm giao diện. Session không được máy chủ ký/xác thực. Chưa có backend, rate limit, MFA, xác minh email, phục hồi mật khẩu, SSO, đồng bộ thiết bị hay kiểm soát truy cập phía máy chủ. Không được dùng làm ranh giới bảo mật production. Các hàm nghiệp vụ của workbook chưa được khóa toàn diện theo phiên đăng nhập; engine cung cấp policy core để tích hợp ở các giai đoạn kế tiếp.
- Chưa được tuyên bố là bảo vệ workbook thật hoặc chữ ký có giá trị pháp lý.

## SGHT 18.41 — Server-Side Authorization & Secure Session API Contract — 2026-11-20

- Added `sght/engine/auth-api-client.js`: HTTPS-only production endpoint validation, cookie-based requests with `credentials: include`, CSRF token acquisition/header, session lookup, login/logout, admin user management and audit API calls. No bearer token or role is persisted in localStorage.
- Replaced the 18.40 localStorage-based login UI path with a server API client. With no configured API URL, sign-in and account management fail closed and display that the backend is not configured. The browser no longer treats its locally stored role as an authenticated session.
- Added `sght/server/README.md` specifying endpoints, server-side RBAC matrix, HttpOnly/Secure/SameSite cookie expectations, CSRF, CORS, rate limits, session revocation, persistence model, first-admin bootstrap and security integration test gate.
- Important: GitHub Pages is static hosting. No backend, database, real server session, or server-enforced workbook authorization is deployed by this release. The API URL remains intentionally empty. This release is a secure client/contract foundation only; it must not be represented as production authentication. Existing 18.40 local account records are not migrated or trusted.
- Automated tests validate client fail-closed behavior, HTTPS URL policy, CSRF flow, cookie credentials, malformed sessions and API errors. No manual browser/device test or live backend integration test is claimed.


## SGHT 18.42 — Gia cố vòng đời phiên API — 2026-11-20

- Gia cố `engine/auth-api-client.js`: allowlist tuyến API/phương thức HTTP, thời hạn yêu cầu mặc định 15 giây (có thể cấu hình 1–60 giây), AbortSignal, không cache, không theo redirect.
- Gom các yêu cầu lấy CSRF đồng thời; token chỉ tồn tại trong bộ nhớ và bị xóa khi gặp 401 hoặc đăng xuất.
- Chỉ thử lại đúng một lần khi máy chủ trả 403 với mã `CSRF_INVALID` hoặc `CSRF_EXPIRED`. Hợp đồng máy chủ bắt buộc xác thực CSRF trước khi thực hiện thay đổi; tuyệt đối không thử lại lỗi 403 chung.
- Kiểm tra vai trò trả về thuộc danh mục SGHT và từ chối tài khoản đã khóa. Đây chỉ là kiểm tra cấu trúc/giao diện, không thay thế phân quyền phía máy chủ.
- Chuẩn hóa lỗi mạng/hết thời gian, không đưa chi tiết lỗi vận chuyển thô ra giao diện.
- Bổ sung kiểm thử cho allowlist, CSRF refresh, 401, 403, tài khoản khóa, phản hồi sai cấu trúc và lỗi mạng.
- **Giới hạn:** chưa có backend thật, database, session store hoặc kiểm thử tích hợp trực tiếp. GitHub Pages vẫn là frontend tĩnh; URL API vẫn để trống và đăng nhập vẫn khóa. Chưa được xem là xác thực đa người dùng dùng trong sản xuất.


## SGHT 18.43 — Dựng nền máy chủ xác thực — 2026-11-20

- Bổ sung backend Node.js 22+ và PostgreSQL trong `sght/server/`: HTTP API, schema cơ sở dữ liệu, lệnh chạy dịch vụ và bootstrap quản trị viên một lần.
- API hiện có các tuyến CSRF, đăng nhập, truy vấn phiên, đăng xuất, tạo lời mời, danh sách/cập nhật tài khoản và đọc nhật ký kiểm toán.
- Phiên dùng cookie HttpOnly/Secure/SameSite; chỉ lưu SHA-256 digest của session ID. Mật khẩu bootstrap dùng scrypt với salt ngẫu nhiên. Thay đổi vai trò/trạng thái thu hồi phiên đang hoạt động và ghi audit trong transaction; bảo vệ quản trị viên hoạt động cuối cùng.
- Bổ sung kiểm tra Origin cho yêu cầu thay đổi và giới hạn đăng nhập cơ bản theo tiến trình; CI kiểm tra cú pháp các entrypoint backend.
- **Chưa triển khai:** GitHub Pages vẫn chỉ phục vụ frontend; chưa có dịch vụ API công khai, database production hay cấu hình URL API. Chưa có kiểm thử tích hợp PostgreSQL.
- **Giới hạn an ninh:** chưa phải dịch vụ danh tính production. Còn thiếu Argon2id, MFA, xác minh email, đặt lại mật khẩu, hoàn tất lời mời, giới hạn tốc độ phân tán, CSRF gắn phiên, quản lý phiên/refresh, và phân quyền server-side cho dữ liệu workbook, macro, công thức, chữ ký, xuất tệp. Phải qua kiểm tra bảo mật độc lập trước khi mở truy cập.


## SGHT 18.44 — Account Lifecycle & Session Management — 2026-11-20

- Hoàn thiện các tuyến backend cho nhận lời mời, đặt lại mật khẩu và quản lý phiên: token ngẫu nhiên dùng một lần, chỉ lưu SHA-256, có hạn dùng và tiêu thụ trong transaction; đổi mật khẩu thu hồi toàn bộ phiên đang hoạt động.
- Người dùng chỉ xem và thu hồi phiên thuộc chính tài khoản của mình; API dùng UUID công khai riêng, không trả session cookie ID hoặc digest nội bộ.
- Ghi audit cho chấp nhận lời mời và đặt lại mật khẩu; phản hồi yêu cầu reset dùng thông điệp chung để tránh dò tài khoản.
- Bổ sung migration SQL tương thích cơ sở dữ liệu đã tạo theo schema 18.43; thêm bảng reset token và mã phiên công khai.
- **Cổng gửi token:** chưa tích hợp email/SMS. Lời mời bị chặn bằng 503 trong cấu hình thường; chỉ môi trường phát triển có thể bật SGHT_TOKEN_DELIVERY_MODE=development để nhận token thử nghiệm. Tuyệt đối không bật chế độ này trên máy chủ công khai. Yêu cầu reset production chưa gửi thư nên chưa thể tự phục vụ người dùng.
- **Giới hạn:** backend chưa triển khai, chưa có kiểm thử PostgreSQL end-to-end; còn scrypt thay vì Argon2id, rate limit chỉ trong tiến trình, chưa MFA/email verification. Chưa bảo vệ dữ liệu workbook, công thức, macro, chữ ký hoặc export bằng authorization phía máy chủ. Không tuyên bố production-ready.
- Kiểm thử tự động GitHub Actions: 330/330 đạt, 0 lỗi (run 44683437824); triển khai GitHub Pages: thành công (run 44683437891). Đây là kiểm thử tự động của bộ SGHT hiện có, chưa phải kiểm thử tích hợp PostgreSQL cho các endpoint lifecycle.
- Chưa kiểm thử thủ công trên trình duyệt/điện thoại thật.


## SGHT 18.45 — Email Verification & Secure Token Delivery — 2026-11-20

- Bổ sung sght/server/mailer.mjs dùng Nodemailer, SMTP TLS/STARTTLS, giới hạn TLS 1.2; xác minh kết nối SMTP lúc khởi động. Không lưu thông tin SMTP trong mã nguồn; cấu hình bằng biến môi trường và secret manager.
- Lời mời tài khoản và liên kết đặt lại mật khẩu được gửi qua email. API không còn trả token thô; chỉ lưu SHA-256, token ngẫu nhiên dùng một lần và có hạn 24 giờ (lời mời) hoặc 30 phút (xác minh/reset).
- Bổ sung xác minh email: tài khoản mời được xác minh khi người nhận hoàn tất lời mời; tài khoản cũ chưa xác minh có thể yêu cầu thư xác minh. Đăng nhập bị từ chối đến khi email được xác minh. Tài khoản quản trị bootstrap được đánh dấu đã xác minh do tạo qua quy trình vận hành riêng.
- Liên kết email mang token trong URL fragment (#invite=, #verify=, #reset=), tránh đưa token vào query, HTTP request ban đầu hoặc Referer. Client API có các phương thức cho lời mời, xác minh email, reset mật khẩu và thu hồi phiên.
- Thêm bảng sght_email_verifications, migration cột email_verified_at, kiểm thử mailer và CI.
- Giới hạn: backend/API/SMTP chưa được triển khai; chưa gửi email thật, chưa kiểm thử PostgreSQL end-to-end. UI SGHT chưa có màn hình xử lý đầy đủ các fragment invitation/verification/reset. Cần cấu hình SMTP, SPF/DKIM/DMARC, HTTPS, secrets manager và đánh giá an ninh độc lập. Rate limit vẫn theo tiến trình; scrypt chưa thay bằng Argon2id. Không tuyên bố production-ready.
- Kiểm thử GitHub Actions: 331/331 bài SGHT đạt; 3/3 kiểm thử mailer đạt; 0 lỗi (run 44684329701). GitHub Pages triển khai thành công (run 44684329678).
- Bắt đầu và phát triển: 20/11/2026. Chưa kiểm thử thủ công trên trình duyệt/điện thoại thật.

## SGHT 18.46 — Account Lifecycle UI & Secure Email Landing — 2026-11-20

- Nối giao diện SGHT với các API lifecycle đã có ở 18.45: hoàn tất lời mời, xác minh email, yêu cầu gửi lại thư xác minh, yêu cầu đặt lại mật khẩu và hoàn tất đặt lại mật khẩu.
- Đọc đúng fragment `#invite=`, `#verify=`, `#reset=`; chỉ chấp nhận một khóa hành động và token URL-safe có độ dài hợp lệ. Sau khi đọc, giao diện lập tức xóa fragment bằng `history.replaceState`, giữ nguyên đường dẫn/query; token chỉ nằm trong bộ nhớ trang, không đưa vào localStorage, sessionStorage hoặc nội dung DOM.
- Màn hình thiết lập mật khẩu có xác nhận hai lần nhập và kiểm tra độ dài 12–256 ký tự phù hợp với API hiện tại. Lời mời hoàn tất sẽ yêu cầu người dùng đăng nhập; đặt lại mật khẩu thông báo các phiên cũ đã bị máy chủ thu hồi.
- Bổ sung xem các phiên đang hoạt động và thu hồi từng phiên; thu hồi phiên hiện tại yêu cầu xác nhận và làm mới trạng thái đăng nhập.
- Giao diện co giãn cho điện thoại, dùng textContent/DOM API để hiển thị dữ liệu phiên, không nội suy HTML từ phản hồi máy chủ.
- Bổ sung kiểm thử độc lập cho fragment parsing, xóa URL, loại token sai/đa khóa và quy tắc độ dài mật khẩu.
- Giới hạn: GitHub Pages vẫn là frontend tĩnh. Chưa cấu hình URL API, chưa triển khai PostgreSQL/SMTP, chưa thể gửi email hoặc xác nhận quy trình end-to-end thật. CORS, cookie cross-site, HTTPS, SMTP, SPF/DKIM/DMARC và bảo vệ dữ liệu workbook vẫn phải được cấu hình/kiểm định trước khi mở cho người dùng.
- Kiểm thử cục bộ riêng cho mô-đun fragment: 4/4 đạt (Node.js v22.16.0), gồm token mời/xác minh/reset, fragment sai/đa khóa, xóa URL và giới hạn mật khẩu. Đã kiểm tra cú pháp app.js và account-lifecycle.js bằng bộ phân tích JavaScript; cả hai đạt. Chưa chạy toàn bộ bộ test của repository hoặc xác nhận trạng thái GitHub Actions/Pages trong lần cập nhật này; chưa kiểm thử thủ công trên điện thoại hoặc trình duyệt thật.
- Bắt đầu và phát triển: 20/11/2026.

## SGHT 18.47 — Session Security & Device Management — 2026-11-20

- Nâng cấp quản lý phiên phía máy chủ: lưu User-Agent đã làm sạch (tối đa 500 ký tự) để phân loại thiết bị/trình duyệt; không lưu địa chỉ IP thô. Danh sách phiên trả nhãn thiết bị, thời điểm tạo, hoạt động gần nhất, hạn tuyệt đối và trạng thái phiên hiện tại.
- Áp dụng chính sách hết phiên khi không hoạt động 30 phút; phiên vẫn có hạn tuyệt đối 8 giờ kể từ lúc đăng nhập. Máy chủ kiểm tra idle timeout trên yêu cầu đã xác thực, thu hồi phiên quá hạn và cập nhật last_seen_at có giới hạn tần suất (tối đa một lần mỗi phút).
- Bổ sung cảnh báo heuristic khi User-Agent hiện tại khác User-Agent lúc đăng nhập. Đây chỉ là tín hiệu cần kiểm tra (trình duyệt cập nhật hoặc thay đổi cấu hình có thể tạo cảnh báo giả); không dùng User-Agent làm yếu tố xác thực và không tự động khóa tài khoản.
- Gia cố CSRF theo phiên: khi có phiên hợp lệ, hash CSRF cookie phải khớp digest gắn với phiên trong database. Tuyến cấp CSRF đồng bộ digest mới cho phiên hiện hành; luồng trước đăng nhập vẫn dùng double-submit cookie + kiểm tra Origin.
- Migration schema cộng thêm cột user_agent theo cách tương thích, không xóa dữ liệu phiên hiện có. Giao diện hiển thị tên thiết bị, thời điểm, hạn phiên, cảnh báo thay đổi trình duyệt và chính sách 30 phút/8 giờ.
- Bổ sung mô-đun thuần sght/server/session-security.js và kiểm thử cho chuẩn hóa User-Agent, nhận diện trình duyệt/nền tảng, idle timeout và cảnh báo thay đổi User-Agent.
- Giới hạn: User-Agent có thể giả mạo, không xác định chắc chắn thiết bị vật lý hoặc danh tính người dùng. Chưa có MFA, quản lý thiết bị tin cậy, thông báo đăng nhập qua email, phát hiện vị trí/IP bất thường, giới hạn tốc độ phân tán, Argon2id hoặc kiểm thử PostgreSQL end-to-end. Chính sách idle cần được kiểm chứng cùng môi trường triển khai; không tuyên bố dịch vụ xác thực production-ready.
- Kiểm thử tự động: chờ GitHub Actions xác nhận sau commit. Chưa kiểm thử thủ công trên trình duyệt/điện thoại thật hoặc tích hợp PostgreSQL thật.
- Bắt đầu và phát triển: 20/11/2026.

## SGHT 18.48 — MFA / TOTP và mã khôi phục — 2026-11-20

- Bổ sung TOTP theo RFC 6238 (HMAC-SHA1, 6 chữ số, chu kỳ 30 giây, cửa sổ lệch đồng hồ ±1 bước) tương thích ứng dụng xác thực phổ biến. Người dùng đăng nhập bằng mật khẩu trước; tài khoản đã bật MFA phải hoàn tất bước mã thứ hai mới được phát cookie phiên.
- Luồng thiết lập yêu cầu phiên đã xác thực + CSRF, tạo bí mật chờ xác minh có hạn 10 phút. Bí mật được mã hóa AES-256-GCM trước khi ghi PostgreSQL; API chỉ trả khóa và URI otpauth trong phản hồi thiết lập, không ghi khóa vào nhật ký ứng dụng.
- Chống phát lại TOTP bằng last_used_step được khóa/đọc-cập nhật trong transaction. Challenge đăng nhập ngẫu nhiên, chỉ lưu SHA-256 digest, hết hạn sau 5 phút, chỉ dùng một lần; thử mã được giới hạn tốc độ trong tiến trình.
- Tạo 10 mã khôi phục ngẫu nhiên khi bật MFA; database chỉ lưu digest, mỗi mã chỉ dùng một lần. Cho phép dùng mã khôi phục để đăng nhập hoặc tắt MFA sau khi nhập lại mật khẩu. Việc tắt MFA thu hồi mã khôi phục và challenge còn hiệu lực.
- Giao diện có thiết lập MFA, nhập mã xác nhận, hiển thị mã khôi phục đúng một lần, bước xác minh bổ sung khi đăng nhập và luồng tắt MFA có xác minh lại.
- Migration cộng thêm ba bảng: sght_user_mfa, sght_mfa_challenges, sght_mfa_recovery_codes; không xóa bảng/dữ liệu hiện có. Cần đặt bí mật môi trường SGHT_MFA_ENCRYPTION_KEY tối thiểu 32 byte ngẫu nhiên trong secret manager backend. Mất khóa này sẽ khiến bí mật MFA hiện hữu không giải mã được; phải sao lưu và luân chuyển khóa theo quy trình quản trị được kiểm soát.
- Giới hạn: chưa có QR code hiển thị trong giao diện, MFA chưa được áp dụng bắt buộc mặc định cho mọi tài khoản, chưa có WebAuthn/passkeys, thiết bị tin cậy hoặc rate limiter phân tán. TOTP phụ thuộc đồng hồ hệ thống; cần NTP. Chưa có PostgreSQL end-to-end, SMTP hoặc kiểm thử trình duyệt/điện thoại thật.
- Backend vẫn chưa được triển khai; GitHub Pages chỉ lưu giao diện tĩnh. MFA chỉ hoạt động sau khi triển khai API HTTPS, chạy schema.sql và cấu hình SGHT_MFA_ENCRYPTION_KEY. Không coi tính năng đã sẵn sàng production trước kiểm thử bảo mật độc lập.
- Kiểm định CI ngày 20/11/2026: `npm test` đạt 349/349; kiểm thử SMTP 3/3; các bước kiểm tra cú pháp đạt. GitHub Pages deployment của bản giao diện 18.48 hoàn tất thành công. Chưa chạy PostgreSQL end-to-end, chưa kiểm thử API thật hoặc thiết bị xác thực vật lý.
- Kích thước 12 tệp mã nguồn, giao diện, migration, kiểm thử và tài liệu của 18.48 tại lần thống kê: khoảng 552.504 byte (539,55 KiB; 4.420.032 bit). Đây là tổng dung lượng nội dung tệp, không phải RAM khi chạy.
- Bắt đầu và phát triển: 20/11/2026.


## SGHT 18.49 — WebAuthn / Passkeys — 2026-11-20

- Bổ sung Passkey/WebAuthn làm yếu tố thứ hai sau mật khẩu, song song TOTP và mã khôi phục. Không tự ý chuyển tài khoản sang passwordless.
- Backend dùng thư viện `@simplewebauthn/server` 14.1.x để tạo tùy chọn và xác minh attestation/assertion; không tự viết thuật toán xác minh chữ ký WebAuthn.
- Ràng buộc RP ID với đúng hostname của `SGHT_ALLOWED_ORIGIN`; kiểm tra origin, RP ID, challenge, thời hạn, user verification bắt buộc và credential thuộc đúng tài khoản. Challenge chỉ dùng một lần, hết hạn sau 5 phút.
- Lưu credential ID, public key, signature counter, transports, loại thiết bị và trạng thái backup; không lưu private key. Cập nhật counter sau xác thực thành công và khóa credential row trong transaction.
- Thêm giao diện đăng ký Passkey trên thiết bị và dùng Passkey ở bước MFA đăng nhập; TOTP/mã khôi phục vẫn là đường dự phòng.
- Migration bổ sung `sght_passkeys` và `sght_webauthn_challenges`, không xóa dữ liệu cũ.
- Cấu hình backend bắt buộc: `SGHT_WEBAUTHN_RP_ID` phải trùng hostname của `SGHT_ALLOWED_ORIGIN`; chỉ triển khai trên HTTPS (ngoại lệ secure context localhost khi phát triển). Trình duyệt/thiết bị phải hỗ trợ WebAuthn và có authenticator phù hợp.
- Việc đăng ký Passkey yêu cầu nhập lại mật khẩu và một mã TOTP mới chưa dùng; máy chủ cập nhật bộ đếm TOTP trong cùng transaction. Đăng ký bị khóa nếu tài khoản chưa bật TOTP MFA; điều này giữ đúng vai trò Passkey là yếu tố thứ hai trong giai đoạn này. Challenge cũ được vô hiệu khi tạo challenge mới cùng mục đích.
- Ở lần triển khai đầu của 18.49, giao diện mới có đăng ký và liệt kê Passkey; phần quản trị khóa được bổ sung ở mục tiếp nối bên dưới. Chưa có passwordless/discoverable login, chưa có kiểm thử PostgreSQL end-to-end hoặc thiết bị sinh trắc học thật. Backend vẫn chưa triển khai; GitHub Pages chỉ là frontend tĩnh. Chưa tuyên bố production-ready.
- Kiểm thử mới kiểm tra chuyển đổi dữ liệu WebAuthn phía trình duyệt; kiểm tra xác minh thực tế phụ thuộc backend có cài thư viện, PostgreSQL, HTTPS và cấu hình RP ID. Không coi kiểm tra cú pháp là kiểm thử xác thực Passkey thật.
- Bắt đầu và phát triển: 20/11/2026.

- Tiếp nối 18.49: quản trị danh sách Passkey — đặt tên/đổi tên và thu hồi từng khóa. Thu hồi yêu cầu nhập lại mật khẩu hợp lệ (12–256 ký tự) cùng mã TOTP 6 số mới chưa sử dụng; máy chủ giới hạn số lần thử, cập nhật bộ đếm TOTP trong cùng transaction và ghi audit event. API chỉ cho phép thao tác trên credential thuộc tài khoản hiện tại. CSDL có cột `display_name` kèm ALTER TABLE idempotent để nâng cấp cơ sở dữ liệu đã có bảng Passkey. Bổ sung kiểm thử client cho PATCH/DELETE và CSRF.
- Đăng nhập passwordless chưa bật: giai đoạn này giữ Passkey là yếu tố thứ hai sau mật khẩu, tránh thay đổi mô hình xác thực khi chưa có quy trình discoverable-credential, account recovery và chống dò tài khoản được kiểm định.

- Dung lượng mã nguồn 18.49: `583991` byte UTF-8 trên 14 tệp thay đổi (đo theo snapshot nhánh phát triển; gồm cả workflow, mã nguồn, kiểm thử và tài liệu). CI workflow: chưa có trạng thái kiểm thử được xác nhận trong lần rà soát này; không đánh dấu đạt.


## SGHT 18.50 — Gia cố phát hiện bất thường bộ đếm WebAuthn — 2026-11-20

- Bổ sung chính sách kiểm tra signature counter độc lập tại `server/passkey-security.js`. Nếu authenticator cung cấp bộ đếm khác 0 nhưng giá trị mới không tăng so với giá trị đã lưu, máy chủ chặn lần đăng nhập Passkey đó như một tín hiệu nghi ngờ sao chép/nhân bản credential.
- Khi phát hiện bất thường, transaction tiêu thụ challenge MFA và WebAuthn, ghi audit event `auth.passkey_counter_anomaly` (credential ID cùng hai giá trị counter), sau đó từ chối phát hành phiên. Người dùng có thể quay về TOTP hoặc mã khôi phục để đăng nhập và rà soát khóa xác thực.
- Không đánh dấu bất thường khi bộ đếm cũ hoặc mới bằng 0; nhiều authenticator đồng bộ/passkey đa thiết bị không cung cấp bộ đếm có ý nghĩa. Đây là tín hiệu phát hiện rủi ro, không phải bằng chứng tuyệt đối rằng khóa đã bị sao chép.
- Bổ sung kiểm thử cho bộ đếm bằng 0, bộ đếm tăng hợp lệ, bộ đếm không tăng/giảm và dữ liệu counter sai kiểu/ngoài miền. Đưa bộ kiểm thử mới vào lệnh `npm test` của backend.
- Giới hạn: chưa chạy PostgreSQL end-to-end, chưa thử authenticator vật lý/đồng bộ đa thiết bị, chưa triển khai backend và chưa có kiểm toán bảo mật độc lập. Chính sách counter không thay thế rate limiting phân tán, quy trình khôi phục tài khoản hay giám sát vận hành.
- Kiểm thử CI ngày 20/11/2026: workflow `SGHT authentication and spreadsheet QA` thành công, gồm `auth-api-package-check` và `browser-and-engine-tests`; workflow `SGHT Formula Engine Tests` thành công. Các bước cài dependency backend, `npm test`, kiểm tra cú pháp và test SGHT đều đạt.
- GitHub Pages deployment ngày 20/11/2026 thành công (run 44724574139). Đây chỉ là triển khai frontend tĩnh; backend Node/PostgreSQL vẫn chưa được triển khai.
- Dung lượng snapshot của 6 tệp liên quan sau cập nhật: 196.775 byte UTF-8 (192,16 KiB; 1.574.200 bit). Đây là tổng dung lượng nội dung hiện tại của các tệp, không phải số byte tăng thêm của commit.
- Bắt đầu và phát triển: 20/11/2026.


## SGHT 19 — Gia cố quy trình khôi phục tài khoản — 2026-11-20

- Sửa lỗi tuyến yêu cầu đặt lại mật khẩu: trước đây tuyến đọc biến `email` nhưng không tự đọc/chuẩn hóa nội dung JSON của yêu cầu. Nay máy chủ kiểm tra Origin/CSRF, đọc body, chuẩn hóa email và chỉ truy vấn theo email hợp lệ.
- Áp dụng giới hạn 5 yêu cầu đặt lại mật khẩu mỗi email trong 60 giây (bộ đếm trong tiến trình). Phản hồi vẫn đồng nhất, không tiết lộ email có tài khoản hay không. Email xác minh cũng dùng chung hàm chuẩn hóa và giới hạn 5 yêu cầu/phút.
- Khi đặt lại mật khẩu thành công, transaction thu hồi mọi phiên hiện hành, tiêu thụ các challenge MFA và WebAuthn còn mở, tiêu thụ các token đặt lại mật khẩu còn hiệu lực và ghi audit event. TOTP và Passkey đã đăng ký vẫn được giữ làm yếu tố xác thực; chỉ challenge đang chờ bị vô hiệu.
- Thêm mô-đun chuẩn hóa email khôi phục và unit tests cho email hợp lệ, sai định dạng, sai kiểu và vượt độ dài; đưa bộ test vào `npm test` của backend.
- Giới hạn: rate limiter hiện vẫn lưu trong bộ nhớ từng tiến trình, không chia sẻ giữa nhiều instance và có thể mất khi khởi động lại. Trước khi mở dịch vụ công khai cần rate limiter phân tán, giám sát, kiểm thử PostgreSQL end-to-end, kiểm tra gửi email thật và rà soát bảo mật độc lập.
- Kiểm thử CI và Pages: chờ workflow của commit 19 xác nhận; không đánh dấu đạt trước khi có kết quả.
- Bắt đầu: 20/11/2026.


## SGHT B5 — Đại tu giao diện, lớp nền không gian làm việc — 2026-11-21

- Bắt đầu triển khai đại tu giao diện trên nhánh `v1-development`, theo kết quả kiểm kê B1, bản đồ điều khiển B2 và ma trận hồi quy B4.
- Bước B5.1 chỉ thay đổi lớp CSS: chuẩn hóa bảng màu và bề mặt làm việc; làm rõ phân cấp thanh đầu trang, thông tin workbook, tab trang tính, ribbon, thanh công cụ, formula bar và vùng lưới; tăng độ rõ của focus bàn phím, trạng thái nút bị khóa và thao tác cảm ứng.
- Bổ sung bố cục thích ứng cho desktop, tablet và điện thoại; ưu tiên vùng lưới làm trung tâm, thanh ribbon có thể cuộn, thanh tab/formula dễ tiếp cận trên màn hình nhỏ và giảm chuyển động khi người dùng bật tùy chọn reduced motion.
- Không thay đổi HTML, JavaScript, engine tính toán, cấu trúc workbook, dữ liệu, API hay schema. Không xóa chức năng và không thay đổi hợp đồng sự kiện.
- Kiểm tra sau ghi: xác nhận tệp CSS được lưu trên nhánh phát triển và xác nhận HTML/JS giữ nguyên blob SHA. Chưa chạy Chrome, Android, kiểm thử thị giác, đo RAM hoặc kiểm thử hồi quy; chưa tuyên bố giao diện đã nghiệm thu.
- Dung lượng `sght/style.css`: trước B5 51,369 byte UTF-8; sau B5 58,046 byte UTF-8; tăng 6,677 byte (6.52 KiB; 53,416 bit). Số liệu tính từ nội dung tệp được GitHub trả về, không phải tổng dung lượng repository.
- Trạng thái triển khai: chưa xác nhận Pages deployment cho commit B5. `main` không được sửa hoặc hợp nhất.
- Bắt đầu và phát triển: 21/11/2026.


## SGHT B5.2 — Tổ chức lại Ribbon và điều hướng công cụ — 2026-11-21

- Điều chỉnh thanh Ribbon theo nhóm công cụ: vùng bảng tạm, định dạng, hàm nhanh, thu phóng, ghim và chia vùng có ranh giới thị giác rõ hơn; cuộn ngang có kiểm soát trên màn hình hẹp.
- Điều hướng tab được nối với các không gian công cụ hiện có: Dữ liệu, Dashboard, Data Science, AI Intelligence và Macro Studio. Khi chuyển tab, các bảng công cụ khác được ẩn để tránh chồng lấp; nút đóng đưa người dùng về Trang chủ.
- Các tab Chèn, Công thức, Xem và Tệp vẫn là nhóm điều hướng/nhãn trạng thái; chưa tuyên bố có bảng lệnh riêng vì HTML hiện tại chưa có các panel tương ứng. Không tạo nút giả hoặc hành vi giả.
- Giữ nguyên ID của các nút và vùng giao diện; không thay đổi công thức, dữ liệu workbook, lưu trữ, API hay schema. Đây là tái tổ chức điều hướng và trình bày, chưa phải nghiệm thu toàn bộ tính năng.
- Kiểm tra tĩnh: cập nhật app.js và style.css; cần chạy trình duyệt để xác nhận tương tác thực tế, đặc biệt chuyển tab, đóng panel, cuộn Ribbon, bố cục tablet/điện thoại. Chưa chạy Chrome/Android, kiểm thử hồi quy hoặc đo RAM; chưa xác nhận triển khai Pages.
- Không sửa hoặc hợp nhất vào main.
- Bắt đầu: 21/11/2026.

## SGHT B5.3 — Đại tu vùng bảng tính và vùng chọn — 2026-11-21

- Thanh địa chỉ ô được chuyển thành ô nhập thực sự: nhập địa chỉ như D25, nhấn Enter để điều hướng; Escape khôi phục địa chỉ đang chọn. Địa chỉ sai hoặc vượt giới hạn sẽ bị từ chối, không sửa dữ liệu.
- Thanh công thức được phân cấp rõ: hộp địa chỉ, ký hiệu fx, vùng nhập công thức và nút áp dụng; tối ưu kích thước chạm trên điện thoại.
- Tiêu đề hàng/cột được gắn chỉ dấu vùng đang chọn; làm rõ hàng/cột hiện hành, ô đơn và vùng nhiều ô. Tinh chỉnh lưới, đường viền, vùng chọn, kết quả tìm kiếm và tay nắm điền dữ liệu.
- Tinh chỉnh khung bảng, thanh trang tính và thanh trạng thái; giữ cơ chế cuộn ảo, lưới thưa, ghim/chia khung hiện có.
- Không thay đổi công thức, lưu trữ, cấu trúc workbook, dữ liệu, clipboard engine, sparse-grid engine hoặc fill-series engine. Không chuyển đổi dữ liệu cũ.
- Kiểm tra tĩnh sau ghi: xác minh HTML/JS/CSS và README trên nhánh phát triển; chưa chạy trình duyệt, thao tác chuột/chạm thực tế, kiểm thử hồi quy hoặc đo RAM. Chưa xác nhận triển khai GitHub Pages.
- Không sửa hoặc hợp nhất vào main.
- Bắt đầu: 21/11/2026.

## SGHT B5.4 — Đại tu thao tác tương tác trên lưới — 2026-11-21

- Cải thiện chọn vùng bằng cảm ứng và bút: khi kéo qua các ô, ứng dụng nhận diện ô dưới tọa độ con trỏ và mở rộng vùng chọn; thao tác chuột kéo vùng đã chọn vẫn giữ đường đi riêng để không phá hành vi di chuyển vùng hiện có.
- Bổ sung điều hướng bàn phím: Home/End tới đầu/cuối hàng, Ctrl/Cmd+Home về A1, Ctrl/Cmd+End tới vùng dữ liệu cuối, PageUp/PageDown theo chiều cao vùng nhìn thấy; giữ Shift để mở rộng vùng chọn.
- Điều chỉnh focus: chọn ô không tự đẩy con trỏ vào thanh công thức nữa; sau khi lưới cập nhật, focus quay về ô đang chọn để phím điều hướng tiếp tục hoạt động tự nhiên.
- Cải thiện vùng chạm, trạng thái focus, ngăn bôi đen văn bản ngoài ý muốn và giữ tay nắm điền có vùng tương tác riêng.
- Giữ nguyên engine, dữ liệu, cấu trúc workbook, cơ chế lưu, clipboard, fill-series, lưới thưa, cuộn ảo, freeze/split và tính năng B5.1–B5.3.
- Kiểm tra tĩnh sau ghi: tải lại các tệp để xác minh; phân tích cú pháp JavaScript thành công sau khi tách các dòng import ES module; xác nhận các đường xử lý gốc và các engine không đổi. Chưa chạy Chrome/Android hoặc kiểm thử tương tác thật. Chưa xác nhận triển khai GitHub Pages.
- Không sửa hoặc hợp nhất vào main.
- Bắt đầu: 21/11/2026.


## SGHT B5.5.1 — Nền tảng hình học lưới biến thiên — 2026-11-21

- Thêm mô-đun độc lập `engine/grid-geometry.js` để tính chiều cao từng hàng và độ rộng từng cột theo chỉ số 1-based; mặc định vẫn là 32 px/hàng và 108 px/cột, giữ nguyên hình học hiện hành khi chưa có tùy chỉnh.
- Lưu ngoại lệ theo bản đồ thưa `rowHeights` và `columnWidths`, không cấp phát mảng cho 100.000 hàng hoặc 16.384 cột. Có hàm lấy kích thước, tính offset, tính tổng vùng, tìm hàng/cột từ tọa độ pixel, đặt lại kích thước mặc định và tuần tự hóa metadata gọn.
- Giới hạn kích thước: hàng 20–240 px, cột 40–500 px; trục lưới tối đa 100.000 hàng và 16.384 cột. Dữ liệu override sai định dạng/vượt giới hạn bị bỏ qua khi chuẩn hóa; yêu cầu resize trực tiếp ngoài giới hạn bị từ chối.
- Thêm kiểm thử đơn vị cho kích thước mặc định, offset biến thiên, tổng vùng, tra ngược tọa độ, reset, giới hạn và lưu trữ thưa. Đưa kiểm tra cú pháp mô-đun mới vào script `npm test`; test file mới tự được nhận bởi glob `sght/tests/*.test.mjs`.
- Đây mới là nền tảng tính toán độc lập. Chưa nối vào `app.js`, dựng DOM, virtual scrolling, freeze/split, workbook persistence hoặc undo/redo; chưa có tay nắm kéo trong giao diện. Không tuyên bố resize đã hoạt động ở giao diện.
- Không sửa engine công thức, sparse cell storage, dữ liệu ô, công thức, clipboard hoặc lịch sử workbook hiện hành. Không sửa `main`.
- Kiểm thử: đã bổ sung bộ test nhưng chưa chạy Node/npm trong môi trường thực thi; cần CI xác nhận. Chưa kiểm thử trình duyệt/Android, hiệu năng trên thiết bị 4 GB RAM hoặc triển khai GitHub Pages.
- Bắt đầu và phát triển: 21/11/2026.


## SGHT B5.5.2 — Tích hợp hình học biến thiên vào lưới ảo và khung ghim — 2026-11-21

- Nối mô-đun `grid-geometry.js` vào bộ tính cửa sổ ảo: vùng nhìn thấy, overscan, offset đầu/cuối và khoảng đệm bên phải/bên dưới nay được tính theo kích thước từng hàng/cột, không còn giả định mọi trục đều có cùng số pixel.
- Tích hợp vào bộ dựng lưới: tiêu đề cột, ô dữ liệu, hàng ghim và cột ghim dùng đúng độ rộng/chiều cao riêng; tọa độ điều hướng tới ô cũng quy đổi theo hình học thực tế.
- Freeze panes tính tổng kích thước vùng ghim theo từng hàng/cột. Split dọc/ngang và bốn góc tiếp tục dùng chung tọa độ cuộn; các ngưỡng mở rộng vùng lưới dùng kích thước cơ sở thay vì số pixel cố định.
- Lưu metadata hình học theo từng trang tính trong workbook. Workbook cũ không có trường này được chuẩn hóa thành hình học mặc định; dữ liệu ô, định dạng, công thức và lịch sử hiện hữu không bị chuyển đổi.
- Bổ sung chỉ mục tiền tố thưa cho offset để truy vấn tổng kích thước không phải quét lại toàn bộ override ở mỗi bước tìm kiếm. Không tạo mảng theo số hàng/cột; chỉ mục chỉ tỷ lệ theo số hàng/cột có tùy chỉnh.
- Bổ sung kiểm thử cho virtual window với kích thước không đồng đều, freeze panes có hàng/cột tùy chỉnh và metadata hình học riêng theo sheet.
- Phạm vi chưa làm trong B5.5.2: chưa có tay nắm kéo đổi cỡ ở tiêu đề hàng/cột, chưa có hộp thoại nhập kích thước, chưa có kéo chọn nhiều hàng/cột để đổi cỡ, chưa có Undo/Redo cho thao tác đổi cỡ. Những phần đó thuộc các bước B5.5 tiếp theo.
- Bảo toàn engine công thức, sparse cell storage, clipboard, fill-series, dữ liệu và định dạng workbook; thay đổi ở lớp bố cục lưới, virtual scrolling, freeze/split và metadata hình học.
- Kiểm tra hiện tại: đã rà soát lại nội dung các tệp và blob SHA sau ghi; đã bổ sung test nhưng chưa chạy `npm test` trong môi trường Node và chưa có CI status xác nhận cho commit này. Chưa kiểm thử Chrome/Android, thao tác split/freeze thực tế, hiệu năng trên thiết bị 4 GB RAM hoặc GitHub Pages deployment.
- Nhánh phát triển: `v1-development`. Không sửa hoặc hợp nhất vào `main`.
- Bắt đầu và phát triển: 21/11/2026.


## SGHT B5.5.3 — Tay nắm kéo đổi kích thước hàng và cột — 2026-11-21

- Thêm tay nắm kéo ở mép phải tiêu đề cột và mép dưới tiêu đề hàng; thao tác hoạt động trong các pane chính, Split và bốn góc phần tư.
- Trong lúc kéo, hiển thị đường căn và nhãn kích thước dự kiến theo pixel; chỉ ghi kích thước mới khi thả chuột/bút/ngón tay. Hủy pointer không ghi thay đổi.
- Hỗ trợ chuột, bút, cảm ứng qua Pointer Events; vùng chạm được nới rộng trên thiết bị không có hover.
- Hỗ trợ bàn phím: mũi tên thay đổi 5 px, Shift + mũi tên thay đổi 20 px; Home khôi phục kích thước mặc định. Tay nắm có nhãn truy cập và trạng thái focus.
- Kích thước bị giới hạn theo quy chuẩn B5.5.1: hàng 20–240 px, cột 40–500 px. Thay đổi chỉ cập nhật metadata hình học của sheet, lưu cục bộ qua workbook; không chạm dữ liệu ô hay công thức.
- Chưa có Undo/Redo cho thay đổi kích thước; chưa có chọn nhiều hàng/cột để đổi đồng loạt; chưa có nhập kích thước chính xác bằng hộp thoại. Các mục này cần bước riêng.
- Kiểm tra trong lượt này: kiểm tra cấu trúc và nội dung mã sau khi ghi GitHub; chưa chạy Node/npm test, chưa chạy trình duyệt, chưa thử Android hoặc đo hiệu năng thiết bị thực. Không tuyên bố triển khai GitHub Pages đã hoàn tất.
- Nhánh: `v1-development`; không sửa `main`.


## SGHT B5.5.4 — Lịch sử kích thước và nhập số pixel chính xác — 2026-11-21

- Bổ sung hai lệnh riêng Hoàn tác kích thước và Làm lại kích thước. Mỗi lần kéo, dùng bàn phím hoặc nhập số pixel được ghi thành một giao dịch; lịch sử giới hạn 40 bước cho từng trang tính và được lưu cùng metadata workbook.
- Hai lệnh lịch sử kích thước hoạt động độc lập với lịch sử nội dung/định dạng ô hiện có. Không ghi snapshot dữ liệu ô, không thay đổi công thức, không làm xáo trộn lịch sử sửa ô và lịch sử phiên bản công thức.
- Nhấp đúp vào tay nắm mép tiêu đề hàng/cột để nhập kích thước pixel chính xác. Hệ thống làm tròn về số nguyên và giới hạn hàng 20–240 px, cột 40–500 px; hủy hộp nhập thì không thay đổi.
- Lịch sử được tách riêng có chủ ý: Hoàn tác/Làm lại kích thước chỉ tác động hình học lưới, còn Hoàn tác/Làm lại hiện hành tiếp tục dành cho dữ liệu và định dạng. Đây là cơ chế tương thích, không phải một timeline hợp nhất giữa mọi loại thao tác.
- Giữ nguyên lưu trữ ô thưa, engine công thức, clipboard, fill-series, virtual scrolling, freeze/split và metadata hình học từng sheet. Không cấp phát mảng theo tổng số hàng/cột.
- Chưa triển khai đổi kích thước đồng loạt cho nhiều hàng/cột, AutoFit nội dung hoặc sao chép kích thước giữa các trục. Chưa chạy trình duyệt/Android; chưa thực thi npm test trong môi trường này; chưa có xác nhận CI hoặc Pages deployment cho commit này.
- Nhánh: v1-development; không sửa hoặc hợp nhất vào main.
- Bắt đầu và phát triển: 21/11/2026.


## SGHT B5.5.5 — Chọn nhiều hàng/cột và đổi kích thước đồng loạt — 2026-11-21

- Dùng vùng chọn hiện hành làm phạm vi: khi vùng chọn bao gồm nhiều hàng, kéo/nhập/điều chỉnh tay nắm của một hàng nằm trong vùng sẽ áp dụng cùng chiều cao cho toàn bộ hàng được chọn; tương tự với nhiều cột.
- Nếu vùng chọn chỉ có một hàng/cột, hoặc tay nắm nằm ngoài trục được chọn, thao tác chỉ tác động một hàng/cột như trước.
- Mỗi lần đổi đồng loạt là một giao dịch hình học duy nhất, có thể hoàn tác/làm lại bằng lịch sử kích thước B5.5.4; dữ liệu ô, định dạng và lịch sử công thức không bị ghi lại.
- Thêm API setAxisSizes cập nhật một bản đồ thưa trong một lượt, loại bỏ chỉ số trùng, kiểm tra chỉ số và giới hạn kích thước; không lặp tạo geometry cho từng hàng/cột.
- Giới hạn an toàn: tối đa 5.000 hàng hoặc cột trong một thao tác để tránh tạo metadata quá lớn và làm nghẽn thiết bị cấu hình thấp. Kích thước vẫn theo giới hạn B5.5.1: hàng 20–240 px, cột 40–500 px.
- Bổ sung unit test cho đổi hàng/cột hàng loạt, chỉ số trùng, giữ mặc định cho trục ngoài vùng, và giới hạn 5.000. Chưa chạy npm test trong môi trường này.
- Chưa kiểm thử thao tác thực tế trên Chrome/Android, chưa đo RAM, chưa xác nhận CI hoặc GitHub Pages deployment. Nhánh v1-development; không sửa main.
- Bắt đầu: 21/11/2026.
