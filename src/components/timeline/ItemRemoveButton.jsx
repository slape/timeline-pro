import React from 'react';

/**
 * Remove button component for timeline items
 * Displays an X button when item is hovered and onHideItem is provided
 */
const ItemRemoveButton = ({ 
  isVisible, 
  onRemove, 
  itemId 
}) => {
  if (!isVisible) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '-6px',
      right: '-6px',
      width: '20px',
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1001,
      pointerEvents: 'auto',
      transform: 'translateZ(0)' // Force hardware acceleration
    }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove?.(itemId);
        }}
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: '#fff',
          border: '1px solid #ccc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          margin: 0,
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          outline: 'none',
          position: 'relative',
          zIndex: 1002
        }}
        onMouseDown={e => e.stopPropagation()}
      >
        <span style={{
          display: 'block',
          width: '12px',
          height: '12px',
          position: 'relative',
          pointerEvents: 'none'
        }}>
          <span style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '12px',
            height: '2px',
            background: '#333',
            margin: '-1px -6px',
            transform: 'rotate(45deg)'
          }} />
          <span style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '12px',
            height: '2px',
            background: '#333',
            margin: '-1px -6px',
            transform: 'rotate(-45deg)'
          }} />
        </span>
      </button>
    </div>
  );
};

export default ItemRemoveButton;
