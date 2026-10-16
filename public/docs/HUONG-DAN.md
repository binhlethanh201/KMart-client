# Hướng dẫn sử dụng hệ thống KMart

> Tài liệu dành cho **người dùng cuối và quản trị viên**. Nội dung được chia **theo vai trò** để bạn
> chỉ đọc đúng phần mình cần: nhân viên, người duyệt, nhân sự, quản trị viên.
> Mỗi thao tác đều ghi rõ **đường dẫn trên menu** — bấm theo là làm được ngay.

![Bốn vai trò trong hệ thống và việc chính của từng vai trò](/docs/img/so-do-vai-tro.svg)

---

## 0. Bạn thuộc vai trò nào? Đọc phần nào?
<!-- seen-by: all -->

Hệ thống có **bốn nhóm vai trò**. Vai trò của bạn quyết định bạn thấy menu nào và làm được việc gì.

| Vai trò (mã) | Bạn làm gì trong hệ thống | Đọc phần |
|---|---|---|
| **Nhân viên** (STAFF) | Tạo đơn của mình, theo dõi tiến độ, bổ sung hồ sơ, hủy đơn | Mục **1** → **2** → **6** |
| **Người duyệt** (MANAGER · TEAM_LEADER · và các vai trò duyệt khác) | Xử lý đơn đến lượt mình, ủy quyền khi vắng, cài người duyệt thay | Mục **1** → **3** → **6** |
| **Nhân sự** (HR) | Quản lý nhân viên, cấp lại mật khẩu, phòng ban, xem báo cáo | Mục **1** → **4** → **6** |
| **Quản trị** (ADMIN) | Cấu hình mẫu đơn, luồng duyệt, chức vụ, Telegram, giờ quá hạn | Mục **1** → **5** → **6** |

**Dùng chung cho mọi vai trò:** đăng nhập, đổi mật khẩu bắt buộc, chuông thông báo, kết nối Telegram
(mục **1** và **6**).

> Một người có thể vừa là nhân viên vừa là người duyệt — khi đó đọc thêm mục **3** và làm được cả hai
> nhóm việc trong cùng một tài khoản.

### Toàn cảnh chức năng theo từng menu

| Menu | Dùng để làm gì | Ai thấy |
|---|---|---|
| **Phòng ban & Nhóm** | Xem sơ đồ tổ chức, thông tin & thành viên từng phòng ban, đơn từ và báo cáo riêng của phòng | Mọi người |
| **Nhân sự** | Danh sách nhân viên, tạo tài khoản, đặt lại mật khẩu, vai trò hệ thống | HR / Quản trị |
| **Đơn từ → Đơn từ cá nhân** | Tạo đơn mới, theo dõi đơn của mình, bổ sung hoặc hủy đơn | Mọi người |
| **Đơn từ → Đơn chờ tôi duyệt** | Xử lý đơn đến lượt mình: duyệt, từ chối, yêu cầu bổ sung, bình luận | Người có quyền duyệt |
| **Báo Cáo** | Số liệu tổng quan, xu hướng 12 tháng, phân bổ theo loại đơn / phòng ban, xuất Excel | HR / Quản trị |
| **Ủy quyền → Ủy quyền tạm thời** | Giao quyền duyệt cho người khác trong khoảng thời gian bạn vắng mặt | Người có quyền duyệt |
| **Ủy quyền → Duyệt thay quá hạn** | Cài người duyệt thay mặc định cho đơn bạn duyệt khi bị quá hạn | Người có quyền duyệt |
| **Cấu hình → Mẫu đơn & Form** | Thiết kế biểu mẫu đơn và các ô cần điền | Quản trị / HR |
| **Cấu hình → Luồng duyệt** | Dựng luồng duyệt cho từng loại đơn | Quản trị / HR |
| **Cấu hình → Chức vụ & cấp bậc** | Quản lý chức vụ dùng làm mốc duyệt | Quản trị / HR |
| **Cấu hình → Chung & Telegram** | Cấu hình bot Telegram, cách tính giờ quá hạn | Quản trị / HR |
| **Tài khoản** (bấm tên mình ở sidebar) | Xem hồ sơ cá nhân, kết nối / đổi Telegram, sửa thông tin liên hệ | Mọi người |
| **Hướng dẫn** | Chính trang tài liệu bạn đang đọc | Mọi người |

---

## 1. Dùng chung: đăng nhập, đổi mật khẩu, điều hướng
<!-- seen-by: all -->

### 1.1. Đăng nhập hệ thống

Mục đích: truy cập hệ thống bằng tài khoản do Nhân sự cấp.

![Bốn bước đăng nhập và đổi mật khẩu bắt buộc](/docs/img/dang-nhap.svg)

1. Mở trang web KMart — màn hình đăng nhập hiện ra với 2 ô **Email làm việc** và **Mật khẩu**.
2. Nhập email công ty + mật khẩu rồi bấm **Đăng nhập** (hoặc nhấn phím **Enter**).
3. Nếu sai thông tin, thông báo lỗi hiện **ngay dưới ô nhập**, bạn nhập lại — không cần tải lại trang.

**Kết quả:** vào màn hình chính theo vai trò của bạn.

### 1.2. Lần đầu đăng nhập sau khi Nhân sự cấp lại mật khẩu

Nếu Nhân sự vừa đặt lại mật khẩu cho bạn, hệ thống **chặn** và mở màn **Đổi mật khẩu bắt buộc**:

1. Ô **Mật khẩu tạm hiện tại**: nhập mật khẩu tạm Nhân sự cấp (nhận qua Telegram hoặc đọc trực tiếp).
2. Ô **Mật khẩu mới** và **Nhập lại mật khẩu mới**: đặt mật khẩu mới của bạn.
3. Mật khẩu mới phải đủ **5 điều kiện** hiển thị ngay dưới ô nhập:
   tối thiểu **8 ký tự**, có **chữ hoa**, có **chữ thường**, có **chữ số**, có **ký tự đặc biệt**.
4. Bấm **Đổi mật khẩu và tiếp tục** để vào hệ thống. Nhập chưa đúng thì màn hình báo lỗi cụ thể ngay
   dưới ô liên quan (ví dụ "Mật khẩu xác nhận không khớp").

