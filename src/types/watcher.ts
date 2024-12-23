// src/types/watcher.ts
import type { FileSystemFileHandle } from './filesystem'
import type { Bundle } from './bundle'

export type WatchedFile = {
  path: string
  name: string
  directory: string
  content: string
  lastModified: Date
  isChanged: boolean
  isStaged: boolean
  lastBundled: Date | null
  handle?: FileSystemFileHandle
}

export type FileWatcherContextType = {
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
