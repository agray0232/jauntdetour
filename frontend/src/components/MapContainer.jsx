import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  Button,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Text,
} from "@fluentui/react-components";
import { DeleteRegular, MoreHorizontalRegular } from "@fluentui/react-icons";
//import { Map, Circle , Polyline, Marker, GoogleApiWrapper } from 'google-maps-react';
import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map,
  Pin,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import config from "../config/config.js";
import { jauntColors } from "../design-system/tokens";
import { getDetourIconComponent } from "../utils/detourIcons.js";
import {
  getRoutePoint,
  getVisibleDetourOptions,
} from "./planner/discover-workflow/discoverRoute";

const CONTIGUOUS_US_BOUNDS = {
  north: 49.384358,
  south: 24.396308,
  east: -66.93457,
  west: -124.848974,
  padding: 24,
};

const WORLD_BOUNDS = {
  north: 85.051129,
  south: -85.051129,
  east: 180,
  west: -180,
};

const MIN_ZOOM = 4;
const MARKER_DETAILS_OFFSET = [0, -46];
const MARKER_HOVER_DISMISS_DELAY = 400;

function normalizeCoordinates(location) {
  if (!Number.isFinite(location?.lat) || !Number.isFinite(location?.lng)) {
    return null;
  }

  const { north, south, east, west } = WORLD_BOUNDS;
  if (
    location.lat > north ||
    location.lat < south ||
    location.lng > east ||
    location.lng < west
  ) {
    return null;
  }

  return { lat: location.lat, lng: location.lng };
}

function getRouteEndpoints(route, origin, destination) {
  const legs = Array.isArray(route?.legs) ? route.legs : [];
  const firstLeg = legs[0];
  const lastLeg = legs[legs.length - 1];

  return {
    start:
      normalizeCoordinates(firstLeg?.start_location) ||
      normalizeCoordinates(origin),
    destination:
      normalizeCoordinates(lastLeg?.end_location) ||
      normalizeCoordinates(destination),
  };
}

function formatAddedTime(addedTime) {
  if (!Number.isFinite(addedTime) || addedTime < 0) return null;

  const hours = Math.floor(addedTime / 60);
  const minutes = addedTime % 60;
  return `+ ${hours ? `${hours} hr ` : ""}${minutes} min`;
}

function MarkerDetails({ feature }) {
  return (
    <div
      style={{
        display: "grid",
        width: "12rem",
        maxWidth: "100%",
        minWidth: 0,
        rowGap: "0.25rem",
        color: jauntColors.neutral.foreground,
      }}
    >
      {feature.address ? <Text size={200}>{feature.address}</Text> : null}
      {feature.category ? <Text size={200}>{feature.category}</Text> : null}
      {feature.rating ? <Text size={200}>{feature.rating} rating</Text> : null}
      {feature.addedTimeText ? (
        <Text size={200}>{feature.addedTimeText}</Text>
      ) : null}
    </div>
  );
}

