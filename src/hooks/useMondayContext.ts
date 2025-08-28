// src/hooks/useMondayContext.ts
import { useEffect } from "react";
import { useStore } from "@/store";
import { listenContext } from "@/lib/utils/mondayClient";
import type { MondayContextMinimal } from "@/types/monday";

export function useMondayContext() {
  const setContext = useStore((s) => s.setContext);

  useEffect(() => {
    // Subscribe via our client wrapper; it forwards only res.data to the callback
    listenContext((ctx: any) => {
      const minimal: MondayContextMinimal = {
        theme: (ctx?.theme ?? "light") as "light" | "dark",
        user: {
          id: String(ctx?.user?.id ?? ""),
          isAdmin: !!ctx?.user?.isAdmin,
          isGuest: !!ctx?.user?.isGuest,
          isViewOnly: !!ctx?.user?.isViewOnly,
          countryCode: ctx?.user?.countryCode,
        },
        // prefer ctx.boardId if present; fall back to first in boardIds (some surfaces only provide boardIds)
        boardId: ctx?.boardId
          ? String(ctx.boardId)
          : Array.isArray(ctx?.boardIds) && ctx.boardIds.length
          ? String(ctx.boardIds[0])
          : null,
      };

      setContext(minimal);
    });

    // monday.listen doesn't provide a real unsubscribe; returning noop keeps React happy
    return () => {};
  }, [setContext]);
}
