// src/persistence/useSyncPositions.ts
import { useEffect, useMemo } from "react";
import { useStore } from "@/store";
import { useStorageService } from "@/services/StorageServiceContext";
import { posKey } from "@/types/monday";

export function useSyncPositions(boardId?: string, itemIds: string[] = []) {
  const svc = useStorageService();
  const updatePosition = useStore((s: any) => s.updatePosition);
  const idsKey = useMemo(() => itemIds.join(","), [itemIds]);

  // ✅ Track readiness so hydration effect retries when items appear
  const itemsReady = useStore(
    (s) => itemIds.length > 0 && itemIds.every((id) => Boolean(s.itemsById[id]))
  );

  // HYDRATE
  useEffect(() => {
    if (!boardId || !itemsReady) return;

    let cancelled = false;
    (async () => {
      for (const id of itemIds) {
        try {
          const res = await svc.getInstanceItem(posKey(boardId, id));
          const val = res?.data?.value;
          if (!cancelled && val && typeof val === "object" && typeof updatePosition === "function") {
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
  }, [boardId, idsKey, svc, itemsReady, updatePosition, itemIds]);

  // PERSIST (unchanged)
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
      { equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) }
    );
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, [boardId, idsKey, svc, itemIds]);
}
