import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act, screen } from "@testing-library/react";
import { useItemIdsListener } from "@/hooks/useItemIdsListener";
import { useStore } from "@/store";
import { ITEM_CAP } from "@/lib/utils/constants";

// --- hoisted state for the mock (Vitest requirement) ---
const { emitters } = vi.hoisted(() => ({
  emitters: {
    itemIds: undefined as undefined | ((ids: (string | number)[]) => void),
  },
}));

// ✅ mock the exact module path the hook imports
vi.mock("@/lib/utils/mondayClient", () => ({
  listenItemIds: (cb: (ids: (string | number)[]) => void) => {
    emitters.itemIds = cb;
  },
}));

function TestComp() {
  const ids = useItemIdsListener();
  return <div data-testid="count">{ids.length}</div>;
}

describe("useItemIdsListener", () => {
  beforeEach(() => {
    // reset store & emitter between tests
    useStore.setState((s: any) => {
      s.itemsById = {};
      s.error = null;
      s.hiddenIds = [];
      s.settings = null;
      s.context = null;
    });
    emitters.itemIds = undefined;
  });

  it("sets ids when under cap and clears any cap error", async () => {
    render(<TestComp />);

    // ✅ let useEffect run and register the listener
    await act(async () => { await Promise.resolve(); });

    // now emit fewer than ITEM_CAP
    await act(async () => {
      emitters.itemIds?.(["1", "2", 3]);
      await Promise.resolve(); // flush state
    });

    expect(screen.getByTestId("count").textContent).toBe("3");
    expect(useStore.getState().error).toBeNull();
  });

  it("clears ids and sets an AppError when over cap", async () => {
    render(<TestComp />);

    // ✅ ensure listener is registered before emitting
    await act(async () => { await Promise.resolve(); });

    const over = Array.from({ length: ITEM_CAP + 1 }, (_, i) => String(i + 1));

    await act(async () => {
      emitters.itemIds?.(over);
      await Promise.resolve();
    });

    expect(screen.getByTestId("count").textContent).toBe("0");

    const err = useStore.getState().error as any;
    expect(err?.type).toBe("tooManyItems");
    expect(err?.message).toContain(`Too many items selected (${over.length})`);
  });
});
