import React, { useState, useEffect } from 'react';
import { Box, EditableHeading, Flex, Text } from '@vibe/core';
import { processTimelineData } from '../../functions/processTimelineData';
import Timeline from './Timeline';
import GroupLegend from './GroupLegend';
import TimelineLogger from '../../utils/logger';

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
  // State to track hidden items
  const [hiddenItemIds, setHiddenItemIds] = useState(new Set());
  const [titleSetting, setTitleSetting] = useState(settings.title !== undefined ? settings.title : true);
  const [showLedger, setShowLedger] = useState(settings.ledger !== undefined ? settings.ledger : true);
  const [showItemDates, setShowItemDates] = useState(settings.itemDates !== undefined ? settings.itemDates : false);
  // State for timeline parameters
  const [timelineParams, setTimelineParams] = useState({
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
    scale: 'auto'
  });

  // Sync settings with local state
  useEffect(() => {
    TimelineLogger.debug('TimelineBoard: Syncing settings', {
      title: settings.title,
      ledger: settings.ledger,
      itemDates: settings.itemDates
    });
    
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
    
    // Sync itemDates setting
    if (settings.itemDates !== undefined) {
      setShowItemDates(settings.itemDates);
    } else {
      setShowItemDates(false); // Default to false if not specified
    }
  }, [settings.title, settings.ledger, settings.itemDates]);

  // Destructure settings with defaults
  const {
    scale = 'weeks',
    position = 'above', // Default position for timeline items
    dateFormat = 'mdyy', // Default date format
    datePosition = 'angled-below', // Default date position
    shape = 'circle',
    title = true,
    ledger = true,
    itemDates = false,
  } = settings;

  // Always use transparent background
  const backgroundColor = 'transparent';

  // Handle timeline item move
  const handleTimelineItemMove = (itemId, newPosition) => {
    TimelineLogger.userAction('timelineItemMoved', { itemId, newPosition });
    
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
    TimelineLogger.userAction('timelineItemLabelChanged', { itemId, newLabel });
    
    setTimelineItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, label: newLabel } 
          : item
      )
    );
  };
  
  // Handle item hide/removal
  const handleHideItem = (itemId) => {
    TimelineLogger.userAction('timelineItemHidden', { itemId });
    setHiddenItemIds(prev => new Set([...prev, itemId]));
  };

  // Extract dates from board items and determine timeline parameters
  useEffect(() => {
    TimelineLogger.debug('TimelineBoard: Processing timeline data', {
      boardItemCount: boardItems?.length || 0,
      hasSettings: !!settings,
      scale
    });
    
    const startTime = Date.now();
    const result = processTimelineData(boardItems, settings, scale);
    
    if (result) {
      const duration = Date.now() - startTime;
      TimelineLogger.performance('processTimelineData', duration, {
        itemCount: result.timelineItems?.length || 0,
        startDate: result.timelineParams?.startDate?.toISOString(),
        endDate: result.timelineParams?.endDate?.toISOString()
      });
      
      setTimelineParams(result.timelineParams);
      setTimelineItems(result.timelineItems);
    } else {
      TimelineLogger.warn('processTimelineData returned no result', {
        boardItemCount: boardItems?.length || 0,
        hasSettings: !!settings
      });
    }
  }, [boardItems, settings]);

  return (
    <Box
      className="timeline-board"
      padding="medium"
      rounded="medium"
      border="true"
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
      
      {/* Timeline container */}
      <Box 
        style={{
          marginTop: settings.title ? '10px' : '0',
          minHeight: '200px'
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
            onHideItem={handleHideItem}
            hiddenItemIds={hiddenItemIds}
            position={position}
            shape={shape}
            showItemDates={showItemDates}
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
            <Text>No date column selected. Check the 'Date Field to Display' setting.</Text>
          </Flex>
        )}
      </Box>
      {/* Group Legend - only show if ledger setting is true */}
      {showLedger && <GroupLegend boardItems={boardItems} hiddenItemIds={hiddenItemIds} />}
    </Box>
  );
};

export default TimelineBoard;