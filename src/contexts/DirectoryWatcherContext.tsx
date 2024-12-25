// src/contexts/DirectoryWatcherContext.tsx
// test
import type { FileSystemDirectoryHandle, FileSystemFileHandle } from '../types/filesystem'
import { createContext } from 'react'
import type { Bundle } from '../types/bundle'
import { TagsConfig } from '@/types/tags'
export interface WatchedFile {
  path: string
  name: string
  directory: string
  content: string
  lastModified: Date
  isChanged: boolean
  isStaged: boolean
  masterBundleId?: string  // Add this to match our state structure
  handle?: FileSystemFileHandle
}

export type DirectoryWatcherContextType = {
  watchedFiles: WatchedFile[];
  stagedFiles: WatchedFile[];
  selectDirectory: () => Promise<void>;
  refreshFiles: () => Promise<void>;
  isWatching: boolean;
  createBundle: () => Promise<string>;
  toggleStaged: (paths: string[]) => void;
  bundles: Bundle[];
  loadBundles: () => Promise<void>;
  currentDirectory: string | null;
  createMasterBundle: () => Promise<void>;
  rufasDir: FileSystemDirectoryHandle | null;
  tags: TagsConfig;
  addTag: (name: string, color: string, description: string) => void;
  deleteTag: (name: string) => void;
  updateTag: (name: string, color: string, description: string) => void;
};

export const DirectoryWatcherContext = createContext<DirectoryWatcherContextType>({
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
  createMasterBundle: async () => { },
  rufasDir: null,
  tags: {},
  addTag: () => { },
  deleteTag: () => { },
  updateTag: () => { },
});
