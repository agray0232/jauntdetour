export function createEngagementTracker({ isVisible, now, onComplete }) {
  let activeStartedAt = isVisible() ? now() : null;
  let activeDurationMs = 0;
  let completed = false;

  const pause = () => {
    if (activeStartedAt == null) {
      return;
    }
    activeDurationMs += Math.max(0, now() - activeStartedAt);
    activeStartedAt = null;
  };

  return {
    visibilityChanged() {
      if (completed) return;
      if (isVisible()) {
        if (activeStartedAt == null) activeStartedAt = now();
      } else {
        pause();
      }
    },
    complete() {
      if (completed) return;
      pause();
      completed = true;
      if (activeDurationMs > 0) {
        onComplete(Math.round(activeDurationMs));
      }
    },
  };
}
