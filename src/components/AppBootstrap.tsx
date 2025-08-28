// src/app/AppBootstrap.tsx
import { useViewOnlyGate } from "@/hooks/useViewOnlyGate";
import { useMondayContext } from "@/hooks/useMondayContext";
import { useSettingsListener } from "@/hooks/useSettingsListener";
import { useItemIdsListener } from "@/hooks/useItemIdsListener";
import { useBoardItems } from "@/hooks/useBoardItems";
import { useSyncHidden } from "@/hooks/useSyncHidden";
import { useSyncPositions } from "@/hooks/useSyncPositions";
import { useStore } from "@/store";


export default function AppBootstrap() {
  // 1) Context (theme + user + admin gate)
  useMondayContext();
  useViewOnlyGate();

  // 2) Settings (seed defaults if blank; updates store)
  useSettingsListener();

  // 3) Visible item IDs from the board view
  const itemIds = useItemIdsListener(); // string[]

  // Grab context/settings from store (needed by useBoardItems)
  const context  = useStore((s) => s.context);   // should contain boardId
  const settings = useStore((s) => s.settings);  // has dateColumn map

  // 4) Fetch minimal board item data and normalize into store
  useBoardItems({ context, itemIds, settings });

  // 5) Hydrate & persist hidden + positions
  const boardId = context?.boardId;
  useSyncHidden(boardId);
  useSyncPositions(boardId, itemIds);

  return null; // purely side-effects
}