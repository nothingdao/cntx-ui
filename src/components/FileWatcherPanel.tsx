// src/components/FileWatcherPanel.tsx
import { useFileWatcher } from '../hooks/useFileWatcher';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FolderOpen, RefreshCw } from "lucide-react";
import { DirectoryTree } from './DirectoryTree';

export function FileWatcherPanel() {
  const {
    watchedFiles,
    stagedFiles,
    selectDirectory,
    refreshFiles,
    isWatching,
    createBundle,
    toggleStaged
  } = useFileWatcher();

  const handleTestBundle = () => {
    if (stagedFiles.length === 0) {
      console.log('No files staged for bundle');
      return;
    }

    const bundle = createBundle();
    console.log('Bundle output:', bundle);
    const blob = new Blob([bundle], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'file-bundle.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b pb-4">
        <h2 className="text-lg font-semibold flex items-center space-x-2">
          <FolderOpen className="h-5 w-5" />
          <span>Watched Files</span>
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {isWatching ? 'Watching for changes...' : 'Select a directory to start watching'}
        </p>
      </div>

      <div className="flex items-center justify-between py-4 gap-2">
        <Button
          onClick={() => selectDirectory()}
          variant={isWatching ? "secondary" : "default"}
          className="flex items-center space-x-2"
        >
          <FolderOpen className="h-4 w-4" />
          <span>{isWatching ? 'Change Directory' : 'Select Directory'}</span>
        </Button>

        <div className="flex items-center gap-2">
          {isWatching && (
            <>
              <Button
                onClick={() => refreshFiles()}
                variant="outline"
                size="icon"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
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

      <ScrollArea className="flex-1">
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
      </ScrollArea>
    </div>
  );
}
