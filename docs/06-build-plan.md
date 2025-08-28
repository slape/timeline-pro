## Common gotchas (read before coding)

Enforce the 15 item cap before fetching/normalizing to keep the app fast and logic simple.

Treat positions as app storage only; never write positional data to board columns.

Editing dates must be optimistic but reversible on API error.

Keep IDs as strings everywhere to prevent subtle type coercion bugs.

Always subscribe to monday listeners before doing any reads that depend on them.

## Build Plan

Add deps:

pnpm add zustand immer framer-motion
pnpm add html-to-image
pnpm add zod                          # optional runtime validation
pnpm add -D @types/html-to-image vitest @testing-library/react jsdom

DoD: lockfile updated; app still runs.

---

## Project skeleton & types

Create structure per 05-project-structure.md (folders: types/, lib/, store/, hooks/, components/).

Types: Copy TS interfaces from 00-system-context.md into src/types/monday.ts and src/types/app.ts.

DoD: TypeScript compiles with no errors.

---

## Zustand store

store/index.ts: configure store with immer + subscribeWithSelector middleware.

Slices: implement contextSlice.ts, settingsSlice.ts, itemsSlice.ts, uiSlice.ts as per interfaces.

selectors.ts: add selectors: visibleItems, hiddenSet, byId helpers.

DoD: simple unit test creates store, sets settings, upserts item.

---

## monday SDK client & listeners

lib/mondayClient.ts: wrap SDK init and monday.listen calls for context, settings, itemIds.

hooks/useMondayContext.ts: on mount, subscribe to context → setContext({ theme, user }).

hooks/useSettingsListener.ts: subscribe to settings → validate to TimelineSettings (zod optional) → setSettings.

hooks/useItemIdsListener.ts: subscribe to itemIds; if > ITEM_CAP (15) set global error and abort; else store itemIds in a ref/state for fetch step.

DoD: Console logs show listeners firing inside monday shell (or mocked locally).

---

## Minimal monday API + normalization

lib/mondayApi.ts: add two functions:

fetchItems(itemIds: string[], columnId: string) → GraphQL for name, group{id,title,color}, column_values{id,value} filtered to the selected date column.

updateItemDate(itemId: string, columnId: string, iso: string) → GraphQL mutation. (Use the monday SDK monday.api(query) under the hood; leave TODOs if token wiring is needed.)

hooks/useBoardItems.ts: when itemIds and settings.dateColumn are ready → fetch → map to TimelineItem using dates.ts.

lib/dates.ts: implement parseDate(value, format) and formatDate(date, format) for mdyy|md|mdy.

DoD: With mock data, TimelineItem[] appears in store with parsed dates.

---

## App storage (positions, hidden, settings)

lib/storage.ts: implement helpers using monday app storage:

getSettings(boardId), setSettings(boardId, partial)

getPositions(boardId, ids[]) → returns map of {itemId: { yDelta, laneId? }}

setPosition(boardId, itemId, patch)

getHidden(boardId), setHidden(boardId, ids: string[])

hooks/usePositionsPersistence.ts: on mount (when boardId known), load all positions for current itemIds; subscribe to itemsSlice changes and persist.

hooks/useHiddenItems.ts: load and persist the hidden array under tp:hidden:{boardId}.

DoD: Reloading the app restores positions and hidden state.

---

## App.tsx: mount guards and layout:

AdminGuard (block if !context.user.isAdmin).

ErrorBanner (too many items, API/storage errors).

Toolbar and SettingsPanel toggle.

TimelineCanvas placeholder.

styles: add CSS vars for light/dark based on context.theme.

DoD: Shell renders with theme class and responsive layout.

---

## Timeline rendering

components/Timeline/TimelineCanvas.tsx: compose Grid, optional Ledger, Title, and a list of Item components.

components/Timeline/Grid.tsx: render scale (day|week|month|quarter|year) and date headers per settings.

components/Timeline/ItemLabel.tsx: show name and a small group color chip.

DoD: Items render in approximate positions (no drag yet), headers respect settings.

---

## Drag & drop positioning

lib/layout.ts: implement snapY, computeYDelta(prev, dropY, stepPx) and optional collision ladder [0, 24, 48,…].

components/Timeline/Item.tsx: make item vertically draggable (Framer Motion):

On onDragEnd, compute new yDelta → updatePosition(id, { yDelta }) → persist via usePositionsPersistence.

Include Hide action.

components/Timeline/ItemDragHandle.tsx: a dedicated handle to drag.

DoD: Dragging updates visual position; refresh restores the offset.

---

## Hidden items

components/HiddenItemsPanel/: list hidden items with unhide toggle.

Toolbar/HiddenItemsButton.tsx: opens panel; show count badge.

DoD: Hide → item disappears and id recorded; Unhide → returns; state survives refresh.

---

## Settings live updates

components/Toolbar/SettingsButton.tsx + SettingsPanel/ controls mapped to TimelineSettings fields (position, scale, shape, ledger, title/titleText, dateFormat, date column selector).

Persist on change to app storage; re-render timeline immediately.

DoD: Changing any setting updates the view without reload and persists across sessions.

---

## Edit date & board write‑back

components/Timeline/ItemDateEditor.tsx: inline date picker (respect dateFormat).

On change: optimistic update → call updateItemDate → on success keep; on failure roll back and toast error.

Recompute item position based on new date.

DoD: Date edit moves the item; board column reflects new date; errors roll back.

---

## Download timeline graphic

lib/exportImage.ts: implement exportTimeline(elem, { type: 'png'|'svg' }) using html-to-image (or SVG serialization if canvas-based).

Toolbar/DownloadButton.tsx: selects the root element and calls export.

DoD: Clicking download produces a file matching visible state (theme, ledger, hidden filtered).

---

## Guards, errors, and edge cases

AdminGuard.tsx: read context.user.isAdmin; show friendly message if false.

Too many items: If itemIds.length > 15, render <ErrorBanner> with resolution steps.

Resilience: Handle missing/invalid dateColumn with a guided error to set one.

DoD: App never crashes on bad input; helpful messages appear.

---


