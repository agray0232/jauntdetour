import {
  calculateSheetAnchors,
  clampSheetPosition,
  remapSheetPosition,
  resolveSheetRelease,
} from "./mobileSheetGeometry";

describe("mobileSheetGeometry", () => {
  const anchors = calculateSheetAnchors(840);

  it("creates expanded, one-third, and peek anchors", () => {
    expect(anchors).toEqual({ expanded: 8, mid: 560, peek: 784 });
  });

  it("clamps free positions to the sheet bounds", () => {
    expect(clampSheetPosition(-20, anchors)).toBe(8);
    expect(clampSheetPosition(420, anchors)).toBe(420);
    expect(clampSheetPosition(900, anchors)).toBe(784);
  });

  it("magnetically settles releases near an anchor", () => {
    expect(resolveSheetRelease({ anchors, position: 542 })).toEqual({
      anchor: "mid",
      position: 560,
    });
  });

  it("keeps arbitrary positions outside magnetic zones", () => {
    expect(resolveSheetRelease({ anchors, position: 420 })).toEqual({
      anchor: null,
      position: 420,
    });
  });

  it("uses clear velocity to settle at the next anchor", () => {
    expect(
      resolveSheetRelease({ anchors, position: 420, velocity: 0.7 })
    ).toEqual({ anchor: "mid", position: 560 });
    expect(
      resolveSheetRelease({ anchors, position: 700, velocity: -0.7 })
    ).toEqual({ anchor: "mid", position: 560 });
  });

  it("remaps custom positions proportionally after resize", () => {
    const nextAnchors = calculateSheetAnchors(600);
    const remapped = remapSheetPosition({
      anchor: null,
      position: 396,
      previousAnchors: anchors,
      nextAnchors,
    });

    expect(remapped.anchor).toBeNull();
    expect(remapped.position).toBeCloseTo(276, 0);
  });

  it("keeps anchored positions attached after resize", () => {
    const nextAnchors = calculateSheetAnchors(600);
    expect(
      remapSheetPosition({
        anchor: "mid",
        position: anchors.mid,
        previousAnchors: anchors,
        nextAnchors,
      })
    ).toEqual({ anchor: "mid", position: nextAnchors.mid });
  });
});
