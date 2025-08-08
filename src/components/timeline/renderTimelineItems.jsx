import React from 'react';
import DraggableBoardItem from './DraggableBoardItem';
import { useZustandStore } from '../../store/useZustand';

/**
 * Renders timeline items as JSX elements with proper positioning
 * @param {Array} itemsWithPositions - Array of items with calculated render positions
 * @param {Function} onItemClick - Callback for item click events
 * @param {Function} onLabelChange - Callback for label change events
 * @param {Function} onRemove - Callback for removing items
 * @param {Function} onPositionChange - Callback for when an item's position changes
 * @returns {Array} Array of JSX elements for timeline items
 */
export function renderTimelineItems(
  itemsWithPositions, 
  onItemClick, 
  onLabelChange, 
  onRemove, 
  onPositionChange = () => {}
) {
  const { settings, hiddenItemIds } = useZustandStore();
  const shape = settings?.shape;
  // Support new settings key `itemDates`; fall back to legacy `showItemDates`
  const showDates = settings?.itemDates ?? settings?.showItemDates ?? true;
  
  return itemsWithPositions.map((item) => {
    // Preserve Date instances from processed data; only construct if needed
    const itemDate = item.date instanceof Date ? item.date : new Date(item.date);
    const isValidDate = (d) => d instanceof Date && !isNaN(d);
    
    // Check if this item should be hidden
    const isHidden = hiddenItemIds.has(item.id);
    
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
          onClick={() => onItemClick?.(item)}
          onLabelChange={(itemId, newLabel) => onLabelChange?.(itemId, newLabel)}
          onRemove={onRemove}
          showItemDates={showDates}
          onPositionChange={onPositionChange}
        />
      </div>
    );
  });
}
