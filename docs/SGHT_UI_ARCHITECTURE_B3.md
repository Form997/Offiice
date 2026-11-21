# SGHT — Kiến trúc giao diện đích B3

- Ngày: 2026-11-21
- Repository: `Form997/Offiice`
- Nhánh làm việc: `v1-development`
- Commit nền B2: `af18f1f2af0c4bf7d5fcd11f87f225590d1d81c9`
- Phạm vi: đặc tả kiến trúc giao diện, bố cục desktop/tablet/mobile, hệ thống điều khiển và lộ trình chuyển đổi.
- Đây là tài liệu thiết kế. Không sửa HTML/CSS/JS, engine, cấu trúc workbook hay schema trong B3.
- Không triển khai lên website trong bước này; không thay đổi `main`.

## 1. Mục tiêu và nguyên tắc nền

SGHT được định hướng thành ứng dụng bảng tính chuyên nghiệp, lấy lưới ô làm trung tâm, có khả năng mở rộng dần từ tác vụ thông dụng tới phân tích và tự động hóa chuyên sâu.

### 1.1. Mục tiêu trải nghiệm

1. Người dùng mở ứng dụng là thấy ngay workbook, trang tính, ô đang chọn và thanh công thức.
2. Tác vụ thường dùng có thể thực hiện trong một hoặc hai thao tác; tác vụ chuyên sâu được gom theo phân hệ.
3. Không bắt người dùng kéo thả mới sử dụng được chức năng. Mọi thao tác kéo thả quan trọng phải có phương án bằng nút/menu.
4. Giao diện thích ứng với màn hình nhỏ, thao tác chạm, bàn phím và chuột.
5. Không làm mất dữ liệu, công thức, định dạng, lịch sử, workbook nhiều trang hay hợp đồng dữ liệu của engine đang có.
6. Chỉ đưa tính năng lên giao diện chính khi đã có hành vi thật, trạng thái lỗi và kiểm thử tương ứng.

### 1.2. Những điều không làm

- Không viết lại engine bảng tính chỉ để đổi giao diện.
- Không giả lập tính năng bằng nút bấm trang trí hoặc thông báo thành công giả.
- Không đặt toàn bộ 177 nút hiện có lên một màn hình.
- Không ép điện thoại hiển thị ribbon desktop thu nhỏ.
- Không biến Dashboard, AI, Data Science, Macro thành các tab luôn chiếm chiều cao màn hình.
- Không tự động thay đổi dữ liệu khi mở panel, chuyển tab hay chọn công cụ.

## 2. Kiến trúc thông tin

Giao diện mới chia thành 6 lớp, mỗi lớp có nhiệm vụ rõ ràng.

| Lớp | Thành phần | Trách nhiệm |
|---|---|---|
| A — App shell | Header, tên workbook, trạng thái lưu, menu chính | Nhận diện tài liệu, trạng thái và lệnh cấp workbook |
| B — Workbook navigation | Thanh trang tính, thêm/đổi tên/di chuyển/ẩn trang | Điều hướng giữa các sheet |
| C — Command surface | Ribbon theo tab và contextual toolbar | Hiển thị lệnh phù hợp với tác vụ hoặc vùng chọn |
| D — Formula surface | Name box, formula bar, trạng thái nhập/chỉnh sửa | Đọc và sửa nội dung ô/công thức |
| E — Grid workspace | Lưới ảo hóa, vùng chọn, freeze/split, thanh cuộn | Không gian làm việc chính |
| F — Auxiliary workspace | Side panel, drawer, dialog, output panel | Data, Pivot, Chart, AI, Data Science, Macro, Security |

### 2.1. Sơ đồ quan hệ

```text
SGHT App
├── App Header
│   ├── Brand / Workbook title
│   ├── Save state / Undo / Redo
│   └── File menu / Account
├── Workbook Bar
│   ├── Sheet tabs
│   └── Add / Manage sheets
├── Command Surface
│   ├── Main tabs
│   └── Contextual tools
├── Formula Surface
│   ├── Name box
│   ├── Function helper
│   └── Formula input
├── Grid Workspace
│   ├── Virtualized grid
│   ├── Selection / Fill / Clipboard
│   └── Freeze / Split / Scroll
├── Status Bar
│   ├── Selection summary
│   ├── Zoom
│   └── Calculation / sync status
└── Auxiliary Workspace
    ├── Data & Pivot
    ├── Chart & Dashboard
    ├── AI & Data Science
    ├── Macro & Debugger
    └── Account & Security
```

