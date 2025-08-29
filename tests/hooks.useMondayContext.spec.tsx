import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import React from "react";

import { useMondayContext } from "@/hooks/useMondayContext";
import { useStore } from "@/store";

// ---- hoisted emitter storage so vi.mock factory can reference it ----
const { emitters } = vi.hoisted(() => ({
  emitters: { context: undefined as undefined | ((ctx: any) => void) },
}));

// ✅ mock the EXACT module path the hook imports
vi.mock("@/lib/utils/mondayClient", () => ({
  listenContext: (cb: (ctx: any) => void) => {
    emitters.context = cb;
  },
}));

function TestComp() {
  useMondayContext();
  return null;
}

describe("useMondayContext", () => {
  beforeEach(() => {
    useStore.setState((s: any) => {
      s.itemsById = {};
      s.error = null;
      s.hiddenIds = [];
      s.settings = null;
      s.context = null;
    });
    emitters.context = undefined;
  });

  it("normalizes and stores context (prefers boardId; falls back to boardIds[0])", async () => {
    render(<TestComp />);
    // let useEffect run and register listener
    await act(async () => { await Promise.resolve(); });

    // case 1: explicit boardId
    await act(async () => {
      emitters.context?.({
        theme: "dark",
        user: { id: 123, isAdmin: true, isGuest: false, isViewOnly: false, countryCode: "US" },
        boardId: 98765,
      });
      await Promise.resolve();
    });

    let ctx = useStore.getState().context!;
    expect(ctx.theme).toBe("dark");
    expect(ctx.boardId).toBe("98765");
    expect(ctx.user.id).toBe("123");
    expect(ctx.user.isAdmin).toBe(true);
    expect(ctx.user.isViewOnly).toBe(false);

    // case 2: fallback to boardIds[0]
    await act(async () => {
      emitters.context?.({
        theme: "light",
        user: { id: "u-1", isAdmin: false, isGuest: false, isViewOnly: true, countryCode: "CA" },
        boardIds: [111, 222],
      });
      await Promise.resolve();
    });

    ctx = useStore.getState().context!;
    expect(ctx.theme).toBe("light");
    expect(ctx.boardId).toBe("111");
    expect(ctx.user.id).toBe("u-1");
    expect(ctx.user.isViewOnly).toBe(true);
  });

  it("defaults theme to light and boardId to null if absent", async () => {
    render(<TestComp />);
    await act(async () => { await Promise.resolve(); });

    await act(async () => {
      emitters.context?.({
        user: { id: 5, isAdmin: false, isGuest: true, isViewOnly: false },
        // no theme, no boardId/boardIds
      });
      await Promise.resolve();
    });

    const ctx = useStore.getState().context!;
    expect(ctx.theme).toBe("light");
    expect(ctx.boardId).toBeNull();
    expect(ctx.user.id).toBe("5");
    expect(ctx.user.isGuest).toBe(true);
  });
});
