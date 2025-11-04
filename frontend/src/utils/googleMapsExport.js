/**
 * Generates a Google Maps URL with the current route including all waypoints
 * @param {string} origin - Starting location
 * @param {string} destination - Ending location
 * @param {Array} detourList - Array of detour objects with lat, lng, name, and placeId properties
 * @returns {string} - Google Maps URL
 */
export function generateGoogleMapsURL(origin, destination, detourList = []) {
  // Base Google Maps directions URL
  const baseURL = "https://www.google.com/maps/dir/";

  // Start with origin
  let url = baseURL + encodeURIComponent(origin);

  // Add each detour as a waypoint using coordinates (most reliable method)
  detourList.forEach((detour) => {
    if (detour.lat && detour.lng) {
      // Use coordinates - this is the most reliable method for Google Maps URLs
      url += "/" + detour.lat + "," + detour.lng;
    } else if (detour.name) {
      // Fallback to name if coordinates aren't available
      url += "/" + encodeURIComponent(detour.name);
    }
  });

  // Add destination
  url += "/" + encodeURIComponent(destination);

  return url;
}

/**
 * Opens the Google Maps route in a new tab/window
 * @param {string} origin - Starting location
 * @param {string} destination - Ending location
 * @param {Array} detourList - Array of detour objects
 */
export function exportToGoogleMaps(origin, destination, detourList = []) {
  const url = generateGoogleMapsURL(origin, destination, detourList);
  window.open(url, "_blank");
}
