import React from 'react';
import { Button, Search, Icon, IconButton } from '@vibe/core';

/**
 * Controls component for the Timeline Builder
 * Provides zoom and filter functionality
 */
const TimelineControls = ({ onZoomIn, onZoomOut, onFilterChange }) => {
  return (
    <div className="timeline-controls">
      <div className="timeline-controls__zoom">
      <IconButton
          icon="PlusSmall"
          onClick={onZoomIn}
        />
        <IconButton
          icon="MinusSmall"
          onClick={onZoomOut}
        />
      </div>
      
      <div className="timeline-controls__filter">
        <Search
          placeholder="Filter timeline items..."
          onChange={(value) => onFilterChange(value)}
        />
      </div>
    </div>
  );
};

export default TimelineControls;
