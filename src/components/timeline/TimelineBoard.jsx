import React, { useEffect } from "react";
import { Box, EditableHeading, Flex } from "@vibe/core";
import { useZustandStore } from "../../store/useZustand";
import {
  handleTimelineItemMove,
  handleLabelChange,
} from "../../functions/timelineHandlers";
import { processTimelineData } from "../../functions/processTimelineData";
import Timeline from "./Timeline";
import isEqual from "lodash.isequal";
import TimelineLogger from "../../utils/logger";
import { useVisibleItems } from "../../hooks/useVisibleItems";
import GroupLegend from "./GroupLegend";
import Loading from "../common/Loading";

/** BoardItem type * @typedef {Object} BoardItem
 * @property {string} id - Unique item ID
 * @property {string} name - Item name
 * @property {Object} group - Group information
 * @property {string} group.color - Color of the group
 * @property {string} group.title - Title of the group
 * @property {string} group.id - ID of the group
 * @property {Array.<{id: string, value: string}>} column_values - Array of column values (JSON strings)
 */

const TimelineBoard = () => {
  const boardItems = useZustandStore((state) => state.boardItems);
  const settings = useZustandStore((state) => state.settings);
  const timelineItems = useZustandStore((state) => state.timelineItems);
  const timelineParams = useZustandStore((state) => state.timelineParams);
  const { setTimelineItems, hideItem, setTimelineParams } = useZustandStore();
  const onTimelineItemMove = handleTimelineItemMove(
    setTimelineItems,
    TimelineLogger,
  );
  const onLabelChange = handleLabelChange(setTimelineItems, TimelineLogger);

  const visibleBoardItems = useVisibleItems();

  useEffect(() => {
    const dateColumnId =
      settings && typeof settings.dateColumn === "object"
        ? Object.keys(settings.dateColumn)[0]
        : settings?.dateColumn;

    if (
      visibleBoardItems &&
      visibleBoardItems.length > 0 &&
      settings &&
      dateColumnId
    ) {
      TimelineLogger.debug("TimelineBoard: Processing timeline data", {
        boardItemCount: boardItems.length,
        hasSettings: !!settings,
        scale: settings.scale,
        dateColumn: dateColumnId,
      });

      const startTime = Date.now();
      const result = processTimelineData(boardItems, settings, dateColumnId);

      TimelineLogger.debug("processTimelineData result check", {
        hasResult: !!result,
        hasTimelineItems: !!result?.timelineItems,
        hasTimelineParams: !!result?.timelineParams,
        timelineItemsCount: result?.timelineItems?.length || 0,
        dateColumnId,
      });

      if (result) {
        const duration = Date.now() - startTime;
        TimelineLogger.performance("processTimelineData", duration, {
          itemCount: result.timelineItems?.length || 0,
          startDate: result.timelineParams?.startDate,
          endDate: result.timelineParams?.endDate,
        });
        //TimelineLogger.debug('processTimelineData result', result);
        if (result && result.timelineParams && result.timelineItems) {
          TimelineLogger.debug("Setting timelineItems", {
            newItemsCount: result.timelineItems.length,
            currentItemsCount: timelineItems?.length || 0,
            dateColumnId,
            firstNewItem: result.timelineItems[0],
            firstCurrentItem: timelineItems?.[0],
          });

          const itemsAreEqual = isEqual(timelineItems, result.timelineItems);
          TimelineLogger.debug("Timeline items comparison", {
            itemsAreEqual,
            willUpdate: !itemsAreEqual,
          });

          if (!itemsAreEqual) {
            TimelineLogger.debug(
              "Updating timeline items due to date column change",
            );
            setTimelineItems(result.timelineItems);
          } else {
            TimelineLogger.debug("Timeline items unchanged, skipping update");
          }

          if (!isEqual(timelineParams, result.timelineParams)) {
            setTimelineParams(result.timelineParams);
          }
        }
      } else {
        TimelineLogger.warn("processTimelineData returned no result", {
          boardItemCount: boardItems.length,
          hasSettings: !!settings,
        });
      }
    }
  }, [visibleBoardItems, settings]);

  return (
    <Box
      className="timeline-board"
      padding="medium"
      rounded="medium"
      border="true"
    >
      {/* Timeline Title */}

      {settings?.title && (
        <Flex justify="center" width="100%">
          <EditableHeading
            type="h3"
            value={settings?.titleText || "Timeline Title"}
            style={{ textAlign: "center" }}
          />
        </Flex>
      )}

      {/* Timeline container */}
      <Box
        style={{
          minHeight: "400px",
        }}
      >
        {timelineItems?.length > 0 ? (
          <Timeline
            onItemMove={onTimelineItemMove}
            onHideItem={hideItem}
            onLabelChange={onLabelChange}
          />
        ) : (
          <Loading />
        )}
      </Box>
      {/* Group Legend - only show if ledger setting is true */}

      {settings?.ledger && <GroupLegend />}
    </Box>
  );
};

export default TimelineBoard;
