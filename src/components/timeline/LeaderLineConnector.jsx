import React, { useEffect, useState, useCallback, useRef } from 'react';
import TimelineLogger from '../../utils/logger';

const LeaderLineConnector = ({ fromId, toId }) => {
  const [lineCoords, setLineCoords] = useState(null);
  const hasLoggedRef = useRef(false);

  const updateLinePosition = useCallback(() => {
    const fromElem = document.getElementById(fromId); // Board item container
    const toElem = document.getElementById(toId); // Timeline marker

    if (!fromElem || !toElem) {
      // Debug: log missing elements once per mount
      if (!fromElem) {
        TimelineLogger.debug('[LeaderLineConnector] from element missing', { fromId });
      }
      if (!toElem) {
        TimelineLogger.debug('[LeaderLineConnector] to element missing', { toId });
      }
      return;
    }

    // Get the timeline container to calculate relative positions
    const timelineContainer = fromElem.closest('.timeline-container');
    if (!timelineContainer) {
      if (!hasLoggedRef.current) {
        TimelineLogger.debug('[LeaderLineConnector] timeline container not found');
      }
      return;
    }
    
    const containerRect = timelineContainer.getBoundingClientRect();
    
    // For Rnd components, we should use the container element directly
    // since Rnd manages the positioning through transforms
    let actualItemElement = fromElem;
    
    // Look for the Rnd wrapper or the Box component inside
    const rndWrapper = fromElem.querySelector('div[style*="transform"]');
    const boxElement = fromElem.querySelector('div[style*="background-color"]');
    
    if (rndWrapper) {
      actualItemElement = rndWrapper;
    } else if (boxElement) {
      actualItemElement = boxElement;
    }
    
    const fromRect = actualItemElement.getBoundingClientRect();
    const toRect = toElem.getBoundingClientRect();
    
    // Calculate timeline marker X position (center horizontally)
    const markerX = toRect.left + toRect.width / 2 - containerRect.left;
    
    // Find the actual timeline line position within the container
    const timelineLineElement = timelineContainer.querySelector('div[style*="height: 2px"]');
    let timelineY;
    
    if (timelineLineElement) {
      const timelineRect = timelineLineElement.getBoundingClientRect();
      timelineY = timelineRect.top + timelineRect.height / 2 - containerRect.top;
    } else {
      // Fallback: calculate timeline position based on container
      const containerHeight = containerRect.height;
      // Assume timeline is at 50% for now (this matches the Timeline component logic)
      timelineY = containerHeight * 0.5;
    }
    
    // The connection point should be at the timeline intersection
    const toX = markerX;
    const toY = timelineY;
    
    // Calculate board item's horizontal center position
    const itemCenterX = fromRect.left + fromRect.width / 2 - containerRect.left;
    
    // For perfectly perpendicular lines, always use the same X coordinate as the marker
    // This ensures the line is vertical regardless of item position
    const fromX = toX; // Always align with the marker's X position
    
    // Determine if item is above or below the timeline
    const itemTopY = fromRect.top - containerRect.top;
    const itemBottomY = fromRect.bottom - containerRect.top;
    
    // Calculate attachment point based on item position relative to timeline
    let fromY;
    if (itemBottomY < toY) {
      // Item is above timeline - attach to bottom edge
      fromY = itemBottomY;
    } else if (itemTopY > toY) {
      // Item is below timeline - attach to top edge
      fromY = itemTopY;
    } else {
      // Item overlaps timeline - attach to closest edge
      const distanceToTop = Math.abs(itemTopY - toY);
      const distanceToBottom = Math.abs(itemBottomY - toY);
      fromY = distanceToTop < distanceToBottom ? itemTopY : itemBottomY;
    }
    
    // Ensure perfectly perpendicular line by using same X coordinate for both points
    const next = { 
      fromX, 
      fromY, 
      toX, // Use the exact same X as the marker for perpendicular line
      toY  // Use the actual timeline marker Y position
    };
    setLineCoords(next);
    if (!hasLoggedRef.current) {
      hasLoggedRef.current = true;
      TimelineLogger.debug('[LeaderLineConnector] line positioned', { fromId, toId, ...next });
    }
  }, [fromId, toId]);

  useEffect(() => {
    // Initial position calculation with multiple attempts
    const timer1 = setTimeout(updateLinePosition, 50);
    const timer2 = setTimeout(updateLinePosition, 200);
    const timer3 = setTimeout(updateLinePosition, 500);
    
    // Update on resize
    window.addEventListener('resize', updateLinePosition);
    
    // Update very frequently for drag operations (higher frequency to catch Rnd updates)
    const interval = setInterval(updateLinePosition, 8); // ~120fps for better tracking

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearInterval(interval);
      window.removeEventListener('resize', updateLinePosition);
    };
  }, [fromId, toId]);

  if (!lineCoords) return null;

  // Calculate line properties
  const length = Math.sqrt(
    Math.pow(lineCoords.toX - lineCoords.fromX, 2) + 
    Math.pow(lineCoords.toY - lineCoords.fromY, 2)
  );
  const angle = Math.atan2(
    lineCoords.toY - lineCoords.fromY, 
    lineCoords.toX - lineCoords.fromX
  ) * 180 / Math.PI;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2000, // Ensure above items and timeline
      }}
    >
      <line
        x1={lineCoords.fromX}
        y1={lineCoords.fromY}
        x2={lineCoords.toX}
        y2={lineCoords.toY}
        stroke="#666"
        strokeWidth="2"
        opacity="0.7"
      />
      {/* Small dot at the timeline endpoint */}
      <circle
        cx={lineCoords.toX}
        cy={lineCoords.toY}
        r="4"
        fill="#666"
        opacity="0.8"
      />
    </svg>
  );
};

export default LeaderLineConnector;