> Không thể bỏ qua màn này — mật khẩu tạm không dùng được vào bất kỳ menu nào.

### 1.3. Nhìn thấy gì sau khi vào hệ thống

![Thanh điều hướng: thông tin cá nhân, chuông thông báo và menu theo quyền](/docs/img/thanh-dieu-huong.svg)

- **Góc trái** (trên máy tính) hiện **tên, vai trò và trạng thái "Trực tuyến"** của bạn. Bấm vào đó
  (hoặc ảnh đại diện) để mở trang **Tài khoản**.
- **Chuông thông báo** nằm ngay cạnh tên bạn. **Chấm đỏ** trên chuông là số thông báo chưa đọc trong hệ
  thống; bấm vào để mở danh sách. Trên **điện thoại**, chuông chuyển lên **góc trên bên phải**.
- **Menu bên trái** chỉ hiện những mục bạn có quyền. Ví dụ nhân viên không thấy **Nhân sự**, **Báo Cáo**,
  **Cấu hình**; người có quyền duyệt thấy thêm **Đơn chờ tôi duyệt** và **Ủy quyền**.
- **Nút VI / EN / KO** ở màn đăng nhập và trong ứng dụng để đổi ngôn ngữ giao diện.
- Trên **màn hình hẹp / điện thoại**, các khối dài (bộ lọc, thông tin đơn) tự thu gọn lại — bấm vào
  hàng tiêu đề để mở ra.

---

## 2. Vai trò NHÂN VIÊN — gửi và theo dõi đơn của mình
<!-- seen-by: all -->

### 2.1. Tạo đơn mới

Mục đích: gửi yêu cầu (nghỉ phép, làm thêm giờ, mua sắm, công tác…) vào luồng duyệt.

![Ba bước tạo đơn mới](/docs/img/tao-don.svg)

Vào menu **Đơn từ → Đơn từ cá nhân**, bấm nút **Tạo đề xuất mới**. Hộp thoại **Tạo Đề Xuất Mới** mở ra:

1. **Loại Đề Xuất**: chọn loại đơn bạn cần. Chọn xong, biểu mẫu động của loại đơn đó tự hiện các ô cần
   điền (ví dụ Từ ngày / Đến ngày / Tổng số ngày với đơn nghỉ phép).
2. **Phòng ban nhận đơn**: nếu bạn thuộc nhiều phòng ban (chính hoặc kiêm nhiệm), hệ thống yêu cầu chọn
   phòng ban nhận đơn.
3. **Điền biểu mẫu**: nhập đầy đủ các ô có dấu `*`. Ô ngày tháng chọn bằng lịch bấm sẵn.
4. **Xem luồng duyệt dự kiến**: khối **Luồng phê duyệt dự kiến** ở cuối hộp thoại cho biết đơn của bạn
   sẽ đi qua những ai. Bấm **Bấm vào đây để xem chi tiết luồng** để mở sơ đồ đầy đủ: người gửi → từng
   cấp duyệt → hoàn tất, kèm dòng **Đường đi của đơn** tóm tắt.
5. **Lý do / Mô tả**: ghi rõ lý do để người duyệt dễ quyết định.
6. Bấm **Gửi yêu cầu**.

**Kết quả:** đơn chuyển trạng thái **Chờ duyệt**; người duyệt bước 1 nhận thông báo ngay (trong hệ thống
+ Telegram nếu họ đã kết nối).

> Hộp thoại tạo đơn chỉ có 2 nút: **Hủy** và **Gửi yêu cầu** — không có nút lưu nháp. Đơn chỉ được lưu ở
> trạng thái **Bản nháp** khi việc tải tệp đính kèm thất bại (xem mục 2.4).

#### Kiểm tra lại trước khi gửi

- Các ô có dấu `*` đã điền đủ chưa; ngày tháng đúng khoảng bạn muốn nghỉ / công tác chưa.
- Mở sơ đồ luồng một lần cuối: đúng người duyệt, đúng số cấp chưa.
- Đính kèm tài liệu minh họa (nếu loại đơn cho phép) để người duyệt không phải hỏi lại.

### 2.2. Chọn người duyệt khi bước 1 có nhiều ứng viên

![Ba bước chọn người duyệt khi bước đầu có nhiều người](/docs/img/chon-nguoi-duyet.svg)

- Nếu bước 1 của luồng có **nhiều người có thể duyệt**, hệ thống **bắt buộc** bạn chọn 1 người trong ô
  **Chọn người duyệt**. Đơn **không** tự chia cho tất cả mọi người.
- Nếu luồng đã chỉ định sẵn **đúng 1 người**, tên người đó hiện sẵn và ô chọn không xuất hiện.
- Thấy sai người duyệt? Đó là vấn đề **cấu hình luồng**, không phải lỗi của bạn — báo quản trị viên
  xem mục 5.3.

### 2.3. Theo dõi đơn và luồng duyệt

![Ba bước theo dõi đơn: tab trạng thái, thẻ đơn, chi tiết đơn](/docs/img/theo-doi-don.svg)

1. Vào **Đơn từ → Đơn từ cá nhân**. Các tab trạng thái: **Tất cả**, **Chờ duyệt**, **Cần bổ sung**,
   **Đã phê duyệt**, **Từ chối**. Có ô tìm kiếm và bộ lọc theo **phòng ban** / **loại đơn**.
2. Trên mỗi thẻ đơn bạn thấy ngay: loại đơn, mã đơn, nhãn màu trạng thái, **bước hiện tại / tổng số
   bước** và tên người đang chờ duyệt. Bấm **Xem chi tiết luồng duyệt** để mở sơ đồ các bước duyệt
   **ngay trong danh sách** (nút đổi thành **Ẩn chi tiết luồng duyệt** để đóng lại).
3. Bấm vào thẻ đơn để mở **màn chi tiết**: nội dung đơn đã điền, tài liệu đính kèm, khung **bình luận**
   (gõ `@` để nhắc tên người), và **tiến trình xử lý** từng cấp (ai duyệt, thời điểm nào).
