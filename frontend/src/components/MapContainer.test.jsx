import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import MapContainer from "./MapContainer";

const mockMapProps = jest.fn();
const mockPinProps = jest.fn();
const mockUseMap = jest.fn();

jest.mock("@vis.gl/react-google-maps", () => {
  const React = require("react");

  return {
    AdvancedMarker: ({
      children,
      onClick,
      onMouseEnter,
      onMouseLeave,
      position,
      title,
    }) => (
      <div
        data-testid={title ? `marker-${title}` : undefined}
        data-position={position ? `${position.lat},${position.lng}` : undefined}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {children}
      </div>
    ),
    APIProvider: ({ children }) => <>{children}</>,
    Map: React.forwardRef(function MockMap({ children, ...props }, ref) {
      mockMapProps(props);
      return <div ref={ref}>{children}</div>;
    }),
    Pin: (props) => {
      mockPinProps(props);
      return null;
    },
    useMap: () => mockUseMap(),
    useMapsLibrary: () => ({}),
  };
});

function createProps(overrides = {}) {
  return {
    route: null,
    showRoute: false,
    detourSearchLocation: 50,
    detourSearchRadius: 20000,
    showDetourSearchPoint: false,
    detourOptions: [],
    detourHighlight: [],
    detourList: [],
    onDetourHover: jest.fn(),
    setDetourHighlight: jest.fn(),
    ...overrides,
  };
}

