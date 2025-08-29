// src/lib/mondayClient.ts
import mondaySdk from "monday-sdk-js";
import type { TimelineSettings } from "@/types/settings";
import type { MondayContextMinimal } from "@/types/monday";
import { MondayApiResponse } from "@/types/monday";
import TimelineLogger from "@/lib/utils/logger";

const monday = mondaySdk();

/**
 * Typed wrapper around monday.listen for context.
 */
export function listenContext(cb: (ctx: MondayContextMinimal) => void) {
  TimelineLogger.debug("[TEST] listenContext.attach");
  monday.listen("context", (res) => {
    TimelineLogger.debug("[TEST] listenContext.event", { keys: Object.keys(res?.data || {}) });
    if (res.data) cb(res.data as MondayContextMinimal);
  });
}

/**
 * Typed wrapper around monday.listen for settings.
 */
export function listenSettings(cb: (settings: TimelineSettings) => void) {
  TimelineLogger.debug("[TEST] listenSettings.attach");
  monday.listen("settings", (res) => {
    const hasDate = !!res?.data?.dateColumn && Object.keys(res.data.dateColumn || {}).length > 0;
    TimelineLogger.debug("[TEST] listenSettings.event", { hasDate, rawKeys: Object.keys(res?.data || {}) });
    if (res?.data) cb(res.data as TimelineSettings);
  });
}
/**
 * Typed wrapper around monday.set for settings.
 */
export async function setMondaySettings(settings: Partial<TimelineSettings>): Promise<void> {
  await monday.set("settings", settings); // no response
  TimelineLogger.debug("[TEST] Settings saved", settings);
}


/**
 * Typed wrapper around monday.listen for itemIds.
 */
export function listenItemIds(cb: (ids: string[]) => void) {
  TimelineLogger.debug("[TEST] listenItemIds.attach");
  monday.listen("itemIds", (res) => {
    const len = Array.isArray(res?.data) ? res.data.length : 0;
    TimelineLogger.debug("[TEST] listenItemIds.event", { length: len });
    if (Array.isArray(res.data)) cb(res.data as unknown as string[]);
  });
}

/**
 * Direct passthrough for GraphQL queries.
 */
export async function api<TData = any>(
  query: string,
  variables?: Record<string, any>
): Promise<MondayApiResponse<TData>> {
  // If the SDK has no types, we assert to our response type.
  TimelineLogger.debug("[TEST] api.query", { hasVars: !!variables });
  return monday.api(query, { variables }) as Promise<MondayApiResponse<TData>>;
}


export default monday;
