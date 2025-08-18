# Timeline-Pro Positioning System: Y-Delta Persistence (Updated)

This document explains the **architecture and workflow** of the timeline item **Y-Delta persistence system** in the Timeline-Pro app, incorporating safeguards against common drag regression bugs.  

---

## Overview

Timeline-Pro allows users to drag timeline items vertically (Y-axis) and have their positions persist across reloads. The system is designed to:

- Calculate a **default Y position** for each item (from timeline scale/settings + date).
- When an item is dragged, calculate the **delta (difference)** between the new Y position and its stable `defaultY`.
- Persist only this **Y-delta**, not the absolute Y coordinate.
- On reload, restore by re-applying the saved Y-delta to the freshly calculated `defaultY`.

This ensures user adjustments are resilient to data/setting changes and avoids fragile absolute positioning.

---

## Core Components & Workflow

### 1. Calculation & Rendering
- **calculateTimelineItemPositions.js**  
  Computes the baseline `defaultY` for each item.  
- **resolveItemPositions.js**  
  - Takes defaults and applies deltas: `finalY = defaultY + yDelta`  
  - Ensures finalY is clamped within allowed viewport/lane bounds  
  - Returns resolved positions for rendering  
- **DraggableBoardItem.jsx**  
  - **On drag start**: Snapshots `defaultY`, `resolvedY`, and `pointerY`. These stay frozen for the entire drag.  
  - **During drag**:  
    - Computes movement in **timeline coordinate space** (pointer delta ÷ scale).  
    - Updates local **visualY** via `requestAnimationFrame` only, for smooth paint without store churn.  
  - **On drag end**:  
    - Computes `yDelta = finalVisualY - defaultY` (using the snapshot default).  
    - Saves to store + Monday.com.  

### 2. Persistence (Saving & Loading)
- **useZustand.js** (Store)  
  - Holds `customItemYDelta: { [itemId]: number }`  
  - Exposes `saveCustomItemYDelta(itemId, yDelta)`  
  - Tracks `itemPositionsLoaded` and `itemPositionsError`  
- **saveCustomItemYDelta.js**  
  - Updates store immediately (optimistic)  
  - Debounced async persist to Monday.com (`timeline-pro-item-positions-${boardId}`)  
  - Uses versioning + `updatedAt` timestamp for merge safety across sessions/tabs  
- **initializeItemPositions.js**  
  - Fetches saved deltas on app load  
  - Validates with schema (rejects malformed payloads)  
  - Hydrates Zustand with deltas  

### 3. Timeline Integration
- **Timeline.jsx**  
  - Waits for `itemPositionsLoaded` before rendering items  
  - Renders with resolved positions (`defaultY + delta`)  
  - Renders hidden until loaded to prevent flicker  

### 4. App-Level Initialization
- **App.jsx**  
  - Calls `initializeItemPositions()` once `boardId` is known  
  - Waits for both hidden-items and Y-delta subsystems before first render  

---

## Drag Workflow (Stable Pattern)

1. **Drag Start**  
   - Capture:  
     - `pointerYStart` (screen)  
     - `defaultY` (from timelineItems)  
     - `resolvedYStart = defaultY + (delta ?? 0)`  
   - Set pointer capture to handle off-element movement.  

2. **Drag Move**  
   - Compute raw delta = `(pointerY - pointerYStart)`  
   - Convert to timeline coordinates: `dy = rawDelta / scale`  
   - Update visual transform via `requestAnimationFrame` only (not store).  

3. **Drag End**  
   - Compute `finalY` = last visual position  
   - Compute and clamp: `yDelta = finalY - defaultY`  
   - Save optimistically to store, persist async to Monday.com  

---

## Key Safeguards

- **Snapshot Reference**: `defaultY` is frozen on drag start to avoid mid-drag recalcs.  
- **Timeline Coordinate Space**: Always divide pointer deltas by `scale` to avoid CSS transform bugs.  
- **Paint vs Commit Separation**: Visual drag is handled by `transform: translateY(...)`, store is only updated at drag end.  
- **RAF Updates**: Throttle paint updates to animation frames to prevent jank.  
- **Bounds Clamping**: Deltas are clamped before save, ensuring items never persist outside lanes.  
- **Loading Gate**: Items are hidden until both defaults + deltas are loaded, avoiding flicker.  
- **Error Recovery**: Persist failures retry with backoff; UI keeps optimistic state.  

---

## Storage Structure

```json
{
  "boardId": "...",
  "customItemYDelta": {
    "itemId1": 50,
    "itemId2": -25
  }
}
```

Analysis of Current Codebase for Y-Delta Persistence
1. Current State
The codebase already contains a partial or in-progress implementation of Y-delta persistence, but there is legacy logic and some redundant/old code for absolute Y and full position objects.
Key files involved:
/src/functions/saveCustomItemYDelta.js
, 
/src/functions/saveItemPositionsToStorage.js
, 
/src/functions/resolveItemPositions.js
, 
/src/functions/initializeItemPositions.js
, 
/src/functions/loadItemPositionsFromStorage.js
/src/store/useZustand.js
 (store shape, persistence methods)
/src/components/timeline/DraggableBoardItem.jsx
 (drag workflow, delta calculation)
/src/functions/getDefaultItemYPosition.js
 (for defaultY calculation)
There is still some code referencing customItemPositions (full x/y object), 
saveCustomItemPosition
, and logic for absolute Y, which needs to be removed or refactored.
2. What Needs to Change
Remove all logic and store fields for absolute Y or full position objects.

Ensure all persistence, drag, and restore logic uses only Y-delta:
Only customItemYDelta: { [itemId]: number } should be persisted.
The render pipeline should always resolve finalY = defaultY + yDelta.
Drag workflow should snapshot defaultY at drag start, calculate and save yDelta at drag end.
Refactor Timeline, DraggableBoardItem, and zustand store to remove legacy fields and methods.
Update storage format and migration logic if needed.
Implementation Plan
1. Remove Legacy/Redundant Code
Delete all uses of customItemPositions, 
saveCustomItemPosition
, and any code that persists or loads absolute Y or full {x, y} objects.
Remove or refactor functions like 
saveItemPositionsToStorage
, 
clearCustomPositions
, 
updatePositionSetting
, etc., to only deal with Y-delta.
2. Store & Persistence
Zustand store should only have customItemYDelta: { [itemId]: number }.
Methods: 
saveCustomItemYDelta(itemId, yDelta)
, 
initializeItemPositions
, and error/loading state.
All storage (Monday.com) should use the new format:
json
{
  "boardId": "...",
  "customItemYDelta": {
    "itemId1": 50,
    "itemId2": -25
  }
}
3. Drag Workflow
On drag start: snapshot defaultY (from timeline calculation).
On drag move: update visual transform only (no store updates).
On drag end: calculate yDelta = finalVisualY - defaultY, clamp, and save via 
saveCustomItemYDelta
.
Ensure all logic uses timeline coordinate space and is robust to mid-drag recalcs.
4. Position Resolution
resolveItemPositions(items, startDate, endDate, position, customItemYDelta)
 should:
For each item: finalY = defaultY + (customItemYDelta[itemId] || 0)
Clamp to bounds before rendering.
5. Timeline & App Integration
Timeline waits for itemPositionsLoaded before rendering.
App initializes Y-delta subsystem on load, with error handling.
All legacy loading logic for full positions is removed.