function SelectableMapMarker({
  active,
  background,
  feature,
  iconType,
  onClose,
  onHover,
  onRemoveDetour,
  onSelect,
  pending,
  showDetails,
  zIndex,
}) {
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [actionMenuRequested, setActionMenuRequested] = useState(false);
  const detailsContentRef = useRef(null);
  const hoverDismissTimeoutRef = useRef(null);
  const infoWindowHoveredRef = useRef(false);

  const cancelHoverDismissal = () => {
    window.clearTimeout(hoverDismissTimeoutRef.current);
    hoverDismissTimeoutRef.current = null;
  };

  const beginHover = () => {
    cancelHoverDismissal();
    onHover(feature.id);
  };

  const scheduleHoverDismissal = () => {
    cancelHoverDismissal();
    hoverDismissTimeoutRef.current = window.setTimeout(() => {
      onHover(null);
    }, MARKER_HOVER_DISMISS_DELAY);
  };

  const enterInfoWindow = () => {
    infoWindowHoveredRef.current = true;
    cancelHoverDismissal();
  };

  const leaveInfoWindow = (event) => {
    const infoWindowElement =
      detailsContentRef.current?.closest(".gm-style-iw");
    const bounds = infoWindowElement?.getBoundingClientRect();
    if (
      bounds?.width > 0 &&
      bounds?.height > 0 &&
      event.clientX >= bounds.left &&
      event.clientX <= bounds.right &&
      event.clientY >= bounds.top &&
      event.clientY <= bounds.bottom
    ) {
      enterInfoWindow();
      return;
    }
    infoWindowHoveredRef.current = false;
    scheduleHoverDismissal();
  };

  useEffect(() => {
    if (showDetails === "selected" && actionMenuRequested) {
      setActionMenuOpen(true);
      setActionMenuRequested(false);
    } else if (showDetails !== "selected") {
      setActionMenuOpen(false);
    }
  }, [actionMenuRequested, showDetails]);

  useEffect(
    () => () => window.clearTimeout(hoverDismissTimeoutRef.current),
    []
  );

  useEffect(() => {
    if (!showDetails) return undefined;
    let infoWindowElement = null;
    const handleMouseMove = (event) => {
      const bounds = infoWindowElement?.getBoundingClientRect();
      const isInsideInfoWindow =
        bounds?.width > 0 &&
        bounds?.height > 0 &&
        event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom;
      if (isInsideInfoWindow) {
        enterInfoWindow();
      } else if (infoWindowHoveredRef.current) {
        infoWindowHoveredRef.current = false;
        scheduleHoverDismissal();
      }
    };
    const attachInfoWindowListeners = () => {
      infoWindowElement =
        detailsContentRef.current?.closest(".gm-style-iw") || null;
      if (!infoWindowElement) return false;
      infoWindowElement.addEventListener("mouseenter", enterInfoWindow);
      infoWindowElement.addEventListener("mouseleave", leaveInfoWindow);
      document.addEventListener("mousemove", handleMouseMove);
      return true;
    };
    const observer = new MutationObserver(() => {
      if (attachInfoWindowListeners()) {
        observer.disconnect();
      }
    });

    if (!attachInfoWindowListeners()) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
    return () => {
      observer.disconnect();
      infoWindowElement?.removeEventListener("mouseenter", enterInfoWindow);
      infoWindowElement?.removeEventListener("mouseleave", leaveInfoWindow);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  });

  const handleMenuOpenChange = (event, data) => {
    if (data.open && showDetails !== "selected") {
      cancelHoverDismissal();
      onSelect(feature.id);
      setActionMenuRequested(true);
      return;
    }
    setActionMenuOpen(data.open);
  };

  const handleClose = () => {
    cancelHoverDismissal();
    if (showDetails === "hovered") {
      onHover(null);
    }
    onClose(feature.id, showDetails);
  };

  return (
    <>
      <AdvancedMarker
        position={feature.position}
        title={feature.accessibleName}
        onClick={() => onSelect(feature.id)}
        onMouseEnter={beginHover}
        onMouseLeave={scheduleHoverDismissal}
        zIndex={active ? zIndex + 10 : zIndex}
      >
        <Pin
          scale={active ? 1.25 : 1.1}
          background={background}
          borderColor={
            showDetails === "selected"
              ? jauntColors.brand.primary
              : jauntColors.neutral.foregroundOnDark
          }
          glyphColor={jauntColors.neutral.foregroundOnDark}
        >
          {getDetourIconComponent(iconType, "1.125rem")}
        </Pin>
      </AdvancedMarker>
      {showDetails ? (
        <InfoWindow
          ariaLabel={`${feature.heading} details`}
          className={
            showDetails === "hovered"
              ? "jaunt-marker-details--hovered"
              : "jaunt-marker-details--selected"
          }
          disableAutoPan
          headerContent={
            <div
              data-testid={`marker-details-header-${feature.id}`}
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "0.25rem",
                width: "100%",
                transform: "translateY(-0.3125rem)",
              }}
              onMouseEnter={enterInfoWindow}
              onMouseLeave={leaveInfoWindow}
            >
              <Text weight="semibold">{feature.heading}</Text>
              {feature.detourIndex != null ? (
                onRemoveDetour ? (
                  <Menu
                    open={actionMenuOpen}
                    onOpenChange={handleMenuOpenChange}
                  >
                    <MenuTrigger disableButtonEnhancement>
                      <Button
                        appearance="transparent"
                        aria-label={`Actions for ${feature.heading}`}
                        disabled={pending}
                        icon={<MoreHorizontalRegular />}
                        size="small"
                      />
                    </MenuTrigger>
                    <MenuPopover>
                      <MenuList>
                        <MenuItem
                          icon={<DeleteRegular />}
                          onClick={() => onRemoveDetour(feature.detourIndex)}
                        >
                          Remove detour
                        </MenuItem>
                      </MenuList>
                    </MenuPopover>
                  </Menu>
                ) : (
                  <span
                    aria-hidden="true"
                    style={{ display: "block", width: "2rem" }}
                  />
                )
              ) : null}
            </div>
          }
          maxWidth={280}
          onClose={handleClose}
          pixelOffset={MARKER_DETAILS_OFFSET}
          position={feature.position}
          shouldFocus={false}
        >
          <div
            data-testid={`marker-details-body-${feature.id}`}
            ref={detailsContentRef}
            onMouseEnter={enterInfoWindow}
            onMouseLeave={leaveInfoWindow}
          >
            <MarkerDetails feature={feature} />
          </div>
        </InfoWindow>
      ) : null}
    </>
  );
}

