import { AttentionBox } from '@vibe/core';

const InvalidTimelineDates = () => (
  <AttentionBox
    title="Timeline Dates Invalid"
    text="The timeline cannot be displayed because the start or end date is missing or invalid. Please check your board items and settings."
    type="danger"
  />
);

export default InvalidTimelineDates;
