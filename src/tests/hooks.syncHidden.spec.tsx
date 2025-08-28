import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { useEffect } from "react";
import { StorageServiceProvider } from "../services/StorageServiceContext";
import { useSyncHidden } from "../hooks/useSyncHidden";
import { useStore } from "../store";

class MockStorage {
  getInstanceItem = vi.fn(async () => ({ data: { success: true, value: ["1","2"] } }));
  setInstanceItem = vi.fn(async () => ({ data: { success: true } }));
}

function TestComp() {
  useSyncHidden("B1");
  useEffect(() => {
    // simulate hide after hydration
    setTimeout(() => useStore.getState().setHiddenIds(["1","3"]), 0);
  }, []);
  return null;
}

describe("useSyncHidden", () => {
  it("hydrates and persists hiddenIds", async () => {
    const svc = new MockStorage() as any;
    render(
      <StorageServiceProvider service={svc}>
        <TestComp />
      </StorageServiceProvider>
    );
    // wait a tick for effects
    await new Promise((r) => setTimeout(r, 10));
    expect(useStore.getState().hiddenIds).toEqual(["1","3"]);
    expect(svc.setInstanceItem).toHaveBeenCalledWith("tp:hidden:B1", ["1","3"], { versioning: true });
  });
});
