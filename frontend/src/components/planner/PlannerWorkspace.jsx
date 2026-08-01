import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  Badge,
  Button,
  Field,
  Input,
  Tab,
  TabList,
  Text,
  makeStyles,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import {
  ArrowLeftRegular,
  MapRegular,
  OpenRegular,
  SparkleRegular,
  TextBulletListTreeRegular,
} from "@fluentui/react-icons";
import RouteForm from "./build-workflow/RouteForm";
import BuildRouteDetails from "./build-workflow/BuildRouteDetails";
import DiscoverWorkspace from "./discover-workflow/DiscoverWorkspace";
import ExportWorkspace from "./export-workflow/ExportWorkspace";
import MapContainer from "../MapContainer";
import {
  createPlannerFingerprint,
  getPlannerSaveState,
  saveStatus,
} from "./build-workflow/plannerFingerprint";
import {
  jauntColors,
  jauntRadius,
  jauntSize,
  jauntSpacing,
  jauntTypography,
} from "../../design-system/tokens";

const useStyles = makeStyles({
  root: {
    display: "grid",
    width: "100%",
    height: "100%",
    minWidth: 0,
    minHeight: 0,
    gridTemplateAreas: '"tools map"',
    gridTemplateColumns: `${jauntSize.plannerPanel} minmax(0, 1fr)`,
    overflow: "hidden",
    backgroundColor: tokens.colorNeutralBackground2,
    "@media (min-width: 48.751rem) and (max-width: 65.625rem)": {
      gridTemplateColumns: "23.75rem minmax(0, 1fr)",
    },
    "@media (max-width: 48.75rem) and (orientation: portrait)": {
      gridTemplateAreas: '"map" "tools"',
      gridTemplateColumns: "minmax(0, 1fr)",
      gridTemplateRows: "minmax(12rem, 39%) minmax(0, 61%)",
    },
    "@media (max-height: 31.25rem) and (orientation: landscape)": {
      gridTemplateAreas: '"tools map"',
      gridTemplateColumns: "minmax(19rem, 46%) minmax(0, 54%)",
      gridTemplateRows: "minmax(0, 1fr)",
    },
  },
  mapExpanded: {
    "@media (max-width: 48.75rem) and (min-height: 31.251rem)": {
      gridTemplateAreas: '"map"',
      gridTemplateRows: "minmax(0, 1fr)",
    },
  },
  tools: {
    gridArea: "tools",
    display: "flex",
    minWidth: 0,
    minHeight: 0,
    flexDirection: "column",
    overflow: "hidden",
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRight("1px", "solid", tokens.colorNeutralStroke1),
    "@media (max-width: 48.75rem) and (min-height: 31.251rem)": {
      ...shorthands.borderRight("0", "solid", "transparent"),
      ...shorthands.borderTop("1px", "solid", tokens.colorNeutralStroke1),
    },
  },
  toolsHidden: {
    "@media (max-width: 48.75rem) and (min-height: 31.251rem)": {
      display: "none",
    },
  },
  panelHeader: {
    display: "grid",
    minHeight: "4.75rem",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    alignItems: "center",
    padding: `${jauntSpacing[3]} ${jauntSpacing[4]}`,
    columnGap: jauntSpacing[3],
    backgroundColor: jauntColors.neutral.background,
    ...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke1),
  },
  panelIdentity: {
    display: "grid",
    minWidth: 0,
    flexGrow: 1,
    rowGap: jauntSpacing[1],
  },
  panelActions: {
    display: "flex",
    alignItems: "center",
    gap: jauntSpacing[2],
  },
  panelActionsReady: {
    minHeight: "2rem",
    alignSelf: "end",
  },
  eyebrow: {
    color: jauntColors.brand.accentStrong,
    fontSize: jauntTypography.size.caption,
    fontWeight: jauntTypography.weight.bold,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  panelTitle: {
    margin: 0,
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.titleSmall,
    lineHeight: jauntTypography.lineHeight.tight,
  },
  panelNameField: {
    width: "100%",
    minWidth: 0,
    maxWidth: "15rem",
    "& label": {
      color: jauntColors.brand.accentStrong,
      fontSize: jauntTypography.size.caption,
      fontWeight: jauntTypography.weight.bold,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    },
  },
  panelNameInput: {
    width: "100%",
    minWidth: 0,
    "& input": {
      fontFamily: jauntTypography.family.editorial,
      fontSize: jauntTypography.size.bodyLarge,
    },
  },
  tabsRow: {
    display: "flex",
    minHeight: "3rem",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: jauntSpacing[2],
    paddingLeft: jauntSpacing[2],
    ...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke1),
  },
  tabs: {
    flexGrow: 1,
  },
  compactMapAction: {
    display: "none",
    "@media (max-width: 48.75rem) and (min-height: 31.251rem)": {
      display: "inline-flex",
    },
  },
  panelScroll: {
    minWidth: 0,
    minHeight: 0,
    flexGrow: 1,
    overflowX: "hidden",
    overflowY: "auto",
    overscrollBehavior: "contain",
    "& .container": {
      width: "100%",
      maxWidth: "none",
    },
  },
  tabPanel: {
    minWidth: 0,
    paddingBottom: jauntSpacing[5],
    "& .fui-MessageBar": {
      width: "100%",
      minWidth: 0,
      maxWidth: "100%",
      boxSizing: "border-box",
      overflow: "hidden",
    },
    "& .fui-MessageBarBody": {
      minWidth: 0,
      overflowWrap: "anywhere",
      whiteSpace: "normal",
    },
    "& .fui-MessageBarActions": {
      minWidth: 0,
      flexShrink: 0,
    },
  },
  discoverEmpty: {
    display: "grid",
    padding: jauntSpacing[5],
    rowGap: jauntSpacing[3],
    color: tokens.colorNeutralForeground2,
  },
  discoverTitle: {
    margin: 0,
    color: tokens.colorNeutralForeground1,
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.bodyLarge,
  },
  map: {
    position: "relative",
    gridArea: "map",
    minWidth: 0,
    minHeight: 0,
    overflow: "hidden",
    backgroundColor: jauntColors.neutral.backgroundTinted,
  },
  mapBack: {
    position: "absolute",
    top: jauntSpacing[3],
    left: jauntSpacing[3],
    zIndex: 2,
    display: "none",
    color: tokens.colorNeutralForeground1,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: jauntRadius.control,
    boxShadow: tokens.shadow16,
    "@media (max-width: 48.75rem) and (min-height: 31.251rem)": {
      display: "inline-flex",
    },
  },
});