4. Bạn nhận thông báo **mỗi khi đơn chuyển bước**: ai vừa duyệt và bước kế tiếp là ai.

### 2.4. Bổ sung hồ sơ khi được yêu cầu

![Ba bước bổ sung hồ sơ và ba bước hủy đơn](/docs/img/sua-va-huy-don.svg)

1. Đơn bị yêu cầu bổ sung sẽ có nhãn màu **Yêu cầu bổ sung** trong danh sách, kèm thông báo Telegram
   (nếu bạn đã kết nối). Tab **Cần bổ sung** gom riêng các đơn này.
2. Mở đơn → bấm **Bổ sung** → hộp thoại **Bổ Sung Đơn Từ** mở ra → cập nhật trường / tệp còn thiếu
   theo đúng nội dung người duyệt yêu cầu.
3. Bấm **Bổ sung & gửi lại**.

**Kết quả:** đơn quay về trạng thái **Chờ duyệt** tại **đúng bước đang dở** (không phải duyệt lại từ
đầu); người duyệt ở bước đó nhận thông báo.

> **Tệp đính kèm tải lên thất bại:** hệ thống **vẫn lưu đơn ở trạng thái Bản nháp** và hỏi bạn xử lý:
> **Ở lại chỉnh sửa** · **Thử tải lại** · **Gửi không kèm tệp**. Đơn không bao giờ bị gửi âm thầm mà
> thiếu tài liệu.

### 2.5. Hủy đơn

**Chỉ hủy được khi chưa có ai duyệt.** Nút **Hủy đơn** chỉ xuất hiện khi đơn còn ở **Chờ duyệt** /
**Cần bổ sung** / **Bản nháp** và bạn là người tạo đơn. Đã có người duyệt xong bước nào thì nút biến mất.

1. Mở đơn → bấm **Hủy đơn**.
2. Hộp thoại **Hủy đơn này?** hiện ra: nhập **Lý do hủy** — ô này **không bắt buộc** (tối đa 1000 ký tự)
   nhưng nên ghi để người duyệt hiểu vì sao đơn biến mất.
3. Bấm **Xác nhận hủy đơn** (hoặc **Giữ đơn** để thoát). Thao tác này **không thể hoàn tác**.

**Kết quả:** đơn chuyển trạng thái **Đã hủy**. Người đang chờ duyệt đơn cũng nhận thông báo.

### 2.6. Nhận thông báo

![Hai kênh nhận thông báo: chuông trong hệ thống và Telegram](/docs/img/thong-bao.svg)

- **Trong web:** chuông ở sidebar (máy tính) hoặc góc trên phải (điện thoại). **Chấm đỏ** là số thông
  báo chưa đọc; bấm một dòng để mở đúng trang liên quan.
- **Telegram** (nếu đã kết nối): mọi sự kiện của đơn — đến lượt duyệt, sắp hết hạn, quá hạn chuyển
  duyệt thay, duyệt / từ chối / yêu cầu bổ sung, đơn bị hủy — kèm link **Xem chi tiết** bấm là mở thẳng
  trang đơn trên hệ thống. Mật khẩu tạm khi Nhân sự đặt lại mật khẩu cũng được gửi qua đây.

Cách kết nối Telegram: xem mục **6**.

---

## 3. Vai trò NGƯỜI DUYỆT — xử lý đơn đến lượt mình
<!-- seen-by: approver -->

### 3.1. Xem hàng chờ duyệt

![Ba bước xem hàng chờ duyệt và mở đơn cần xử lý](/docs/img/hang-cho-duyet.svg)

1. Vào menu **Đơn từ → Đơn chờ tôi duyệt**.
2. Danh sách gồm đơn **đến lượt bạn** và cả đơn **được ủy quyền cho bạn** trong thời gian hiệu lực.
3. Mỗi thẻ đơn hiển thị: mẫu đơn, người tạo, bước hiện tại và **hạn duyệt còn lại**.
4. Bấm vào thẻ đơn để mở: biểu mẫu đã điền, tài liệu đính kèm, lịch sử và tiến trình xử lý.

**Cách nhanh nhất:** bấm link **Xem chi tiết** trong tin Telegram để mở thẳng đơn, khỏi lật danh sách.

### 3.2. Ba thao tác trên một đơn

![Ba thao tác của người duyệt: duyệt, từ chối, yêu cầu bổ sung](/docs/img/thao-tac-duyet.svg)

| Thao tác | Điều kiện | Kết quả |
|---|---|---|
| **Duyệt yêu cầu** | Không cần ghi gì thêm | Đơn sang **bước kế tiếp**; nếu là bước cuối thì chuyển **Đã phê duyệt**. Người tạo và người duyệt kế tiếp nhận thông báo. |
| **Từ chối** | **Bắt buộc nhập lý do** — ô trống thì không gửi được (tối đa 1000 ký tự) | Đơn chuyển **Từ chối**; người tạo nhận được **lý do** bạn ghi. |
| **Yêu cầu bổ sung** | **Bắt buộc nêu rõ cần bổ sung gì** | Đơn chuyển **Yêu cầu bổ sung** về người tạo và **giữ nguyên bước đang dở**; bạn duyệt tiếp sau khi họ gửi lại. |

> Một bước duyệt chỉ có **ba** thao tác này. Không có "chuyển sang người duyệt khác", không có "sửa
> nội dung đơn hộ người tạo".
>
> Lý do từ chối là **bắt buộc cố định** ở mọi bước — hệ thống không cho tắt quy tắc này.

### 3.3. Bình luận và nhắc tên người trong đơn

![Gõ @ để nhắc tên người trong khung bình luận](/docs/img/binh-luan.svg)

- Trong màn chi tiết đơn có khung **bình luận** để trao đổi với người tạo và các cấp duyệt khác.
- Gõ `@` để mở danh sách người dùng và nhắc tên — người được nhắc nhận thông báo **"Có bình luận mới"**.
- Mọi bình luận hiện trong mục tiến trình của đơn, **các cấp duyệt đều đọc được**.

**Mẹo:** dùng bình luận để hỏi thêm thay vì từ chối vội. Người tạo bổ sung được thì đơn đi tiếp nhanh hơn.

