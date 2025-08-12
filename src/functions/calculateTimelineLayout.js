/**
 * Utility functions for timeline layout calculations
 */

/**
 * Calculate timeline positioning values based on settings
 * @param {string} position - Timeline position ('above', 'below', 'center')
 * @param {string} datePosition - Date position setting
 * @returns {Object} Layout calculations
 */
export const calculateTimelineLayout = (position, datePosition) => {
  // Determine if scale markers should be flipped based on datePosition
  // When position is 'none', markers should be above (no flipping)
  const shouldFlipScaleMarkers = datePosition === 'none' ? false : !datePosition.includes('below');
  
  // Calculate the position for timeline and scale markers
  const timelineTop = position === 'above' ? '75%' : position === 'below' ? '25%' : '50%';
  
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
  height: '300px', // Increased height for the timeline container
  padding: '100px 0', // Increased padding to accommodate items above and below
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
};
