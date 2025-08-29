import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { useBoardItems } from "@/hooks/useBoardItems";
import { useStore } from "@/store";
import type { MondayContextMinimal } from "@/types/monday";

// Mock the fetchBoardItems module
vi.mock("@/lib/board_items/fetchBoardItems", () => ({
  fetchBoardItems: vi.fn(async (_ctx, _ids, _settings, onItems) => {
    onItems([
      { id: "I1", name: "Alpha", date: "2025-09-01T00:00:00Z", groupId: "G1", originalItem: { id: "I1" } },
      { id: "I2", name: "Beta",  date: "2025-09-02T00:00:00Z", groupId: "G1", originalItem: { id: "I2" } },
    ]);
  }),
}));

const context: MondayContextMinimal = {
  theme: "light",
  user: {
    id: "u1",
    isAdmin: true,
    isGuest: false,
    isViewOnly: false,
    countryCode: "US",
  },
  boardId: "B1",
};
const settings = { dateColumn: { date_abc: true } } as any;

function TestComp() {
  useBoardItems({ context, itemIds: ["I1","I2"], settings });
  return null;
}

describe("useBoardItems", () => {
  it("upserts fetched items into store", async () => {
    render(<TestComp />);
    await new Promise((r) => setTimeout(r, 10));
    const s = useStore.getState();
    expect(Object.keys(s.itemsById)).toEqual(["I1","I2"]);
  });
});

describe("useBoardItems extras", () => {
  it("handles empty itemIds", async () => {
    function EmptyComp() {
      useBoardItems({ context, itemIds: [], settings });
      return null;
    }
    render(<EmptyComp />);
    await new Promise((r) => setTimeout(r, 10));
    const s = useStore.getState();
    expect(Object.keys(s.itemsById)).toEqual([]); // no items added
  });

  it("handles null context", async () => {
    function NoCtxComp() {
      useBoardItems({ context: null, itemIds: ["I1"], settings });
      return null;
    }
    render(<NoCtxComp />);
    await new Promise((r) => setTimeout(r, 10));
    const s = useStore.getState();
    expect(Object.keys(s.itemsById)).toEqual([]); // no items added
  });
});


