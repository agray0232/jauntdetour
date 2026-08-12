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
      title,
    }) => (
      <div
        data-testid={title ? `marker-${title}` : undefined}
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
