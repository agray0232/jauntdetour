const routeCoordinates = [
  [33.749, -84.388],
  [34.04, -83.78],
  [34.29, -83.12],
  [34.55, -82.82],
  [34.8526, -82.394],
  [35.09, -81.91],
  [35.2271, -80.8431],
];

const detourCoordinates = [34.9394, -82.3998];

const results = [
  { id: 1, name: "Paris Mountain State Park", category: "Hike", rating: 4.7, coordinates: detourCoordinates },
  { id: 2, name: "Cedar Falls Park", category: "Hike", rating: 4.7, coordinates: [34.7052, -82.3078] },
  { id: 3, name: "Fernwood Nature Trail", category: "Hike", rating: 4.6, coordinates: [34.9066, -82.3489] },
];

const state = {
  routeReady: false,
  activeTab: "build",
  searched: false,
  selectedResult: null,
  detourAdded: false,
  signedIn: false,
  saved: false,
  loadedTrip: false,
  pendingSave: false,
  pendingDeleteCard: null,
  category: "Hike",
};

let map;
let routeLayer;
let searchCircle;
let resultMarkers = [];
let endpointMarkers = [];
let itineraryMarker;
let mapResizeObserver;

const views = [...document.querySelectorAll("[data-view]")];
const siteFooter = document.getElementById("site-footer");
const primaryNav = document.getElementById("primary-nav");
const menuToggle = document.getElementById("menu-toggle");

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons({ attrs: { "aria-hidden": "true" } });
  }
}

function currentRoute() {
  const hash = window.location.hash.replace("#", "") || "home";
  return ["home", "plan", "trips", "trip-detail", "about", "account"].includes(hash) ? hash : "home";
}

