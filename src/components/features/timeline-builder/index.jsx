import React, { useState, useEffect } from 'react';
import TimelineControls from './TimelineControls';
import TimelineVisualization from './TimelineVisualization';
import { ThemeProvider } from "@vibe/core";

/**
 * Main TimelineBuilder component that integrates all timeline sub-components
 * Manages state and data flow between components
 */
const TimelineBuilder = ({ context, boardItems = [] }) => {
  const [timelineItems, setTimelineItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [backgroundColor, setBackgroundColor] = useState('#2d2d2d');
  const [timeScale, setTimeScale] = useState('weeks'); // 'days', 'weeks', 'months', 'quarters', 'years'
  const [timelineTitle, setTimelineTitle] = useState('Event Timeline'); // Default title

  // Process board items into timeline items when they change
  useEffect(() => {
    if (!boardItems || boardItems.length === 0) {
      // If no board items are available yet,
      // show empty state with message that no items are available
      // with a 'task' and 'date' column
      const emptyState = [
        {
          id: 'empty',
          name: 'No items available',
          startDate: 'N/A',
          endDate: 'N/A',
          status: 'N/A',
          description: 'No items available',
          assignee: 'N/A'
        }
      ];
      setTimelineItems(emptyState);
      setFilteredItems(emptyState);
    } else {
      // Transform monday.com board items into timeline items
      const transformedItems = boardItems.map(item => {
        return {
          id: item.id,
          name: item.name,
          dueDate: item.due_date
        };
      });

      setTimelineItems(transformedItems);
      setFilteredItems(transformedItems);
      
      // Initially select all items
      setSelectedItemIds(transformedItems.map(item => item.id));
    }
    
    setIsLoading(false);
  }, [boardItems]);

  // Filter items based on selected IDs
  useEffect(() => {
    if (!timelineItems.length) return;
    
    const filtered = selectedItemIds.length > 0
      ? timelineItems.filter(item => selectedItemIds.includes(item.id))
      : timelineItems;
    
    setFilteredItems(filtered);
  }, [selectedItemIds, timelineItems]);

  // Handle item selection
  const handleItemSelect = (item) => {
    setSelectedItem(item);
  };

  // Handle item selection change from dropdown
  const handleItemSelectionChange = (selectedValues) => {
    setSelectedItemIds(selectedValues || []);
  };

  // Handle background color change
  const handleBackgroundColorChange = (color) => {
    setBackgroundColor(color);
  };

  // Handle time scale change
  const handleTimeScaleChange = (scale) => {
    setTimeScale(scale);
  };

  // Handle title change
  const handleTitleChange = (newTitle) => {
    setTimelineTitle(newTitle);
  };

  return (
    <ThemeProvider systemTheme={context?.theme}>
    <div style={{
      display: 'flex',
      margin: '16px',
    }}>
      <div style={{
        flex: 1,
      }}>
        <TimelineVisualization 
          items={filteredItems}
          isLoading={isLoading}
          onItemSelect={handleItemSelect}
          backgroundColor={backgroundColor}
          timeScale={timeScale}
          timelineTitle={timelineTitle}
        />
      </div>
      
      <div className="timeline-builder__controls">
        <TimelineControls 
          items={timelineItems}
          selectedItems={selectedItemIds}
          onItemSelectionChange={handleItemSelectionChange}
          backgroundColor={backgroundColor}
          onBackgroundColorChange={handleBackgroundColorChange}
          timeScale={timeScale}
          onTimeScaleChange={handleTimeScaleChange}
          timelineTitle={timelineTitle}
          onTitleChange={handleTitleChange}
        />
      </div>
    </div>
    </ThemeProvider>
  );
};

export default TimelineBuilder;