### 3.4. Ủy quyền tạm thời khi vắng mặt

Mục đích: đi vắng dài ngày mà đơn không bị dồn ứ.

![Ba bước tạo ủy quyền tạm thời](/docs/img/uy-quyen-tam-thoi.svg)

1. Vào menu **Ủy quyền → Ủy quyền tạm thời**, bấm **Tạo ủy quyền**.
2. Điền **3 thông tin bắt buộc**: **người được ủy quyền** · **khoảng thời gian** từ ngày đến ngày ·
   **lý do** ủy quyền.
3. Trong thời gian hiệu lực, đơn đáng lẽ tới bạn sẽ do **người được ủy quyền** xử lý và hệ thống ghi rõ
   đang **duyệt thay cho ai**.

Kết thúc sớm bất cứ lúc nào bằng **Đổi người** hoặc **Thu hồi**. Hết thời gian thì quyền **tự trở về** bạn.

### 3.5. Cài người duyệt thay khi quá hạn

Mục đích: khi bạn để đơn quá hạn, hệ thống chuyển đơn cho một người bạn tin cậy thay vì hủy đơn.

![Ba bước cài người duyệt thay mặc định](/docs/img/duyet-thay-qua-han.svg)

1. Vào menu **Ủy quyền → Duyệt thay quá hạn**.
2. Bấm **Cài người duyệt thay** (hoặc **Đổi người** nếu đã cài), chọn người rồi bấm **Lưu người duyệt thay**.
3. Khi đơn bạn duyệt bị quá hạn và bước duyệt bật hành động **"Duyệt theo ủy quyền quá hạn"**, đơn tự
   chuyển cho người này với một khoảng thời gian mới.

**Cần biết:**

- Mỗi người chỉ cài được **một** người duyệt thay; lưu mới sẽ **ghi đè** cấu hình cũ.
- Cấu hình này áp dụng cho **mọi đơn bạn duyệt**, không cài riêng theo từng cấp duyệt.
- **Chưa cài** người duyệt thay thì đơn quá hạn của bạn sẽ **bị hủy**.
- Mọi lần chuyển đơn quá hạn và duyệt thay đều được ghi vào **nhật ký hệ thống**.

### 3.6. Điều gì xảy ra khi đơn quá hạn

![Vòng đời xử lý quá hạn của một bước duyệt](/docs/img/qua-han.svg)

**Trước hạn:** người duyệt hiện tại nhận nhắc **"Sắp hết hạn duyệt đơn"** kèm link xem đơn.

> Hệ thống nhắc **đúng 1 lần cho mỗi bước**, không nhắc lại — đây là chủ đích chống spam tin nhắn.
> Muốn hệ thống nhắc lại thì phải chờ đơn chuyển sang **bước duyệt mới**.

**Quá hạn mà chưa duyệt:** hệ thống **tự xử lý** theo hành động cấu hình ở bước, có **2 khả năng**:

1. **Trả đơn về nơi khởi tạo** — đơn bị trả về người gửi.
2. **Duyệt theo ủy quyền quá hạn** — đơn chuyển cho **người duyệt thay** mà người duyệt bước này đã cài
   ở màn **Duyệt thay quá hạn** (mục 3.5).

**Quá hạn lần thứ hai:** nếu người duyệt thay **cũng** để quá hạn thì đơn **bị hủy** và trả về người tạo.
Chưa cài người duyệt thay cũng bị hủy như vậy.

Các bên liên quan nhận thông báo Telegram: **"Đơn quá hạn đã chuyển người duyệt thay"** hoặc
**"Đơn đã bị hủy, trả về bạn"**.

> Hành động "tự động chuyển **lên cấp trên**" **không có trên giao diện** cấu hình bước. Nếu nghiệp vụ
> cần, liên hệ quản trị viên xem mục 5.4.

---

## 4. Vai trò NHÂN SỰ (HR) — quản lý con người và tài khoản
<!-- seen-by: hr-admin -->

### 4.1. Xem, tìm và lọc danh sách nhân sự

![Ba bước làm việc trên màn Nhân sự](/docs/img/nhan-su.svg)

1. Vào menu **Nhân sự**: danh sách nhân viên kèm ô tìm kiếm (tên, mã nhân sự, email…) và bộ lọc theo
   **phòng ban** / **trạng thái tài khoản**.
2. Bấm vào một nhân sự để mở **hồ sơ chi tiết**: thông tin liên hệ, phòng ban – chức vụ chính, các vị
   trí **kiêm nhiệm**, vai trò hệ thống, và **lịch sử chức vụ** theo thời gian.
3. Khi nhân viên nghỉ việc, bấm **Khóa tài khoản** trong hồ sơ — trạng thái chuyển **Ngừng hoạt động**.

> Hệ thống **không có thao tác xóa nhân sự**. Tài khoản chỉ bị **khóa** để đơn cũ và lịch sử duyệt còn
> nguyên. Tài khoản bị khóa không đăng nhập được, nhưng vẫn hiện trong báo cáo cũ.

### 4.2. Tạo tài khoản nhân viên và gắn vào phòng ban

![Năm bước tạo tài khoản nhân viên mới](/docs/img/tao-tai-khoan.svg)

1. Ở màn **Nhân sự**, bấm **Tạo tài khoản nhân viên** — form tạo mới hiện ra.
2. Điền **Họ và tên**, **Email làm việc** (dùng để đăng nhập), **Số điện thoại**.
3. Chọn **Phòng ban công tác** và **Chức vụ chính** — **đây chính là bước gắn nhân viên vào phòng ban**.
   Kiêm nhiệm nhiều vị trí thì bấm **+ Thêm vị trí kiêm nhiệm** và đánh dấu vị trí **Chính**.
4. Chọn **vai trò hệ thống**, quyết định menu và quyền hạn của người đó. Các vai trò thường dùng:
   **Nhân viên** (STAFF) · **Trưởng nhóm** (TEAM_LEADER) · **Quản lý** (MANAGER) · **Nhân sự** (HR) ·
   **Quản trị viên** (ADMIN).
   > Danh sách vai trò lấy từ hệ thống nên có thể có thêm vai trò khác (Giám đốc, Giám sát, Ban giám đốc…)
   > tùy cấu hình thực tế.