Sơ đồ trên mô tả cấu trúc logic, không bắt buộc phải là cây DOM y hệt.

## 3. Bố cục desktop

<text>Đích ưu tiên: màn hình ngang từ 1024 px trở lên; vùng bảng tính luôn được ưu tiên chiều rộng và chiều cao.</text>

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ SGHT   Tên workbook                 Đã lưu   Undo  Redo   Tệp  Tài khoản    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Trang1  Trang2  Trang3  +                                               ⋯   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Trang chủ | Chèn | Công thức | Dữ liệu | Xem | Tự động hóa | Phân tích     │
├─────────────────────────────────────────────────────────────────────────────┤
│ Công cụ theo tab đang chọn                                                  │
│ [Dán] [Cắt] [Sao chép] [Font] [Cỡ] [Màu] [Căn lề] [Định dạng số] ...       │
├─────────────────────────────────────────────────────────────────────────────┤
│ A1 ▾  fx  =SUM(B2:B8)                                           [✓] [×]     │
├─────────────────────────────────────────────────────────────────────────────┤
│       A          B          C          D          E          F               │
│  1  ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐     │
│  2  │          │          │          │          │          │          │     │
│  3  │          │          │          │          │          │          │     │
│  4  │          │          │          │          │          │          │     │
│  5  │          │          │          │          │          │          │     │
│     └──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘     │
├─────────────────────────────────────────────────────────────────────────────┤
│ Sẵn sàng     Đếm: 8     Tổng: 1.250       Thu phóng 100%                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

Khi mở panel chuyên sâu, bố cục chuyển sang hai vùng: lưới vẫn còn nhìn thấy và panel nằm bên phải. Panel có chiều rộng điều chỉnh được, nút đóng rõ ràng và nhớ trạng thái thu gọn trong phiên. Trên màn hình hẹp, panel chuyển thành drawer phủ lên lưới thay vì bóp lưới xuống quá nhỏ.

## 4. Bố cục tablet

```text
┌──────────────────────────────────────────────┐
│ SGHT   Workbook       Lưu   ⋯                │
├──────────────────────────────────────────────┤
│ Trang1   Trang2   Trang3   +                 │
├──────────────────────────────────────────────┤
│ Trang chủ | Chèn | Dữ liệu | Xem | ⋯         │
├──────────────────────────────────────────────┤
│ Công cụ cuộn ngang theo nhóm                 │
├──────────────────────────────────────────────┤
│ A1 ▾   fx   Nội dung / công thức             │
├──────────────────────────────────────────────┤
│                                              │
│                LƯỚI Ô                        │
│                                              │
│                                              │
├──────────────────────────────────────────────┤
│ Ô chọn · Tổng · Đếm              100%        │
└──────────────────────────────────────────────┘
```

- Tab ribbon hiển thị một phần; các nhóm còn lại vào menu “Thêm”.
- Toolbar có cuộn ngang, không tự xuống nhiều hàng làm mất diện tích lưới.
- Side panel dùng drawer từ cạnh phải hoặc bottom sheet tùy chiều màn hình.
- Vùng chạm mục tiêu tối thiểu 44 × 44 CSS px; các nút icon phải có nhãn trợ năng và tooltip phù hợp.

## 5. Bố cục điện thoại

```text
┌──────────────────────────────┐
│ SGHT   Tên bảng tính     ⋯   │
├──────────────────────────────┤
│ Trang1  Trang2  +            │
├──────────────────────────────┤
│ A1 ▾                        │
│ fx  Nội dung / công thức     │
├──────────────────────────────┤
│                              │
│          LƯỚI Ô              │
│     vuốt để cuộn             │
│     chạm để chọn             │
│                              │
├──────────────────────────────┤
│ Trang chủ  Chèn  Dữ liệu  ⋯  │
├──────────────────────────────┤
│ [Chọn] [Định dạng] [Chèn] [⋯]│
└──────────────────────────────┘
```

Nguyên tắc mobile:
- Header rút gọn, không chiếm hai hàng cố định nếu không cần.
- Formula bar có thể thu gọn/mở rộng; vùng nhập đủ cao khi sửa công thức.
- Thanh lệnh dưới màn hình có các hành động theo ngữ cảnh, không chứa toàn bộ chức năng.
- Chạm ô mở thanh công cụ ngữ cảnh: sửa, sao chép, cắt, dán, định dạng, chèn/xóa hàng cột.
- Thao tác vùng chọn có chế độ “Chọn vùng” và nhập địa chỉ; không bắt buộc kéo tay nắm.
- Các panel chuyên sâu dùng full-screen sheet hoặc drawer toàn màn hình.
- Không dùng hover làm điều kiện duy nhất để nhìn thấy nút.
- Hỗ trợ bàn phím ảo: khi nhập công thức, giữ vùng nhập hiển thị và không để bàn phím che mất nội dung quan trọng.

