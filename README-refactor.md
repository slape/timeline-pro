# MIGRATION: Y-Delta → Row/Lane Shift

A step-by-step plan to replace fragile “`finalY = defaultY + yDelta`” logic with a robust **Row/Lane Shift (+ optional small offset)** model.

> Goal: Stop jumpy drags and ensure stable persistence across zoom, font/layout changes, and `above|below|alternate` position settings.

---

## Contents

- [Overview](#overview)
- [Phase 0 — Prep](#phase-0--prep)
- [Phase 1 — Core Types & Utilities](#phase-1--core-types--utilities)
- [Phase 2 — Store Shape & Actions](#phase-2--store-shape--actions)
- [Phase 3 — Persistence (Save/Load + Migration Hook)](#phase-3--persistence-saveload--migration-hook)
- [Phase 4 — Migration: Legacy `yDelta` → Row/Lane Shift](#phase-4--migration-legacy-ydelta--rowlane-shift)
- [Phase 5 — Position Resolution (Render)](#phase-5--position-resolution-render)
- [Phase 6 — Drag Component](#phase-6--drag-component)
- [Phase 7 — Timeline Integration](#phase-7--timeline-integration)
- [Phase 8 — Remove Legacy & Cleanup](#phase-8--remove-legacy--cleanup)
- [Phase 9 — QA Checklist](#phase-9--qa-checklist)
- [Phase 10 — Rollout](#phase-10--rollout)
- [Tips & Common Pitfalls](#tips--common-pitfalls)

---

## Overview

**Old model:** Persist a pixel `yDelta` from a recomputed `defaultY`.  
**Problem:** The baseline (`defaultY`) moves with settings/scale; deltas misapply → jumps.

**New model:** Persist **rowShift** (integer) from the item’s **base row** for the current setting, plus a tiny **laneOffset** (px) within the row.

- Stable across `above|below|alternate` (no baseline mismatch).
- Robust to zoom & layout.
- Easy to clamp and reason about.

**Data shape:**

```ts
type ItemY = { rowShift: number; laneOffset?: number }; // laneOffset is optional and small (e.g., ±12px)
customItemY: Record<ItemId, ItemY>;
```

---

## Phase 0 — Prep

1. **Feature branch**

```bash
git checkout -b feat/row-lane-shift
```

2. **(Optional) Feature flag**
   Create a toggle (e.g., `ROW_LANE_SHIFT_ENABLED = true`) to switch new vs. old behavior during QA.

3. **Add constants** (`src/configConstants.js`)

```js
export const LANE_HEIGHT = 40; // match your card height/row pitch
export const OFFSET_MAX = 12; // small nudge range; use 0 to disable initially
export const MIN_ROW = -10; // sensible bounds
export const MAX_ROW = 200; // sensible bounds
```

---

## Phase 1 — Core Types & Utilities

4. **Deterministic base row helper** (`src/functions/getDefaultRowFor.js`)

```js
export function getDefaultRowFor(item, positionSetting) {
  // Replace with your real default-row logic for above/below/alternate.
  // Must be deterministic per item+setting.
  if (positionSetting === "alternate") {
    const hash = Math.abs(hashCode(String(item.id)));
    return hash % 2 === 0 ? 0 : 1; // example; replace with your current algorithm
  }
  if (positionSetting === "above") return 0; // example
  if (positionSetting === "below") return 3; // example
  return 0;
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++)
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return h;
}
```

5. **Clamp util** (`src/functions/clamp.js`)

```js
export const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
```

---

## Phase 2 — Store Shape & Actions

6. **Zustand store** (`src/store/useZustand.js`)

```js
const initialState = {
  customItemY: {}, // { [itemId]: { rowShift: number, laneOffset?: number } }
  itemPositionsLoaded: false,
  itemPositionsError: null,
  currentPositionSetting: "above", // keep if already present
};

const useStore = create((set, get) => ({
  ...initialState,

  saveCustomItemY: (itemId, payload) =>
    set((s) => ({ customItemY: { ...s.customItemY, [itemId]: payload } })),

  setCustomItemYBulk: (map) => set(() => ({ customItemY: map })),

  setItemPositionsLoaded: (val) => set({ itemPositionsLoaded: val }),
  setItemPositionsError: (err) => set({ itemPositionsError: err }),
}));

export default useStore;
```

> Keep legacy fields temporarily if still referenced; remove them in [Phase 8](#phase-8--remove-legacy--cleanup).

---

## Phase 3 — Persistence (Save/Load + Migration Hook)

7. **Save (new schema)** (`src/functions/saveItemPositionsToStorage.js`)

```js
import { ITEM_POSITIONS_KEY_PREFIX } from "../configConstants";

export async function saveItemPositionsToStorage(boardId, customItemY) {
  const key = `${ITEM_POSITIONS_KEY_PREFIX}-${boardId}`;
  const payload = { boardId, customItemY }; // NEW schema
  return monday.storage.instance.setItem(key, JSON.stringify(payload));
}
```

8. **Load (new + legacy support)** (`src/functions/loadItemPositionsFromStorage.js`)

```js
import { ITEM_POSITIONS_KEY_PREFIX } from "../configConstants";

export async function loadItemPositionsFromStorage(boardId) {
  const key = `${ITEM_POSITIONS_KEY_PREFIX}-${boardId}`;
  const res = await monday.storage.instance.getItem(key);
  if (!res?.data?.value) return { customItemY: {}, legacy: null };

  const parsed = JSON.parse(res.data.value);

  // New schema
  if (parsed.customItemY)
    return { customItemY: parsed.customItemY, legacy: null };

  // Legacy schema (yDelta)
  if (parsed.customItemYDelta) {
    return {
      customItemY: {},
      legacy: {
        customItemYDelta: parsed.customItemYDelta,
        positionSetting: parsed.positionSetting, // may exist
      },
    };
  }

  return { customItemY: {}, legacy: null };
}
```

9. **Initialize on app load** (`src/functions/initializeItemPositions.js`)

```js
import useStore from "../store/useZustand";
import { loadItemPositionsFromStorage } from "./loadItemPositionsFromStorage";

export async function initializeItemPositions(boardId) {
  const { setCustomItemYBulk, setItemPositionsLoaded, setItemPositionsError } =
    useStore.getState();
  try {
    const { customItemY, legacy } = await loadItemPositionsFromStorage(boardId);
    setCustomItemYBulk(customItemY);

    // Stash legacy for a one-time migration when items + setting are known
    if (legacy) {
      window.__LEGACY_YDELTA__ = legacy;
      console.info(
        "[YPos] Legacy deltas found; will migrate after items are ready."
      );
    }

    setItemPositionsLoaded(true);
  } catch (e) {
    console.error(e);
    setItemPositionsError(String(e?.message || e));
  }
}
```

---

## Phase 4 — Migration: Legacy `yDelta` → Row/Lane Shift

10. **Migration util** (`src/functions/migrateLegacyYDeltaToRowShift.js`)

```js
import useStore from "../store/useZustand";
import { getDefaultRowFor } from "./getDefaultRowFor";
import { clamp } from "./clamp";
import { LANE_HEIGHT, OFFSET_MAX, MIN_ROW, MAX_ROW } from "../configConstants";
import { saveItemPositionsToStorage } from "./saveItemPositionsToStorage";

// Call this once when items + current setting are available (e.g., Timeline mount)
export async function migrateLegacyYDeltaToRowShift({
  boardId,
  items,
  positionSetting,
}) {
  const legacy = window.__LEGACY_YDELTA__;
  if (!legacy?.customItemYDelta) return;

  const map = {};
  for (const item of items) {
    const yDelta = legacy.customItemYDelta[item.id];
    if (typeof yDelta !== "number") continue;

    const baseRow = getDefaultRowFor(item, positionSetting);

    // If you can access defaultY for each item, prefer:
    // const targetY = defaultY + yDelta;
    // For a minimal migration (approx), assume yDelta translates to rows from base:
    const proposedYFromBase = yDelta; // interpret delta in px relative to base row
    const proposedRow = Math.round(proposedYFromBase / LANE_HEIGHT) + baseRow;

    const row = clamp(proposedRow, MIN_ROW, MAX_ROW);
    const rowShift = row - baseRow;
    const laneBaseY = row * LANE_HEIGHT;
    const laneOffset = clamp(
      proposedYFromBase - rowShift * LANE_HEIGHT,
      -OFFSET_MAX,
      OFFSET_MAX
    );

    map[item.id] = { rowShift, laneOffset };
  }

  useStore.getState().setCustomItemYBulk(map);
  await saveItemPositionsToStorage(boardId, map);
  window.__LEGACY_YDELTA__ = null;
  console.info("[YPos] Legacy deltas migrated to rowShift.");
}
```

> **Accuracy note:** If you can compute `targetY = defaultY + yDelta` during migration, do it—then derive `rowShift/laneOffset` from `targetY` for pixel-perfect results.

---

## Phase 5 — Position Resolution (Render)

11. **Resolver** (`src/functions/resolveItemPositions.js`)

```js
import { getDefaultRowFor } from "./getDefaultRowFor";
import { clamp } from "./clamp";
import { LANE_HEIGHT, OFFSET_MAX, MIN_ROW, MAX_ROW } from "../configConstants";

export function resolveItemPositions({ items, positionSetting, customItemY }) {
  return items.map((item) => {
    const baseRow = getDefaultRowFor(item, positionSetting);
    const override = customItemY[item.id] || { rowShift: 0, laneOffset: 0 };

    const row = clamp(baseRow + (override.rowShift || 0), MIN_ROW, MAX_ROW);
    const laneOffset = clamp(override.laneOffset || 0, -OFFSET_MAX, OFFSET_MAX);
    const finalY = row * LANE_HEIGHT + laneOffset;

    return {
      ...item,
      finalY,
      isCustomPosition: !!customItemY[item.id],
    };
  });
}
```

---

## Phase 6 — Drag Component

12. **`DraggableBoardItem.jsx` (pseudocode – adapt to your component)**

```jsx
import { getDefaultRowFor } from "../../functions/getDefaultRowFor";
import { clamp } from "../../functions/clamp";
import { LANE_HEIGHT, OFFSET_MAX } from "../../configConstants";
import useStore from "../../store/useZustand";

function DraggableBoardItem({ item, scale, currentPositionSetting, boardId }) {
  const saveCustomItemY = useStore((s) => s.saveCustomItemY);
  const customItemY = useStore(
    (s) => s.customItemY[item.id] || { rowShift: 0, laneOffset: 0 }
  );

  const dragRef = useRef(null);
  const visualYRef = useRef(0);
  const elRef = useRef(null);

  const onDragStart = (e) => {
    const baseRow = getDefaultRowFor(item, currentPositionSetting);
    const startRow = baseRow + (customItemY.rowShift || 0);
    const startLaneOffset = customItemY.laneOffset || 0;

    dragRef.current = {
      pointerYStart: getPointerY(e),
      baseRow,
      startRow,
      startLaneOffset,
      laneHeight: LANE_HEIGHT,
      scaleSnapshot: scale,
    };

    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onDragMove = (e) => {
    const s = dragRef.current;
    if (!s) return;

    const dyScreen = getPointerY(e) - s.pointerYStart;
    const dyTimeline = dyScreen / s.scaleSnapshot; // convert once to timeline units

    const startY = s.startRow * s.laneHeight + s.startLaneOffset;
    const proposedY = startY + dyTimeline;

    // Snap to the nearest row + small offset
    const proposedRow = Math.round(proposedY / s.laneHeight);
    const laneY = proposedRow * s.laneHeight;
    const laneOffset = clamp(proposedY - laneY, -OFFSET_MAX, OFFSET_MAX);

    visualYRef.current = laneY + laneOffset;

    requestAnimationFrame(() => {
      if (elRef.current)
        elRef.current.style.transform = `translateY(${visualYRef.current}px)`;
    });
  };

  const onDragEnd = () => {
    const s = dragRef.current;
    if (!s) return;

    const finalY = visualYRef.current ?? 0;
    const finalRow = Math.round(finalY / s.laneHeight);
    const rowShift = finalRow - s.baseRow;
    const laneOffset = clamp(
      finalY - finalRow * s.laneHeight,
      -OFFSET_MAX,
      OFFSET_MAX
    );

    saveCustomItemY(item.id, { rowShift, laneOffset }); // optimistic store write
    // Debounced persistence elsewhere writes `customItemY` for the boardId
    dragRef.current = null;
  };

  return (
    <div
      ref={elRef}
      onPointerDown={onDragStart}
      onPointerMove={onDragMove}
      onPointerUp={onDragEnd}
      // ...rest
    >
      {/* render item */}
    </div>
  );
}

function getPointerY(e) {
  return e.clientY ?? e.touches?.[0]?.clientY ?? 0;
}
```

**Key rules**

- Freeze `baseRow`, `scale`, `laneHeight` on drag start.
- Convert to timeline units **once** (`dyScreen / scaleSnapshot`).
- Paint with `transform` in RAF during move; **persist only on end**.

---

## Phase 7 — Timeline Integration

13. **Use resolver and run migration once items are ready** (`src/components/timeline/Timeline.jsx`)

```jsx
useEffect(() => {
  if (sdkReady && boardId) initializeItemPositions(boardId);
}, [sdkReady, boardId]);

useEffect(() => {
  if (!itemsReady || !boardId) return;
  if (window.__LEGACY_YDELTA__) {
    migrateLegacyYDeltaToRowShift({
      boardId,
      items,
      positionSetting: currentPositionSetting,
    });
  }
}, [itemsReady, boardId, currentPositionSetting]);

// When rendering:
const resolved = resolveItemPositions({
  items,
  positionSetting: currentPositionSetting,
  customItemY,
});
```

> You do **not** need to reset when `positionSetting` changes; Row/Lane Shift remains valid.  
> If you prefer reset-on-change, clear `customItemY` in a `useEffect` on setting change.

---

## Phase 8 — Remove Legacy & Cleanup

14. **Delete legacy code paths**

- Remove:
  - `customItemYDelta`, `saveCustomItemYDelta`, `{x,y}` absolute persistence
  - Any `finalY = defaultY + yDelta` logic
  - Legacy helpers relying on absolute Y

15. **Write back new schema**

- After QA/migration, ensure only `{ boardId, customItemY }` is saved.

---

## Phase 9 — QA Checklist

- Drag items at 100%, 125%, 150% zoom — smooth, no jump on release.
- Toggle `above ↔ below ↔ alternate` — **no jump**; arrangement remains sensible.
- Refresh — positions persist.
- Resize window — no snap.
- Fast repeated drags — no flicker or snap-back.
- Optional: temporarily `console.info` at drag start/end, resolver, loader, migration to confirm `baseRow`, `rowShift`, `laneOffset`, `finalY`.

---

## Phase 10 — Rollout

- Keep the feature flag for one release to allow quick rollback if needed.
- Monitor logs; once stable, remove the flag and legacy code entirely.

---

## Tips & Common Pitfalls

- **One coordinate space:** convert pointer deltas to **timeline units** once; never mix with screen px afterwards.
- **Freeze inputs:** snapshot `baseRow`, `scale`, and `laneHeight` on drag start—don’t read them live during drag.
- **Paint-only during move:** `transform` via `requestAnimationFrame`; no store writes on move.
- **Deterministic defaults:** `getDefaultRowFor` must not depend on mutable UI state; make it stable for a given item + setting.
- **Clamp early:** bound rows and offsets before saving to keep persisted state valid.

---

**Done!** This migration removes the moving-baseline problem entirely and makes your vertical positioning stable, predictable, and easy to maintain.
