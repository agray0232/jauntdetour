import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  Combobox,
  Field,
  Option,
  Spinner,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import PlaceAutocompleteRequester from "../../../scripts/PlaceAutocompleteRequester";
import { jauntSpacing, jauntTypography } from "../../../design-system/tokens";

const MIN_INPUT_LENGTH = 2;
const SEARCH_DELAY_MS = 250;

const useStyles = makeStyles({
  control: {
    position: "relative",
  },
  controlOpen: {
    zIndex: 2,
  },
  combobox: {
    width: "100%",
  },
  input: {
    paddingLeft: "2.5rem",
  },
  icon: {
    position: "absolute",
    left: jauntSpacing[3],
    top: "50%",
    zIndex: 1,
    display: "inline-flex",
    color: tokens.colorNeutralForeground2,
    transform: "translateY(-50%)",
    pointerEvents: "none",
  },
  option: {
    display: "grid",
    minWidth: 0,
    rowGap: jauntSpacing[1],
  },
  optionMain: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  optionSecondary: {
    overflow: "hidden",
    color: tokens.colorNeutralForeground2,
    fontSize: jauntTypography.size.bodySmall,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
});

export default function PlaceAutocompleteField({
  disabled = false,
  icon,
  invalid = false,
  label,
  onSelect,
  onValueChange,
  placeholder,
  selectedPlace = null,
  validationMessage = null,
  value,
}) {
  const styles = useStyles();
  const [suggestions, setSuggestions] = useState([]);
  const [status, setStatus] = useState("idle");
  const [open, setOpen] = useState(false);
  const requestIdRef = useRef(0);
  const requesterRef = useRef(null);

  if (!requesterRef.current) {
    requesterRef.current = new PlaceAutocompleteRequester();
  }

  useEffect(() => {
    const input = value.trim();
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    if (selectedPlace || input.length < MIN_INPUT_LENGTH) {
      setSuggestions([]);
      setStatus("idle");
      setOpen(false);
      return undefined;
    }

    setStatus("loading");
    const timeoutId = window.setTimeout(async () => {
      try {
        const nextSuggestions =
          await requesterRef.current.getSuggestions(input);
        if (requestId !== requestIdRef.current) {
          return;
        }
        setSuggestions(nextSuggestions);
        setStatus(nextSuggestions.length ? "ready" : "empty");
      } catch {
        if (requestId !== requestIdRef.current) {
          return;
        }
        setSuggestions([]);
        setStatus("error");
      }
    }, SEARCH_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [selectedPlace, value]);

  const handleInput = (event) => {
    setOpen(event.target.value.trim().length >= MIN_INPUT_LENGTH);
    onValueChange(event.target.value);
  };

  const handleOptionSelect = (event, data) => {
    const suggestion = suggestions.find(
      (option) => option.placeId === data.optionValue
    );
    if (suggestion) {
      setOpen(false);
      onSelect(suggestion);
    }
  };

  const statusMessage =
    status === "loading"
      ? `Loading ${label.toLowerCase()} suggestions`
      : status === "empty"
        ? "No matching locations found. You can still use your typed location."
        : status === "error"
          ? "Suggestions are unavailable. You can still use your typed location."
          : "";
  const canOpen =
    !selectedPlace &&
    value.trim().length >= MIN_INPUT_LENGTH &&
    (status === "loading" || suggestions.length > 0);

  return (
    <Field
      label={label}
      required
      validationMessage={invalid ? validationMessage : null}
      validationState={invalid ? "error" : "none"}
    >
      <div
        className={`${styles.control} ${open ? styles.controlOpen : ""}`}
        data-testid={`${label.toLowerCase()}-autocomplete-control`}
      >
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
        <Combobox
          aria-label={label}
          className={styles.combobox}
          disabled={disabled}
          disableAutoFocus
          expandIcon={null}
          freeform
          inlinePopup
          input={{
            className: styles.input,
            onFocus: () => setOpen(canOpen),
            spellCheck: false,
          }}
          open={open}
          placeholder={placeholder}
          selectedOptions={selectedPlace ? [selectedPlace.placeId] : []}
          size="large"
          value={value}
          onInput={handleInput}
          onOpenChange={(event, data) => setOpen(data.open && canOpen)}
          onOptionSelect={handleOptionSelect}
        >
          {status === "loading" ? (
            <Option disabled text="Loading suggestions" value="loading">
              <Spinner size="tiny" label="Loading suggestions" />
            </Option>
          ) : null}
          {suggestions.map((suggestion) => (
            <Option
              key={suggestion.placeId}
              text={suggestion.text}
              value={suggestion.placeId}
            >
              <span className={styles.option}>
                <span className={styles.optionMain}>
                  {suggestion.mainText || suggestion.text}
                </span>
                {suggestion.secondaryText ? (
                  <span className={styles.optionSecondary}>
                    {suggestion.secondaryText}
                  </span>
                ) : null}
              </span>
            </Option>
          ))}
        </Combobox>
        <span role="status" className="sr-only">
          {statusMessage}
        </span>
      </div>
    </Field>
  );
}

PlaceAutocompleteField.propTypes = {
  disabled: PropTypes.bool,
  icon: PropTypes.node.isRequired,
  invalid: PropTypes.bool,
  label: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  onValueChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string.isRequired,
  selectedPlace: PropTypes.shape({
    placeId: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
  }),
  validationMessage: PropTypes.string,
  value: PropTypes.string.isRequired,
};
