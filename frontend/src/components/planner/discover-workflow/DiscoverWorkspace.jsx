import React, { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  Button,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  Spinner,
  Text,
  makeStyles,
  mergeClasses,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import {
  BuildingBankRegular,
  BuildingRegular,
  DrinkBeerRegular,
  DrinkCoffeeRegular,
  FoodRegular,
  GasRegular,
  PersonWalkingRegular,
  PlugConnectedRegular,
  SearchRegular,
} from "@fluentui/react-icons";
import DetourRequester from "../../../scripts/DetourRequester";
import RouteRequester from "../../../scripts/RouteRequester";
import { trackEvent } from "../../../telemetry/telemetry";
import { getRoutePoint } from "./discoverRoute";
import {
  jauntColors,
  jauntRadius,
  jauntSpacing,
  jauntTypography,
} from "../../../design-system/tokens";
import "./DiscoverWorkspace.css";

const CATEGORIES = [
  { icon: PersonWalkingRegular, label: "Hike" },
  { icon: DrinkCoffeeRegular, label: "Coffee" },
  { icon: BuildingRegular, label: "Museum" },
  { icon: BuildingBankRegular, label: "Landmark" },
  { icon: FoodRegular, label: "Restaurant" },
  { icon: DrinkBeerRegular, label: "Bar" },
  { icon: GasRegular, label: "Gas Station" },
  { icon: PlugConnectedRegular, label: "Charging Station" },
];

function getCountBucket(count) {
  if (count === 0) return "0";
  if (count <= 5) return "1-5";
  if (count <= 10) return "6-10";
  return "11+";
}

const sliderStyle = {
  "--jaunt-slider-track": jauntColors.support.sky,
  "--jaunt-slider-thumb": jauntColors.brand.primary,
  "--jaunt-slider-thumb-border": jauntColors.neutral.background,
  "--jaunt-slider-shadow": tokens.shadow4,
};

const useStyles = makeStyles({
  root: {
    display: "grid",
    padding: jauntSpacing[4],
    rowGap: jauntSpacing[5],
  },
  heading: { display: "grid", rowGap: jauntSpacing[1] },
  eyebrow: {
    color: jauntColors.brand.accentStrong,
    fontSize: jauntTypography.size.caption,
    fontWeight: jauntTypography.weight.bold,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.titleSmall,
  },
  categoryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: jauntSpacing[2],
  },
  categoryField: {
    display: "grid",
    rowGap: jauntSpacing[2],
  },
  categoryLegend: {
    fontWeight: jauntTypography.weight.semibold,
  },
  categoryOption: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    width: "100%",
    height: "3.25rem",
    minWidth: 0,
    boxSizing: "border-box",
    padding: `0 ${jauntSpacing[3]}`,
    gap: jauntSpacing[2],
    cursor: "pointer",
    color: tokens.colorNeutralForeground1,
    backgroundColor: jauntColors.brand.accentSubtle,
    borderRadius: jauntRadius.control,
    boxShadow: tokens.shadow4,
    ...shorthands.border("1px", "solid", jauntColors.brand.accent),
    ":hover": {
      backgroundColor: jauntColors.neutral.background,
      ...shorthands.border("1px", "solid", jauntColors.brand.accentStrong),
    },
  },
  categoryInput: {
    width: "1rem",
    height: "1rem",
    flexShrink: 0,
    margin: 0,
    accentColor: jauntColors.brand.primary,
    cursor: "pointer",
  },
  selectedCategory: {
    color: jauntColors.brand.primary,
    backgroundColor: jauntColors.brand.primarySubtle,
    boxShadow: tokens.shadow4,
    ...shorthands.border("2px", "solid", jauntColors.brand.primary),
  },
  categoryLabel: {
    display: "flex",
    minWidth: 0,
    alignItems: "center",
    gap: jauntSpacing[2],
    cursor: "pointer",
    fontWeight: jauntTypography.weight.semibold,
  },
  categoryIcon: {
    flexShrink: 0,
    color: jauntColors.brand.accentStrong,
    fontSize: jauntTypography.size.titleSmall,
  },
  range: { display: "grid", rowGap: jauntSpacing[2] },
  rangeHeader: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: jauntSpacing[3],
  },
  rangeValue: {
    color: tokens.colorNeutralForeground2,
    fontSize: jauntTypography.size.bodySmall,
  },
  rangeEnds: {
    display: "flex",
    justifyContent: "space-between",
    color: tokens.colorNeutralForeground3,
    fontSize: jauntTypography.size.caption,
  },
  slider: {
    width: "100%",
    height: "2rem",
    margin: 0,
    padding: 0,
    appearance: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    ":focus-visible": {
      outline: `3px solid ${jauntColors.semantic.focus}`,
      outlineOffset: "2px",
    },
  },
  search: { width: "100%" },
  emptyState: {
    display: "grid",
    padding: jauntSpacing[4],
    placeItems: "center",
    textAlign: "center",
    color: tokens.colorNeutralForeground2,
    backgroundColor: jauntColors.neutral.backgroundTinted,
    borderRadius: jauntRadius.surface,
  },
  results: { display: "grid", rowGap: jauntSpacing[3] },
  resultsHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: jauntSpacing[3],
  },
  resultsTitle: { margin: 0, fontSize: jauntTypography.size.bodyLarge },
  resultList: {
    display: "grid",
    margin: 0,
    padding: 0,
    rowGap: jauntSpacing[2],
    listStyle: "none",
  },
  result: {
    position: "relative",
    display: "grid",
    minHeight: "4.25rem",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    alignItems: "center",
    boxSizing: "border-box",
    padding: jauntSpacing[3],
    gap: jauntSpacing[3],
    cursor: "pointer",
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: jauntRadius.surface,
    ...shorthands.border("2px", "solid", tokens.colorNeutralStroke1),
  },
  selectedResult: {
    backgroundColor: jauntColors.brand.primarySubtle,
    ...shorthands.border("2px", "solid", jauntColors.brand.primary),
  },
  hoveredResult: {
    backgroundColor: jauntColors.brand.accentSubtle,
    ...shorthands.border("2px", "solid", jauntColors.brand.accent),
  },
  resultSelection: {
    position: "absolute",
    inset: 0,
    zIndex: 0,
    padding: 0,
    backgroundColor: "transparent",
    cursor: "pointer",
    borderRadius: jauntRadius.surface,
    ...shorthands.border("0", "solid", "transparent"),
    ":focus-visible": {
      outlineStyle: "none",
      boxShadow: `0 0 0 3px ${jauntColors.semantic.focus}`,
    },
  },
  resultDetails: {
    position: "relative",
    zIndex: 1,
    display: "grid",
    minWidth: 0,
    gridTemplateColumns: "2rem minmax(0, 1fr)",
    alignItems: "center",
    gap: jauntSpacing[3],
    pointerEvents: "none",
  },
  resultAction: { position: "relative", zIndex: 2 },
  resultNumber: {
    display: "grid",
    width: "2rem",
    height: "2rem",
    placeItems: "center",
    color: jauntColors.neutral.foregroundOnDark,
    backgroundColor: jauntColors.map.result,
    borderRadius: jauntRadius.round,
    fontWeight: jauntTypography.weight.bold,
  },
  resultCopy: {
    display: "grid",
    minWidth: 0,
    rowGap: jauntSpacing[1],
  },
  resultName: {
    overflowWrap: "anywhere",
    fontWeight: jauntTypography.weight.semibold,
  },
  resultMeta: {
    color: tokens.colorNeutralForeground2,
    fontSize: jauntTypography.size.bodySmall,
  },
});