## 6. Hệ thống tab và công cụ

Không giữ nguyên cách chia 10 tab hiện tại nếu chúng khiến ribbon quá dài. Đề xuất 7 nhóm cấp một:

| Tab đích | Nội dung | Các lệnh tiêu biểu |
|---|---|---|
| Trang chủ | Clipboard, font, căn lề, định dạng số, xóa, tổng nhanh | Cắt/sao chép/dán, in đậm, màu, viền, SUM/AVERAGE/COUNT |
| Chèn | Hàng/cột, bảng, biểu đồ, ảnh, liên kết, Pivot | Chèn cấu trúc và đối tượng |
| Công thức | Thư viện hàm, tham chiếu, tên vùng, kiểm tra công thức | Hàm, gợi ý cú pháp, truy vết lỗi |
| Dữ liệu | Sắp xếp, lọc, loại trùng, tổng phụ, bảng, Pivot | Làm sạch và tổ chức dữ liệu |
| Xem | Zoom, freeze, split, hiển thị, điều hướng | Ghim, chia vùng, chế độ xem |
| Tự động hóa | Macro, ghi thao tác, thư viện, lịch sử, debugger | Tạo, kiểm tra, chạy có kiểm soát |
| Phân tích | Biểu đồ, Dashboard, AI, Data Science | Thống kê, mô hình, báo cáo, trợ lý |

Tài khoản, MFA, Passkey, danh tính và nhật ký bảo mật đặt trong khu vực Tài khoản/Cài đặt, không trộn với lệnh thao tác ô.

### 6.1. Quy tắc toolbar theo ngữ cảnh

- Chọn một ô: hiển thị lệnh thao tác ô.
- Chọn vùng nhiều ô: hiển thị thao tác vùng, tổng/đếm, định dạng.
- Chọn biểu đồ: hiển thị tab/toolbar biểu đồ.
- Đang sửa công thức: hiển thị trợ giúp hàm, xác nhận và hủy.
- Chọn Pivot: hiển thị công cụ Pivot.
- Đang chạy macro/debug: hiển thị trạng thái phiên và lệnh an toàn liên quan.

Không thay đổi nội dung vùng chọn khi chỉ mở toolbar.

## 7. Side panel, drawer và dialog

| Phân hệ | Cách mở | Kiểu trình bày desktop | Kiểu trình bày mobile |
|---|---|---|---|
| Dữ liệu | Tab Dữ liệu | Panel cạnh phải hoặc vùng mở rộng | Drawer toàn màn hình |
| Pivot | Từ Dữ liệu / Chèn | Panel có vùng trường và vùng kết quả | Các bước tuần tự, có nút quay lại |
| Biểu đồ | Chọn biểu đồ / Chèn | Inspector thuộc tính | Bottom sheet / màn hình thuộc tính |
| Dashboard | Tab Phân tích | Workspace riêng, lưới widget | Workspace riêng, widget xếp dọc |
| AI | Tab Phân tích | Panel hội thoại và kết quả | Full-screen panel |
| Data Science | Tab Phân tích | Panel tham số + kết quả + biểu đồ | Form từng bước, kết quả riêng |
| Macro | Tab Tự động hóa | Editor và vùng kiểm tra | Full-screen editor |
| Debugger | Trong Macro | Panel trace/watch/breakpoint | Màn hình riêng, ưu tiên đọc log |
| Tài khoản/Bảo mật | Menu tài khoản | Settings page/dialog | Full-screen settings |

Mỗi panel phải có: tiêu đề, mô tả ngắn, nút đóng, trạng thái rỗng, trạng thái đang xử lý, trạng thái lỗi và cách quay lại. Không mở nhiều panel chồng lấn nếu không có lý do nghiệp vụ.

## 8. Design system

### 8.1. Token đề xuất

| Token | Giá trị ban đầu | Dùng cho |
|---|---|---|
| `--sght-brand` | `#173B32` | Header/nhận diện |
| `--sght-brand-strong` | `#245A49` | Nút chính, trạng thái active |
| `--sght-accent` | `#D8EEE2` | Nền nhấn nhẹ |
| `--sght-app-bg` | `#F4F7F4` | Nền ứng dụng |
| `--sght-surface` | `#FFFFFF` | Panel, toolbar, dialog |
| `--sght-text` | `#172923` | Chữ chính |
| `--sght-muted` | `#6C7C74` | Chữ phụ |
| `--sght-border` | `#DCE5DF` | Đường viền |
| `--sght-danger` | `#B42318` | Lỗi/nguy hiểm |
| `--sght-warning` | `#9A6700` | Cảnh báo |

