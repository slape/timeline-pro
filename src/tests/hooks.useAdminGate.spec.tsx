import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useStore } from "../store";
import { useViewOnlyGate } from "../hooks/useViewOnlyGate";

function setContextViewOnly(isViewOnly: boolean) {
  act(() => {
    useStore.getState().setContext({
      theme: "light",
      user: { id: "u1", isAdmin: false, isGuest: false, isViewOnly, countryCode: "US" },
    } as any);
  });
}

describe("useAdminGate", () => {
  it("sets error when not admin; clears when admin", () => {
    const { rerender } = renderHook(() => useViewOnlyGate());
    setContextViewOnly(true);
    rerender();
    expect(useStore.getState().error).toBe("You have view-only permissions and cannot use this app.");

    setContextViewOnly(false);
    rerender();
    expect(useStore.getState().error).toBe(null);
  });
});
