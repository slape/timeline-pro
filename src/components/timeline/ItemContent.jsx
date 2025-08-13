import React from 'react';
import { EditableText, Text } from '@vibe/core';

/**
 * Content component for timeline items
 * Handles item name editing and date display/editing
 */
const ItemContent = ({
  item,
  showItemDates,
  formattedDate,
  handleNameChange,
  handleMouseDown,
  handleOpenDatePicker
}) => {
  return (
    <div 
      className="text-center"
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative',
        zIndex: 1,
        userSelect: 'none' // Prevent text selection during drag
      }}
      onMouseDown={handleMouseDown}
    >
      <div style={{
        width: '100%',
        fontSize: '0.75em',
        fontWeight: '500',
        wordBreak: 'break-word',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical'
      }}>
        <EditableText
          value={item?.originalItem?.name}
          onChange={handleNameChange}
          style={{
            width: '100%',
            textAlign: 'center',
            display: 'inline-block'
          }}
          multiline
        />
      </div>
      
      {showItemDates && (
        <div style={{
          width: '100%',
          marginTop: '4px',
          textAlign: 'center',
          fontSize: '0.7em',
          lineHeight: '1.1',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          padding: '0 2px'
        }}>
          <Text
            element="div"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDatePicker();
            }}
            style={{
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: '3px',
              transition: 'background-color 0.2s',
              fontSize: 'inherit',
              lineHeight: 'inherit'
            }}
            onMouseDown={e => e.stopPropagation()}
          >
            {formattedDate || 'Click to set date'}
          </Text>
        </div>
      )}
    </div>
  );
};

export default ItemContent;
