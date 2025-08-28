// settings.ts

/** ──────────────────────────────────────────────────────────
 *  TypeScript model for the settings object you logged
 *  Extend the string-literal unions as new options appear.
 *  ────────────────────────────────────────────────────────── */

export type AppStatus = 'idle' | 'loading' | 'error';

export type ColumnValue = {
  id: string;
  value: string;
};

export type ColumnIdMap = Record<string, true>;

export type TitleText = string;
export type Title = boolean;
export type DateFormat = 'mdyy' | 'md' | 'mdy';
export type DatePosition =
  | "horizontal-above"
  | "horizontal-below"
  | "angled-above"
  | "angled-below"
  | "none";
export type Scale =
  | "day"
  | "week"
  | "month"
  | "quarter"
  | "year"
  | "none";
export type Position = "above" | "below" | "alternate";
export type Shape = "circle" | "rectangle";
export type Ledger = boolean;
export type ItemDates = boolean;

export interface TimelineSettings {
  titleText: TitleText | null;
  title: Title | null;
  dateColumn: ColumnIdMap;
  dateFormat: DateFormat | null;
  datePosition: DatePosition | null;
  scale: Scale | null;
  position: Position | null;
  shape: Shape | null;
  ledger: Ledger | null;
  itemDates: ItemDates | null;
}
