import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import PropTypes from "prop-types";
import { makeStyles, shorthands, tokens } from "@fluentui/react-components";
import { jauntColors, jauntRadius } from "../../design-system/tokens";
import {
  calculateSheetAnchors,
  clampSheetPosition,
  remapSheetPosition,
  resolveSheetRelease,
} from "./mobileSheetGeometry";
import {
  calculateViewportBounds,
  subscribeToViewport,
} from "./mobileViewportGeometry";

// Ignore drag velocity when the pointer has been held still for longer than
// this before release, so a pause after a fast drag does not trigger a fling.
const VELOCITY_IDLE_TIMEOUT = 80;

const useStyles = makeStyles({
  sheet: {
    position: "absolute",
    zIndex: 4,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    display: "flex",
    minHeight: 0,
    flexDirection: "column",
    overflow: "hidden",
    backgroundColor: tokens.colorNeutralBackground1,
    borderTopLeftRadius: jauntRadius.sheet,
    borderTopRightRadius: jauntRadius.sheet,
    boxShadow: "0 -0.5rem 1.75rem rgba(20, 40, 47, 0.16)",
    willChange: "top",
    transitionDuration: "180ms",
    transitionProperty: "top",
    transitionTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
    "@media (prefers-reduced-motion: reduce)": {
      transitionDuration: "0ms",
    },
  },
  dragging: {
    transitionDuration: "0ms",
  },
  handle: {
    position: "relative",
    display: "flex",
    minHeight: "3.5rem",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    cursor: "ns-resize",
    touchAction: "none",
    ...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke2),
    ":focus-visible": {
      outlineColor: jauntColors.semantic.focus,
      outlineOffset: "-0.25rem",
      outlineStyle: "solid",
      outlineWidth: "0.1875rem",
    },
  },
  handleBar: {
    width: "2.5rem",
    height: "0.3125rem",
    borderRadius: "999px",
    backgroundColor: tokens.colorNeutralStroke1Pressed,
    pointerEvents: "none",
  },
  body: {
    display: "flex",
    minHeight: 0,
    flexGrow: 1,
    flexDirection: "column",
    overflow: "hidden",
    paddingBottom: "env(safe-area-inset-bottom, 0px)",
    "& > aside > div:first-child": {
      minHeight: "3.75rem",
      padding: "0.25rem 0.75rem",
      columnGap: "0.5rem",
    },
    "& > aside > div:first-child > div:nth-child(2)": {
      transform: "none",
    },
  },
  passthrough: {
    display: "contents",
  },
});

function getViewportBounds(element) {
  const parent = element?.parentElement;
  const rect = parent?.getBoundingClientRect();
  const parentHeight = rect?.height || parent?.clientHeight || 0;
  const viewport =
    typeof window !== "undefined" ? window.visualViewport : undefined;

  return calculateViewportBounds({
    fallbackHeight: window.innerHeight,
    parentHeight,
    parentTop: rect?.top || 0,
    viewport,
  });
}

function offsetAnchors(anchors, offset) {
  return Object.fromEntries(
    Object.entries(anchors).map(([name, position]) => [name, position + offset])
  );
}

function getAnchorInDirection(position, anchors, direction) {
  const ordered = ["expanded", "mid", "peek"];
  const candidates = ordered.filter((anchor) =>
    direction < 0 ? anchors[anchor] < position : anchors[anchor] > position
  );
  return direction < 0 ? candidates.at(-1) : candidates.at(0);
}

