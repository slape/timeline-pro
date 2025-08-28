// src/persistence/useSyncHidden.ts
import { useEffect, useRef } from "react";
import { useStore } from "@/store";
import { useStorageService } from "@/services/StorageServiceContext";
import { hiddenKey } from "@/types/monday";

export function useSyncHidden(boardId?: string | null) {
  const storage = useStorageService();
  const hiddenIds = useStore((s) => s.hiddenIds);
  const setHiddenIds = useStore((s) => s.setHiddenIds);
  const hydratedRef = useRef(false);

  // Hydrate once
  useEffect(() => {
    if (!boardId || hydratedRef.current) return;
    (async () => {
      const res = await storage.getInstanceItem<string[]>(hiddenKey(boardId), { versioning: true });
      if (res?.data?.success && Array.isArray(res.data.value)) setHiddenIds(res.data.value);
      hydratedRef.current = true;
    })().catch(() => {});
  }, [boardId, setHiddenIds, storage]);

  // Persist on changes (optimistic)
  useEffect(() => {
    if (!boardId || !hydratedRef.current) return;
    storage.setInstanceItem(hiddenKey(boardId), hiddenIds, { versioning: true }).catch(() => {});
  }, [boardId, hiddenIds, storage]);
}
