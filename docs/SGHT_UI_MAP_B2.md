# SGHT — Bản đồ giao diện và điều khiển B2

- Ngày: 2026-11-21
- Repository: `Form997/Offiice`
- Nhánh: `v1-development`
- Commit nguồn được kiểm tra: `d213fdee09189a97ad2562e738e3712777387b5a`
- Phạm vi: đối chiếu tĩnh `sght/index.html` và `sght/app.js`; không sửa giao diện, engine, dữ liệu hay schema.
- `main` không được thay đổi trong công việc B2.

## 1. Kết quả kiểm kê điều khiển

| Hạng mục | Kết quả quét tĩnh |
|---|---:|
| Nút trong HTML | 177 |
| Nút có ID | 175 |
| Nút không có ID cố định | 2 |
| Trường input/select/textarea được tìm thấy trong tệp | 137 thẻ |
| Panel/khu vực có ID được nhận diện | 39 |
| Nhóm tab ribbon | 10 mục nhìn thấy trong HTML |
| Nút có thuộc tính disabled ban đầu | 22 |

Lưu ý: 137 là số thẻ biểu mẫu được quét trong toàn bộ tệp HTML, có thể gồm cả markup nằm trong template; không được xem là số control đang hiện trên màn hình tại runtime. Số lượng nút 177 khớp kiểm kê B1. Không có kiểm thử trình duyệt trong B2.

## 2. Bản đồ khung làm việc

| Khu vực | Thành phần / ID tiêu biểu | Vai trò | Đánh giá tĩnh |
|---|---|---|---|
| Thanh đầu trang | `saveStatus`, `undoAction`, `redoAction`, `saveAction`, `newSheet`, `downloadCsv` | Trạng thái lưu, lịch sử, tạo trang, xuất dữ liệu | Có tham chiếu trong JS; undo/redo phụ thuộc lịch sử |
| Tên tài liệu | `sheetName` | Đổi tên workbook | Có control; cần kiểm tra lưu và khôi phục tên |
| Danh sách trang | `sheetTabs`, `addSheet` | Chuyển trang và thêm trang | Tab được render động; nút `addSheet` đang disabled và handler chỉ báo tính năng tương lai |
| Ribbon | `home`, `insert`, `formulas`, `data`, `openDashboard`, `view`, `file`, `openAI`, `openDataScience`, `openMacro` | Chuyển ngữ cảnh công cụ | Các tab không ID dùng `data-tab`/class; Dashboard có dấu hiệu chưa nối panel |
| Thanh công cụ nhanh | clipboard, format, quick functions, zoom, freeze, split | Thao tác ô/vùng | Có tham chiếu JS; cần test thao tác chuột và cảm ứng |
| Vùng bảng tính | `sheetPanes`, `sheetScroll`, `splitScroll`, `cellAddress` | Lưới, vùng chọn, cuộn và chia khung | Thuộc vùng trọng yếu; chưa có kiểm thử tương tác B2 |

## 3. Ma trận nút theo nhóm chức năng

Trạng thái trong bảng là mức độ đối chiếu mã nguồn, không phải chứng nhận đã chạy thành công.

