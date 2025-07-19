import React from "react";
import { useState, useEffect } from "react";
import mondaySdk from "monday-sdk-js";
import "@vibe/core/tokens";
import TimelineBoard from './components/timeline/TimelineBoard';
import { Box, Loader, ThemeProvider } from "@vibe/core";
import fetchBoardItems from './functions/fetchBoardItems';

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
    // Notice this method notifies the monday platform that user gains a first value in an app.
    // Read more about it here: https://developer.monday.com/apps/docs/mondayexecute#value-created-for-user/
    monday.execute("valueCreatedForUser");
    // Set up event listeners for context changes
    monday.listen("context", (res) => {
      setContext(res.data);
    });
    monday.listen("settings", (res) => {
      setSettings(res.data);
    });
    monday.listen("itemIds", (res) => {
      setItemIds(res.data);
    });
  }, []);
  console.log("context", context);
  console.log("settings", settings);
  console.log("itemIds", itemIds);
  
  // Fetch board items when context changes and has a boardId
  useEffect(() => {
    // Call the imported fetchBoardItems function
    if (context?.boardId) {
      fetchBoardItems(context, itemIds, setBoardItems, setIsLoading, setError);
    }
  }, [context?.boardId]); // Only re-run when boardId changes

  return (
      <Box
      padding='medium'
      >
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Loader size="large" />
          </div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : (
          <ThemeProvider systemTheme={context.theme}>
            <TimelineBoard boardItems={boardItems} settings={settings} />
          </ThemeProvider>
        )}
      </Box>
    );
};

export default App;
