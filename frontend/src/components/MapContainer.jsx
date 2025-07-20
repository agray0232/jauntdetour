import React, { useEffect, useRef } from "react";
//import { Map, Circle , Polyline, Marker, GoogleApiWrapper } from 'google-maps-react';
import {
  AdvancedMarker,
  APIProvider,
  Map,
  Pin,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
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
import config from "../config/config.js";

// Utility function to create FontAwesome-based custom marker element
function getDetourGlyph(type) {
  const normalizedType = type?.toLowerCase();
  let iconDefinition;

  switch (normalizedType) {
    case "hike":
      iconDefinition = faHiking;
      break;
    case "coffee":
      iconDefinition = faCoffee;
      break;
    case "museum":
      iconDefinition = faLandmark;
      break;
    case "landmark":
      iconDefinition = faMonument;
      break;
    case "restaurant":
      iconDefinition = faUtensils;
      break;
    case "bar":
      iconDefinition = faGlassMartiniAlt;
      break;
    case "gas station":
      iconDefinition = faGasPump;
      break;
    case "charging station":
      iconDefinition = faChargingStation;
      break;
    default:
      iconDefinition = faMapMarkerAlt;
  }

  // Generate the SVG using FontAwesome's icon function
  const faIcon = icon(iconDefinition);

  // Create a custom marker element with the FontAwesome SVG
  const markerElement = document.createElement("div");
  markerElement.innerHTML = faIcon.html[0];
  markerElement.style.color = "inherit";
  markerElement.style.fontSize = "12px";
  markerElement.style.display = "flex";
  markerElement.style.justifyContent = "center";
  markerElement.style.alignItems = "center";

  return markerElement;
}

// Custom hook for map bounds adjustment - only on route change
function useMapBounds(map, route) {
  const mapsLibrary = useMapsLibrary("maps");
  const lastRouteIdRef = useRef(null);
  const hasSetBoundsRef = useRef(false);

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
        hasSetBoundsRef.current = true;
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
      strokeColor: "#007bff",
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
      fillColor: "#FF0000",
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

  // Calculate route coordinates
  const routeCoordinates =
    props.showRoute && props.route?.overview_polyline?.complete_overview
      ? props.route.overview_polyline.complete_overview.map((point) => ({
          lat: point[0],
          lng: point[1],
        }))
      : [];

  // Calculate detour point
  const detourPoint = (() => {
    if (
      props.showDetourSearchPoint &&
      props.showRoute &&
      routeCoordinates.length > 0
    ) {
      const routeLength = routeCoordinates.length;
      const routeIndex =
        Math.floor((props.detourSearchLocation / 100) * routeLength) - 1;
      return routeCoordinates[routeIndex];
    }
    return null;
  })();

  // Use the custom hook for bounds adjustment
  // useMapBounds(mapRef.current, props.route); // Moved inside Map component

  return (
    <APIProvider apiKey={config.GOOGLE_API_KEY}>
      <Map
        ref={mapRef}
        defaultZoom={9}
        style={{
          width: "100%",
          height: "100%",
        }}
        defaultCenter={{ lat: 33.749, lng: -84.388 }}
        mapId="DEMO_MAP_ID"
      >
        {/* Map bounds adjustment - only fits bounds on new route */}
        <MapBounds route={props.route} />

        {/* Route polyline */}
        <RoutePolyline route={props.route} showRoute={props.showRoute} />

        {/* Detour search point marker */}
        {props.showDetourSearchPoint && detourPoint && (
          <AdvancedMarker position={detourPoint}>
            <Pin scale={0.75} />
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
          props.detourOptions.map((detour, index) => {
            // Check if this detour should be highlighted
            const highlight = props.detourHighlight?.some(
              (detourHighlight) =>
                detourHighlight.id === detour.place_id &&
                detourHighlight.highlight
            );

            return (
              <AdvancedMarker
                key={`detour-option-${index}`}
                position={{
                  lat: detour.geometry.location.lat,
                  lng: detour.geometry.location.lng,
                }}
              >
                <Pin
                  scale={0.75}
                  background={highlight ? "#EA4335" : "#2a91e0ff"}
                  glyphColor={highlight ? "#B31412" : "#0964a9ff"}
                  borderColor={highlight ? "#B31412" : "#0964a9ff"}
                  glyph={getDetourGlyph(detour.type)}
                />
              </AdvancedMarker>
            );
          })}

        {/* Detour list markers */}
        {props.detourList?.length > 0 &&
          props.detourList.map((detour, index) => (
            <AdvancedMarker
              key={`detour-${index}`}
              position={{ lat: detour.lat, lng: detour.lng }}
            >
              <Pin
                scale={0.75}
                background="#0091ff"
                glyphColor="#ffffff"
                borderColor="#ffffff"
                glyph={getDetourGlyph(detour.type)}
              />
            </AdvancedMarker>
          ))}
      </Map>
    </APIProvider>
  );
}

export default MapContainer;
