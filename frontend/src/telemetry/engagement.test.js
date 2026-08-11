import { createEngagementTracker } from "./engagement";

describe("createEngagementTracker", () => {
  test("counts visible intervals and pauses while hidden", () => {
    let time = 0;
    let visible = true;
    const onComplete = jest.fn();
    const tracker = createEngagementTracker({
      isVisible: () => visible,
      now: () => time,
      onComplete,
    });

    time = 1000;
    visible = false;
    tracker.visibilityChanged();
    time = 5000;
    visible = true;
    tracker.visibilityChanged();
    time = 6500;
    tracker.complete();
    tracker.complete();

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(2500);
  });

  test("does not emit when the page was never visible", () => {
    const onComplete = jest.fn();
    const tracker = createEngagementTracker({
      isVisible: () => false,
      now: () => 0,
      onComplete,
    });

    tracker.complete();

    expect(onComplete).not.toHaveBeenCalled();
  });
});
