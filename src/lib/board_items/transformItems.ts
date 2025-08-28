// src/transformItems.ts
import type { TimelineItem } from "../../types/Item";
import type { TimelineSettings } from "../../types/settings";
import { getActiveDateISO } from "./activeDate";

export function transformMondayItems(raw: any[], settings: TimelineSettings): TimelineItem[] {
  if (!raw?.length) return [];

  const out: TimelineItem[] = [];
  for (const item of raw) {
    const iso = getActiveDateISO(item, settings);
    if (!iso) continue; // skip items without date in the active column

    out.push({
      id: String(item.id),
      name: item.name ?? "Untitled",
      date: iso,                 // ISO used for layout
      groupId: item.group?.id,
      originalItem: item,        // retains all date/timeline columns for instant switching
    });
  }
  return out;
}
