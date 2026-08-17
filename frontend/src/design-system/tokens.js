// Production mirror of design-system/tokens/jauntdetour.tokens.json.
// Keep changes centralized here and update the canonical token file first.
export const jauntColors = {
  brand: {
    primary: "#12664f",
    primaryHover: "#0b4c3a",
    primarySubtle: "#dcece6",
    accent: "#e36a2e",
    accentStrong: "#b84a18",
    accentOnDark: "#ef985f",
    accentSubtle: "#fbe9df",
    highlight: "#f2b84b",
  },
  neutral: {
    foreground: "#14282f",
    foregroundSecondary: "#43575d",
    foregroundOnDark: "#ffffff",
    background: "#ffffff",
    backgroundSubtle: "#f7f9f8",
    backgroundTinted: "#eef4f2",
    stroke: "#d7e0dd",
  },
  semantic: {
    danger: "#b42318",
    dangerSubtle: "#fee4e2",
    success: "#0b4c3a",
    successSubtle: "#dcece6",
    warning: "#76531c",
    warningSubtle: "#fff7e7",
    focus: "#f2b84b",
  },
  support: {
    sky: "#b9dfe5",
  },
  map: {
    route: "#e36a2e",
    endpoint: "#14282f",
    result: "#f2b84b",
    selected: "#b84a18",
    stop: "#b84a18",
    searchArea: "#12664f",
  },
};

export const jauntTypography = {
  family: {
    editorial: "Fraunces, Georgia, serif",
    functional: '"DM Sans", "Segoe UI", sans-serif',
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  size: {
    caption: "0.6875rem",
    bodySmall: "0.8125rem",
    body: "0.9375rem",
    bodyLarge: "1.125rem",
    titleSmall: "1.5rem",
    title: "2.25rem",
    display: "4.5rem",
  },
  lineHeight: {
    tight: 1.05,
    standard: 1.45,
    reading: 1.65,
  },
};

export const jauntSpacing = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.5rem",
  6: "2rem",
  7: "3rem",
  8: "4rem",
  9: "5.5rem",
};

export const jauntRadius = {
  control: "0.375rem",
  surface: "0.5rem",
  sheet: "1rem",
  round: "999px",
};

export const jauntSize = {
  controlMedium: "2.625rem",
  controlLarge: "3.125rem",
  iconMedium: "1.25rem",
  header: "4.25rem",
  plannerPanel: "25.625rem",
};

export const jauntMotion = {
  durationFast: "140ms",
  durationStandard: "180ms",
  easingStandard: "cubic-bezier(0.2, 0, 0, 1)",
};

export const jauntBreakpoints = {
  compact: "48.75rem",
  wide: "65.625rem",
};
