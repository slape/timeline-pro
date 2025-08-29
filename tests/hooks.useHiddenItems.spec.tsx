import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, act } from "@testing-library/react";
import { StorageServiceProvider } from "@/services/StorageServiceContext";
import { useHiddenItems } from "@/hooks/useHiddenItems";
import { useStore } from "@/store";
import type { MondayStorageService } from "@/services/MondayStorageService";
import { hiddenKey } from "@/types/monday";

const ok = (value: any) => ({ data: { success: true, value, version: 1 } });

function Hydrator({ boardId }: { boardId: string }) {
  useHiddenItems(boardId);
  return null;
}

describe("useHiddenItems", () => {
  const boardId = "b1";
  const svc = {
    getInstanceItem: vi.fn(),
    setInstanceItem: vi.fn(),
  } as unknown as MondayStorageService;

  beforeEach(() => {
    vi.restoreAllMocks();
    (svc.getInstanceItem as any).mockReset();
    (svc.setInstanceItem as any).mockReset();
    useStore.setState((s: any) => {
      s.context = null;
      s.settings = null;
      s.itemsById = {};
      s.error = null;
      s.hiddenIds = [];
      if (!s.setHiddenIds) s.setHiddenIds = (ids: string[]) =>
        useStore.setState((st: any) => { st.hiddenIds = ids; });
    });
  });

  it("hydrates hidden from storage and then persists changes", async () => {
    (svc.getInstanceItem as any).mockResolvedValueOnce(ok(["a", "b"]));

    render(
      <StorageServiceProvider service={svc}>
        <Hydrator boardId={boardId} />
      </StorageServiceProvider>
    );

    // 1) Hydration reflected in store
    await waitFor(() => {
      expect(useStore.getState().hiddenIds).toEqual(["a", "b"]);
    });

    // 2) First persist (hydration write)
    await waitFor(() => {
      expect(svc.setInstanceItem).toHaveBeenCalledWith(
        hiddenKey(boardId),
        ["a", "b"],
        { versioning: true }
      );
    });

    // 3) Now simulate user change to ["a"] and expect a second persist
    act(() => {
      useStore.getState().setHiddenIds(["a"]);
    });

    await waitFor(() => {
      const calls = (svc.setInstanceItem as any).mock.calls;
      expect(calls.some((args: any[]) =>
        args[0] === hiddenKey(boardId) &&
        Array.isArray(args[1]) &&
        args[1].length === 1 &&
        args[1][0] === "a"
      )).toBe(true);
    });
  });
});
