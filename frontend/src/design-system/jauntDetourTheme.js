import { createLightTheme } from "@fluentui/react-components";
import { jauntColors, jauntRadius, jauntTypography } from "./tokens";

// Fluent consumes a 16-step ramp from darkest to lightest. Step 80 is the
// primary background, step 70 its hover state, and step 160 its quiet surface.
export const jauntDetourBrand = {
  10: "#031510",
  20: "#05241c",
  30: "#073329",
  40: "#083a2d",
  50: "#094032",
  60: "#0a4535",
  70: jauntColors.brand.primaryHover,
  80: jauntColors.brand.primary,
  90: "#2c7661",
  100: "#478674",
  110: "#629687",
  120: "#7da69a",
  130: "#98b6ad",
  140: "#b3c6c0",
  150: "#c9dcd5",
  160: jauntColors.brand.primarySubtle,
};

export const jauntDetourTheme = {
  ...createLightTheme(jauntDetourBrand),
  colorNeutralForeground1: jauntColors.neutral.foreground,
  colorNeutralForeground2: jauntColors.neutral.foregroundSecondary,
  colorNeutralForegroundOnBrand: jauntColors.neutral.foregroundOnDark,
  colorNeutralBackground1: jauntColors.neutral.background,
  colorNeutralBackground2: jauntColors.neutral.backgroundSubtle,
  colorNeutralStroke1: jauntColors.neutral.stroke,
  colorStrokeFocus2: jauntColors.semantic.focus,
  fontFamilyBase: jauntTypography.family.functional,
  borderRadiusMedium: jauntRadius.control,
};
