# Hướng dẫn sử dụng hệ thống KMart

> Tài liệu dành cho **người dùng cuối và quản trị viên**: cách tạo đơn, duyệt đơn, cấu hình luồng
> duyệt (flow), dùng Telegram, ủy quyền và xem báo cáo. Mỗi mục ghi rõ đường dẫn trên menu để bạn
> bấm theo là làm được ngay.

---

## 1. Bắt đầu nhanh

- **Đăng nhập** bằng email công ty và mật khẩu do Nhân sự cấp.
- Menu chính nằm bên trái gồm: **Phòng ban & Nhóm**, **Nhân sự**, **Đơn từ**, **Báo Cáo**,
  **Ủy quyền**, **Cấu hình**, **Hướng dẫn** (một số mục chỉ hiện theo quyền của bạn).
- Nút **VI / EN / KO** ở góc màn hình để đổi ngôn ngữ giao diện.
- Chuông góc trên phải là **thông báo trong hệ thống**; các thông báo quan trọng đồng thời được
  gửi vào **Telegram** nếu bạn đã kết nối.

### Lần đầu đăng nhập sau khi được cấp lại mật khẩu

Nếu Nhân sự vừa đặt lại mật khẩu cho bạn, hệ thống sẽ mở màn **Đổi mật khẩu bắt buộc**:

1. Ô **Mật khẩu tạm hiện tại**: nhập mật khẩu tạm Nhân sự cấp (nhận qua Telegram hoặc trực tiếp).
2. Ô **Mật khẩu mới** và **Nhập lại mật khẩu mới**: đặt mật khẩu mới của bạn.
3. Mật khẩu mới phải đủ 5 điều kiện hiển thị ngay dưới ô nhập: tối thiểu 8 ký tự, có chữ hoa,
   có chữ thường, có chữ số, có ký tự đặc biệt.
4. Bấm **Đổi mật khẩu và tiếp tục** để vào hệ thống. Nếu nhập chưa đúng, màn hình sẽ báo lỗi cụ thể
   ngay dưới ô liên quan (ví dụ "Mật khẩu xác nhận không khớp").

---

## Toàn cảnh chức năng theo từng menu

Bảng dưới đây tóm tắt mỗi mục trên menu dùng để làm gì và ai thấy nó, để bạn biết mình cần vào đâu:

| Menu | Dùng để làm gì | Ai thấy |
|---|---|---|
| **Phòng ban & Nhóm** | Xem sơ đồ tổ chức, thông tin & thành viên từng phòng ban, đơn từ trong phòng | Mọi người |
| **Nhân sự** | Danh sách nhân viên, tạo tài khoản, đặt lại mật khẩu, phân vai trò | HR / Admin |
| **Đơn từ → Đơn từ cá nhân** | Tạo đơn mới, theo dõi đơn của mình, bổ sung hoặc hủy đơn | Mọi người |
| **Đơn từ → Đơn chờ tôi duyệt** | Xử lý đơn đến lượt mình: duyệt, từ chối, yêu cầu bổ sung, bình luận | Người có quyền duyệt |
| **Báo Cáo** | Số liệu tổng quan, xu hướng 12 tháng, phân bổ theo loại đơn/phòng ban, xuất Excel | HR / Admin |
| **Ủy quyền → Ủy quyền tạm thời** | Giao quyền duyệt cho người khác trong khoảng thời gian bạn vắng mặt | Người có quyền duyệt |
| **Ủy quyền → Duyệt thay khi quá hạn** | Cài người duyệt thay mặc định khi đơn bạn duyệt bị quá hạn | Người có quyền duyệt |
| **Cấu hình → Biểu mẫu / Luồng duyệt / Chức vụ** | Thiết kế form đơn, dựng luồng duyệt từng loại đơn, quản lý chức vụ | Admin |
| **Cấu hình → Chung & Telegram** | Cấu hình bot Telegram, webhook, thông số hệ thống | Admin |
| **Tài khoản** (bấm tên mình) | Xem hồ sơ cá nhân, kết nối / đổi Telegram, sửa thông tin liên hệ | Mọi người |
| **Hướng dẫn** | Chính trang tài liệu bạn đang đọc | Mọi người |

**Gợi ý theo vai trò:** nhân viên mới chỉ cần đọc mục 1–3; người duyệt đọc thêm mục 3.2 và 6;
quản trị viên đọc kỹ mục 4 và 5.4; HR đọc mục 7.

---

## 2. Tạo một đơn mới (step-by-step)

![Ba bước tạo đơn mới](/docs/img/tao-don.svg)

Vào menu **Đơn từ → Đơn từ cá nhân**, bấm nút **Tạo đề xuất mới**. Hộp thoại **Tạo Đề Xuất Mới** mở ra:

1. **Loại Đề Xuất**: chọn loại đơn bạn cần (nghỉ phép, làm thêm, mua sắm, công tác...).
   Chọn xong, biểu mẫu động của loại đơn đó tự hiện các ô cần điền (ví dụ Từ ngày / Đến ngày /
   Tổng số ngày với đơn nghỉ phép).
2. **Điền biểu mẫu**: nhập đầy đủ các ô có dấu `*`. Ô ngày tháng chọn bằng lịch bấm sẵn.
3. **Xem luồng duyệt dự kiến**: khối **Luồng phê duyệt dự kiến** ở cuối hộp thoại cho biết đơn của
   bạn sẽ đi qua những ai. Bấm **Bấm vào đây để xem chi tiết luồng** (hoặc **Xem chi tiết luồng**) để
   mở sơ đồ đầy đủ: người gửi → từng cấp duyệt → hoàn tất, kèm dòng **Đường đi của đơn** tóm tắt.
4. **Người duyệt (chỉ định)**: nếu bước 1 của luồng có nhiều người có thể duyệt, hệ thống bắt buộc
   bạn chọn 1 người trong ô **Chọn người duyệt**. Nếu luồng chỉ định sẵn 1 người thì tên người đó
   hiện sẵn, bạn không cần chọn.
5. **Lý do / Mô tả**: ghi rõ lý do để người duyệt dễ quyết định.
6. Bấm **Gửi yêu cầu**. Đơn chuyển sang trạng thái chờ duyệt và người duyệt cấp 1 nhận thông báo
   ngay (trong hệ thống + Telegram).

**Mẹo:** trước khi gửi, hãy mở sơ đồ luồng để chắc chắn đơn đi đúng người bạn mong muốn; nếu thấy
sai người duyệt, đó là vấn đề cấu hình luồng — báo quản trị viên xem mục 4.

### Kiểm tra lại trước khi gửi

- Các ô có dấu `*` đã điền đủ chưa; ngày tháng đúng khoảng bạn muốn nghỉ / công tác chưa.
- Mở sơ đồ luồng một lần cuối: đúng người duyệt, đúng số cấp chưa.
- Đính kèm tài liệu minh họa (nếu loại đơn cho phép) để người duyệt không phải hỏi lại.

### Sau khi gửi thì sao

- Đơn chuyển sang tab **Chờ duyệt**; người duyệt cấp 1 nhận thông báo ngay lập tức.
- Bạn nhận thông báo mỗi khi đơn chuyển bước: ai vừa duyệt và bước kế tiếp là ai.
- Cần gấp? Nhắc người duyệt trực tiếp hoặc qua Telegram; hệ thống cũng tự nhắc khi đơn sắp hết hạn.

---

## 3. Theo dõi và xử lý đơn

### 3.1 Với người gửi đơn

- Vào **Đơn từ → Đơn từ cá nhân**. Các tab trạng thái: **Tất cả**, **Chờ duyệt**, **Cần bổ sung**.
- Bấm vào một đơn để mở chi tiết: thấy rõ đơn đang ở bước nào, ai đã duyệt, ai sắp duyệt,
  lịch sử thao tác và bình luận.
- Nếu đơn bị **yêu cầu bổ sung**: mở đơn, điền thêm thông tin theo yêu cầu rồi bấm gửi lại.
- Nếu muốn rút đơn: bấm **Hủy đơn** và nêu lý do.

### 3.2 Với người duyệt

- Vào **Đơn từ → Đơn chờ tôi duyệt** (hoặc bấm link **Xem chi tiết** trong thông báo/Telegram để mở
  thẳng đơn cần xử lý).
- Trong chi tiết đơn có 3 hành động chính:
  - **Duyệt**: đơn chuyển sang bước kế tiếp hoặc hoàn tất nếu là bước cuối.
  - **Từ chối**: bắt buộc nhập lý do; người gửi nhận thông báo kèm lý do.
  - **Yêu cầu bổ sung**: bắt buộc nêu rõ cần bổ sung gì; đơn quay về người gửi.
- Có thể thêm **bình luận** trong đơn để trao đổi với người gửi và các cấp duyệt khác.
- Tin nhắn Telegram bạn nhận luôn ghi rõ: tên loại đơn, người gửi, và (từ bước 2 trở đi) dòng
  **Tiến độ** liệt kê bước nào đã được ai duyệt. Bấm **Xem chi tiết** trong tin để mở đúng đơn.

### Mẹo khi có nhiều đơn chờ

- Mở đơn bằng link **Xem chi tiết** trong Telegram để khỏi lật danh sách.
- Đơn nào sắp hết hạn sẽ có tin nhắc riêng — xử lý các đơn đó trước.
- Dùng **bình luận** để hỏi thêm thay vì từ chối vội; người gửi bổ sung được thì đơn đi tiếp nhanh hơn.
- Nếu bạn vắng mặt dài ngày, cài **ủy quyền tạm thời** (mục 6) để đơn không bị dồn ứ.