| Nhóm | ID / dải điều khiển | Số nút | Kết quả đối chiếu |
|---|---|---:|---|
| Tệp và workbook | `saveAction`, `newSheet`, `downloadCsv`, `undoAction`, `redoAction` | 5 | Có tham chiếu JS; cần test lưu/tải và lịch sử |
| Ribbon | 10 mục tab, gồm `openDashboard` | 10 | Các tab thường dùng có xử lý chuyển tab; Dashboard chưa có xử lý mở panel tìm thấy |
| Clipboard và định dạng | `cutAction` đến `clearFormatAction`, `sumAction`, `averageAction`, `countAction` | 9 | Có tham chiếu JS; cần kiểm thử clipboard, định dạng và công thức nhanh |
| Thu phóng, ghim, chia vùng | `zoomOut`, `zoomIn`, `zoomReset`, `applyFreeze`, `clearFreeze`, `applySplit`, `clearSplit` | 7 | Có tham chiếu JS; ưu tiên kiểm thử touch/scroll |
| Công cụ dữ liệu | `dataSortApply`, `dataFilter*`, `dataSubtotalApply`, `dataRemoveDuplicates`, `dataDefineTable`, `dataClearTables` | 10 | Có tham chiếu JS; một số thao tác cần vùng dữ liệu hợp lệ |
| Pivot và biểu đồ Pivot | `pivotLoadFields`, `pivotBuild`, `pivotChartCreate`, `pivotChartDuplicate`, `pivotChartRename`, `pivotChartDelete`, `pivotChartUp/Down`, `pivotChartApply`, `pivotChartExport/Png/Pdf` | 11 | Có tham chiếu JS; phụ thuộc Pivot đã tạo và biểu đồ đang chọn |
| Dashboard | `openDashboard`, `dashboardAddChart`, `dashboardAddKpi`, `dashboardSaveTemplate`, `dashboardLoadTemplate`, `dashboardExportPng/Pdf`, `dashboardPresent`, `closeDashboard` | 9 | 5 ID đầu không có tham chiếu trong JS; 3 thao tác xuất/trình chiếu và đóng có tham chiếu. Không được coi Dashboard hoàn chỉnh |
| Data Science | `dsRegression`, `dsAnova`, `dsMultiple`, `dsTukey`, `dsGamesHowell`, `dsVif`, `dsAncova`, `dsKruskal`, `dsDunn`, `dsEffectSizes`, `dsPower`, `dsSampleSize`, `dsLsd`, `dsLevene`, `dsBrownForsythe`, `dsTwoWay`, các nút mô hình liều–đáp ứng, mô tả, dự báo, biểu đồ và xuất báo cáo | 30 | Các ID có tham chiếu JS; cần kiểm thử từng phân tích bằng bộ dữ liệu chuẩn và đối chiếu kết quả thống kê |
| AI | `aiAnalyze`, `aiSuggestFormula`, `aiDraftMacro`, `closeAI` | 4 | Có tham chiếu JS; cần xác minh cấu hình dịch vụ và xử lý khi offline |
| Macro Studio | ghi/dừng, nhập/xuất thư viện, lưu macro, lịch sử, preview, debugger, security | 18 | Có tham chiếu JS; một số nút chỉ hợp lệ theo trạng thái ghi/chạy/duyệt |
| Công thức và chẩn đoán | `applyFormula`, `analyzeFormulaError`, `scanFormulaErrors`, repair, versions, diagnostics | 14 | Có tham chiếu JS; nút disabled phần lớn là thao tác phụ thuộc kết quả nạp/preview |
| Tài khoản, MFA, Passkey, danh tính và kho kiểm toán | nhóm `sghtAuth*`, `accountActionSubmit`, `passkey*`, `mfa*`, `identity*`, `formulaAudit*` | 34 | Có tham chiếu JS; nhiều nút phụ thuộc backend, phiên đăng nhập, quyền và dữ liệu được nạp |
| Tìm kiếm và thay thế | `searchRun`, `searchPrevious`, `searchNext`, `searchClear`, `replaceOne`, `replaceAll` | 6 | Có tham chiếu JS; điều hướng/thay thế phụ thuộc kết quả tìm |
| Tạo trang phụ và kiểm thử | `addSheet`, `runFormulaDiagnostics` | 2 | `addSheet` disabled và chỉ có thông báo placeholder; diagnostics có tham chiếu JS |
| **Tổng số nút** |  | **177** | Phân loại sơ bộ theo vị trí và chức năng trong HTML; nhóm ribbon và nhóm nút điều khiển có thể giao nhau về mặt ngữ nghĩa |

