// src/lib/dates.ts
import type { BoardItem, ColumnValue } from "../types/Item";
import type { DateFormat } from "../types/settings";

/** monday date column is JSON-as-string. These are the common shapes. */
type MondayDateJSON =
  | { date?: string; time?: string; changed_at?: string } // Date column
  | { from?: string; to?: string }                        // (Optional) Timeline col
  | { text?: string };                                    // Fallback text rendering

/** Safe JSON parse for monday's stringified column values. */
function safeParse<T = unknown>(raw: string | null | undefined): T | null {
  if (!raw || raw === "null") return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Combine YYYY-MM-DD and optional HH:mm into an ISO string (UTC). */
function toISO(dateYYYYMMDD: string, hhmm?: string): string {
  // Normalize inputs
  const date = dateYYYYMMDD.trim();
  const time = (hhmm ?? "00:00").trim();
  // Construct ISO as UTC; this keeps ordering stable across clients.
  // Example: 2025-09-01 + 13:30 -> 2025-09-01T13:30:00Z
  return `${date}T${time.length === 5 ? time : "00:00"}:00Z`;
}

/**
 * Parse a monday ColumnValue (date/timeline) into a single ISO string:
 * - If it's a date column: returns that date (+ time if present)
 * - If it's a timeline column: returns the 'from' date
 * - Otherwise returns null
 */
export function parseMondayDateColumn(col: ColumnValue): string | null {
  const data = safeParse<MondayDateJSON>(col.value);
  if (!data) return null;

  // Date column shape
  if ("date" in data && data.date) {
    return toISO(data.date, (data as any).time);
  }

  // Timeline column (optional support): use start
  if ("from" in data && data.from) {
    // data.from is usually ISO already; normalize to UTC midnight if no time
    const from = data.from.includes("T") ? data.from : `${data.from}T00:00:00Z`;
    return from;
  }

  // Text fallback is not reliable for machine parsing; ignore.
  return null;
}

/** Locate the selected date column on a BoardItem and parse it. */
export function parseSelectedDateFromItem(
  item: BoardItem,
  dateColumnId: string
): string | null {
  const col = item.column_values.find((c) => c.id === dateColumnId);
  if (!col) return null;
  return parseMondayDateColumn(col);
}

/** Format an ISO string for UI based on your DateFormat enum. */
export function formatForUI(iso: string, format: DateFormat | null): string {
  const d = new Date(iso);
  const m = d.getUTCMonth() + 1;    // 1..12
  const day = d.getUTCDate();       // 1..31
  const yyyy = d.getUTCFullYear();
  const mm = String(m);
  const dd = String(day);
  const yy = String(yyyy).slice(-2);

  switch (format) {
    case "mdyy":
      return `${mm}/${dd}/${yy}`;     // e.g., 9/1/25
    case "md":
      return `${mm}/${dd}`;           // e.g., 9/1
    case "mdy":
    default:
      return `${mm}/${dd}/${yyyy}`;   // e.g., 9/1/2025
  }
}

/**
 * Convenience normalizer for building TimelineItem:
 * Returns { iso, uiText } given a BoardItem and a date columnId/format.
 */
export function normalizeItemDate(
  item: BoardItem,
  dateColumnId: string,
  format: DateFormat | null
): { iso: string | null; uiText: string } {
  const iso = parseSelectedDateFromItem(item, dateColumnId);
  return {
    iso,
    uiText: iso ? formatForUI(iso, format) : "—",
  };
}
