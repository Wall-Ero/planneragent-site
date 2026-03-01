// ui/assets/theme/theme.tokens.ts
export const tokens = {
  color: {
    background: "#0e0e11",
    surface: "#16161c",
    text_primary: "#eaeaf0",
    text_secondary: "#9a9aa3",

    signal_off: "#2a2a30",   // spento
    signal_on: "#eaeaf0"     // acceso (stesso del testo)
  },

  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px"
  },

  radius: {
    sm: "6px",
    md: "10px",
    lg: "16px"
  }
} as const;