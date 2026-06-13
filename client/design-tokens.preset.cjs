// AUTO-GENERATED from docs/design_tokens.json — DO NOT EDIT (run: pnpm tokens:generate)
module.exports = {
  "theme": {
    "extend": {
      "colors": {
        "brand": {
          "blue": {
            "50": "#EFF6FF",
            "100": "#DBEAFE",
            "200": "#BFDBFE",
            "300": "#93C5FD",
            "400": "#60A5FA",
            "500": "#3B82F6",
            "600": "#2563EB",
            "700": "#1D4ED8",
            "800": "#1E40AF",
            "900": "#1E3A8A"
          },
          "teal": {
            "50": "#F0FDFA",
            "100": "#CCFBF1",
            "400": "#2DD4BF",
            "500": "#14B8A6",
            "600": "#0D9488"
          },
          "cyan": {
            "400": "#22D3EE",
            "500": "#06B6D4"
          }
        },
        "neutral": {
          "50": "#F8FAFC",
          "100": "#F1F5F9",
          "200": "#E2E8F0",
          "300": "#CBD5E1",
          "400": "#94A3B8",
          "500": "#64748B",
          "600": "#475569",
          "700": "#334155",
          "800": "#1E293B",
          "900": "#0F172A",
          "950": "#020617"
        },
        "success": {
          "50": "#ECFDF5",
          "500": "#10B981",
          "600": "#059669"
        },
        "warning": {
          "50": "#FFFBEB",
          "500": "#F59E0B",
          "600": "#D97706"
        },
        "error": {
          "50": "#FEF2F2",
          "500": "#EF4444",
          "600": "#DC2626"
        },
        "info": {
          "500": "#3B82F6"
        },
        "dark": {
          "background": "#0F172A",
          "surface": "#1E293B",
          "surfaceElevated": "#334155",
          "border": "#334155",
          "text": "#F1F5F9",
          "textSecondary": "#94A3B8",
          "textMuted": "#64748B",
          "bubble": {
            "sent": "#1E40AF",
            "received": "#1E293B"
          }
        }
      },
      "fontFamily": {
        "sans": [
          "Vazirmatn",
          "Inter",
          "system-ui",
          "sans-serif"
        ],
        "mono": [
          "JetBrains Mono",
          "monospace"
        ]
      },
      "fontSize": {
        "caption": "0.6875rem",
        "xs": "0.75rem",
        "sm": "0.875rem",
        "base": "1rem",
        "lg": "1.125rem",
        "xl": "1.25rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
        "4xl": "2.5rem"
      },
      "borderRadius": {
        "none": "0px",
        "sm": "0.25rem",
        "md": "0.5rem",
        "lg": "0.75rem",
        "xl": "1rem",
        "2xl": "1.5rem",
        "full": "9999px",
        "bubble": "1.5rem 1.5rem 0.25rem 1.5rem"
      },
      "boxShadow": {
        "xs": "0 1px 2px rgba(0,0,0,0.05)",
        "sm": "0 1px 3px rgba(0,0,0,0.1)",
        "md": "0 4px 6px rgba(0,0,0,0.07)",
        "lg": "0 10px 15px rgba(0,0,0,0.1)",
        "xl": "0 20px 25px rgba(0,0,0,0.1)",
        "glow": "0 0 15px rgba(6,182,212,0.3), 0 0 30px rgba(6,182,212,0.15)"
      },
      "transitionDuration": {
        "fast": "150ms",
        "normal": "200ms",
        "slow": "300ms",
        "loop": "1200ms"
      },
      "transitionTimingFunction": {
        "DEFAULT": "cubic-bezier(0.4, 0, 0.2, 1)"
      },
      "keyframes": {
        "typing": {
          "0%": {
            "transform": "translateY(0)"
          },
          "50%": {
            "transform": "translateY(-4px)"
          },
          "100%": {
            "transform": "translateY(0)"
          }
        },
        "pulse": {
          "0%, 100%": {
            "opacity": "1",
            "transform": "scale(1)"
          },
          "50%": {
            "opacity": "0.5",
            "transform": "scale(1.2)"
          }
        }
      }
    }
  }
};
