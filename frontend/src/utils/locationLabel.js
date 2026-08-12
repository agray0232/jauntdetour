// Google's Places/Directions labels append ", USA" to domestic results. We
// strip that trailing country segment so the planner shows friendlier labels
// (e.g. "Ashland, OH" instead of "Ashland, OH, USA"). Non-US labels are left
// untouched.
export function formatLocationLabel(value) {
  return (value || "").replace(/,?\s+USA$/i, "");
}
