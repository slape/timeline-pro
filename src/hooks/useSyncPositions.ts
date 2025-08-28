// src/persistence/useSyncPositions.ts
import { useEffect, useMemo, useRef } from "react";
import { useStore } from "../store";
import { useStorageService } from "../services/StorageServiceContext";
import { posKey } from "../types/monday_storage";

type PosValue = { yDelta?: number; laneId?: string };

export function useSyncPositions(boardId?: string | null, itemIds: string[] = []) {
  const storage = useStorageService();
  const itemsById = useStore((s) => s.itemsById);
  const upsertItems = useStore((s) => s.upsertItems);
  const hydratedRef = useRef(false);

  // Hydrate positions for current items
  useEffect(() => {
    if (!boardId || itemIds.length === 0) return;
    (async () => {
      const patches: Array<{ id: string; patch: PosValue }> = [];
      for (const id of itemIds) {
        const res = await storage.getInstanceItem<PosValue>(posKey(boardId, id));
        if (res?.data?.success && res.data.value) {
          patches.push({ id, patch: res.data.value });
        }
      }
      if (patches.length) {
        upsertItems(
          patches
            .map(({ id, patch }) => {
              const base = itemsById[id];
              if (!base) return null;
              return { ...base, ...patch };
            })
            .filter(Boolean) as any
        );
      }
      hydratedRef.current = true;
    })().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, itemIds.join(","), upsertItems, storage]);

  // Prepare payload to persist
  const toPersist = useMemo(() => {
    return itemIds.map((id) => {
      const it = itemsById[id];
      return { id, value: { yDelta: it?.yDelta, laneId: it?.laneId } as PosValue };
    });
  }, [itemsById, itemIds]);

  // Debounced persist
  useEffect(() => {
    if (!boardId || !hydratedRef.current) return;
    const t = setTimeout(async () => {
      try {
        await Promise.all(
          toPersist.map(({ id, value }) =>
            storage.setInstanceItem(posKey(boardId, id), value, { versioning: true })
          )
        );
      } catch {
        // you can toast or retry here
      }
    }, 150);
    return () => clearTimeout(t);
  }, [boardId, toPersist, storage]);
}
