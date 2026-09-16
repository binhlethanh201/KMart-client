# Luồng duyệt (Approval Workflow) — Tài liệu UI/UX & Cách sử dụng

Tài liệu mô tả cấu trúc, giao diện và cách thao tác của phần **Cấu hình Luồng duyệt** trong module System Config (`src/features/system-config/components/WorkflowTab.jsx`).

---

## 1. Tổng quan

Cấu hình Luồng duyệt cho phép thiết lập trình tự các bước phê duyệt cho từng loại đơn nội bộ (Đơn xin nghỉ phép, Đơn làm thêm (OT), Đơn xin nghỉ thai sản, Đơn xin nghỉ việc, Đơn xin ra ngoài…). Mỗi loại đơn có một luồng duyệt riêng, độc lập.

Thiết kế UI/UX theo mô hình **Flow Builder kết hợp Accordion**:

- **Trạng thái thu gọn**: mỗi bước hiển thị như một "Node" gọn nhẹ trong luồng, chỉ tóm tắt thông tin quan trọng → người dùng nhìn được toàn cảnh quy trình từ trên xuống dưới.
- **Trạng thái mở rộng**: trình bày đầy đủ các tuỳ chọn cấu hình cho bước đang chọn, bố cục Grid 2 cột để dàn đều không gian.
- **Đường nối dọc (Connectors)**: minh hoạ trực quan hướng đi của luồng duyệt.

Mục tiêu: thay thế cảm giác "thủ tục hành chính" (các form dài, liệt kê dọc rối mắt) bằng trải nghiệm hiện đại, gọn gàng, dễ thao tác.

---

## 2. Cấu trúc dữ liệu

Nguồn dữ liệu mô phỏng: `src/features/system-config/data/mockData.js` và `src/features/hr/data/mockData.js`.

### 2.1. Loại đơn (Form Types)

```js
export const FORM_TYPES = [
  'Đơn xin nghỉ phép',
  'Đơn làm thêm (OT)',
  'Đơn xin nghỉ thai sản',
  'Đơn xin nghỉ việc',
  'Đơn xin ra ngoài',
];
```

Mỗi loại đơn ánh xạ tới một object chứa **3 mảng step riêng theo khối** trong state `workflows`:

```js
workflows[formType] = {
  hq:     Step[],   // Khối Văn phòng
  retail: Step[],   // Khối Cửa hàng
  common: Step[],   // Dùng chung — merge chạy cho cả HQ & Retail
};
```

> **Khối luồng (track):** HQ và Retail được setup riêng biệt; "Dùng chung" là các bước chạy thêm cho cả hai khối, ghép theo **thứ tự kéo-thả** trong luồng khối. Chọn khối ở thanh selector để chuyển mảng đang chỉnh sửa.

### 2.2. Hình thức duyệt (Approval Types)

```js
export const APPROVAL_TYPES = [
  { id: 'hierarchy', label: 'Cấp quản lý trực tiếp', desc: 'Quản lý trực tiếp của người tạo đơn (TP/Phó phòng/CHT)' },
  { id: 'chain',     label: 'Chuỗi quản lý liên tiếp', desc: 'Duyệt lần lượt từ cấp thấp ➔ cấp cao' },
  { id: 'role',      label: 'Theo chức danh / Bộ phận', desc: 'Chọn bộ phận xử lý (VD: HR Admin, Kế toán)' },
  { id: 'specific',  label: 'Chọn 1 người cụ thể',     desc: 'Chọn chính xác tên nhân sự' },
];
```

| Hình thức | Ý nghĩa | Cấu hình thêm |
|---|---|---|
| `hierarchy` | Duyệt theo cấp bậc cố định | Chọn 1 cấp: Quản lý trực tiếp / Phó phòng / Trưởng phòng / Cửa hàng trưởng / Quản lý chi nhánh-Vùng / Giám đốc khối |
| `chain` | Duyệt theo chuỗi quản lý (động) | Chọn "Bắt đầu từ" → "Tối đa đến", đơn sẽ đi tuần tự qua các cấp trong khoảng |
| `role` | Duyệt theo vai trò chức danh | Chọn vai trò (HR Admin, Kế toán trưởng, Pháp chế…) + Quy tắc nhiều người duyệt |
| `specific` | Chỉ định một người cụ thể | Chọn 1 nhân sự qua ô tìm kiếm |

