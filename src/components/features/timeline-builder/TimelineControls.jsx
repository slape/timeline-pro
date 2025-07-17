import React, { useState } from 'react';
import { Text, Divider, Checkbox, ExpandCollapse, Icon, Accordion, AccordionItem, Dropdown, TextField, Flex } from '@vibe/core';

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
    <div style={{
      height: '100%',
      padding: '10px',
      width: '200px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div>
        <Text style={{ marginBottom: '4px' }}>
          Title
        </Text>
        <div style={{ 
          padding: '8px',
          borderRadius: '4px'
        }}>
          <TextField
            value={timelineTitle}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>
      </div>
      <Divider />
      <ExpandCollapse
          title={<Text>Select Events</Text>}
          expanded={isItemsExpanded}
          hideBorder={true}
          defaultOpenState={false}
        >
          <Flex direction="column" gap={4} align="start" width="190px">
            {items.map(item => (
              <Checkbox
                key={item.id}
                checked={selectedItems.includes(item.id)}
                onChange={() => handleCheckboxChange(item.id)}
                label={item.name}
              />
            ))}
            
            {items.length === 0 && (
              <Text>
                No items available
              </Text>
            )}
          </Flex>
        </ExpandCollapse>
      
      <Divider />
      <Text style={{ marginBottom: '4px' }}>
          Time Scale
        </Text>
      <div>
        <div style={{ marginTop: '8px' }}>
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
        </div>
      </div>
      
      <Divider />
      
      <div>
        <Text>Background Color</Text>
        <div style={{ marginTop: '8px' }}>
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginTop: '8px',
            flexWrap: 'wrap'
          }}>
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
          </div>
        </div>
      </div>
    </div>
    
  );
};

export default TimelineControls;
