// tests/hooks.usePositionsPersistence.persist-only.spec.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { StorageServiceProvider } from "@/services/StorageServiceContext";
import { usePositionsPersistence } from "@/hooks/usePositionsPersistence";
import { useStore } from "@/store";
import type { MondayStorageService } from "@/services/MondayStorageService";
import { posKey } from "@/types/monday";

function PersistOnly({ boardId, ids }: { boardId: string; ids: string[] }) {
  usePositionsPersistence(boardId, ids);
  return null;
}

// small helper for real-timer sleep
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("usePositionsPersistence (persists changes, debounced)", () => {
  const boardId = "b1";
  const ids = ["1", "2"];
  const svc = {
    getInstanceItem: vi.fn(),  // not used in this test
    setInstanceItem: vi.fn(),
  } as unknown as MondayStorageService;

  beforeEach(() => {
    vi.restoreAllMocks();
    (svc.setInstanceItem as any).mockReset().mockResolvedValue({ data: { success: true } });

    // seed store items and (in case your slice doesn't expose it) add a minimal updatePosition
    useStore.setState((s: any) => {
      s.itemsById = {
        "1": { id: "1", name: "One", yDelta: 0, laneId: undefined },
        "2": { id: "2", name: "Two", yDelta: 0, laneId: undefined },
      };
      s.hiddenIds = [];
      s.settings = null;
      s.context = null;
      s.error = null;
      if (!s.updatePosition) {
        s.updatePosition = (id: string, patch: { yDelta?: number; laneId?: string | null }) => {
          useStore.setState((st: any) => {
            if (!st.itemsById[id]) return;
            if (patch.yDelta !== undefined) st.itemsById[id].yDelta = patch.yDelta;
            if ("laneId" in patch) st.itemsById[id].laneId = patch.laneId;
          });
        };
      }
    });
  });

  it("writes on changes after debounce", async () => {
    render(
      <StorageServiceProvider service={svc}>
        <PersistOnly boardId={boardId} ids={ids} />
      </StorageServiceProvider>
    );

    // change yDelta for id "1" -> should schedule a debounced persist (250ms)
    useStore.setState((s: any) => { s.itemsById["1"].yDelta = 25; });

    // wait a bit longer than the debounce to let the setTimeout fire on real timers
    await sleep(350);

    // assert the write happened
    const calls = (svc.setInstanceItem as any).mock.calls;
    expect(
      calls.some(
        (args: any[]) =>
          args[0] === posKey(boardId, "1") &&
          args[1] &&
          args[1].yDelta === 25 &&
          args[2] &&
          args[2].versioning === true
      )
    ).toBe(true);
  }, 8000); // generous test timeout to avoid CI flake
});
