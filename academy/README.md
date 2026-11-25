# HAI ĐẤT OFFICE ACADEMY

## Source of truth
- `data/curriculum.json`: nội dung giáo trình, mã bài, mục tiêu, ứng dụng, bài tập và checklist.
- `data/languages.json`: danh mục gói ngôn ngữ, hướng chữ và trạng thái bản dịch.
- `app.js`: bộ đọc chung; không chứa bản sao nội dung bài học.
- `index.html` và `style.css`: giao diện đọc trên điện thoại/desktop.

## Contract
- Mỗi bài có `id` bất biến; bản dịch chỉ thay giá trị văn bản theo locale, không đổi ID.
- `apps` chỉ nhận `writer`, `calc`, `slides`.
- Mỗi trường có thể là chuỗi hoặc object locale. Bộ đọc ưu tiên locale được chọn, sau đó dùng tiếng Việt làm ngôn ngữ dự phòng và hiển thị trạng thái dự phòng.
- Chỉ ghi `status: complete` cho bản dịch đã được biên tập/kiểm duyệt. Không giả nhận nội dung dự phòng là bản dịch.
- Mọi văn bản được đưa vào DOM bằng `textContent`; không render HTML tuỳ tiện từ dữ liệu giáo trình.
- Tiến độ học lưu cục bộ trên thiết bị, không gửi dữ liệu cá nhân lên máy chủ.

## Add a language
1. Add locale to `data/languages.json` using a BCP-47 code (for example `fr`, `ja`, `ar`).
2. Add reviewed translations for each lesson field in `data/curriculum.json` or a future split locale pack.
3. Set direction to `rtl` for right-to-left scripts.
4. Run `node --test tests/academy.test.js`.
5. Set translation status to complete only after language review.

## Add a lesson
Use a unique ID, chapter, app list, level, estimated minutes, title, objective, sections, exercise and checklist. Preserve existing IDs when editing a lesson. Do not create separate Writer/Calc/Slides copies of a shared lesson.


## Nội dung và chất lượng
- Giáo trình hiện có 18 bài (phiên bản 2.0): nền tảng & quyền riêng tư, chuyên sâu Writer V7, Calc (149 hàm OpenFormula, thao tác lưới, XLSX/CSV, in PDF), Slides V2 Studio 16:9 và quy trình liên thông.
- Xem bản đồ chương trình tại [COURSE-MAP.md](COURSE-MAP.md).
- Quy chuẩn bản dịch tại [locales/README.md](locales/README.md).
- Tiếng Việt là nội dung gốc; tiếng Anh hiện là gói khởi đầu đầy đủ 18 bài, cần hiệu đính chuyên môn trước khi chứng nhận hoàn chỉnh.
- Kiểm thử dữ liệu: `node --test tests/academy.test.js`.
- Kiểm thử Chromium trên màn hình điện thoại: workflow Academy Browser QA; đây là mô phỏng viewport, không thay thế kiểm thử trên điện thoại vật lý.
