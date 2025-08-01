import React from "react";
import { useState, useEffect } from "react";
import mondaySdk from "monday-sdk-js";
import "@vibe/core/tokens";
import TimelineBoard from './components/timeline/TimelineBoard';
import { Box, Loader, ThemeProvider } from "@vibe/core";
import fetchBoardItems from './functions/fetchBoardItems';
import ExportButton from './components/export/ExportButton';
import TimelineLogger from './utils/logger';

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
 * @property {Object.<string, boolean>} date - Selected date column, e.g., { date_mksykvae: true }
 * @property {string} scale - Display scale, e.g., 'weeks'
 * @property {string} button - Button behavior setting
 */

/** context type 
 * @typedef {Object} AppContext
 * @property {int} boardId - ID of the current board
 * @property {Object.<string, boolean>} user - User information
 * @property {string} boardName - Name of the board
 * @property {string} theme - Theme of the board
 */

const App = () => {
  const [context, setContext] = useState(null);
  const [boardItems, setBoardItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [itemIds, setItemIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // check if settings are available
  // if not, set default settings
  useEffect(() => {
    if (!settings) {
      TimelineLogger.info('No settings found, setting default settings');
      monday.set("settings", {
        title: true,
        ledger: true,
        itemDates: false,
        scale: 'weeks',
        position: 'above',
        dateFormat: 'md',
        datePosition: 'angled-below',
        shape: 'circle',
      }).then(res => {
        TimelineLogger.info('Default settings applied', { settings: res.data });
        setSettings(res.data);
      }).catch(error => {
        TimelineLogger.error('Failed to set default settings', error);
      });
    }
  }, [settings]);
  
  //console.log("itemIds in view", itemIds);
  
  // Fetch board items when context changes and has a boardId, and itemIds are available
  useEffect(() => {
    // Call the imported fetchBoardItems function
    // Wait for both boardId and itemIds to be available before fetching
    if (context?.boardId && itemIds && itemIds.length > 0) {
      TimelineLogger.dataOperation('fetchBoardItems', {
        boardId: context.boardId,
        itemCount: itemIds.length
      });
      fetchBoardItems(context, itemIds, setBoardItems, setIsLoading, setError);
    } else {
      TimelineLogger.debug('Skipping fetch - missing context or itemIds', {
        hasBoardId: !!context?.boardId,
        hasItemIds: !!itemIds,
        itemCount: itemIds?.length || 0
      });
    }
  }, [context?.boardId, itemIds]); // Re-run when boardId or itemIds change

  return (
      <Box padding='medium'>
        {isLoading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            height: '100vh',
            width: '100%'
          }}>
            <Loader size="medium" />
          </div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : (
          <ThemeProvider systemTheme={context.theme}>
            <TimelineBoard boardItems={boardItems} settings={settings} />
            {/* Export Button - Left justified */}
            <Box marginBottom="medium">
              <ExportButton theme={context.theme} />
            </Box>  
          </ThemeProvider>
        )}
      </Box>
    );
};

export default App;
