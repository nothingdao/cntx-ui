//src/contexts/FileContext.tsx
import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import type { FileContextType } from './types';
import type { BundleManifest, WatchedFile } from '@/types/types';
import { useDirectory } from './DirectoryContext';
import { processDirectory } from '@/utils/file-utils';
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
      const files = await processDirectory(directoryHandle, '', ignorePatterns);
      const rufasDir = await directoryHandle.getDirectoryHandle('.rufas');
      const state = await loadState(rufasDir);

      let masterManifest: BundleManifest | null = null;
      try {
        const bundlesDir = await rufasDir.getDirectoryHandle('bundles');
        const masterDir = await bundlesDir.getDirectoryHandle('master');
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
          const content = await latestManifest.file.text();
          masterManifest = JSON.parse(content);
        }
      } catch (error) {
        console.log('No master bundle found or error reading it:', error);
      }

      const updatedFiles = files.map(file => {
        const masterFile = masterManifest?.files.find(f => f.path === file.path);
        const isChanged = masterFile
          ? new Date(file.lastModified) > new Date(masterFile.lastModified)
          : true;

        return {
          ...file,
          isStaged: state.files[file.path]?.isStaged || false,
          isChanged,
          masterBundleId: state.files[file.path]?.masterBundleId,
          tags: state.files[file.path]?.tags || []
        };
      });

      setWatchedFiles(updatedFiles);
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

  // Combined effect for handling file changes and pattern updates
  useEffect(() => {
    if (!directoryHandle || !isWatching) return;

    if (recentChanges.length > 0) {
      const latestChange = recentChanges[0];
      if (!lastProcessedChange || latestChange.timestamp > lastProcessedChange) {
        refreshFiles();
        setLastProcessedChange(latestChange.timestamp);
      }
    } else {
      refreshFiles();
    }
  }, [directoryHandle, isWatching, recentChanges, refreshFiles, lastProcessedChange, ignorePatterns]);

  const toggleStaged = useCallback(async (paths: string[]) => {
    if (!directoryHandle) return;

    try {
      const rufasDir = await directoryHandle.getDirectoryHandle('.rufas');
      const state = await loadState(rufasDir);
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

      await saveState(rufasDir, state);

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