Giữ màu thương hiệu xanh hiện có để tránh đổi nhận diện không cần thiết. Màu trạng thái phải đi kèm chữ/icon, không chỉ dựa vào màu.

### 8.2. Kích thước và nhịp điệu

- Lưới: chiều cao hàng và chiều rộng cột có thể thay đổi theo zoom; giữ vùng chạm dễ chọn trên thiết bị cảm ứng.
- Nút thông thường: cao 36–40 px desktop; mục tiêu chạm tối thiểu 44 px trên touch.
- Bo góc: 6–10 px, nhất quán.
- Spacing: thang 4/8/12/16/24 px.
- Typography: hệ thống sans-serif; ưu tiên khả năng đọc tiếng Việt, số liệu và công thức.
- Focus ring nhìn thấy rõ khi điều hướng bằng bàn phím.

### 8.3. Responsive breakpoints đề xuất

| Nhóm | Viewport | Quy tắc |
|---|---:|---|
| Compact phone | dưới 480 px | Header gọn, bottom command bar, panel toàn màn hình |
| Phone / large phone | 480–767 px | Toolbar cuộn ngang, formula bar co giãn |
| Tablet | 768–1023 px | Ribbon rút gọn, panel dạng drawer |
| Desktop | 1024–1439 px | Ribbon đầy đủ theo tab, panel cạnh phải |
| Wide desktop | từ 1440 px | Giới hạn chiều rộng vùng công cụ, ưu tiên diện tích lưới |

Breakpoint là mục tiêu thiết kế mới, không phải khẳng định CSS hiện tại đã hỗ trợ đúng các kích thước này. B4/B5 phải kiểm tra trên viewport thực.

## 9. Hợp đồng tương tác và bảo toàn engine

### 9.1. Phân lớp mã nguồn đích

```text
sght/
├── index.html                 # app shell và điểm mount
├── styles/
│   ├── tokens.css             # màu, spacing, typography
│   ├── layout.css             # shell, grid, responsive
│   ├── components.css         # button, menu, panel, dialog
│   └── utilities.css          # trạng thái, helper classes
├── ui/
│   ├── app-shell.js
│   ├── workbook-bar.js
│   ├── ribbon.js
│   ├── formula-bar.js
│   ├── command-registry.js
│   ├── contextual-toolbar.js
│   ├── panel-manager.js
│   ├── mobile-navigation.js
│   └── accessibility.js
├── app.js                     # orchestration / bootstrap hiện tại
└── engine/                    # giữ nguyên hợp đồng hiện có
```

Đây là cấu trúc đích tham khảo. Trước khi tách file phải xác minh cách import, thứ tự script, global state và test harness hiện tại. Không di chuyển file hàng loạt khi chưa có kiểm thử hồi quy.

### 9.2. Quy tắc kết nối UI với engine

- UI gửi command có kiểu rõ ràng tới lớp điều phối; không sửa trực tiếp cấu trúc dữ liệu nội bộ từ component.
- Các thao tác thay đổi workbook phải đi qua đường lệnh hiện hữu để giữ Undo/Redo, history và persistence.
- Selection state, active sheet, zoom, freeze/split và formula edit state phải có một nguồn sự thật nhất quán.
- Panel chỉ đọc/ghi thông qua API hoặc command đã có; không tự tạo bản sao workbook riêng.
- Khi thao tác thất bại, giữ dữ liệu cũ và hiện thông báo có thể hành động.
- Lệnh nguy hiểm (xóa vùng, thay hàng loạt, chạy macro, khôi phục lịch sử) cần preview/xác nhận phù hợp.
- Các panel đóng/mở không được reset dữ liệu đang nhập nếu người dùng chưa xác nhận.

## 10. Trạng thái giao diện bắt buộc

Mỗi control/panel cần định nghĩa tối thiểu:

1. Default — trạng thái ban đầu.
2. Hover — chỉ dành cho thiết bị có hover.
3. Focus — điều hướng bàn phím.
4. Active/Selected — đang chọn.
5. Disabled — có lý do và điều kiện bật.
6. Loading — đang xử lý, ngăn gửi lệnh trùng.
7. Success — chỉ hiển thị sau khi tác vụ thật hoàn tất.
8. Error — nêu nguyên nhân và cách khắc phục.
9. Empty — chưa có dữ liệu.
10. Offline/Unavailable — dịch vụ hoặc backend không sẵn sàng.

