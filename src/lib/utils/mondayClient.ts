// src/lib/mondayClient.ts
import mondaySdk from "monday-sdk-js";
import type { TimelineSettings } from "@/types/settings";
import type { MondayContextMinimal } from "@/types/monday";
import { MondayApiResponse } from "@/types/monday";

const monday = mondaySdk();

/**
 * Typed wrapper around monday.listen for context.
 */
export function listenContext(cb: (ctx: MondayContextMinimal) => void) {
  monday.listen("context", (res) => {
    if (res.data) cb(res.data as MondayContextMinimal);
  });
}

/**
 * Typed wrapper around monday.listen for settings.
 */
export function listenSettings(cb: (settings: TimelineSettings) => void) {
  monday.listen("settings", (res) => {
    if (res.data) cb(res.data as TimelineSettings);
  });
}
/**
 * Typed wrapper around monday.set for settings.
 */
export async function setMondaySettings(settings: Partial<TimelineSettings>): Promise<void> {
  await monday.set("settings", settings); // no response
}


/**
 * Typed wrapper around monday.listen for itemIds.
 */
export function listenItemIds(cb: (ids: string[]) => void) {
  monday.listen("itemIds", (res) => {
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
  return monday.api(query, { variables }) as Promise<MondayApiResponse<TData>>;
}


export default monday;