---

## 4. Cấu hình luồng duyệt (flow) cho loại đơn — dành cho quản trị viên

![Sơ đồ luồng duyệt nhiều cấp](/docs/img/luong-duyet.svg)

Vào menu **Cấu hình → Luồng duyệt**. Mỗi loại đơn có một luồng gồm nhiều **bước duyệt** xếp theo
thứ tự. Muốn thêm bước, bấm **Thêm bước duyệt tiếp theo**.

### 4.1 Chọn hình thức duyệt cho từng bước

Mỗi bước có mục **Hình thức duyệt** với 4 lựa chọn:

| Hình thức | Ý nghĩa | Khi nào dùng |
|---|---|---|
| **Cấp quản lý trực tiếp** | Quản lý trực tiếp của người tạo đơn duyệt | Luồng chuẩn theo phòng ban |
| **Chuỗi quản lý liên tiếp** | Duyệt lần lượt từ cấp thấp lên cấp cao | Đơn cần nhiều cấp quản lý ký |
| **Duyệt theo sắp xếp** | Chọn quy tắc duyệt + chức danh hoặc nhóm người cụ thể | Luồng tùy biến theo chức danh |
| **Chỉ định 1 người cụ thể** | Đơn chỉ gửi đến đúng 1 người được chọn | Đơn đặc thù, người chịu trách nhiệm cố định |

### 4.2 Quy tắc khi một bước có nhiều người duyệt

- **Duyệt lần lượt**: người trước duyệt xong mới chuyển người sau (hiển thị `A ➔ B ➔ C`).
  Bắt buộc phải chọn danh sách người duyệt theo thứ tự.
- **Đồng thời — cần tất cả đồng ý**: gửi cho tất cả, đơn chỉ đi tiếp khi đủ 100% bấm Duyệt.
- **Đồng thời — chỉ cần 1 người**: ai bấm Duyệt trước thì đơn qua bước.

### 4.3 Xử lý quá hạn cho bước

Bật nhóm **Xử lý quá hạn** và nhập **số giờ** cho phép xử lý. Khi hết giờ, hệ thống tự làm một trong
các hành động bạn chọn:

- **Trả đơn về nơi khởi tạo**: đơn bị trả về người gửi.
- **Duyệt theo ủy quyền quá hạn**: đơn chuyển cho "người duyệt thay khi quá hạn" mà người duyệt
  đã cài (xem mục 6).
- Hoặc chuyển lên cấp trên tùy cấu hình bước.

### 4.4 Lưu và kiểm tra

- Bấm **Lưu** sau khi chỉnh xong. Hệ thống kiểm tra lỗi cấu hình (ví dụ bước "Duyệt lần lượt" mà
  chưa chọn người) và báo rõ từng bước thiếu gì.
- Để thử luồng: mở màn **Tạo đề xuất mới**, chọn loại đơn vừa cấu hình và xem khối
  **Luồng phê duyệt dự kiến** — sơ đồ phải hiện đúng người/tầng bạn vừa đặt.

---

## 5. Kết nối và sử dụng Telegram

![Kết nối Telegram và nhận thông báo](/docs/img/telegram.svg)

### 5.1 Kết nối lần đầu

1. Vào trang **Tài khoản** (bấm tên mình ở góc trái → Tài khoản).
2. Bấm nút **Kết nối Telegram**. Hệ thống mở ứng dụng Telegram với bot của công ty.
3. Trong Telegram bấm **Start**. Bot trả lời "Kết nối thành công!" là xong; từ nay bạn nhận thông báo
   đơn từ tại đây.

### 5.2 Đổi sang tài khoản Telegram khác

- Ngay trang **Tài khoản**, cạnh dòng **Đã kết nối Telegram**, bấm **Đổi kết nối Telegram**.
- Mở link bot và bấm **Start bằng tài khoản mới**; kết nối cũ tự được thay thế.

### 5.3 Bạn nhận được những tin gì

- Đơn của bạn được duyệt / bị từ chối / cần bổ sung / bị hủy.
- Có đơn mới chờ bạn duyệt, đơn sắp hết hạn, đơn quá hạn bị chuyển hoặc bị hủy.
- Mật khẩu tạm khi Nhân sự đặt lại mật khẩu cho bạn.
- Mọi tin đều có link **Xem chi tiết** bấm là mở đúng trang liên quan; tên đơn và tên người được
  **in đậm** để dễ nhìn.

### 5.4 Với quản trị viên: cấu hình bot

Vào **Cấu hình → Chung & Telegram**: dán **Bot Token**, bấm kiểm tra kết nối, rồi đăng ký webhook để
bot nhận lệnh Start từ người dùng. Nếu chưa cấu hình bot, người dùng bấm kết nối sẽ nhận thông báo
lỗi và chỉ dùng được thông báo trong hệ thống.

