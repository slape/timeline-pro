// src/hooks/useItemIdsListener.ts
import { useEffect, useState } from "react";
import mondaySdk from "monday-sdk-js";
import { useStore } from "@/store";
import { ITEM_CAP } from "@/lib/utils/constants";
import { Err } from "@/types/errors";

const monday = mondaySdk();

export function useItemIdsListener(): string[] {
  const setError = useStore((s) => s.setError);
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const unsub = monday.listen("itemIds", (res: any) => {
      const next = (res?.data ?? []) as number[] | string[];
      const asStrings = next.map(String);
      if (asStrings.length > ITEM_CAP) {
        setError(Err.tooManyItems(`Too many items selected (${asStrings.length}). Limit is ${ITEM_CAP}.`));
        setIds([]); // don’t render timeline
      } else {
        setError(null);
        setIds(asStrings);
      }
    });
    return () => { try { unsub && unsub(); } catch {} };
  }, [setError]);

  return ids;
}
