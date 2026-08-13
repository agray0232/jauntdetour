// Google's Places/Directions labels append the country as the final
// comma-separated segment (e.g. "Ashland, OH, USA"). For domestic results we
// drop that trailing country field when it is the United States so the planner
// shows friendlier labels ("Ashland, OH"). We only remove a whole final
// segment equal to "USA" — never a substring — so a place literally named
// "... USA" (with no country field) and non-US labels are left intact.
export function formatLocationLabel(value) {
  const label = value || "";
  const segments = label.split(",");
  if (segments.length > 1 && segments[segments.length - 1].trim() === "USA") {
    return segments.slice(0, -1).join(",").trimEnd();
  }
  return label;
}
