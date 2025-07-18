import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Badge, Tooltip } from '@vibe/core';

/**
 * DraggableBoardItem component that renders a draggable item from monday.com board
 * 
 * @param {Object} props - Component props
 * @param {Object} props.item - The board item data from monday.com
 * @param {string} props.item.id - Unique identifier for the item
 * @param {string} props.item.name - Name/title of the item
 * @param {Object} props.item.group - Group information for the item
 * @param {string} props.item.group.color - Color associated with the group
 * @param {Function} props.onClick - Optional click handler
 * @returns {JSX.Element} - Draggable board item component
 */
const DraggableBoardItem = ({ item, date, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `board-item-${item.id}`,
    data: item,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const itemColor = item.group?.color || 'primary';

  // Format date as needed, e.g., "Jul 18, 2025"
  const formattedDate = date 
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
    : null;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        opacity: isDragging ? 0.8 : 1,
        cursor: 'grab',
        padding: '8px 12px',
        backgroundColor: 'white',
        borderRadius: '4px',
        boxShadow: isDragging ? '0 5px 15px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '8px',
        transition: 'box-shadow 0.2s, opacity 0.2s',
        borderLeft: `4px solid var(--${itemColor}-color)`,
        userSelect: 'none',
        position: 'relative',
        maxWidth: '300px',
      }}
      onClick={onClick}
      {...listeners}
      {...attributes}
    >
      <Tooltip content={item.name}>
        <div style={{ 
          fontWeight: 'bold', 
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: '4px'
        }}>
          {item.name}
        </div>
      </Tooltip>

      {formattedDate && (
        <div style={{ fontSize: '0.85em', color: '#555', marginBottom: '4px' }}>
          {formattedDate}
        </div>
      )}

      {item.group && (
        <Badge
          text={item.group.title}
          size="small"
          kind={itemColor}
        />
      )}
    </div>
  );
};

export default DraggableBoardItem;
