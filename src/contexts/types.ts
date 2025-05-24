// src/contexts/types.ts
import { Bundle, TagsConfig, WatchedFile } from '@/types/types'

export interface ProjectMetadata {
  name: string
  description: string
  version: string
  author: string
  lastUpdated: string
  repository?: string
  license?: string
  keywords?: string[]
}
export interface DirectoryContextType {
  currentDirectory: string | null
  directoryHandle: FileSystemDirectoryHandle | null
  isWatching: boolean
  recentChanges: Array<{
    kind: string
    name: string
    timestamp: Date
  }>
  WATCHER_HEARTBEAT: number
  selectDirectory: () => Promise<void>
  clearDirectory: () => void
  watchDirectory: (handle: FileSystemDirectoryHandle) => Promise<void>
}

export interface FileContextType {
  watchedFiles: WatchedFile[]
  stagedFiles: WatchedFile[]
  toggleStaged: (paths: string[]) => void
  refreshFiles: () => Promise<void>
  filterFiles: (criteria: Partial<WatchedFile>) => WatchedFile[]
}

export interface BundleContextType {
  bundles: Bundle[]
  masterBundle: Bundle | null
  createBundle: () => Promise<string>
  updateBundle: (
    bundleName: string,
    filesToInclude: WatchedFile[],
    filesToRemove?: string[]
  ) => Promise<{ success: boolean; error?: string; bundleId?: string }>
  createMasterBundle: () => Promise<void>
  loadBundles: () => Promise<void>
}

export interface TagContextType {
  tags: TagsConfig
  addTag: (name: string, color: string, description: string) => void
  deleteTag: (name: string) => void
  updateTag: (name: string, color: string, description: string) => void
  getFilesWithTag: (tag: string) => WatchedFile[]
  addTagToFiles: (tag: string, paths: string[]) => Promise<void>
  removeTagFromFiles: (tag: string, paths: string[]) => Promise<void>
}

export interface ProjectConfigContextType {
  ignorePatterns: string[]
  updateIgnorePatterns: (patterns: string[]) => void
  isProjectInitialized: boolean
  initializeProject: () => Promise<void>
  projectMetadata: ProjectMetadata | null
  updateProjectMetadata: (metadata: ProjectMetadata) => Promise<void>
}
