import { motion, useReducedMotion } from 'motion/react';
import BrandLogo from '../../../components/BrandLogo';
import LanguageSwitcher from '../../../components/LanguageSwitcher';
import { useI18n } from '../../../i18n/I18nProvider';

/**
 * Khung nền dùng chung cho các màn xác thực (đăng nhập, đổi mật khẩu bắt buộc).
 *
 * AUTH-15: bỏ bố cục 2 cột, quay về MỘT thẻ lớn giữa màn trên nền navy toàn màn.
 *
 * Vì sao bỏ bố cục 2 cột: ở màn 1920px, cột thương hiệu chỉ chiếm 19.8% bề ngang còn cột biểu mẫu
 * chiếm 80.2% — mà thẻ chỉ 420x362px nên chỉ lấp 10% diện tích cột đó, thành ra thẻ lơ lửng giữa
 * khoảng trống hơn 1100px. Đo bằng `getBoundingClientRect` mới thấy, nhìn ảnh không rõ.
 *
 * Cách dựng chiều sâu ở đây:
 *   * Nền navy đặc #0d1f4d + 3 khối cầu sáng (xanh dương = văn phòng, xanh lục = siêu thị).
 *   * Lưới mảnh mờ dần ở rìa, tạo chất "bản vẽ kỹ thuật" mà không thấy mối nối ô vuông.
 *   * Mọi thứ trang trí đều `pointer-events-none` và `aria-hidden` để không cản thao tác và không
 *     lọt vào cây trợ năng.
 *
 * Chữ trên thẻ dùng nền TRẮNG nên tương phản cố định, không phụ thuộc chữ rơi vào đoạn sáng/tối
 * của nền — đây là lý do không đặt chữ trực tiếp lên nền navy.
 */
export default function AuthBackground({ children }) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0d1f4d] px-5 py-6 sm:py-9">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,#1e40af_0%,#0d1f4d_55%,#081231_100%)]" />
      <div className="pointer-events-none absolute -left-32 -top-20 h-[620px] w-[620px] rounded-full bg-[#3b82f6]/45 blur-[130px]" />
      <div className="pointer-events-none absolute -right-28 bottom-[-12%] h-[580px] w-[580px] rounded-full bg-[#1d4ed8]/55 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-[6%] left-[18%] h-[440px] w-[440px] rounded-full bg-[#15803d]/35 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.09)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.09)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_72%)]" />

      {/* AUTH-15: quầng sáng phía sau thẻ. Trên nền tối, `box-shadow` màu đen gần như VÔ HÌNH nên
          thẻ không tạo được cảm giác nổi. Cách hiệu quả là cho thẻ phát sáng ra xung quanh: một lớp
          mờ màu sáng đặt ngay sau thẻ, lớn hơn thẻ một chút. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[460px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-[48px] bg-[#60a5fa]/25 blur-[90px]"
      />

      <motion.div
        initial={reduceMotion ? false : { x: 56, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 190, damping: 22, mass: 0.9 }}
        className="relative z-10 flex w-full max-w-[500px] flex-col items-center"
      >
        {/*
         * AUTH-16: nút ngôn ngữ căn thẳng mép phải với thẻ.
         *
         * Trước đây nó là `absolute right-5 top-5` — ghim vào góc MÀN HÌNH, nên ở 1920px nó cách thẻ
         * gần 690px và nhìn như phần tử lạc. Ban đầu tôi thử `w-full` + `justify-end`, nhưng `w-full`
         * lúc đó tính theo bề ngang màn hình nên vẫn lệch 690px (đo lại mới thấy).
         *
         * Cách đúng: bọc cả cột nội dung trong `max-w-[500px]`. Khi đó `w-full` của hàng này bằng
         * đúng bề ngang thẻ, và `justify-end` tự khớp mép phải ở MỌI bề rộng màn hình — đã kiểm
         * chứng 1920/1440/1024/768/375 đều lệch 0px.
         */}
        <div className="mb-3.5 flex w-full justify-end [@media(max-height:820px)]:mb-2">
          <LanguageSwitcher variant="onDark" />
        </div>

        <div className="mb-5 flex justify-center [@media(max-height:820px)]:mb-3">
          <BrandLogo size="md" tone="onDark" glow tagline={t('Hệ thống quản trị nội bộ')} />
        </div>

        {children}
      </motion.div>
    </div>
  );
}
