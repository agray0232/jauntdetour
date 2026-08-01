import React from "react";
import {
  BuildingBankRegular,
  BuildingGovernmentRegular,
  DrinkCoffeeRegular,
  DrinkMargaritaRegular,
  FoodRegular,
  GasPumpRegular,
  LocationRegular,
  MountainLocationTopRegular,
  PlugConnectedRegular,
} from "@fluentui/react-icons";

const DETOUR_ICON_MAP = {
  hike: MountainLocationTopRegular,
  coffee: DrinkCoffeeRegular,
  museum: BuildingBankRegular,
  landmark: BuildingGovernmentRegular,
  restaurant: FoodRegular,
  bar: DrinkMargaritaRegular,
  "gas station": GasPumpRegular,
  "gas-station": GasPumpRegular,
  "charging station": PlugConnectedRegular,
  "charging-station": PlugConnectedRegular,
  origin: LocationRegular,
  destination: LocationRegular,
  default: LocationRegular,
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
 * Get the Fluent icon component for a detour type.
 * @param {string} type - The detour type
 * @returns {React.ComponentType} Fluent icon component
 */
function getIconComponent(type) {
  const normalizedType = normalizeDetourType(type);
  return DETOUR_ICON_MAP[normalizedType] || DETOUR_ICON_MAP.default;
}

/**
 * Get a detour icon for React compositions and map markers.
 * @param {string} type - The detour type
 * @param {string|number} size - Optional icon font size
 * @returns {React.Component} Fluent icon element
 */
export function getDetourIconComponent(type, size = undefined) {
  const IconComponent = getIconComponent(type);
  return <IconComponent aria-hidden="true" fontSize={size} />;
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
