import React, { useState, useEffect, useMemo } from 'react';
import TimelineControls from './TimelineControls';
import TimelineVisualization from './TimelineVisualization';
import { ThemeProvider, Flex } from "@vibe/core";

/**
 * Main TimelineBuilder component that integrates all timeline sub-components
 * Manages state and data flow between components
 */
const TimelineBuilder = ({ context, boardItems, settings }) => {
  const [timelineItems, setTimelineItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItemIds, setSelectedItemIds] = useState([]);

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
  
  // Prepare settings object with items
  const timelineSettings = useMemo(() => {
    if (!settings) return null;
    
    return {
      ...settings,
      items: filteredItems
    };
  }, [settings, filteredItems]);

  return (
    <ThemeProvider systemTheme={context?.theme}>
      <TimelineVisualization isLoading={isLoading} settings={timelineSettings} boardItems={boardItems}/>
    </ThemeProvider>
  );
};

export default TimelineBuilder;
