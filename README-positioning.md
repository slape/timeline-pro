# Timeline-Pro Positioning System: Row/Lane Shift Model (Updated)

This document explains the **architecture and workflow** of the timeline item **Row/Lane Shift positioning system** in the Timeline-Pro app, designed to provide stable and predictable item positioning across different view settings.

---

## Overview

Timeline-Pro allows users to drag timeline items vertically (Y-axis) and have their positions persist across reloads. The system is designed with a Row/Lane Shift model:

- Calculate a **base row** for each item (deterministic based on item ID and position setting)
- When an item is dragged, calculate a **row shift** (integer row offset) and **lane offset** (small pixel adjustment)
- Persist this row-based positioning model rather than absolute pixels
- On reload, reapply the row shift and lane offset to the freshly calculated base row

This approach ensures user adjustments are resilient to zoom changes, font size changes, and position setting changes, avoiding the fragility of absolute or delta-based positioning.

---

## Core Components & Workflow

### 1. Base Row Calculation & Position Resolution

- **getDefaultRowFor.js**  
  Computes the deterministic base row for each item based on item ID and position setting.
- **resolveItemPositions.js**
  - Takes base rows and applies row shifts: `finalRow = baseRow + rowShift`
  - Adds lane offset for fine-grained positioning: `finalY = finalRow * LANE_HEIGHT + laneOffset`
  - Ensures both are clamped within allowed row and offset bounds
  - Returns resolved positions for rendering
- **DraggableBoardItem.jsx**
  - **On drag start**: Snapshots row position and pointer coordinates
  - **During drag**:
    - Computes movement in timeline coordinate space (pointer delta ÷ scale)
    - Updates local position via `requestAnimationFrame` for smooth painting
  - **On drag end**:
    - Converts final position to row/lane model
    - Saves to store + Monday.com

### 2. Persistence (Saving & Loading)

- **useZustand.js** (Store)
  - Holds `customItemY: { [itemId]: { rowShift: number, laneOffset: number } }`
  - Exposes `saveCustomItemY(itemId, { rowShift, laneOffset })`
  - Tracks `itemPositionsLoaded` and `itemPositionsError`
  - Integrates with `MondayStorageService` for persistence
- **saveItemPositionsToStorage.js**
  - Updates store immediately (optimistic)
  - Debounced async persist to Monday.com (`timeline-pro-item-positions-${boardId}`)
- **Storage Format**: Uses `ITEM_POSITIONS_KEY_PREFIX` from `configConstants.js` for storage keys

### 3. Row/Lane Shift Positioning Logic

- **resolveItemPositions.js**
  - Accepts items, position setting, and customItemY (object mapping itemId to { rowShift, laneOffset })
  - Calculates base row for each item using `getDefaultRowFor()`
  - Applies row shift and lane offset to calculate final position: `finalY = (baseRow + rowShift) * LANE_HEIGHT + laneOffset`
  - Clamps row shifts within MIN_ROW and MAX_ROW and lane offsets within ±OFFSET_MAX
  - Returns items with resolved render positions
- **draggableMouseHandlers.js**
  - Handles mouse events for dragging items
  - Tracks position during drag in timeline coordinate space
  - Provides callbacks for position changes
- **Timeline.jsx**
  - Waits for `itemPositionsLoaded` before rendering items
  - Renders with resolved positions from the row/lane model
  - Detects position setting changes and handles updates

### 4. Migration from Legacy Y-Delta

- **migrateLegacyYDeltaToRowShift.js**
  - Converts legacy Y-delta values to the new row/lane shift model
  - Calculates appropriate row shifts and lane offsets based on pixel deltas
  - Updates store and persists to storage in the new format
  - Runs once when timeline mounts if legacy data is detected

---

## Drag Workflow (Stable Pattern)

1. **Drag Start**
   - Capture pointer start position and current item position
   - Set up mouse move and mouse up handlers
   - Add visual indicators for dragging state

2. **Drag Move**
   - Calculate mouse movement in timeline coordinates (dividing by scale)
   - Apply bounds to keep item within the valid container area
   - Update visual position via requestAnimationFrame for smooth animation
   - Update connector lines along with item position

3. **Drag End**
   - Calculate final position and convert to the row/lane model:
     - `rowShift = Math.round(finalY / LANE_HEIGHT) - baseRow`
     - `laneOffset = finalY - (baseRow + rowShift) * LANE_HEIGHT`
   - Clamp values to ensure they're within valid ranges
   - Save to store and persist to Monday.com storage
   - Update connector positions and trigger final renders

---

## Key Constants and Configuration