export default function PlannerWorkspace(props) {
  const styles = useStyles();
  const [selectedTask, setSelectedTask] = useState("build");
  const [mapExpanded, setMapExpanded] = useState(false);
  const [editingRoute, setEditingRoute] = useState(!props.showDetourButton);
  const [saveOperation, setSaveOperation] = useState("idle");
  const [plannerFeedback, setPlannerFeedback] = useState("");
  const previousSuggestedNameRef = useRef("");
  const previousTripNameRef = useRef(props.tripName);
  const tripNameRef = useRef(props.tripName);

  useEffect(() => {
    if (props.showDetourForm) {
      setSelectedTask("discover");
    }
  }, [props.showDetourForm]);

  useEffect(() => {
    if (!props.showDetourButton) {
      setSelectedTask("build");
      setMapExpanded(false);
      setEditingRoute(true);
    }
  }, [props.showDetourButton]);

  useEffect(() => {
    if (!plannerFeedback) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => setPlannerFeedback(""), 10000);
    return () => window.clearTimeout(timeoutId);
  }, [plannerFeedback]);

  const openDiscover = () => {
    if (!props.showDetourForm) {
      props.getDetourForm();
    }
    setSelectedTask("discover");
  };

  const handleTabSelect = (event, data) => {
    if (data.value === "discover") {
      openDiscover();
      return;
    }
    setSelectedTask(data.value);
  };

  const fingerprint = createPlannerFingerprint({
    origin: props.origin,
    destination: props.destination,
    route: props.route,
    detourList: props.detourList,
    tripName: props.tripName,
  });
  const currentSaveState = getPlannerSaveState({
    currentTrip: props.currentTrip,
    fingerprint,
    operation: saveOperation,
  });
  const currentStatus = saveStatus[currentSaveState];
  const routeTitle = [props.origin, props.destination]
    .map((endpoint) =>
      typeof endpoint === "string" ? endpoint : endpoint?.address
    )
    .filter(Boolean)
    .join(" to ");

  useEffect(() => {
    tripNameRef.current = props.tripName;
  }, [props.tripName]);

  useEffect(() => {
    const previousSuggestion = previousSuggestedNameRef.current;
    const previousTripName = previousTripNameRef.current;
    previousSuggestedNameRef.current = routeTitle;
    previousTripNameRef.current = props.tripName;

    if (!props.showDetourButton || !routeTitle || props.currentTrip) {
      return;
    }

    const currentName = tripNameRef.current?.trim() || "";
    const clearedExistingName =
      Boolean(previousTripName?.trim()) &&
      !currentName &&
      previousSuggestion === routeTitle;
    if (clearedExistingName) {
      return;
    }
    const usesGeneratedName =
      !currentName ||
      (previousSuggestion && currentName === previousSuggestion);

    if (usesGeneratedName && tripNameRef.current !== routeTitle) {
      props.setTripName(routeTitle);
    }
  }, [
    props,
    props.currentTrip,
    props.showDetourButton,
    props.setTripName,
    routeTitle,
  ]);

  return (
    <div className={`${styles.root} ${mapExpanded ? styles.mapExpanded : ""}`}>
      <aside
        className={`${styles.tools} ${mapExpanded ? styles.toolsHidden : ""}`}
        aria-label="Jaunt planning tools"
      >
        <div className={styles.panelHeader}>
          <div className={styles.panelIdentity}>
            {props.showDetourButton ? (
              <Field className={styles.panelNameField} label="Jaunt name">
                <Input
                  className={styles.panelNameInput}
                  aria-label="Jaunt name"
                  value={props.tripName || ""}
                  placeholder={routeTitle || "Name this Jaunt"}
                  onChange={(event) => props.setTripName(event.target.value)}
                />
              </Field>
            ) : (
              <>
                <Text className={styles.eyebrow}>New Jaunt</Text>
                <h2 className={styles.panelTitle}>Build your Jaunt</h2>
              </>
            )}
          </div>
          <div
            className={`${styles.panelActions} ${
              props.showDetourButton ? styles.panelActionsReady : ""
            }`}
          >
            <Badge appearance="tint" color={currentStatus.color}>
              {currentStatus.label}
            </Badge>
          </div>
        </div>

        <div className={styles.tabsRow}>
          <TabList
            className={styles.tabs}
            selectedValue={selectedTask}
            onTabSelect={handleTabSelect}
            aria-label="Planning tools"
          >
            <Tab
              value="build"
              icon={<TextBulletListTreeRegular data-testid="build-tab-icon" />}
            >
              Build
            </Tab>
            <Tab
              value="discover"
              icon={<SparkleRegular data-testid="discover-tab-icon" />}
              disabled={!props.showDetourButton}
            >
              Discover
            </Tab>
            <Tab
              value="export"
              icon={<OpenRegular data-testid="export-tab-icon" />}
              disabled={!props.showDetourButton}
            >
              Export
            </Tab>
          </TabList>
          <Button
            className={styles.compactMapAction}
            appearance="subtle"
            icon={<MapRegular />}
            onClick={() => setMapExpanded(true)}
          >
            Show map
          </Button>
        </div>

        <div className={styles.panelScroll}>
          <section
            className={styles.tabPanel}
            role="tabpanel"
            aria-label="Build"
            hidden={selectedTask !== "build"}
          >
            {editingRoute ? (
              <RouteForm
                origin={props.origin}
                destination={props.destination}
                detourList={props.detourList}
                setOrigin={props.setOrigin}
                setDestination={props.setDestination}
                setDetourList={props.setDetourList}
                setRoute={props.setRoute}
                setTripSummary={props.setTripSummary}
                clearAll={props.clearAll}
                onCancel={
                  props.showDetourButton ? () => setEditingRoute(false) : null
                }
                onRouteReady={() => setEditingRoute(false)}
              />
            ) : (
              <BuildRouteDetails
                origin={props.origin}
                destination={props.destination}
                tripSummary={props.tripSummary}
                detourList={props.detourList}
                removeDetour={props.removeDetour}
                setRoute={props.setRoute}
                setTripSummary={props.setTripSummary}
                setDetourList={props.setDetourList}
                onClear={props.clearAll}
                onDiscover={openDiscover}
                onEditRoute={() => setEditingRoute(true)}
                onSaveStateChange={setSaveOperation}
              />
            )}
          </section>

          <section
            className={styles.tabPanel}
            role="tabpanel"
            aria-label="Discover"
            hidden={selectedTask !== "discover"}
          >
            {props.showDetourForm ? (
              <DiscoverWorkspace
                origin={props.origin}
                destination={props.destination}
                tripSummary={props.tripSummary}
                detourOptions={props.detourOptions}
                detourList={props.detourList}
                detourHighlight={props.detourHighlight}
                addDetour={props.addDetour}
                setRoute={props.setRoute}
                setTripSummary={props.setTripSummary}
                setDetourSearchLocation={props.setDetourSearchLocation}
                setDetourSearchRadius={props.setDetourSearchRadius}
                setDetourType={props.setDetourType}
                setDetourOptions={props.setDetourOptions}
                setDetourHighlight={props.setDetourHighlight}
                detourType={props.detourType}
                detourSearchLocation={props.detourSearchLocation}
                detourSearchRadius={props.detourSearchRadius}
                route={props.route}
                feedback={plannerFeedback}
                onDismissFeedback={() => setPlannerFeedback("")}
                onAdded={(name, addedTime) => {
                  setPlannerFeedback(
                    `${name} added. The route is ${addedTime} minutes longer.`
                  );
                }}
              />
            ) : (
              <div className={styles.discoverEmpty}>
                <h3 className={styles.discoverTitle}>Create a route first</h3>
                <Text>
                  Discover becomes available when your origin and destination
                  are connected.
                </Text>
              </div>
            )}
          </section>

          <section
            className={styles.tabPanel}
            role="tabpanel"
            aria-label="Export"
            hidden={selectedTask !== "export"}
          >
            {props.showDetourButton ? (
              <ExportWorkspace
                origin={props.origin}
                destination={props.destination}
                detourList={props.detourList}
              />
            ) : null}
          </section>
        </div>
      </aside>

      <section className={styles.map} aria-label="Jaunt route map">
        {mapExpanded ? (
          <Button
            className={styles.mapBack}
            appearance="secondary"
            icon={<ArrowLeftRegular />}
            onClick={() => setMapExpanded(false)}
          >
            Back to tools
          </Button>
        ) : null}
        <MapContainer
          showRoute={props.showRoute}
          showDetourSearchPoint={props.showDetourSearchPoint}
          detourSearchLocation={props.detourSearchLocation}
          detourSearchRadius={props.detourSearchRadius}
          detourOptions={props.detourOptions}
          detourHighlight={props.detourHighlight}
          detourList={props.detourList}
          setDetourHighlight={props.setDetourHighlight}
          route={props.route}
        />
      </section>
    </div>
  );
}