### 2.3. Quy tắc nhiều người duyệt (Multi Rules)

Xuất hiện khi hình thức duyệt = `role` **và** có từ 2 nhân sự trở lên khớp vai trò (đếm theo `e.role === role || e.position === role`). Khi chỉ có ≤1 nhân sự, khối này thu gọn thành một ghi chú giải thích, tránh rối mắt.

```js
export const MULTI_RULES = [
  { id: 'sequential', label: 'Duyệt lần lượt',              desc: 'Người A duyệt xong mới chuyển sang Người B', badge: 'A ➔ B ➔ C' },
  { id: 'and',        label: 'Đồng thời — cần tất cả đồng ý',   desc: 'Gửi tất cả, bắt buộc 100% bấm Duyệt',       badge: 'A + B + C' },
  { id: 'or',         label: 'Đồng thời — chỉ cần 1 người',     desc: 'Ai bấm Duyệt trước thì đơn hoàn tất',       badge: 'A ⚡ B' },
];
```

- Mỗi quy tắc kèm một **visual badge** (`badge`) bên cạnh tiêu đề để nhận biết nhanh bằng mắt.
- Khi chọn **Duyệt lần lượt** (`sequential`), hiển thị **Danh sách người duyệt tuần tự** cho phép kéo-thả để thay đổi thứ tự và thêm/bớt nhân sự.

### 2.4. Xử lý quá hạn 12 giờ (Timeout)

Mỗi bước có cấu hình tự động xử lý khi quá 12 giờ không có phản hồi:

- `timeoutEnabled` (boolean): bật/tắt tính năng.
- `timeoutMode`: chế độ tính thời gian —
  - `continuous` — Tính 12 giờ liên tục.
  - `business` — Chỉ tính trong giờ hành chính, phù hợp môi trường cửa hàng có ca đêm/ngày nghỉ.
- `timeoutAction`:
  - `return` — Chuyển trả về nơi khởi tạo.
  - `escalate` — Tự động chuyển cấp lên trên.

### 2.5. Cấu trúc một Step

```ts
{
  id: string,                  // định danh duy nhất
  name: string,                // tên bước (vd: "Trưởng phòng duyệt")
  approvalType: 'hierarchy' | 'chain' | 'role' | 'specific',
  hierarchyOption: string,     // cấp bậc (cho hierarchy)
  chainStart: string,          // cấp bắt đầu (cho chain)
  chainEnd: string,            // cấp tối đa (cho chain)
  role: string,                // vai trò (cho role)
  specificUser: string,        // tên nhân sự (cho specific)
  multiRule: 'sequential' | 'and' | 'or',
  sequentialOrder?: string[],  // thứ tự id nhân sự (cho sequential)
  scope: 'auto' | 'hq' | 'retail',   // Phạm vi / Ngữ cảnh (xem 2.7)
  condition: null | { field, op, value }, // Điều kiện rẽ nhánh (xem 2.6)
  timeoutEnabled: boolean,
  timeoutMode: 'continuous' | 'business',
  timeoutAction: 'return' | 'escalate',
  rejectReasonRequired: boolean, // Bắt buộc nhập lý do khi từ chối (xem 2.8)
}
```

### 2.6. Điều kiện rẽ nhánh (Conditional Routing)

`condition: null | { field, op, value }` — chỉ áp dụng bước này khi thoả điều kiện lọc. Bỏ trống (`null`) để áp dụng cho mọi trường hợp.

- `field`: `num_days` (Số ngày nghỉ), `leave_type` (Hình thức nghỉ), `ot_hours` (Số giờ OT).
- `op`: `>`, `>=`, `==`, `<=`, `<`.

Ví dụ: `Số ngày nghỉ > 2` ➔ bước này (chuyển tiếp Quản lý Vùng / HR) chỉ kích hoạt khi đơn có hơn 2 ngày nghỉ; các đơn ≤2 ngày kết thúc ngay sau Cửa hàng trưởng/Trưởng phòng.

### 2.7. Phạm vi / Ngữ cảnh (Matrix Scope)

