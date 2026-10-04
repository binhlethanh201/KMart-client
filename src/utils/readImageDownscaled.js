/**
 * BE-119: đọc file ảnh rồi VẼ LẠI ở kích thước tối đa `maxSize` để dữ liệu nhỏ, trả về data URL.
 *
 * Vì sao dùng chung: trước đây chỉ ảnh phòng ban được nén và lưu thẳng vào CSDL (data URL) nên
 * máy nào cũng thấy ảnh; còn ảnh đại diện người dùng lại được TẢI LÊN ổ đĩa của máy chủ rồi lưu
 * đường dẫn, nên mở ở máy/địa chỉ khác là ảnh hỏng. Nay cả hai dùng đúng một cách: nén rồi lưu
 * data URL trong hồ sơ.
 */
export function readImageDownscaled(file, maxSize, onData, onError) {
  const reader = new FileReader();
  reader.onerror = () => onError?.();
  reader.onload = () => {
    const img = new Image();
    img.onerror = () => onData?.(reader.result); // fallback: dùng data URL gốc
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        onData?.(canvas.toDataURL('image/png'));
      } catch {
        onData?.(reader.result); // canvas bị chặn (chế độ riêng tư) -> dùng ảnh gốc
      }
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

export default readImageDownscaled;
