import React from "react";
import { useState, useEffect } from "react";
import mondaySdk from "monday-sdk-js";
import "@vibe/core/tokens";
import TimelineBuilder from './components/features/timeline-builder';
import { Box, Loader } from "@vibe/core";

// Usage of mondaySDK example, for more information visit here: https://developer.monday.com/apps/docs/introduction-to-the-sdk/
const monday = mondaySdk();

const App = () => {
  const [context, setContext] = useState(null);
  const [boardItems, setBoardItems] = useState([]);
  const [itemIds, setItemIds] = useState([]);
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
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

    monday.listen("itemIds", (res) => {
      setItemIds(res.data);
    });

    monday.listen("settings", (res) => {
      setSettings(res.data);
    });

    return () => {
      // Clean up listeners when component unmounts
      monday.removeEventListener("context");
    };
  }, []);
  console.log(context);
  console.log(itemIds);
  console.log(settings);
  // Fetch board items when context changes and has a boardId
  useEffect(() => {
    const fetchBoardItems = async () => {
      if (!context || !context.boardId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const query = `query {
            boards(ids: ${context.boardId}) {
              items_page(limit: 500) {
                cursor
                items {
                  id
                  name
                  group {
                    id
                  }
                  column_values {
                    id
                  }
                }
              }
            }
          }`;
                
        const response = await monday.api(query);
        
        if (response.data && response.data.boards && response.data.boards.length > 0) {
          setBoardItems(response.data.boards[0].items_page.items);
          console.log('Board items fetched:', response.data.boards[0].items_page.items);
        } else {
          console.warn('No board data found');
          setBoardItems([]);
        }
      } catch (err) {
        console.error('Error fetching board items:', err);
        setError('Failed to load board items');
        setBoardItems([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBoardItems();
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
          <TimelineBuilder context={context} boardItems={boardItems} settings={settings} />
        )}
      </Box>
    );
};

export default App;
