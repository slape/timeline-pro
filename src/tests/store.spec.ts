// tests/unit/store.spec.ts
import { describe, it, expect, beforeEach } from "vitest";
import { useStore } from "../store";
import type { TimelineItem } from "../types/Item";

describe("Zustand store", () => {
  beforeEach(() => {
    // reset between tests
    useStore.setState({ itemsById: {}, error: undefined, hiddenIds: [], settings: null, context: null } as any, true);
  });

  it("sets settings (DoD part 1)", () => {
    useStore.getState().setSettings({ position: "above", yDeltaStepPx: 24 } as any);
    expect(useStore.getState().settings?.position).toBe("above");
  });

  it("upserts item (DoD part 2)", () => {
    const ti: TimelineItem = {
      id: "I1",
      name: "Spec",
      date: "2025-09-01T00:00:00Z",
      groupId: "G1",
      originalItem: { id: "I1", name: "Spec", board: { id: "B1" }, group: { id: "G1", title: "Design", color: "#abc" }, column_values: [] },
    };

    useStore.getState().upsertItems([ti]);
    expect(useStore.getState().itemsById["I1"]).toBeTruthy();

    useStore.getState().updatePosition("I1", { yDelta: 48 });
    expect(useStore.getState().itemsById["I1"].yDelta).toBe(48);
  });
});
