import React from "react";
import { act, render } from "@testing-library/react";
import MapContainer from "./MapContainer";

const mockMapProps = jest.fn();
const mockUseMap = jest.fn();

jest.mock("@vis.gl/react-google-maps", () => {
  const React = require("react");

  return {
    AdvancedMarker: ({ children }) => <>{children}</>,
    APIProvider: ({ children }) => <>{children}</>,
    Map: React.forwardRef(function MockMap({ children, ...props }, ref) {
      mockMapProps(props);
      return <div ref={ref}>{children}</div>;
    }),
    Pin: () => null,
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
    setDetourHighlight: jest.fn(),
    ...overrides,
  };
}

describe("MapContainer", () => {
  beforeEach(() => {
    mockMapProps.mockClear();
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
});
