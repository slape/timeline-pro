import React from 'react';
import DraggableBoardItem from './DraggableBoardItem';

/**
 * Renders timeline items as JSX elements with proper positioning
 * @param {Array} itemsWithPositions - Array of items with calculated render positions
 * @param {Function} onItemClick - Callback for item click events
 * @param {Function} onLabelChange - Callback for label change events
 * @param {Function} onRemove - Callback for removing items
 * @param {string} shape - Shape of timeline items ('rectangle', 'circle')
 * @param {Set} hiddenItemIds - Set of item IDs that should be hidden from view
 * @returns {Array} Array of JSX elements for timeline items
 */
export function renderTimelineItems(itemsWithPositions, onItemClick, onLabelChange, onRemove, shape = 'rectangle', hiddenItemIds = new Set()) {
  return itemsWithPositions.map((item, index) => {
    const itemDate = new Date(item.date);
    
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
          date={itemDate}
          shape={shape}
          onClick={() => onItemClick?.(item)}
          onLabelChange={(itemId, newLabel) => onLabelChange?.(itemId, newLabel)}
          onRemove={onRemove}
        />
      </div>
    );
  });
}
