import React from "react";
import { useState, useEffect, useRef } from "react";
import mondaySdk from "monday-sdk-js";
import "@vibe/core/tokens";
import TimelineBoard from './components/timeline/TimelineBoard';
import { Box, Loader, ThemeProvider } from "@vibe/core";
import fetchBoardItems from './functions/fetchBoardItems';
import ExportButton from './components/export/ExportButton';
import TimelineLogger from './utils/logger';
import { useZustandStore } from './store/useZustand';

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
  const { setContext, setSettings, setBoardItems, setItemIds } = useZustandStore();
  const { context, itemIds, settings, boardItems } = useZustandStore();
  const timelineItems = useZustandStore(state => state.timelineItems);

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
      setSettings(res.data);
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
  }, [context?.boardId, itemIds]); // Fetch only when boardId or itemIds change

  // Refetch when the selected date column changes so items & markers reshuffle
  useEffect(() => {
    if (!context?.boardId || !itemIds || itemIds.length === 0) return;
    if (!settings?.dateColumn) return;
    TimelineLogger.dataOperation('fetchBoardItems.onDateColumnChange', {
      boardId: context.boardId,
      itemCount: itemIds.length,
      dateColumnId: settings?.dateColumn?.id || settings?.dateColumn
    });
    fetchBoardItems(settings.dateColumn, context, itemIds, setBoardItems, setIsLoading, setError);
  }, [settings?.dateColumn, context?.boardId, itemIds]);

  // Prevent incidental loader on settings-only changes (no refetch happens)
  useEffect(() => {
    const sameBoard = prevBoardIdRef.current === context?.boardId;
    const sameItems = arraysEqual(prevItemIdsRef.current, itemIds);
    if (sameBoard && sameItems) {
      setIsLoading(false);
    }
  }, [settings, context?.boardId, itemIds]);

  const hasData = Boolean(timelineItems?.length || boardItems?.length);
  const isReady = Boolean(context && settings);

  return (
    <Box padding='medium' style={{ position: 'relative', minHeight: '300px' }}>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!isReady ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px'
        }}>
          <Loader size="medium" />
        </div>
      ) : (
        <ThemeProvider systemTheme={context?.theme ?? 'light'}>
          <TimelineBoard />
          <Box marginBottom="medium">
            <ExportButton />
          </Box>
        </ThemeProvider>
      )}
      {isLoading && !hasData && (
        <div style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--ui-background-color)',
          pointerEvents: 'none'
        }}>
          <Loader size="medium" />
        </div>
      )}
    </Box>
  );
};

export default App;