Ghi chú: bảng nhóm dùng dải ID đại diện để người phát triển tra cứu; số đếm là phân nhóm kiểm kê theo vị trí/nhãn và không thay thế danh sách DOM runtime. Không kết luận chức năng đúng chỉ vì ID xuất hiện trong JavaScript: cần xác minh listener, nhánh điều kiện, đầu ra và lỗi khi chạy.

## 4. Các nút và luồng cần xử lý ưu tiên

### P0 — Nghi vấn điều khiển chưa được nối

| Điều khiển | Bằng chứng tĩnh | Kết luận hiện tại |
|---|---|---|
| `openDashboard` | Có trong HTML; không tìm thấy chuỗi ID trong `app.js` | Nút tab chỉ có thể được xử lý bởi listener ribbon chung; chưa thấy hành động mở `dashboardPanel` |
| `dashboardAddChart` | Có trong HTML; không tìm thấy ID trong JS | Nghi vấn chưa nối |
| `dashboardAddKpi` | Có trong HTML; không tìm thấy ID trong JS | Nghi vấn chưa nối |
| `dashboardSaveTemplate` | Có trong HTML; không tìm thấy ID trong JS | Nghi vấn chưa nối |
| `dashboardLoadTemplate` | Có trong HTML; không tìm thấy ID trong JS | Nghi vấn chưa nối |
| `addSheet` | HTML đặt disabled; JS chỉ gắn listener hiển thị thông báo tính năng tương lai | Placeholder/điểm vào thừa; không phải luồng tạo sheet thực |

Dashboard có `dashboardPanel` ẩn mặc định. JS có các thao tác `dashboardExportPng`, `dashboardExportPdf`, `dashboardPresent` và `closeDashboard`, nhưng điều này không chứng minh có thể mở panel hay thêm/lưu/nạp widget. Cần thiết kế lại một luồng Dashboard hoàn chỉnh trước khi đưa nút vào ribbon.

### P1 — Điều khiển phụ thuộc điều kiện

Các nhóm sau có trạng thái disabled ban đầu hoặc cần dữ liệu/phiên phù hợp:
- `undoAction`/`redoAction`: cần lịch sử thao tác.
- `stopMacro`: chỉ khả dụng khi đang ghi.
- `debugStep`, `debugContinue`, `debugStop`, `debugRollback`: cần phiên debugger hợp lệ.
- `previewFormulaRepair`, `applyFormulaRepair`, `compareFormulaVersions`, `restoreFormulaVersion`, `previewFormulaTransaction`, `restoreFormulaTransaction`: cần dữ liệu preview/lịch sử và điều kiện an toàn.
- `refreshAuthSessions`, `passkeyRegister`, `passkeyRefresh`, `mfaEnroll`: phụ thuộc trạng thái xác thực, cấu hình máy chủ và hỗ trợ trình duyệt.
- `searchPrevious`, `searchNext`, `replaceOne`, `replaceAll`: phụ thuộc kết quả tìm và vùng tìm hợp lệ.

Cần có thông báo lý do khóa nút, điều kiện bật và hướng dẫn khắc phục. Không bật nút chỉ để làm giao diện có vẻ đầy đủ.

## 5. Bản đồ trường nhập liệu và panel

