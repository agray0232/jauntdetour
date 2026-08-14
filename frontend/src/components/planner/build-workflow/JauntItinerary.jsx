import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  Button,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  Spinner,
  Text,
  Tooltip,
  makeStyles,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import {
  ArrowDownRegular,
  ArrowUpRegular,
  DeleteRegular,
  SearchRegular,
} from "@fluentui/react-icons";
import { moveDetour, recalculateItinerary } from "./routeMutations";
import { getDetourIconComponent } from "../../../utils/detourIcons";
import { trackEvent } from "../../../telemetry/telemetry";
import {
  jauntColors,
  jauntRadius,
  jauntSpacing,
  jauntTypography,
} from "../../../design-system/tokens";

const useStyles = makeStyles({
  root: {
    display: "grid",
    padding: `${jauntSpacing[5]} ${jauntSpacing[4]} 0`,
    rowGap: jauntSpacing[3],
  },
  heading: {
    margin: 0,
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.bodyLarge,
  },
  headingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: jauntSpacing[3],
  },
  list: {
    display: "grid",
    margin: 0,
    padding: 0,
    rowGap: jauntSpacing[2],
    listStyle: "none",
  },
  item: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "2rem minmax(0, 1fr) auto",
    minHeight: "3.5rem",
    alignItems: "center",
    padding: jauntSpacing[3],
    columnGap: jauntSpacing[3],
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: jauntRadius.surface,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
    ":not(:last-child):after": {
      position: "absolute",
      bottom: `-${jauntSpacing[3]}`,
      left: "1.7rem",
      width: "2px",
      height: jauntSpacing[4],
      backgroundColor: tokens.colorNeutralStroke1,
      content: '""',
    },
  },
  marker: {
    display: "grid",
    width: "2rem",
    height: "2rem",
    placeItems: "center",
    color: jauntColors.neutral.foregroundOnDark,
    backgroundColor: jauntColors.map.endpoint,
    borderRadius: jauntRadius.round,
    fontSize: jauntTypography.size.bodySmall,
    fontWeight: jauntTypography.weight.bold,
  },
  stopMarker: {
    backgroundColor: jauntColors.map.stop,
  },
  itemCopy: {
    display: "grid",
    minWidth: 0,
    rowGap: jauntSpacing[1],
  },
  itemTitle: {
    overflowWrap: "anywhere",
    fontWeight: jauntTypography.weight.semibold,
  },
  itemMeta: {
    color: tokens.colorNeutralForeground2,
    fontSize: jauntTypography.size.bodySmall,
  },
  itemActions: {
    display: "flex",
    alignItems: "center",
    gap: jauntSpacing[1],
  },
  status: {
    display: "flex",
    alignItems: "center",
    columnGap: jauntSpacing[2],
    color: tokens.colorNeutralForeground2,
    fontSize: jauntTypography.size.bodySmall,
  },
  discoverAction: {
    width: "100%",
  },
});

function formatAddedTime(detour) {
  if (detour.addedTime === -1 || detour.addedTime == null) {
    return "Added time recalculates with the route";
  }
  const hours = Math.floor(detour.addedTime / 60);
  const minutes = detour.addedTime - hours * 60;
  return `Adds ${hours ? `${hours} hr ` : ""}${minutes} min`;
}

