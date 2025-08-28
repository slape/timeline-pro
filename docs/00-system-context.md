# System Context — Timeline‑Pro


## Mission
Give project managers an easy way to display crisp project updates to executive leadership teams (ELT) directly from an existing monday.com board.


## Primary Users & Personas
- **Project Manager (author)** – configures the view, selects a date column, curates up to 15 items.
- **Executive stakeholder (viewer)** – consumes the visual timeline (via shared board view, screenshots, or embeds).


## High‑Level Capabilities
- Read monday **context**, **settings**, and **items currently visible** in the board view.
- Render an interactive timeline for **≤ 15 items** (hard limit enforced).
- Persist per‑item **positioning** (e.g., yDelta/lane) to **monday storage** (app storage only; no external backend).
- Write back only to the **selected date column** when needed; no other board mutations.


## monday.com Scopes (minimum)
- **Read items & columns** for the active board/view.
- **Write** to the selected **date** column.
- **App storage** (read/write) for per‑item positioning persistence.


## External Systems
- monday.com only (SDK listeners + storage). No separate server component.


## Boundaries
- **In‑scope:** Board view app; reading context/settings/items; rendering; local state via Zustand; app storage for positions.
- **Out‑of‑scope:** More than 15 items; long‑term telemetry/logging; non‑date column writes; separate backend; non‑admin users.


## Constraints & Policies
- **Item cap:** If `itemIds.length > 15`, show an error and do not render.
- **Admin requirement:** `context.user.isAdmin === true`.
- **Performance:** "Loads quickly" (no strict SLOs), avoid heavy queries; only fetch fields required for rendering.
- **Privacy/Security:** No external logging; store minimal data in app storage.


## Architecture Sketch
A[Monday SDK] -->|listen: context| S[Zustand Store]
A -->|listen: settings| S
A -->|listen: itemIds| S
S --> R[Renderer/Timeline]
R -->|drag end| S
S -->|persist positions| M[Monday App Storage]
M -->|restore positions| S

## Data Flow (happy path)
- Attach listeners: monday.listen("context"), monday.listen("settings"), monday.listen("itemIds").
- Context → store { theme, user }; verify user.isAdmin.
- Settings → store TimelineSettings (includes dateColumn, dateFormat, position, etc.).
- ItemIds → if > 15 → set error; else fetch the minimal fields for each item: name, group, and the selected date column.
- Normalize each item into TimelineItem (internal) with id, name, date, groupId, originalItem.
- Restore position from app storage (per item) and merge (e.g., yDelta, laneId if used internally).
- Render timeline. On drag end → update store → persist to app storage (keyed by board + item).

## Write‑backs
- Allowed: Selected date column only, as configured in TimelineSettings.
- Positions: Persist internally to monday app storage (not to board columns).

## Real‑time Behavior
- Reacts to monday client listeners only (no webhooks). Updates view when context/settings/itemIds change.

## Non‑functional Notes
- Quick startup; fetch minimal fields; avoid unnecessary re‑renders.
- No long‑term logs/telemetry.