5. Bấm **Lưu** — hệ thống tạo tài khoản kèm **mật khẩu tạm** hiển thị cho bạn đọc lại; nhân viên **bắt
   buộc đổi mật khẩu ở lần đăng nhập đầu tiên**.

### 4.3. Đặt lại mật khẩu khi nhân viên quên

![Ba bước đặt lại mật khẩu cho nhân viên](/docs/img/dat-lai-mat-khau.svg)

1. Vào **Nhân sự** → mở hồ sơ nhân viên → bấm **Đặt lại mật khẩu** (chỉ hiện khi tài khoản còn hoạt động;
   tài khoản đã khóa thì phải mở khóa trước).
2. Hệ thống **tự sinh mật khẩu tạm** — bạn không tự đặt. Mật khẩu tạm hiện **trên màn hình HR** và
   **gửi thẳng vào Telegram của nhân viên** (nếu họ đã kết nối).
3. Nhân viên đăng nhập bằng email + mật khẩu tạm và **bị bắt buộc đổi mật khẩu mới ngay** (mục 1.2).

### 4.4. Phòng ban & Nhóm

![Cây tổ chức và cách thêm thành viên vào phòng ban](/docs/img/phong-ban-nhom.svg)

- Menu **Phòng ban & Nhóm** hiển thị **cây cơ cấu tổ chức** nhiều cấp (Ban → Phòng → Nhóm) và các nhóm
  nghiệp vụ. Mọi vai trò đều xem được.
- Bấm một phòng ban để xem thành viên, đơn từ trong phòng và **báo cáo riêng của phòng đó**.
- Thêm thành viên: mở thẻ phòng ban / nhóm → ở bảng thành viên bấm thêm → chọn nhân viên → đặt
  **Chính / Kiêm nhiệm** cho từng vị trí. **Cấp quản lý trực tiếp dùng cho luồng duyệt được suy ra từ
  chính ô vị trí này.**
- Muốn chuyển nhân viên sang phòng ban khác: sửa vị trí ở màn **Nhân sự**, hoặc xóa khỏi nhóm rồi thêm
  vào nhóm mới.

### 4.5. Báo cáo và xuất Excel

![Trang báo cáo và xuất Excel](/docs/img/bao-cao.svg)

1. Vào menu **Báo Cáo** (quyền HR / Quản trị).
2. Dùng thanh bộ lọc: **khoảng ngày**, **khối**, **phòng ban**, **loại đơn**, **chức vụ**. Trên điện thoại
   bấm hàng **Bộ lọc** để mở / đóng khu lọc cho đỡ chật màn hình.
3. Các khối số liệu: thẻ tổng quan, **xu hướng 12 tháng** (chuyển chế độ **Tổng hợp** / **Theo loại đơn**),
   phân bổ theo loại đơn & phòng ban, so sánh phòng ban / chức vụ, và bảng điều hành.
4. Bấm nút **Excel** ở từng bảng để xuất **đúng phần đang xem** ra file tải về, hoặc bấm
   **Xuất Báo Cáo** để chọn phạm vi xuất chi tiết hơn.
5. Bảng chi tiết cho phép bấm **xem chi tiết từng dòng** theo từng đơn.

---

## 5. Vai trò QUẢN TRỊ (ADMIN) — cấu hình hệ thống
<!-- seen-by: hr-admin -->

> Thứ tự cấu hình đúng khi thêm một loại đơn mới:
> **5.1 Mẫu đơn & Form** → **5.2 Chức vụ** (nếu thiếu) → **5.3 Luồng duyệt** → **5.4 cấu hình quá hạn**
> → thử bằng **1 đơn thật** → kiểm tra thông báo Telegram.

### 5.1. Mẫu đơn & Form

![Ba bước tạo mẫu đơn và soạn các ô cần điền](/docs/img/mau-don.svg)

1. Vào **Cấu hình → Mẫu đơn & Form**, tạo mẫu đơn mới: **tên**, **mã**, **nhóm mẫu đơn**.
2. Bấm biểu tượng **bút** trên thẻ mẫu đơn để mở màn soạn các ô cần điền.
3. Thêm ô: chọn **kiểu dữ liệu** trong 6 kiểu — **Văn bản** · **Số** · **Lựa chọn**
   (dropdown / radio / checkbox) · **Ngày** · **Tải file** · **Người duyệt thay**. Đặt tên ô và bật
   **bắt buộc** nếu cần (ô bắt buộc hiện dấu `*` cho người tạo đơn).
4. Với kiểu **Tải file** bạn gắn được **file template biểu mẫu in** để nhân viên tải về dùng.
5. **Kéo đổi thứ tự** các ô rồi lưu. Biểu mẫu mới chỉ áp dụng cho **đơn tạo sau đó** — đơn cũ giữ nguyên
   nội dung.

> **Chưa gán luồng duyệt thì mẫu đơn chưa dùng được.** Làm tiếp mục 5.3.
>
> **Ghi chú kỹ thuật:** giao diện **không cho đặt "khóa" cho ô nhập** (mã ô được sinh tự động). Vì vậy
> điều kiện rẽ nhánh theo **hình thức nghỉ** hoặc **số giờ OT** hiện **không cấu hình được trên giao
> diện** — xem ghi chú ở mục 5.3.

### 5.2. Chức vụ & cấp bậc

![Thang cấp bậc dùng làm mốc duyệt và một người nhiều vị trí](/docs/img/chuc-vu.svg)

- Vào **Cấu hình → Chức vụ & cấp bậc** để khai báo các chức vụ dùng làm **mốc duyệt** trong luồng:
  Trưởng ca, Trưởng nhóm, Phó phòng, **Trưởng phòng**, **Cửa hàng trưởng**, Quản lý chi nhánh,
  Quản lý khu vực, Giám đốc khối…
- Khối **Cửa hàng** dùng nhóm mốc khác khối **Văn phòng**. Khai báo sai chức vụ ở đây sẽ làm luồng duyệt
  chọn **nhầm người** — kiểm tra trước khi dùng thật.
