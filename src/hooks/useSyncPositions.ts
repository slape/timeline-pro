// src/persistence/useSyncPositions.ts
import { useEffect, useMemo } from "react";
import { useStore } from "@/store";
import { useStorageService } from "@/services/StorageServiceContext";
import { posKey } from "@/types/monday";

export function useSyncPositions(boardId?: string, itemIds: string[] = []) {
  const svc = useStorageService();
  const updatePosition = useStore((s) => s.updatePosition);

  // Stable key for deps so we don't resubscribe on each render if the caller passes a new array
  const idsKey = useMemo(() => itemIds.join(","), [itemIds]);

  // HYDRATE once items are present
  useEffect(() => {
    if (!boardId || itemIds.length === 0) return;

    // check presence lazily from the store to avoid selector churn
    const hasAll = itemIds.every((id) => !!useStore.getState().itemsById[id]);
    if (!hasAll) return; // try again on next render when items exist

    let cancelled = false;
    (async () => {
      for (const id of itemIds) {
        try {
          const res = await svc.getInstanceItem(posKey(boardId, id));
          const val = res?.data?.value;
          if (!cancelled && val && typeof val === "object") {
            updatePosition(id, { yDelta: val.yDelta, laneId: val.laneId });
          }
        } catch {
          // ignore hydrate errors
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [boardId, idsKey, svc, updatePosition, itemIds]);

  // PERSIST on changes (debounced)
  useEffect(() => {
    if (!boardId || itemIds.length === 0) return;

    let timer: any;
    const unsub = useStore.subscribe(
      (s) => itemIds.map((id) => ({ id, yDelta: s.itemsById[id]?.yDelta, laneId: s.itemsById[id]?.laneId })),
      (snap) => {
        clearTimeout(timer);
        timer = setTimeout(async () => {
          await Promise.all(
            snap.map(({ id, yDelta, laneId }) =>
              svc.setInstanceItem(posKey(boardId, id), { yDelta, laneId }, { versioning: true })
            )
          );
        }, 250);
      },
      {
        equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b),
      }
    );

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, [boardId, idsKey, svc, itemIds]);
}