```
timeline-pro/
└─ src/
├─ main.tsx # app bootstrap
├─ App.tsx # top-level layout + guards
│
├─ types/
│ ├─ monday.ts # MondayContextMinimal, BoardItem, Group, ColumnValue, etc.
│ └─ app.ts # TimelineItem, TimelineSettings, PositionPatch, StoreState
│
├─ constants/
│ ├─ limits.ts # ITEM_CAP = 15
│ ├─ storageKeys.ts # posKey(), HIDDEN_KEY, SETTINGS_KEY
│ └─ ui.ts # zIndex, drag thresholds, default sizes
│
├─ lib/ # small, pure helpers
│ ├─ mondayClient.ts # SDK bootstrap + listen wrappers (context, settings, itemIds)
│ ├─ mondayApi.ts # minimal GraphQL helper to fetch item fields
│ ├─ storage.ts # read/write app storage (positions, hidden, settings)
│ ├─ dates.ts # parse/format per DateFormat; clamp/snap utilities
│ ├─ layout.ts # compute yDelta/lane, collision policies, snap
│ ├─ exportImage.ts # html-to-image/svg export for Download
│ └─ error.ts # AppError, toasts helpers
│
├─ store/ # Zustand with slices
│ ├─ index.ts # createStore + middleware (immer/subscribeWithSelector)
│ ├─ contextSlice.ts # setContext(context)
│ ├─ settingsSlice.ts # setSettings(partial)
│ ├─ itemsSlice.ts # upsertItems([]), updatePosition(id, {yDelta,laneId})
│ ├─ uiSlice.ts # global error/loading flags
│ └─ selectors.ts # memo selectors (visibleItems, hiddenSet, etc.)
│
├─ hooks/
│ ├─ useAdminGate.ts # ensure context.user.isAdmin
│ ├─ useMondayContext.ts # subscribe to monday.listen("context")
│ ├─ useSettingsListener.ts # subscribe to monday.listen("settings")
│ ├─ useItemIdsListener.ts # subscribe to monday.listen("itemIds") + enforce ITEM_CAP
│ ├─ useBoardItems.ts # fetch minimal fields for itemIds + normalize to TimelineItem
│ ├─ usePositionsPersistence.ts# load/save tp:pos:{boardId}:{itemId}
│ ├─ useHiddenItems.ts # load/save tp:hidden:{boardId}
│ └─ useDownloadTimeline.ts # orchestrates exportImage.ts for PNG/SVG
│
├─ components/
│ ├─ AdminGuard.tsx # shows upgrade/permission message if not admin
│ ├─ ErrorBanner.tsx
│ ├─ Toolbar/
│ │ ├─ Toolbar.tsx
│ │ ├─ HiddenItemsManagerButton.tsx
│ │ └─ DownloadButton.tsx
TimelineSettings; writes to app storage
│ │ ├─ ScaleSelect.tsx
│ │ ├─ PositionSelect.tsx # above/below/alternate
│ │ ├─ ShapeSelect.tsx # circle/rectangle
│ │ ├─ LedgerToggle.tsx
│ │ ├─ DateColumnSelect.tsx # uses settings.dateColumn
│ │ └─ DateFormatSelect.tsx
│ ├─ HiddenItemsPanel/
│ │ ├─ HiddenItemsManager.tsx #modal
│ │ └─ HiddenItemRow.tsx
│ └─ Timeline/
│ ├─ TimelineCanvas.tsx # main renderer; grid + items; reads settings & store
│ ├─ Grid.tsx # scale/day|week|month lines; ledger rendering
│ ├─ Ledger.tsx
│ ├─ Title.tsx
│ ├─ Item.tsx # draggable; applies yDelta; hide/unhide button
│ ├─ ItemLabel.tsx # name formatting; group color chip
│ ├─ ItemDateEditor.tsx # inline date edit -> write to board column
│ └─ ItemDragHandle.tsx # vertical drag control (Framer Motion or Pointer events)
│
├─ unit/
│ ├─ layout.spec.ts # yDelta/snap/collision
│ ├─ dates.spec.ts # date parse/format
│ └─ storage.spec.ts # app storage i/o
└─ e2e/
├─ load-and-cap.spec.ts # enforce ≤15 items
├─ drag-persist.spec.ts # position saves & restores
├─ settings-live.spec.ts # settings update re-renders
└─ edit-date.spec.ts # board write + optimistic UI
```

## Component responsibilities (key ones)

**TimelineCanvas**: Compose Grid, Ledger, and Item list. Reads settings, visibleItems, and applies theme. Subscribes to store selectors.

**Item**: Draggable vertical element; on drag end → compute snapped yDelta via lib/layout.ts; call updatePosition and persist.

**ItemDateEditor**: Date picker; on change → write to selected date column through lib/mondayApi.ts with optimistic update/rollback.

**HiddenItemsManager**: List of hidden ids; toggles state via useHiddenItems.

**Toolbar**: HiddenItemsButton, DownloadButton.

## Hooks orchestration

- **useAdminGate** → blocks if !context.user.isAdmin.

- **useMondayContext**/**useSettingsListener**/**useItemIdsListener** → hydrate store from SDK.

- **useBoardItems** → fetch minimal fields for itemIds (name, group, date column) → normalize to TimelineItem.

- **usePositionsPersistence** → on mount: read all tp:pos:{boardId}:{itemId} and merge; on change: save.

- **useHiddenItems** → read/update tp:hidden:{boardId} array.

- **useDownloadTimeline** → capture TimelineCanvas → PNG/SVG via lib/exportImage.ts.

## Key utilities

**layout.ts**: snapY(y: number, stepPx: number), computeYDelta(prev: number, dropY: number, stepPx: number), optional collision ladder [0, 24, 48,…].

**dates.ts**: parseDate(value, format), formatDate(date, format), shiftToScale(date, scale).

**storage.ts**: getSettings(boardId), setSettings(boardId, partial), getPositions(boardId, ids[]), setPosition(boardId, itemId, patch).

**mondayApi.ts**: fetchItems(itemIds, fields), updateItemDate(itemId, columnId, iso).

**exportImage.ts**: exportTimeline(elem, { type: 'png'|'svg' }).

## Styling/theme

- Read context.theme and expose CSS vars (--tp-bg, --tp-fg, --tp-grid) for light/dark. Shape styles (circle/rectangle) via BEM classes.

## Integration notes

- Enforce ITEM_CAP early in **useItemIdsListener** → set global error → render <TooManyItems/> state.

- Persist positions & settings immediately on change; debounce only if necessary.

- Only fetch minimal board fields to keep loads snappy.

## Suggested dependencies

- Zustand, immer, subscribe-with-selector

- Framer Motion (drag) or Pointer events

- html-to-image (export) or SVG serialization

- Zod/Valibot for runtime validation (optional)