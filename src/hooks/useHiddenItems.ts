// hooks/useHiddenItems.ts
// Thin wrapper over useSyncHidden that also returns the hiddenIds for convenience.
import { useSyncHidden } from "./useSyncHidden";
import { useStore } from "@/store";

export function useHiddenItems(boardId?: string | null) {
  useSyncHidden(boardId);
  const hiddenIds = useStore((s) => s.hiddenIds);
  const setHiddenIds = useStore((s) => s.setHiddenIds);
  return { hiddenIds, setHiddenIds };
}
