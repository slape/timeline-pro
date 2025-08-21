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
  - Tracks `currentPositionSetting` (from settings) - **NOTE**: This field appears to be missing from current store implementation
  - Exposes `saveCustomItemYDelta(itemId, yDelta)`
  - Tracks `itemPositionsLoaded` and `itemPositionsError`
  - Integrates with `MondayStorageService` for persistence
  - **Auto-initialization**: Y-delta loading is triggered automatically when Monday storage is initialized, not manually called
- **saveCustomItemYDelta.js**
  - Updates store immediately (optimistic)
  - Debounced async persist to Monday.com (`timeline-pro-item-positions-${boardId}`), saving both Y-deltas and the current position setting
- **Storage Format**: Uses `ITEM_POSITIONS_KEY_PREFIX` from `configConstants.js` for storage keys

### 3. Positioning Logic (Y-delta Application)

- **calculateTimelineItemPositions**
  - Accepts an extra `customYDeltas` argument (object mapping itemId to yDelta) from the store.
  - Only applies Y-deltas if the current timeline position setting matches the tracked (persisted) setting.
  - If the setting has changed, it ignores all custom Y-deltas and uses only the default calculated positions, ensuring a reset/mirror behavior as needed.
  - All call sites (Timeline, DraggableBoardItem) now pass `customItemYDelta` from the store to ensure correct application of persistence and reset logic.
  - Uses versioning + `updatedAt` timestamp for merge safety across sessions/tabs
  - **Bounds**: Items are clamped to MIN_Y (-300) and MAX_Y (300) in `resolveItemPositions.js`
- **initializeItemPositions.js**
  - Fetches saved deltas and setting on app load
  - Validates with schema (rejects malformed payloads)
  - Hydrates Zustand with deltas and tracked setting
  - Sets `itemPositionsLoaded: true` when complete
- **resolveItemPositions.js**
  - Final step that applies Y-deltas to default positions
  - Handles bounds clamping and marks items with `isCustomPosition` flag

### 3. Timeline Integration

- **Timeline.jsx**
  - Waits for `itemPositionsLoaded` before rendering items
  - Renders with resolved positions (`defaultY + delta`)
  - Renders hidden until loaded to prevent flicker

### 4. Timeline Integration

- **Timeline.jsx**
  - Waits for `itemPositionsLoaded` before rendering items
  - Renders with resolved positions (`defaultY + delta`)
  - Renders hidden until loaded to prevent flicker
  - Detects position setting changes via `useEffect` and calls `updatePositionSetting()`
  - Passes `customItemYDelta` from store to `calculateTimelineItemPositions()`

### 5. App-Level Initialization

- **App.jsx**
  - Initializes Monday storage service via `initializeMondayStorage()` when SDK is available
  - Y-delta initialization is triggered automatically when `boardId` becomes available
  - Uses loading gates (`appLoading`, `hiddenItemsLoaded`) to prevent premature rendering
  - Does NOT explicitly call `initializeItemPositions()` - this happens automatically

---

## Drag Workflow (Stable Pattern)

1. **Drag Start** (`handleMouseDownWithDefaultY`)
   - Capture:
     - `pointerYStart` (screen)
     - `defaultY` (from `getDefaultItemYPosition()` - calculated fresh using current timeline state)
     - `resolvedYStart = defaultY + (delta ?? 0)`
   - Store `defaultY` in `dragDefaultY.current` ref for entire drag duration
   - Set pointer capture to handle off-element movement.

2. **Drag Move** (`handleMouseMove`)
   - Compute raw delta = `(pointerY - pointerYStart)`
   - Convert to timeline coordinates: `dy = rawDelta / scale`
   - Update visual transform via `requestAnimationFrame` only (not store).

3. **Drag End** (`handlePositionChangeWithYDelta`)
   - Compute `finalY` = last visual position
   - Compute and clamp: `yDelta = finalY - dragDefaultY.current`
   - Save optimistically to store via `saveCustomItemYDelta()`, persist async to Monday.com

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

## Key Implementation Details

### File Structure & Responsibilities

- **Store**: `src/store/useZustand.js` - Central state management for Y-deltas
- **Drag Component**: `src/components/timeline/DraggableBoardItem.jsx` - Handles drag interactions and Y-delta calculation
- **Position Calculation**: `src/functions/calculateTimelineItemPositions.js` - Computes default positions
- **Position Resolution**: `src/functions/resolveItemPositions.js` - Applies Y-deltas to defaults with bounds
- **Persistence**: `src/functions/saveCustomItemYDelta.js` & `src/functions/saveItemPositionsToStorage.js`
- **Loading**: `src/functions/initializeItemPositions.js` & `src/functions/loadItemPositionsFromStorage.js`
- **Utilities**: `src/functions/getDefaultItemYPosition.js` - Helper for getting default Y position
- **Timeline**: `src/components/timeline/Timeline.jsx` - Orchestrates rendering with resolved positions

