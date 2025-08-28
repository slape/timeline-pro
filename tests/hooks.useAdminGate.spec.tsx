import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useStore } from "@/store";
import { useViewOnlyGate } from "@/hooks/useViewOnlyGate";

describe("useViewOnlyGate", () => {
  it("sets error when view-only; clears otherwise", () => {
    const { rerender } = renderHook(() => useViewOnlyGate());

    act(() => {
      useStore.getState().setContext({
        theme: "light",
        user: { id: "u1", isAdmin: true, isGuest: false, isViewOnly: true, countryCode: "US" },
        boardId: "B1",
      } as any);
    });
    rerender();
    expect(useStore.getState().error).toEqual({
      type: "viewOnly",
      message: "You have view-only permissions and cannot use this app.",
    });

    act(() => {
      useStore.getState().setContext({
        theme: "light",
        user: { id: "u1", isAdmin: true, isGuest: false, isViewOnly: false, countryCode: "US" },
        boardId: "B1",
      } as any);
    });
    rerender();
    expect(useStore.getState().error).toBeNull();
  });
});
