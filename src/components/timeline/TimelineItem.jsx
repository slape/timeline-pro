import React from 'react';
import DraggableBoardItem from './DraggableBoardItem';

/**
 * TimelineItem component for individual points on the timeline
 */
const TimelineItem = ({ id, label, position, onLabelChange, originalItem, itemPosition = 'below' }) => {
  // Base style for the timeline item
  const style = {
    position: 'absolute',
    left: `${position}%`,
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 1,
  };
  
  // Adjust vertical position based on itemPosition
  if (itemPosition === 'above') {
    style.top = 'calc(50% - 60px)'; // Position further above the timeline
    style.flexDirection = 'column-reverse'; // Reverse the flex direction for above items
  } else {
    style.top = 'calc(50% + 10px)'; // Position further below the timeline
  }

  // If we have no original item, render a simple dot
  if (!originalItem) {
    return (
      <div style={style}>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-color)',
            marginBottom: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}
        />
      </div>
    );
  }


  // Calculate position for the board item card
  const cardStyle = {
    position: 'relative',
    transform: 'translateX(-50%)',
    zIndex: 1,
    width: '200px', // Set a fixed width for the card
    margin: itemPosition === 'above' ? '0 0 30px 0' : '30px 0 0 0', // Add margin based on position
  };

  return (
    <div style={style}>
      {/* The dot on the timeline */}
      <div 
        style={{
          position: 'absolute',
          left: '50%',
          top: itemPosition === 'above' ? 'calc(100% + 30px)' : 'calc(0% - 30px)',
          transform: 'translate(-50%, -50%)',
        }}
      >
      </div>
      
      {/* The board item card
      <div style={cardStyle}>
        <DraggableBoardItem 
          item={originalItem.originalItem} 
          date={originalItem.originalItem.parsedDate || new Date()} 
        />
      </div> */}
    </div>
  );
};

export default TimelineItem;
