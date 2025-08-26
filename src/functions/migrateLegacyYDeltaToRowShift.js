import { useZustandStore } from "../store/useZustand";
import { getDefaultRowFor } from "./getDefaultRowFor";
import { clamp } from "./clamp";
import {
  LANE_HEIGHT,
  OFFSET_MAX,
  MIN_ROW,
  MAX_ROW,
} from "../utils/configConstants";
import { saveItemPositionsToStorage } from "./saveItemPositionsToStorage";
import TimelineLogger from "../utils/logger";

// Call this once when items + current setting are available (e.g., Timeline mount)
export async function migrateLegacyYDeltaToRowShift({
  boardId,
  items,
  positionSetting,
  monday,
}) {
  if (
    !window.__LEGACY_YDELTA__ ||
    !window.__LEGACY_YDELTA__?.customItemYDelta
  ) {
    TimelineLogger.debug("[POS] No legacy Y-deltas to migrate");
    return;
  }

  if (!boardId) {
    TimelineLogger.error("[POS] Cannot migrate - boardId is required");
    return;
  }

  if (!items || !items.length) {
    TimelineLogger.warn("[POS] Cannot migrate - no items provided");
    return;
  }

  if (!positionSetting) {
    TimelineLogger.warn("[POS] Cannot migrate - position setting required");
    return;
  }

  // Get the monday SDK instance if not provided
  if (!monday) {
    monday = useZustandStore.getState().monday;
    if (!monday) {
      TimelineLogger.error("[POS] Cannot migrate - Monday SDK not available");
      return;
    }
  }

  TimelineLogger.info(
    "[POS] Starting migration from legacy Y-deltas to Row/Lane Shift model",
    {
      boardId,
      itemCount: items.length,
      positionSetting,
    },
  );

  try {
    const legacy = window.__LEGACY_YDELTA__;
    const map = {};
    let migratedCount = 0;

    for (const item of items) {
      const yDelta = legacy.customItemYDelta[item.id];
      if (typeof yDelta !== "number") continue;

      const baseRow = getDefaultRowFor(item, positionSetting);

      // Convert yDelta (px) to row/lane model
      const proposedYFromBase = yDelta; // interpret delta in px relative to base row
      const proposedRow = Math.round(proposedYFromBase / LANE_HEIGHT) + baseRow;

      const row = clamp(proposedRow, MIN_ROW, MAX_ROW);
      const rowShift = row - baseRow;
      const laneOffset = clamp(
        proposedYFromBase - rowShift * LANE_HEIGHT,
        -OFFSET_MAX,
        OFFSET_MAX,
      );

      map[item.id] = { rowShift, laneOffset };
      migratedCount++;
    }

    // Update the store
    useZustandStore.getState().setCustomItemYBulk(map);

    // Persist to storage
    await saveItemPositionsToStorage(boardId, map, monday);

    // Clear legacy data
    window.__LEGACY_YDELTA__ = null;

    TimelineLogger.info(
      "[POS] Successfully migrated legacy deltas to Row/Lane Shift model",
      {
        boardId,
        migratedCount,
      },
    );
  } catch (error) {
    TimelineLogger.error("[POS] Failed to migrate legacy Y-deltas", error);
  }
}
