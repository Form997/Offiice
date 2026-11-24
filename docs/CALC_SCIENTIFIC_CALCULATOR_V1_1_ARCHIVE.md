# Nhật ký lưu trữ — Máy tính khoa học CALC V1.1

## V1.1 — 18/11/2026 (nhánh v1-development)

### Tính năng mới
- Chuyển chế độ lượng giác DEG/RAD; lựa chọn được lưu trên thiết bị.
- Bổ sung hàm lượng giác ngược: `asin()`, `acos()`, `atan()`.
- Bổ sung giai thừa `!`, phần trăm hậu tố `%`, bình phương và nghịch đảo.
- Bổ sung hằng số và biến `Ans` để dùng kết quả gần nhất trong biểu thức sau.
- Bổ sung bộ nhớ máy tính: M+, M−, MR, MC.
- Bổ sung chép kết quả và chọn một phép tính trong lịch sử để dùng lại.
- Tăng lịch sử lưu cục bộ lên tối đa 50 phép tính.
- Làm mới bàn phím và bố cục ưu tiên màn hình điện thoại.
- Nâng phiên bản bộ nhớ đệm PWA để nhận đúng tài nguyên V1.1 khi cập nhật.

### Kiểm tra
- Đã kiểm tra cú pháp JavaScript bằng trình biên dịch JavaScript: đạt.
- Chưa xác nhận kiểm thử tương tác trên nhiều trình duyệt/thiết bị; cần kiểm tra thực tế sau khi Pages triển khai.
- Không thay đổi nhánh `main`.

### Phạm vi dữ liệu
- Biểu thức, lịch sử, chế độ góc và bộ nhớ lưu trên thiết bị bằng localStorage.
- Không gửi dữ liệu phép tính lên máy chủ; chưa có đồng bộ đám mây.
