import React, { useState, useEffect } from 'react';
import { Box, EditableHeading, Flex, Text } from '@vibe/core';
import { determineTimelineScale, generateTimelineMarkers, calculateItemPosition } from '../../functions/timelineUtils';
import { getItemsWithDates } from '../../functions/getItemsWithDates';
import Timeline from './Timeline';

/** BoardItem type
 * @typedef {Object} BoardItem
 * @property {string} id - Unique item ID
 * @property {string} name - Item name
 * @property {Object} group - Group information
 * @property {string} group.color - Color of the group
 * @property {string} group.title - Title of the group
 * @property {string} group.id - ID of the group
 * @property {Array.<{id: string, value: string}>} column_values - Array of column values (JSON strings)
 */

/** Settings type
 * @typedef {Object} AppSettings
 * @property {Object.<string, boolean>} date - Selected date column, e.g., { date_mksykvae: true }
 * @property {string} scale - Display scale, e.g., 'weeks'
 * @property {string} button - Button behavior setting
 */

/**
 * TimelineBoard component that displays a timeline visualization
 * 
 * @param {Object} props - Component props
 * @param {Array} props.boardItems - Array of board items from monday.com
 * @param {Object} props.settings - Settings for the timeline (title, colors, etc.)
 * @returns {JSX.Element} - Timeline board component
 */
const TimelineBoard = ({ boardItems = [], settings = {} }) => {
  // State for timeline title
  const [timelineTitle, setTimelineTitle] = useState('Timeline');
  
  // State for timeline items
  const [timelineItems, setTimelineItems] = useState([]);
  
  // State for timeline parameters
  const [timelineParams, setTimelineParams] = useState({
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
    scale: 'auto'
  });

  // Extract settings with defaults
  const {
    title = 'Timeline',
    backgroundColor = 'var(--primary-background-color)',
    primaryColor = 'var(--primary-color)',
    scale = 'auto'
  } = settings;

  // Handle title change
  const handleTitleChange = (newTitle) => {
    setTimelineTitle(newTitle);
    console.log('Title changed to:', newTitle);
    // Here you could update the settings or save to monday.com if needed
  };

  // Handle timeline item move
  const handleTimelineItemMove = (itemId, newPosition) => {
    console.log(`Item ${itemId} moved to position ${newPosition}`);
    
    setTimelineItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, position: newPosition } 
          : item
      )
    );
  };
  
  // Handle timeline item label change
  const handleLabelChange = (itemId, newLabel) => {
    console.log(`Item ${itemId} label changed to ${newLabel}`);
    
    setTimelineItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, label: newLabel } 
          : item
      )
    );
  };

  // Extract dates from board items and determine timeline parameters
  useEffect(() => {
    if (!boardItems || boardItems.length === 0) {
      console.log('No board items available');
      return;
    }
    try {
      // Find the date column ID (first key in the date object)
      const dateColumn = Object.keys(settings.date || {})[0];

      if (!dateColumn) {
        console.warn('No date column selected in settings');
        return;
      }
      
      // Extract dates from board items using the imported function
      const itemsWithDates = getItemsWithDates(boardItems, dateColumn);
      
      if (itemsWithDates.length === 0) {
        console.warn('No valid dates found in board items');
        return;
      }
      
      // Find min and max dates
      const dates = itemsWithDates.map(item => item.date);
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      
      // Add padding to the timeline (10% on each side)
      const timeRange = maxDate - minDate;
      const padding = timeRange * 0.1;
      
      const startDate = new Date(minDate.getTime() - padding);
      const endDate = new Date(maxDate.getTime() + padding);
      
      // Determine appropriate scale
      const timelineScale = determineTimelineScale(startDate, endDate, scale);
      
      // Update timeline parameters
      setTimelineParams({
        startDate,
        endDate,
        scale: timelineScale
      });
      
      // Create timeline items with positions
      const items = itemsWithDates.map(item => {
        // Add parsed date to the original item for use in DraggableBoardItem
        const originalItemWithDate = {
          ...item.originalItem,
          parsedDate: item.date
        };
        
        return {
          id: item.id,
          label: item.label,
          date: item.date,
          position: calculateItemPosition(item.date, startDate, endDate),
          originalItem: originalItemWithDate
        };
      });
      
      setTimelineItems(items);
      
    } catch (error) {
      console.error('Error processing timeline data:', error);
    }
  }, [boardItems, settings]);

  // Set initial title from settings
  useEffect(() => {
    if (title) {
      setTimelineTitle(title);
    }
  }, [title]);

  return (
    <Box
      padding="medium"
      rounded="medium"
      border="true"
      style={{
        height: '100%',
        backgroundColor,
        overflowX: 'auto',
        overflowY: 'hidden',
      }}
    >
        <EditableHeading
          type="h3"
          value={timelineTitle}
          onChange={handleTitleChange}
          placeholder="Enter timeline title"
        />
        
        {/* Timeline component */}
        <Box 
          marginTop="medium"
          style={{
            border: `1px solid var(--ui-border-color)`,
            borderRadius: '4px',
            backgroundColor: 'var(--secondary-background-color)',
            padding: '16px',
            minHeight: '200px',
          }}
        >
          {timelineItems.length > 0 ? (
            <Timeline 
              startDate={timelineParams.startDate}
              endDate={timelineParams.endDate}
              scale={timelineParams.scale}
              items={timelineItems}
              onItemMove={handleTimelineItemMove}
              onLabelChange={handleLabelChange}
            />
          ) : (
            <Flex 
              justify="center" 
              align="center" 
              style={{ 
                height: '100px',
                color: 'var(--secondary-text-color)'
              }}
            >
              <Text>No timeline items to display</Text>
            </Flex>
          )}
        </Box>
    </Box>
  );
};

export default TimelineBoard;