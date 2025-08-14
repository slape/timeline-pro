import { calculateTimelineItemPositions } from './calculateTimelineItemPositions';

/**
 * Gets the default Y position for a timeline item given timeline context.
 * @param {Object} params
 * @param {Array} items - Timeline items array
 * @param {string} itemId - The ID of the item to find
 * @param {Date} startDate - Timeline start date
 * @param {Date} endDate - Timeline end date
 * @param {string} position - Timeline position setting
 * @returns {number|null} Default Y position or null if not found
 */
import TimelineLogger from '../utils/logger';

export function getDefaultItemYPosition({ items, itemId, startDate, endDate, position }) {
  TimelineLogger.debug('[Y-DELTA][TRACE] getDefaultItemYPosition called', { items, itemId, startDate, endDate, position });
  const positions = calculateTimelineItemPositions(items, startDate, endDate, position);
  TimelineLogger.debug('[Y-DELTA][TRACE] positions array', { positions });
  const found = positions.find(i => i.id === itemId);
  TimelineLogger.debug('[Y-DELTA][TRACE] found item', { found });
  return found ? found.renderPosition.y : null;
}