### Configuration Constants

- Drag bounds: `MIN_Y = -300`, `MAX_Y = 300` (in `resolveItemPositions.js`)
- Storage key prefix: `"timeline-pro-item-positions"` (in `configConstants.js`)
- Position settings: `"above"`, `"below"`, `"alternate"`

### Critical Implementation Notes

- **Missing Store Field**: `currentPositionSetting` is referenced but may not be defined in store
- **Automatic Initialization**: Y-delta loading happens automatically when Monday storage initializes
- **No Manual Init**: App.jsx does NOT explicitly call `initializeItemPositions()`
- **Ref-based Snapshot**: `dragDefaultY.current` stores the baseline position for entire drag duration
- **Timeline Coordinate Space**: All calculations use timeline coordinates (pointer delta ÷ scale)
- **RAF Paint Updates**: Visual updates during drag use `requestAnimationFrame` for smooth performance

### Error Recovery & Edge Cases

- Storage failures: Optimistic updates with rollback on error
- Malformed data: Schema validation rejects invalid payloads
- Position setting changes: Y-deltas ignored when settings don't match
- Loading states: Items hidden until both defaults and deltas are loaded

---

## Storage Structure

```json
{
  "boardId": "...",
  "customItemYDelta": {
    "itemId1": 50,
    "itemId2": -25
  },
  "positionSetting": "above" // or "below" or "alternate"
}
```

**Storage Key Format**: `${ITEM_POSITIONS_KEY_PREFIX}-${boardId}` where `ITEM_POSITIONS_KEY_PREFIX = "timeline-pro-item-positions"`

- The `positionSetting` is persisted alongside Y-deltas. This ensures that Y-deltas are only applied if the timeline position setting matches the one used when they were saved.

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

## Y-Delta-Only Positioning System (Current)

**Overview:**

- The system now exclusively uses Y-delta persistence for vertical positioning of timeline items.
- Only `customItemYDelta: { [itemId]: number }` and the `positionSetting` are stored and restored. All logic for absolute Y or full position objects has been removed/refactored.
- The render pipeline always resolves `finalY = defaultY + yDelta` for each item, but only applies Y-deltas if the current position setting matches the persisted one.
- On drag start, the item's defaultY is snapshotted. On drag end, the Y-delta is calculated and saved, along with the current position setting.
- All persistence, drag, and restore logic is Y-delta only. No legacy fields/methods like `customItemPositions`, `saveCustomItemPosition`, or absolute Y remain.
- The storage format and migration logic have been updated to only use Y-delta and setting.

**Persistence Chain:**

1. User drags item → On drag end, Y-delta is calculated and saved to Zustand store and Monday storage, along with the current position setting.
2. On reload, Y-deltas and the tracked position setting are loaded from storage.
3. The UI renders items at `finalY = defaultY + yDelta` only if the tracked position setting matches the current one. If not, Y-deltas are ignored for this render (items appear at defaultY).

**Store Structure:**

```js
customItemYDelta: { [itemId]: number }
currentPositionSetting: string // e.g., 'above', 'below', 'alternate'
```

**Removed/Refactored:**

- All logic and store fields for absolute Y or full position objects.
- All references to `customItemPositions`, `saveCustomItemPosition` or absolute Y.

---

## Debugging & Current Progress

**Current Progress:**

- Y-delta persistence is mostly working: drag end triggers Y-delta save, logs confirm persistence chain is called.
- On reload, Y-deltas are loaded from storage and merged with default positions in the render pipeline.
- Legacy code and references to old positioning logic have been mostly removed, but some may remain.
- **Architecture Complete**: All core components are implemented and connected properly

**Implementation Status:**

- ✅ Store management with `customItemYDelta`
- ✅ Drag workflow with snapshot-based defaultY calculation
- ✅ Position resolution pipeline (`calculateTimelineItemPositions` → `resolveItemPositions`)
- ✅ Monday.com storage integration with proper error handling
- ✅ Timeline integration with loading gates and position setting detection
- ⚠️ Missing `currentPositionSetting` field in store (referenced but not defined)
- ⚠️ Auto-initialization may need explicit triggering in some cases

**Known Issues / Debugging Steps:**

- [ ] Some logs and code may still reference legacy fields (e.g., `customItemPositions`, absolute Y). These need to be fully removed for clarity and reliability.
- [ ] **Missing Store Field**: `currentPositionSetting` is referenced throughout codebase but not defined in `useZustand.js`
- [ ] **Initialization Gap**: `initializeItemPositions()` method exists but may not be called automatically - verify trigger mechanism
- [ ] If vertical position does not persist after reload, check:
  - The storage loader and initializer use `customItemYDelta` and `positionSetting` consistently.
  - Zustand store is set with the loaded Y-deltas and tracked position setting after reload.
  - The render pipeline always uses `finalY = defaultY + yDelta` **only if** the tracked position setting matches the current one.
  - No code is using or expecting absolute Y/full position objects.
