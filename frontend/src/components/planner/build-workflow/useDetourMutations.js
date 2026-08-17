import { useCallback, useRef, useState } from "react";
import { trackEvent } from "../../../telemetry/telemetry";
import { moveDetour, recalculateItinerary } from "./routeMutations";

function getDetourIdentity(detour) {
  return detour?.placeId || detour?.id || null;
}

function resolveMutationTarget(mutation, detourList) {
  if (mutation.kind === "restore") return mutation;

  const detourIdentity =
    mutation.detourIdentity || getDetourIdentity(detourList[mutation.index]);
  const index = detourIdentity
    ? detourList.findIndex(
        (detour) => getDetourIdentity(detour) === detourIdentity
      )
    : mutation.index;

  if (!Number.isInteger(index) || index < 0 || index >= detourList.length) {
    return null;
  }

  return { ...mutation, detourIdentity, index };
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
      const resolvedMutation = resolveMutationTarget(mutation, detourList);
      if (!resolvedMutation) {
        return { status: "unchanged" };
      }
      const nextDetours =
        resolvedMutation.kind === "remove"
          ? detourList.filter(
              (detour, index) => index !== resolvedMutation.index
            )
          : resolvedMutation.kind === "restore"
            ? (() => {
                const identity = getDetourIdentity(resolvedMutation.detour);
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
                  Math.max(resolvedMutation.index, 0),
                  restoredDetours.length
                );
                restoredDetours.splice(
                  insertionIndex,
                  0,
                  resolvedMutation.detour
                );
                return restoredDetours;
              })()
            : moveDetour(
                detourList,
                resolvedMutation.index,
                resolvedMutation.toIndex
              );

      if (nextDetours === detourList) {
        return { status: "unchanged" };
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setPending(resolvedMutation);
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

        if (resolvedMutation.kind === "remove") {
          const removedDetour = detourList[resolvedMutation.index];
          updateUndoRemoval(
            removedDetour
              ? { detour: removedDetour, index: resolvedMutation.index }
              : null
          );
          trackEvent("detour_removed", {
            category: detourList[resolvedMutation.index]?.type || "Unspecified",
            countBucket:
              nextDetours.length === 0
                ? "0"
                : nextDetours.length <= 5
                  ? "1-5"
                  : "6+",
            feature: "detour",
          });
        } else if (resolvedMutation.kind === "restore") {
          updateUndoRemoval(null);
        }

        return {
          mutation: resolvedMutation,
          nextDetours,
          route,
          status: "success",
        };
      } catch {
        if (requestId !== requestIdRef.current) {
          return { status: "stale" };
        }
        setPending(null);
        setFailedMutation(resolvedMutation);
        return { mutation: resolvedMutation, status: "failed" };
      }
    },
    [updateUndoRemoval]
  );

  return {
    clearUndoRemoval: () => updateUndoRemoval(null),
    failedMutation,
    pending,
    retryMutation: (mutation) => {
      const target = mutation || failedMutation;
      return target
        ? runMutation(target)
        : Promise.resolve({ status: "unchanged" });
    },
    runMutation,
    undoLastRemoval: () =>
      undoRemovalRef.current
        ? runMutation({ kind: "restore", ...undoRemovalRef.current })
        : Promise.resolve({ status: "unchanged" }),
    undoRemoval,
  };
}
