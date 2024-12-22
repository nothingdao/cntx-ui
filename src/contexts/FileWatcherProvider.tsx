// src/contexts/FileWatcherProvider.tsx
import { type ReactNode, useState, useEffect, useCallback, useMemo } from 'react';
import { FileWatcherContext, type WatchedFile } from './FileWatcherContext';
import { getPathParts } from '../utils/file-utils';
import { shouldIgnorePath } from '../utils/config-utils';
import {
  initializeWatchDirectory,
  saveState,
  createInitialBundle,
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

  const updateFile = async (handle: FileSystemFileHandle, relativePath: string) => {
    try {
      const file = await handle.getFile();
      const content = await file.text();
      const { name, directory, path } = getPathParts(relativePath);

      setWatchedFiles(prev => {
        const existingFile = prev.find(f => f.path === path);
        const newFile: WatchedFile = {
          path,
          name,
          directory,
          content,
          lastModified: new Date(file.lastModified),
          isChanged: existingFile ? content !== existingFile.content : true,
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
  };

  const processDirectory = useCallback(async (
    dirHandle: FileSystemDirectoryHandle,
    relativePath: string = ''
  ) => {
    for await (const entry of dirHandle.values()) {
      const entryPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

      if (shouldIgnorePath(entryPath, { ignore: ignorePatterns, include: [] }, entry.kind === 'directory')) {
        continue;
      }

      if (entry.kind === 'file') {
        await updateFile(entry as FileSystemFileHandle, entryPath);
      } else if (entry.kind === 'directory') {
        await processDirectory(entry as FileSystemDirectoryHandle, entryPath);
      }
    }
  }, []);

  const selectDirectory = async () => {
    try {
      // Clear existing state
      setWatchedFiles([]);
      setDirectoryHandle(null);
      setWatchDir(null);
      setIsWatching(false);

      const dirHandle = await window.showDirectoryPicker({ mode: 'read' });

      // Check for .sourcery directory
      try {
        const existingWatchDir = await dirHandle.getDirectoryHandle('.sourcery');
        setWatchDir(existingWatchDir);
        setDirectoryHandle(dirHandle);
        setIsWatching(true);
        await processDirectory(dirHandle);
      } catch {
        // No .sourcery directory, show initialization modal
        setDirectoryHandle(dirHandle);
        setShowInitModal(true);
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
    }
  };

  const handleInitComplete = async () => {
    if (!directoryHandle) return;

    try {
      const { watchDir: newWatchDir } = await initializeWatchDirectory(directoryHandle);
      setWatchDir(newWatchDir);

      // Load ignore patterns first
      const patterns = await loadBundleIgnore(newWatchDir);
      setIgnorePatterns(patterns);

      // Then process files
      await processDirectory(directoryHandle);

      // Create initial bundle with non-ignored files
      const filePaths = watchedFiles.map(f => f.path);
      await createInitialBundle(directoryHandle, filePaths);

      // Update states
      setIsWatching(true);
      setShowInitModal(false);
    } catch (error) {
      console.error('Error completing initialization:', error);
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

  const createBundle = (): string => {
    const stagedFiles = watchedFiles.filter(file => file.isStaged);
    const now = new Date();

    setWatchedFiles(prev => prev.map(file =>
      stagedFiles.some(f => f.path === file.path)
        ? { ...file, lastBundled: now }
        : file
    ));

    return stagedFiles
      .map(file => `<document>\n<source>${file.path}</source>\n<content>${file.content}</content>\n</document>`)
      .join('\n\n');
  };

  const stagedFiles = useMemo(() =>
    watchedFiles.filter(f => f.isStaged),
    [watchedFiles]
  );

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
        toggleStaged
      }}
    >
      {children}
      <InitializationModal
        isOpen={showInitModal}
        onComplete={handleInitComplete}
        dirHandle={directoryHandle!}
      />
    </FileWatcherContext.Provider>
  );
}
