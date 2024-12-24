// src/components/DirectoryWatcherPanel.tsx
import { useDirectoryWatcher } from "@/hooks/useDirectoryWatcher";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Archive, Files, FolderOpen, Tags } from "lucide-react";
import { DirectoryTree } from './DirectoryTree';
import { BundlesList } from './BundlesList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ModeToggle } from './mode-toggle';
import { MasterBundlePanel } from './MasterBundlePanel';
import { TagsPanel } from './TagsPanel';

export function DirectoryWatcherPanel() {

  const {
    watchedFiles,
    stagedFiles,
    bundles,
    selectDirectory,
    isWatching,
    createBundle,
    toggleStaged,
    currentDirectory
  } = useDirectoryWatcher();

  const handleMakeBundle = async () => {
    if (stagedFiles.length === 0) {
      console.log('No files staged for bundle');
      return;
    }

    const bundle = await createBundle();
    if (!bundle) {
      console.error('Failed to create bundle');
      return;
    }

    console.log('Bundle created successfully');
  };

  const handleClearStaged = () => {
    // Toggle all currently staged files to unstage them
    if (stagedFiles.length > 0) {
      toggleStaged(stagedFiles.map(f => f.path));
    }
  };

  return (
    <div className="h-full flex flex-col">

      <div className="flex space-x-2">
        <Button
          onClick={() => selectDirectory()}
          variant={isWatching ? "outline" : "default"}
        >
          <FolderOpen />
          {currentDirectory || 'Select Directory'}
        </Button>
        <ModeToggle />
      </div>

      <div className="text-xs text-gray-500 pl-2 pt-1 pb-4">
        {isWatching ? 'Watching for changes...' : 'Select a directory to start watching'}
      </div>


      <Tabs defaultValue="files">


        <div className="pb-4">
          <TabsList className='flex space-x-2'>
            <TabsTrigger value="files">
              <Files className="h-5 w-5 pr-2" />
              Files</TabsTrigger>
            <TabsTrigger value="bundles">
              <Archive className="h-5 w-5 pr-2" />
              Bundles
            </TabsTrigger>
            <TabsTrigger value="tags">
              <Tags className="h-5 w-5 pr-2" />
              Tags
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="files">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {isWatching && (
                <>
                  <Button
                    onClick={handleMakeBundle}
                    variant="outline"
                    size="sm"
                    disabled={stagedFiles.length === 0}
                  >
                    Bundle ({stagedFiles.length})
                  </Button>
                  <Button
                    onClick={handleClearStaged}
                    variant="outline"
                    size="sm"
                    disabled={stagedFiles.length === 0}
                  >
                    Clear Selection
                  </Button>
                </>
              )}
            </div>
          </div>

          {watchedFiles.length > 0 ? (
            <DirectoryTree
              files={watchedFiles}
              onToggleStage={toggleStaged}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              {isWatching ? 'No files found in selected directory' : 'Select a directory to get started'}
            </div>
          )}

        </TabsContent>
        <TabsContent value="bundles">
          <MasterBundlePanel />
          <ScrollArea className="flex-1">
            <div className="">
              <BundlesList bundles={bundles} />
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="tags">
          <TagsPanel />
        </TabsContent>
      </Tabs>

    </div>
  );
}
