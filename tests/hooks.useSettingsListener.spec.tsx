import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { useSettingsListener } from "@/hooks/useSettingsListener";
import { useStore } from "@/store";
import type { TimelineSettings } from "@/types/settings";

// ---- HOISTED shared state for the mock (Vitest requirement) ----
const { emitters, mondaySet } = vi.hoisted(() => {
  return {
    emitters: { settings: undefined as undefined | ((s: TimelineSettings) => void) },
    mondaySet: vi.fn(async () => ({ data: { success: true } })),
  };
});

vi.mock("@/lib/utils/mondayClient", () => ({
  setMondaySettings: mondaySet,
  listenSettings: (cb: (s: TimelineSettings) => void) => {
    emitters.settings = cb;
  },
}));

function TestComp() {
  useSettingsListener();
  return null;
}

describe("useSettingsListener", () => {
  beforeEach(() => {
    mondaySet.mockClear();
  });

  it("applies incoming non-blank settings to the store", async () => {
    render(<TestComp />);

    // ⬅️ ensure useEffect ran and the listener is registered
    await act(async () => {
      await Promise.resolve();
    });

    const incoming: TimelineSettings = {
      // IMPORTANT: match your app’s unions exactly
      dateColumn: { date_x: true },
      titleText: "Hi",
      title: true,
      dateFormat: "md",
      datePosition: "angled-below",
      scale: "week",          // use "week" if your union is singular
      position: "above",
      shape: "circle",
      ledger: true,
      itemDates: true,
    };

    await act(async () => {
      emitters.settings?.(incoming);
      await Promise.resolve();
    });

    const s = useStore.getState().settings!;
    expect(s.titleText).toBe("Hi");
    expect(s.dateColumn).toEqual({ date_x: true });
    expect(s.scale).toBe("week");
    expect(useStore.getState().error).toBeNull();
    expect(mondaySet).not.toHaveBeenCalled(); // non-blank ⇒ no seeding
  });

  it("seeds defaults via monday.set when incoming settings are blank except dateColumn", async () => {
    render(<TestComp />);

    // ⬅️ ensure useEffect ran and the listener is registered
    await act(async () => {
      await Promise.resolve();
    });

    const blank: TimelineSettings = {
      dateColumn: { date_x: true },
      titleText: "",
      title: false,
      dateFormat: null,
      datePosition: null,
      scale: null,
      position: null,
      shape: null,
      ledger: false,
      itemDates: false,
    };

    await act(async () => {
      emitters.settings?.(blank);
      await Promise.resolve();
    });

    const s = useStore.getState().settings!;
    expect(s.dateColumn).toEqual({ date_x: true });
    // spot-check a couple defaults (adjust to your DEFAULT_SETTINGS)
    expect(s.title).toBe(true);
    expect(!!s.titleText).toBe(true);
    expect(!!s.dateFormat).toBe(true);
    expect(mondaySet).toHaveBeenCalledTimes(1);
  });
});

