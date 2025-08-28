// tests/unit/dates.spec.ts
import { describe, it, expect } from "vitest";
import { parseMondayDateColumn } from "@/lib/dates";

describe("parseMondayDateColumn", () => {
  it("parses date column JSON", () => {
    const col = { id: "date", value: JSON.stringify({ date: "2025-09-01", time: "13:30" }) };
    expect(parseMondayDateColumn(col as any)).toBe("2025-09-01T13:30:00Z");
  });

  it("handles empty values", () => {
    const col = { id: "date", value: "null" };
    expect(parseMondayDateColumn(col as any)).toBeNull();
  });
});