// Custom hook for map bounds adjustment - only on route change
function useMapBounds(map, route) {
  const mapsLibrary = useMapsLibrary("maps");
  const lastRouteIdRef = useRef(null);

  useEffect(() => {
    if (!map || !mapsLibrary || !route) return;

    // Create a unique identifier for the route based on its bounds
    const routeId = route.bounds
      ? `${route.bounds.northeast.lat}-${route.bounds.northeast.lng}-${route.bounds.southwest.lat}-${route.bounds.southwest.lng}`
      : null;

    // Only fit bounds if this is a completely new route (route ID changed)
    if (!routeId || lastRouteIdRef.current === routeId) return;

    // Add a small delay to ensure the map is fully loaded
    const timeoutId = setTimeout(() => {
      const bounds = new window.google.maps.LatLngBounds();

      if (route.bounds) {
        const ne_lat = route.bounds.northeast.lat;
        const ne_lng = route.bounds.northeast.lng;
        const sw_lat = route.bounds.southwest.lat;
        const sw_lng = route.bounds.southwest.lng;
        bounds.extend(new window.google.maps.LatLng(ne_lat, ne_lng));
        bounds.extend(new window.google.maps.LatLng(sw_lat, sw_lng));

        map.fitBounds(bounds);
        lastRouteIdRef.current = routeId;
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [map, mapsLibrary, route]);
}

// Map bounds component that uses the map context
function MapBounds({ route }) {
  const map = useMap();
  useMapBounds(map, route);
  return null;
}

function MapResizeObserver() {
  const map = useMap();

  useEffect(() => {
    if (!map || typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const mapElement = map.getDiv();
    const observedElement = mapElement.parentElement || mapElement;
    const observer = new ResizeObserver(() => {
      if (window.google?.maps?.event) {
        window.google.maps.event.trigger(map, "resize");
      }
    });

    observer.observe(observedElement);
    return () => observer.disconnect();
  }, [map]);

  return null;
}

// Polyline component
function RoutePolyline({ route, showRoute }) {
  const map = useMap();
  const mapsLibrary = useMapsLibrary("maps");
  const polylineRef = useRef(null);

  useEffect(() => {
    if (
      !map ||
      !mapsLibrary ||
      !showRoute ||
      !route?.overview_polyline?.complete_overview
    )
      return;

    // Clean up existing polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    const routeCoordinates = route.overview_polyline.complete_overview.map(
      (point) => ({
        lat: point[0],
        lng: point[1],
      })
    );

    polylineRef.current = new window.google.maps.Polyline({
      path: routeCoordinates,
      geodesic: true,
      strokeColor: jauntColors.map.route,
      strokeOpacity: 1.0,
      strokeWeight: 5,
    });

    polylineRef.current.setMap(map);

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, mapsLibrary, showRoute, route]);

  return null;
}

// Circle component
function DetourCircle({
  detourPoint,
  detourSearchRadius,
  showDetourSearchPoint,
}) {
  const map = useMap();
  const mapsLibrary = useMapsLibrary("maps");
  const circleRef = useRef(null);

  useEffect(() => {
    if (!map || !mapsLibrary || !showDetourSearchPoint || !detourPoint) return;

    // Clean up existing circle
    if (circleRef.current) {
      circleRef.current.setMap(null);
    }

    circleRef.current = new window.google.maps.Circle({
      center: detourPoint,
      radius: parseFloat(detourSearchRadius),
      strokeColor: "transparent",
      strokeOpacity: 0,
      strokeWeight: 5,
      fillColor: jauntColors.map.searchArea,
      fillOpacity: 0.2,
    });

    circleRef.current.setMap(map);

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
      }
    };
  }, [
    map,
    mapsLibrary,
    showDetourSearchPoint,
    detourPoint,
    detourSearchRadius,
  ]);

  return null;
}

// Main MapContainer component - TEST CHANGE
function MapContainer(props) {
  const mapRef = useRef(null);
  const [selectedFeatureId, setSelectedFeatureId] = useState(null);
  const [hoveredFeatureId, setHoveredFeatureId] = useState(null);
  const selectedFeatureIdRef = useRef(selectedFeatureId);
  const hoveredFeatureIdRef = useRef(hoveredFeatureId);
  selectedFeatureIdRef.current = selectedFeatureId;
  hoveredFeatureIdRef.current = hoveredFeatureId;
  const routeEndpoints = getRouteEndpoints(
    props.route,
    props.origin,
    props.destination
  );

  const detourPoint =
    props.showDetourSearchPoint && props.showRoute
      ? getRoutePoint(props.route, props.detourSearchLocation)
      : null;

  const legs = Array.isArray(props.route?.legs) ? props.route.legs : [];
  const firstLeg = legs[0];
  const lastLeg = legs[legs.length - 1];
  const endpointFeatures = {
    start: routeEndpoints.start
      ? {
          id: "start",
          accessibleName: "Jaunt start",
          heading: "Start",
          address: firstLeg?.start_address || props.origin?.address,
          position: routeEndpoints.start,
        }
      : null,
    destination: routeEndpoints.destination
      ? {
          id: "destination",
          accessibleName: "Jaunt destination",
          heading: "Destination",
          address: lastLeg?.end_address || props.destination?.address,
          position: routeEndpoints.destination,
        }
      : null,
  };
  const addedDetourFeatures = (props.detourList || []).map((detour, index) => ({
    id: `detour-${detour.placeId || detour.id || index}`,
    accessibleName: `${detour.name}, added stop`,
    heading: detour.name,
    category: detour.type,
    rating: detour.rating,
    addedTimeText: formatAddedTime(detour.addedTime),
    detourIndex: index,
    position: { lat: detour.lat, lng: detour.lng },
  }));
  const visibleFeatureIds = [
    ...(props.showRoute && endpointFeatures.start ? ["start"] : []),
    ...(props.showRoute && endpointFeatures.destination ? ["destination"] : []),
    ...addedDetourFeatures.map((feature) => feature.id),
  ];
  const visibleFeatureIdsKey = visibleFeatureIds.join("|");

  useEffect(() => {
    if (
      selectedFeatureId &&
      !visibleFeatureIdsKey.split("|").includes(selectedFeatureId)
    ) {
      setSelectedFeatureId(null);
    }
  }, [selectedFeatureId, visibleFeatureIdsKey]);

  useEffect(() => {
    if (
      hoveredFeatureId &&
      !visibleFeatureIdsKey.split("|").includes(hoveredFeatureId)
    ) {
      setHoveredFeatureId(null);
    }
  }, [hoveredFeatureId, visibleFeatureIdsKey]);

  useEffect(() => {
    if (!selectedFeatureId) return undefined;

    const dismissSelectedFeature = (event) => {
      if (event.key !== "Escape") return;
      setHoveredFeatureId(null);
      setSelectedFeatureId(null);
    };

    document.addEventListener("keydown", dismissSelectedFeature);
    return () =>
      document.removeEventListener("keydown", dismissSelectedFeature);
  }, [selectedFeatureId]);

  const closeFeatureDetails = (featureId, detailsMode) => {
    if (
      detailsMode === "selected" &&
      selectedFeatureIdRef.current === featureId
    ) {
      setSelectedFeatureId(null);
    }
    if (
      detailsMode === "hovered" &&
      hoveredFeatureIdRef.current === featureId
    ) {
      setHoveredFeatureId(null);
    }
  };

  const selectDetourOption = (placeId) => {
    props.setDetourHighlight?.(
      props.detourOptions.map((option) => ({
        id: option.place_id,
        highlight: option.place_id === placeId,
      }))
    );
  };

  return (
    <APIProvider apiKey={config.GOOGLE_API_KEY}>
      <div className="jaunt-map" style={{ width: "100%", height: "100%" }}>
        <Map
          ref={mapRef}
          cameraControl={props.cameraControl !== false}
          defaultBounds={CONTIGUOUS_US_BOUNDS}
          minZoom={MIN_ZOOM}
          restriction={{
            latLngBounds: WORLD_BOUNDS,
            strictBounds: true,
          }}
          style={{
            width: "100%",
            height: "100%",
          }}
          fullscreenControl={false}
          mapId="DEMO_MAP_ID"
          mapTypeControl={props.mapTypeControl !== false}
          onClick={() => {
            setHoveredFeatureId(null);
            setSelectedFeatureId(null);
          }}
          streetViewControl={false}
          zoomControl={props.zoomControl !== false}
        >
          <MapResizeObserver />

          {/* Map bounds adjustment - only fits bounds on new route */}
          <MapBounds route={props.route} />

          {/* Route polyline */}
          <RoutePolyline route={props.route} showRoute={props.showRoute} />

          {props.showRoute && (
            <>
              {endpointFeatures.start ? (
                <SelectableMapMarker
                  active={
                    selectedFeatureId === "start" ||
                    hoveredFeatureId === "start"
                  }
                  background={jauntColors.map.endpoint}
                  feature={endpointFeatures.start}
                  iconType="origin"
                  onClose={closeFeatureDetails}
                  onHover={setHoveredFeatureId}
                  onSelect={setSelectedFeatureId}
                  showDetails={
                    selectedFeatureId === "start"
                      ? "selected"
                      : hoveredFeatureId === "start"
                        ? "hovered"
                        : null
                  }
                  zIndex={0}
                />
              ) : null}
              {endpointFeatures.destination ? (
                <SelectableMapMarker
                  active={
                    selectedFeatureId === "destination" ||
                    hoveredFeatureId === "destination"
                  }
                  background={jauntColors.map.endpoint}
                  feature={endpointFeatures.destination}
                  iconType="destination"
                  onClose={closeFeatureDetails}
                  onHover={setHoveredFeatureId}
                  onSelect={setSelectedFeatureId}
                  showDetails={
                    selectedFeatureId === "destination"
                      ? "selected"
                      : hoveredFeatureId === "destination"
                        ? "hovered"
                        : null
                  }
                  zIndex={0}
                />
              ) : null}
            </>
          )}

          {/* Detour search point marker */}
          {props.showDetourSearchPoint && detourPoint && (
            <AdvancedMarker position={detourPoint}>
              <Pin
                scale={0.75}
                background={jauntColors.map.searchArea}
                borderColor={jauntColors.map.endpoint}
                glyphColor={jauntColors.neutral.foregroundOnDark}
              />
            </AdvancedMarker>
          )}

          {/* Detour search circle */}
          <DetourCircle
            detourPoint={detourPoint}
            detourSearchRadius={props.detourSearchRadius}
            showDetourSearchPoint={props.showDetourSearchPoint}
          />

          {/* Detour options markers */}
          {props.detourOptions?.length > 0 &&
            getVisibleDetourOptions(props.detourOptions, props.detourList).map(
              ({ option: detour, index }) => {
                // Check if this detour should be highlighted
                const highlight = props.detourHighlight?.some(
                  (detourHighlight) =>
                    detourHighlight.id === detour.place_id &&
                    detourHighlight.highlight
                );
                const hovered = props.hoveredDetourId === detour.place_id;

                return (
                  <AdvancedMarker
                    key={`detour-option-${detour.place_id || index}`}
                    title={`${index + 1}. ${detour.name}`}
                    onClick={() => selectDetourOption(detour.place_id)}
                    onMouseEnter={() => props.onDetourHover?.(detour.place_id)}
                    onMouseLeave={() => props.onDetourHover?.(null)}
                    position={{
                      lat: detour.geometry.location.lat,
                      lng: detour.geometry.location.lng,
                    }}
                    zIndex={highlight ? 3 : hovered ? 2 : 1}
                  >
                    <Pin
                      scale={highlight ? 1 : 0.85}
                      background={
                        highlight
                          ? jauntColors.map.selected
                          : hovered
                            ? jauntColors.brand.accent
                            : jauntColors.map.result
                      }
                      glyphColor={
                        highlight
                          ? jauntColors.neutral.foregroundOnDark
                          : jauntColors.map.endpoint
                      }
                      borderColor={jauntColors.map.endpoint}
                      glyphText={`${index + 1}`}
                    />
                  </AdvancedMarker>
                );
              }
            )}

          {/* Detour list markers */}
          {addedDetourFeatures.map((feature) => (
            <SelectableMapMarker
              key={feature.id}
              active={
                selectedFeatureId === feature.id ||
                hoveredFeatureId === feature.id
              }
              background={jauntColors.map.stop}
              feature={feature}
              iconType={feature.category}
              onClose={closeFeatureDetails}
              onHover={setHoveredFeatureId}
              onRemoveDetour={props.onRemoveDetour}
              onSelect={setSelectedFeatureId}
              pending={props.detourMutationPending != null}
              showDetails={
                selectedFeatureId === feature.id
                  ? "selected"
                  : hoveredFeatureId === feature.id
                    ? "hovered"
                    : null
              }
              zIndex={1}
            />
          ))}
        </Map>
      </div>
    </APIProvider>
  );
}

MapContainer.propTypes = {
  cameraControl: PropTypes.bool,
  origin: PropTypes.shape({
    address: PropTypes.string,
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
  destination: PropTypes.shape({
    address: PropTypes.string,
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
  route: PropTypes.object,
  showRoute: PropTypes.bool,
  detourSearchLocation: PropTypes.number,
  detourSearchRadius: PropTypes.number,
  showDetourSearchPoint: PropTypes.bool,
  detourOptions: PropTypes.array,
  detourHighlight: PropTypes.array,
  hoveredDetourId: PropTypes.string,
  mapTypeControl: PropTypes.bool,
  onRemoveDetour: PropTypes.func,
  detourList: PropTypes.array,
  onDetourHover: PropTypes.func,
  setDetourHighlight: PropTypes.func,
  detourMutationPending: PropTypes.object,
  zoomControl: PropTypes.bool,
};

MapBounds.propTypes = {
  route: PropTypes.object,
};

RoutePolyline.propTypes = {
  route: PropTypes.object,
  showRoute: PropTypes.bool,
};

DetourCircle.propTypes = {
  detourPoint: PropTypes.object,
  detourSearchRadius: PropTypes.number,
  showDetourSearchPoint: PropTypes.bool,
};

MarkerDetails.propTypes = {
  feature: PropTypes.object.isRequired,
};

SelectableMapMarker.propTypes = {
  active: PropTypes.bool.isRequired,
  background: PropTypes.string.isRequired,
  feature: PropTypes.object.isRequired,
  iconType: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onHover: PropTypes.func.isRequired,
  onRemoveDetour: PropTypes.func,
  onSelect: PropTypes.func.isRequired,
  pending: PropTypes.bool,
  showDetails: PropTypes.oneOf(["selected", "hovered"]),
  zIndex: PropTypes.number.isRequired,
};

export default MapContainer;