function getPositionLabel(value) {
  if (value >= 45 && value <= 55) return "Halfway";
  return value < 45 ? "Early in the drive" : "Later in the drive";
}

function formatRangeValue(value) {
  const number = Number(value);
  return Number.isInteger(number) ? number : number.toFixed(1);
}

export default function DiscoverWorkspace(props) {
  const styles = useStyles();
  const { onAddControllerChange } = props;
  const [status, setStatus] = useState(
    props.detourOptions.length > 0 ? "success" : "idle"
  );
  const [addingId, setAddingId] = useState(null);
  const [addErrorId, setAddErrorId] = useState(null);
  const resultRefs = useRef(new Map());
  const addPropsRef = useRef(props);
  const addingRef = useRef(false);
  addPropsRef.current = props;
  const selectedId = props.detourHighlight.find(
    (option) => option.highlight
  )?.id;

  const selectResult = (placeId) => {
    props.setDetourHighlight(
      props.detourOptions.map((option) => ({
        id: option.place_id,
        highlight: option.place_id === placeId,
      }))
    );
    setAddErrorId(null);
  };

  const changeCriteria = (update) => {
    update();
    if (props.detourOptions.length > 0) {
      props.setDetourOptions([]);
      props.setDetourHighlight([]);
    }
    setStatus("idle");
    setAddErrorId(null);
  };

  const selectCategory = (category) => {
    if (category !== props.detourType) {
      trackEvent("detour_category_selected", {
        category,
        feature: "detour",
      });
    }
    changeCriteria(() => props.setDetourType(category));
  };

  const search = async () => {
    const point = getRoutePoint(props.route, props.detourSearchLocation);
    if (!point) {
      setStatus("error");
      trackEvent("detour_search_failed", {
        category: props.detourType,
        failureClass: "invalid_route",
        feature: "detour",
      });
      return;
    }
    setStatus("searching");
    trackEvent("detour_search_started", {
      category: props.detourType,
      feature: "detour",
    });
    props.setDetourOptions([]);
    props.setDetourHighlight([]);
    try {
      const data = await new DetourRequester().getDetours(
        point.lat,
        point.lng,
        props.detourSearchRadius,
        props.detourType
      );
      const results = (data.results || []).map((result) => ({
        ...result,
        type: props.detourType,
      }));
      props.setDetourHighlight(
        results.map((result) => ({
          id: result.place_id,
          highlight: false,
        }))
      );
      props.setDetourOptions(results);
      setStatus(results.length > 0 ? "success" : "empty");
      trackEvent(
        results.length > 0 ? "detour_search_succeeded" : "detour_search_empty",
        {
          category: props.detourType,
          feature: "detour",
          resultCountBucket: getCountBucket(results.length),
        }
      );
    } catch {
      setStatus("error");
      trackEvent("detour_search_failed", {
        category: props.detourType,
        failureClass: "request_failed",
        feature: "detour",
      });
    }
  };

  const addResult = useCallback(async (result) => {
    const currentProps = addPropsRef.current;
    if (currentProps.mutationPending || addingRef.current) {
      return;
    }
    addingRef.current = true;
    setAddingId(result.place_id);
    setAddErrorId(null);
    currentProps.onAddingChange?.(true);
    trackEvent("detour_add_started", {
      category: result.type,
      feature: "detour",
    });
    try {
      const waypointIds = [
        ...currentProps.detourList.map((detour) => detour.placeId),
        result.place_id,
      ];
      const data = await new RouteRequester().getRoute(
        currentProps.origin,
        currentProps.destination,
        "Address",
        { waypoints: waypointIds }
      );
      const route = data.routes && data.routes[0];
      if (!route) throw new Error("No route returned");
      const originalMinutes =
        (currentProps.tripSummary.time?.hours || 0) * 60 +
        (currentProps.tripSummary.time?.min || 0);
      const nextMinutes =
        (route.summary.time?.hours || 0) * 60 + (route.summary.time?.min || 0);
      const addedTime = nextMinutes - originalMinutes;

      currentProps.setRoute(route);
      currentProps.setTripSummary(route.summary);
      currentProps.addDetour({
        name: result.name,
        type: result.type,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        id: result.id,
        rating: result.rating,
        placeId: result.place_id,
        addedTime,
      });
      currentProps.setDetourOptions([]);
      currentProps.setDetourHighlight([]);
      setStatus("idle");
      setAddingId(null);
      addingRef.current = false;
      currentProps.onAddingChange?.(false);
      currentProps.onAdded(result.name, addedTime);
      trackEvent("detour_added", {
        category: result.type,
        countBucket: getCountBucket(currentProps.detourList.length + 1),
        feature: "detour",
      });
    } catch {
      setAddingId(null);
      addingRef.current = false;
      currentProps.onAddingChange?.(false);
      setAddErrorId(result.place_id);
      trackEvent("detour_add_failed", {
        category: result.type,
        failureClass: "route_update_failed",
        feature: "detour",
      });
    }
  }, []);

  useEffect(() => {
    onAddControllerChange?.({ addErrorId, addResult, addingId });
  }, [addErrorId, addResult, addingId, onAddControllerChange]);

  useEffect(() => () => onAddControllerChange?.(null), [onAddControllerChange]);

  useEffect(() => {
    const resultElement = resultRefs.current.get(props.mapSelectedDetourId);
    if (!resultElement) return;

    let scrollContainer = resultElement.parentElement;
    while (scrollContainer) {
      const overflowY = window.getComputedStyle(scrollContainer).overflowY;
      if (overflowY === "auto" || overflowY === "scroll") break;
      scrollContainer = scrollContainer.parentElement;
    }
    if (!scrollContainer) return;

    const resultBounds = resultElement.getBoundingClientRect();
    const containerBounds = scrollContainer.getBoundingClientRect();
    if (
      resultBounds.top < containerBounds.top ||
      resultBounds.bottom > containerBounds.bottom
    ) {
      resultElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [props.mapSelectedDetourId]);

  const clearResults = () => {
    props.setDetourOptions([]);
    props.setDetourHighlight([]);
    setStatus("idle");
    setAddErrorId(null);
  };

  return (
    <section className={styles.root} aria-labelledby="discover-title">
      <div className={styles.heading}>
        <Text className={styles.eyebrow}>Along this route</Text>
        <h3 className={styles.title} id="discover-title">
          Find a worthwhile stop
        </h3>
      </div>

      <div className={styles.categoryField}>
        <Text className={styles.categoryLegend} id="detour-category-label">
          What sounds good?
        </Text>
        <div
          className={styles.categoryGrid}
          role="radiogroup"
          aria-labelledby="detour-category-label"
        >
          {CATEGORIES.map(({ icon: CategoryIcon, label }) => (
            <label
              className={mergeClasses(
                styles.categoryOption,
                props.detourType === label && styles.selectedCategory
              )}
              key={label}
              data-testid={`category-card-${label
                .toLowerCase()
                .replaceAll(" ", "-")}`}
              onMouseDown={(event) => {
                if (event.button !== 0) {
                  return;
                }
                event.preventDefault();
                selectCategory(label);
              }}
              onTouchStart={() => selectCategory(label)}
            >
              <input
                className={styles.categoryInput}
                type="radio"
                name="detour-category"
                value={label}
                checked={props.detourType === label}
                onChange={() => selectCategory(label)}
              />
              <span className={styles.categoryLabel}>
                <CategoryIcon
                  className={styles.categoryIcon}
                  data-testid={`category-icon-${label
                    .toLowerCase()
                    .replaceAll(" ", "-")}`}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.range}>
        <div className={styles.rangeHeader}>
          <label htmlFor="route-position">Where along the route?</label>
          <output className={styles.rangeValue} htmlFor="route-position">
            {getPositionLabel(props.detourSearchLocation)} ·{" "}
            {Math.round(props.detourSearchLocation)}%
          </output>
        </div>
        <input
          className={`${styles.slider} jaunt-discover-slider`}
          id="route-position"
          type="range"
          min={0}
          max={100}
          step="any"
          style={sliderStyle}
          value={props.detourSearchLocation}
          onChange={(event) =>
            changeCriteria(() =>
              props.setDetourSearchLocation(Number(event.target.value))
            )
          }
        />
        <div className={styles.rangeEnds} aria-hidden="true">
          <span>Start</span>
          <span>Destination</span>
        </div>
      </div>

      <div className={styles.range}>
        <div className={styles.rangeHeader}>
          <label htmlFor="search-radius">Search radius</label>
          <output className={styles.rangeValue} htmlFor="search-radius">
            {formatRangeValue(props.detourSearchRadius / 1000)} km
          </output>
        </div>
        <input
          className={`${styles.slider} jaunt-discover-slider`}
          id="search-radius"
          type="range"
          min={5}
          max={50}
          step="any"
          style={sliderStyle}
          value={props.detourSearchRadius / 1000}
          onChange={(event) =>
            changeCriteria(() =>
              props.setDetourSearchRadius(Number(event.target.value) * 1000)
            )
          }
        />
      </div>

      <Button
        className={styles.search}
        appearance="primary"
        icon={
          status === "searching" ? <Spinner size="tiny" /> : <SearchRegular />
        }
        disabled={status === "searching"}
        onClick={search}
      >
        {status === "searching" ? "Searching this area" : "Search this area"}
      </Button>

      {status === "idle" ? (
        <div className={styles.emptyState}>
          Set what you want and where to look, then search this part of the
          route.
        </div>
      ) : null}
      {status === "empty" ? (
        <MessageBar intent="info">
          <MessageBarBody>
            No places matched this search. Try another category or a wider
            radius.
          </MessageBarBody>
        </MessageBar>
      ) : null}
      {status === "error" ? (
        <MessageBar intent="error">
          <MessageBarBody>
            We could not search this area. Check your connection and try again.
          </MessageBarBody>
          <MessageBarActions>
            <Button onClick={search}>Retry</Button>
          </MessageBarActions>
        </MessageBar>
      ) : null}

      {status === "success" && props.detourOptions.length > 0 ? (
        <section className={styles.results} aria-labelledby="results-title">
          <div className={styles.resultsHeader}>
            <h4 className={styles.resultsTitle} id="results-title">
              {props.detourOptions.length}{" "}
              {props.detourOptions.length === 1 ? "place" : "places"}
            </h4>
            <Button appearance="subtle" onClick={clearResults}>
              Clear
            </Button>
          </div>
          <ol className={styles.resultList}>
            {props.detourOptions.map((result, index) => {
              const selected = selectedId === result.place_id;
              const hovered = props.hoveredDetourId === result.place_id;
              const added = props.detourList.some(
                (detour) => detour.placeId === result.place_id
              );
              const adding = addingId === result.place_id;
              const addFailed = addErrorId === result.place_id;

              return (
                <li
                  className={mergeClasses(
                    styles.result,
                    hovered && styles.hoveredResult,
                    selected && styles.selectedResult
                  )}
                  key={result.place_id || result.id || result.name}
                  ref={(element) => {
                    if (element) {
                      resultRefs.current.set(result.place_id, element);
                    } else {
                      resultRefs.current.delete(result.place_id);
                    }
                  }}
                  onMouseEnter={() => props.onDetourHover(result.place_id)}
                  onMouseLeave={() => props.onDetourHover(null)}
                >
                  <button
                    className={styles.resultSelection}
                    type="button"
                    aria-label={`Select ${result.name}`}
                    aria-pressed={selected}
                    onClick={() => selectResult(result.place_id)}
                    onFocus={() => props.onDetourHover(result.place_id)}
                    onBlur={() => props.onDetourHover(null)}
                  />
                  <span className={styles.resultDetails}>
                    <span className={styles.resultNumber} aria-hidden="true">
                      {index + 1}
                    </span>
                    <span className={styles.resultCopy}>
                      <Text className={styles.resultName}>{result.name}</Text>
                      <Text className={styles.resultMeta}>
                        {result.type}
                        {result.rating ? ` · ${result.rating} rating` : ""}
                      </Text>
                      {addFailed ? (
                        <Text role="alert" className={styles.resultMeta}>
                          Could not add this stop. Try again.
                        </Text>
                      ) : null}
                    </span>
                  </span>
                  {added ? (
                    <Button className={styles.resultAction} disabled>
                      Added
                    </Button>
                  ) : selected || addFailed ? (
                    <Button
                      className={styles.resultAction}
                      appearance="primary"
                      disabled={addingId != null || props.mutationPending}
                      icon={adding ? <Spinner size="tiny" /> : null}
                      onClick={() => addResult(result)}
                    >
                      {adding ? "Adding" : addFailed ? "Retry add" : "Add"}
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}
    </section>
  );
}

DiscoverWorkspace.propTypes = {
  addDetour: PropTypes.func.isRequired,
  destination: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  detourHighlight: PropTypes.array.isRequired,
  detourList: PropTypes.array.isRequired,
  detourOptions: PropTypes.array.isRequired,
  detourSearchLocation: PropTypes.number.isRequired,
  detourSearchRadius: PropTypes.number.isRequired,
  detourType: PropTypes.string.isRequired,
  hoveredDetourId: PropTypes.string,
  mapSelectedDetourId: PropTypes.string,
  onAdded: PropTypes.func.isRequired,
  onAddControllerChange: PropTypes.func,
  onAddingChange: PropTypes.func,
  mutationPending: PropTypes.bool,
  onDetourHover: PropTypes.func.isRequired,
  origin: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  route: PropTypes.object.isRequired,
  setRoute: PropTypes.func.isRequired,
  setDetourHighlight: PropTypes.func.isRequired,
  setDetourOptions: PropTypes.func.isRequired,
  setDetourSearchLocation: PropTypes.func.isRequired,
  setDetourSearchRadius: PropTypes.func.isRequired,
  setDetourType: PropTypes.func.isRequired,
  setTripSummary: PropTypes.func.isRequired,
  tripSummary: PropTypes.object.isRequired,
};

DiscoverWorkspace.defaultProps = {
  feedback: "",
  hoveredDetourId: null,
};
