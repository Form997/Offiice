# HAI ĐẤT OFFICE V4.4 — Multi-page Studio

- Ngày: 17/11/2026
- Nhánh: `v4-development`
- Trạng thái: triển khai ban đầu; chưa phải bản phát hành.

## Mục tiêu
Mở rộng Canvas Studio từ một khung trang thành tài liệu nhiều trang, vẫn nằm trong cùng một hồ sơ Writer và dùng đúng một ID tài liệu. Mỗi trang có vùng đối tượng riêng và thiết lập trang độc lập.

## Hợp đồng dữ liệu
```js
{
  version: 2,
  activePageId: "cv-page-...",
  page: { width, height, unit: "mm", size, orientation, margins, printArea },
  items: [], // tương thích: các đối tượng của trang đang mở
  pages: [
    {
      id: "cv-page-...",
      name: "Trang 1",
      items: [],
      settings: {
        size: "A4",
        orientation: "portrait",
        widthMm: 210,
        heightMm: 297,
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
        printArea: true
      }
    }
  ],
  updatedAt: "ISO-8601"
}
```

- `pages[].items` là nguồn dữ liệu riêng cho từng trang.
- `activePageId` là khóa chọn trang đang hiển thị.
- `items` và `page` ở cấp `design` được duy trì để tương thích với Canvas V4.1–V4.3.
- ID hồ sơ Writer không thay đổi; không tạo bản ghi tài liệu thứ hai.

## Chuyển đổi dữ liệu cũ
Nếu metadata chỉ có `design.items`, Canvas tạo một trang đầu tiên và đưa toàn bộ đối tượng cũ vào trang đó. Việc chuyển đổi không tự ghi dữ liệu chỉ vì mở tài liệu; cấu trúc mới được lưu khi người dùng bấm Lưu hoặc có thay đổi kích hoạt autosave.

## Phạm vi chức năng
1. Chọn trang, chuyển trang trước/sau.
2. Thêm trang mới theo thiết lập trang hiện hành.
3. Xóa trang với xác nhận; tài liệu luôn phải còn ít nhất một trang.
4. Đưa trang lên/xuống để đổi thứ tự.
5. Thiết lập A4, A3, A5, Letter hoặc kích thước tùy chỉnh.
6. Chọn chiều dọc/ngang, chiều rộng/cao theo mm.
7. Thiết lập lề bốn phía và bật/tắt đường hướng dẫn vùng in.
8. Undo/redo bao gồm trạng thái toàn bộ danh sách trang.

## Những gì chưa được tuyên bố
- Chưa có tự động chảy/tràn văn bản qua nhiều trang.
- Đường vùng in không phải bộ máy in hoặc xuất PDF/DOCX.
- Chưa có thumbnail trang hoặc kéo-thả trang để đổi thứ tự.
- Chưa có kiểm tra đối tượng vượt lề hoặc tự dàn lại nội dung khi đổi khổ giấy.
- Chưa có browser QA, Android/desktop QA, quota/storage, multi-tab hoặc crash-recovery QA.

## Kiểm tra
JavaScript được trích xuất từ trang HTML và kiểm tra cú pháp thành công bằng `new Function(...)`. Đây là kiểm tra tĩnh, không thay thế kiểm thử tương tác trên trình duyệt và thiết bị thật.

## Bảo toàn nhánh
Chỉ cập nhật `v4-development`. Không sửa, merge hoặc deploy `v3-development` hay `main`.

## Mẫu trang
Khi thêm trang, người dùng chọn một trong bốn mẫu: trang trắng, bìa tài liệu, trang nội dung hoặc trang bảng dữ liệu. Mẫu tạo ra các đối tượng Canvas độc lập có thể sửa, di chuyển, định dạng hoặc xóa. Bố cục mẫu được thiết kế theo khung A4; khi đổi khổ giấy, cần kiểm tra và sắp xếp lại nội dung.


## V4.5 — Đồng bộ tài liệu Writer/Canvas
- Một ID tài liệu và một bản ghi localStorage; trường `revision` tăng khi có lần lưu thay đổi.
- Writer hợp nhất theo từng trường so với bản gốc đã nạp và bản mới nhất trong kho. Sửa độc lập được kết hợp; sửa trùng trường với giá trị khác nhau bị chặn để tránh ghi đè âm thầm.
- Canvas chỉ cập nhật `design` lên bản mới nhất khi chữ ký bố cục vẫn khớp bản gốc. Nếu bố cục đã đổi ở nơi khác, thao tác lưu bị từ chối.
- Sự kiện `storage` thông báo thay đổi giữa các tab cùng origin; Writer đang có chỉnh sửa giữ nội dung cục bộ và hợp nhất lúc lưu.
- Lịch sử dùng cùng khóa `haidat-writer-history-v1`; snapshot có thể chứa `html` và `design`. Khôi phục trong Writer khôi phục cả hai nếu snapshot có thiết kế.
- Backup version 5 xuất dữ liệu Canvas/revision/lịch sử; bộ nhập vẫn nhận version 1–5.
- Ngưỡng: snapshot Writer bỏ dữ liệu thiết kế nếu JSON vượt 500.000 ký tự; Canvas từ chối lưu khi snapshot bảo vệ vượt 650.000 ký tự; lịch sử tổng tối đa khoảng 1.100.000 ký tự ước tính.
- Đây là đồng bộ lạc quan trên localStorage, chưa phải khóa giao dịch phân tán; chưa đồng bộ nhiều thiết bị và chưa kiểm thử thực tế nhiều tab.
