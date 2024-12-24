// src/components/Chat/ApplicationContainer.tsx
import { DirectoryWatcherPanel } from "@/components/DirectoryWatcherPanel";
export const ApplicationContainer = () => {

  return (
    <div className="grid grid-cols-[300px,1fr,400px] h-screen mx-auto gap-4">
      {/* Menu Column */}
      <div className="p-4 border-r">
        <DirectoryWatcherPanel />
      </div>

      {/* Main Column
      */}
      <div className="flex flex-col h-full">

      </div>

      {/* Secondary Column */}
      <div className="p-4 border-l">
        <div className="flex items-center space-x-2 mb-4">
          <h2 className="text-lg font-semibold">Secondary Content</h2>
        </div>
        <div className="text-gray-500">No content loded</div>
      </div>
    </div>
  );
};
