// Initialize all connector positions by finding board items and calculating their centers
export const initializeConnectorPositions = () => {
  // Find all draggable board items
  const boardItems = document.querySelectorAll(".draggable-board-item");

  // Find the timeline container to get the correct reference point
  const timelineContainer = document.querySelector(".timeline-container");
  if (!timelineContainer) return;

  const containerRect = timelineContainer.getBoundingClientRect();

  // Process each board item to calculate its center
  boardItems.forEach((item) => {
    // Get the item id from data attribute
    const itemId = item.dataset.id;
    if (!itemId) return;

    // Find corresponding connector anchor
    const connectorId = `board-item-${itemId}`;
    const connectorAnchor = document.getElementById(connectorId);
    if (!connectorAnchor) return;

    // Get the item's bounding rectangle
    const itemRect = item.getBoundingClientRect();

    // Calculate item center relative to timeline container
    const itemTopY = itemRect.top - containerRect.top;
    const itemHeight = itemRect.height;
    const itemCenterY = itemTopY + itemHeight / 2;

    // Get the current transform value
    const transform = connectorAnchor.style.transform;
    const translateYMatch = transform.match(/translateY\(([^)]+)\)/);
    let yPosition = 0;

    if (translateYMatch && translateYMatch[1]) {
      yPosition = parseFloat(translateYMatch[1]);
    }

    // Store item dimensions in the connector for reference
    connectorAnchor.dataset.itemHeight = itemHeight;

    // Trigger connector update event
    const updateEvent = new CustomEvent("timeline-connector-update", {
      bubbles: true,
      detail: {
        itemId,
        y: yPosition,
        connectorId,
        itemHeight,
        itemCenterY,
        isInitializing: true,
      },
    });
    document.dispatchEvent(updateEvent);
  });
};

export default initializeConnectorPositions;
