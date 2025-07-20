import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icon } from "@fortawesome/fontawesome-svg-core";
import {
  faMapMarkerAlt,
  faHiking,
  faCoffee,
  faLandmark,
  faMonument,
  faUtensils,
  faGlassMartiniAlt,
  faGasPump,
  faChargingStation,
} from "@fortawesome/free-solid-svg-icons";

// Central mapping object from detour types to FontAwesome icons
const DETOUR_ICON_MAP = {
  hike: faHiking,
  coffee: faCoffee,
  museum: faLandmark,
  landmark: faMonument,
  restaurant: faUtensils,
  bar: faGlassMartiniAlt,
  "gas station": faGasPump,
  "gas-station": faGasPump,
  "charging station": faChargingStation,
  "charging-station": faChargingStation,
  origin: faMapMarkerAlt,
  destination: faMapMarkerAlt,
  default: faMapMarkerAlt,
};

/**
 * Normalize detour type string for consistent lookup
 * @param {string} type - The detour type
 * @returns {string} - Normalized type string
 */
function normalizeDetourType(type) {
  if (!type) return "default";
  return type.toLowerCase().trim();
}

/**
 * Get FontAwesome icon definition for a detour type
 * @param {string} type - The detour type
 * @returns {Object} - FontAwesome icon definition
 */
function getIconDefinition(type) {
  const normalizedType = normalizeDetourType(type);
  return DETOUR_ICON_MAP[normalizedType] || DETOUR_ICON_MAP.default;
}

/**
 * Get FontAwesome icon component for React (used in sidebar)
 * @param {string} type - The detour type
 * @param {string} size - Optional size prop for FontAwesome (xs, sm, lg, etc.)
 * @returns {React.Component} - FontAwesome icon component
 */
export function getDetourIconComponent(type, size = undefined) {
  const iconDefinition = getIconDefinition(type);
  return <FontAwesomeIcon icon={iconDefinition} size={size} />;
}

/**
 * Get DOM element with FontAwesome SVG for Google Maps pins
 * @param {string} type - The detour type
 * @param {Object} styles - Optional custom styles for the element
 * @returns {HTMLElement} - DOM element containing FontAwesome SVG
 */
export function getDetourIconElement(type, styles = {}) {
  const iconDefinition = getIconDefinition(type);

  // Generate the SVG using FontAwesome's icon function
  const faIcon = icon(iconDefinition);

  // Create a custom marker element with the FontAwesome SVG
  const markerElement = document.createElement("div");
  markerElement.innerHTML = faIcon.html[0];

  // Apply default styles
  markerElement.style.color = styles.color || "inherit";
  markerElement.style.fontSize = styles.fontSize || "12px";
  markerElement.style.display = "flex";
  markerElement.style.justifyContent = "center";
  markerElement.style.alignItems = "center";

  // Apply any additional custom styles
  Object.assign(markerElement.style, styles);

  return markerElement;
}

/**
 * Get list of all available detour types
 * @returns {Array} - Array of detour type strings
 */
export function getAvailableDetourTypes() {
  return Object.keys(DETOUR_ICON_MAP).filter(
    (type) => type !== "default" && type !== "origin" && type !== "destination"
  );
}
