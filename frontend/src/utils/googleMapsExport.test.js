import { generateGoogleMapsURL } from "./googleMapsExport";

describe("googleMapsExport", () => {
  describe("generateGoogleMapsURL", () => {
    it("should generate a basic URL with origin and destination", () => {
      const url = generateGoogleMapsURL("New York, NY", "Boston, MA");
      expect(url).toContain("https://www.google.com/maps/dir/");
      expect(url).toContain("New%20York%2C%20NY");
      expect(url).toContain("Boston%2C%20MA");
    });

    it("should include detours with coordinates", () => {
      const detours = [{ lat: 41.7658, lng: -72.6734, name: "Hartford, CT" }];
      const url = generateGoogleMapsURL("New York, NY", "Boston, MA", detours);
      expect(url).toContain("41.7658,-72.6734");
    });

    it("should handle multiple detours", () => {
      const detours = [
        { lat: 41.7658, lng: -72.6734, name: "Hartford, CT" },
        { lat: 42.3601, lng: -71.0589, name: "Cambridge, MA" },
      ];
      const url = generateGoogleMapsURL("New York, NY", "Boston, MA", detours);
      expect(url).toContain("41.7658,-72.6734");
      expect(url).toContain("42.3601,-71.0589");
    });

    it("should fallback to name if coordinates are not available", () => {
      const detours = [{ name: "Hartford, CT" }];
      const url = generateGoogleMapsURL("New York, NY", "Boston, MA", detours);
      expect(url).toContain("Hartford%2C%20CT");
    });

    it("should handle empty detour list", () => {
      const url = generateGoogleMapsURL("New York, NY", "Boston, MA", []);
      expect(url).toBe(
        "https://www.google.com/maps/dir/New%20York%2C%20NY/Boston%2C%20MA"
      );
    });

    it("should handle undefined detour list", () => {
      const url = generateGoogleMapsURL("New York, NY", "Boston, MA");
      expect(url).toBe(
        "https://www.google.com/maps/dir/New%20York%2C%20NY/Boston%2C%20MA"
      );
    });

    it("should skip detours without coordinates or name", () => {
      const detours = [
        { lat: 41.7658, lng: -72.6734, name: "Hartford, CT" },
        {}, // Empty detour object
        { lat: 42.3601, lng: -71.0589, name: "Cambridge, MA" },
      ];
      const url = generateGoogleMapsURL("New York, NY", "Boston, MA", detours);
      expect(url).toContain("41.7658,-72.6734");
      expect(url).toContain("42.3601,-71.0589");
    });
  });
});
