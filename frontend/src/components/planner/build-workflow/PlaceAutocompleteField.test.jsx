import React, { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { FluentProvider } from "@fluentui/react-components";
import { LocationRegular } from "@fluentui/react-icons";
import { axe } from "jest-axe";
import PlaceAutocompleteField from "./PlaceAutocompleteField";
import PlaceAutocompleteRequester from "../../../scripts/PlaceAutocompleteRequester";
import { jauntDetourTheme } from "../../../design-system/jauntDetourTheme";

jest.mock("../../../scripts/PlaceAutocompleteRequester");

function Harness({ onSelection = () => {} }) {
  const [value, setValue] = useState("");
  const [selectedPlace, setSelectedPlace] = useState(null);

  return (
    <FluentProvider theme={jauntDetourTheme}>
      <PlaceAutocompleteField
        icon={<LocationRegular />}
        label="Destination"
        placeholder="Where are you going?"
        selectedPlace={selectedPlace}
        value={value}
        onValueChange={(nextValue) => {
          setValue(nextValue);
          setSelectedPlace(null);
        }}
        onSelect={(place) => {
          setValue(place.text);
          setSelectedPlace(place);
          onSelection(place);
        }}
      />
    </FluentProvider>
  );
}

describe("PlaceAutocompleteField", () => {
  let getSuggestions;

  beforeEach(() => {
    jest.useFakeTimers();
    getSuggestions = jest.fn();
    PlaceAutocompleteRequester.mockImplementation(() => ({ getSuggestions }));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("does not open an empty popup when initially clicked", () => {
    render(<Harness />);

    const input = screen.getByRole("combobox", { name: "Destination" });
    fireEvent.click(input);

    expect(input).toHaveAttribute("spellcheck", "false");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("button", { name: "Open Destination" })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("debounces suggestions and selects a location", async () => {
    const suggestion = {
      placeId: "place-ohio",
      text: "Ashland, OH, USA",
      mainText: "Ashland",
      secondaryText: "OH, USA",
    };
    getSuggestions.mockResolvedValue([suggestion]);
    const onSelection = jest.fn();
    render(<Harness onSelection={onSelection} />);
    const control = screen.getByTestId("destination-autocomplete-control");
    const closedClassName = control.className;

    fireEvent.input(screen.getByRole("combobox", { name: "Destination" }), {
      target: { value: "Ashland" },
    });
    expect(getSuggestions).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    const option = screen.getByRole("option", {
      name: /Ashland OH, USA/i,
    });
    expect(
      screen.getByRole("combobox", { name: "Destination" })
    ).not.toHaveAttribute("aria-activedescendant");
    expect(control.className).not.toBe(closedClassName);
    fireEvent.click(option);

    expect(onSelection).toHaveBeenCalledWith(suggestion);
    expect(screen.getByRole("combobox", { name: "Destination" })).toHaveValue(
      "Ashland, OH, USA"
    );
  });

  it("does not search until two trimmed characters are entered", () => {
    render(<Harness />);

    fireEvent.input(screen.getByRole("combobox", { name: "Destination" }), {
      target: { value: " A " },
    });
    act(() => jest.advanceTimersByTime(250));

    expect(getSuggestions).not.toHaveBeenCalled();
  });

  it("keeps free text usable when suggestions fail", async () => {
    getSuggestions.mockRejectedValue(new Error("offline"));
    render(<Harness />);

    const input = screen.getByRole("combobox", { name: "Destination" });
    fireEvent.input(input, { target: { value: "Ashland" } });
    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    expect(
      screen.getByText(/suggestions are unavailable/i)
    ).toBeInTheDocument();
    expect(input).toHaveValue("Ashland");
    expect(input).not.toBeDisabled();
  });

  it("ignores an older response after the input changes", async () => {
    let resolveFirst;
    getSuggestions
      .mockImplementationOnce(
        () => new Promise((resolve) => (resolveFirst = resolve))
      )
      .mockResolvedValueOnce([
        {
          placeId: "place-kentucky",
          text: "Ashland, KY, USA",
          mainText: "Ashland",
          secondaryText: "KY, USA",
        },
      ]);
    render(<Harness />);
    const input = screen.getByRole("combobox", { name: "Destination" });

    fireEvent.input(input, { target: { value: "Ash" } });
    await act(async () => jest.advanceTimersByTime(250));
    fireEvent.input(input, { target: { value: "Ashland" } });
    await act(async () => jest.advanceTimersByTime(250));
    expect(getSuggestions).toHaveBeenCalledTimes(2);
    expect(
      screen.getByRole("option", { name: /Ashland KY, USA/i })
    ).toBeInTheDocument();

    await act(async () => {
      resolveFirst([
        {
          placeId: "old-place",
          text: "Ash, England",
          mainText: "Ash",
          secondaryText: "England",
        },
      ]);
    });

    expect(
      screen.queryByRole("option", { name: /Ash England/i })
    ).not.toBeInTheDocument();
  });

  it("has no automated accessibility violations", async () => {
    jest.useRealTimers();
    const { container } = render(<Harness />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
