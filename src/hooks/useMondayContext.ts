// src/hooks/useMondayContext.ts
import { useEffect } from "react";
import mondaySdk from "monday-sdk-js";
import { useStore } from "@/store";
import type { MondayContextMinimal } from "@/types/monday_storage";

const monday = mondaySdk();

/**
 * Hook to subscribe to the monday "context" event.
 * Keeps theme + user in the store's context slice.
 */
export function useMondayContext() {
  const setContext = useStore((s) => s.setContext); // from contextSlice

  useEffect(() => {
    const unsub = monday.listen("context", (res: any) => {
      const ctx = res?.data ?? {};
      const minimal: MondayContextMinimal = {
        theme: ctx.theme ?? "light",
        user: {
          id: String(ctx.user?.id ?? ""),
          isAdmin: !!ctx.user?.isAdmin,
          isGuest: !!ctx.user?.isGuest,
          isViewOnly: !!ctx.user?.isViewOnly,
          countryCode: ctx.user?.countryCode,
        },
        boardId: ctx.boardId ? String(ctx.boardId) : null, // <-- add this
      };
      setContext(minimal);
    });

    return () => {
      try { unsub && unsub(); } catch { /* monday.listen cleanup may vary */ }
    };
  }, [setContext]);
}
