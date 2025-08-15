import React from "react";
import {
  createHandleMouseDown,
  createHandleMouseMove,
  createHandleMouseUp,
  createHandleResizeMouseDown,
  createHandleResizeMouseMove,
  createHandleResizeMouseUp,
} from "../functions/draggableMouseHandlers";

/**
 * Custom hook to manage all mouse event handlers for draggable items
 * Consolidates drag and resize handler creation with proper memoization
 */
export const useMouseHandlers = ({
  containerRef,
  dragStartPos,
  dragOffset,
  startSize,
  position,
  setPosition,
  size,
  setSize,
  setIsDragging,
  setIsResizing,
  onPositionChange,
  item,
  timelinePosition,
}) => {
  // Create mouse handlers using extracted functions with proper memoization
  const handleMouseMove = React.useMemo(
    () =>
      createHandleMouseMove({
        containerRef,
        dragStartPos,
        dragOffset,
        position,
        setPosition,
        onPositionChange,
        item,
        timelinePosition,
      }),
    [position, onPositionChange, item, timelinePosition],
  );

  const handleMouseUp = React.useMemo(
    () =>
      createHandleMouseUp({
        setIsDragging,
        handleMouseMove,
        handleMouseUp: () => {}, // Will be set by the function itself
        onPositionChange,
        item,
        position,
      }),
    [handleMouseMove, onPositionChange, item, position],
  );

  const handleMouseDown = React.useMemo(
    () =>
      createHandleMouseDown({
        dragStartPos,
        dragOffset,
        setIsDragging,
        handleMouseMove,
        handleMouseUp,
        position,
      }),
    [handleMouseMove, handleMouseUp, position],
  );

  const handleResizeMouseMove = React.useMemo(
    () =>
      createHandleResizeMouseMove({
        dragStartPos,
        startSize,
        setSize,
      }),
    [],
  );

  const handleResizeMouseUp = React.useMemo(
    () =>
      createHandleResizeMouseUp({
        setIsResizing,
        handleResizeMouseMove,
        handleResizeMouseUp: () => {}, // Will be set by the function itself
      }),
    [handleResizeMouseMove],
  );

  const handleResizeMouseDown = React.useMemo(
    () =>
      createHandleResizeMouseDown({
        dragStartPos,
        startSize,
        size,
        setIsResizing,
        handleResizeMouseMove,
        handleResizeMouseUp,
      }),
    [size, handleResizeMouseMove, handleResizeMouseUp],
  );

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleResizeMouseDown,
    handleResizeMouseMove,
    handleResizeMouseUp,
  };
};
