# HAI ĐẤT OFFICE V4.5 — Document Integration

- Ngày: 17/11/2026
- Nhánh: `v4-development`
- Trạng thái: triển khai ban đầu, chưa phải bản phát hành.

## Mục tiêu
Writer và Canvas thao tác trên cùng một tài liệu, cùng ID và cùng bản ghi cục bộ. V4.5 tăng cường đồng bộ giữa hai chế độ, phát hiện xung đột, lịch sử phiên bản và sao lưu/khôi phục.

## Hợp đồng bản ghi

| Trường | Ý nghĩa |
|---|---|
| `id` | ID Writer bất biến, dạng HDW-YYYYMMDD-XXXXXXXX |
| `revision` | Số phiên bản tăng khi bản ghi được lưu thay đổi |
| `html` | Nội dung Writer |
| `design` | Metadata Canvas, gồm pages/items và thiết lập trang |
| `schemaVersion` | Giữ nguyên 3; revision không thay schema |

## Quy tắc đồng bộ
1. Writer giữ bản gốc lúc mở tài liệu, đọc bản mới nhất trong localStorage khi lưu và so sánh thay đổi theo từng trường.
2. Nếu Writer sửa HTML trong khi Canvas chỉ sửa design, hai thay đổi độc lập được hợp nhất vào cùng bản ghi.
3. Nếu cùng một trường bị thay đổi khác nhau ở hai cửa sổ, Writer chặn ghi đè và báo xung đột.
4. Canvas giữ revision và chữ ký design lúc mở. Khi lưu, Canvas đọc bản ghi mới nhất; nếu design vẫn bằng bản gốc, Canvas cập nhật design lên bản ghi mới nhất, giữ nguyên các trường Writer vừa lưu.
5. Nếu design đã đổi từ nơi khác, Canvas từ chối lưu để tránh ghi đè. Nếu Canvas chưa có chỉnh sửa cục bộ, nó nạp lại trang để nhận bố cục mới.
6. Sự kiện `storage` giúp nhận biết thay đổi ở tab khác cùng origin. Khi Writer đang có chỉnh sửa, nó không tự tải đè mà đợi bước hợp nhất lúc lưu.

## Lịch sử chung
- Khóa: `haidat-writer-history-v1`.
- Snapshot có `versionId`, thời điểm, lý do, HTML, tiêu đề, số từ/ký tự và tùy chọn `design`.
- Canvas lưu mốc của trạng thái trước khi thay đổi bố cục.
- Writer hiển thị nhãn mốc có cả Văn bản + Canvas; thao tác Khôi phục phục hồi HTML và design nếu snapshot có trường design.
- Snapshot cũ chỉ có HTML vẫn được hỗ trợ; khôi phục snapshot cũ không tự xóa design hiện tại.
- Tối đa 6 mốc/tài liệu; tổng giới hạn lịch sử 1.100.000 ký tự ước tính. Snapshot Writer không kèm design nếu JSON design vượt 500.000 ký tự. Canvas từ chối lưu nếu snapshot bảo vệ vượt 650.000 ký tự hoặc không ghi được lịch sử.

## Sao lưu
- Backup xuất theo format version 5, bao gồm documents (do đó gồm design và revision) cùng versionHistory.
- Import chấp nhận version 1–5; dữ liệu design trong tài liệu và snapshot lịch sử được giữ lại khi hợp nhất/khôi phục.

## Giới hạn và rủi ro còn lại
- Chỉ đồng bộ giữa các tab cùng trình duyệt/origin bằng localStorage; không đồng bộ nhiều thiết bị.
- Revision là kiểm tra xung đột lạc quan; không phải giao dịch phân tán/khóa độc quyền tuyệt đối. Hai lần ghi xảy ra gần như đồng thời vẫn cần QA thực tế.
- Chưa kiểm thử hai tab sửa cùng lúc, hai tab sửa cùng trường, localStorage quota, crash recovery hoặc thiết bị Android/desktop.
- Không có Supabase, tài khoản hoặc cộng tác qua máy chủ trong V4.5.

## QA đã chạy
- Phân tích cú pháp tĩnh `writer/app.js` bằng JavaScript Function constructor: thành công.
- Phân tích cú pháp tĩnh script nội tuyến `writer/canvas-studio.html`: thành công.
- Chưa có browser runtime QA; không tuyên bố các tương tác nhiều tab đã được xác minh trên trình duyệt thật.

## Bảo toàn nhánh
Chỉ cập nhật `v4-development`. Không sửa, merge hoặc deploy `v3-development` hay `main`.


## Kiểm tra logic bổ sung
Hàm `persist` thực tế được trích từ `writer/app.js` và chạy trong harness với localStorage giả lập:
- Thay đổi HTML Writer và design Canvas độc lập được hợp nhất, revision tăng.
- Sửa cùng trường với hai giá trị khác nhau bị chặn; dữ liệu remote không bị ghi đè.
- Soft-delete được lưu ngay cả khi một tài liệu khác đang mở.
- Purge một tài liệu được phản ánh mà không xóa tài liệu đang mở.

Đây là kiểm thử logic có mock, không phải kiểm thử browser. Chưa kiểm thử thực tế các sự kiện storage giữa tab, thao tác Canvas UI hoặc thiết bị Android/desktop.

## Cache offline
Service worker dùng cache key `haidat-writer-v4-5-r1`, cache-bust `app.js?v=4.5` và precache `canvas-studio.html` để tránh giữ app V3 cũ trong cache V4.
