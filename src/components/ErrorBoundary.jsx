import { Component } from 'react';
import LoadError from './LoadError';

/**
 * ERR-01: lưới an toàn cho toàn bộ cây giao diện.
 *
 * Vì sao cần: React 19 gỡ BỎ TOÀN BỘ cây khi có lỗi không bắt được trong lúc render, để lại
 * màn hình trắng trơn — người dùng không biết chuyện gì xảy ra và cũng không có cách khắc phục.
 * Lỗi đã thực sự xảy ra: khi một gói tải lười (xem `lazyRoute` trong App.jsx) tải thất bại do mạng
 * chập chờn hoặc do máy chủ vừa triển khai phiên bản mới, `import()` ném lỗi, React gỡ cả cây và
 * /reports trắng màn (React cũng đã cảnh báo đúng như vậy trong console).
 *
 * Xử lý ở đúng một chỗ: hiện thông báo đọc được + nút thử lại. Nút thử lại KHÔNG thử vẽ lại ngay
 * (lỗi có thể lặp lại y nguyên) mà tải lại trang — cách duy nhất để lấy đúng gói JS phiên bản mới.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Giữ lại dấu vết để còn chẩn đoán; người dùng không thấy phần này.
    console.error('Lỗi không bắt được trong giao diện:', error, info?.componentStack);
  }

  handleRetry() {
    window.location.reload();
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-6">
        <LoadError
          message={this.props.message || 'Có lỗi xảy ra khi hiển thị trang này. Vui lòng tải lại trang.'}
          onRetry={this.handleRetry}
        />
      </div>
    );
  }
}
