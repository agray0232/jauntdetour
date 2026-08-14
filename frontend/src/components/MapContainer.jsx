import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
//import { Map, Circle , Polyline, Marker, GoogleApiWrapper } from 'google-maps-react';
import {
  AdvancedMarker,
  APIProvider,
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

function normalizeCoordinates(location) {
  if (!Number.isFinite(location?.lat) || !Number.isFinite(location?.lng)) {
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

function RouteEndpointMarker({ position, title, type }) {
  if (!position) return null;

  return (
    <AdvancedMarker position={position} title={title} zIndex={0}>
      <Pin
        scale={1.1}
        background={jauntColors.map.endpoint}
        borderColor={jauntColors.neutral.foregroundOnDark}
        glyphColor={jauntColors.neutral.foregroundOnDark}
      >
        {getDetourIconComponent(type, "1.125rem")}
      </Pin>
    </AdvancedMarker>
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
  const routeEndpoints = getRouteEndpoints(
    props.route,
    props.origin,
    props.destination
  );

  const detourPoint =
    props.showDetourSearchPoint && props.showRoute
      ? getRoutePoint(props.route, props.detourSearchLocation)
      : null;

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
      <Map
        ref={mapRef}
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
        streetViewControl={false}
      >
        <MapResizeObserver />

        {/* Map bounds adjustment - only fits bounds on new route */}
        <MapBounds route={props.route} />

        {/* Route polyline */}
        <RoutePolyline route={props.route} showRoute={props.showRoute} />

        {props.showRoute && (
          <>
            <RouteEndpointMarker
              position={routeEndpoints.start}
              title="Jaunt start"
              type="origin"
            />
            <RouteEndpointMarker
              position={routeEndpoints.destination}
              title="Jaunt destination"
              type="destination"
            />
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
        {props.detourList?.length > 0 &&
          props.detourList.map((detour, index) => (
            <AdvancedMarker
              key={`detour-${detour.placeId || detour.id || index}`}
              title={`${detour.name}, added stop`}
              position={{ lat: detour.lat, lng: detour.lng }}
              zIndex={1}
            >
              <Pin
                scale={1.1}
                background={jauntColors.map.stop}
                borderColor={jauntColors.neutral.foregroundOnDark}
                glyphColor={jauntColors.neutral.foregroundOnDark}
              >
                {getDetourIconComponent(detour.type, "1.125rem")}
              </Pin>
            </AdvancedMarker>
          ))}
      </Map>
    </APIProvider>
  );
}

MapContainer.propTypes = {
  origin: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
  destination: PropTypes.shape({
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
  detourList: PropTypes.array,
  onDetourHover: PropTypes.func,
  setDetourHighlight: PropTypes.func,
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

RouteEndpointMarker.propTypes = {
  position: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
  }),
  title: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["origin", "destination"]).isRequired,
};

export default MapContainer;
