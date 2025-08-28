// src/lib/activeDate.ts
import type { TimelineSettings } from "@/types/settings";

type Col = { id: string; type: string; value?: string | null; text?: string | null; date?: string | null; time?: string | null; from?: string | null; to?: string | null; };
type RawItem = { id: string | number; name?: string; group?: any; column_values?: Col[] };

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

const toISO = (d: string, t?: string | null) =>
  `${d}T${t && /^\d{2}:\d{2}$/.test(t) ? t : "00:00"}:00Z`;

export function getActiveDateISO(item: RawItem, settings: TimelineSettings): string | null {
  const activeColId = Object.keys(settings?.dateColumn ?? {})[0];
  if (!activeColId) return null;

  const col = (item.column_values ?? []).find(c => c?.id === activeColId);
  if (!col) return null;

  // Prefer typed fields via fragments:
  if (col.type === "date" && col.date) return toISO(col.date, col.time ?? undefined);
  if (col.type === "timeline" && col.from) return col.from.includes("T") ? col.from : `${col.from}T00:00:00Z`;

  // Fallback: raw JSON-as-string
  if (col.value) {
    try {
      const parsed = JSON.parse(col.value);
      if (parsed?.date) return toISO(parsed.date, parsed.time);
      if (parsed?.from) return parsed.from.includes("T") ? parsed.from : `${parsed.from}T00:00:00Z`;
    } catch { /* ignore */ }
  }

  // Last resort: plain text or value like YYYY-MM-DD
  if (col.text && ISO_RE.test(col.text)) return toISO(col.text);
  if (typeof col.value === "string" && ISO_RE.test(col.value)) return toISO(col.value);

  return null;
}
