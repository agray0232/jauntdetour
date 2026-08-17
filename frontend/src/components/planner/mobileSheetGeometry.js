const EXPANDED_TOP_INSET = 8;
const PEEK_HEIGHT = 56;
const MID_TOP_RATIO = 0.555; // balanced anchor: sheet occupies ~44.5% of the viewport
const MAGNETIC_RADIUS = 28;
const FLING_VELOCITY = 0.55;

export function clampSheetPosition(position, anchors) {
  return Math.min(anchors.peek, Math.max(anchors.expanded, position));
}

export function calculateSheetAnchors(viewportHeight) {
  const usableHeight = Math.max(viewportHeight, PEEK_HEIGHT * 2);
  const expanded = Math.min(EXPANDED_TOP_INSET, usableHeight - PEEK_HEIGHT);
  const peek = usableHeight - PEEK_HEIGHT;
  const mid = clampSheetPosition(Math.round(usableHeight * MID_TOP_RATIO), {
    expanded,
    peek,
  });

  return { expanded, mid, peek };
}

function orderedAnchors(anchors) {
  return [
    ["expanded", anchors.expanded],
    ["mid", anchors.mid],
    ["peek", anchors.peek],
  ];
}

export function resolveSheetRelease({
  anchors,
  position,
  velocity = 0,
  magneticRadius = MAGNETIC_RADIUS,
  flingVelocity = FLING_VELOCITY,
}) {
  const clampedPosition = clampSheetPosition(position, anchors);
  const nearbyAnchor = orderedAnchors(anchors).find(
    ([, anchorPosition]) =>
      Math.abs(anchorPosition - clampedPosition) <= magneticRadius
  );

  if (nearbyAnchor) {
    return { anchor: nearbyAnchor[0], position: nearbyAnchor[1] };
  }

  if (Math.abs(velocity) >= flingVelocity) {
    const anchorsInDirection = orderedAnchors(anchors).filter(
      ([, anchorPosition]) =>
        velocity < 0
          ? anchorPosition < clampedPosition
          : anchorPosition > clampedPosition
    );
    const directedAnchor =
      velocity < 0 ? anchorsInDirection.at(-1) : anchorsInDirection.at(0);
    if (directedAnchor) {
      return { anchor: directedAnchor[0], position: directedAnchor[1] };
    }
  }

  return { anchor: null, position: clampedPosition };
}

export function remapSheetPosition({
  anchor,
  position,
  previousAnchors,
  nextAnchors,
}) {
  if (anchor) {
    return { anchor, position: nextAnchors[anchor] };
  }

  const previousRange = previousAnchors.peek - previousAnchors.expanded;
  const nextRange = nextAnchors.peek - nextAnchors.expanded;
  const progress = previousRange
    ? (position - previousAnchors.expanded) / previousRange
    : 0;

  return {
    anchor: null,
    position: clampSheetPosition(
      nextAnchors.expanded + progress * nextRange,
      nextAnchors
    ),
  };
}

export const sheetGeometryDefaults = {
  flingVelocity: FLING_VELOCITY,
  magneticRadius: MAGNETIC_RADIUS,
  peekHeight: PEEK_HEIGHT,
};