`scope: 'auto' | 'hq' | 'retail'` (default `'auto'`), chỉ hiện cho `hierarchy` và `chain`. Xác định "quản lý trực tiếp theo ngữ cảnh":

- `auto` — Tự nhận theo ngữ cảnh nhân viên (HQ → Trưởng phòng; Retail → Cửa hàng trưởng).
- `hq` — Luôn nhận Trưởng phòng theo phòng ban nhân viên.
- `retail` — Nhận Cửa hàng trưởng theo cửa hàng/chi nhánh nhân viên đang thuộc về tại thời điểm nộp đơn (xử lý luân chuyển cửa hàng).

### 2.8. Hành động từ chối (Reject)

`rejectReasonRequired` (boolean, default `true`) — bắt buộc nhập lý do khi từ chối đơn. Khi từ chối, đơn chuyển về trạng thái **Nháp** để nhân viên sửa và nộp lại.

---

## 3. State Management

```js
const [formType, setFormType]     = useState(FORM_TYPES[0]);     // loại đơn đang cấu hình
const [block, setBlock]           = useState('hq');              // khối luồng: 'hq' | 'retail' | 'common'
const [openStepIds, setOpenStepIds] = useState(() => new Set()); // tập hợp id các bước đang mở
const [workflows, setWorkflows]   = useState(() => { ... });      // { [formType]: { hq, retail, common } }
const [saved, setSaved]           = useState(false);              // cờ thông báo đã lưu
```

### Hành vi mở/đóng (Accordion đa mở)

- `openStepIds` là một **`Set`** → mỗi bước đóng/mở **độc lập**.
- Bấm vào bước đang thu gọn → mở.
- Bấm lại chính bước đó → thu vào.
- Mở một bước khác **không** tự đóng bước đang mở — nhiều bước có thể mở cùng lúc.
- Thêm bước mới → tự động mở bước đó.
- Xoá bước / đổi loại đơn → reset danh sách mở.

### Các hàm cập nhật

- `updateStep(id, patch)` — merge patch vào step theo `id`.
- `removeStep(id)` — xoá step, đồng thời dọn dẹp `openStepIds`.
- `addStep()` — thêm một bước mặc định, tự mở rộng.
- `toggleStep(id)` — bật/tắt trạng thái mở của step.
- `save()` — giả lập lưu (hiển thị thông báo 2.5s).

---

## 4. Cấu trúc giao diện (UI)

```
WorkflowTab
├── Form type + Block selector  (chọn loại đơn + khối luồng HQ/Retail/Dùng chung)
├── Vertical flow list       (danh sách bước của khối đang chọn — Accordion + Connectors, kéo-thả sắp xếp)
│   └── Step (mỗi bước)
│       ├── Connector + số thứ tự
│       └── Card
│           ├── [Collapsed] Node tóm tắt
│           └── [Expanded] Header + Body Grid
└── Bottom actions           (Thêm bước / Lưu cấu hình)
```

### 4.1. Form type + Block selector

- Card trên cùng, chứa icon `tune` + dropdown chọn loại đơn.
- Đổi loại đơn → nạp bộ 3 luồng khối tương ứng, reset trạng thái mở.
- Dải segmented **Khối luồng** ngay dưới: `Khối Văn phòng` / `Khối Cửa hàng` / `Dùng chung` (icon `apartment` / `storefront` / `merge`).
- Đổi khối → chuyển mảng step đang chỉnh sửa, reset trạng thái mở. Khi chọn "Dùng chung" hiện ghi chú: các bước chạy cho cả HQ & Retail, ghép theo thứ tự kéo-thả.

### 4.2. Vertical flow list (danh sách bước theo chiều dọc)

Mỗi bước bọc trong `relative pl-8` để chừa chỗ cho **cột connector** ở trái.

#### Connector + số thứ tự

- Cột dọc bên trái, căn giữa ngang.
- Số thứ tự `idx + 1` trong vòng tròn:
  - Đang mở: nền primary đặc + `ring-4 ring-primary/20` (nổi bật).
  - Đang thu: nền primary nhạt + viền primary/30.
- Đường nối dọc (`w-px bg-outline-variant`) chạy từ node này xuống node kế, minh hoạ hướng đi của luồng.

#### Trạng thái thu gọn (Node)

