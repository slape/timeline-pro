import React from 'react';
import DraggableBoardItem from './DraggableBoardItem';

/**
 * Renders timeline items as JSX elements with proper positioning
 * @param {Array} itemsWithPositions - Array of items with calculated render positions
 * @param {Function} onItemClick - Callback for item click events
 * @param {Function} onLabelChange - Callback for label change events
 * @returns {Array} Array of JSX elements for timeline items
 */
export function renderTimelineItems(itemsWithPositions, onItemClick, onLabelChange) {
  return itemsWithPositions.map((item, index) => {
    const itemDate = new Date(item.date);
    
    return (
      <div
        key={item.id}
        style={{
          position: 'absolute',
          left: `${item.renderPosition.x}%`,
          top: `calc(50% + ${item.renderPosition.y}px)`,
          transform: 'translateX(-50%)',
          zIndex: item.renderPosition.zIndex,
        }}
      >
        <DraggableBoardItem
          item={item}
          date={itemDate}
          onClick={() => onItemClick?.(item)}
          onLabelChange={(itemId, newLabel) => onLabelChange?.(itemId, newLabel)}
        />
      </div>
    );
  });
}
