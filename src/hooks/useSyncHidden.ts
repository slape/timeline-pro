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

  // HYDRATE once
  useEffect(() => {
    if (!boardId || hydratedRef.current) return;
    (async () => {
      try {
        const res = await storage.getInstanceItem<string[]>(hiddenKey(boardId), { versioning: true });
        if (res?.data?.success && Array.isArray(res.data.value)) {
          setHiddenIds(res.data.value);
        }
      } finally {
        hydratedRef.current = true;
      }
    })();
  }, [boardId, setHiddenIds, storage]);

  // PERSIST after hydration (queue a microtask to avoid racing immediate hydration write)
  useEffect(() => {
    if (!boardId || !hydratedRef.current) return;
    const t = setTimeout(() => {
    // ✅ always a Promise; no TypeError if a mock returns undefined
    Promise
      .resolve(storage.setInstanceItem(hiddenKey(boardId), hiddenIds, { versioning: true }))
      .catch(() => {});
    }, 0);
    return () => clearTimeout(t);
  }, [boardId, hiddenIds, storage]);
}