describe("MapContainer", () => {
  beforeEach(() => {
    mockMapProps.mockClear();
    mockPinProps.mockClear();
    mockUseMap.mockReturnValue(null);
  });

  test("starts over the contiguous United States with constrained navigation", () => {
    render(<MapContainer {...createProps()} />);

    expect(mockMapProps).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultBounds: {
          north: 49.384358,
          south: 24.396308,
          east: -66.93457,
          west: -124.848974,
          padding: 24,
        },
        minZoom: 4,
        restriction: {
          latLngBounds: {
            north: 85.051129,
            south: -85.051129,
            east: 180,
            west: -180,
          },
          strictBounds: true,
        },
      })
    );
  });

  test("fits the map to a newly loaded route", () => {
    jest.useFakeTimers();

    const extend = jest.fn();
    const fitBounds = jest.fn();
    mockUseMap.mockReturnValue({
      fitBounds,
      getDiv: () => document.createElement("div"),
    });
    window.google = {
      maps: {
        LatLng: jest.fn(function LatLng(lat, lng) {
          this.lat = lat;
          this.lng = lng;
        }),
        LatLngBounds: jest.fn(() => ({ extend })),
      },
    };

    render(
      <MapContainer
        {...createProps({
          route: {
            bounds: {
              northeast: { lat: 49.1, lng: -66.9 },
              southwest: { lat: 24.4, lng: -124.8 },
            },
          },
        })}
      />
    );

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(extend).toHaveBeenCalledTimes(2);
    expect(fitBounds).toHaveBeenCalledTimes(1);

    delete window.google;
    jest.useRealTimers();
  });

  test("shows itinerary-consistent endpoints from a live multi-leg route", () => {
    render(
      <MapContainer
        {...createProps({
          showRoute: true,
          route: {
            legs: [
              {
                start_location: { lat: 0, lng: -84.388 },
                end_location: { lat: 34.9, lng: -82.4 },
              },
              {
                start_location: { lat: 34.9, lng: -82.4 },
                end_location: { lat: 35.2271, lng: 0 },
              },
            ],
          },
        })}
      />
    );

    expect(screen.getByTestId("marker-Jaunt start")).toHaveAttribute(
      "data-position",
      "0,-84.388"
    );
    expect(screen.getByTestId("marker-Jaunt destination")).toHaveAttribute(
      "data-position",
      "35.2271,0"
    );
    expect(mockPinProps).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        background: "#14282f",
        borderColor: "#ffffff",
        glyphColor: "#ffffff",
        scale: 1.1,
      })
    );
    expect(mockPinProps).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        background: "#14282f",
        borderColor: "#ffffff",
        glyphColor: "#ffffff",
        scale: 1.1,
      })
    );
  });

  test("falls back to persisted endpoints when saved routes have no legs", () => {
    render(
      <MapContainer
        {...createProps({
          showRoute: true,
          route: { overview_polyline: { complete_overview: [] } },
          origin: { lat: 33.749, lng: -84.388 },
          destination: { lat: 35.2271, lng: -80.8431 },
        })}
      />
    );

    expect(screen.getByTestId("marker-Jaunt start")).toHaveAttribute(
      "data-position",
      "33.749,-84.388"
    );
    expect(screen.getByTestId("marker-Jaunt destination")).toHaveAttribute(
      "data-position",
      "35.2271,-80.8431"
    );
  });

  test("prefers live endpoints and updates them after route recalculation", () => {
    const fallbackProps = {
      origin: { lat: 1, lng: 2 },
      destination: { lat: 3, lng: 4 },
    };
    const { rerender } = render(
      <MapContainer
        {...createProps({
          ...fallbackProps,
          showRoute: true,
          route: {
            legs: [
              {
                start_location: { lat: 10, lng: 20 },
                end_location: { lat: 30, lng: 40 },
              },
            ],
          },
        })}
      />
    );

    expect(screen.getByTestId("marker-Jaunt start")).toHaveAttribute(
      "data-position",
      "10,20"
    );

    rerender(
      <MapContainer
        {...createProps({
          ...fallbackProps,
          showRoute: true,
          route: {
            legs: [
              {
                start_location: { lat: 50, lng: 60 },
                end_location: { lat: 70, lng: 80 },
              },
            ],
          },
        })}
      />
    );

    expect(screen.getByTestId("marker-Jaunt start")).toHaveAttribute(
      "data-position",
      "50,60"
    );
    expect(screen.getByTestId("marker-Jaunt destination")).toHaveAttribute(
      "data-position",
      "70,80"
    );
  });

  test("uses a valid persisted endpoint when a route leg endpoint is invalid", () => {
    render(
      <MapContainer
        {...createProps({
          showRoute: true,
          route: {
            legs: [
              {
                start_location: { lat: null, lng: -84.388 },
                end_location: { lat: 35.2271, lng: -80.8431 },
              },
            ],
          },
          origin: { lat: 33.749, lng: -84.388 },
        })}
      />
    );

    expect(screen.getByTestId("marker-Jaunt start")).toHaveAttribute(
      "data-position",
      "33.749,-84.388"
    );
  });

  test("hides endpoints with the route and ignores unusable coordinates", () => {
    const { rerender } = render(
      <MapContainer
        {...createProps({
          showRoute: false,
          origin: { lat: 33.749, lng: -84.388 },
          destination: { lat: 35.2271, lng: -80.8431 },
        })}
      />
    );

    expect(screen.queryByTestId("marker-Jaunt start")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("marker-Jaunt destination")
    ).not.toBeInTheDocument();

    rerender(
      <MapContainer
        {...createProps({
          showRoute: true,
          origin: { lat: Number.NaN, lng: -84.388 },
          destination: { lat: 35.2271 },
        })}
      />
    );

    expect(screen.queryByTestId("marker-Jaunt start")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("marker-Jaunt destination")
    ).not.toBeInTheDocument();
  });

  test("anchors added detours with category icons in stop-colored pins", () => {
    render(
      <MapContainer
        {...createProps({
          detourList: [
            {
              name: "Paris Mountain",
              placeId: "place-1",
              type: "Hike",
              lat: 34.9,
              lng: -82.4,
            },
          ],
        })}
      />
    );

    expect(
      screen.getByTestId("marker-Paris Mountain, added stop")
    ).toHaveAttribute("data-position", "34.9,-82.4");
    expect(mockPinProps).toHaveBeenLastCalledWith(
      expect.objectContaining({
        background: "#b84a18",
        borderColor: "#ffffff",
        glyphColor: "#ffffff",
        scale: 1.1,
      })
    );
  });

  test("previews a detour marker on hover without selecting it", () => {
    const detour = {
      name: "Paris Mountain",
      place_id: "place-1",
      geometry: { location: { lat: 34.9, lng: -82.4 } },
    };
    const props = createProps({
      detourOptions: [detour],
      hoveredDetourId: "place-1",
    });
    render(<MapContainer {...props} />);

    expect(mockPinProps).toHaveBeenLastCalledWith(
      expect.objectContaining({
        background: "#e36a2e",
        glyphColor: "#14282f",
        scale: 0.85,
      })
    );

    const marker = screen.getByTestId("marker-1. Paris Mountain");
    fireEvent.mouseEnter(marker);
    expect(props.onDetourHover).toHaveBeenLastCalledWith("place-1");
    expect(props.setDetourHighlight).not.toHaveBeenCalled();

    fireEvent.mouseLeave(marker);
    expect(props.onDetourHover).toHaveBeenLastCalledWith(null);
  });

  test("keeps click selection visually distinct from hover preview", () => {
    const detour = {
      name: "Paris Mountain",
      place_id: "place-1",
      geometry: { location: { lat: 34.9, lng: -82.4 } },
    };
    const props = createProps({
      detourOptions: [detour],
      detourHighlight: [{ id: "place-1", highlight: true }],
      hoveredDetourId: "place-1",
    });
    render(<MapContainer {...props} />);

    expect(mockPinProps).toHaveBeenLastCalledWith(
      expect.objectContaining({
        background: "#b84a18",
        glyphColor: "#ffffff",
        scale: 1,
      })
    );

    fireEvent.click(screen.getByTestId("marker-1. Paris Mountain"));
    expect(props.setDetourHighlight).toHaveBeenCalledWith([
      { id: "place-1", highlight: true },
    ]);
  });
});
