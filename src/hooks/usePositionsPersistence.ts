// hooks/usePositionsPersistence.ts
// Thin alias over your existing useSyncPositions to match your build plan name.
import { useSyncPositions } from "./useSyncPositions";

export function usePositionsPersistence(boardId?: string, itemIds: string[] = []) {
  useSyncPositions(boardId, itemIds);
}
