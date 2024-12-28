// src/contexts/BundleContext.tsx
//
import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import type { BundleContextType } from './types';
import type { Bundle } from '@/types/types';
import { useDirectory } from './DirectoryContext';
import { useFiles } from './FileContext';
import { createBundleFile } from '@/utils/file-state';
import { createMasterBundle as createMasterBundleUtil } from '@/utils/project-utils';

const BundleContext = createContext<BundleContextType>({
  bundles: [],
  masterBundle: null,
  createBundle: async () => '',
  createMasterBundle: async () => { },
  loadBundles: async () => { },
});

export function BundleProvider({ children }: { children: React.ReactNode }) {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [masterBundle, setMasterBundle] = useState<Bundle | null>(null);
  const { directoryHandle, isWatching } = useDirectory();
  const { watchedFiles, stagedFiles, refreshFiles } = useFiles();

  const loadBundles = useCallback(async () => {
    if (!directoryHandle || !isWatching) return;

    try {
      const rufasDir = await directoryHandle.getDirectoryHandle('.rufas');
      const bundlesDir = await rufasDir.getDirectoryHandle('bundles');
      const loadedBundles: Bundle[] = [];

      // Load regular bundles
      for await (const entry of bundlesDir.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.txt') && !entry.name.startsWith('master-')) {
          const file = await entry.getFile();
          const content = await file.text();
          const fileCount = (content.match(/<document>/g) || []).length;

          loadedBundles.push({
            name: entry.name,
            timestamp: new Date(file.lastModified),
            fileCount
          });
        }
      }

      // Load master bundles
      try {
        const masterDir = await bundlesDir.getDirectoryHandle('master');
        for await (const entry of masterDir.values()) {
          if (entry.kind === 'file' && entry.name.endsWith('.txt')) {
            const file = await entry.getFile();
            const content = await file.text();
            const fileCount = (content.match(/<document>/g) || []).length;

            setMasterBundle({
              name: entry.name,
              timestamp: new Date(file.lastModified),
              fileCount
            });
            break; // Only get the latest master bundle
          }
        }
      } catch (error) {
        console.log('No master bundle found');
      }

      setBundles(loadedBundles.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
    } catch (error) {
      console.error('Error loading bundles:', error);
    }
  }, [directoryHandle, isWatching]);

  // Load bundles when directory is selected
  useEffect(() => {
    if (directoryHandle && isWatching) {
      loadBundles();
    }
  }, [directoryHandle, isWatching, loadBundles]);

  const createBundle = useCallback(async () => {
    if (!directoryHandle) return '';

    try {
      const rufasDir = await directoryHandle.getDirectoryHandle('.rufas');
      const result = await createBundleFile(stagedFiles, rufasDir);

      if (result.success) {
        await loadBundles(); // Refresh bundle list
        await refreshFiles(); // Refresh file states
        return result.bundleId || '';
      }

      console.error('Failed to create bundle:', result.error);
      return '';
    } catch (error) {
      console.error('Error creating bundle:', error);
      return '';
    }
  }, [directoryHandle, stagedFiles, loadBundles, refreshFiles]);

  const createMasterBundle = useCallback(async () => {
    if (!directoryHandle) return;

    try {
      const rufasDir = await directoryHandle.getDirectoryHandle('.rufas');
      const result = await createMasterBundleUtil(watchedFiles, rufasDir);

      if (result.success) {
        await loadBundles(); // Refresh bundle list
        await refreshFiles(); // Refresh file states
      } else {
        console.error('Failed to create master bundle:', result.error);
      }
    } catch (error) {
      console.error('Error creating master bundle:', error);
    }
  }, [directoryHandle, watchedFiles, loadBundles, refreshFiles]);

  const value = {
    bundles,
    masterBundle,
    createBundle,
    createMasterBundle,
    loadBundles,
  };

  return (
    <BundleContext.Provider value={value}>
      {children}
    </BundleContext.Provider>
  );
}

export function useBundles() {
  const context = useContext(BundleContext);
  if (!context) {
    throw new Error('useBundles must be used within a BundleProvider');
  }
  return context;
}
