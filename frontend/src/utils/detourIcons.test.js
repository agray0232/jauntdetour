import {
  getDetourIconComponent,
  getDetourIconElement,
  getAvailableDetourTypes,
} from "./detourIcons";

describe("detourIcons", () => {
  describe("getAvailableDetourTypes", () => {
    it("should return an array of detour types", () => {
      const types = getAvailableDetourTypes();
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThan(0);
    });

    it("should not include default, origin, or destination in available types", () => {
      const types = getAvailableDetourTypes();
      expect(types).not.toContain("default");
      expect(types).not.toContain("origin");
      expect(types).not.toContain("destination");
    });

    it("should include expected detour types", () => {
      const types = getAvailableDetourTypes();
      expect(types).toContain("hike");
      expect(types).toContain("coffee");
      expect(types).toContain("restaurant");
      expect(types).toContain("museum");
    });
  });

  describe("getDetourIconComponent", () => {
    it("should return a React component", () => {
      const icon = getDetourIconComponent("hike");
      expect(icon).toBeDefined();
      expect(icon.type).toBeDefined();
    });

    it("should return an icon for known types", () => {
      const hikeIcon = getDetourIconComponent("hike");
      const coffeeIcon = getDetourIconComponent("coffee");
      expect(hikeIcon).toBeDefined();
      expect(coffeeIcon).toBeDefined();
    });

    it("should return default icon for unknown types", () => {
      const unknownIcon = getDetourIconComponent("unknown-type");
      expect(unknownIcon).toBeDefined();
    });

    it("should handle case insensitivity", () => {
      const lowerIcon = getDetourIconComponent("hike");
      const upperIcon = getDetourIconComponent("HIKE");
      expect(lowerIcon).toBeDefined();
      expect(upperIcon).toBeDefined();
    });

    it("should handle null or undefined type", () => {
      const nullIcon = getDetourIconComponent(null);
      const undefinedIcon = getDetourIconComponent(undefined);
      expect(nullIcon).toBeDefined();
      expect(undefinedIcon).toBeDefined();
    });
  });

  describe("getDetourIconElement", () => {
    it("should return an HTMLElement", () => {
      const element = getDetourIconElement("hike");
      expect(element).toBeInstanceOf(HTMLElement);
    });

    it("should create element for known types", () => {
      const element = getDetourIconElement("restaurant");
      expect(element).toBeDefined();
      expect(element.tagName).toBe("DIV");
    });

    it("should apply default styles", () => {
      const element = getDetourIconElement("coffee");
      expect(element.style.fontSize).toBe("12px");
      expect(element.style.display).toBe("flex");
      expect(element.style.justifyContent).toBe("center");
      expect(element.style.alignItems).toBe("center");
    });

    it("should apply custom styles", () => {
      const customStyles = {
        color: "red",
        fontSize: "24px",
      };
      const element = getDetourIconElement("hike", customStyles);
      expect(element.style.color).toBe("red");
      expect(element.style.fontSize).toBe("24px");
    });

    it("should handle unknown types with default icon", () => {
      const element = getDetourIconElement("unknown-type");
      expect(element).toBeDefined();
      expect(element.tagName).toBe("DIV");
    });
  });
});
