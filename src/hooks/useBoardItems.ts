// src/hooks/useBoardItems.ts
import { useEffect, useRef } from "react";
import { fetchBoardItems } from "../lib/board_items/fetchBoardItems";
import { useStore } from "../store";
import type { TimelineSettings } from "../types/settings";
import type { MondayContextMinimal } from "../types/monday_storage";

type CtxLike = { boardId?: string };

export function useBoardItems(params: {
  context: MondayContextMinimal | null;
  itemIds: string[];
  settings: TimelineSettings | null;
}) {
  const { context, itemIds, settings } = params;
  const upsertItems = useStore((s) => s.upsertItems);
  const setError = useStore((s) => s.setError);
  const setIsLoading = (_: boolean) => {}; // optional

  const keyRef = useRef<string>("");

  useEffect(() => {
    const key = `${context?.boardId ?? ""}|${itemIds.join(",")}|${Object.keys(settings?.dateColumn ?? {}).join(",")}`;
    if (!context?.boardId || !itemIds.length || !settings) return;
    if (keyRef.current === key) return;
    keyRef.current = key;

    fetchBoardItems(
      context,
      itemIds,
      settings,
      (mapped) => upsertItems(mapped),
      setIsLoading,
      (err) => setError(err)
    );
  }, [context?.boardId, itemIds.join(","), settings, upsertItems, setError]);
}
