// src/components/ApplicationContainer.tsx
import { DirectoryPanel } from "./DirectoryPanel";
import { MainContainer } from "./MainContainer";

export const ApplicationContainer = () => {
  return (
    <div className="grid grid-cols-[1fr,3fr] h-screen mx-auto gap-4">
      {/* Left Column - Directory Panel */}
      <div className="p-4 border-r">
        <DirectoryPanel />
      </div>

      {/* Main Column - Tabbed Interface */}
      <div className="flex flex-col h-full overflow-auto">
        <MainContainer />
      </div>
    </div>
  );
};
