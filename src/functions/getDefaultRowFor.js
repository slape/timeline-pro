export function getDefaultRowFor(item, positionSetting) {
  // Replace with your real default-row logic for above/below/alternate.
  // Must be deterministic per item+setting.
  if (positionSetting === "alternate") {
    const hash = Math.abs(hashCode(String(item.id)));
    return hash % 2 === 0 ? 0 : 1; // example; replace with your current algorithm
  }
  if (positionSetting === "above") return 0; // example
  if (positionSetting === "below") return 3; // example
  return 0;
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++)
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return h;
}