- **Row Height**: `LANE_HEIGHT = 40` (pixels per row)
- **Lane Offset Limits**: `OFFSET_MAX = 12` (max pixels of fine adjustment within a row)
- **Row Limits**: `MIN_ROW = -10`, `MAX_ROW = 200` (sensible bounds for row shifts)
- **Storage Key**: `ITEM_POSITIONS_KEY_PREFIX = "timeline-pro-item-positions"`

---

## Key Implementation Details

### File Structure & Responsibilities

- **Base Row Calculation**: `src/functions/getDefaultRowFor.js` - Deterministic base row calculation
- **Position Resolution**: `src/functions/resolveItemPositions.js` - Applies row/lane model
- **Drag Handling**: `src/functions/draggableMouseHandlers.js` - Mouse event handlers
- **Store**: `src/store/useZustand.js` - Central state management
- **Persistence**: `src/functions/saveItemPositionsToStorage.js` - Storage integration
- **Migration**: `src/functions/migrateLegacyYDeltaToRowShift.js` - Converts legacy data

### Storage Structure

```json
{
  "boardId": "...",
  "customItemY": {
    "itemId1": { "rowShift": 2, "laneOffset": 5 },
    "itemId2": { "rowShift": -1, "laneOffset": -8 }
  },
  "positionSetting": "above" // or "below" or "alternate"
}
```

### Key Advantages of Row/Lane Shift Model

1. **Stability Across Settings**: Row shifts maintain relative positioning even when changing between "above", "below", and "alternate" settings
2. **Zoom Resistance**: Integer-based row model remains stable regardless of zoom level or scale changes
3. **Predictable Bounds**: Row-based model makes it easy to clamp values within sensible ranges
4. **Fine-Grained Control**: Lane offsets provide pixel-level adjustments for perfect positioning
5. **Migration Support**: Legacy Y-delta values can be automatically converted to the new model

---

## Debugging Tips

- Row/lane values are stored in the Zustand store as `customItemY`
- Row shifts and lane offsets are applied in `resolveItemPositions.js`
- Final pixel positions are calculated as `finalY = (baseRow + rowShift) * LANE_HEIGHT + laneOffset`
- Check the TimelineLogger for debug information on position calculations
- For migration issues, check `migrateLegacyYDeltaToRowShift.js` logs

## Troubleshooting Common Issues

### Items Jumping During Drag

If timeline items jump or behave erratically when dragged, try these solutions:

1. **Fix Initial Position Capture**
   
   The most common cause of jumping is incorrect position capture at drag start. In `createHandleMouseDown` in `draggableMouseHandlers.js`:

   ```javascript
   // PROBLEM: Incomplete transform extraction
   const translateYMatch = transform.match(/translateY\(([^)]+)\)/);
   
   // SOLUTION: Enhanced transform extraction
   const currentStyles = window.getComputedStyle(currentElement);
   const matrix = new DOMMatrixReadOnly(currentStyles.transform);
   currentVisualY = matrix.m42; // Get the exact Y translation from the matrix
   
   // OR use a more reliable method to get all transforms:
   const transform = currentElement.style.transform;
   const allTransforms = {};
   
   // Extract translateY more reliably
   const translateYMatch = transform.match(/translateY\(([^)]+)\)/);
   if (translateYMatch && translateYMatch[1]) {
     const value = translateYMatch[1];
     allTransforms.translateY = parseFloat(value);
     currentVisualY = allTransforms.translateY;
   }
   ```

### Items Jump On Second Drag

If items specifically jump when clicked a second time (first drag works fine, but subsequent drags cause jumping):

1. **Position Reset Issue**

   This is typically caused by a mismatch between the visual position (CSS transform) and the React state position. After the first drag ends, the visual position is correct, but on the second drag, the code might be calculating from the wrong baseline.

   ```javascript
   // PROBLEM: In createHandleMouseDown, using position from state which might be stale
   dragOffset.current = {
     x: position?.x || 0,
     y: position?.y || 0,
   };
   
   // SOLUTION: Always get the ACTUAL current visual position
   const currentElement = e.currentTarget;
   
   // Get computed transform matrix
   const computedStyle = window.getComputedStyle(currentElement);
   const transformMatrix = new DOMMatrixReadOnly(computedStyle.transform);
   const currentVisualY = transformMatrix.m42; // Extract Y translation
   
   // Use this as the starting point
   dragOffset.current = {
     x: position?.x || 0,
     y: currentVisualY, // <-- Use actual visual position, not state
   };
   
   // Store visual position for debugging
   if (currentElement) {
     currentElement.dataset.lastVisualY = currentVisualY;
     currentElement.dataset.dragStartY = e.clientY;
   }
   ```