Một nút bấm (`<button>`) chiếm toàn bộ chiều ngang, nền nhạt `bg-surface-container-lowest`, bo góc, hover nổi viền. Bố cục ngang:

```
[drag_indicator]  Tên bước                    Bước N  [expand_more ▼]
                   ▢ account_tree  Tóm tắt hình thức duyệt
```

- **Tên bước** — đậm, cắt chữ khi dài.
- **Tóm tắt hình thức duyệt** — icon `account_tree` + chuỗi tóm tắt, vd:
  - `Cấp quản lý trực tiếp · Trưởng phòng`
  - `Chuỗi quản lý liên tiếp`
  - `Theo chức danh / Bộ phận · Pháp chế (Legal)`
  - `Chọn 1 người cụ thể · Phạm Văn E`
- **Chip "Bước N"** — ẩn trên màn hẹp.
- **Mũi tên `expand_more`** — đổi màu primary khi hover.

Bấm vào nút → chuyển sang trạng thái mở rộng.

#### Trạng thái mở rộng (Card đầy đủ)

##### Header

```
[drag_indicator] [input tên bước  ..................] [Bước N] [▲ expand_more] [delete]
```

- Ô input tên bước (border-b transparent, focus hiện viền primary).
- Mũi tên thu gọn xoay 180° (`rotate-180`) báo hiệu đang mở.
- Nút xoá bước (icon `delete`, hover đỏ).

##### Body — Grid 2 cột

Bố cục `flex flex-col gap-4`, bên trong chia thành 2 khu vực:

**Hàng trên — Grid 2 cột cân bằng** (cả hai đều ngắn, tránh khoảng trắng):

- **Cột trái — Hình thức duyệt** (icon `how_to_reg`)
  - 4 RadioCard chọn hình thức duyệt (xếp ngang trên `md+`), mỗi thẻ kèm dòng mô tả `desc`.
  - Cấu hình tuỳ biến theo hình thức:
    - `hierarchy`: select cấp bậc (gồm Cửa hàng trưởng / Quản lý chi nhánh-Vùng).
    - `role`: select vai trò.
    - `specific`: ô UserSelect có tìm kiếm (avatar + tên + mã + vai trò).
    - `chain`: cùng dòng — "Bắt đầu từ" → `arrow_forward` → "Tối đa đến", không nền, `flex-wrap` xuống dòng gọn gàng trên màn hẹp.
  - **Phạm vi áp dụng** (chỉ `hierarchy`/`chain`): segmented control `auto / HQ / Retail` kèm microcopy giải thích ngữ cảnh nhận người duyệt.

- **Cột phải — Xử lý quá hạn 12 giờ** (icon `schedule`)
  - Checkbox "Tự động chuyển trả đơn sau 12 giờ không xử lý".
  - Khi bật: select chế độ tính giờ (`continuous`/`business`) và select hành động (`return` / `escalate`).

**Hàng dưới — full-width**:

- **Điều kiện rẽ nhánh** (icon `alt_route`, full-width, đầu body): checkbox "Áp dụng bước này khi" + 3 control `[field] [op] [value]`.
- **Quy tắc nhiều người duyệt** (icon `group`)
  - Chỉ hiện khi `approvalType = role` **và** có ≥2 nhân sự khớp; ngược lại thu về 1 ghi chú.
  - Dòng ghi chú giải thích điều kiện áp dụng + đếm nhân sự khớp.
  - 3 RadioCard chọn quy tắc (xếp ngang trên `sm+`), mỗi thẻ kèm **visual badge** (`A ➔ B ➔ C` / `A + B + C` / `A ⚡ B`).
  - Khi chọn `sequential`: hiển thị **Danh sách người duyệt tuần tự**:
    - Mỗi nhân sự: `drag_indicator` + số thứ tự + avatar + tên + **badge chức vụ** (vd: `Trưởng phòng`) + dòng phụ "(mã) · phòng ban".
    - Kéo-thả để đổi thứ tự.
    - Nút "Thêm người duyệt" mở dropdown tìm kiếm (badge chức vụ + phòng ban đồng nhất).
- **Hành động từ chối** (icon `block`, full-width): checkbox "Bắt buộc nhập lý do khi từ chối đơn".

