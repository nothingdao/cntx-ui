// src/contexts/FileWatcherContext.tsx
import { createContext } from 'react';

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
  createBundle: () => string;
  toggleStaged: (path: string) => void;
};

export const FileWatcherContext = createContext<FileWatcherContextType>({
  watchedFiles: [],
  stagedFiles: [],
  selectDirectory: async () => { },
  refreshFiles: async () => { },
  isWatching: false,
  createBundle: () => '',
  toggleStaged: () => { },
});
