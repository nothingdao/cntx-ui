// src/contexts/FileContext.tsx
import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import type { FileContextType } from './types';
import type { BundleManifest, WatchedFile } from '@/types/types';
import { useDirectory } from './DirectoryContext';
import { processDirectory, shouldIgnorePath } from '@/utils/file-utils';
import { loadState, saveState } from '@/utils/file-state';
import { useProjectConfig } from './ProjectConfigContext';

const FileContext = createContext<FileContextType>({
  watchedFiles: [],
  stagedFiles: [],
  toggleStaged: () => { },
  refreshFiles: async () => { },
  filterFiles: () => [],
});

export function FileProvider({ children }: { children: React.ReactNode }) {
  const [watchedFiles, setWatchedFiles] = useState<WatchedFile[]>([]);
  const { directoryHandle, isWatching, recentChanges } = useDirectory();
  const { ignorePatterns } = useProjectConfig();
  const [lastProcessedChange, setLastProcessedChange] = useState<Date | null>(null);

  const refreshFiles = useCallback(async () => {
    if (!directoryHandle || !isWatching) return;

    try {
      console.log('Refreshing files with ignore patterns:', ignorePatterns);
      const files = await processDirectory(directoryHandle, '', ignorePatterns);
      const cntxDir = await directoryHandle.getDirectoryHandle('.cntx');
      // const state = await loadState(cntxDir);
      const state = await loadState(cntxDir, ignorePatterns);

      let masterManifest: BundleManifest | null = null;

      try {
        const bundlesDir = await cntxDir.getDirectoryHandle('bundles');

        // Explicitly create the master directory if it doesn't exist
        let masterDir;
        try {
          masterDir = await bundlesDir.getDirectoryHandle('master', { create: true });
        } catch (error) {
          console.error('Error getting/creating master directory:', error);
          throw error;
        }

        const manifests = [];

        for await (const entry of masterDir.values()) {
          if (entry.kind === 'file' && entry.name.endsWith('-manifest.json')) {
            const file = await entry.getFile();
            manifests.push({
              file,
              entry,
              lastModified: file.lastModified
            });
          }
        }

        if (manifests.length > 0) {
          // Find the latest manifest based on lastModified
          const latestManifest = manifests.reduce((latest, current) => {
            return current.lastModified > latest.lastModified ? current : latest;
          });

          console.log(`Found master manifest: ${latestManifest.entry.name}`);
          const content = await latestManifest.file.text();

          try {
            masterManifest = JSON.parse(content);
            console.log(`Parsed master manifest, contains ${masterManifest.fileCount} files`);
          } catch (parseError) {
            console.error('Error parsing master manifest:', parseError);
          }
        } else {
          console.log('No master manifests found');
        }
      } catch (error) {
        console.log('No master bundle found or error reading it:', error);
      }

      const updatedFiles = files.map(file => {
        // Check if this file exists in the master manifest
        const masterFile = masterManifest?.files.find(f => f.path === file.path);

        // File is changed if it exists in master bundle and has a newer timestamp
        const isChanged = masterFile
          ? new Date(file.lastModified) > new Date(masterFile.lastModified)
          : true; // New file if not in master

        // Get existing state for this file or create default
        const existingState = state.files[file.path] || {
          isStaged: false,
          masterBundleId: masterManifest?.id,
          tags: []
        };

        return {
          ...file,
          isStaged: existingState.isStaged || false,
          isChanged,
          masterBundleId: existingState.masterBundleId || masterManifest?.id,
          tags: existingState.tags || []
        };
      });

      setWatchedFiles(updatedFiles);

      // Update the state with new files, but only for non-ignored files
      const newState = { ...state };
      updatedFiles.forEach(file => {
        if (!shouldIgnorePath(file.path, { ignore: ignorePatterns })) {
          newState.files[file.path] = {
            name: file.name,
            directory: file.directory,
            lastModified: file.lastModified.toISOString(),
            isChanged: file.isChanged,
            isStaged: file.isStaged,
            masterBundleId: file.masterBundleId,
            tags: file.tags
          };
        }
      });

      // Save the updated state
      // await saveState(cntxDir, state);
      await saveState(cntxDir, newState, ignorePatterns);

    } catch (error) {
      console.error('Error refreshing files:', error);
    }
  }, [directoryHandle, isWatching, ignorePatterns]);

  // Clear state when directory changes
  useEffect(() => {
    if (!directoryHandle) {
      setWatchedFiles([]);
    }
  }, [directoryHandle]);

  // // Combined effect for handling file changes and pattern updates
  // useEffect(() => {
  //   if (!directoryHandle || !isWatching) return;

  //   if (recentChanges.length > 0) {
  //     const latestChange = recentChanges[0];
  //     if (!lastProcessedChange || latestChange.timestamp > lastProcessedChange) {
  //       refreshFiles();
  //       setLastProcessedChange(latestChange.timestamp);
  //     }
  //   } else {
  //     refreshFiles();
  //   }
  // }, [directoryHandle, isWatching, recentChanges, refreshFiles, lastProcessedChange, ignorePatterns]);

  // useEffect(() => {
  //   if (directoryHandle && isWatching && ignorePatterns.length > 0) {
  //     console.log('Ignore patterns changed, triggering file refresh');
  //     refreshFiles();
  //   }
  // }, [ignorePatterns, directoryHandle, isWatching, refreshFiles]);


  // Separate effect for ignore pattern changes
  useEffect(() => {
    if (directoryHandle && isWatching && ignorePatterns.length > 0) {
      console.log('Ignore patterns changed, forcing refresh with patterns:', ignorePatterns);
      refreshFiles();
    }
  }, [ignorePatterns, directoryHandle, isWatching, refreshFiles]); // This effect only runs when patterns change

  // Separate effect for file changes
  useEffect(() => {
    if (!directoryHandle || !isWatching) return;

    const handleChanges = async () => {
      if (recentChanges.length > 0) {
        const latestChange = recentChanges[0];
        if (!lastProcessedChange || latestChange.timestamp > lastProcessedChange) {
          await refreshFiles();
          setLastProcessedChange(latestChange.timestamp);
        }
      }
    };

    handleChanges();
  }, [directoryHandle, isWatching, recentChanges, lastProcessedChange, refreshFiles]);

  const toggleStaged = useCallback(async (paths: string[]) => {
    if (!directoryHandle) return;

    try {
      const cntxDir = await directoryHandle.getDirectoryHandle('.cntx');
      const state = await loadState(cntxDir);
      const firstPath = paths[0];
      let targetState = false;

      if (state.files[firstPath]) {
        targetState = !state.files[firstPath].isStaged;
      }

      paths.forEach(path => {
        if (!state.files[path]) {
          const pathParts = path.split('/');
          state.files[path] = {
            name: pathParts[pathParts.length - 1],
            directory: pathParts.slice(0, -1).join('/') || 'Root',
            lastModified: new Date().toISOString(),
            isChanged: false,
            isStaged: targetState,
            masterBundleId: undefined,
            tags: []
          };
        } else {
          state.files[path].isStaged = targetState;
        }
      });

      await saveState(cntxDir, state);

      setWatchedFiles(prev => prev.map(file =>
        paths.includes(file.path)
          ? { ...file, isStaged: targetState }
          : file
      ));
    } catch (error) {
      console.error('Error toggling staged status:', error);
    }
  }, [directoryHandle]);

  const filterFiles = useCallback((criteria: Partial<WatchedFile>) => {
    return watchedFiles.filter(file =>
      Object.entries(criteria).every(([key, value]) => file[key as keyof WatchedFile] === value)
    );
  }, [watchedFiles]);

  const stagedFiles = watchedFiles.filter(file => file.isStaged);

  const value = {
    watchedFiles,
    stagedFiles,
    toggleStaged,
    refreshFiles,
    filterFiles,
  };

  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  );
}

export function useFiles() {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFiles must be used within a FileProvider');
  }
  return context;
}
