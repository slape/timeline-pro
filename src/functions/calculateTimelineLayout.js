/**
 * Utility functions for timeline layout calculations
 */
import { TIMELINE_LAYOUT, UI_COMPONENTS, getTimelineTopCSS } from './configConstants';

/**
 * Calculate timeline layout and container styles
 * Centralizes timeline positioning and styling logic
 * @param {string} position - Timeline position ('above', 'below', 'center')
 * @param {string} datePosition - Date position setting
 * @returns {Object} Layout calculations
 */
export const calculateTimelineLayout = (position, datePosition) => {
  // Determine if scale markers should be flipped based on datePosition
  // When position is 'none', markers should be above (no flipping)
  const shouldFlipScaleMarkers = datePosition === 'none' ? false : !datePosition.includes('below');
  
  // Calculate the position for timeline and scale markers
  const timelineTop = getTimelineTopCSS(position);
  
  return {
    shouldFlipScaleMarkers,
    timelineTop,
  };
};

/**
 * Timeline container styles
 */
export const TIMELINE_CONTAINER_STYLES = {
  position: 'relative',
  width: '90%', // Use 90% width to ensure padding on both sides
  margin: '0 auto', // Center the timeline
  height: `${TIMELINE_LAYOUT.CONTAINER_HEIGHT}px`, // Timeline container height
  padding: `${TIMELINE_LAYOUT.CONTAINER_PADDING}px 0`, // Padding to accommodate items above and below
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
};
