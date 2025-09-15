// src/hooks/useSettingsListener.ts
import { useEffect, useRef } from "react";
import { useStore } from "@/store";
import { DEFAULT_SETTINGS } from "@/lib/utils/constants";
import { omitUndefined } from "@/lib/objects"; // from earlier
import { TimelineSettings } from "@/types/settings";
import { listenSettings, setMondaySettings } from "@/lib/utils/mondayClient";
import TimelineLogger from "@/lib/utils/logger";
import { Err } from "@/types/errors";

function isBlankSettings(s: any): boolean {
  // matches what you described explicitly
  return (
    s &&
    s.titleText === "" &&
    s.title === false &&
    s.dateFormat === null &&
    s.datePosition === null &&
    s.scale === null &&
    s.position === null &&
    s.shape === null &&
    s.ledger === false &&
    s.itemDates === false
  );
}

function normalizeIncoming(s: any): Partial<TimelineSettings> {
  return omitUndefined({
    titleText: s.titleText ?? null,
    title: typeof s.title === "boolean" ? s.title : null,
    dateColumn: s.dateColumn, // keep as-is; required
    dateFormat: s.dateFormat ?? null,
    datePosition: s.datePosition ?? null,
    scale: s.scale ?? null,
    position: s.position ?? null,
    shape: s.shape ?? null,
    ledger: typeof s.ledger === "boolean" ? s.ledger : null,
    itemDates: typeof s.itemDates === "boolean" ? s.itemDates : null,
  });
}


function deepEqual(a: any, b: any) {
  try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
}

export function useSettingsListener() {
  const setSettings = useStore((s) => s.setSettings);
  const lastAppliedRef = useRef<Partial<TimelineSettings> | null>(null);
  const appliedDefaultsRef = useRef(false);
  const replaceSettings = useStore((s) => s.replaceSettings);
  const setError = useStore((s) => s.setError);

  useEffect(() => {
    listenSettings(async (raw) => {
      // Guard against noisy repeats
      if (lastAppliedRef.current && deepEqual(lastAppliedRef.current, raw)) return;

      // Validate date column
      const hasDate = !!raw?.dateColumn && Object.keys(raw.dateColumn ?? {}).length > 0;
      if (!hasDate) {
        TimelineLogger.warn("Settings invalid: no date column");
        setError(Err.invalidDate("Select a date column in app settings."));
        replaceSettings(null);
        lastAppliedRef.current = null;
        return;
      }

      // If dateColumn exists and the rest is “blank”, apply defaults once
      if (!appliedDefaultsRef.current && raw?.dateColumn && isBlankSettings(raw)) {
        const toWrite = { ...DEFAULT_SETTINGS, dateColumn: raw.dateColumn };
        TimelineLogger.debug("[TEST] settings.seed.defaults", { toWrite });
        try {
          setMondaySettings(toWrite);
          appliedDefaultsRef.current = true;
          // Also reflect in store immediately (optimistic)
          setSettings(toWrite);
          lastAppliedRef.current = toWrite;
          return;
        } catch {
          // If monday.set fails, still fall back to store update using normalized incoming
          // (or you can early-return to keep blank state)
        }
      }

      // For normal (or post-default) settings: normalize & set
      const normalized = normalizeIncoming(raw);
      // No undefined fields hit the store (fixes your TS WritableDraft error)
      TimelineLogger.debug("[TEST] settings.apply", { keys: Object.keys(normalized) });
      setSettings(normalized);
      lastAppliedRef.current = raw;
    });

     // monday.listen doesn’t expose unsubscribe, so just return a noop
    return () => {};
}, [replaceSettings, setError]);
}