function MobilePlannerSheet({ active, children }) {
  const styles = useStyles();
  const sheetRef = useRef(null);
  const dragRef = useRef(null);
  const frameRef = useRef(null);
  const measureFrameRef = useRef(null);
  const focusFrameRef = useRef(null);
  const focusedControlRef = useRef(null);
  const suppressClickRef = useRef(false);
  const positionRef = useRef(0);
  const anchorsRef = useRef(calculateSheetAnchors(window.innerHeight));
  const stateRef = useRef({ anchor: "mid", position: anchorsRef.current.mid });
  const [sheetState, setSheetState] = useState(stateRef.current);
  const [dragging, setDragging] = useState(false);

  const revealFocusedControl = useCallback(() => {
    const control = focusedControlRef.current;
    if (!control?.isConnected) return;

    const scrollRegion = control.closest('[data-planner-scroll="true"]');
    if (!scrollRegion) return;

    const controlBounds = control.getBoundingClientRect();
    const scrollBounds = scrollRegion.getBoundingClientRect();
    const edgePadding = 16;
    if (controlBounds.top < scrollBounds.top + edgePadding) {
      scrollRegion.scrollTop -=
        scrollBounds.top + edgePadding - controlBounds.top;
    } else if (controlBounds.bottom > scrollBounds.bottom - edgePadding) {
      scrollRegion.scrollTop +=
        controlBounds.bottom - (scrollBounds.bottom - edgePadding);
    }
  }, []);

  const scheduleFocusedControlReveal = useCallback(() => {
    if (focusFrameRef.current != null) {
      cancelAnimationFrame(focusFrameRef.current);
    }
    focusFrameRef.current = requestAnimationFrame(() => {
      focusFrameRef.current = null;
      revealFocusedControl();
    });
  }, [revealFocusedControl]);

  const applyPosition = useCallback((position) => {
    positionRef.current = position;
    if (sheetRef.current) {
      sheetRef.current.style.top = `${position}px`;
    }
  }, []);

  const commitState = useCallback(
    (nextState) => {
      stateRef.current = nextState;
      setSheetState(nextState);
      applyPosition(nextState.position);
    },
    [applyPosition]
  );

  const measure = useCallback(() => {
    const viewportBounds = getViewportBounds(sheetRef.current);
    const nextAnchors = offsetAnchors(
      calculateSheetAnchors(viewportBounds.height),
      viewportBounds.top
    );
    const nextState = remapSheetPosition({
      ...stateRef.current,
      previousAnchors: anchorsRef.current,
      nextAnchors,
    });
    anchorsRef.current = nextAnchors;
    if (sheetRef.current) {
      sheetRef.current.style.bottom = `${viewportBounds.bottomInset}px`;
    }
    commitState(nextState);
    scheduleFocusedControlReveal();
  }, [commitState, scheduleFocusedControlReveal]);

  const scheduleMeasure = useCallback(() => {
    if (measureFrameRef.current != null) {
      cancelAnimationFrame(measureFrameRef.current);
    }
    measureFrameRef.current = requestAnimationFrame(() => {
      measureFrameRef.current = null;
      measure();
    });
  }, [measure]);

  useLayoutEffect(() => {
    if (!active) {
      focusedControlRef.current = null;
      return undefined;
    }

    measure();
    const parent = sheetRef.current?.parentElement;
    const viewport =
      typeof window !== "undefined" ? window.visualViewport : undefined;

    let observer;
    if (parent && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(scheduleMeasure);
      observer.observe(parent);
    }
    const unsubscribeViewport = subscribeToViewport(viewport, scheduleMeasure);

    return () => {
      observer?.disconnect();
      unsubscribeViewport();
      if (measureFrameRef.current != null) {
        cancelAnimationFrame(measureFrameRef.current);
        measureFrameRef.current = null;
      }
      if (focusFrameRef.current != null) {
        cancelAnimationFrame(focusFrameRef.current);
        focusFrameRef.current = null;
      }
    };
  }, [active, measure, scheduleMeasure]);

  useEffect(
    () => () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
      if (measureFrameRef.current != null) {
        cancelAnimationFrame(measureFrameRef.current);
      }
      if (focusFrameRef.current != null) {
        cancelAnimationFrame(focusFrameRef.current);
      }
    },
    []
  );

  const moveToAnchor = (anchor) => {
    commitState({ anchor, position: anchorsRef.current[anchor] });
  };

  const handlePointerDown = (event) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startPosition: positionRef.current,
      startTime: event.timeStamp,
      startY: event.clientY,
      lastTime: event.timeStamp,
      lastY: event.clientY,
      moved: false,
    };
    suppressClickRef.current = false;
    setDragging(true);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const nextPosition = clampSheetPosition(
      drag.startPosition + event.clientY - drag.startY,
      anchorsRef.current
    );
    drag.lastTime = event.timeStamp;
    drag.lastY = event.clientY;
    drag.moved ||= Math.abs(event.clientY - drag.startY) > 4;
    suppressClickRef.current ||= drag.moved;
    if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => applyPosition(nextPosition));
  };

  const finishDrag = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (frameRef.current != null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    const idleSinceMove = event.timeStamp - drag.lastTime;
    const elapsed = Math.max(drag.lastTime - drag.startTime, 1);
    const velocity =
      idleSinceMove > VELOCITY_IDLE_TIMEOUT
        ? 0
        : (drag.lastY - drag.startY) / elapsed;
    const release = resolveSheetRelease({
      anchors: anchorsRef.current,
      position: drag.startPosition + drag.lastY - drag.startY,
      velocity,
    });
    dragRef.current = null;
    setDragging(false);
    commitState(release);
  };

  const handleClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (sheetState.anchor === "peek") moveToAnchor("mid");
    else if (sheetState.anchor === "expanded") moveToAnchor("mid");
    else moveToAnchor("expanded");
  };

  const handleKeyDown = (event) => {
    let anchor;
    if (event.key === "Home") anchor = "peek";
    if (event.key === "End") anchor = "expanded";
    if (event.key === "ArrowUp") {
      anchor = getAnchorInDirection(
        positionRef.current,
        anchorsRef.current,
        -1
      );
    }
    if (event.key === "ArrowDown") {
      anchor = getAnchorInDirection(positionRef.current, anchorsRef.current, 1);
    }
    if (!anchor) return;
    event.preventDefault();
    moveToAnchor(anchor);
  };

  const handleBodyFocus = (event) => {
    if (
      !event.target.matches("input, textarea, select, [contenteditable='true']")
    )
      return;

    focusedControlRef.current = event.target;
    scheduleFocusedControlReveal();
  };

  const handleBodyBlur = (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    focusedControlRef.current = null;
    if (focusFrameRef.current != null) {
      cancelAnimationFrame(focusFrameRef.current);
      focusFrameRef.current = null;
    }
  };

  const positionPercent = Math.round(
    ((anchorsRef.current.peek - sheetState.position) /
      (anchorsRef.current.peek - anchorsRef.current.expanded)) *
      100
  );
  const positionName = sheetState.anchor || "custom";

  return (
    <div
      className={`${active ? styles.sheet : styles.passthrough} ${
        active && dragging ? styles.dragging : ""
      }`}
      data-sheet-position={active ? positionName : undefined}
      data-testid="mobile-planner-sheet"
      ref={sheetRef}
      style={active ? { top: `${sheetState.position}px` } : undefined}
    >
      {active ? (
        <div
          key="handle"
          aria-label="Resize planning tools"
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={positionPercent}
          aria-valuetext={`${positionName} position`}
          className={styles.handle}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onPointerCancel={finishDrag}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          role="slider"
          tabIndex={0}
        >
          <span aria-hidden="true" className={styles.handleBar} />
        </div>
      ) : null}
      <div
        key="body"
        className={active ? styles.body : styles.passthrough}
        onBlurCapture={active ? handleBodyBlur : undefined}
        onFocusCapture={active ? handleBodyFocus : undefined}
      >
        {children}
      </div>
    </div>
  );
}

MobilePlannerSheet.propTypes = {
  active: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
};

export default MobilePlannerSheet;
