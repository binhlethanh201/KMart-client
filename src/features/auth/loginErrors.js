/**
 * BE-87: câu lỗi đăng nhập do MÁY CHỦ trả về.
 *
 * Máy chủ trả tiếng Việt cho khớp ngôn ngữ giao diện, nhưng đó là chuỗi sinh ra lúc chạy nên bộ quét
 * i18n không thấy được — người dùng chuyển sang EN/KO vẫn thấy câu tiếng Việt. Hàm dưới đây quy các
 * câu đã biết về `t('chuỗi hằng')`, nhờ vậy `scripts/i18n-sync.mjs` tự sinh bản EN/KO và mọi ngôn
 * ngữ đều dịch được. Câu lạ (máy chủ đổi nội dung) trả về nguyên văn để không mất thông tin.
 */

/**
 * Tạo hàm dịch câu lỗi đăng nhập theo ngôn ngữ đang dùng.
 * @param {(key: string) => string} t hàm dịch của I18nProvider
 * @returns {(rawMessage?: string|null) => string|null}
 */
export function createLoginErrorTranslator(t) {
  /*
   * Một câu duy nhất cho mọi trường hợp sai thông tin đăng nhập để không tiết lộ tài khoản có tồn tại
   * hay không. Ba dòng cuối là bản tiếng Anh của phiên bản máy chủ cũ, giữ lại để giao diện vẫn hiện
   * tiếng Việt nếu máy chủ chưa được cập nhật.
   */
  const map = {
    'Email hoặc mật khẩu không đúng.': t('Email hoặc mật khẩu không đúng.'),
    'Tài khoản đang tạm bị khóa. Vui lòng thử lại sau.': t('Tài khoản đang tạm bị khóa. Vui lòng thử lại sau.'),
    'Tài khoản đã ngừng hoạt động.': t('Tài khoản đã ngừng hoạt động.'),
    'Invalid email or password': t('Email hoặc mật khẩu không đúng.'),
    'Account is temporarily locked. Please try again later.': t('Tài khoản đang tạm bị khóa. Vui lòng thử lại sau.'),
    'Account is not active': t('Tài khoản đã ngừng hoạt động.'),
  };

  return (rawMessage) => {
    const message = String(rawMessage ?? '').trim();
    if (!message) return null;
    // BE-114: các câu mới của máy chủ về "chưa có phòng ban công tác chính" đi qua bảng dịch
    // tĩnh ở đây để EN/KO hiện đúng ngay, không chờ dịch máy.
    return map[message] || t(message);
  };
}

export default createLoginErrorTranslator;