export default function JauntItinerary({
  destination,
  detourList,
  onDiscover,
  origin,
  setDetourList,
  setRoute,
  setTripSummary,
}) {
  const styles = useStyles();
  const [pending, setPending] = useState(null);
  const [failedMutation, setFailedMutation] = useState(null);
  const requestIdRef = useRef(0);
  const actionRefs = useRef(new Map());
  const headingRef = useRef(null);

  const runMutation = async (mutation) => {
    const nextDetours =
      mutation.kind === "remove"
        ? detourList.filter((detour, index) => index !== mutation.index)
        : moveDetour(detourList, mutation.index, mutation.toIndex);

    if (nextDetours === detourList) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setPending(mutation);
    setFailedMutation(null);

    try {
      const route = await recalculateItinerary({
        destination,
        detours: nextDetours,
        origin,
      });
      if (requestId !== requestIdRef.current) {
        return;
      }
      setRoute(route);
      setTripSummary(route.summary);
      setDetourList(nextDetours);
      setPending(null);

      if (mutation.kind === "remove") {
        trackEvent("detour_removed", {
          category: detourList[mutation.index]?.type || "Unspecified",
          countBucket:
            nextDetours.length === 0
              ? "0"
              : nextDetours.length <= 5
                ? "1-5"
                : "6+",
          feature: "detour",
        });
        const focusIndex = Math.min(mutation.index, nextDetours.length - 1);
        window.setTimeout(() => {
          if (focusIndex >= 0) {
            actionRefs.current.get(focusIndex)?.focus();
          } else {
            headingRef.current?.focus();
          }
        });
      }
    } catch {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setPending(null);
      setFailedMutation(mutation);
    }
  };

  return (
    <section className={styles.root} aria-labelledby="itinerary-title">
      <div className={styles.headingRow}>
        <h3
          ref={headingRef}
          className={styles.heading}
          id="itinerary-title"
          tabIndex={-1}
        >
          Itinerary
        </h3>
        <Button appearance="subtle" onClick={onDiscover}>
          Find a detour
        </Button>
      </div>

      {failedMutation ? (
        <MessageBar intent="error">
          <MessageBarBody>
            The route could not be recalculated. Your itinerary was not changed.
          </MessageBarBody>
          <MessageBarActions>
            <Button onClick={() => runMutation(failedMutation)}>Retry</Button>
          </MessageBarActions>
        </MessageBar>
      ) : null}

      {pending ? (
        <div className={styles.status} role="status">
          <Spinner size="tiny" /> Recalculating route
        </div>
      ) : null}

      <ol className={styles.list}>
        <li className={styles.item}>
          <span className={styles.marker} aria-hidden="true">
            {getDetourIconComponent("origin", "1.25rem")}
          </span>
          <span className={styles.itemCopy}>
            <Text className={styles.itemTitle}>{origin}</Text>
            <Text className={styles.itemMeta}>Start</Text>
          </span>
        </li>

        {detourList.map((detour, index) => {
          const itemPending = pending?.index === index;
          return (
            <li
              className={styles.item}
              key={`${detour.placeId || detour.id || detour.name}-${index}`}
            >
              <span
                className={`${styles.marker} ${styles.stopMarker}`}
                role="img"
                aria-label={`${detour.type || "Detour"} stop`}
              >
                {getDetourIconComponent(detour.type, "1.25rem")}
              </span>
              <span className={styles.itemCopy}>
                <Text className={styles.itemTitle}>{detour.name}</Text>
                <Text className={styles.itemMeta}>
                  {detour.rating ? `${detour.rating} rating · ` : ""}
                  {formatAddedTime(detour)}
                </Text>
              </span>
              <span className={styles.itemActions}>
                <Tooltip content="Move earlier" relationship="label">
                  <Button
                    appearance="subtle"
                    aria-label={`Move ${detour.name} earlier`}
                    icon={<ArrowUpRegular />}
                    disabled={pending != null || index === 0}
                    onClick={() =>
                      runMutation({ kind: "move", index, toIndex: index - 1 })
                    }
                  />
                </Tooltip>
                <Tooltip content="Move later" relationship="label">
                  <Button
                    appearance="subtle"
                    aria-label={`Move ${detour.name} later`}
                    icon={<ArrowDownRegular />}
                    disabled={
                      pending != null || index === detourList.length - 1
                    }
                    onClick={() =>
                      runMutation({ kind: "move", index, toIndex: index + 1 })
                    }
                  />
                </Tooltip>
                <Tooltip content="Remove stop" relationship="label">
                  <Button
                    ref={(element) => {
                      if (element) {
                        actionRefs.current.set(index, element);
                      }
                    }}
                    appearance="subtle"
                    aria-label={`Remove ${detour.name}`}
                    icon={
                      itemPending ? <Spinner size="tiny" /> : <DeleteRegular />
                    }
                    disabled={pending != null}
                    onClick={() => runMutation({ kind: "remove", index })}
                  />
                </Tooltip>
              </span>
            </li>
          );
        })}

        <li className={styles.item}>
          <span className={styles.marker} aria-hidden="true">
            {getDetourIconComponent("destination", "1.25rem", {
              "data-testid": "destination-marker-icon",
            })}
          </span>
          <span className={styles.itemCopy}>
            <Text className={styles.itemTitle}>{destination}</Text>
            <Text className={styles.itemMeta}>Destination</Text>
          </span>
        </li>
      </ol>

      <Button
        className={styles.discoverAction}
        appearance="secondary"
        icon={<SearchRegular />}
        onClick={onDiscover}
      >
        Find a detour
      </Button>
    </section>
  );
}

JauntItinerary.propTypes = {
  destination: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  detourList: PropTypes.array.isRequired,
  onDiscover: PropTypes.func.isRequired,
  origin: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  setDetourList: PropTypes.func.isRequired,
  setRoute: PropTypes.func.isRequired,
  setTripSummary: PropTypes.func.isRequired,
};
