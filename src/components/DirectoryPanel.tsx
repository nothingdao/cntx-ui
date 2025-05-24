// src/components/DirectoryPanel.tsx - UPDATED with working batch tagging
import { useCallback } from 'react';
import { Filter, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from './theme/mode-toggle';
import { DirectoryTree } from './DirectoryTree';
import { BatchTagButton } from './BatchTagButton'; // New import

// Import all the necessary context hooks including ProjectConfigContext
import { useDirectory } from '@/contexts/DirectoryContext';
import { useFiles } from '@/contexts/FileContext';
import { useBundles } from '@/contexts/BundleContext';
import { useProjectConfig } from '@/contexts/ProjectConfigContext';

export function DirectoryPanel() {
  const {
    currentDirectory,
    selectDirectory,
    isWatching
  } = useDirectory();

  const {
    watchedFiles,
    stagedFiles,
    toggleStaged,
    refreshFiles
  } = useFiles();

  const {
    createBundle
  } = useBundles();

  // IMPORTANT: Keep this to maintain the ignore patterns functionality
  const {
    ignorePatterns
  } = useProjectConfig();

  // Handle bundle creation
  const handleMakeBundle = useCallback(async () => {
    if (stagedFiles.length === 0) {
      console.log('No files staged for bundle');
      return;
    }

    try {
      const bundleId = await createBundle();
      console.log('📦 Bundle created successfully:', bundleId);

      // Refresh files after bundle creation
      await refreshFiles();
    } catch (error) {
      console.error('Error creating bundle:', error);
    }
  }, [stagedFiles.length, createBundle, refreshFiles]);

  // Handle clearing staged files
  const handleClearStaged = useCallback(() => {
    if (stagedFiles.length > 0) {
      toggleStaged(stagedFiles.map(f => f.path));
    }
  }, [stagedFiles, toggleStaged]);

  // Handle successful tagging (refresh the tree to show new tags)
  const handleTagsApplied = useCallback(async () => {
    console.log('🏷️  Tags applied successfully, refreshing file tree...');
    await refreshFiles();
  }, [refreshFiles]);

  const handleFilterFiles = useCallback(() => {
    // Implementation for filtering files - could open a filter dialog
    console.log('🔍 Filter files clicked - implement filter dialog');
  }, []);

  // Log the current ignore patterns to verify they're loaded correctly
  console.log("DirectoryPanel - Current ignore patterns:", ignorePatterns);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <Button
          onClick={selectDirectory}
          variant={isWatching ? "outline" : "default"}
          className="flex-grow mr-2"
        >
          <FolderOpen className="mr-2 h-4 w-4" />
          {currentDirectory || 'Select Directory'}
        </Button>
        <ModeToggle />
      </div>

      <div className="text-xs text-muted-foreground pb-4">
        {isWatching ? 'Watching for changes...' : 'Select a directory to start watching'}
      </div>

      {/* File actions */}
      {isWatching && (
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleMakeBundle}
              variant="outline"
              size="sm"
              disabled={stagedFiles.length === 0}
              className="flex-grow"
            >
              Bundle ({stagedFiles.length})
            </Button>

            {/* NEW: Batch Tag Button */}
            <BatchTagButton
              selectedFiles={stagedFiles}
              onTagsApplied={handleTagsApplied}
            />

            <Button
              onClick={handleFilterFiles}
              variant="outline"
              size="sm"
              title="Filter files (coming soon)"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleClearStaged}
              variant="outline"
              size="sm"
              disabled={stagedFiles.length === 0}
              className="flex-grow"
            >
              Clear Selection
            </Button>
          </div>

          {/* Selection summary */}
          {stagedFiles.length > 0 && (
            <div className="text-xs text-muted-foreground bg-muted rounded p-2">
              <div className="font-medium">Selected files:</div>
              <div className="max-h-20 overflow-y-auto mt-1">
                {stagedFiles.slice(0, 5).map((file, index) => (
                  <div key={file.path} className="truncate">
                    {index + 1}. {file.name}
                    {file.tags && file.tags.length > 0 && (
                      <span className="ml-2 text-xs opacity-70">
                        [{file.tags.join(', ')}]
                      </span>
                    )}
                  </div>
                ))}
                {stagedFiles.length > 5 && (
                  <div className="text-xs opacity-70 mt-1">
                    ... and {stagedFiles.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Directory Tree - ensure it gets the necessary configuration */}
      {watchedFiles.length > 0 ? (
        <DirectoryTree
          files={watchedFiles}
          onToggleStage={toggleStaged}
        />
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          {isWatching ? 'No files found in selected directory' : 'Select a directory to get started'}
        </div>
      )}
    </div>
  );
}
