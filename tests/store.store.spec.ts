import { describe, it, expect } from "vitest";
import { useStore } from "@/store";

describe("Zustand store slices", () => {

  it("sets settings (merge patch)", () => {
    useStore.getState().setSettings({ position: "above" } as any);
    expect(useStore.getState().settings?.position).toBe("above");
  });

  it("upserts and updates position", () => {
    useStore.getState().upsertItems([
      {
        id: "I1",
        name: "T",
        date: "2025-09-01T00:00:00Z",
        groupId: "G1",
        originalItem: { id: "I1" } as any,
      },
    ]);
    expect(useStore.getState().itemsById["I1"]).toBeTruthy();

    useStore.getState().updatePosition("I1", { yDelta: 48 });
    expect(useStore.getState().itemsById["I1"].yDelta).toBe(48);
  });
});