> Lý do tách hàng dưới full-width: phần multi-rule (đặc biệt khi chọn `sequential`) cao hơn nhiều so với các phần khác. Nếu ép vào cột, grid sẽ tạo khoảng trắng trống ở cột còn lại. Tách ra full-width giúp phần cồng kềnh có không gian mở rộng tự nhiên.

### 4.3. Bottom actions

- **Thêm bước duyệt tiếp theo** — nút viền primary, icon `add`.
- **Lưu cấu hình Workflow** — nút đặc primary, icon `save`.
- Khi lưu xong: thông báo "Đã lưu cấu hình" (xanh, icon `check_circle`) hiển thị 2.5 giây.

---

## 5. Các component phụ

### 5.1. `SequentialOrderList`

Danh sách kéo-thả thứ tự người duyệt tuần tự.

- `currentIds`: lấy từ `order` prop hoặc mặc định theo `role`.
- `displayList`: map id → EMPLOYEES.
- Kéo-thả HTML5: `onDragStart` / `onDrop` đổi vị trí trong mảng.
- Thêm nhân sự qua dropdown tìm kiếm theo tên/mã.
- Hiển thị: avatar, tên, **badge chức vụ** (`position`), dòng phụ "(mã) · `department`".

### 5.2. `UserSelect`

Ô chọn nhân sự có tìm kiếm, dùng cho hình thức `specific`.

- Hiển thị nhân sự đã chọn (avatar + tên + mã + vai trò).
- Bấm mở dropdown, tìm theo tên/mã, click để chọn.
- Overlay `fixed inset-0` để đóng khi click ra ngoài.

### 5.3. `RadioCard`

Radio dạng thẻ, dùng cho cả "Hình thức duyệt" và "Quy tắc nhiều người duyệt".

- Trạng thái chọn: viền primary + nền primary-container nhẹ + chữ primary.
- Hover: nền surface-container-low.

### 5.4. `GroupHeader`

Tiêu đề nhóm cấu hình kèm icon:

```jsx
<GroupHeader icon="how_to_reg" label="Hình thức duyệt" />
<GroupHeader icon="group"     label="Quy tắc nhiều người duyệt" />
<GroupHeader icon="schedule"  label="Xử lý quá hạn 12 giờ" />
```

Loại bỏ hoàn toàn các tiền tố khô khan như "A.", "B.", "C.".

---

## 6. Hướng dẫn sử dụng (người dùng cuối)

### 6.1. Chọn loại đơn cần cấu hình

1. Mở trang **Cấu hình hệ thống → Luồng duyệt**.
2. Ở thanh trên cùng, chọn loại đơn trong dropdown (vd: "Đơn xin nghỉ phép").
3. Chọn **khối luồng** (HQ / Retail / Dùng chung) ở dải segmented ngay dưới.

### 6.2. Xem toàn cảnh luồng

- Các bước hiển thị dạng Node thu gọn, nối nhau bằng đường dọc.
- Mỗi Node tóm tắt: tên bước + hình thức duyệt (vd: "Theo chức danh / Bộ phận · Pháp chế").

### 6.3. Chỉnh sửa một bước

1. Bấm vào Node → mở rộng, hiển thị đầy đủ cấu hình.
2. Đổi **tên bước** ở ô input đầu header (nếu cần).
3. Chọn **Hình thức duyệt**:
   - *Cấp quản lý trực tiếp*: chọn cấp bậc cần duyệt (chọn **Phạm vi áp dụng** HQ/Retail/Auto nếu cần).
   - *Chuỗi quản lý liên tiếp*: chọn "Bắt đầu từ" và "Tối đa đến".
   - *Theo chức danh / Bộ phận*: chọn vai trò → tuỳ chọn quy tắc nhiều người.
   - *Chọn 1 người cụ thể*: chọn một nhân sự cụ thể.
4. (Tuỳ chọn) Bật **Áp dụng bước này khi** và đặt điều kiện rẽ nhánh (vd: Số ngày nghỉ > 2).
5. Cấu hình **Xử lý quá hạn 12 giờ**: đánh dấu "Tự động chuyển trả đơn sau 12 giờ", chọn chế độ (liên tục/giờ hành chính) và hành động (trả về người tạo / chuyển cấp trên).
6. (Nếu *Theo chức danh / Bộ phận*) Chọn **Quy tắc nhiều người duyệt** (chỉ hiện khi ≥2 nhân sự khớp):
   - *Duyệt lần lượt*: kéo-thả để sắp xếp thứ tự, thêm/bớt nhân sự.
   - *Đồng thời — cần tất cả đồng ý* / *Đồng thời — chỉ cần 1 người*.
