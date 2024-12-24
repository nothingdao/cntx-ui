// src/hooks/useDirectoryWatcher.ts
import { useContext } from 'react'
import { DirectoryWatcherContext } from '../contexts/DirectoryWatcherContext'

export function useDirectoryWatcher() {
  const context = useContext(DirectoryWatcherContext)
  if (!context) {
    throw new Error(
      'useDirectoryWatcher must be used within a DirectoryWatcherProvider'
    )
  }
  return context
}
