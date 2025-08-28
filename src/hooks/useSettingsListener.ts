// src/hooks/useSettingsListener.ts
import { useEffect, useRef } from "react";
import { useStore } from "@/store";
import { DEFAULT_SETTINGS } from "@/lib/utils/constants";
import mondaySdk from "monday-sdk-js";
import { omitUndefined } from "@/lib/objects"; // from earlier
import { TimelineSettings } from "@/types/settings";

const monday = mondaySdk();

function isBlankSettings(s: any): boolean {
  // matches what you described explicitly
  return (
    s &&
    s.titleText === "" &&
    s.title === false &&
    s.dateFormat === null &&
    s.datePosition === null &&
    (s.scale === null || s.scale === "weeks") && // allow "weeks" from earlier code
    s.position === null &&
    s.shape === null &&
    s.ledger === false &&
    s.itemDates === false
  );
}

function normalizeIncoming(s: any): Partial<TimelineSettings> {
  // sanitize oddities and normalize plural "weeks" -> "week"
  const scaleNorm = s.scale === "weeks" ? "week" : s.scale;
  return omitUndefined({
    titleText: s.titleText ?? null,
    title: typeof s.title === "boolean" ? s.title : null,
    dateColumn: s.dateColumn, // keep as-is; required
    dateFormat: s.dateFormat ?? null,
    datePosition: s.datePosition ?? null,
    scale: scaleNorm ?? null,
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

  useEffect(() => {
    const unsub = monday.listen("settings", async (res: any) => {
      const raw = res?.data ?? {};
      // Guard against noisy repeats
      if (lastAppliedRef.current && deepEqual(lastAppliedRef.current, raw)) {
        return;
      }

      // If dateColumn exists and the rest is “blank”, apply defaults once
      if (!appliedDefaultsRef.current && raw?.dateColumn && isBlankSettings(raw)) {
        const toWrite = { ...DEFAULT_SETTINGS, dateColumn: raw.dateColumn };
        try {
          await monday.set("settings", toWrite);
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
      setSettings(normalized);
      lastAppliedRef.current = raw;
    });

    return () => { try { unsub && unsub(); } catch {} };
  }, [setSettings]);
}