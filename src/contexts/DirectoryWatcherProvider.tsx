// src/contexts/DirectoryWatcherProvider.tsx
import { type ReactNode, useState, useEffect, useCallback, useMemo } from 'react';
import { DirectoryWatcherContext } from './DirectoryWatcherContext';
import type { WatchedFile } from '../types/watcher';
import type { Bundle } from '../types/bundle';
import { getPathParts } from '../utils/file-utils';
import { shouldIgnorePath } from '../utils/config-utils';
import { createMasterBundle, initializeProject, loadBundleIgnore, loadTagsConfig, saveTagsConfig } from '../utils/project-utils';
import { saveState, loadState, createBundleFile } from '../utils/file-state';
import { InitializationModal } from '../components/InitializationModal';
import type { FileSystemDirectoryHandle, FileSystemFileHandle } from '../types/filesystem';
import { TagsConfig } from '@/types/tags';

export function DirectoryWatcherProvider({ children }: { children: ReactNode }) {
  const [watchedFiles, setWatchedFiles] = useState<WatchedFile[]>([]);
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [rufasDir, setRufasDir] = useState<FileSystemDirectoryHandle | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [showInitModal, setShowInitModal] = useState(false);
  const [ignorePatterns, setIgnorePatterns] = useState<string[]>([]);
  const [currentDirectory, setCurrentDirectory] = useState<string | null>(null);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [tags, setTags] = useState<TagsConfig>({});

  const updateFile = useCallback(async (handle: FileSystemFileHandle, relativePath: string) => {
    try {
      const file = await handle.getFile();
      const content = await file.text();
      const { name, directory, path } = getPathParts(relativePath);
      const state = await loadState(rufasDir!);

      setWatchedFiles((prev) => {
        const existingFile = prev.find(f => f.path === path);

        const newFile: WatchedFile = {
          path,
          name,
          directory,
          content,
          lastModified: new Date(file.lastModified),
          isChanged: existingFile?.isChanged || false,
          isStaged: state?.files[path]?.isStaged || false,
          masterBundleId: state?.files[path]?.masterBundleId, // Add this
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
  }, [rufasDir]);

  const processDirectory = useCallback(async (
    dirHandle: FileSystemDirectoryHandle,
    relativePath: string = ''
  ) => {
    if (ignorePatterns.length === 0) {
      return;
    }

    for await (const entry of dirHandle.values()) {
      const entryPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

      if (shouldIgnorePath(entryPath, { ignore: ignorePatterns }, entry.kind === 'directory')) {
        continue;
      }

      if (entry.kind === 'file') {
        await updateFile(entry as FileSystemFileHandle, entryPath);
      } else if (entry.kind === 'directory') {
        await processDirectory(entry as FileSystemDirectoryHandle, entryPath);
      }
    }
  }, [ignorePatterns, updateFile]);

  const loadBundles = useCallback(async () => {
    if (!rufasDir) return;

    try {
      const bundlesDir = await rufasDir.getDirectoryHandle('bundles');
      const loadedBundles: Bundle[] = [];

      for await (const entry of bundlesDir.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.txt')) {
          const file = await (entry as FileSystemFileHandle).getFile();
          const content = await file.text();
          const fileCount = (content.match(/<document>/g) || []).length;

          loadedBundles.push({
            name: entry.name,
            timestamp: new Date(file.lastModified),
            fileCount
          });
        }
      }

      setBundles(loadedBundles.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
    } catch (error) {
      console.error('Error loading bundles:', error);
    }
  }, [rufasDir]);

  const handleInitComplete = async () => {
    if (!directoryHandle) return;

    try {
      const { rufasDir: newRufasDir } = await initializeProject(directoryHandle);
      const patterns = await loadBundleIgnore(newRufasDir);
      setRufasDir(newRufasDir);
      setIgnorePatterns(patterns);
      setIsWatching(true);
      setShowInitModal(false);
      setCurrentDirectory(directoryHandle.name);
      await refreshFiles();
    } catch (error) {
      console.error('Error completing initialization:', error);
    }
  };

  const selectDirectory = async () => {
    try {
      setWatchedFiles([]);
      setDirectoryHandle(null);
      setRufasDir(null);
      setIsWatching(false);
      setIgnorePatterns([]);
      setCurrentDirectory(null);

      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });

      try {
        const existingRufasDir = await dirHandle.getDirectoryHandle('.rufas');
        const patterns = await loadBundleIgnore(existingRufasDir);

        setRufasDir(existingRufasDir);
        setDirectoryHandle(dirHandle);
        setIgnorePatterns(patterns);
        setIsWatching(true);
        setCurrentDirectory(dirHandle.name);

        const existingTags = await loadTagsConfig(existingRufasDir);
        setTags(existingTags);

        const state = await loadState(existingRufasDir);
        if (state) {
          setWatchedFiles(prev => prev.map(file => ({
            ...file,
            isStaged: state.files[file.path]?.isStaged || false,
            masterBundleId: state.files[file.path]?.masterBundleId
          })));
        }

        await processDirectory(dirHandle);
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

  const toggleStaged = useCallback(async (paths: string[]) => {
    if (!rufasDir) return;

    try {
      const state = await loadState(rufasDir);
      const firstPath = paths[0];
      let targetState = false;

      if (state.files[firstPath]) {
        targetState = !state.files[firstPath].isStaged;
      }

      paths.forEach(path => {
        if (!state.files[path]) {
          state.files[path] = {
            lastModified: new Date().toISOString(),
            isStaged: targetState,
            masterBundleId: undefined
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
  }, [rufasDir]);

  const createMasterBundleWrapper = useCallback(async () => {
    if (!rufasDir) return;
    await createMasterBundle(watchedFiles, rufasDir);
  }, [rufasDir, watchedFiles]);

  const createBundle = async (): Promise<string> => {
    if (!rufasDir) return '';

    const stagedFiles = watchedFiles.filter(file => file.isStaged);
    if (stagedFiles.length === 0) return '';

    try {
      const result = await createBundleFile(stagedFiles, rufasDir);

      if (result.success) {
        setWatchedFiles(prev => prev.map(file =>
          stagedFiles.some(f => f.path === file.path)
            ? { ...file, isChanged: false }
            : file
        ));

        const bundleContent = stagedFiles
          .map(file => `\n${file.path}\n${file.content}\n`)
          .join('\n\n');

        return bundleContent;
      }
      console.error('Failed to create bundle:', result.error);
      return '';
    } catch (error) {
      console.error('Error creating bundle:', error);
      return '';
    }
  };


  // Tag management
  const addTag = useCallback(async (name: string, color: string, description: string) => {
    if (!rufasDir) return;

    setTags((prevTags) => {
      const newTags = {
        ...prevTags,
        [name]: { color, description }
      };
      saveTagsConfig(rufasDir, newTags).catch(console.error);
      return newTags;
    });
  }, [rufasDir]);

  const deleteTag = useCallback(async (name: string) => {
    if (!rufasDir) return;

    setTags((prevTags) => {
      const newTags = { ...prevTags };
      delete newTags[name];
      saveTagsConfig(rufasDir, newTags).catch(console.error);
      return newTags;
    });
  }, [rufasDir]);

  const updateTag = useCallback(async (name: string, color: string, description: string) => {
    if (!rufasDir) return;

    setTags((prevTags) => {
      const newTags = {
        ...prevTags,
        [name]: { color, description }
      };
      saveTagsConfig(rufasDir, newTags).catch(console.error);
      return newTags;
    });
  }, [rufasDir]);


  const addTagToFiles = useCallback(async (tag: string, paths: string[]) => {
    if (!rufasDir) return;

    try {
      const state = await loadState(rufasDir);

      // Update the state's tags mapping
      if (!state.tags[tag]) {
        state.tags[tag] = [];
      }

      paths.forEach(path => {
        // Add tag to file's tags list
        if (!state.files[path].tags) {
          state.files[path].tags = [];
        }
        if (!state.files[path].tags.includes(tag)) {
          state.files[path].tags.push(tag);
        }

        // Add file to tag's files list
        if (!state.tags[tag].includes(path)) {
          state.tags[tag].push(path);
        }
      });

      await saveState(rufasDir, state);

      // Update the watchedFiles state
      setWatchedFiles(prev => prev.map(file => {
        if (paths.includes(file.path)) {
          return {
            ...file,
            tags: [...(file.tags || []), tag]
          };
        }
        return file;
      }));
    } catch (error) {
      console.error('Error adding tags to files:', error);
    }
  }, [rufasDir, setWatchedFiles]);

  const removeTagFromFiles = useCallback(async (tag: string, paths: string[]) => {
    if (!rufasDir) return;

    try {
      const state = await loadState(rufasDir);

      paths.forEach(path => {
        // Remove tag from file's tags list
        if (state.files[path].tags) {
          state.files[path].tags = state.files[path].tags.filter(t => t !== tag);
        }

        // Remove file from tag's files list
        if (state.tags[tag]) {
          state.tags[tag] = state.tags[tag].filter(p => p !== path);
        }
      });

      await saveState(rufasDir, state);

      // Update the watchedFiles state
      setWatchedFiles(prev => prev.map(file => {
        if (paths.includes(file.path)) {
          return {
            ...file,
            tags: (file.tags || []).filter(t => t !== tag)
          };
        }
        return file;
      }));
    } catch (error) {
      console.error('Error removing tags from files:', error);
    }
  }, [rufasDir, setWatchedFiles]);

  const getFilesWithTag = useCallback((tag: string) => {
    return watchedFiles.filter(file => file.tags?.includes(tag));
  }, [watchedFiles]);

  const getTagsForFile = useCallback((path: string) => {
    const file = watchedFiles.find(f => f.path === path);
    return file?.tags || [];
  }, [watchedFiles]);

  const stagedFiles = useMemo(() =>
    watchedFiles.filter(f => f.isStaged),
    [watchedFiles]
  );

  useEffect(() => {
    if (rufasDir && isWatching && watchedFiles.length > 0) {
      let isCurrent = true;

      const saveCurrentState = async () => {
        try {
          // Load existing state once
          const existingState = await loadState(rufasDir);

          // Only proceed if this is still the current effect
          if (!isCurrent) return;

          const newState = {
            ...existingState,
            lastAccessed: new Date().toISOString(),
            files: watchedFiles.reduce((acc, file) => ({
              ...acc,
              [file.path]: {
                masterBundleId: existingState.files[file.path]?.masterBundleId,
                lastModified: file.lastModified.toISOString(),
                isStaged: file.isStaged
              }
            }), {}),
          };

          await saveState(rufasDir, newState);
        } catch (error) {
          console.error('Error saving state:', error);
        }
      };

      // Debounce the state saving to prevent rapid successive updates
      const timeoutId = setTimeout(saveCurrentState, 100);

      return () => {
        isCurrent = false;
        clearTimeout(timeoutId);
      };
    }
  }, [watchedFiles, rufasDir, isWatching]);

  useEffect(() => {
    if (directoryHandle && ignorePatterns.length > 0 && isWatching) {
      processDirectory(directoryHandle);
    }
  }, [directoryHandle, ignorePatterns, isWatching, processDirectory]);

  return (
    <DirectoryWatcherContext.Provider
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
        loadBundles,
        tags,
        addTag,
        createMasterBundle: createMasterBundleWrapper,
        rufasDir,
        deleteTag,
        updateTag,
        addTagToFiles,
        removeTagFromFiles,
        getFilesWithTag,
        getTagsForFile
      }}
    >
      {children}
      <InitializationModal
        isOpen={showInitModal}
        onComplete={handleInitComplete}
        dirHandle={directoryHandle!}
        processDirectory={processDirectory}
        setIgnorePatterns={setIgnorePatterns}
      />
    </DirectoryWatcherContext.Provider>
  );
}
