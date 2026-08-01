import { jauntDetourBrand, jauntDetourTheme } from "./jauntDetourTheme";
import { jauntColors, jauntRadius, jauntTypography } from "./tokens";

describe("JauntDetour Fluent theme", () => {
  it("uses a complete Fluent brand ramp with approved anchor colors", () => {
    expect(Object.keys(jauntDetourBrand)).toHaveLength(16);
    expect(jauntDetourBrand[70]).toBe(jauntColors.brand.primaryHover);
    expect(jauntDetourBrand[80]).toBe(jauntColors.brand.primary);
    expect(jauntDetourBrand[160]).toBe(jauntColors.brand.primarySubtle);
  });

  it("maps approved semantic foundations into the Fluent theme", () => {
    expect(jauntDetourTheme.colorBrandBackground).toBe(
      jauntColors.brand.primary
    );
    expect(jauntDetourTheme.colorBrandBackgroundHover).toBe(
      jauntColors.brand.primaryHover
    );
    expect(jauntDetourTheme.colorNeutralForeground1).toBe(
      jauntColors.neutral.foreground
    );
    expect(jauntDetourTheme.colorStrokeFocus2).toBe(jauntColors.semantic.focus);
    expect(jauntDetourTheme.fontFamilyBase).toBe(
      jauntTypography.family.functional
    );
    expect(jauntDetourTheme.borderRadiusMedium).toBe(jauntRadius.control);
  });
});
