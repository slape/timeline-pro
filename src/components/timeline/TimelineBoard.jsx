import React, { useEffect, useState } from 'react';
import { Box, EditableHeading, Flex, Text } from '@vibe/core';
import { processTimelineData } from '../../functions/processTimelineData';
import Timeline from './Timeline';
import GroupLegend from './GroupLegend';
import TimelineLogger from '../../utils/logger';
import isEqual from 'lodash.isequal';
import { useZustandStore } from '../../store/useZustand';
import { handleTimelineItemMove, handleLabelChange, handleHideItem } from '../../functions/timelineHandlers';

/** BoardItem type * @typedef {Object} BoardItem
 * @property {string} id - Unique item ID
 * @property {string} name - Item name
 * @property {Object} group - Group information
 * @property {string} group.color - Color of the group
 * @property {string} group.title - Title of the group
 * @property {string} group.id - ID of the group
 * @property {Array.<{id: string, value: string}>} column_values - Array of column values (JSON strings)
 */

const TimelineBoard = () => {
  const hiddenItemIds = useZustandStore(state => state.hiddenItemIds);
  const boardItems = useZustandStore(state => state.boardItems);
  const settings = useZustandStore(state => state.settings);
  const timelineItems = useZustandStore(state => state.timelineItems);
  const timelineParams = useZustandStore(state => state.timelineParams);
  const { setHiddenItemIds, setTimelineItems, setTimelineParams } = useZustandStore();
  const onTimelineItemMove = handleTimelineItemMove(setTimelineItems, TimelineLogger);
  const onLabelChange = handleLabelChange(setTimelineItems, TimelineLogger);
  const onHideItem = handleHideItem(setHiddenItemIds, TimelineLogger);
  const [visibleBoardItems, setVisibleBoardItems] = useState([]);
  
  useEffect(() => {
    //TimelineLogger.debug('visibleBoardItems effect', { boardItems, hiddenItemIds });
    if (!boardItems) return;
    const visible = boardItems.filter(item => !hiddenItemIds.has(item.id));
    //TimelineLogger.debug('visibleBoardItems computed', { visible });
    setVisibleBoardItems(prev => (!isEqual(prev, visible) ? visible : prev));
  }, [boardItems, hiddenItemIds]);

  useEffect(() => {
    const dateColumnId = settings && typeof settings.dateColumn === 'object'
      ? Object.keys(settings.dateColumn)[0]
      : settings?.dateColumn;

    if (
      visibleBoardItems &&
      visibleBoardItems.length > 0 &&
      settings &&
      dateColumnId
    ) {
      
      TimelineLogger.debug('TimelineBoard: Processing timeline data', {
        boardItemCount: boardItems.length,
        hasSettings: !!settings,
        scale: settings.scale,
        dateColumn: dateColumnId,
      });
      
      const startTime = Date.now();
      const result = processTimelineData(boardItems, settings, dateColumnId);
      if (result) {
        const duration = Date.now() - startTime;
        TimelineLogger.performance('processTimelineData', duration, {
          itemCount: result.timelineItems?.length || 0,
          startDate: result.timelineParams?.startDate,
          endDate: result.timelineParams?.endDate,
        });
        //TimelineLogger.debug('processTimelineData result', result);
        if (result && result.timelineParams && result.timelineItems) {
          
          TimelineLogger.debug('Setting timelineItems', result.timelineItems);
          if (!isEqual(timelineItems, result.timelineItems)) {
            setTimelineItems(result.timelineItems);
          }
          
          if (!isEqual(timelineParams, result.timelineParams)) {
            setTimelineParams(result.timelineParams);
          }
        }
      } else {
        TimelineLogger.warn('processTimelineData returned no result', {
          boardItemCount: boardItems.length,
          hasSettings: !!settings
        });
      }
    }
  }, [visibleBoardItems, settings]);

  return (
    <Box
      className="timeline-board"
      padding="medium"
      rounded="medium"
      border="true"
    > 
      {/* Timeline Title */}


      {settings.title && (
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
        

        {timelineItems?.length > 0 ? (
          <Timeline 
            onItemMove={onTimelineItemMove}
            onHideItem={onHideItem}
            onLabelChange={onLabelChange}
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
      
      {settings.ledger && <GroupLegend />}
    </Box>
  );
};

export default TimelineBoard;