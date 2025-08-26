import { useCallback, useRef, useEffect, useState } from "react";
import { useZustandStore } from "../store/useZustand";

/**
 * Custom hook to isolate Zustand store access and prevent infinite loops
 * This hook encapsulates all the Zustand store access for the DraggableBoardItem component
 * using a manual subscription approach to avoid React re-render cycles
 */
export const useIsolatedZustandState = (itemId) => {
  // Use local state to store values from Zustand
  const [state, setState] = useState({
    context: {},
    settings: {},
    scale: 1,
    currentPositionSetting: "above",
    itemPosition: { rowShift: 0, laneOffset: 0 },
  });

  // Store functions separately to avoid re-renders
  const functionsRef = useRef({
    updateBoardItemDate: null,
    saveCustomItemY: null,
  });

  // Set up a one-time subscription to the store
  useEffect(() => {
    // Get initial state
    const initialState = useZustandStore.getState();

    // Store functions in the ref
    functionsRef.current = {
      updateBoardItemDate: initialState.updateBoardItemDate,
      saveCustomItemY: initialState.saveCustomItemY,
    };

    // Extract initial values
    const data = initialState.customItemY[itemId] || {
      rowShift: 0,
      laneOffset: 0,
    };
    setState({
      context: initialState.context,
      settings: initialState.settings,
      scale: initialState.settings?.scale || 1,
      currentPositionSetting: initialState.currentPositionSetting || "above",
      itemPosition: {
        rowShift: data.rowShift,
        laneOffset: data.laneOffset,
      },
    });

    // Set up subscription that only updates when relevant parts change
    const unsubscribe = useZustandStore.subscribe((newState) => {
      const data = newState.customItemY[itemId] || {
        rowShift: 0,
        laneOffset: 0,
      };

      // Only update state if something has actually changed
      setState((prev) => {
        // Check if any properties have changed
        const hasContextChanged = prev.context !== newState.context;
        const hasSettingsChanged = prev.settings !== newState.settings;
        const hasScaleChanged = prev.scale !== (newState.settings?.scale || 1);
        const hasPositionSettingChanged =
          prev.currentPositionSetting !==
          (newState.currentPositionSetting || "above");
        const hasItemPositionChanged =
          prev.itemPosition.rowShift !== data.rowShift ||
          prev.itemPosition.laneOffset !== data.laneOffset;

        // If nothing changed, return the same object to avoid re-render
        if (
          !hasContextChanged &&
          !hasSettingsChanged &&
          !hasScaleChanged &&
          !hasPositionSettingChanged &&
          !hasItemPositionChanged
        ) {
          return prev;
        }

        // Otherwise, return a new object with updated values
        return {
          context: hasContextChanged ? newState.context : prev.context,
          settings: hasSettingsChanged ? newState.settings : prev.settings,
          scale: hasScaleChanged ? newState.settings?.scale || 1 : prev.scale,
          currentPositionSetting: hasPositionSettingChanged
            ? newState.currentPositionSetting || "above"
            : prev.currentPositionSetting,
          itemPosition: hasItemPositionChanged
            ? {
                rowShift: data.rowShift,
                laneOffset: data.laneOffset,
              }
            : prev.itemPosition,
        };
      });

      // Always update function references
      functionsRef.current = {
        updateBoardItemDate: newState.updateBoardItemDate,
        saveCustomItemY: newState.saveCustomItemY,
      };
    });

    // Clean up subscription on unmount
    return unsubscribe;
  }, [itemId]);

  // Create stable wrapper for saveCustomItemY
  const saveCustomItemY = useCallback((id, position) => {
    // Use timeout to break update cycles
    setTimeout(() => {
      functionsRef.current.saveCustomItemY(id, position);
    }, 0);
  }, []);

  // Create stable wrapper for updateBoardItemDate
  const updateBoardItemDate = useCallback((itemId, columnId, newDateValue) => {
    functionsRef.current.updateBoardItemDate(itemId, columnId, newDateValue);
  }, []);

  // Return the state and wrapped functions
  return {
    ...state,
    updateBoardItemDate,
    saveCustomItemY,
  };
};
