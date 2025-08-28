// src/lib/fetchBoardItems.ts
import TimelineLogger from "@/lib/utils/logger";
import { FETCH_ITEMS_WITH_DATES } from "./query";
import { transformMondayItems } from "./transformItems";
import type { TimelineSettings } from "@/types/settings";
import type { MondayContextMinimal } from "@/types/monday"; // <- adjust if yours differs
import type { AppError } from "@/types/app";
import { Err } from "@/types/errors";
import { api } from "@/lib/utils/mondayClient"; // <- use the typed api wrapper

// Shape of the GraphQL `data` for FETCH_ITEMS_WITH_DATES
type ItemsQueryData = {
  items: Array<{
    id: string;
    name: string;
    board: { id: string };
    group: { id: string; title: string; color: string };
    column_values: Array<{ id: string; value: string; type?: string; text?: string }>;
  }>;
};

export async function fetchBoardItems(
  context: MondayContextMinimal | null,
  itemIds: string[],
  settings: TimelineSettings,
  onItems: (items: any[]) => void,
  setIsLoading: (v: boolean) => void,
  setError: (err: AppError | null) => void
) {
  // Guard: need boardId
  if (!context?.boardId) {
    onItems([]);
    return;
  }

  // Guard: a chosen date column must exist
  if (!settings?.dateColumn || Object.keys(settings.dateColumn).length === 0) {
    setError(Err.invalidDate("Select a date column in app settings."));
    onItems([]);
    return;
  }

  // Guard: must have visible ids
  if (!itemIds?.length) {
    setError(Err.noItems("No items are selected on this board view."));
    onItems([]);
    return;
  }

  setIsLoading(true);
  setError(null);

  try {
    // ✅ Use the centralized api() helper; variables go in the 2nd arg
    const resp = await api<ItemsQueryData>(FETCH_ITEMS_WITH_DATES, { ids: itemIds });
    const items = resp?.data?.items ?? [];

    const mapped = transformMondayItems(items, settings);

    if (!mapped.length) {
      // items returned but none had a valid date under the active date column
      setError(Err.invalidDate("No valid dates found in the selected date column."));
      onItems([]);
    } else {
      setError(null);
      onItems(mapped);
    }
  } catch (e) {
    TimelineLogger.error("fetchBoardItems.failed", e);
    setError(Err.loadFailed?.("Failed to fetch board items") ?? Err.invalidDate("Failed to fetch board items"));
    onItems([]);
  } finally {
    setIsLoading(false);
  }
}
