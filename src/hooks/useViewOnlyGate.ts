// src/hooks/useViewOnlyGate.ts
import { useEffect } from "react";
import { useStore } from "@/store";
import { Err } from "@/types/errors";

/**
 * Gate that blocks the app if the monday user is "view only".
 * Writes into UiSlice.error when blocked.
 */
export function useViewOnlyGate() {
  const isViewOnly = useStore((s) => s.context?.user?.isViewOnly ?? null);
  const setError = useStore((s) => s.setError);

  useEffect(() => {
    if (isViewOnly === null) return; // context not loaded yet
    if (isViewOnly) {
      setError(Err.viewOnly("You have view-only permissions and cannot use this app."));
    } else {
      // clear any prior error
      setError(null);
    }
  }, [isViewOnly, setError]);
}
