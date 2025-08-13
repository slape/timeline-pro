import React from 'react';

/**
 * Resize handle component for timeline items
 * Invisible handle positioned at bottom-right corner for resizing
 */
const ItemResizeHandle = ({ onMouseDown }) => {
  return (
    <div 
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: '16px',
        height: '16px',
        cursor: 'nwse-resize',
        zIndex: 1001,
        pointerEvents: 'auto',
        background: 'transparent',
        opacity: 0
      }}
    />
  );
};

export default ItemResizeHandle;
