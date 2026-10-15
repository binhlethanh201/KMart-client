import { useEffect, useState } from 'react';

/**
 * Trả về "bây giờ" và tự cập nhật mỗi `intervalMs`.
 *
 * Vì sao có hook này: đọc `Date.now()` / `new Date()` ngay trong lúc render khiến React coi đó là
 * hàm không tinh khiết (đã có cảnh báo lint `react(purity)`), và quan trọng hơn: giá trị chỉ được
 * tính lại khi có state khác thay đổi, nên nhãn "Đã quá hạn", "còn N giờ" hay "5 phút trước" đứng
 * im ở ảnh chụp lúc mở trang. Người dùng mở trang rồi để đó sẽ thấy số liệu sai.
 *
 * Mặc định 1 phút là đủ mịn cho mọi nhãn thời gian trong ứng dụng này.
 */
export default function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
