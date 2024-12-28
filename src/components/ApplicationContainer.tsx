// src/components/Chat/ApplicationContainer.tsx
import { DirectoryPanel } from "./DirectoryPanel";
import { StateWatcher } from "./StateWatcher";
// import ConsoleLogsFeed from "./ConsoleLogs";

export const ApplicationContainer = () => {

  return (
    <div className="grid grid-cols-[1fr,3fr] h-screen mx-auto gap-4">
      {/* Menu Column */}
      <div className="p-4 border-r">
        <DirectoryPanel />
      </div>

      {/* Main Column
      */}
      {/* <div className="flex flex-col h-full">
        
      </div> */}
      {/* debugging tool */}
      <StateWatcher />
      {/* <FileViewer /> todo */}
      {/* Secondary Column */}
      {/* <ConsoleLogsFeed /> */}
      <div className="p-4 border-l">

      </div>
    </div>
  );
};
