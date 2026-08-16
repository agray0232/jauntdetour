import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import MapContainer from "./MapContainer";

const mockMapProps = jest.fn();
const mockInfoWindowProps = jest.fn();
const mockPinProps = jest.fn();
const mockUseMap = jest.fn();

jest.mock("@vis.gl/react-google-maps", () => {
  const React = require("react");

  function MockInfoWindow({
    ariaLabel,
    children,
    className,
    headerContent,
    onClose,
    pixelOffset,
    shouldFocus,
  }) {
    mockInfoWindowProps({
      ariaLabel,
      className,
      pixelOffset,
      shouldFocus,
    });
    const onCloseRef = React.useRef(onClose);
    onCloseRef.current = onClose;
    React.useEffect(() => () => onCloseRef.current(), []);

    return (
      <section
        aria-label={ariaLabel}
        data-should-focus={`${shouldFocus}`}
        role="dialog"
      >
        <header>{headerContent}</header>
        {children}
        <button onClick={onClose}>Close details</button>
      </section>
    );
  }

  return {
    AdvancedMarker: React.forwardRef(function MockAdvancedMarker(
      {
        children,
        onClick,
        onKeyDown,
        onMouseEnter,
        onMouseLeave,
        position,
        title,
      },
      ref
    ) {
      return (
        <div
          ref={ref}
          aria-label={title || undefined}
          data-testid={title ? `marker-${title}` : undefined}
          data-position={
            position ? `${position.lat},${position.lng}` : undefined
          }
          onClick={onClick}
          onKeyDown={onKeyDown}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          role={title ? "button" : undefined}
        >
          {children}
        </div>
      );
    }),
    APIProvider: ({ children }) => <>{children}</>,
    InfoWindow: MockInfoWindow,
    Map: React.forwardRef(function MockMap({ children, ...props }, ref) {
      mockMapProps(props);
      return <div ref={ref}>{children}</div>;
    }),
    Pin: (props) => {
      mockPinProps(props);
      return null;
    },
    useMap: () => mockUseMap(),
    useAdvancedMarkerRef: () => {
      const [marker, setMarker] = React.useState(null);
      return [setMarker, marker];
    },
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
    onRemoveDetour: jest.fn(),
    onDetourHover: jest.fn(),
    setDetourHighlight: jest.fn(),
    ...overrides,
  };
}

describe("MapContainer", () => {
  beforeEach(() => {
    mockMapProps.mockClear();
    mockInfoWindowProps.mockClear();
    mockPinProps.mockClear();
    mockUseMap.mockReturnValue(null);
  });

  test("starts over the contiguous United States with constrained navigation", () => {
    render(<MapContainer {...createProps()} />);

    expect(mockMapProps).toHaveBeenCalledWith(
      expect.objectContaining({
        cameraControl: true,
        defaultBounds: {
          north: 49.384358,
          south: 24.396308,
          east: -66.93457,
          west: -124.848974,
          padding: 24,
        },
        mapTypeControl: true,
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
        zoomControl: true,
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
    jest.useFakeTimers();
    render(
      <MapContainer
        {...createProps({
          showRoute: true,
          route: {
            legs: [
              {
                start_address: "Atlanta, GA",
                start_location: { lat: 0, lng: -84.388 },
                end_location: { lat: 34.9, lng: -82.4 },
              },
              {
                end_address: "Charlotte, NC",
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

    const startMarker = screen.getByRole("button", { name: "Jaunt start" });
    const destinationMarker = screen.getByRole("button", {
      name: "Jaunt destination",
    });

    fireEvent.mouseEnter(startMarker);
    expect(
      screen.getByRole("dialog", { name: "Start details" })
    ).toHaveAttribute("data-should-focus", "false");
    expect(mockInfoWindowProps).toHaveBeenLastCalledWith(
      expect.objectContaining({
        className: "jaunt-marker-details--hovered",
        pixelOffset: [0, -46],
      })
    );
    expect(
      screen.getByRole("button", { name: "Close details" })
    ).toBeInTheDocument();
    expect(
      mockPinProps.mock.calls.some(([pinProps]) => pinProps.scale === 1.25)
    ).toBe(true);
    expect(
      mockPinProps.mock.calls.some(
        ([pinProps]) =>
          pinProps.borderColor === "#ffffff" && pinProps.scale === 1.25
      )
    ).toBe(true);
    fireEvent.mouseLeave(startMarker);
    act(() => jest.advanceTimersByTime(450));
    expect(
      screen.queryByRole("dialog", { name: "Start details" })
    ).not.toBeInTheDocument();

    fireEvent.click(startMarker);
    expect(
      mockPinProps.mock.calls.some(([pinProps]) => pinProps.scale === 1.25)
    ).toBe(true);
    expect(
      mockPinProps.mock.calls.some(
        ([pinProps]) =>
          pinProps.borderColor === "#12664f" && pinProps.scale === 1.25
      )
    ).toBe(true);
    expect(
      screen.getByRole("dialog", { name: "Start details" })
    ).toHaveTextContent("Atlanta, GA");
    expect(mockInfoWindowProps).toHaveBeenLastCalledWith(
      expect.objectContaining({
        className: "jaunt-marker-details--selected",
      })
    );
    expect(
      screen.getByRole("button", { name: "Close details" })
    ).toBeInTheDocument();

    fireEvent.mouseEnter(destinationMarker);
    expect(
      screen.getByRole("dialog", { name: "Start details" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Destination details" })
    ).toBeInTheDocument();
    expect(screen.getAllByRole("dialog")).toHaveLength(2);
    fireEvent.mouseLeave(destinationMarker);
    act(() => jest.advanceTimersByTime(450));
    expect(
      screen.getByRole("dialog", { name: "Start details" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "Destination details" })
    ).not.toBeInTheDocument();

    fireEvent.click(destinationMarker);
    expect(
      screen.queryByRole("dialog", { name: "Start details" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Destination details" })
    ).toHaveTextContent("Charlotte, NC");

    fireEvent.mouseEnter(destinationMarker);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(
      screen.queryByRole("dialog", { name: "Destination details" })
    ).not.toBeInTheDocument();

    fireEvent.click(destinationMarker);
    act(() => mockMapProps.mock.lastCall[0].onClick());
    expect(
      screen.queryByRole("dialog", { name: "Destination details" })
    ).not.toBeInTheDocument();
    jest.useRealTimers();
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

  test("hides endpoints whose coordinates fall outside the map bounds", () => {
    render(
      <MapContainer
        {...createProps({
          showRoute: true,
          origin: { lat: 999, lng: 181 },
          destination: { lat: -90, lng: -200 },
        })}
      />
    );

    expect(screen.queryByTestId("marker-Jaunt start")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("marker-Jaunt destination")
    ).not.toBeInTheDocument();
  });

  test("anchors added detours with category icons in stop-colored pins", () => {
    jest.useFakeTimers();
    const props = createProps({
      detourList: [
        {
          name: "Paris Mountain",
          placeId: "place-1",
          type: "Hike",
          rating: 4.7,
          addedTime: 18,
          lat: 34.9,
          lng: -82.4,
        },
      ],
    });
    const { rerender } = render(<MapContainer {...props} />);

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

    const detourMarker = screen.getByRole("button", {
      name: "Paris Mountain, added stop",
    });
    fireEvent.mouseEnter(detourMarker);
    expect(
      screen.getByRole("dialog", { name: "Paris Mountain details" })
    ).toHaveAttribute("data-should-focus", "false");
    expect(mockInfoWindowProps).toHaveBeenLastCalledWith(
      expect.objectContaining({
        className: "jaunt-marker-details--hovered",
        pixelOffset: [0, -46],
      })
    );
    fireEvent.mouseLeave(detourMarker);
    act(() => jest.advanceTimersByTime(450));
    expect(
      screen.queryByRole("dialog", { name: "Paris Mountain details" })
    ).not.toBeInTheDocument();

    fireEvent.click(detourMarker);
    const details = screen.getByRole("dialog", {
      name: "Paris Mountain details",
    });
    expect(screen.getByText("Paris Mountain")).toBeInTheDocument();
    expect(details).toHaveTextContent("Hike");
    expect(details).toHaveTextContent("4.7 rating");
    expect(details).toHaveTextContent("+ 18 min");
    fireEvent.click(
      screen.getByRole("button", { name: "Actions for Paris Mountain" })
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Remove detour" }));
    expect(props.onRemoveDetour).toHaveBeenCalledWith(0);
    fireEvent.click(screen.getByRole("button", { name: "Close details" }));
    expect(details).not.toBeInTheDocument();

    fireEvent.click(detourMarker);
    rerender(<MapContainer {...props} detourList={[]} />);
    expect(
      screen.queryByRole("dialog", { name: "Paris Mountain details" })
    ).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  test("shows detour actions and close controls on hover and selection", () => {
    const props = createProps({
      detourList: [
        {
          name: "Paris Mountain",
          placeId: "place-1",
          type: "Hike",
          lat: 34.9,
          lng: -82.4,
        },
      ],
    });
    render(<MapContainer {...props} />);
    const marker = screen.getByRole("button", {
      name: "Paris Mountain, added stop",
    });

    fireEvent.mouseEnter(marker);
    expect(
      screen.getByRole("button", { name: "Actions for Paris Mountain" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Close details" })
    ).toBeInTheDocument();

    fireEvent.mouseLeave(marker);
    fireEvent.click(marker);
    expect(
      screen.getByRole("button", { name: "Actions for Paris Mountain" })
    ).toBeInTheDocument();
  });

  test("keeps a hover preview open while moving from marker to card", () => {
    jest.useFakeTimers();
    const props = createProps({
      detourList: [
        {
          name: "Paris Mountain",
          placeId: "place-1",
          type: "Hike",
          lat: 34.9,
          lng: -82.4,
        },
      ],
    });
    render(<MapContainer {...props} />);
    const marker = screen.getByRole("button", {
      name: "Paris Mountain, added stop",
    });

    fireEvent.mouseEnter(marker);
    fireEvent.mouseLeave(marker);
    act(() => jest.advanceTimersByTime(100));
    fireEvent.mouseEnter(
      screen.getByTestId("marker-details-header-detour-place-1")
    );
    act(() => jest.advanceTimersByTime(450));

    expect(
      screen.getByRole("dialog", { name: "Paris Mountain details" })
    ).toBeInTheDocument();

    fireEvent.mouseLeave(
      screen.getByTestId("marker-details-header-detour-place-1")
    );
    act(() => jest.advanceTimersByTime(450));

    expect(
      screen.queryByRole("dialog", { name: "Paris Mountain details" })
    ).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  test("promotes a hover preview when its actions menu opens", () => {
    const props = createProps({
      detourList: [
        {
          name: "Paris Mountain",
          placeId: "place-1",
          type: "Hike",
          lat: 34.9,
          lng: -82.4,
        },
      ],
    });
    render(<MapContainer {...props} />);

    fireEvent.mouseEnter(
      screen.getByRole("button", { name: "Paris Mountain, added stop" })
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Actions for Paris Mountain" })
    );

    expect(
      screen.getByRole("dialog", { name: "Paris Mountain details" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Remove detour" })
    ).toBeVisible();
    expect(mockInfoWindowProps).toHaveBeenLastCalledWith(
      expect.objectContaining({
        className: "jaunt-marker-details--selected",
      })
    );
  });

  test("closes a hover preview until the marker is entered again", () => {
    const props = createProps({
      detourList: [
        {
          name: "Paris Mountain",
          placeId: "place-1",
          type: "Hike",
          lat: 34.9,
          lng: -82.4,
        },
      ],
    });
    render(<MapContainer {...props} />);
    const marker = screen.getByRole("button", {
      name: "Paris Mountain, added stop",
    });

    fireEvent.mouseEnter(marker);
    fireEvent.click(screen.getByRole("button", { name: "Close details" }));
    expect(
      screen.queryByRole("dialog", { name: "Paris Mountain details" })
    ).not.toBeInTheDocument();

    fireEvent.mouseEnter(marker);
    expect(
      screen.getByRole("dialog", { name: "Paris Mountain details" })
    ).toBeInTheDocument();
  });

  test("disables detour actions while a route mutation is pending", () => {
    const props = createProps({
      detourList: [
        {
          name: "Paris Mountain",
          placeId: "place-1",
          type: "Hike",
          lat: 34.9,
          lng: -82.4,
        },
      ],
      detourMutationPending: { kind: "remove", index: 0 },
    });
    render(<MapContainer {...props} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Paris Mountain, added stop" })
    );

    expect(
      screen.getByRole("button", { name: "Actions for Paris Mountain" })
    ).toBeDisabled();
  });

  test("previews a detour marker on hover without selecting it", () => {
    jest.useFakeTimers();
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

    expect(
      screen.getByRole("dialog", { name: "Paris Mountain details" })
    ).toBeInTheDocument();

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
    act(() => jest.advanceTimersByTime(450));
    expect(props.onDetourHover).toHaveBeenLastCalledWith(null);
    jest.useRealTimers();
  });

  test("keeps the newest candidate preview open when an older timer fires", () => {
    jest.useFakeTimers();
    const detourOptions = [
      {
        name: "Paris Mountain",
        place_id: "place-1",
        geometry: { location: { lat: 34.9, lng: -82.4 } },
      },
      {
        name: "Falls Park",
        place_id: "place-2",
        geometry: { location: { lat: 34.84, lng: -82.4 } },
      },
    ];
    render(<MapContainer {...createProps({ detourOptions })} />);

    const firstMarker = screen.getByRole("button", {
      name: "1. Paris Mountain",
    });
    const secondMarker = screen.getByRole("button", { name: "2. Falls Park" });
    fireEvent.mouseEnter(firstMarker);
    fireEvent.mouseLeave(firstMarker);
    fireEvent.mouseEnter(secondMarker);
    act(() => jest.advanceTimersByTime(450));

    expect(
      screen.getByRole("dialog", { name: "Falls Park details" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "Paris Mountain details" })
    ).not.toBeInTheDocument();
    jest.useRealTimers();
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

  test("opens a persistent candidate card from Discover list selection", () => {
    const detour = {
      name: "Paris Mountain",
      place_id: "place-1",
      type: "Hike",
      geometry: { location: { lat: 34.9, lng: -82.4 } },
    };
    render(
      <MapContainer
        {...createProps({
          detourHighlight: [{ id: "place-1", highlight: true }],
          detourOptions: [detour],
        })}
      />
    );

    expect(
      screen.getByRole("dialog", { name: "Paris Mountain details" })
    ).toBeInTheDocument();
  });

  test("clears candidate selection when the map background is clicked", () => {
    const detour = {
      name: "Paris Mountain",
      place_id: "place-1",
      type: "Hike",
      geometry: { location: { lat: 34.9, lng: -82.4 } },
    };
    const props = createProps({
      detourHighlight: [{ id: "place-1", highlight: true }],
      detourOptions: [detour],
    });
    render(<MapContainer {...props} />);

    act(() => mockMapProps.mock.lastCall[0].onClick());

    expect(props.setDetourHighlight).toHaveBeenLastCalledWith([
      { id: "place-1", highlight: false },
    ]);
    expect(props.onDetourHover).toHaveBeenLastCalledWith(null);
  });

  test("clears candidate selection when the search radius circle is clicked", () => {
    const setMap = jest.fn();
    const Circle = jest.fn(function Circle() {
      return { setMap };
    });
    window.google = {
      maps: {
        Circle,
      },
    };
    mockUseMap.mockReturnValue({
      getDiv: () => document.createElement("div"),
    });
    const detour = {
      name: "Paris Mountain",
      place_id: "place-1",
      type: "Hike",
      geometry: { location: { lat: 34.9, lng: -82.4 } },
    };
    const props = createProps({
      detourHighlight: [{ id: "place-1", highlight: true }],
      detourOptions: [detour],
      detourSearchRadius: 20000,
      route: {
        overview_polyline: {
          decodedPoints: [
            [33.749, -84.388],
            [35.2271, -80.8431],
          ],
        },
      },
      showDetourSearchPoint: true,
      showRoute: true,
    });

    const { unmount } = render(<MapContainer {...props} />);
    expect(Circle).toHaveBeenCalledWith(
      expect.objectContaining({ clickable: false })
    );
    act(() => mockMapProps.mock.lastCall[0].onClick());

    expect(props.setDetourHighlight).toHaveBeenLastCalledWith([
      { id: "place-1", highlight: false },
    ]);
    expect(props.onDetourHover).toHaveBeenLastCalledWith(null);

    unmount();
    delete window.google;
  });

  test("shows candidate details on hover and adds from persistent selection", () => {
    jest.useFakeTimers();
    const addResult = jest.fn();
    const detour = {
      name: "Paris Mountain",
      place_id: "place-1",
      type: "Hike",
      rating: 4.7,
      vicinity: "Greenville County",
      geometry: { location: { lat: 34.9, lng: -82.4 } },
    };
    render(
      <MapContainer
        {...createProps({
          detourAddController: {
            addErrorId: null,
            addResult,
            addingId: null,
          },
          detourOptions: [detour],
        })}
      />
    );

    const marker = screen.getByRole("button", { name: "1. Paris Mountain" });
    fireEvent.mouseEnter(marker);
    expect(
      screen.getByRole("dialog", { name: "Paris Mountain details" })
    ).toHaveTextContent("Greenville County");
    expect(screen.getByText("4.7 rating")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Add to Jaunt" })
    ).not.toBeInTheDocument();

    fireEvent.click(marker);
    fireEvent.mouseLeave(marker);
    act(() => jest.advanceTimersByTime(450));
    expect(
      screen.getByRole("dialog", { name: "Paris Mountain details" })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add to Jaunt" }));
    expect(addResult).toHaveBeenCalledWith(detour);
    jest.useRealTimers();
  });
});
