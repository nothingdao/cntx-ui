// src/contexts/FileContext.tsx - ULTIMATE VERSION with bulletproof tag preservation
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
      console.log('🔄 Refreshing files - ULTIMATE tag preservation mode...');

      // Process directory to get current filesystem files
      const files = await processDirectory(directoryHandle, '', ignorePatterns);
      const cntxDir = await directoryHandle.getDirectoryHandle('.cntx');

      // ULTIMATE FIX: Load existing state with ZERO filtering to preserve ALL tags
      const existingState = await loadState(cntxDir, []); // NO filtering whatsoever
      console.log('📂 Loaded existing state for', Object.keys(existingState.files).length, 'files');

      // Log all files with tags before processing
      const existingTaggedFiles = Object.entries(existingState.files).filter(([, state]) =>
        state.tags && state.tags.length > 0
      );
      console.log(`🏷️  Found ${existingTaggedFiles.length} files with existing tags to preserve`);

      let masterManifest: BundleManifest | null = null;

      try {
        const bundlesDir = await cntxDir.getDirectoryHandle('bundles');
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

      // ULTIMATE MERGE: Combine filesystem data with preserved state data
      const updatedFiles = files.map(file => {
        // Check if this file exists in the master manifest
        const masterFile = masterManifest?.files.find(f => f.path === file.path);

        // File is changed if it exists in master bundle and has a newer timestamp
        const isChanged = masterFile
          ? new Date(file.lastModified) > new Date(masterFile.lastModified)
          : true; // New file if not in master

        // ULTIMATE PRESERVATION: Always prioritize existing state data
        const existingFileState = existingState.files[file.path];

        if (existingFileState) {
          // File exists in state - ABSOLUTELY PRESERVE ALL existing data
          console.log(`🏷️  PRESERVING existing state for ${file.path}:`, {
            tags: existingFileState.tags,
            staged: existingFileState.isStaged,
            bundleId: existingFileState.masterBundleId
          });

          return {
            ...file,
            isStaged: existingFileState.isStaged,
            isChanged,
            masterBundleId: existingFileState.masterBundleId || masterManifest?.id,
            // ULTIMATE: NEVER EVER lose existing tags
            tags: Array.isArray(existingFileState.tags) ? [...existingFileState.tags] : []
          };
        } else {
          // New file - create default state
          console.log(`➕ Creating new state for ${file.path}`);
          return {
            ...file,
            isStaged: false,
            isChanged,
            masterBundleId: masterManifest?.id,
            tags: []
          };
        }
      });

      setWatchedFiles(updatedFiles);

      // ULTIMATE STATE UPDATE: Start with existing state and only update what's necessary
      const newState = {
        ...existingState,
        lastAccessed: new Date().toISOString()
      };

      // Update state for files that exist in filesystem
      updatedFiles.forEach(file => {
        const existingFileState = newState.files[file.path];

        if (existingFileState) {
          // PRESERVE EVERYTHING, only update what actually changed
          newState.files[file.path] = {
            ...existingFileState, // Start with EVERYTHING from existing state
            // Only update filesystem-derived properties
            name: file.name,
            directory: file.directory,
            lastModified: file.lastModified.toISOString(),
            isChanged: file.isChanged,
            // Keep existing staging and bundle states unless explicitly changed
            isStaged: existingFileState.isStaged,
            masterBundleId: file.masterBundleId || existingFileState.masterBundleId,
            // ULTIMATE: ABSOLUTELY NEVER touch existing tags
            tags: existingFileState.tags || []
          };
        } else {
          // New file - create fresh entry
          newState.files[file.path] = {
            name: file.name,
            directory: file.directory,
            lastModified: file.lastModified.toISOString(),
            isChanged: file.isChanged,
            isStaged: file.isStaged,
            masterBundleId: file.masterBundleId,
            tags: []
          };
        }
      });

      // ULTIMATE RULE: Files with tags are NEVER removed from state
      // Even if they don't exist in the current filesystem scan
      const preservedTaggedFiles = Object.entries(existingState.files).filter(([path, state]) => {
        const hasImportantData = (state.tags && state.tags.length > 0) ||
          state.isStaged ||
          state.masterBundleId;
        const notInCurrentScan = !updatedFiles.find(f => f.path === path);

        return hasImportantData && notInCurrentScan;
      });

      if (preservedTaggedFiles.length > 0) {
        console.log(`🏷️  PRESERVING ${preservedTaggedFiles.length} files with important data that weren't in current scan:`);
        preservedTaggedFiles.forEach(([path, state]) => {
          console.log(`  ${path}: tags=[${state.tags?.join(', ') || 'none'}], staged=${state.isStaged}, bundleId=${state.masterBundleId}`);
          // Keep these files in the state even though they weren't scanned
          newState.files[path] = state;
        });
      }

      // Log final tag preservation verification
      const finalTaggedFiles = Object.entries(newState.files).filter(([, fileState]) =>
        fileState.tags && fileState.tags.length > 0
      );
      console.log(`✅ FINAL VERIFICATION: Preserving ${finalTaggedFiles.length} files with tags:`,
        finalTaggedFiles.slice(0, 5).map(([path, state]) => `${path} [${state.tags.join(', ')}]`)
      );

      // Save state with ULTIMATE tag preservation (no filtering)
      await saveState(cntxDir, newState, []); // NEVER filter when saving

    } catch (error) {
      console.error('❌ Error refreshing files:', error);
    }
  }, [directoryHandle, isWatching, ignorePatterns]);

  // Clear state when directory changes
  useEffect(() => {
    if (!directoryHandle) {
      setWatchedFiles([]);
    }
  }, [directoryHandle]);

  // Separate effect for ignore pattern changes
  useEffect(() => {
    if (directoryHandle && isWatching && ignorePatterns.length > 0) {
      console.log('🔧 Ignore patterns changed, refreshing with ULTIMATE tag preservation:', ignorePatterns);
      refreshFiles();
    }
  }, [ignorePatterns, directoryHandle, isWatching, refreshFiles]);

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

      // ULTIMATE: Load state without ANY filtering to preserve ALL tagged files
      const state = await loadState(cntxDir, []); // Absolutely no filtering
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
          // ULTIMATE PRESERVATION: Keep everything, only change isStaged
          state.files[path] = {
            ...state.files[path], // PRESERVE EVERYTHING including tags
            isStaged: targetState  // Only change this one property
          };
        }
      });

      // Save with ULTIMATE tag preservation (no filtering)
      await saveState(cntxDir, state, []); // Never filter when saving

      setWatchedFiles(prev => prev.map(file =>
        paths.includes(file.path)
          ? { ...file, isStaged: targetState }
          : file
      ));
    } catch (error) {
      console.error('❌ Error toggling staged status:', error);
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
