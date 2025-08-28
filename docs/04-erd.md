# ERD — Timeline‑Pro
- **HiddenItem** *(app storage)* — Per‑board hidden flags for item ids.
- **TimelineItem** *(view model)* — Derived from `BoardItem` + selected date column for rendering.

## Field notes & invariants

- **BoardItem.id** is the authoritative identifier and is used as TimelineItem.id and in composite PK for Position/HiddenItem.

- Date source: TimelineItem.date is parsed from the selected TimelineSettings.dateColumnId on BoardItem.column_values.

- Position settings are referring to the position of the board items in relation to the timeline. They are not written back to board columns; they live only in Position.

- Hidden semantics: if an itemID exists in HiddenItems, the item is excluded from rendering.

- Item cap: enforce itemIds.length ≤ 15 before deriving TimelineItem rows.

- Storage keys (KV to relational mapping)

- Scope: Board‑scoped (default)

- Lane persistence: Persist laneId + yDelta

- Date column: Support monday timeline (start/end) OR single date column with dateStart/dateEnd fields in TimelineItem.