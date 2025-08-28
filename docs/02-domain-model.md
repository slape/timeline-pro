### TS Interfaces — Source of Truth
> These are the exact shapes the app reads/writes and should be referenced by other docs (Domain Model, Data Contracts, Workflows).

// ——— monday context (minimal) ———
export type MondayUser = {
id: string;
isAdmin: boolean;
isGuest: boolean;
isViewOnly: boolean;
countryCode?: string;
};

export type MondayContextMinimal = {
theme: "light" | "dark";
user: MondayUser;
};

// ——— settings (as provided) ———
export type ColumnValue = { id: string; value: string };
export type TitleText = string;
export type Title = boolean;
export type DateFormat = "mdyy" | "md" | "mdy";
export type DatePosition =
| "horizontal-above"
| "horizontal-below"
| "angled-above"
| "angled-below"
| "none";
export type Scale = "day" | "week" | "month" | "quarter" | "year" | "none";
export type Position = "above" | "below" | "alternate";
export type Shape = "circle" | "rectangle";
export type Ledger = boolean;
export type ItemDates = boolean;


export interface TimelineSettings {
titleText: TitleText | null;
title: Title | null;
dateColumn: ColumnValue; // selected date column (columnId + raw value)
dateFormat: DateFormat | null;
datePosition: DatePosition | null;
scale: Scale | null;
position: Position | null; // affects visual stacking
shape: Shape | null;
ledger: Ledger | null;
itemDates: ItemDates | null;
}


// ——— board items (as provided) ———
export type Group = { id: string; title: string; color: string };
export type Board = { id: string };


export type BoardItem = {
id: string; // monday item id
name: string; // display name
board: Board;
group: Group;
column_values: ColumnValue[]; // raw column payloads
};


// ——— normalized runtime shape for the timeline ———
export type TimelineItem = {
id: string; // same as monday item id
name: string;
date: string; // ISO or raw string parsed from selected date column
groupId: string | undefined; // from item.group.id
originalItem: BoardItem; // for reference/rendering
// internal-only positioning (not written to board)
laneId?: string; // internal lanes only
yDelta?: number; // px offset persisted to app storage
};


// ——— monday app storage ———
export interface MondayStorageResponse<T = any> {
method: string;
data: {
success: boolean;
value?: T;
version?: string;
error?: string;
};
requestId: string;
}


export interface MondayStorageOptions {
versioning?: boolean;
version?: string;
}


// Storage key helper (per-item)
export const posKey = (boardId: string, itemId: string) => `tp:pos:${boardId}:${itemId}`;


export type PositionPatch = { laneId?: string; yDelta?: number };


// ——— zustand slices ———
export type ContextSlice = {
context: MondayContextMinimal | null;
setContext: (ctx: MondayContextMinimal) => void;
};


export type SettingsSlice = {
settings: TimelineSettings | null;
setSettings: (s: Partial<TimelineSettings>) => void;
};


export type ItemsSlice = {
itemsById: Record<string, TimelineItem>;
upsertItems: (items: TimelineItem[]) => void;
updatePosition: (id: string, patch: PositionPatch) => void;
};


export type UiSlice = {
error?: string;
setError: (msg?: string) => void;
};


export type StoreState = ContextSlice & SettingsSlice & ItemsSlice & UiSlice;