7. Đánh dấu **Bắt buộc nhập lý do khi từ chối đơn** ở nhóm "Hành động từ chối" (mặc định bật).
8. Bấm mũi tên ▲ ở header để thu gọn lại.

> Nhiều bước có thể mở cùng lúc — mở bước khác không đóng bước hiện tại. Chỉ bấm lại chính node đó mới thu vào.

### 6.4. Thêm / Xoá bước

- **Thêm**: bấm "Thêm bước duyệt tiếp theo" ở cuối danh sách → bước mới xuất hiện và tự mở rộng.
- **Xoá**: bấm icon `delete` ở header bước đang mở rộng.

### 6.5. Lưu

- Bấm "Lưu cấu hình Workflow" → thông báo "Đã lưu cấu hình" hiện ra xanh rồi tự ẩn.

---

## 7. Thiết kế & UX — Nguyên tắc áp dụng

| Nguyên tắc | Cách hiện thực |
|---|---|
| **Toàn cảnh trước, chi tiết sau** | Mặc định thu gọn; mở rộng theo nhu cầu. |
| **Giảm tải nhận thức** | Bỏ tiền tố "A./B./C.", thay bằng GroupHeader + icon. |
| **Cân bằng không gian** | Grid 2 cột cho các phần ngắn; tách phần cồng kềnh (multi-rule) ra full-width. |
| **Phản hồi trạng thái** | Số thứ tự nổi khi mở, mũi tên xoay 180°, viền primary khi active. |
| **Độc lập thao tác** | Accordion đa mở — các bước không ảnh hưởng lẫn nhau. |
| **Khả năng truy cập** | Sử dụng `<label>`, `<input type="radio">`/`checkbox` gốc; vùng bấm lớn. |
| **Responsive** | Grid gập về 1 cột trên màn hẹp; chip "Bước N" ẩn; chuỗi quyền chain `flex-wrap`. |
| **Ngữ cảnh nhân sự** | Badge chức vụ + phòng ban giúp phân biệt người duyệt nhanh. |

---

## 8. Kế hoạch kiểm thử (Verification)

1. **Chuyển đổi qua lại giữa các loại đơn** (nghỉ phép, OT, nghỉ thai sản…) — kiểm tra các step render đúng theo dữ liệu riêng của từng đơn.
2. **Chuyển khối luồng** (HQ → Retail → Dùng chung) — mỗi khối nạp đúng mảng step riêng; reset trạng thái mở.
3. **Kéo-thả step**: kéo tay cầm `drag_indicator` để sắp xếp lại thứ tự bước trong khối; đảm bảo input tên / ô tìm kiếm vẫn gõ được (chỉ tay cầm mới draggable).
4. **Mở rộng / thu gọn**:
   - Mở nhiều bước cùng lúc, đảm bảo không tự đóng chéo.
   - Bấm lại bước đang mở → thu vào.
5. **Kéo-thả người duyệt tuần tự**:
   - Sắp xếp lại thứ tự người duyệt tuần tự (icon `drag_indicator`).
   - Đảm bảo UI mới không cản trở thao tác kéo-thả.
6. **Cập nhật state**:
   - Đổi hình thức duyệt, chọn vai trò/cấp, bật timeout, đổi quy tắc multi — kiểm tra state cập nhật chính xác (giữ giá trị khi thu rồi mở lại).
7. **Responsive**: thu hẹp trình duyệt xuống ~400px, kiểm tra Grid gập 1 cột, chuỗi chain xuống dòng gọn.
8. **Thêm/Xoá bước**: bước mới tự mở; xoá bước đang mở không gây lỗi.

---

## 9. Vị trí tệp

| Vai trò | Đường dẫn |
|---|---|
| Component chính | `src/features/system-config/components/WorkflowTab.jsx` |
| Dữ liệu luồng duyệt | `src/features/system-config/data/mockData.js` |
| Dữ liệu nhân sự | `src/features/hr/data/mockData.js` |
