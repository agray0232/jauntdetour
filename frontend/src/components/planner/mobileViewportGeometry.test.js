import {
  hasViewportRecovered,
  isKeyboardViewport,
} from "./mobileViewportGeometry";

describe("mobileViewportGeometry", () => {
  it("distinguishes a software keyboard from browser toolbar movement", () => {
    expect(isKeyboardViewport({ currentHeight: 760, restingHeight: 844 })).toBe(
      false
    );
    expect(isKeyboardViewport({ currentHeight: 540, restingHeight: 844 })).toBe(
      true
    );
    expect(isKeyboardViewport({ currentHeight: 260, restingHeight: 390 })).toBe(
      true
    );
  });

  it("requires both an absolute and proportional height reduction", () => {
    expect(isKeyboardViewport({ currentHeight: 680, restingHeight: 790 })).toBe(
      false
    );
    expect(
      isKeyboardViewport({ currentHeight: 1080, restingHeight: 1200 })
    ).toBe(false);
  });

  it("allows a small recovery tolerance while keyboard chrome settles", () => {
    expect(
      hasViewportRecovered({ currentHeight: 810, restingHeight: 844 })
    ).toBe(true);
    expect(
      hasViewportRecovered({ currentHeight: 700, restingHeight: 844 })
    ).toBe(false);
  });
});