function showView(route) {
  if (route === "account" && !state.signedIn) {
    window.location.hash = "home";
    window.setTimeout(() => accountDialog.showModal(), 0);
    return;
  }

  views.forEach((view) => {
    view.hidden = view.dataset.view !== route;
  });

  siteFooter.hidden = route === "plan";
  document.body.classList.toggle("in-planner", route === "plan");

  document.querySelectorAll("[data-nav]").forEach((link) => {
    const active = link.dataset.nav === route || (link.dataset.nav === "trips" && route === "trip-detail");
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  primaryNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  closeAccountMenu();

  if (route === "plan") {
    window.setTimeout(() => {
      initializeMap();
      map.invalidateSize();
      renderMap();
    }, 50);
  }

  window.scrollTo({ top: 0, behavior: "instant" });
  refreshIcons();
}

window.addEventListener("hashchange", () => showView(currentRoute()));

menuToggle.addEventListener("click", () => {
  const open = !primaryNav.classList.contains("open");
  primaryNav.classList.toggle("open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
});

function markerIcon(label, type = "endpoint-marker") {
  return L.divIcon({
    className: `map-number-marker ${type}`,
    html: label,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function initializeMap() {
  if (map || !window.L) return;

  map = L.map("planner-map", { zoomControl: true }).setView([34.45, -82.55], 7);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  mapResizeObserver = new ResizeObserver(() => {
    window.requestAnimationFrame(() => map?.invalidateSize({ pan: false }));
  });
  mapResizeObserver.observe(document.getElementById("planner-map"));
}

function clearResultMarkers() {
  resultMarkers.forEach((marker) => marker.remove());
  resultMarkers = [];
}

function clearEndpointMarkers() {
  endpointMarkers.forEach((marker) => marker.remove());
  endpointMarkers = [];
}

function renderMap() {
  if (!map) return;

  if (routeLayer) routeLayer.remove();
  if (searchCircle) searchCircle.remove();
  if (itineraryMarker) itineraryMarker.remove();
  clearResultMarkers();
  clearEndpointMarkers();

  if (!state.routeReady) {
    map.setView([34.45, -82.55], 7);
    return;
  }

  const plottedRoute = state.detourAdded
    ? [...routeCoordinates.slice(0, 4), detourCoordinates, ...routeCoordinates.slice(4)]
    : routeCoordinates;

  routeLayer = L.polyline(plottedRoute, { color: "#e36a2e", weight: 5, opacity: 0.95 }).addTo(map);
  endpointMarkers = [
    L.marker(routeCoordinates[0], { icon: markerIcon("A") }).addTo(map).bindPopup("Atlanta, GA"),
    L.marker(routeCoordinates.at(-1), { icon: markerIcon("B") }).addTo(map).bindPopup("Charlotte, NC"),
  ];

  if (state.detourAdded) {
    itineraryMarker = L.marker(detourCoordinates, { icon: markerIcon("1", "") })
      .addTo(map)
      .bindPopup("Paris Mountain State Park");
  }

  if (state.activeTab === "discover") {
    const radius = Number(document.getElementById("search-radius").value) * 1000;
    searchCircle = L.circle([34.85, -82.4], {
      radius,
      color: "#12664f",
      fillColor: "#12664f",
      fillOpacity: 0.1,
      weight: 2,
    }).addTo(map);

    if (state.searched) {
      results.forEach((result) => {
        const selectedClass = state.selectedResult === result.id ? "result-marker selected-marker" : "result-marker";
        const marker = L.marker(result.coordinates, { icon: markerIcon(String(result.id), selectedClass) })
          .addTo(map)
          .bindPopup(`<strong>${result.name}</strong><br>${result.rating} stars`);
        if (state.selectedResult === result.id) marker.openPopup();
        resultMarkers.push(marker);
      });
    }
  }

  map.fitBounds(routeLayer.getBounds(), { padding: [55, 55] });
}

const routeForm = document.getElementById("route-form");
const routeSummary = document.getElementById("route-summary");
const discoverTab = document.getElementById("discover-tab");
const buildTab = document.getElementById("build-tab");
const buildPanel = document.getElementById("build-panel");
const discoverPanel = document.getElementById("discover-panel");

document.getElementById("example-route").addEventListener("click", () => {
  document.getElementById("origin").value = "Atlanta, GA";
  document.getElementById("destination").value = "Charlotte, NC";
  document.getElementById("destination").focus();
});

routeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const origin = document.getElementById("origin");
  const destination = document.getElementById("destination");
  if (!origin.value.trim() || !destination.value.trim()) {
    showToast("Enter both a starting point and destination.", "error");
    (!origin.value.trim() ? origin : destination).focus();
    return;
  }

  state.routeReady = true;
  routeForm.hidden = true;
  routeSummary.hidden = false;
  discoverTab.disabled = false;
  document.getElementById("trip-kicker").textContent = "New jaunt";
  document.getElementById("trip-title").textContent = "Atlanta to Charlotte";
  renderItinerary();
  renderMap();
  showToast("Route ready. Now find something worth the detour.");
});

document.getElementById("edit-route").addEventListener("click", () => {
  routeSummary.hidden = true;
  routeForm.hidden = false;
  routeForm.querySelector("input").focus();
});

function setPlannerTab(tab) {
  if (tab === "discover" && !state.routeReady) return;
  state.activeTab = tab;
  const buildActive = tab === "build";
  buildTab.classList.toggle("active", buildActive);
  discoverTab.classList.toggle("active", !buildActive);
  buildTab.setAttribute("aria-selected", String(buildActive));
  discoverTab.setAttribute("aria-selected", String(!buildActive));
  buildPanel.hidden = !buildActive;
  discoverPanel.hidden = buildActive;
  renderMap();
}

buildTab.addEventListener("click", () => setPlannerTab("build"));
discoverTab.addEventListener("click", () => setPlannerTab("discover"));
document.getElementById("find-detour").addEventListener("click", () => setPlannerTab("discover"));
document.getElementById("find-another").addEventListener("click", () => setPlannerTab("discover"));

const routePosition = document.getElementById("route-position");
const routePositionOutput = document.getElementById("route-position-output");
routePosition.addEventListener("input", () => {
  const value = Number(routePosition.value);
  const label = value >= 45 && value <= 55 ? "Halfway" : value < 45 ? "Early in the drive" : "Later in the drive";
  routePositionOutput.textContent = `${label} · ${value}%`;
});

const searchRadius = document.getElementById("search-radius");
const searchRadiusOutput = document.getElementById("search-radius-output");
searchRadius.addEventListener("input", () => {
  searchRadiusOutput.textContent = `${searchRadius.value} km`;
  renderMap();
});

document.getElementById("category-grid").addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  document.querySelectorAll("[data-category]").forEach((item) => item.classList.toggle("active", item === button));
});

const searchState = document.getElementById("search-state");
const resultsSection = document.getElementById("results-section");

document.getElementById("search-area").addEventListener("click", (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  button.innerHTML = '<span class="loading-dot"></span> Searching this area';
  window.setTimeout(() => {
    state.searched = true;
    searchState.hidden = true;
    resultsSection.hidden = false;
    document.getElementById("results-count").textContent = state.category === "Hike" ? "3 places" : `3 ${state.category.toLowerCase()} ideas`;
    renderResults();
    renderMap();
    button.disabled = false;
    button.innerHTML = '<i data-lucide="search"></i> Search this area';
    refreshIcons();
    showToast("Found 3 places near this part of the route.");
  }, 450);
});

document.getElementById("clear-results").addEventListener("click", () => {
  state.searched = false;
  state.selectedResult = null;
  resultsSection.hidden = true;
  searchState.hidden = false;
  renderMap();
});

function renderResults() {
  const resultList = document.getElementById("result-list");
  resultList.innerHTML = "";
  results.forEach((result) => {
    const card = document.createElement("div");
    card.className = `result-card${state.selectedResult === result.id ? " selected" : ""}`;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Select ${result.name}, ${result.rating} stars`);
    card.innerHTML = `
      <span class="result-number">${result.id}</span>
      <span><strong>${result.name}</strong><small>${state.category} · ${result.rating} stars</small></span>
      <span class="button ${state.selectedResult === result.id ? "button-primary" : "button-secondary"}" aria-hidden="true">
        ${state.selectedResult === result.id ? "Add to jaunt" : "Select"}
      </span>`;

    const select = () => {
      if (state.selectedResult === result.id) {
        addDetour(result);
      } else {
        state.selectedResult = result.id;
        renderResults();
        renderMap();
      }
    };
    card.addEventListener("click", select);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        select();
      }
    });
    resultList.appendChild(card);
  });
}

function addDetour(result) {
  state.detourAdded = true;
  state.selectedResult = null;
  document.getElementById("distance-value").textContent = "258 mi";
  document.getElementById("time-value").textContent = "4 hr 05 min";
  renderItinerary();
  setPlannerTab("build");
  showToast(`${result.name} added. The route is 18 minutes longer.`);
}

function removeDetour() {
  state.detourAdded = false;
  document.getElementById("distance-value").textContent = "245 mi";
  document.getElementById("time-value").textContent = "3 hr 47 min";
  renderItinerary();
  renderMap();
  showToast("Detour removed. Route restored.");
}

function renderItinerary() {
  const itinerary = document.getElementById("itinerary-list");
  itinerary.innerHTML = `
    <li><span class="itinerary-marker endpoint">A</span><div><strong>Atlanta, GA</strong><small>Starting point</small></div></li>
    ${state.detourAdded ? `<li><span class="itinerary-marker detour">1</span><div><strong>Paris Mountain State Park</strong><small>Hike · 4.7 stars · +18 min</small></div><div class="itinerary-actions"><button class="icon-button" id="move-detour" type="button" aria-label="Move Paris Mountain State Park"><i data-lucide="arrow-up-down"></i></button><button class="icon-button" id="remove-detour" type="button" aria-label="Remove Paris Mountain State Park"><i data-lucide="trash-2"></i></button></div></li>` : ""}
    <li><span class="itinerary-marker endpoint">B</span><div><strong>Charlotte, NC</strong><small>Destination</small></div></li>`;

  if (state.detourAdded) {
    document.getElementById("remove-detour").addEventListener("click", removeDetour);
    document.getElementById("move-detour").addEventListener("click", () => showToast("With one detour, the route order is already set."));
  }
  refreshIcons();
}

document.getElementById("show-map").addEventListener("click", () => {
  document.getElementById("map-workspace").classList.add("mobile-expanded");
  window.setTimeout(() => map?.invalidateSize(), 100);
});

document.getElementById("close-mobile-map").addEventListener("click", () => {
  document.getElementById("map-workspace").classList.remove("mobile-expanded");
});

const accountDialog = document.getElementById("account-dialog");
const accountLabel = document.getElementById("account-label");
const accountButton = document.getElementById("account-button");
const accountMenu = document.getElementById("account-menu");

function openAccountMenu() {
  accountMenu.hidden = false;
  accountButton.setAttribute("aria-expanded", "true");
  accountMenu.querySelector('[role="menuitem"]').focus();
}

function closeAccountMenu({ restoreFocus = false } = {}) {
  if (!accountMenu || accountMenu.hidden) return;
  accountMenu.hidden = true;
  accountButton.setAttribute("aria-expanded", "false");
  if (restoreFocus) accountButton.focus();
}

accountButton.addEventListener("click", () => {
  if (state.signedIn) {
    if (accountMenu.hidden) openAccountMenu();
    else closeAccountMenu({ restoreFocus: true });
  } else {
    accountDialog.showModal();
  }
});

accountMenu.addEventListener("keydown", (event) => {
  const items = [...accountMenu.querySelectorAll('[role="menuitem"]')];
  const currentIndex = items.indexOf(document.activeElement);
  let nextIndex;

  if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % items.length;
  if (event.key === "ArrowUp") nextIndex = (currentIndex - 1 + items.length) % items.length;
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = items.length - 1;
  if (event.key === "Escape") {
    event.preventDefault();
    closeAccountMenu({ restoreFocus: true });
    return;
  }

  if (nextIndex !== undefined) {
    event.preventDefault();
    items[nextIndex].focus();
  }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".account-control")) closeAccountMenu();
});

document.getElementById("demo-sign-in").addEventListener("click", () => {
  state.signedIn = true;
  accountLabel.textContent = "Alex";
  accountButton.setAttribute("aria-label", "Open account menu for Alex Morgan");
  accountDialog.close();
  if (state.pendingSave) {
    state.pendingSave = false;
    persistMockTrip();
  } else {
    showToast("Signed in as demo user Alex.");
  }
});

function signOutDemoUser() {
  state.signedIn = false;
  state.pendingSave = false;
  accountLabel.textContent = "Sign in";
  accountButton.setAttribute("aria-label", "Sign in");
  closeAccountMenu();
  window.location.hash = "home";
  showToast("Signed out of the demo account.");
}

document.getElementById("menu-sign-out").addEventListener("click", signOutDemoUser);
document.getElementById("profile-sign-out").addEventListener("click", signOutDemoUser);

document.getElementById("save-trip").addEventListener("click", () => {
  if (!state.signedIn) {
    state.pendingSave = true;
    document.getElementById("account-dialog-title").textContent = "Sign in to save your jaunt";
    document.getElementById("account-dialog-copy").textContent = "Your in-progress jaunt will stay here after sign-in. This prototype uses a demo account.";
    accountDialog.showModal();
    return;
  }
  persistMockTrip();
});

function persistMockTrip() {
  const name = document.getElementById("trip-name");
  if (!name.value.trim()) {
    name.value = "Carolinas weekend";
  }
  state.saved = true;
  document.getElementById("save-status").textContent = "Saved";
  document.getElementById("save-status").classList.add("saved");
  document.getElementById("trip-kicker").textContent = "Saved jaunt";
  document.getElementById("trip-title").textContent = name.value;
  showToast("Jaunt saved to My Jaunts.");
}

document.getElementById("export-trip").addEventListener("click", () => showToast("Prototype: this would open the jaunt in Google Maps."));
document.getElementById("detail-export").addEventListener("click", () => showToast("Prototype: this would open the route in Google Maps."));

document.getElementById("resume-trip").addEventListener("click", () => {
  loadSavedTrip();
  window.location.hash = "plan";
});

function loadSavedTrip() {
  state.routeReady = true;
  state.detourAdded = true;
  state.loadedTrip = true;
  state.saved = true;
  document.getElementById("origin").value = "Atlanta, GA";
  document.getElementById("destination").value = "Charlotte, NC";
  document.getElementById("trip-name").value = "Carolinas weekend";
  document.getElementById("trip-kicker").textContent = "Saved jaunt";
  document.getElementById("trip-title").textContent = "Carolinas weekend";
  document.getElementById("save-status").textContent = "Saved";
  document.getElementById("save-status").classList.add("saved");
  document.getElementById("distance-value").textContent = "258 mi";
  document.getElementById("time-value").textContent = "4 hr 05 min";
  routeForm.hidden = true;
  routeSummary.hidden = false;
  discoverTab.disabled = false;
  renderItinerary();
  setPlannerTab("build");
}

document.querySelector(".load-mountain").addEventListener("click", () => showToast("This prototype fully wires the Carolinas weekend example."));

document.querySelectorAll(".duplicate-trip").forEach((button) => {
  button.addEventListener("click", () => showToast("Jaunt duplicated as Copy of jaunt."));
});
document.getElementById("detail-duplicate").addEventListener("click", () => showToast("Jaunt duplicated as Copy of Carolinas weekend."));

const deleteDialog = document.getElementById("delete-dialog");
document.querySelectorAll(".delete-trip").forEach((button) => {
  button.addEventListener("click", () => {
    state.pendingDeleteCard = button.closest("[data-trip-card]");
    deleteDialog.showModal();
  });
});

document.getElementById("confirm-delete").addEventListener("click", () => {
  state.pendingDeleteCard?.remove();
  state.pendingDeleteCard = null;
  deleteDialog.close();
  showToast("Jaunt deleted.");
});

function showToast(message, intent = "success") {
  const region = document.getElementById("toast-region");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<i data-lucide="${intent === "error" ? "circle-alert" : "circle-check"}"></i><span>${message}</span>`;
  region.appendChild(toast);
  refreshIcons();
  window.setTimeout(() => toast.remove(), 3400);
}

document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});

refreshIcons();
showView(currentRoute());