// src/components/FileWatcherPanel.tsx
import { useFileWatcher } from '../hooks/useFileWatcher';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Archive, Files, FolderOpen, Tags } from "lucide-react";
import { DirectoryTree } from './DirectoryTree';
import { BundlesList } from './BundlesList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function FileWatcherPanel() {

  const {
    watchedFiles,
    stagedFiles,
    bundles,
    selectDirectory,
    isWatching,
    createBundle,
    toggleStaged,
    currentDirectory
  } = useFileWatcher();

  const handleTestBundle = async () => {
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

  return (
    <div className="h-full flex flex-col">
      <div className="pb-4">

        <Button
          onClick={() => selectDirectory()}
          variant={isWatching ? "outline" : "default"}
        >
          <FolderOpen />
          {currentDirectory || 'Select Directory'}
        </Button>

        <p className="text-sm text-gray-500 mt-1">
          {isWatching ? 'Watching for changes...' : 'Select a directory to start watching'}
        </p>

      </div>

      <Tabs defaultValue="files">
        <TabsList>
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
        <TabsContent value="files">


          <div className="flex items-center justify-between py-4 gap-2">
            <div className="flex items-center gap-2">
              {isWatching && (
                <>
                  <Button
                    onClick={handleTestBundle}
                    variant="outline"
                    size="sm"
                    disabled={stagedFiles.length === 0}
                  >
                    Bundle ({stagedFiles.length})
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
          <ScrollArea className="flex-1">
            <div className="">
              <BundlesList bundles={bundles} />
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="tags">
          <ScrollArea className="flex-1">
            <div className="">
              <div className="text-center py-8 text-gray-500">
                No tags yet
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

    </div>
  );
}
