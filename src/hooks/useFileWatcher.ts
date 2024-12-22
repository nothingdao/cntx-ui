// src/hooks/useFileWatcher.ts
import { useContext } from 'react'
import { FileWatcherContext } from '../contexts/FileWatcherContext'

export function useFileWatcher() {
  const context = useContext(FileWatcherContext)
  if (!context) {
    throw new Error('useFileWatcher must be used within a FileWatcherProvider')
  }
  return context
}
