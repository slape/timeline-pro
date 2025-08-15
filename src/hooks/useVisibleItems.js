import { useMemo } from "react";
import { useZustandStore } from "../store/useZustand";
import TimelineLogger from "../utils/logger";

/**
 * Custom hook that returns visible items (boardItems filtered by hiddenItemIds)
 * This automatically updates when boardItems or hiddenItemIds change
 * @returns {Array} Array of visible board items
 */
export const useVisibleItems = () => {
  const hiddenItemIds = useZustandStore((state) => state.hiddenItemIds);
  const boardItems = useZustandStore((state) => state.boardItems);

  return useMemo(() => {
    if (!boardItems || !Array.isArray(boardItems)) {
      TimelineLogger.debug("🔍 useVisibleItems: No board items", {
        boardItems,
      });
      return [];
    }
    if (!hiddenItemIds || !Array.isArray(hiddenItemIds)) {
      TimelineLogger.debug(
        "🔍 useVisibleItems: No hidden items, returning all board items",
        {
          boardItemsCount: boardItems.length,
        },
      );
      return boardItems;
    }

    const visibleItems = boardItems.filter(
      (item) => !hiddenItemIds.includes(item.id),
    );

    TimelineLogger.debug("🔍 useVisibleItems: Filtered items", {
      totalBoardItems: boardItems.length,
      hiddenItemIds,
      hiddenItemsCount: hiddenItemIds.length,
      visibleItemsCount: visibleItems.length,
      filteredOutCount: boardItems.length - visibleItems.length,
    });

    return visibleItems;
  }, [boardItems, hiddenItemIds]);
};
