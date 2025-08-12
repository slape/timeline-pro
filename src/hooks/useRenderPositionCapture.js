import { useEffect, useCallback } from 'react';

/**
 * Custom hook to capture render positions and convert them to drag coordinates
 * This runs after DOM rendering to convert calc(50% + Npx) positions to absolute coordinates
 * 
 * @param {Array} items - Timeline items array
 * @param {Function} onPositionsCaptured - Callback when positions are captured
 * @param {boolean} shouldCapture - Whether to capture positions (on position setting changes)
 * @returns {Object} Capture functions
 */
export const useRenderPositionCapture = (items, onPositionsCaptured, shouldCapture = false) => {
  
  const captureRenderPositions = useCallback(() => {
    if (!items || items.length === 0 || !shouldCapture) return;
    
    // console.log('Capturing render positions for', items.length, 'items'); // Suppressed for focused debugging
    
    // Wait for DOM to be fully rendered
    setTimeout(() => {
      const timelineContainer = document.querySelector('.timeline-container');
      if (!timelineContainer) {
        console.warn('Timeline container not found for position capture');
        return;
      }
      
      const containerRect = timelineContainer.getBoundingClientRect();
      const containerTop = containerRect.top;
      const capturedPositions = {};
      
      items.forEach(item => {
        const renderWrapper = document.querySelector(`#board-item-${item.id}`);
        if (renderWrapper) {
          const wrapperRect = renderWrapper.getBoundingClientRect();
          
          // Calculate absolute Y position within the timeline container
          const absoluteY = wrapperRect.top + (wrapperRect.height / 2) - containerTop;
          
          // X position comes from the render position percentage
          let xPosition = item.renderPosition?.x || 50;
          
          // Apply boundaries - X should be between 15% and 85%
          xPosition = Math.max(15, Math.min(xPosition, 85));
          
          // Apply boundaries - Y should be within timeline container bounds
          const ITEM_PADDING = 20;
          const ITEM_HEIGHT = 60; // Approximate item height
          const boundedY = Math.max(ITEM_PADDING, Math.min(absoluteY, containerRect.height - ITEM_HEIGHT - ITEM_PADDING));
          
          capturedPositions[item.id] = {
            x: xPosition,
            y: boundedY
          };
          
          // console.log('Captured position for item', item.id, ':', { x: xPosition, y: boundedY, original: absoluteY }); // Suppressed for focused debugging
        }
      });
      
      // Notify parent with captured positions
      if (Object.keys(capturedPositions).length > 0) {
        onPositionsCaptured(capturedPositions);
      }
    }, 200); // Allow time for render positioning to complete
  }, [items, onPositionsCaptured, shouldCapture]);
  
  // Capture positions when items change and we should capture
  useEffect(() => {
    if (shouldCapture && items?.length > 0) {
      captureRenderPositions();
    }
  }, [captureRenderPositions, shouldCapture, items?.length]);
  
  return {
    captureRenderPositions
  };
};