// src/contexts/FileWatcherContext.tsx
import { createContext } from 'react';
import type { Bundle } from '../types/bundle';

export type WatchedFile = {
  path: string;
  name: string;
  directory: string;
  content: string;
  lastModified: Date;
  isChanged: boolean;
  isStaged: boolean;
  lastBundled: Date | null;
  handle?: FileSystemFileHandle;
};

export type FileWatcherContextType = {
  watchedFiles: WatchedFile[];
  stagedFiles: WatchedFile[];
  selectDirectory: () => Promise<void>;
  refreshFiles: () => Promise<void>;
  isWatching: boolean;
  createBundle: () => Promise<string>;
  toggleStaged: (path: string) => void;
  bundles: Bundle[];
  loadBundles: () => Promise<void>;
  currentDirectory: string | null;
};

export const FileWatcherContext = createContext<FileWatcherContextType>({
  watchedFiles: [],
  stagedFiles: [],
  selectDirectory: async () => { },
  refreshFiles: async () => { },
  isWatching: false,
  createBundle: async () => '',
  toggleStaged: () => { },
  bundles: [],
  loadBundles: async () => { },
  currentDirectory: null,
});
