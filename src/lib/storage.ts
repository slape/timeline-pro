// lib/storage.ts
import type { MondayStorageService } from "@/services/MondayStorageService";
import { posKey, hiddenKey } from "@/types/monday";

export type PositionRecord = { yDelta: number; laneId?: string | null };
export type PositionsMap = Record<string, PositionRecord | undefined>;

/** POSITIONS */
export async function getPositions(
  svc: MondayStorageService,
  boardId: string,
  ids: string[]
): Promise<PositionsMap> {
  const entries = await Promise.all(
    ids.map(async (id) => {
      try {
        const res = await svc.getInstanceItem(posKey(boardId, id), { versioning: true });
        if (res?.data?.success && res.data.value && typeof res.data.value === "object") {
          const { yDelta = 0, laneId = null } = res.data.value as PositionRecord;
          return [id, { yDelta, laneId }] as const;
        }
      } catch {}
      return [id, undefined] as const;
    })
  );
  return Object.fromEntries(entries);
}

export async function setPosition(
  svc: MondayStorageService,
  boardId: string,
  itemId: string,
  patch: Partial<PositionRecord>
): Promise<PositionRecord | null> {
  const key = posKey(boardId, itemId);
  const updated = await svc.safeUpdate<PositionRecord | null>(
    key,
    (curr) => ({ ...(curr ?? { yDelta: 0, laneId: null }), ...patch }),
    /* isInstance */ true
  );
  return updated;
}

/** HIDDEN */
export async function getHidden(
  svc: MondayStorageService,
  boardId: string
): Promise<string[]> {
  const res = await svc.getInstanceItem<string[]>(hiddenKey(boardId), { versioning: true });
  return res?.data?.success && Array.isArray(res.data.value) ? res.data.value : [];
}

export async function setHidden(
  svc: MondayStorageService,
  boardId: string,
  ids: string[]
): Promise<void> {
  await svc.setInstanceItem(hiddenKey(boardId), ids, { versioning: true });
}
