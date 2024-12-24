// src/contexts/FileWatcherProvider.tsx
import { type ReactNode, useState, useEffect, useCallback, useMemo } from 'react';
import { FileWatcherContext } from './FileWatcherContext';
import type { WatchedFile } from '../types/watcher';
import type { Bundle } from '../types/bundle';
import { getPathParts } from '../utils/file-utils';
import { shouldIgnorePath } from '../utils/config-utils';
import { initializeProject, loadBundleIgnore } from '../utils/project-utils';
import { saveState, loadState, createBundle } from '../utils/file-state';
import type { WatchState } from '../types/watcher';
import { InitializationModal } from '../components/InitializationModal';
import type { FileSystemDirectoryHandle, FileSystemFileHandle } from '../types/filesystem';

export function FileWatcherProvider({ children }: { children: ReactNode }) {
  const [watchedFiles, setWatchedFiles] = useState<WatchedFile[]>([]);
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [sourceryDir, setSourceryDir] = useState<FileSystemDirectoryHandle | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [showInitModal, setShowInitModal] = useState(false);
  const [ignorePatterns, setIgnorePatterns] = useState<string[]>([]);
  const [currentDirectory, setCurrentDirectory] = useState<string | null>(null);
  const [bundles, setBundles] = useState<Bundle[]>([]);

  const loadBundles = useCallback(async () => {
    if (!sourceryDir) return;

    try {
      const bundlesDir = await sourceryDir.getDirectoryHandle('bundles');
      const bundles: Bundle[] = [];

      for await (const entry of bundlesDir.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.txt')) {
          const file = await (entry as FileSystemFileHandle).getFile();
          const content = await file.text();
          const fileCount = (content.match(/<document>/g) || []).length;

          bundles.push({
            name: entry.name,
            timestamp: new Date(file.lastModified),
            fileCount
          });
        }
      }

      setBundles(bundles.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
    } catch (error) {
      console.error('Error loading bundles:', error);
    }
  }, [sourceryDir]);

  const updateFile = useCallback(async (handle: FileSystemFileHandle, relativePath: string) => {
    try {
      const file = await handle.getFile();
      const content = await file.text();
      const { name, directory, path } = getPathParts(relativePath);

      setWatchedFiles((prev) => {
        const existingFile = prev.find(f => f.path === path);

        const newFile: WatchedFile = {
          path,
          name,
          directory,
          content,
          lastModified: new Date(file.lastModified),
          isChanged: existingFile?.isChanged || false,
          isStaged: existingFile?.isStaged || false,
          lastBundled: existingFile?.lastBundled || null,
          handle
        };

        if (existingFile) {
          return prev.map(f => f.path === path ? newFile : f);
        }
        return [...prev, newFile];
      });
    } catch (error) {
      console.error(`Error reading file ${relativePath}:`, error);
    }
  }, []);

  const processDirectory = useCallback(async (
    dirHandle: FileSystemDirectoryHandle,
    relativePath: string = ''
  ) => {
    if (ignorePatterns.length === 0) {
      // console.log('No ignore patterns loaded, skipping processing');
      return;
    }

    for await (const entry of dirHandle.values()) {
      const entryPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

      if (shouldIgnorePath(entryPath, { ignore: ignorePatterns }, entry.kind === 'directory')) {
        // console.log(`Ignoring: ${entryPath}`);
        continue;
      }

      if (entry.kind === 'file') {
        await updateFile(entry as FileSystemFileHandle, entryPath);
      } else if (entry.kind === 'directory') {
        await processDirectory(entry as FileSystemDirectoryHandle, entryPath);
      }
    }
  }, [ignorePatterns, updateFile]);

  const handleInitComplete = async () => {
    if (!directoryHandle) return;

    try {
      const { sourceryDir: newSourceryDir } = await initializeProject(directoryHandle);
      const patterns = await loadBundleIgnore(newSourceryDir);
      setSourceryDir(newSourceryDir);
      setIgnorePatterns(patterns);
      setIsWatching(true);
      setShowInitModal(false);
      setCurrentDirectory(directoryHandle.name);
    } catch (error) {
      console.error('Error completing initialization:', error);
    }
  };

  const selectDirectory = async () => {
    try {
      setWatchedFiles([]);
      setDirectoryHandle(null);
      setSourceryDir(null);
      setIsWatching(false);
      setIgnorePatterns([]);
      setCurrentDirectory(null);

      const dirHandle = await window.showDirectoryPicker({ mode: 'read' });

      try {
        // Check if project is already initialized
        const existingSourceryDir = await dirHandle.getDirectoryHandle('.sourcery');
        const patterns = await loadBundleIgnore(existingSourceryDir);

        // Load existing project
        setSourceryDir(existingSourceryDir);
        setDirectoryHandle(dirHandle as FileSystemDirectoryHandle);
        setIgnorePatterns(patterns);
        setIsWatching(true);
        setCurrentDirectory(dirHandle.name);

        // Load existing state
        const state = await loadState(existingSourceryDir);
        if (state) {
          // Update watched files with saved state
          setWatchedFiles(prev => prev.map(file => ({
            ...file,
            isStaged: state.files[file.path]?.isStaged || false,
            lastBundled: state.files[file.path]?.bundleTimestamp
              ? new Date(state.files[file.path].bundleTimestamp)
              : null
          })));
        }
      } catch {
        // Project needs initialization
        setDirectoryHandle(dirHandle as FileSystemDirectoryHandle);
        setShowInitModal(true);
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
    }
  };

  const refreshFiles = useCallback(async () => {
    if (!directoryHandle) return;
    await processDirectory(directoryHandle);
  }, [directoryHandle, processDirectory]);

  const toggleStaged = (path: string) => {
    setWatchedFiles(prev => prev.map(file =>
      file.path === path
        ? { ...file, isStaged: !file.isStaged }
        : file
    ));
  };

  const createNewBundle = async (): Promise<string> => {
    if (!sourceryDir) return '';

    const stagedFiles = watchedFiles.filter(file => file.isStaged);
    if (stagedFiles.length === 0) return '';

    try {
      const result = await createBundle(stagedFiles, sourceryDir);

      if (result.success) {
        // Update watched files to reflect new bundle state
        setWatchedFiles(prev => prev.map(file =>
          stagedFiles.some(f => f.path === file.path)
            ? { ...file, isChanged: false, lastBundled: new Date() }
            : file
        ));

        // Create the content for the UI
        const bundleContent = stagedFiles
          .map(file => `<document>\n<source>${file.path}</source>\n<content>${file.content}</content>\n</document>`)
          .join('\n\n');

        return bundleContent;
      } else {
        console.error('Failed to create bundle:', result.error);
        return '';
      }
    } catch (error) {
      console.error('Error creating bundle:', error);
      return '';
    }
  };

  const stagedFiles = useMemo(() =>
    watchedFiles.filter(f => f.isStaged),
    [watchedFiles]
  );

  useEffect(() => {
    if (directoryHandle && ignorePatterns.length > 0 && isWatching) {
      processDirectory(directoryHandle);
    }
  }, [directoryHandle, ignorePatterns, isWatching, processDirectory]);

  useEffect(() => {
    if (sourceryDir && isWatching) {
      const state: WatchState = {
        lastAccessed: new Date().toISOString(),
        files: watchedFiles.reduce((acc, file) => ({
          ...acc,
          [file.path]: {
            lastBundled: file.lastBundled?.toISOString() || null,
            isStaged: file.isStaged
          }
        }), {})
      };
      saveState(sourceryDir, state).catch(console.error);
    }
  }, [watchedFiles, sourceryDir, isWatching]);

  return (
    <FileWatcherContext.Provider
      value={{
        watchedFiles,
        stagedFiles,
        selectDirectory,
        refreshFiles,
        isWatching,
        createBundle: createNewBundle,
        toggleStaged,
        currentDirectory,
        bundles,
        loadBundles
      }}
    >
      {children}
      <InitializationModal
        isOpen={showInitModal}
        onComplete={handleInitComplete}
        dirHandle={directoryHandle!}
        watchedFiles={watchedFiles}
        refreshFiles={refreshFiles}
      />
    </FileWatcherContext.Provider>
  );
}