| Phân hệ | Trường / ID tiêu biểu | Panel / vùng kết quả |
|---|---|---|
| Tên và định dạng ô | `sheetName`, `fontFamily`, `fontSize`, `fontColor`, `fillColor`, `horizontalAlign`, `verticalAlign`, `numberFormat`, `borderStyle` | Thanh ribbon |
| Freeze/split | `freezeRowsInput`, `freezeColumnsInput`, `splitMode` | `sheetPanes`, các vùng scroll |
| Sắp xếp/lọc/tổng phụ | `dataSort*`, `dataFilter*`, `dataSubtotal*`, `dataTableName` | `dataToolsPanel`, `dataSubtotalOutput` |
| Pivot | `pivotTarget`, `pivotChartType`, `pivotChartMeasure`, `pivotChartTitle`, `pivotChartXAxis`, `pivotChartYAxis`, `pivotChartColors` | `pivotFieldList`, các pivot zone, `pivotOutput`, `pivotChartOutput` |
| Data Science | `dsXRange`, `dsYRange`, `dsGroupRange`, `dsValueRange`, `dsMultiX`, `dsMultiY`, `dsDoseRange`, `dsSurface*`, `dsChart*` | `dataSciencePanel`, `dataScienceOutput` |
| AI | `aiPrompt` | `aiPanel`, `aiOutput` |
| Macro và debugger | `macroSource`, `macroFile`, `macroName`, `macroDescription`, `security*`, `breakpointLines`, `watchCells`, `historyFrom`, `historyTo` | `macroPanel`, `macroHistoryPanel`, `securityAudit`, `debugTrace`, `watchOutput` |
| Công thức | `formulaInput`, `formulaVersionA`, `formulaVersionB`, `diagnosticsSize` | formula/diagnostics/repair panels |
| Tài khoản và bảo mật | `sghtAuth*`, `accountAction*`, `passkey*`, `mfa*`, `identity*`, `formulaSigning*`, các trường file nhập/xuất kho | `accountLifecyclePanel`, danh sách phiên/Passkey và các hộp MFA |
| Tìm và thay thế | `searchQuery`, `searchMode`, `searchCase`, `searchWhole`, `searchSelectionOnly`, `replaceQuery` | panel tìm kiếm |

Các trường có ID và nhãn trợ năng chưa đồng đều. B3 cần chuẩn hóa label/aria-label, nhóm trường theo tác vụ, mô tả định dạng đầu vào và hiển thị lỗi ngay cạnh trường.

## 6. Quyết định thiết kế rút ra từ B2

1. Ribbon cấp một chỉ giữ tác vụ thường dùng; nhóm chuyên sâu chuyển vào panel/drawer theo ngữ cảnh.
2. Dashboard không tiếp tục được trình bày như một tab hoàn chỉnh cho tới khi có luồng mở, thêm biểu đồ/KPI, lưu mẫu và nạp mẫu hoạt động thống nhất.
3. Chỉ giữ một điểm vào tạo trang tính; thống nhất `newSheet` với `sheetTabs` và loại bỏ placeholder `addSheet` sau khi có kiểm thử.
4. Các lệnh phụ thuộc điều kiện phải có trạng thái và giải thích rõ, không để người dùng đoán vì sao nút bị mờ.
5. Trên điện thoại, các thao tác không được phụ thuộc kéo thả: cung cấp chọn trường → chọn đích → xác nhận; menu ngữ cảnh; nút thao tác lớn và thanh công cụ theo vùng chọn.
6. Tách điều khiển theo phân hệ, nhưng giữ nguyên engine và hợp đồng dữ liệu hiện tại.

## 7. Kế hoạch B3–B5

- B3: kiến trúc giao diện đích và wireframe desktop/tablet/mobile; xác định vùng làm việc, ribbon, formula bar, status bar, drawers và contextual toolbar.
- B4: ma trận hồi quy trước khi sửa UI; bao gồm dữ liệu, công thức, clipboard, vùng chọn, workbook, freeze/split, pivot, macro và bảo mật.
- B5: triển khai khung giao diện mới trên nhánh phát triển, từng lớp một, có kiểm thử và so sánh trước/sau.

## 8. Giới hạn và trạng thái thay đổi

- B2 là đối chiếu mã nguồn tĩnh. Chưa chạy Chrome, Android, Safari hay kiểm thử bàn phím/cảm ứng.
- Chuỗi ID xuất hiện trong JS chỉ là bằng chứng tham chiếu; không bảo đảm listener thực thi đúng hoặc tính năng hoàn chỉnh.
- Chưa đo hiệu năng, độ trễ, mức tiêu thụ RAM hay khả năng tương thích dữ liệu.
- B2 chỉ thêm tài liệu; không thay đổi `index.html`, `style.css`, `app.js`, engine, dữ liệu hay schema.
- Không triển khai ứng dụng trong bước này.