2. **State Synchronization Fix**

   Ensure state is properly updated at the end of each drag:

   ```javascript
   // In createHandleMouseUp
   // PROBLEM: Position updates might be out of sync
   
   // SOLUTION: Always sync visual position to state at drag end
   const draggableElement = document.querySelector(".dragging");
   if (draggableElement) {
     // Get the current visual transform
     const computedStyle = window.getComputedStyle(draggableElement);
     const transformMatrix = new DOMMatrixReadOnly(computedStyle.transform);
     const finalVisualY = transformMatrix.m42;
     
     // Ensure the state position matches the final visual position
     const finalPosition = {
       x: position?.x || 0,
       y: finalVisualY
     };
     
     // Set state position and call position change handler
     if (onPositionChange && item?.id) {
       onPositionChange(item.id, finalPosition, true);
     }
     
     // Log the sync for debugging
     console.log('Syncing final position', { 
       itemId: item?.id,
       visualY: finalVisualY,
       stateY: position?.y
     });
   }
   ```

3. **React State vs. DOM Updates**

   React state updates might not be reflected in the DOM immediately:

   ```javascript
   // PROBLEM: React position state and DOM might get out of sync
   
   // SOLUTION: Use a ref to track the latest visual position
   // In your component:
   const lastVisualPositionRef = useRef({ x: 0, y: 0 });
   
   // In createHandleMouseUp:
   if (draggableElement) {
     // Get the current visual position
     const computedStyle = window.getComputedStyle(draggableElement);
     const transformMatrix = new DOMMatrixReadOnly(computedStyle.transform);
     const finalVisualY = transformMatrix.m42;
     
     // Store it in a ref for direct access on next drag
     lastVisualPositionRef.current = {
       x: position?.x || 0,
       y: finalVisualY
     };
     
     // Then in createHandleMouseDown, use this ref value:
     dragOffset.current = {
       x: position?.x || 0,
       y: lastVisualPositionRef.current.y, // Use the stored visual position
     };
   }
   ```

4. **Complete Drag Reset Fix**

   If all else fails, add this comprehensive fix to `createHandleMouseDown`:

   ```javascript
   export const createHandleMouseDown = ({
     dragStartPos,
     dragOffset,
     setIsDragging,
     handleMouseMove,
     handleMouseUp,
     position,
   }) => {
     return (e) => {
       // Only start drag on primary mouse button
       if (e.button !== 0) return;
       
       // Stop event propagation and prevent default
       e.preventDefault();
       e.stopPropagation();
       
       // Get the current element
       const currentElement = e.currentTarget;
       
       // ===== CRITICAL FIX FOR SECOND DRAG JUMPING =====
       // Always get the ACTUAL current transform position
       let currentVisualY = 0;
       
       if (currentElement) {
         // Try to get the transform from style attribute first
         const elementTransform = currentElement.style.transform;
         const translateYMatch = elementTransform.match(/translateY\(([^)]+)\)/);
         
         if (translateYMatch && translateYMatch[1]) {
           // Found inline transform
           currentVisualY = parseFloat(translateYMatch[1]);
           console.log('Using inline transform Y:', currentVisualY);
         } else {
           // Fall back to computed style
           const computedStyle = window.getComputedStyle(currentElement);
           try {
             const matrix = new DOMMatrixReadOnly(computedStyle.transform);
             currentVisualY = matrix.m42;
             console.log('Using computed matrix Y:', currentVisualY);
           } catch (err) {
             // If matrix fails, try element position directly
             currentVisualY = currentElement.offsetTop;
             console.log('Using offsetTop:', currentVisualY);
           }
         }
       }
       
       // Store pointer start position
       dragStartPos.current = {
         x: e.clientX,
         y: e.clientY,
       };
       
       // ALWAYS use the visual position, not the React state
       dragOffset.current = {
         x: position?.x || 0,
         y: currentVisualY || position?.y || 0,
       };
       
       // Debug: store values on the element for inspection
       if (currentElement) {
         currentElement.dataset.dragStartVisualY = currentVisualY;
         currentElement.dataset.dragStartClientY = e.clientY;
         currentElement.dataset.dragOffsetY = dragOffset.current.y;
       }
       
       // Add dragging class and set up handlers
       if (currentElement) {
         currentElement.classList.add('dragging');
       }
       
       document.addEventListener('mousemove', handleMouseMove);
       document.addEventListener('mouseup', handleMouseUp, { once: true });
       
       setIsDragging(true);
     };
   };
   ```

These solutions directly target the issue where items jump on the second drag attempt. The core problem is typically a mismatch between the visual position (what you see) and the position stored in React state or refs.

---

This README reflects the complete source of truth for the Row/Lane Shift positioning system. The legacy Y-delta system has been fully replaced with this more robust approach.

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
