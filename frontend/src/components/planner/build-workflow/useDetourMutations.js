import { useCallback, useRef, useState } from "react";
import { trackEvent } from "../../../telemetry/telemetry";
import { moveDetour, recalculateItinerary } from "./routeMutations";

function getDetourIdentity(detour) {
  return detour?.placeId || detour?.id || null;
}

export default function useDetourMutations(options) {
  const [pending, setPending] = useState(null);
  const [failedMutation, setFailedMutation] = useState(null);
  const [undoRemoval, setUndoRemoval] = useState(null);
  const requestIdRef = useRef(0);
  const optionsRef = useRef(options);
  const undoRemovalRef = useRef(null);
  optionsRef.current = options;

  const updateUndoRemoval = useCallback((nextUndoRemoval) => {
    undoRemovalRef.current = nextUndoRemoval;
    setUndoRemoval(nextUndoRemoval);
  }, []);

  const runMutation = useCallback(
    async (mutation) => {
      const {
        destination,
        detourList,
        origin,
        setDetourList,
        setRoute,
        setTripSummary,
      } = optionsRef.current;
      const nextDetours =
        mutation.kind === "remove"
          ? detourList.filter((detour, index) => index !== mutation.index)
          : mutation.kind === "restore"
            ? (() => {
                const identity = getDetourIdentity(mutation.detour);
                if (
                  identity &&
                  detourList.some(
                    (detour) => getDetourIdentity(detour) === identity
                  )
                ) {
                  return detourList;
                }
                const restoredDetours = detourList.slice();
                const insertionIndex = Math.min(
                  Math.max(mutation.index, 0),
                  restoredDetours.length
                );
                restoredDetours.splice(insertionIndex, 0, mutation.detour);
                return restoredDetours;
              })()
            : moveDetour(detourList, mutation.index, mutation.toIndex);

      if (nextDetours === detourList) {
        return { status: "unchanged" };
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
          return { status: "stale" };
        }

        setRoute(route);
        setTripSummary(route.summary);
        setDetourList(nextDetours);
        setPending(null);

        if (mutation.kind === "remove") {
          const removedDetour = detourList[mutation.index];
          updateUndoRemoval(
            removedDetour
              ? { detour: removedDetour, index: mutation.index }
              : null
          );
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
        } else if (mutation.kind === "restore") {
          updateUndoRemoval(null);
        }

        return { mutation, nextDetours, route, status: "success" };
      } catch {
        if (requestId !== requestIdRef.current) {
          return { status: "stale" };
        }
        setPending(null);
        setFailedMutation(mutation);
        return { mutation, status: "failed" };
      }
    },
    [updateUndoRemoval]
  );

  return {
    clearUndoRemoval: () => updateUndoRemoval(null),
    failedMutation,
    pending,
    retryMutation: () =>
      failedMutation
        ? runMutation(failedMutation)
        : Promise.resolve({ status: "unchanged" }),
    runMutation,
    undoLastRemoval: () =>
      undoRemovalRef.current
        ? runMutation({ kind: "restore", ...undoRemovalRef.current })
        : Promise.resolve({ status: "unchanged" }),
    undoRemoval,
  };
}