PlannerWorkspace.propTypes = {
  origin: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  destination: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  currentTrip: PropTypes.object,
  tripSummary: PropTypes.object,
  tripName: PropTypes.string,
  route: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  detourList: PropTypes.array,
  detourOptions: PropTypes.array,
  detourHighlight: PropTypes.array,
  detourType: PropTypes.string,
  detourSearchLocation: PropTypes.number,
  detourSearchRadius: PropTypes.number,
  showRoute: PropTypes.bool,
  showDetourButton: PropTypes.bool,
  showDetourForm: PropTypes.bool,
  showDetourOptions: PropTypes.bool,
  showDetourSearchPoint: PropTypes.bool,
  setOrigin: PropTypes.func,
  setDestination: PropTypes.func,
  setRoute: PropTypes.func,
  setTripSummary: PropTypes.func,
  setTripName: PropTypes.func,
  setDetourType: PropTypes.func,
  setDetourSearchLocation: PropTypes.func,
  setDetourSearchRadius: PropTypes.func,
  setDetourOptions: PropTypes.func,
  setDetourHighlight: PropTypes.func,
  setDetourList: PropTypes.func,
  addDetour: PropTypes.func,
  removeDetour: PropTypes.func,
  getDetourForm: PropTypes.func,
  clearAll: PropTypes.func,
  clearDetourOptions: PropTypes.func,
};
