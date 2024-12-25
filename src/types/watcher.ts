// src/types/watcher.ts
import type { FileSystemFileHandle } from './filesystem'

export interface WatchedFile {
  path: string
  name: string
  directory: string
  content: string
  lastModified: Date
  isChanged: boolean
  isStaged: boolean
  masterBundleId?: string
  handle?: FileSystemFileHandle
  tags: string[]
}

export type DirectoryWatcherContextType = {
  watchedFiles: WatchedFile[]
  stagedFiles: WatchedFile[]
  selectDirectory: () => Promise<void>
  refreshFiles: () => Promise<void>
  isWatching: boolean
  createBundle: () => Promise<string>
  toggleStaged: (path: string) => void
  currentDirectory: string | null
  bundles: Bundle[]
  loadBundles: () => Promise<void>
}

export type BundleHistoryEntry = {
  bundleId: string
  timestamp: string
  type: 'master' | 'regular'
}

export interface FileState {
  masterBundleId?: string // ID of last master bundle that included this file
  lastModified: string
  isStaged: boolean
}

export interface WatchState {
  lastAccessed: string
  files: {
    [path: string]: {
      masterBundleId?: string
      lastModified: string
      isStaged: boolean
      tags?: string[] // Add this line
    }
  }
  tags: {
    [tagName: string]: string[] // paths of files with this tag
  }
  masterBundle: {
    id: string
    created: string
    fileCount: number
  } | null
}

export interface Bundle {
  name: string
  timestamp: Date
  fileCount: number
}
