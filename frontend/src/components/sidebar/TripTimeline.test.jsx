import React from "react";
import { render, screen } from "@testing-library/react";
import TripTimeline from "./TripTimeline";

describe("TripTimeline", () => {
  it("renders keyed endpoints and detours without React list warnings", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      render(
        <TripTimeline
          origin="Atlanta, GA"
          destination="Charlotte, NC"
          detourList={[
            {
              name: "Paris Mountain",
              placeId: "place-1",
              rating: 4.7,
              type: "Hike",
              addedTime: 18,
            },
            {
              name: "Falls Park",
              placeId: "place-2",
              rating: 4.8,
              type: "Landmark",
              addedTime: 12,
            },
          ]}
          removeDetour={jest.fn()}
          setRoute={jest.fn()}
          setTripSummary={jest.fn()}
          setDetourList={jest.fn()}
        />
      );

      expect(screen.getAllByRole("listitem")).toHaveLength(4);
      expect(consoleError.mock.calls.flat().join(" ")).not.toContain(
        'unique "key"'
      );
    } finally {
      consoleError.mockRestore();
    }
  });
});
