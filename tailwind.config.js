/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Corporate Blue Accent
        "primary": "#1d4ed8",             // Blue 700 (Enterprise primary)
        "on-primary": "#ffffff",
        "primary-container": "#dbeafe",   // Blue 100
        "on-primary-container": "#1e3a8a",// Blue 900
        "primary-fixed": "#dbeafe",
        "primary-fixed-dim": "#bfdbfe",   // Blue 200
        "on-primary-fixed": "#172554",
        "on-primary-fixed-variant": "#1e40af", // Blue 800

        // Corporate Green (Success/Approve)
        "success": "#15803d",             // Green 700
        "on-success": "#ffffff",
        "success-container": "#dcfce7",   // Green 100
        "on-success-container": "#14532d",// Green 900

        // Slate/Neutral Base
        "secondary": "#475569",           // Slate 600
        "on-secondary": "#ffffff",
        "secondary-container": "#f1f5f9", // Slate 100
        "on-secondary-container": "#0f172a",

        // Chữ bậc BA (timestamp, mã đơn, ghi chú phụ, placeholder).
        // Vì sao cần token riêng: trước đây các chỗ này dùng `text-outline` (#94a3b8) — đó là màu VIỀN,
        // chỉ đạt 2.37–2.56:1 trên nền của app, dưới xa ngưỡng WCAG AA 4.5:1 cho chữ thường.
        // #5f6b7a đạt tối thiểu 4.95:1 trên cả 4 nền đang dùng (#ffffff, #f6f6f4, #f8fafc, #f1f5f9)
        // mà vẫn nhạt hơn `secondary` (#475569 = 7.0:1) nên giữ được 3 bậc phân cấp chữ.
        "muted": "#5f6b7a",

        /*
         * Dải xám ẤM dùng cho thanh lọc (ô lọc giữ tông trắng ngà #fffefa, khác nền trắng của thẻ).
         * Trước đây các giá trị này nằm rải rác dạng hex trần trong src/index.css và
         * src/features/reports/* (palette thứ hai không có trong design system). Gom vào token để
         * sửa một chỗ là mọi nơi đổi theo.
         */
        "warm-border": "#d9d5cc",   // viền ô lọc
        "warm-surface": "#fffefa",  // nền ô lọc
        "warm-placeholder": "#9a968d",
        "warm-label": "#66655f",    // nhãn nhỏ in hoa trên thanh lọc (5.40:1 trên nền app)
        // Icon kính lúp trong ô tìm kiếm: #8a867c cũ chỉ đạt 3.36:1 (vừa đủ ngưỡng 3:1 cho icon, nhưng
        // không có chỗ dự phòng). #6e6a61 đạt 4.98–5.39:1 nên đọc rõ trên mọi nền.
        "warm-icon": "#6e6a61",

        // Màu nhấn của khối Báo cáo & Thống kê (đỏ ấm).
        // #d94a38 cũ chỉ đạt 3.84–4.21:1 — trượt AA cho chữ ở MỌI nền nó được dùng, trong khi nó là
        // màu chữ chính của cả trang Báo cáo. #c0392b đạt 4.96–5.44:1 mà vẫn cùng tông đỏ ấm.
        "accent": "#c0392b",

        // Warning/Pending (Amber)
        "warning": "#b45309",             // Amber 700
        "on-warning": "#ffffff",
        "warning-container": "#fef3c7",   // Amber 100
        "on-warning-container": "#78350f",

        // Error/Reject (Red)
        "error": "#b91c1c",               // Red 700
        "on-error": "#ffffff",
        "error-container": "#fee2e2",     // Red 100
        "on-error-container": "#7f1d1d",

        // Supplement/Request-more-info (Pink) - BE-26/29: màu riêng, khác hẳn
        // "chờ duyệt" (vàng), "đang duyệt" (cam) và "hoàn thành" (xanh lá).
        "supplement": "#db2777",             // Pink 600
        "on-supplement": "#ffffff",
        "supplement-container": "#fce7f3",   // Pink 100
        "on-supplement-container": "#831843",// Pink 900

        // Surfaces & Backgrounds
        // BE-57: nền chung của MỌI trang dùng đúng tông trắng ngà của trang Báo cáo & Thống kê
        // (trước đây là Slate 50 #f8fafc, hơi ngả xanh nên nhìn lệch tông với trang Báo cáo).
        "background": "#f6f6f4",          // Warm off-white
        "on-background": "#0f172a",       // Slate 900
        "surface": "#ffffff",             // Pure White
        "on-surface": "#0f172a",          // Slate 900
        "surface-variant": "#f1f5f9",     // Slate 100
        "on-surface-variant": "#475569",  // Slate 600
        
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f8fafc", // Slate 50
        "surface-container": "#f1f5f9",     // Slate 100
        "surface-container-high": "#e2e8f0",// Slate 200
        "surface-container-highest": "#cbd5e1", // Slate 300

        "outline": "#94a3b8",             // Slate 400
        "outline-variant": "#e2e8f0",     // Slate 200
      },
      borderRadius: {
        "DEFAULT": "0.375rem", // 6px
        "sm": "0.25rem",       // 4px
        "md": "0.375rem",      // 6px
        "lg": "0.5rem",        // 8px - Max radius per guidelines
        "xl": "0.5rem",        // Cap at 8px
        "2xl": "0.5rem",       // Cap at 8px
        "full": "9999px"       // For avatars/pills only
      },
      fontFamily: {
        "sans": ["Inter", "sans-serif"],
        "display-lg": ["Inter", "sans-serif"],
        "headline-lg-mobile": ["Inter", "sans-serif"],
        "headline-sm": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "label-md": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "headline-md": ["Inter", "sans-serif"]
      },
      fontSize: {
        "label-md": ["13px", { "lineHeight": "18px", "fontWeight": "500" }],
        "headline-sm": ["18px", { "lineHeight": "24px", "fontWeight": "600", "letterSpacing": "-0.01em" }],
        "body-lg": ["15px", { "lineHeight": "22px", "fontWeight": "400" }],
        "display-lg": ["28px", { "lineHeight": "36px", "letterSpacing": "-0.02em", "fontWeight": "600" }],
        "headline-md": ["20px", { "lineHeight": "28px", "letterSpacing": "-0.01em", "fontWeight": "600" }],
        "headline-lg-mobile": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
        "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }]
      }
    },
  },
  plugins: [],
}
