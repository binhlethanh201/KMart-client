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

        // Surfaces & Backgrounds
        "background": "#f8fafc",          // Slate 50
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
