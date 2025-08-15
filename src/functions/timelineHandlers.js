export function handleTimelineItemMove(setTimelineItems, TimelineLogger) {
  return (itemId, newPosition) => {
    TimelineLogger.userAction("timelineItemMoved", { itemId, newPosition });
    setTimelineItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, position: newPosition } : item,
      ),
    );
  };
}

export function handleLabelChange(setTimelineItems, TimelineLogger) {
  return (itemId, newLabel) => {
    TimelineLogger.userAction("timelineItemLabelChanged", { itemId, newLabel });
    setTimelineItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, label: newLabel } : item,
      ),
    );
  };
}

export function handleHideItem(setHiddenItemIds, TimelineLogger, itemId) {
  return () => {
    TimelineLogger.userAction("timelineItemHidden", { itemId });
    setHiddenItemIds((prev) => [...prev, itemId]);
  };
}

export function handleUnHideItem(setHiddenItemIds, TimelineLogger, itemId) {
  return () => {
    TimelineLogger.userAction("timelineItemUnHidden", { itemId });
    setHiddenItemIds((prev) => prev.filter((id) => id !== itemId));
  };
}