---

## 6. Ủy quyền duyệt và người duyệt thay khi quá hạn

Vào menu **Ủy quyền**, có hai trang con:

### 6.1 Ủy quyền tạm thời (khi bạn vắng mặt)

1. Bấm **Tạo ủy quyền**, chọn người được ủy quyền và khoảng thời gian áp dụng.
2. Trong thời gian đó, đơn đáng lẽ đến bạn sẽ chuyển cho người được ủy quyền; hệ thống ghi rõ
   "duyệt thay cho ai".
3. Hết thời gian, quyền tự trở về với bạn. Có thể bấm **Đổi người** hoặc **Thu hồi** bất cứ lúc nào.

### 6.2 Người duyệt thay khi quá hạn (cài mặc định)

1. Vào **Ủy quyền → Duyệt thay khi quá hạn**.
2. Chọn người duyệt thay mặc định rồi bấm **Lưu người duyệt thay**.
3. Khi đơn bạn duyệt bị quá hạn và luồng bật hành động "Duyệt theo ủy quyền quá hạn", đơn tự chuyển
   cho người này. Không cài thì đơn quá hạn sẽ bị hủy/trả về theo cấu hình luồng.

---

## 7. Dành cho Nhân sự (HR)

- **Tạo tài khoản nhân viên**: menu **Nhân sự → Tạo tài khoản nhân viên**, điền họ tên, email, phòng
  ban, vai trò. Nhân viên nhận mật khẩu tạm và phải đổi ở lần đăng nhập đầu.
- **Đặt lại mật khẩu**: mở hồ sơ nhân viên → **Đặt lại mật khẩu**. Hệ thống sinh mật khẩu tạm,
  hiển thị trên màn hình HR **và gửi thẳng vào Telegram của nhân viên** (nếu nhân viên đã kết nối).
- **Phân vai trò**: chỉnh vai trò (ADMIN / HR / MANAGER / TEAM_LEADER / STAFF) để giới hạn menu và
  quyền thao tác tương ứng.

---

## 8. Báo cáo và xuất Excel

![Trang báo cáo và xuất Excel](/docs/img/bao-cao.svg)

- Vào menu **Báo Cáo** (quyền HR/ADMIN).
- Dùng thanh bộ lọc (khoảng ngày, khối, phòng ban, loại đơn, chức vụ) để thu hẹp số liệu.
  Trên điện thoại, bấm hàng **Bộ lọc** để mở/đóng khu lọc cho đỡ chật màn hình.
- Các khối số liệu: tổng quan, xu hướng 12 tháng (chuyển chế độ **Tổng hợp** / **Theo loại đơn**),
  phân bổ theo loại đơn & phòng ban, so sánh phòng ban / chức vụ, bảng điều hành.
- Mỗi bảng có nút **Excel** để xuất đúng phần đang xem ra file tải về.

---

## 9. Câu hỏi thường gặp khi sử dụng (FAQ)

**Hỏi: Vì sao sơ đồ luồng hiện chữ "Người duyệt" thay vì tên người?**
Đáp: Với luồng "chỉ định 1 người" hoặc luồng có nhiều ứng viên, tên chỉ hiện khi hệ thống đã chọn/
bạn đã chọn người cụ thể. Hãy chọn trong ô **Chọn người duyệt** rồi mở lại sơ đồ. Nếu vẫn sai, báo
quản trị viên kiểm tra cấu hình luồng (mục 4).

**Hỏi: Tôi không nhận được tin Telegram?**
Đáp: Kiểm tra trang **Tài khoản** đã hiện **Đã kết nối Telegram** chưa; nếu chưa thì kết nối lại.
Nếu đã kết nối mà vẫn không có tin, báo quản trị viên kiểm tra cấu hình bot (mục 5.4).

**Hỏi: Đơn tôi duyệt biến mất khỏi danh sách chờ?**
Đáp: Có thể đơn đã bị người gửi hủy, bị quá hạn chuyển cho người khác, hoặc đã được người duyệt
cùng cấp xử lý trước bạn (với quy tắc "chỉ cần 1 người").

**Hỏi: Quên mật khẩu thì làm sao?**
Đáp: Nhờ Nhân sự đặt lại mật khẩu (mục 7). Bạn nhận mật khẩu tạm qua Telegram hoặc trực tiếp, đăng
nhập và bắt buộc đổi mật khẩu mới ngay (mục 1).

**Hỏi: Muốn đơn đi thêm một cấp duyệt nữa thì sửa ở đâu?**
Đáp: Quản trị viên vào **Cấu hình → Luồng duyệt**, mở luồng của loại đơn đó và bấm
**Thêm bước duyệt tiếp theo** rồi cấu hình hình thức duyệt cho bước mới (mục 4).
