// src/contexts/BundleContext.tsx - Enhanced with update operations
import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import type { Bundle } from '@/types/types';
import { useDirectory } from './DirectoryContext';
import { useFiles } from './FileContext';
import { useProjectConfig } from './ProjectConfigContext';
import { createBundleFile, createTagBundleFile } from '@/utils/file-state';
import { createMasterBundle as createMasterBundleUtil } from '@/utils/project-utils';

// Enhanced context type with update operations
type BundleContextType = {
  bundles: Bundle[];
  masterBundle: Bundle | null;
  createBundle: () => Promise<string>;
  createTagBundle: (tagName: string) => Promise<string>;
  updateBundle: (
    bundleName: string,
    filesToInclude: any[],
    filesToRemove?: string[]
  ) => Promise<{ success: boolean; error?: string; bundleId?: string }>;
  createMasterBundle: () => Promise<void>;
  loadBundles: () => Promise<void>;
};

const BundleContext = createContext<BundleContextType>({
  bundles: [],
  masterBundle: null,
  createBundle: async () => '',
  createTagBundle: async () => '',
  updateBundle: async () => ({ success: false }),
  createMasterBundle: async () => { },
  loadBundles: async () => { },
});

export function BundleProvider({ children }: { children: React.ReactNode }) {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [masterBundle, setMasterBundle] = useState<Bundle | null>(null);
  const { directoryHandle, isWatching } = useDirectory();
  const { watchedFiles, stagedFiles, refreshFiles } = useFiles();
  const { ignorePatterns } = useProjectConfig();

  // Helper function to load a bundle with proper type detection and metadata extraction
  const loadBundleWithType = useCallback(async (
    entry: FileSystemFileHandle,
    dir: FileSystemDirectoryHandle,
    defaultType: 'master' | 'tag-derived' | 'custom',
    derivedFromTag?: string
  ): Promise<Bundle | null> => {
    try {
      const file = await entry.getFile();
      const content = await file.text();
      const fileCount = (content.match(/<document>/g) || []).length;

      // Extract enhanced metadata from bundle XML content
      const typeMatch = content.match(/type="([^"]+)"/);
      const derivedTagMatch = content.match(/<derivedFromTag>([^<]+)<\/derivedFromTag>/);
      const descriptionMatch = content.match(/<description>([^<]+)<\/description>/);

      // Determine actual bundle type and metadata
      const bundleType = (typeMatch?.[1] as any) || defaultType;
      const actualDerivedTag = derivedTagMatch?.[1] || derivedFromTag;
      const description = descriptionMatch?.[1];

      // Generate bundle ID from filename
      const bundleId = entry.name.replace(/\.txt$/, '');

      // Try to load manifest for enhanced tag counting
      let tagsCount = 0;
      try {
        const manifestName = `${bundleId}-manifest.json`;
        const manifestFile = await dir.getFileHandle(manifestName);
        const manifestContent = await manifestFile.getFile().then(f => f.text());
        const manifest = JSON.parse(manifestContent);

        // Count how many files in the manifest have tags (from current watchedFiles)
        const taggedFilePaths = new Set(watchedFiles.filter(f => f.tags?.length > 0).map(f => f.path));
        const manifestFilesWithTags = manifest.files.filter((f: any) => taggedFilePaths.has(f.path));
        tagsCount = manifestFilesWithTags.length;
      } catch (error) {
        console.log(`Could not load manifest for ${entry.name}:`, error);
      }

      // Generate automatic description for tag-derived bundles if not provided
      const finalDescription = description ||
        (bundleType === 'tag-derived' ? `Files tagged with "${actualDerivedTag}"` : undefined);

      return {
        name: entry.name,
        timestamp: new Date(file.lastModified),
        fileCount,
        tagCount: tagsCount,
        type: bundleType,
        id: bundleId,
        derivedFromTag: actualDerivedTag,
        description: finalDescription,
      };
    } catch (error) {
      console.error(`Error loading bundle ${entry.name}:`, error);
      return null;
    }
  }, [watchedFiles]);

  const loadBundles = useCallback(async () => {
    if (!directoryHandle || !isWatching) return;

    try {
      console.log('🔄 Loading bundles with enhanced type detection...');
      const cntxDir = await directoryHandle.getDirectoryHandle('.cntx');
      const bundlesDir = await cntxDir.getDirectoryHandle('bundles');
      const loadedBundles: Bundle[] = [];

      // 1. Load custom bundles (regular bundles in root bundles directory)
      console.log('📦 Loading custom bundles...');
      for await (const entry of bundlesDir.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.txt') && !entry.name.startsWith('master-')) {
          const bundle = await loadBundleWithType(entry, bundlesDir, 'custom');
          if (bundle) {
            console.log(`✅ Loaded custom bundle: ${bundle.name} (${bundle.fileCount} files)`);
            loadedBundles.push(bundle);
          }
        }
      }

      // 2. Load tag-derived bundles from tag-bundles subdirectory
      console.log('🏷️  Loading tag-derived bundles...');
      try {
        const tagBundlesDir = await bundlesDir.getDirectoryHandle('tag-bundles');

        for await (const tagDirEntry of tagBundlesDir.values()) {
          if (tagDirEntry.kind === 'directory') {
            const tagDir = tagDirEntry as FileSystemDirectoryHandle;
            const tagName = tagDirEntry.name;

            console.log(`🔍 Checking tag directory: ${tagName}`);

            for await (const bundleEntry of tagDir.values()) {
              if (bundleEntry.kind === 'file' && bundleEntry.name.endsWith('.txt')) {
                const bundle = await loadBundleWithType(bundleEntry, tagDir, 'tag-derived', tagName);
                if (bundle) {
                  console.log(`✅ Loaded tag-derived bundle: ${bundle.name} (tag: ${tagName}, ${bundle.fileCount} files)`);
                  loadedBundles.push(bundle);
                }
              }
            }
          }
        }
      } catch (error) {
        console.log('ℹ️  No tag-bundles directory found or error loading tag bundles:', error);
      }

      // 3. Load master bundles (keep existing logic but with enhanced type detection)
      console.log('👑 Loading master bundles...');
      try {
        const masterDir = await bundlesDir.getDirectoryHandle('master', { create: true });

        let latestMasterBundle: Bundle | null = null;
        let latestTimestamp = 0;

        for await (const entry of masterDir.values()) {
          if (entry.kind === 'file' && entry.name.endsWith('.txt')) {
            const bundle = await loadBundleWithType(entry, masterDir, 'master');
            if (bundle && bundle.timestamp.getTime() > latestTimestamp) {
              latestTimestamp = bundle.timestamp.getTime();
              latestMasterBundle = bundle;
              console.log(`🔍 Found master bundle: ${bundle.name}, timestamp: ${bundle.timestamp}`);
            }
          }
        }

        if (latestMasterBundle) {
          console.log(`👑 Setting master bundle to: ${latestMasterBundle.name}`);
          setMasterBundle(latestMasterBundle);
        } else {
          console.log('ℹ️  No master bundles found');
          setMasterBundle(null);
        }
      } catch (error) {
        console.error('❌ Error loading master bundles:', error);
        setMasterBundle(null);
      }

      // Sort all bundles by timestamp (newest first)
      const sortedBundles = loadedBundles.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Log summary statistics
      const bundleStats = {
        custom: sortedBundles.filter(b => b.type === 'custom').length,
        tagDerived: sortedBundles.filter(b => b.type === 'tag-derived').length,
        master: masterBundle ? 1 : 0,
        total: sortedBundles.length + (masterBundle ? 1 : 0)
      };

      console.log(`📊 Bundle loading complete:`, bundleStats);
      console.log(`   • ${bundleStats.custom} custom bundles`);
      console.log(`   • ${bundleStats.tagDerived} tag-derived bundles`);
      console.log(`   • ${bundleStats.master} master bundle`);
      console.log(`   • ${bundleStats.total} total bundles`);

      setBundles(sortedBundles);
    } catch (error) {
      console.error('❌ Error loading bundles:', error);
    }
  }, [directoryHandle, isWatching, watchedFiles, loadBundleWithType]);

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

  // Create tag-derived bundle
  const createTagBundle = useCallback(async (tagName: string, existingBundle?: Bundle) => {
    if (!directoryHandle) {
      throw new Error('No directory handle available');
    }

    try {
      const cntxDir = await directoryHandle.getDirectoryHandle('.cntx');
      const filesWithTag = watchedFiles.filter(file => file.tags?.includes(tagName));

      if (filesWithTag.length === 0) {
        throw new Error(`No files found with tag "${tagName}"`);
      }

      console.log(`${existingBundle ? 'Updating' : 'Creating'} tag bundle for "${tagName}" with ${filesWithTag.length} files`);

      // Pass existing bundle ID if updating
      const result = await createTagBundleFile(
        filesWithTag,
        tagName,
        cntxDir,
        existingBundle?.id // Pass existing ID for updates
      );

      if (result.success) {
        console.log(`Tag bundle ${existingBundle ? 'updated' : 'created'} successfully:`, result.bundleId);
        await loadBundles();
        await refreshFiles();
        return result.bundleId || '';
      }

      throw new Error(result.error || 'Failed to create tag bundle');
    } catch (error) {
      console.error('Error with tag bundle:', error);
      throw error;
    }
  }, [directoryHandle, watchedFiles, loadBundles, refreshFiles]);

  const createMasterBundle = useCallback(async (existingBundle?: Bundle) => {
    if (!directoryHandle) {
      console.error('No directory handle available');
      return;
    }

    try {
      console.log(`${existingBundle ? 'Updating' : 'Creating'} master bundle with ignore patterns:`, ignorePatterns);
      const cntxDir = await directoryHandle.getDirectoryHandle('.cntx');

      // Pass existing bundle ID if updating
      const result = await createMasterBundleUtil(
        watchedFiles,
        cntxDir,
        ignorePatterns,
        existingBundle?.id // Pass existing ID for updates
      );

      if (result.success) {
        console.log(`Master bundle ${existingBundle ? 'updated' : 'created'} successfully!`);
        await loadBundles();
        await refreshFiles();
      } else {
        console.error('Failed to create master bundle:', result.error);
        throw new Error(result.error || 'Failed to create master bundle');
      }
    } catch (error) {
      console.error('Error creating master bundle:', error);
      throw error;
    }
  }, [directoryHandle, watchedFiles, ignorePatterns, loadBundles, refreshFiles]);

  // Update bundle - placeholder for future implementation
  const updateBundle = useCallback(async (
    bundleName: string,
    filesToInclude: any[],
    filesToRemove?: string[]
  ) => {
    // TODO: Implement bundle update logic
    console.log('Bundle update not yet implemented:', { bundleName, filesToInclude, filesToRemove });
    return { success: false, error: 'Bundle update not yet implemented' };
  }, []);

  const value = {
    bundles,
    masterBundle,
    createBundle,
    createTagBundle,
    createMasterBundle,
    updateBundle,
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