- Một nhân sự có thể giữ **nhiều vị trí** (chính + kiêm nhiệm). Luồng duyệt theo "cấp quản lý trực tiếp"
  lấy cấp trên từ **vị trí CHÍNH** của nhân viên.

### 5.3. Luồng duyệt cho từng loại đơn

![Sơ đồ luồng duyệt nhiều cấp](/docs/img/luong-duyet.svg)

Vào menu **Cấu hình → Luồng duyệt**. **Mỗi loại đơn có luồng riêng**, dùng riêng cho khối **Văn phòng**,
khối **Cửa hàng** hoặc **dùng chung** cho cả hai. Mỗi luồng gồm nhiều **bước duyệt** xếp theo thứ tự.

1. Chọn **mẫu đơn** ở hộp chọn đầu màn hình.
2. Bấm **Thêm bước duyệt tiếp theo** rồi cấu hình bước đó.
3. Bấm **Lưu cấu hình luồng duyệt**.

#### Bốn nhóm thiết lập của một bước duyệt

![Bốn nhóm thiết lập của một bước duyệt](/docs/img/luong-duyet-4-nhom.svg)

**(A) Hình thức duyệt — ai là người duyệt bước này.** Chọn một trong 4 hình thức:

| Hình thức | Ý nghĩa | Khi nào dùng |
|---|---|---|
| **Cấp quản lý trực tiếp** | Cấp trên trực tiếp của người tạo đơn duyệt | Luồng chuẩn theo phòng ban |
| **Chuỗi quản lý liên tiếp** | Duyệt lần lượt từ cấp thấp lên cấp cao | Đơn cần nhiều cấp quản lý ký gần nhau |
| **Duyệt theo sắp xếp** | Chọn quy tắc duyệt + chức vụ hoặc nhóm người cụ thể | Luồng tùy biến theo chức vụ |
| **Chỉ định 1 người cụ thể** | Đơn chỉ gửi đến đúng 1 người được chọn | Đơn đặc thù, người chịu trách nhiệm cố định |

Với hình thức "Cấp quản lý trực tiếp" bạn chọn mốc: **quản lý trực tiếp / phó phòng / trưởng phòng**.
Với "Chuỗi quản lý liên tiếp" bạn chọn **cấp đầu → cấp cuối**. Với "Duyệt theo sắp xếp" bạn chọn
**chức vụ** hoặc **nhóm người cụ thể**.

**(B) Quy tắc khi một bước có nhiều người duyệt** (chỉ dùng cho hình thức "theo sắp xếp"):

- **Duyệt lần lượt**: người trước duyệt xong mới chuyển người sau (hiển thị `A ➔ B ➔ C`). Bắt buộc phải
  chọn danh sách người duyệt **theo thứ tự** — thiếu người thì hệ thống báo lỗi từng bước.
- **Đồng thời — cần tất cả đồng ý**: gửi cho tất cả, đơn chỉ đi tiếp khi đủ **100%** bấm Duyệt.
- **Đồng thời — chỉ cần 1 người**: ai bấm Duyệt trước thì đơn qua bước.

**(C) Xử lý quá hạn** (xem chi tiết ở mục 5.4):

- Bật **Tự động xử lý đơn khi quá thời hạn không duyệt** rồi nhập **số giờ** cho phép (mặc định 12 giờ).
- Chọn **chế độ đếm giờ**: đếm liên tục bất kể ngày đêm, hoặc **chỉ tính giờ hành chính**.
- Chọn **hành động**: **Trả đơn về nơi khởi tạo** hoặc **Duyệt theo ủy quyền quá hạn**.

**(D) Thứ tự bước & phạm vi:**

- **Kéo để đổi thứ tự bước**; gạt công tắc để **tắt** những bước không dùng đến.
- **Phạm vi áp dụng**: tự nhận theo nơi nhân viên làm việc, riêng khối **Văn phòng**, hoặc riêng khối
  **Cửa hàng**, hoặc **dùng chung**.
- **Bắt buộc người từ chối phải ghi lý do**: quy tắc này **luôn bật** và cố định trong hệ thống.

#### Kiểm tra luồng vừa cấu hình

- Bấm **Lưu** — hệ thống kiểm tra lỗi cấu hình (ví dụ bước "Duyệt lần lượt" mà chưa chọn người) và báo rõ
  **từng bước** thiếu gì.
- Thử bằng **1 đơn thật**: mở **Tạo đề xuất mới**, chọn loại đơn vừa cấu hình và xem khối
  **Luồng phê duyệt dự kiến** — sơ đồ phải hiện đúng người / tầng bạn vừa đặt.
- **Sửa luồng chỉ ảnh hưởng đơn tạo mới.** Đơn đang chạy vẫn giữ luồng tại thời điểm gửi.

> **⚠️ Bước chạy có điều kiện — chưa cấu hình được trên giao diện.**
> Hệ thống **có** sẵn cơ chế cho một bước chỉ chạy khi đơn thỏa điều kiện: so sánh **số ngày nghỉ**,
> **hình thức nghỉ** hoặc **số giờ OT** với các phép `>` `>=` `=` `<=` `<` (ví dụ: bước Giám đốc duyệt chỉ
> chạy khi số ngày nghỉ lớn hơn 3). Cơ chế này hiện **chưa có màn hình cấu hình trong ứng dụng**, và
> giao diện cũng không cho đặt "khóa" cho ô nhập (xem mục 5.1). Muốn dùng, liên hệ đội kỹ thuật để cấu
> hình qua API.

### 5.4. Xử lý quá hạn và người duyệt thay

![Hai nhánh xử lý khi bước duyệt quá hạn và chế độ đếm giờ mặc định](/docs/img/xu-ly-qua-han.svg)

**a) Cấu hình quá hạn cho từng bước duyệt** — làm ở màn **Cấu hình → Luồng duyệt**, nhóm **Xử lý quá hạn**
của bước (mục 5.3, nhóm C). Hệ thống chỉ có **2 hành động**:

