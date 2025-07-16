import React, { useState } from 'react';
import { Button, Text, Divider, Checkbox, ExpandCollapse, Icon, ColorPicker, Dropdown } from '@vibe/core';

/**
 * Controls component for the Timeline Builder
 * Provides zoom and item selection functionality as a side panel
 */
const TimelineControls = ({ items, selectedItems, onItemSelectionChange, backgroundColor, onBackgroundColorChange, timeScale, onTimeScaleChange, isDarkMode = true }) => {
  const [isItemsExpanded, setIsItemsExpanded] = useState(true);

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

  // Use browser dark mode preference for text color
  const textColor = isDarkMode ? 'white' : '#333333';
  const secondaryTextColor = isDarkMode ? '#aaaaaa' : '#666666';

  return (
    <div className="timeline-controls" style={{
      height: '100%',
      padding: '10px',
      width: '200px',
      display: 'flex',
      flexDirection: 'column',
      color: textColor
    }}>
      <Text style={{ color: textColor }}>
        Event Timeline Controls
      </Text>
      
      <Divider />
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onClick={() => setIsItemsExpanded(!isItemsExpanded)}
        >
          <Icon
            iconName={isItemsExpanded ? "ChevronUp" : "ChevronDown"}
            iconSize={16}
          />
        </div>
        
        <ExpandCollapse
          title={<Text style={{ color: textColor }}>Select Events</Text>}
          expanded={isItemsExpanded}
          hideBorder={true}
          defaultOpenState={true}
        >
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px',
            maxHeight: '300px',
            overflow: 'auto',
            padding: '8px'
          }}>
            
            {items.map(item => (
              <Checkbox
                key={item.id}
                checked={selectedItems.includes(item.id)}
                onChange={() => handleCheckboxChange(item.id)}
                label={<Text style={{ color: textColor }}>{item.name}</Text>}
              />
            ))}
            
            {items.length === 0 && (
              <Text type="text3" style={{ color: secondaryTextColor, textAlign: 'center', padding: '16px 0' }}>
                No items available
              </Text>
            )}
          </div>
        </ExpandCollapse>
      </div>
      
      <Divider />
      
      <div>
        <Text style={{ color: textColor }}>
          Time Scale
        </Text>
        <div style={{ marginTop: '8px' }}>
          <Dropdown
            className="time-scale-dropdown"
            value={timeScale}
            onChange={onTimeScaleChange}
            options={[
              { value: 'days', label: 'Days' },
              { value: 'weeks', label: 'Weeks' },
              { value: 'months', label: 'Months' },
              { value: 'quarters', label: 'Quarters' },
              { value: 'years', label: 'Years' }
            ]}
            placeholder="Select time scale"
          />
        </div>
      </div>
      
      <Divider />
      
      <div>
        <Text style={{ color: textColor }}>
          Background Color
        </Text>
        <div style={{ marginTop: '8px' }}>
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginTop: '8px',
            flexWrap: 'wrap'
          }}>
            {['#2d2d2d', '#ffffff', '#0073ea', '#292f4c', '#401694'].map(color => (
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
