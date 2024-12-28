// src/components/DirectoryPanel.tsx
import { useCallback } from 'react';
import { Archive, Files, Filter, FolderOpen, Paintbrush, Settings, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ModeToggle } from './theme/mode-toggle';
import { MasterBundlePanel } from './MasterBundlePanel';
import { TagsPanel } from './TagsPanel';
import { DirectoryTree } from './DirectoryTree';
import { ConfigPanel } from './ConfigPanel';

// Import the new context hooks
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

  const {
    isProjectInitialized
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


  const handleTagSelected = useCallback(() => {
    //  Implement this function. 
    // sort the list of files by tag(s).
  }, []);

  const handleFilterFiles = useCallback(() => {
    // Implement this function
    // create a FilterFiles.tsx component to allow sorting by tag(s), modifiedFiles, unTaggedFiles (any file not having a tag assigned to it).
  }, []);


  return (
    <div className="h-full flex flex-col">
      <div className="flex space-x-2">
        <div className="text-xs">
          {/* Rufas */}
          &nbsp;&nbsp;(\__/)<br />
          (o˘ᴗ˘o)<br />
        </div>
        <Button
          onClick={selectDirectory}
          variant={isWatching ? "outline" : "default"}
        >
          <FolderOpen className="mr-2 h-4 w-4" />
          {currentDirectory || 'Select Directory'}
        </Button>
        <ModeToggle />
      </div>

      <div className="text-xs text-muted-foreground py-2">
        {isWatching ? 'Watching for changes...' : 'Select a directory to start watching'}
      </div>

      <Tabs defaultValue="files">
        <div className="py-4">
          <TabsList className='flex space-x-2'>
            <TabsTrigger value="files">
              <Files className="h-5 w-5 pr-2" />
              Files
            </TabsTrigger>
            <TabsTrigger value="bundles">
              <Archive className="h-5 w-5 pr-2" />
              Bundles
            </TabsTrigger>
            <TabsTrigger value="tags">
              <Tags className="h-5 w-5 pr-2" />
              Tags
            </TabsTrigger>
            <TabsTrigger value="config">
              <Settings className="h-5 w-5 pr-2" />
              Config
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="files">
          <div className="flex items-center justify-between gap-2 mb-4">
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
                    onClick={handleTagSelected} // Implement handleTagSelected function
                    variant="outline"
                    size="sm"
                    disabled={stagedFiles.length === 0}
                  >
                    <Paintbrush className="h-4 w-4" />
                    Tag ({stagedFiles.length})
                  </Button>
                  <Button
                    onClick={handleClearStaged}
                    variant="outline"
                    size="sm"
                    disabled={stagedFiles.length === 0}
                  >
                    Clear Selection
                  </Button>
                  <Button
                    onClick={handleFilterFiles} // Implement handleFilterFiles function
                    variant="outline"
                    size="sm"
                  >
                    <Filter />
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
            <div className="text-center py-8 text-muted-foreground">
              {isWatching ? 'No files found in selected directory' : 'Select a directory to get started'}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bundles">
          <MasterBundlePanel />
        </TabsContent>

        <TabsContent value="tags">
          <TagsPanel />
        </TabsContent>

        <TabsContent value="config">
          <ConfigPanel />
        </TabsContent>

      </Tabs>
    </div>
  );
}
