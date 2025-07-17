import React, { useState } from 'react';
import { Text, Checkbox, ExpandCollapse,
   Dropdown, TextField, Flex, Box } from '@vibe/core';

/**
 * Controls component for the Timeline Builder
 * Provides zoom and item selection functionality as a side panel
 */
const TimelineControls = ({ items, selectedItems, onItemSelectionChange, backgroundColor, onBackgroundColorChange, timeScale, onTimeScaleChange, timelineTitle, onTitleChange }) => {
  const [isItemsExpanded, setIsItemsExpanded] = useState(false);

  // Handle checkbox changes
  const handleCheckboxChange = (itemId) => {
    if (selectedItems.includes(itemId)) {
      // Remove item if already selected
      onItemSelectionChange(selectedItems.filter(id => id !== itemId));
    } else {
      // Add item if not selected
      onItemSelectionChange([...selectedItems, itemId]);
    }
  };

  return (
    <div>
    <Box margin='small'>
    <Flex direction="column" gap={10} align="start">
    <Text>Title</Text>
    <TextField value={timelineTitle} onChange={(e) => onTitleChange(e.target.value)} />
    <Text>Time Scale</Text>
    <div />
    </Flex>
    <Dropdown
      value={timeScale}
      onChange={onTimeScaleChange}
      size='small'
      options={[
        { value: 'days', label: 'Days' },
        { value: 'weeks', label: 'Weeks' },
        { value: 'months', label: 'Months' },
        { value: 'quarters', label: 'Quarters' },
        { value: 'years', label: 'Years' }
      ]}
    />
    <div style={{ width: '250px', margin: '10px 0 10px 0' }}>
    <ExpandCollapse 
      title={<Text>Select Events</Text>}
      expanded={isItemsExpanded}
      hideBorder={false}
      defaultOpenState={true}
    >
      <div style={{ padding: '0 10px 0 10px' }}>
      <Flex direction="column" gap={4} align="start">
        {items.map(item => (
          <div key={item.id} style={{ width: '100%' }}>
          <Flex gap={4} align="start">
          <Checkbox
            checked={selectedItems.includes(item.id)}
            onChange={() => handleCheckboxChange(item.id)}
          />
          <Text>{item.name}</Text>
          </Flex>
          </div>
        ))}
        
        {items.length === 0 && (
          <Text>
            No items available
          </Text>
        )}
      </Flex>
      </div>
    </ExpandCollapse>
    </div>
    <Flex direction="column" gap={10} align="start">
      <Text>Background Color</Text>
      <Flex gap={8}>
        {['#2d2d2d', '#ffffff', '#f7e1d3', '#bfb5b2', '##00000000'].map(color => (
          <div
            key={color}
            onClick={() => onBackgroundColorChange(color)}
            style={{
              width: '24px',
              height: '24px',
              backgroundColor: color,
              borderRadius: '4px',
              cursor: 'pointer',
              border: backgroundColor === color ? '2px solid #0073ea' : '1px solid #ccc'
            }}
          />
        ))}
      </Flex>
    </Flex>
    </Box>
    </div>
  );
};

export default TimelineControls;
