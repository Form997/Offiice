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
