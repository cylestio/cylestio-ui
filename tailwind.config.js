/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          50: '#f0f5ff',
          100: '#e0ebff',
          200: '#c1d8ff',
          300: '#a2c4ff',
          400: '#83b0ff',
          500: '#4d8bff', // Main primary color
          600: '#3878f6',
          700: '#2165e3',
          800: '#154bc8',
          900: '#1243a7'
        },
        
        // Secondary color palette
        secondary: {
          50: '#f3f9fb',
          100: '#e5f3f8',
          200: '#c7e7f1',
          300: '#a9dbe9',
          400: '#8bcfe2',
          500: '#5eb7d0', // Main secondary color
          600: '#4597ad',
          700: '#2d768a',
          800: '#19576a',
          900: '#103e4e'
        },
        
        // Success colors (greens)
        success: {
          50: '#ebfaf0',
          100: '#d7f5e1',
          200: '#b0ebc3',
          300: '#88e1a5',
          400: '#61d787',
          500: '#39c369', // Main success color
          600: '#2ba356',
          700: '#1e8544',
          800: '#156632',
          900: '#0c4d23'
        },
        
        // Warning colors (yellows/oranges)
        warning: {
          50: '#fff9eb',
          100: '#fff3d6',
          200: '#ffe7ad',
          300: '#ffdb85',
          400: '#ffcf5c',
          500: '#ffc333', // Main warning color
          600: '#e6a416',
          700: '#b37d0e',
          800: '#805907',
          900: '#4d3503'
        },
        
        // Error colors (reds)
        error: {
          50: '#fdedee',
          100: '#fadcdc',
          200: '#f6b9b9',
          300: '#f19595',
          400: '#ec7272',
          500: '#e74e4e', // Main error color
          600: '#d03d40',
          700: '#a82c31',
          800: '#811d23',
          900: '#5a1317'
        },

        tremor: {
          brand: {
            faint: "#eff6ff", // blue-50
            muted: "#bfdbfe", // blue-200
            subtle: "#60a5fa", // blue-400
            DEFAULT: "#3b82f6", // blue-500
            emphasis: "#1d4ed8", // blue-700
            inverted: "#ffffff", // white
          },
          background: {
            muted: "#f9fafb", // gray-50
            subtle: "#f3f4f6", // gray-100
            DEFAULT: "#ffffff", // white
            emphasis: "#374151", // gray-700
          },
          border: {
            DEFAULT: "#e5e7eb", // gray-200
          },
          ring: {
            DEFAULT: "#e5e7eb", // gray-200
          },
          content: {
            subtle: "#9ca3af", // gray-400
            DEFAULT: "#6b7280", // gray-500
            emphasis: "#374151", // gray-700
            strong: "#111827", // gray-900
            inverted: "#ffffff", // white
          },
        },
      },
      boxShadow: {
        // Design system shadows
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'none': 'none',
        
        // Tremor specific shadows
        "tremor-input": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "tremor-card": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "tremor-dropdown": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        // dark
        "dark-tremor-input": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "dark-tremor-card": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "dark-tremor-dropdown": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      },
      borderRadius: {
        'sm': '0.25rem',     // 4px
        'md': '0.375rem',    // 6px 
        'lg': '0.5rem',      // 8px
        'xl': '0.75rem',     // 12px
        '2xl': '1rem',       // 16px
        '3xl': '1.5rem',     // 24px
        'full': '9999px',    // Fully rounded (circle)
        
        // Tremor specific border radius
        "tremor-small": "0.375rem",
        "tremor-default": "0.5rem",
        "tremor-full": "9999px",
      },
      fontSize: {
        'xs': '0.75rem',      // 12px
        'sm': '0.875rem',     // 14px
        'base': '1rem',       // 16px
        'lg': '1.125rem',     // 18px
        'xl': '1.25rem',      // 20px
        '2xl': '1.5rem',      // 24px
        '3xl': '1.875rem',    // 30px
        '4xl': '2.25rem',     // 36px
        '5xl': '3rem',        // 48px
        
        // Tremor specific font sizes
        "tremor-label": ["0.75rem", { lineHeight: "1rem" }],
        "tremor-default": ["0.875rem", { lineHeight: "1.25rem" }],
        "tremor-title": ["1.125rem", { lineHeight: "1.75rem" }],
        "tremor-metric": ["1.875rem", { lineHeight: "2.25rem" }],
      },
      spacing: {
        // Extend spacing system with 4px increments
        '0': '0px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        '32': '128px',
        '40': '160px',
        '48': '192px',
        '56': '224px',
        '64': '256px',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out forwards',
      }
    },
  },
  safelist: [
    {
      pattern: /^(bg|text|border|ring)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)$/,
      variants: ["hover", "ui-selected"],
    },
    {
      pattern: /^(bg|text|border|ring)-tremor-/,
      variants: ["hover", "ui-selected"],
    },
    {
      pattern: /^(shadow|border|rounded)-tremor-/,
      variants: ["hover", "ui-selected"],
    },
    {
      pattern: /^text-tremor-/,
      variants: ["hover", "ui-selected"],
    },
    // Add new design system safelist patterns
    {
      pattern: /^(bg|text|border|ring)-(primary|secondary|success|warning|error)-(50|100|200|300|400|500|600|700|800|900)$/,
      variants: ["hover", "focus", "active"],
    },
    // Include animation classes in the safelist
    "animate-fadeIn",
  ],
  plugins: [],
}