| Hành động | Hệ thống làm gì |
|---|---|
| **Trả đơn về nơi khởi tạo** | Đơn bị trả về người gửi, họ nhận thông báo "đã hết hạn duyệt". |
| **Duyệt theo ủy quyền quá hạn** | Đơn chuyển cho **người duyệt thay** mà người duyệt bước này đã cài ở màn **Ủy quyền → Duyệt thay quá hạn** (mục 3.5). |

Nếu người duyệt thay **cũng** để quá hạn — hoặc người duyệt **chưa cài** người duyệt thay — thì đơn
**bị hủy** và trả về người tạo.

> **Lưu ý:** lựa chọn "tự động chuyển **lên cấp trên**" **không còn trên giao diện** cấu hình bước. Nếu
> nghiệp vụ bắt buộc phải leo cấp, hãy cấu hình thêm một **bước duyệt** ở cấp trên trong luồng thay vì
> dựa vào hành động quá hạn.

**b) Chế độ đếm giờ mặc định cho toàn hệ thống** — ở **Cấu hình → Chung & Telegram**, khối
**Cách tính 12 giờ quá hạn**: chọn **đếm 12 giờ liên tục** (bất kể ngày đêm) hoặc **chỉ tính thứ 2 → thứ 6
trong giờ hành chính** (bỏ qua cuối tuần và ngày lễ), kèm khai báo **giờ bắt đầu / giờ kết thúc** hành
chính. Từng bước duyệt có thể ghi đè quy tắc này.

### 5.5. Cấu hình Telegram Bot

![Khối Tích hợp Telegram Bot trong màn Cấu hình, cùng hai khối cấu hình chung khác](/docs/img/cau-hinh-he-thong.svg)

1. Vào **Cấu hình → Chung & Telegram**, khối **Tích hợp Telegram Bot**.
2. Ô **Telegram Bot Token** giữ mã bot hiện tại (hiển thị dạng chấm tròn để bảo mật). Dán mã bot mới lấy
   từ **@BotFather** trên Telegram nếu cần đổi.
3. Bấm **Lưu cấu hình**: hệ thống gọi sang Telegram **kiểm tra mã bot** và **tự đăng ký lại đường nhận tin**
   (webhook) trỏ về máy chủ hiện tại — **bắt buộc địa chỉ https**.
4. Nhãn trạng thái ở góc thẻ xác nhận: **Đã kết nối** (xanh) hoặc **Chưa kết nối**. Khi lỗi, thông báo đỏ
   nêu đúng nguyên nhân: sai mã bot, không kết nối được Telegram, hoặc đường nhận tin thiếu địa chỉ https.

**Lưu ý:** đổi sang bot mới thì người dùng **không phải kết nối lại** — liên kết chat đã bind giữ nguyên.

> Không có nút **"gửi tin nhắn thử"** trong màn này. Muốn kiểm tra kênh thông báo, hãy gửi thử **một đơn
> thật** (mục 2.1) hoặc bấm **Kết nối Telegram** ở trang **Tài khoản** (mục 6).

---

## 6. Telegram: kết nối và nhận thông báo
<!-- seen-by: all -->

### 6.1. Kết nối lần đầu

![Kết nối Telegram và nhận thông báo](/docs/img/telegram.svg)

1. Vào trang **Tài khoản**: bấm **tên mình ở góc trái** (sidebar) hoặc ảnh đại diện.
2. Tại dòng chuông thông báo, nếu chưa kết nối sẽ hiện nút **Kết nối Telegram** — bấm nút, hệ thống mở
   ứng dụng Telegram với bot của công ty.
3. Trong Telegram bấm **Start** — bot trả lời **"Kết nối thành công!"** là xong.
4. Quay lại web, **tải lại trang** — dòng chuông chuyển sang chữ xanh **"Đã kết nối Telegram"**.

**Lưu ý về link kết nối:**

- Link kết nối chỉ sống **15 phút** và **dùng được 1 lần**. Bấm lại link cũ sẽ nhận
  **"Link không hợp lệ hoặc đã hết hạn"** — quay lại web bấm **Kết nối Telegram** để lấy link mới.
- Trang **Tài khoản** **không tự động cập nhật** trạng thái kết nối — bạn cần **tải lại trang** sau khi
  bấm Start trong Telegram.

### 6.2. Đổi sang tài khoản Telegram khác

Ngay trang **Tài khoản**, cạnh dòng **Đã kết nối Telegram**, bấm **Đổi kết nối Telegram** → mở link bot và
bấm **Start bằng tài khoản mới**. **Kết nối cũ tự được thay thế.**

### 6.3. Bạn nhận được những tin gì

- Đơn của bạn được **duyệt** / bị **từ chối** / **cần bổ sung** / bị **hủy**.
- Có đơn **mới chờ bạn duyệt**, đơn **sắp hết hạn**, đơn **quá hạn bị chuyển** hoặc **bị hủy**.
- **Mật khẩu tạm** khi Nhân sự đặt lại mật khẩu cho bạn.
- Có **bình luận mới** hoặc bạn được **nhắc tên** bằng `@` trong một đơn.
- Mọi tin đều có link **Xem chi tiết** bấm là mở đúng trang liên quan; tên đơn và tên người được **in đậm**.

---

## 7. Câu hỏi thường gặp khi sử dụng (FAQ)
<!-- seen-by: all -->

**Hỏi: Vì sao sơ đồ luồng hiện chữ "Người duyệt" thay vì tên người?**
Đáp: Với luồng "chỉ định 1 người" hoặc luồng có nhiều ứng viên, tên chỉ hiện khi hệ thống đã chọn hoặc
bạn đã chọn người cụ thể. Hãy chọn trong ô **Chọn người duyệt** rồi mở lại sơ đồ. Nếu vẫn sai, báo quản
trị viên kiểm tra cấu hình luồng (mục 5.3).

**Hỏi: Tôi không nhận được tin Telegram?**
Đáp: Kiểm tra trang **Tài khoản** đã hiện **Đã kết nối Telegram** chưa (nhớ tải lại trang); nếu chưa thì
kết nối lại (mục 6.1). Nếu đã kết nối mà vẫn không có tin, báo quản trị viên kiểm tra cấu hình bot (mục 5.5).

