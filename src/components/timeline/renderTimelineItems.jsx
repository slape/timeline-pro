import React from 'react';
import DraggableBoardItem from './DraggableBoardItem';
import { useZustandStore } from '../../store/useZustand';

/**
 * Renders timeline items as JSX elements with proper positioning
 * @param {Array} itemsWithPositions - Array of items with calculated render positions
 * @param {Function} onLabelChange - Callback for label change events
 * @param {Function} onHideItem - Callback for removing items
 * @param {Function} onPositionChange - Callback for when an item's position changes
 * @returns {Array} Array of JSX elements for timeline items
 */
export function renderTimelineItems(
  itemsWithPositions, 
  onLabelChange, 
  onHideItem, 
  onPositionChange = () => {}
) {
  const { settings, hiddenItemIds } = useZustandStore();
  const shape = settings?.shape;
  // Support new settings key `itemDates`; fall back to legacy `showItemDates`
  const showDates = settings?.itemDates ?? settings?.showItemDates ?? true;
  
  // Debug logging to track hidden items
  console.log('renderTimelineItems - hiddenItemIds:', hiddenItemIds);
  console.log('renderTimelineItems - itemsWithPositions count:', itemsWithPositions?.length);
  
  return itemsWithPositions.map((item) => {
    // Support either `parsedDate` (new) or `date` (legacy)
    const raw = item.parsedDate ?? item.date;
    // Preserve Date instances from processed data; only construct if needed
    const itemDate = raw instanceof Date ? raw : (raw ? new Date(raw) : null);
    const isValidDate = (d) => d instanceof Date && !isNaN(d);
    
    // Check if this item should be hidden
    const isHidden = hiddenItemIds?.includes(item.id);
    
    console.log(`Item ${item.id}: isHidden=${isHidden}, hiddenItemIds includes:`, hiddenItemIds?.includes(item.id));
    
    return (
      <div
        key={item.id}
        id={`board-item-${item.id}`}
        style={{
          position: 'absolute',
          left: `${item.renderPosition.x}%`,
          top: `calc(50% + ${item.renderPosition.y}px)`,
          zIndex: item.renderPosition.zIndex,
          display: isHidden ? 'none' : 'block', // Hide the item if it's in hiddenItemIds
          transform: 'translateX(-50%)', // Center the item on its position
          textAlign: 'center' // Center content within item
        }}
      >
        <DraggableBoardItem
          item={item}
          date={isValidDate(itemDate) ? itemDate : null}
          shape={shape}

          onLabelChange={(itemId, newLabel) => onLabelChange?.(itemId, newLabel)}
          onHideItem={onHideItem}
          showItemDates={showDates}
          onPositionChange={onPositionChange}
        />
      </div>
    );
  });
}
