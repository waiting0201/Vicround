/**
 * VICROUND Tailwind theme.extend tokens
 *
 * 用途：可直接貼入未來 Next.js + shadcn/ui + Tailwind CSS 專案的 tailwind.config.{js,ts}
 * 之 theme.extend 區塊。內容對應 tokens.css，來源請參照
 * /Users/tim/webapps/Vicround/output/design-system.md。
 *
 * 使用方式範例（tailwind.config.js）：
 *
 *   const vicroundTokens = require('./tailwind.tokens.js');
 *   module.exports = {
 *     darkMode: 'class',
 *     theme: {
 *       extend: vicroundTokens,
 *     },
 *   };
 *
 * 若專案採用 shadcn/ui 慣例（CSS variable 驅動的語意色 token），建議搭配 tokens.css
 * 中定義的 --color-* 自訂屬性，於此處以 `hsl(var(--xxx))` 或直接 `var(--xxx)` 形式接軌；
 * 以下為求可讀性與可移植性，採直接寫入 HEX 值的版本，兩種方式皆可依專案慣例擇一。
 */

module.exports = {
  colors: {
    // 品牌主色（CIS p.6）
    brand: {
      black: '#000000',
      white: '#ffffff',
    },
    // 品牌行銷輔助色 / 主要強調色（CIS p.7，PANTONE 2097 C）
    primary: {
      DEFAULT: '#5e3de7',
      hover: '#4a2fc0',   // 〔推估值〕
      active: '#3d26a3',  // 〔推估值〕
      subtle: '#efebfd',  // 〔推估值〕
      foreground: '#ffffff',
    },
    // 產品分類標準色（CIS p.8）
    product: {
      'optical-film': '#71d6e0',   // PANTONE 3105 C
      'textile-foam': '#e7004b',   // PANTONE 1925 C
      acoustic: '#cfcfcd',         // PANTONE Cool Gray 2C
    },
    // 中性灰階〔推估值，依 CIS p.6 黑白階層線性內插〕
    neutral: {
      50: '#f2f2f2',
      100: '#e6e6e6',
      200: '#cccccc',
      300: '#b3b3b3',
      400: '#999999',
      500: '#808080',
      600: '#666666',
      700: '#4d4d4d',
      800: '#333333',
      900: '#1a1a1a',
      950: '#0d0d0d',
    },
    // 語意色〔推估值，CIS 手冊未定義，僅供表單/系統訊息使用〕
    success: {
      DEFAULT: '#12b76a',
      subtle: '#e7f9f1',
    },
    warning: {
      DEFAULT: '#f79009',
      subtle: '#fef3e2',
    },
    danger: {
      DEFAULT: '#d92d20',
      subtle: '#fbeae9',
    },
    info: {
      DEFAULT: '#5e3de7',
      subtle: '#efebfd',
    },
  },

  fontFamily: {
    // 英文優先 Geologica（Google Fonts，SIL OFL 授權），中文 fallback Noto Sans TC
    sans: ['Geologica', 'Noto Sans TC', 'sans-serif'],
    'sans-en': ['Geologica', 'sans-serif'],
    // 中文標題/內文；CIS 指定「源樣黑體 GenYoGothic」，網頁替代方案為 Noto Sans TC
    // （同源自 Source Han Sans，具完整網頁授權，詳見 design-system.md §4.2）
    'sans-zh': ['Noto Sans TC', 'Geologica', 'sans-serif'],
  },

  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  fontSize: {
    // [fontSize, { lineHeight }] 格式，數值取自 design-system.md §4.3〔推估值〕
    h1: ['3.5rem', { lineHeight: '1.15' }],       // 56px
    'h1-lg': ['4rem', { lineHeight: '1.15' }],    // 64px
    h2: ['2.25rem', { lineHeight: '1.2' }],       // 36px
    h3: ['1.5rem', { lineHeight: '1.3' }],        // 24px
    h4: ['1.125rem', { lineHeight: '1.4' }],      // 18px
    body: ['1rem', { lineHeight: '1.7' }],        // 16px，取中文相容基準
    caption: ['0.8125rem', { lineHeight: '1.5' }],// 13px
    button: ['0.9375rem', { lineHeight: '1.2' }], // 15px
  },

  spacing: {
    // 4px 基準等比尺度，design-system.md §5.3
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    24: '6rem',     // 96px
    32: '8rem',     // 128px
  },

  borderRadius: {
    sm: '6px',
    DEFAULT: '8px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  boxShadow: {
    sm: '0 1px 8px rgba(0, 0, 0, 0.06)',
    DEFAULT: '0 4px 16px rgba(0, 0, 0, 0.08)',
    md: '0 4px 16px rgba(0, 0, 0, 0.08)',
    lg: '0 12px 32px rgba(0, 0, 0, 0.12)',
    'focus-ring': '0 0 0 3px rgba(94, 61, 231, 0.15)',
  },

  screens: {
    // design-system.md §5.2 響應式斷點〔推估值〕
    sm: '480px',
    md: '768px',   // Tablet
    lg: '1024px',  // Desktop
    xl: '1440px',  // Large Desktop
  },

  container: {
    center: true,
    padding: {
      DEFAULT: '1rem',    // 16px, mobile margin
      md: '2rem',         // 32px, tablet margin
      lg: '2.5rem',       // 40px, desktop margin
    },
    screens: {
      lg: '1140px',       // container max-width desktop
      xl: '1280px',       // container max-width large desktop
    },
  },
};
