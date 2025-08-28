// src/lib/fetchBoardItems.ts
import mondaySdk from "monday-sdk-js";
import TimelineLogger from "../utils/logger";
import { FETCH_ITEMS_WITH_DATES } from "./query";
import { transformMondayItems } from "./transformItems";
import { TimelineSettings } from "../../types/settings";
import type { MondayContextMinimal } from "../../types/monday_storage";
import { Err } from "../../types/errors";

const monday = mondaySdk();

export async function fetchBoardItems(
  context: MondayContextMinimal | null,
  itemIds: string[],
  settings: TimelineSettings,
  onItems: (items: any[]) => void,
  setIsLoading: (v: boolean) => void,
  setError: (err: import("../../types/app").AppError | null) => void
) {
  if (!context?.boardId) { onItems([]); return; }

  // If no date columns configured, that’s an invalid config
  if (!settings?.dateColumn || Object.keys(settings.dateColumn).length === 0) {
    setError(Err.invalidDate());
    onItems([]);
    return;
  }

  if (!itemIds?.length) {
    setError(Err.noItems());
    onItems([]);
    return;
  }

  setIsLoading(true);
  setError(null);

 try {
    const resp = await monday.api(FETCH_ITEMS_WITH_DATES, { variables: { ids: itemIds } });
    const items = resp?.data?.items ?? [];
    const mapped = transformMondayItems(items, settings);

    if (!mapped.length) {
      // items returned but none had a valid value in the active date column
      setError(Err.invalidDate("No valid dates found in the selected date column."));
      onItems([]);
    } else {
      setError(null);
      onItems(mapped);
    }
  } catch (e) {
    TimelineLogger.error("fetchBoardItems.failed", e);
    // optional: add a dedicated loadFailed type to AppError/Err; or reuse invalidDate if you must
    setError(Err.loadFailed("Failed to fetch board items") ?? Err.invalidDate("Failed to fetch board items"));
    onItems([]);
  } finally {
    setIsLoading(false);
  }
}
