// src/hooks/useItemIdsListener.ts
import { useEffect, useState } from "react";
import { useStore } from "@/store";
import { ITEM_CAP } from "@/lib/utils/constants";
import { Err } from "@/types/errors";
import { listenItemIds } from "@/lib/utils/mondayClient";
import TimelineLogger from "@/lib/utils/logger";

export function useItemIdsListener(): string[] {
  const setError = useStore((s) => s.setError);
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    // subscribe via our wrapper (it forwards res.data as a plain array)
    listenItemIds((next) => {
      const asStrings = (next ?? []).map(String);

      if (asStrings.length > ITEM_CAP) {
        TimelineLogger.warn("Too many board items selected", { count: asStrings.length, cap: ITEM_CAP });
        // cap exceeded → surface error and clear ids so the timeline won’t render
        setError(
          Err.tooManyItems(
            `Too many board items selected (${asStrings.length}). Filter your board view to 15 items or less.`
          )
        );
        setIds([]);
      } else {
        // ok → clear any cap error and set ids
        setError(null);
        setIds(asStrings);
      }
    });

    // monday.listen has no real unsubscribe handle from the SDK
    return () => {};
  }, [setError]);

  return ids;
}
