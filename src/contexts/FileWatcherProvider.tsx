// src/contexts/FileWatcherProvider.tsx
import { type ReactNode, useState, useEffect, useCallback, useMemo } from 'react';
import { FileWatcherContext } from './FileWatcherContext';
import type { WatchedFile } from '../types/watcher';
import type { Bundle } from '../types/bundle';
import { getPathParts } from '../utils/file-utils';
import { shouldIgnorePath } from '../utils/config-utils';
import {
  initializeWatchDirectory,
  saveState,
  loadBundleIgnore,
  type WatchState
} from '../utils/watch-utils';
import { InitializationModal } from '../components/InitializationModal';
import type { FileSystemDirectoryHandle, FileSystemFileHandle } from '../types/filesystem';

export function FileWatcherProvider({ children }: { children: ReactNode }) {
  const [watchedFiles, setWatchedFiles] = useState<WatchedFile[]>([]);
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [watchDir, setWatchDir] = useState<FileSystemDirectoryHandle | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [showInitModal, setShowInitModal] = useState(false);
  const [ignorePatterns, setIgnorePatterns] = useState<string[]>([]);
  const [currentDirectory, setCurrentDirectory] = useState<string | null>(null);
  const [bundles, setBundles] = useState<Bundle[]>([]);

  const loadBundles = useCallback(async () => {
    if (!watchDir) return;

    try {
      const bundlesDir = await watchDir.getDirectoryHandle('bundles');
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
  }, [watchDir]);

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
      console.log('No ignore patterns loaded, skipping processing');
      return;
    }

    for await (const entry of dirHandle.values()) {
      const entryPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

      if (shouldIgnorePath(entryPath, { ignore: ignorePatterns }, entry.kind === 'directory')) {
        console.log(`Ignoring: ${entryPath}`);
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
      const { watchDir: newWatchDir } = await initializeWatchDirectory(directoryHandle);
      const patterns = await loadBundleIgnore(newWatchDir);
      setWatchDir(newWatchDir as FileSystemDirectoryHandle | null);
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
      setWatchDir(null);
      setIsWatching(false);
      setIgnorePatterns([]);
      setCurrentDirectory(null);

      const dirHandle = await window.showDirectoryPicker({ mode: 'read' });

      try {
        const existingWatchDir = await dirHandle.getDirectoryHandle('.sourcery');
        const patterns = await loadBundleIgnore(existingWatchDir);

        setWatchDir(existingWatchDir);
        setDirectoryHandle(dirHandle);

        setIgnorePatterns(patterns);
        setIsWatching(true);
        setCurrentDirectory(dirHandle.name);
      } catch {
        setDirectoryHandle(dirHandle);

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

  const createBundle = async (): Promise<string> => {
    if (!watchDir) return '';

    const stagedFiles = watchedFiles.filter(file => file.isStaged);

    try {
      const bundleContent = stagedFiles
        .map(file => `<document>\n<source>${file.path}</source>\n<content>${file.content}</content>\n</document>`)
        .join('\n\n');

      // Update watched files to reflect new bundle state
      setWatchedFiles(prev => prev.map(file =>
        stagedFiles.some(f => f.path === file.path)
          ? { ...file, isChanged: false, lastBundled: new Date() }
          : file
      ));

      return bundleContent;
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
    if (watchDir && isWatching) {
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
      saveState(watchDir, state).catch(console.error);
    }
  }, [watchedFiles, watchDir, isWatching]);

  return (
    <FileWatcherContext.Provider
      value={{
        watchedFiles,
        stagedFiles,
        selectDirectory,
        refreshFiles,
        isWatching,
        createBundle,
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
        createBundle={createBundle}
      />
    </FileWatcherContext.Provider>
  );
}
