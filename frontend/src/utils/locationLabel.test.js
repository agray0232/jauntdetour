import { formatLocationLabel } from "./locationLabel";

describe("formatLocationLabel", () => {
  it("drops a trailing USA country field", () => {
    expect(formatLocationLabel("Ashland, OH, USA")).toBe("Ashland, OH");
    expect(formatLocationLabel("OH, USA")).toBe("OH");
  });

  it("leaves non-US country fields untouched", () => {
    expect(formatLocationLabel("Paris, France")).toBe("Paris, France");
    expect(formatLocationLabel("London, ON, Canada")).toBe("London, ON, Canada");
  });

  it("only drops a whole final segment, never a substring", () => {
    expect(formatLocationLabel("Mall of USA, CA, USA")).toBe("Mall of USA, CA");
    expect(formatLocationLabel("USANville, CA")).toBe("USANville, CA");
    expect(formatLocationLabel("Portland USA")).toBe("Portland USA");
  });

  it("keeps a bare USA when it is the only segment", () => {
    expect(formatLocationLabel("USA")).toBe("USA");
  });

  it("returns an empty string for nullish input", () => {
    expect(formatLocationLabel(null)).toBe("");
    expect(formatLocationLabel(undefined)).toBe("");
  });
});
