import React from "react";
import { useState, useEffect, useRef } from "react";
import mondaySdk from "monday-sdk-js";
import "@vibe/core/tokens";
import TimelineBoard from './components/timeline/TimelineBoard';
import { Box, ThemeProvider, Flex } from "@vibe/core";
import fetchBoardItems from './functions/fetchBoardItems';
import ExportButton from './components/export/ExportButton';
import HiddenItemsManager from './components/HiddenItemsManager';
import TimelineLogger from './utils/logger';
import Loading from './components/common/Loading';
import { useZustandStore } from './store/useZustand';
import IsViewOnly from './components/errors/IsViewOnly';
import TooManyItems from './components/errors/TooManyItems';

// Usage of mondaySDK example, for more information visit here: https://developer.monday.com/apps/docs/introduction-to-the-sdk/
const monday = mondaySdk();

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

/** ColumnValue type
 * @typedef {Object} ColumnValue
 * @property {string} id - ID of the column value
 * @property {string} value - Value of the column value
 */

/** Settings type
 * @typedef {Object} AppSettings
 * @property {string} title_text - Title text setting
 * @property {boolean} showTitle - Show item labels setting
 * @property {Object.<string, boolean>} date - Selected date column, e.g., { date_mksykvae: true }
 * @property {string} dateFormat - Date text setting
 * @property {string} datePosition - Date position setting
 * @property {string} scale - Display scale, e.g., 'weeks'
 * @property {string} itemPosition - Item position setting
 * @property {string} shape - Item Shape setting
 * @property {boolean} showLedger - Show ledger setting
 * @property {boolean} showDates - Show item dates setting
 */

/** context type 
 * @typedef {Object} AppContext
 * @property {int} boardId - ID of the current board
 * @property {Object.<string, boolean>} user - User information
 * @property {string} boardName - Name of the board
 * @property {string} theme - Theme of the board
 */

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setContext, setSettings, setBoardItems, setItemIds, initializeMondayStorage } = useZustandStore();
  const { context, itemIds, settings, boardItems, hiddenItemsLoaded, hiddenItemIds } = useZustandStore();
  
  // Debug logging for loading states
  React.useEffect(() => {
    TimelineLogger.debug('🔍 App render state check', {
      hasContext: !!context,
      hasBoardItems: !!boardItems,
      hasSettings: !!settings,
      isLoading,
      hiddenItemsLoaded,
      hiddenItemsCount: hiddenItemIds?.length || 0,
      boardItemsCount: boardItems?.length || 0,
      itemIdsCount: itemIds?.length || 0
    });
  }, [context, boardItems, settings, isLoading, hiddenItemsLoaded, hiddenItemIds, itemIds]);

  // Track previous IDs to avoid unnecessary refetching (some SDKs re-emit same values)
  const prevBoardIdRef = useRef();
  const prevItemIdsRef = useRef();

  const arraysEqual = (a, b) => {
    if (a === b) return true;
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  };

  // Set up context listener
  useEffect(() => {
    TimelineLogger.info('Setting up monday.com context listeners');
    
    // Initialize Monday storage service for hidden items persistence
    initializeMondayStorage(monday);
    
    // Notice this method notifies the monday platform that user gains a first value in an app.
    // Read more about it here: https://developer.monday.com/apps/docs/mondayexecute#value-created-for-user/
    monday.execute("valueCreatedForUser");
    
    // Set up event listeners for context changes
    monday.listen("context", (res) => {
      TimelineLogger.info('Context updated', { context: res.data });
      TimelineLogger.appInitialized(res.data);
      setContext(res.data);
    });
    monday.listen("settings", (res) => {
      TimelineLogger.info('Settings updated', { settings: res.data });
      if (res.data.dateColumn 
        && res.data.titleText === ''
        && res.data.title === false
        && res.data.dateFormat === null
        && res.data.datePosition === null
        && res.data.scale === null
        && res.data.position === null
        && res.data.shape === null
        && res.data.ledger === false
        && res.data.itemDates === false) {
        monday.set('settings', {
          titleText: "Timeline Title",
          title: true,
          dateFormat: "md", 
          datePosition: "angled-below",
          scale: "weeks",
          position: "above", 
          shape: "circle",
          ledger: true,
          itemDates: true
        })
        setSettings({
          dateColumn: res.data.dateColumn,
          titleText: "Timeline Title",
          title: true,
          dateFormat: "md", 
          datePosition: "angled-below",
          scale: "weeks",
          position: "above", 
          shape: "circle",
          ledger: true,
          itemDates: true
        })
      } else {
        setSettings(res.data);
      }
    });
    monday.listen("itemIds", (res) => {
      TimelineLogger.info('Item IDs received', { count: res.data?.length || 0 });
      setItemIds(res.data);
    });
  }, []);
  
  // Fetch board items when context changes and has a boardId, and itemIds are available
  useEffect(() => {
    // Call the imported fetchBoardItems function
    // Wait for both boardId and itemIds to be available before fetching
    if (context?.boardId && itemIds && itemIds.length > 0) {
      // Only fetch when boardId or itemIds actually change
      const boardIdChanged = prevBoardIdRef.current !== context.boardId;
      const itemIdsChanged = !arraysEqual(prevItemIdsRef.current, itemIds);
      if (!boardIdChanged && !itemIdsChanged) {
        TimelineLogger.debug('Skipping fetch - boardId/itemIds unchanged after settings update');
        return;
      }
      TimelineLogger.dataOperation('fetchBoardItems', {
        boardId: context.boardId,
        itemCount: itemIds.length
      });
      fetchBoardItems(settings.dateColumn, context, itemIds, setBoardItems, setIsLoading, setError);
      TimelineLogger.debug('Fetched board items', boardItems );
      // Update refs
      prevBoardIdRef.current = context.boardId;
      prevItemIdsRef.current = itemIds;
    } else {
      TimelineLogger.debug('Skipping fetch - missing context or itemIds', {
        hasBoardId: !!context?.boardId,
        hasItemIds: !!itemIds,
        itemCount: itemIds?.length || 0
      });
    }
    setIsLoading(false);
  }, [context?.boardId, itemIds, settings]); // Fetch only when boardId or itemIds change

  return (
    <Box padding='medium' style={{ position: 'relative', minHeight: '300px' }}>
      <ThemeProvider systemTheme={context?.theme ?? 'light'}>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {(() => {
        const shouldShowLoading = !boardItems || !context || !settings || isLoading || !hiddenItemsLoaded;
        
        TimelineLogger.debug('🎯 App render decision', {
          shouldShowLoading,
          reasons: {
            noBoardItems: !boardItems,
            noContext: !context,
            noSettings: !settings,
            isLoading,
            hiddenItemsNotLoaded: !hiddenItemsLoaded
          },
          hiddenItemsCount: hiddenItemIds?.length || 0
        });
        
        if (shouldShowLoading) {
          return <Loading />;
        } else if (context?.user?.isViewOnly) {
          return <IsViewOnly />;
        } else if (itemIds.length > 15 || boardItems.length > 15) {
          return <TooManyItems />;
        } else {
          TimelineLogger.debug('✅ Rendering timeline with hidden items', {
            hiddenItemsCount: hiddenItemIds?.length || 0,
            boardItemsCount: boardItems?.length || 0
          });
          return (
            <>
              <TimelineBoard />
              <Flex justify="start" align="center">
                <ExportButton />
                <HiddenItemsManager />
              </Flex>
            </>
          );
        }
      })()}
      </ThemeProvider>
    </Box>
  );
};

export default App;
