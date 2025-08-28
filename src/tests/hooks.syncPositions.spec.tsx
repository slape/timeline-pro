import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { useEffect } from "react";
import { StorageServiceProvider } from "../services/StorageServiceContext";
import { useSyncPositions } from "../hooks/useSyncPositions";
import { useStore } from "../store";

class MockStorage {
  getInstanceItem = vi.fn(async (key: string) => {
    if (key.endsWith(":I1")) return { data: { success: true, value: { yDelta: 24 } } };
    return { data: { success: true, value: null } };
  });
  setInstanceItem = vi.fn(async () => ({ data: { success: true } }));
}

function TestComp() {
  const itemIds = ["I1","I2"];
  useEffect(() => {
    useStore.getState().upsertItems([
      { id: "I1", name: "A", date: "2025-09-01T00:00:00Z", groupId: "G", originalItem: { id: "I1" } as any },
      { id: "I2", name: "B", date: "2025-09-02T00:00:00Z", groupId: "G", originalItem: { id: "I2" } as any },
    ]);
  }, []);
  useSyncPositions("B1", itemIds);
  useEffect(() => {
    // simulate a drag
    setTimeout(() => useStore.getState().updatePosition("I2", { yDelta: 72 }), 0);
  }, []);
  return null;
}

describe("useSyncPositions", () => {
  beforeEach(() => {
    useStore.setState({ itemsById: {}, error: null, hiddenIds: [], settings: null, context: null } as any, true);
  });

  it("hydrates per-item positions and persists on change", async () => {
    const svc = new MockStorage() as any;
    render(
      <StorageServiceProvider service={svc}>
        <TestComp />
      </StorageServiceProvider>
    );
    await new Promise((r) => setTimeout(r, 250)); // allow debounce to flush
    // hydrated I1 yDelta
    expect(useStore.getState().itemsById["I1"].yDelta).toBe(24);
    // persisted both I1 (hydrated again on write) and I2 (changed)
    expect(svc.setInstanceItem).toHaveBeenCalledWith("tp:pos:B1:I2", { yDelta: 72, laneId: undefined }, { versioning: true });
  });
});
