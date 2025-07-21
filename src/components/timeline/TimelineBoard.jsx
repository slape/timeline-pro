import React, { useState, useEffect } from 'react';
import { Box, EditableHeading, Flex, Text } from '@vibe/core';
import { processTimelineData } from '../../functions/processTimelineData';
import Timeline from './Timeline';
import GroupLegend from './GroupLegend';
import ScaleMarkers from './ScaleMarkers';

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
  // State for timeline items
  const [timelineItems, setTimelineItems] = useState([]);
  const [titleSetting, setTitleSetting] = useState(settings.title !== undefined ? settings.title : true);
  const [showLedger, setShowLedger] = useState(settings.ledger !== undefined ? settings.ledger : true);
  // State for timeline parameters
  const [timelineParams, setTimelineParams] = useState({
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
    scale: 'auto'
  });

  // Sync settings with local state
  useEffect(() => {
    // Sync title setting
    if (settings.title !== undefined) {
      setTitleSetting(settings.title);
    } else {
      setTitleSetting(true); // Default to true if not specified
    }
    
    // Sync ledger setting
    if (settings.ledger !== undefined) {
      setShowLedger(settings.ledger);
    } else {
      setShowLedger(true); // Default to true if not specified
    }
  }, [settings.title, settings.ledger]);

  // Destructure settings with defaults
  const {
    title = titleSetting, // Use the state value as default
    scale = 'auto',
    position = 'alternate', // Default position for timeline items
    dateFormat = 'mdyy', // Default date format
    datePosition = 'angled-below', // Default date position
    shape = 'rectangle' // Default shape for timeline items
  } = settings;

  // Always use transparent background
  const backgroundColor = 'transparent';

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

  return (
    <Box
      padding="medium"
      rounded="medium"
      border="true"
      style={{
        width: '100%',
        height: '100%',
        padding: '20px',
        overflowX: 'auto',
        overflowY: 'hidden',
      }}
    >
      {/* Timeline Title */}
      {titleSetting && (
        <Flex justify="center" width="100%" marginBottom="medium">
          <EditableHeading
            type="h3"
            value={settings.titleText || 'Timeline Title'}
            style={{ textAlign: 'center' }}
          />
        </Flex>
      )}
      
      {/* Scale Markers */}
      <Box marginLeft="10%" marginRight="10%" marginBottom={4}>
        <ScaleMarkers 
          startDate={timelineParams.startDate}
          endDate={timelineParams.endDate}
          scale={settings.scale || 'weeks'}
          position="below"
        />
      </Box>

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
        {/* Group Legend - only show if ledger setting is true */}
        {showLedger && <GroupLegend boardItems={boardItems} />}
    </Box>
  );
};

export default TimelineBoard;