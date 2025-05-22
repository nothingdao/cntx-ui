// src/contexts/BundleContext.tsx
import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import type { BundleContextType } from './types';
import type { Bundle } from '@/types/types';
import { useDirectory } from './DirectoryContext';
import { useFiles } from './FileContext';
import { useProjectConfig } from './ProjectConfigContext';  // Added for access to ignore patterns
import { createBundleFile } from '@/utils/file-state';
import { createMasterBundle as createMasterBundleUtil } from '@/utils/project-utils';

const BundleContext = createContext<BundleContextType>({
  bundles: [],
  masterBundle: null,
  createBundle: async () => '',
  updateBundle: async () => ({ success: false }),
  createMasterBundle: async () => { },
  loadBundles: async () => { },
});

export function BundleProvider({ children }: { children: React.ReactNode }) {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [masterBundle, setMasterBundle] = useState<Bundle | null>(null);
  const { directoryHandle, isWatching } = useDirectory();
  const { watchedFiles, stagedFiles, refreshFiles } = useFiles();
  const { ignorePatterns } = useProjectConfig();  // Get ignore patterns from config

  const loadBundles = useCallback(async () => {
    if (!directoryHandle || !isWatching) return;

    try {
      console.log('Loading bundles...');
      const cntxDir = await directoryHandle.getDirectoryHandle('.cntx');
      const bundlesDir = await cntxDir.getDirectoryHandle('bundles');
      const loadedBundles: Bundle[] = [];

      // Load regular bundles
      for await (const entry of bundlesDir.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.txt') && !entry.name.startsWith('master-')) {
          const file = await entry.getFile();
          const content = await file.text();
          const fileCount = (content.match(/<document>/g) || []).length;

          // Extract bundle ID from the name for manifest loading
          const bundleId = entry.name.replace(/\.txt$/, '');
          let tagsCount = 0;

          // Try to load the manifest to get more info
          try {
            const manifestName = `${bundleId}-manifest.json`;
            const manifestFile = await bundlesDir.getFileHandle(manifestName);
            const manifestContent = await manifestFile.getFile().then(f => f.text());
            const manifest = JSON.parse(manifestContent);

            // Count how many files in the manifest have tags (from current watchedFiles)
            const taggedFilePaths = new Set(watchedFiles.filter(f => f.tags?.length > 0).map(f => f.path));
            const manifestFilesWithTags = manifest.files.filter((f: any) => taggedFilePaths.has(f.path));
            tagsCount = manifestFilesWithTags.length;
          } catch (error) {
            // If manifest can't be loaded, just continue
            console.log(`Could not load manifest for ${entry.name}:`, error);
          }

          loadedBundles.push({
            name: entry.name,
            timestamp: new Date(file.lastModified),
            fileCount,
            tagCount: tagsCount
          });
        }
      }

      // Load master bundles
      try {
        // Always use create: true to ensure directory exists
        const masterDir = await bundlesDir.getDirectoryHandle('master', { create: true });
        console.log('Found master directory, checking for master bundles...');

        let latestMasterBundle: Bundle | null = null;
        let latestTimestamp = 0;

        for await (const entry of masterDir.values()) {
          if (entry.kind === 'file' && entry.name.endsWith('.txt')) {
            const file = await entry.getFile();
            const content = await file.text();
            const fileCount = (content.match(/<document>/g) || []).length;
            const timestamp = file.lastModified;

            console.log(`Found master bundle: ${entry.name}, timestamp: ${new Date(timestamp)}`);

            if (timestamp > latestTimestamp) {
              latestTimestamp = timestamp;
              latestMasterBundle = {
                name: entry.name,
                timestamp: new Date(timestamp),
                fileCount,
                tagCount: 0 // We'll update this after loading if possible
              };
            }
          }
        }

        // If we found a master bundle, try to load its tag info
        if (latestMasterBundle) {
          console.log(`Setting master bundle to: ${latestMasterBundle.name}`);

          // Try to get tag count for master bundle
          try {
            const bundleId = latestMasterBundle.name.replace(/\.txt$/, '');
            const manifestName = `${bundleId}-manifest.json`;
            const manifestFile = await masterDir.getFileHandle(manifestName);
            const manifestContent = await manifestFile.getFile().then(f => f.text());
            const manifest = JSON.parse(manifestContent);

            // Count how many files in the manifest have tags (from current watchedFiles)
            const taggedFilePaths = new Set(watchedFiles.filter(f => f.tags?.length > 0).map(f => f.path));
            const manifestFilesWithTags = manifest.files.filter((f: any) => taggedFilePaths.has(f.path));
            latestMasterBundle.tagCount = manifestFilesWithTags.length;
          } catch (error) {
            console.log(`Could not load tag info for master bundle:`, error);
          }

          setMasterBundle(latestMasterBundle);
        } else {
          console.log('No master bundles found');
          setMasterBundle(null);
        }
      } catch (error) {
        console.error('Error loading master bundles:', error);
        setMasterBundle(null);
      }

      setBundles(loadedBundles.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
    } catch (error) {
      console.error('Error loading bundles:', error);
    }
  }, [directoryHandle, isWatching, watchedFiles]);

  // Load bundles when directory is selected
  useEffect(() => {
    if (directoryHandle && isWatching) {
      loadBundles();
    }
  }, [directoryHandle, isWatching, loadBundles]);

  const createBundle = useCallback(async () => {
    if (!directoryHandle) return '';

    try {
      const cntxDir = await directoryHandle.getDirectoryHandle('.cntx');
      console.log('Creating bundle with staged files...');
      const result = await createBundleFile(stagedFiles, cntxDir);

      if (result.success) {
        console.log('Bundle created successfully:', result.bundleId);
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
    if (!directoryHandle) {
      console.error('No directory handle available');
      return;
    }

    try {
      console.log('Creating master bundle with ignore patterns:', ignorePatterns);
      const cntxDir = await directoryHandle.getDirectoryHandle('.cntx');
      const result = await createMasterBundleUtil(watchedFiles, cntxDir, ignorePatterns);

      if (result.success) {
        console.log('Master bundle created successfully!');
        await loadBundles(); // Refresh bundle list
        await refreshFiles(); // Refresh file states
      } else {
        console.error('Failed to create master bundle:', result.error);
      }
    } catch (error) {
      console.error('Error creating master bundle:', error);
      throw error; // Rethrow for UI handling
    }
  }, [directoryHandle, watchedFiles, ignorePatterns, loadBundles, refreshFiles]);

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
