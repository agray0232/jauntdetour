import { formatLocationLabel } from "./locationLabel";

describe("formatLocationLabel", () => {
  it("strips a trailing US country segment", () => {
    expect(formatLocationLabel("Ashland, OH, USA")).toBe("Ashland, OH");
    expect(formatLocationLabel("OH, USA")).toBe("OH");
  });

  it("is case-insensitive and tolerates missing comma", () => {
    expect(formatLocationLabel("Portland usa")).toBe("Portland");
  });

  it("leaves non-US labels untouched", () => {
    expect(formatLocationLabel("Paris, France")).toBe("Paris, France");
    expect(formatLocationLabel("USANville, CA")).toBe("USANville, CA");
  });

  it("returns an empty string for nullish input", () => {
    expect(formatLocationLabel(null)).toBe("");
    expect(formatLocationLabel(undefined)).toBe("");
  });
});
