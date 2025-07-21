import React, { useState, useEffect } from 'react';
import { Box, EditableHeading, Flex, Text } from '@vibe/core';
import { generateTimelineMarkers } from '../../functions/timelineUtils';
import { processTimelineData } from '../../functions/processTimelineData';
import Timeline from './Timeline';

/** BoardItem type * @typedef {Object} BoardItem
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
    scale = 'auto',
    position = 'alternate', // Default position for timeline items
    dateFormat = 'mdyy', // Default date format
    datePosition = 'angled-below', // Default date position
    shape = 'rectangle' // Default shape for timeline items
  } = settings;

  // Always use transparent background
  const backgroundColor = 'transparent';

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
    const result = processTimelineData(boardItems, settings, scale);
    
    if (result) {
      setTimelineParams(result.timelineParams);
      setTimelineItems(result.timelineItems);
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
        <Flex justify="center" width="100%" marginBottom="medium">
          <EditableHeading
            type="h3"
            value={timelineTitle}
            onChange={handleTitleChange}
            placeholder="Enter timeline title"
            style={{ textAlign: 'center' }}
          />
        </Flex>
        
        {/* Timeline component */}
        <Box 
          marginTop="medium"
          style={{
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
              boardItems={boardItems}
              dateColumn={Object.keys(settings.date || {})[0]}
              dateFormat={dateFormat}
              datePosition={datePosition}
              onItemMove={handleTimelineItemMove}
              onLabelChange={handleLabelChange}
              position={position}
              shape={shape}
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