Nút bị khóa phải có lý do, ví dụ “Chọn một ô có công thức trước” hoặc “Đăng nhập để quản lý Passkey”, thay vì chỉ làm mờ.

## 11. Accessibility và nhập liệu

- Dùng button cho hành động, input/select cho nhập liệu, label gắn đúng control.
- Mỗi nút icon có accessible name.
- Duy trì focus sau khi đóng dialog/panel về đúng nút đã mở.
- Hỗ trợ phím tắt, Tab/Shift+Tab, Enter, Escape và phím điều hướng lưới.
- Không bắt buộc thao tác kéo thả; mọi thao tác vùng có đường đi qua menu/nhập địa chỉ.
- Thông báo trạng thái dùng vùng live phù hợp, tránh đọc lặp liên tục.
- Màu chữ/nền đạt độ tương phản đọc được; không dùng màu đơn độc để truyền thông tin.
- Công thức dài có thể cuộn ngang trong formula bar, không làm tràn layout.

## 12. Lộ trình triển khai giao diện

| Chặng | Phạm vi | Điều kiện qua chặng |
|---|---|---|
| B3 | Kiến trúc và wireframe — tài liệu này | Đã thống nhất bố cục, phân hệ, nguyên tắc |
| B4 | Ma trận kiểm thử hồi quy và tiêu chí nghiệm thu | Có test case dữ liệu/công thức/UI và baseline |
| B5.1 | Design tokens, app shell, header, workbook bar | Lưới và dữ liệu hiện tại vẫn hoạt động |
| B5.2 | Ribbon theo tab, command registry, contextual toolbar | Lệnh hiện hữu được nối đúng và trạng thái rõ |
| B5.3 | Formula bar, status bar, grid workspace | Chọn ô, nhập công thức, undo/redo, scroll không suy giảm |
| B5.4 | Panel manager và phân hệ chuyên sâu | Mở/đóng panel không mất dữ liệu nhập |
| B5.5 | Responsive tablet/mobile, touch alternatives | Thao tác bằng chạm không phụ thuộc drag |
| B5.6 | Hoàn thiện, accessibility, hiệu năng | Qua test matrix và kiểm tra thiết bị |

Không chuyển sang B5 sửa UI hàng loạt trước khi B4 xác định bộ kiểm thử và đường lui.

## 13. Tiêu chí nghiệm thu thiết kế

- Desktop: lưới có diện tích chính; ribbon theo tab; panel không che mất trạng thái tài liệu.
- Tablet: điều khiển không tràn ngang toàn trang; panel có thể đóng/mở bằng chạm.
- Mobile: có thể chọn ô, sửa giá trị/công thức, định dạng, đổi sheet, undo/redo và tìm lệnh mà không cần chuột.
- Không có nút giả; mọi lệnh được hiển thị phải có handler và kết quả/giải thích.
- Không mất dữ liệu khi mở/đóng panel, chuyển tab hoặc thay đổi viewport.
- Công thức, định dạng, clipboard, vùng chọn, freeze/split, workbook nhiều sheet, history và persistence giữ hành vi đã có.
- Không có lỗi console nghiêm trọng; không có tràn ngang toàn trang ngoài vùng lưới được thiết kế.
- Kiểm thử trên máy tính cấu hình thấp và điện thoại Android tầm phổ thông; theo dõi RAM, thời gian phản hồi và thao tác cuộn.

## 14. Quyết định B3

**Hướng thiết kế được chọn:** Spreadsheet-first, contextual commands, adaptive panels, mobile touch-first alternatives.

**Ưu tiên triển khai:** App shell → workbook navigation → command surface → formula bar → grid workspace → status bar → auxiliary panels → responsive refinement.

**Chưa được phép:** viết lại engine, thay schema workbook, bật tính năng Dashboard còn bỏ ngỏ chỉ bằng UI, hoặc gộp thay đổi vào `main`.

## 15. Trạng thái thực hiện

- B3 tạo đặc tả kiến trúc và wireframe bằng văn bản.
- Không sửa mã nguồn ứng dụng.
- Không chạy test runtime hoặc benchmark.
- Không triển khai website.
- Các kích thước/breakpoint/token trong tài liệu là thông số đề xuất, phải được kiểm chứng khi làm B4/B5.
