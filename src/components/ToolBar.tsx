import ExportButton from "./ExportButton";
import HiddenItemsManager from "./HiddenItemsManager";

export default function ToolBar() {
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-100 border-b">
      <ExportButton />
      <HiddenItemsManager />
    </div>
  );
}