**Hỏi: Người dùng bấm Start mà không nhận "Kết nối thành công"?**
Đáp: Kiểm tra dòng **Đã kết nối** ở **Cấu hình → Chung & Telegram** (mã bot còn đúng không), bấm **Lưu cấu
hình** để đăng ký lại đường nhận tin. Hoặc link đã hết 15 phút — bấm **Kết nối Telegram** trên trang **Tài
khoản** để lấy link mới.

**Hỏi: Vì sao người duyệt chỉ bị nhắc hết hạn đúng 1 lần?**
Đáp: Đây là **chủ đích chống spam tin nhắn**. Hệ thống chỉ nhắc lại khi đơn chuyển sang **bước duyệt mới**.

**Hỏi: Đơn tôi duyệt biến mất khỏi danh sách chờ?**
Đáp: Có thể đơn đã bị **người gửi hủy**, bị **quá hạn chuyển cho người khác**, hoặc đã được **người duyệt
cùng cấp xử lý trước bạn** (với quy tắc "chỉ cần 1 người").

**Hỏi: Quên mật khẩu thì làm sao?**
Đáp: Nhờ **Nhân sự đặt lại mật khẩu** (mục 4.3). Bạn nhận mật khẩu tạm qua Telegram hoặc trực tiếp, đăng
nhập và **bắt buộc đổi mật khẩu mới ngay** (mục 1.2).

**Hỏi: Giờ trong log hoặc trong cơ sở dữ liệu lệch 7 tiếng so với màn hình?**
Đáp: Hệ thống **lưu giờ theo UTC**, giao diện **hiển thị theo giờ địa phương của máy bạn (GMT+7)**. Đây là
chuẩn, không phải lỗi.

**Hỏi: Muốn đơn đi thêm một cấp duyệt nữa thì sửa ở đâu?**
Đáp: Quản trị viên vào **Cấu hình → Luồng duyệt**, chọn đúng mẫu đơn, bấm **Thêm bước duyệt tiếp theo** rồi
cấu hình hình thức duyệt cho bước mới (mục 5.3).

**Hỏi: Thêm một loại đơn mới cần làm gì?**
Đáp: Tạo **mẫu đơn + các ô cần điền** (mục 5.1) → tạo **luồng duyệt mặc định** với các bước (mục 5.3) →
**thử bằng 1 đơn thật** → **kiểm tra thông báo Telegram** (mục 6).

**Hỏi: Đơn đang chạy có bị ảnh hưởng khi sửa luồng duyệt?**
Đáp: **Không.** Đơn giữ nguyên luồng tại thời điểm gửi; luồng mới chỉ áp dụng cho đơn tạo sau đó.

---

## Phụ lục A. Menu nào ai thấy
<!-- seen-by: all -->

| Menu | Nhân viên | Người duyệt | HR | Quản trị |
|---|:--:|:--:|:--:|:--:|
| Phòng ban & Nhóm | ✅ | ✅ | ✅ | ✅ |
| Đơn từ → Đơn từ cá nhân | ✅ | ✅ | ✅ | ✅ |
| Đơn từ → Đơn chờ tôi duyệt | ❌ | ✅ | ✅ | ✅ |
| Ủy quyền (Ủy quyền tạm thời · Duyệt thay quá hạn) | ❌ | ✅ | ✅ | ✅ |
| Nhân sự | ❌ | ❌ | ✅ | ✅ |
| Báo Cáo | ❌ | ❌ | ✅ | ✅ |
| Cấu hình | ❌ | ❌ | ✅ | ✅ |
| Hướng dẫn | ✅ | ✅ | ✅ | ✅ |
| Tài khoản (bấm tên mình) | ✅ | ✅ | ✅ | ✅ |

## Phụ lục B. Trạng thái đơn và màu nhãn
<!-- seen-by: all -->

| Nhãn trên thẻ đơn | Ý nghĩa | Màu |
|---|---|---|
| **Bản nháp** | Đơn chưa gửi (chỉ xảy ra khi tải tệp đính kèm thất bại) | Xám |
| **Đã gửi (Chờ duyệt)** / **Đang chờ duyệt** | Đơn đang chờ ai đó duyệt | Vàng |
| **Yêu cầu bổ sung** | Người duyệt cần bạn bổ sung thêm — đơn vẫn ở bước đang dở | Tím |
| **Đã phê duyệt** | Đã qua hết các bước duyệt | Xanh lá |
| **Từ chối / Trả về** | Bị từ chối, hoặc bị trả về khi quá hạn | Đỏ |
| **Đã hủy** | Người tạo tự hủy, hoặc quá hạn hai lần nên hệ thống hủy | Xám đậm |

> Tab lọc trong danh sách dùng tên ngắn hơn: **Tất cả · Chờ duyệt · Cần bổ sung · Đã phê duyệt · Từ chối**.

## Phụ lục C. Những thao tác KHÔNG có trong hệ thống
<!-- seen-by: all -->

Đừng mất thời gian đi tìm những nút này — chúng không tồn tại:

- **Lưu nháp đơn** trong hộp thoại tạo đơn (chỉ có **Hủy** và **Gửi yêu cầu**).
- **Gửi tin nhắn thử** trong màn cấu hình Telegram.
- **Nút "Kiểm tra & Lưu kết nối"** — nút thật tên là **Lưu cấu hình**.
- **Chuyển đơn lên cấp trên khi quá hạn** — giao diện chỉ có 2 hành động (mục 5.4).
- **Cấu hình bước chạy có điều kiện** theo số ngày nghỉ / hình thức nghỉ / số giờ OT (mục 5.3).
- **Cài người duyệt thay riêng theo từng cấp duyệt** — chỉ cài được một người cho toàn bộ đơn bạn duyệt.
- **Xóa nhân sự** — chỉ **khóa tài khoản**.
- **Đặt mật khẩu mới cho nhân viên bằng tay** — hệ thống tự sinh mật khẩu tạm.
- **Màn hình "Chức danh"** — mục đó tên đúng là **Cấu hình → Chức vụ & cấp bậc**.
- **Màn hình "Mẫu đơn"** — mục đó tên đúng là **Cấu hình → Mẫu đơn & Form**.

---

*KMart — Software User Guides*
