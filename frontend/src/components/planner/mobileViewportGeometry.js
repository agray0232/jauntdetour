function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function calculateViewportBounds({
  fallbackHeight,
  parentHeight,
  parentTop = 0,
  viewport,
}) {
  if (viewport && parentHeight) {
    const visibleTop = clamp(viewport.offsetTop - parentTop, 0, parentHeight);
    const visibleBottom = clamp(
      viewport.offsetTop + viewport.height - parentTop,
      visibleTop,
      parentHeight
    );
    if (visibleBottom > visibleTop) {
      return {
        bottomInset: parentHeight - visibleBottom,
        height: visibleBottom - visibleTop,
        top: visibleTop,
      };
    }
  }

  return {
    bottomInset: 0,
    height: parentHeight || viewport?.height || fallbackHeight,
    top: 0,
  };
}

export function subscribeToViewport(viewport, listener) {
  if (!viewport) return () => {};

  viewport.addEventListener("resize", listener);
  viewport.addEventListener("scroll", listener);
  return () => {
    viewport.removeEventListener("resize", listener);
    viewport.removeEventListener("scroll", listener);
  };
}