- [ ] The persistence chain is: drag end → save Y-delta and setting to store → save to Monday storage → load on reload → set store → render with Y-delta (if setting matches).
- [ ] Debug logs should only appear for drag end, Y-delta save, storage load, and setting mismatch. Remove any verbose or legacy logs.

**Next Steps:**

- [ ] **Critical**: Add missing `currentPositionSetting` field to Zustand store initialization
- [ ] **Critical**: Verify `initializeItemPositions()` is called when `boardId` becomes available
- [ ] Remove any remaining legacy code/fields.
- [ ] Validate that only Y-delta is persisted and restored.
- [ ] Confirm that after reload, vertical position is correct and matches user adjustment.
- [ ] Test position setting changes to ensure Y-deltas are properly ignored/reset

---

This README now reflects the complete source of truth for the Y-delta-only positioning system. All persistence, drag, and restore logic should align with this model.

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

CURRENTLY this feature has 2 bugs:

1. when dragging an item and letting it go, it jumps to a new location on the yaxis.
2. when refreshing the page, the ydeltas are either not saved or not correctly applied because the items return to their default location as determined by calculateTimelineItemPositions.js

### Bugs in Y-Delta Persistence System

#### Bug 1: Y-Delta Calculation

- **Observation**: The `yDelta` remains `0` during and after drag operations.
- **Potential Cause**: The `handlePositionChangeWithYDelta` function may not be calculating or saving the `yDelta` correctly.
- **Impact**: The vertical offset adjustments made by users are not persisted, leading to incorrect item positions on reload.

#### Bug 2: Rendering Logic

- **Observation**: The `finalY` value is consistently `-40` (or `-80` for some items), and the `yDelta` is not applied during rendering.
- **Potential Cause**: The `resolveItemPositions` function may not be applying the `yDelta` to the `defaultY` to compute the `finalY`.
- **Impact**: Items appear in incorrect positions, ignoring user adjustments.

#### Bug 3: Store Integration

- **Observation**: The `customItemYDelta` object in the store remains empty.
- **Potential Cause**: The `saveCustomItemYDelta` function may not be called with the correct `itemId` and `yDelta` values.
- **Impact**: The Y-delta values are not saved to the store, preventing persistence across sessions.

#### Bug 4: Initialization on Reload

- **Observation**: On refreshing the page, the `customItemYDelta` object is empty, and items return to their default positions.
- **Potential Cause**: The `initializeItemPositions` function may not be correctly loading Y-deltas from storage or updating the Zustand store.
- **Impact**: User adjustments are lost after a page reload.

#### Bug 5: Storage Loading

- **Observation**: The data fetched from Monday.com storage may not match the expected format.
- **Potential Cause**: The `loadItemPositionsFromStorage` function may not be fetching or returning the correct data structure.
- **Impact**: The Y-deltas are not restored correctly, leading to empty `customItemYDelta` in the store.

Inspect loadItemPositionsFromStorage:

Verify that this function is fetching the correct data from storage.
Inspect Storage Data:

Check the actual data stored in Monday.com to ensure it matches the expected format:
Add More Logs:

Add logs to loadItemPositionsFromStorage to confirm the data being fetched from storage.

### Potential Interaction Between `loadItemPositionsFromStorage` and `calculateTimelineItemPositions`

#### Key Observations:

1. **`loadItemPositionsFromStorage`**:
   - Fetches Y-delta values from storage for a specific board.
   - Returns an object containing `customItemYDelta` mapped by item IDs.

2. **`calculateTimelineItemPositions`**:
   - Calculates positions of timeline items based on chronological order and position settings.
   - Optionally applies Y-deltas if provided via the `customYDeltas` argument.

#### Potential Interaction:

- **Data Flow**: The `customItemYDelta` fetched by `loadItemPositionsFromStorage` is likely passed to `calculateTimelineItemPositions` as the `customYDeltas` argument.
- **Conflict Risk**: If the data fetched by `loadItemPositionsFromStorage` is outdated, incomplete, or inconsistent with the current state of the timeline, it could lead to incorrect positioning in `calculateTimelineItemPositions`.

#### Recommendations:

1. **Validation**: Ensure that the data returned by `loadItemPositionsFromStorage` is validated before being passed to `calculateTimelineItemPositions`.
2. **Synchronization**: Verify that the `customItemYDelta` data is up-to-date and corresponds to the current state of the timeline items.
3. **Debugging**: Add logs to trace the flow of `customItemYDelta` from `loadItemPositionsFromStorage` to `calculateTimelineItemPositions`.
