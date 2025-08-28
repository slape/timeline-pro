# User Stories — Timeline‑Pro

> IDs use the pattern **TP-US-###**.

---


## TP-US-001 — Load & Render Selected Items (≤15)
**Story**: As a user, I want the app to load all of the selected items from my board onto the timeline so I can adjust the positioning and apply final visual tweaks.


**Acceptance Criteria**
- **Given** the board view is open and the monday SDK provides `itemIds` via `monday.listen("itemIds")`
**When** `itemIds.length ≤ 15`
**Then** the app fetches minimal fields (`name`, `group`, selected date column) for each item and renders them on the timeline.
- **Given** `itemIds.length > 15`
**When** the view loads
**Then** the app shows a clear error state and does not render the timeline.

**Notes/Edges**
- Only minimal fields are fetched for speed. Admin-only usage enforced via context.

---


## TP-US-002 — Live Settings Apply
**Story**: As a user, I want to change any of the settings and have the timeline update immediately.

**Acceptance Criteria**
- **Given** `monday.listen("settings")` updates with a new `TimelineSettings`
**When** any setting (e.g., `dateColumn`, `dateFormat`, `position`, `scale`, `shape`, `ledger`, `title`/`titleText`) changes
**Then** the timeline re-computes layout and re-renders without a full reload.
- **And** the new settings are persisted to app storage for the current board.

**Notes/Edges**
- Changing `dateColumn` triggers re-parse of item dates → items may move.


---


## TP-US-003 — Drag Vertical Positioning
**Story**: As a user, I want to drag a timeline item up or down to position it nicely among the other items.


**Acceptance Criteria**
- **Given** a rendered item
**When** the user drags vertically and releases
**Then** the item’s internal `laneId` updates in the Zustand store and persists to app storage.
- The visual position is restored on refresh.

**Notes/Edges**
- Lanes are internal-only but should be saved to monday storage and retrieved on reload.


---


## TP-US-004 — Hide an Item
**Story**: As a user, I want to hide a timeline item if I choose.


**Acceptance Criteria**
- **Given** a visible item
**When** the user clicks a small 'X' button
**Then** the item disappears from the timeline and its id is added to the board’s hidden id set in app storage.


**Notes/Edges**
- Hidden ids are saved to monday storage so they can persist across refreshes.
- Items hidden at the begining or end of the timeline will cause the other items to shift and the scale of the timeline to adjust.


---


## TP-US-005 — Unhide Items
**Story**: As a user, I want to un-hide any previously hidden items.


**Acceptance Criteria**
- **Given** one or more items are hidden
**When** the user opens **Hidden Items** modal and unchecks an item
**Then** that item reappears and its id is removed from the hidden set in storage.

**Notes/Edges**
- if the unhidden item is now the first item in the set, the timeline scale should adjust and all of the other items should adjust accordingly

---


## TP-US-006 — Download Timeline Graphic
**Story**: As a user, I want to download a graphic of the timeline I’ve created.


**Acceptance Criteria**
- **Given** a rendered timeline
**When** the user clicks **Download**
**Then** the app exports the timeline as an image (PNG or SVG) with current theme/background and prompts a file download.
- Export includes title (if enabled), ledger (if enabled), and all visible items (excluding hidden ones).


**Notes/Edges**
- Large canvases should scale to fit while maintaining readable labels.


---


## TP-US-007 — Edit Item Date & Reposition
**Story**: As a user, I want to change the date assigned to a timeline item and have that update the item’s board date column and immediately move on the timeline.


**Acceptance Criteria**
- **Given** an item on the timeline and a configured `dateColumn`
**When** the user edits the date in the timeline UI
**Then** the app writes the new value to the selected **board date column** via monday API and optimistically updates the view.
- **And** the item repositions according to the new date.
- **If** the board write fails, **Then** the UI rolls back the local change and shows an error toast.


**Notes/Edges**
- Date must be formatted according to `dateFormat`.


---


## TP-US-008 — Auto‑Save Everything
**Story**: As a user, I want the app to automatically save my positioning changes and hidden items so that on refresh or return, everything persists.


**Acceptance Criteria**
- **Given** any change to `laneId`, or hiddenIds set
**When** the change occurs
**Then** the app persists the change to monday **app storage** for the current board.
- **Given** the view reloads
**When** the app initializes
**Then** all persisted values are restored and applied before first render where possible.


---


## Non‑Functional Companion Criteria (cross‑cutting)
- **Performance**: Initial render under target ("loads quickly"); avoid fetching unused columns.
- **Constraints**: Hard cap of **15 items** enforced pre-render.
- **Auth**: Only admins may use the view (`context.user.isAdmin === true`).
- **Privacy**: No external telemetry; only minimal app storage data.


---
