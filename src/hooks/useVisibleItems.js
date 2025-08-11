import { useMemo } from 'react';
import { useZustandStore } from '../store/useZustand';

/**
 * Custom hook that returns visible items (boardItems filtered by hiddenItemIds)
 * This automatically updates when boardItems or hiddenItemIds change
 * @returns {Array} Array of visible board items
 */
export const useVisibleItems = () => {
  const hiddenItemIds = useZustandStore(state => state.hiddenItemIds);
  const boardItems = useZustandStore(state => state.boardItems);

  return useMemo(() => {
    if (!boardItems || !Array.isArray(boardItems)) return [];
    if (!hiddenItemIds || !Array.isArray(hiddenItemIds)) return boardItems;
    
    return boardItems.filter(item => !hiddenItemIds.includes(item.id));
  }, [boardItems, hiddenItemIds]);
};
