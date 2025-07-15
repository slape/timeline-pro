import React from 'react';
import { Loader, EmptyState } from '@vibe/core';

/**
 * Main visualization component for the Timeline Builder
 * Displays timeline items in a chronological format
 */
const TimelineVisualization = ({ items, isLoading, zoomLevel, onItemSelect }) => {
  if (isLoading) {
    return (
      <div className="timeline-visualization timeline-visualization--loading">
        <Loader size="large" />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="timeline-visualization timeline-visualization--empty">
        <EmptyState 
          title="No timeline items to display"
          description="Add items to your board to see them on the timeline"
          visual="timeline"
        />
      </div>
    );
  }

  return (
    <div className="timeline-visualization">
      {/* Timeline header with dates */}
      <div className="timeline-visualization__header">
        {/* Date markers will be dynamically generated based on zoom level */}
      </div>

      {/* Timeline items */}
      <div className="timeline-visualization__items">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="timeline-item"
            onClick={() => onItemSelect(item)}
            style={{
              // Position and width will be calculated based on dates and zoom level
            }}
          >
            <div className="timeline-item__content">
              <span className="timeline-item__title">{item.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineVisualization;
