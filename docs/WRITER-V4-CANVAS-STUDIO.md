# HAI ĐẤT WRITER V4 — Canvas Studio

- Ngày cập nhật: 17/11/2026
- Nhánh: `v4-development`
- Quyết định: một tài liệu, một ID, hai chế độ; offline bắt buộc.

## V4.1 — tích hợp dữ liệu ban đầu
Canvas nhận `documentId` trên URL, tìm bản ghi trong `haidat-writer-documents-v2`, đọc metadata `design` và ghi metadata trở lại đúng bản ghi đó. Không tạo bản sao, không thay ID và không thay HTML văn bản. Nếu không có ID hợp lệ, Canvas vẫn có thể chạy ở chế độ thử riêng nhưng không được nhận là đã tích hợp.

## Cấu trúc metadata
```js
{
  version: 1,
  page: { width: 210, height: 297, unit: "mm" },
  items: [],
  updatedAt: "ISO-8601"
}
```
Mỗi item là đối tượng có ID ổn định và các thuộc tính bố cục riêng. Bản ghi V3 không có `design` tiếp tục hợp lệ.

## V4.1 còn phải hoàn thiện
- Engine pan/zoom theo vùng nhìn, thước mm chính xác và đường căn.
- Tự lưu có debounce, báo trạng thái lưu và phục hồi khi mở lại.
- Chống ghi đè nếu ID không còn tồn tại hoặc kho dữ liệu sai cấu trúc.
- Kiểm thử chuyển Writer → Canvas → Writer trên cùng ID.
- Kiểm thử Android và desktop; chưa tuyên bố đạt trước khi chạy thực tế.

## Các mốc tiếp theo
V4.2 Object Studio; V4.3 Image & Typography; V4.4 Multi-page Studio; V4.5 Document Integration; V4.6 Export Studio; V4.7 Mobile & Performance; V4.8 Final QA.

## Giới hạn
Prototype trước đây dùng khóa preview riêng. V4.1 bắt đầu dùng metadata trong bản ghi Writer khi có documentId. Các chức năng nâng cao và kiểm thử xuất DOCX/PDF chưa được xác nhận hoàn thành.
