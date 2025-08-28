// tests/hooks.syncPositions.spec.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { StorageServiceProvider } from "@/services/StorageServiceContext";
import { useSyncPositions } from "@/hooks/useSyncPositions";
import { useStore } from "@/store";

const ITEM_IDS = ["I1", "I2"];

class MockStorage {
  getInstanceItem = vi.fn(async (key: string) => {
    if (key.endsWith(":I1")) return { data: { success: true, value: { yDelta: 24 } } };
    return { data: { success: true, value: null } };
  });
  setInstanceItem = vi.fn(async () => ({ data: { success: true } }));
}

function TestComp() {
  // Only the hook under test; no seeding here to avoid races
  useSyncPositions("B1", ITEM_IDS);
  return null;
}

describe("useSyncPositions", () => {
  beforeEach(() => {
    vi.useFakeTimers();

    // ✅ Pre-seed items BEFORE rendering so the hook sees them as present
    useStore.getState().upsertItems([
      { id: "I1", name: "A", date: "2025-09-01T00:00:00Z", groupId: "G", originalItem: { id: "I1" } as any },
      { id: "I2", name: "B", date: "2025-09-02T00:00:00Z", groupId: "G", originalItem: { id: "I2" } as any },
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("hydrates per-item positions and persists on change", async () => {
    const svc = new MockStorage() as any;

    render(
      <StorageServiceProvider service={svc}>
        <TestComp />
      </StorageServiceProvider>
    );

    // Let the hydration async calls resolve
    await act(async () => {
      // no timers to advance yet; just flush microtasks for the awaited getInstanceItem promises
      await Promise.resolve();
      await Promise.resolve();
    });

    // ✅ Hydration should have applied yDelta to I1
    expect(useStore.getState().itemsById["I1"].yDelta).toBe(24);

    // Simulate a drag: update I2’s position
    await act(async () => {
      useStore.getState().updatePosition("I2", { yDelta: 72 });
      // advance the persistence debounce (250ms in the hook; we give it 300ms)
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(svc.setInstanceItem).toHaveBeenCalledWith(
      "tp:pos:B1:I2",
      { yDelta: 72, laneId: undefined },
      { versioning: true }
    );
  });
});
