/**
 * Filters timeline items by removing those that are in the hiddenItemIds array
 *
 * @param {Array} timelineItems - Array of timeline items to filter
 * @param {Array} hiddenItemIds - Array of item IDs (as strings) that should be hidden
 * @returns {Array} - Filtered array of visible timeline items
 */
const filterVisibleTimelineItems = (timelineItems, hiddenItemIds) => {
  if (!timelineItems || !Array.isArray(timelineItems)) return [];
  if (!hiddenItemIds || !Array.isArray(hiddenItemIds)) return timelineItems;

  return timelineItems.filter((item) => {
    // Convert item ID to string for comparison with hiddenItemIds (which are strings)
    return !hiddenItemIds.includes(String(item.id));
  });
};

export default filterVisibleTimelineItems;
