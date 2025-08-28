// tests/helpers/resetStore.ts
import { useStore } from "@/store";

export function resetStore() {
  useStore.setState((s: any) => {
    // only reset data, not actions
    s.context = null;
    s.settings = null;
    s.itemsById = {};
    s.error = null;
    s.hiddenIds = [];
  });
}
