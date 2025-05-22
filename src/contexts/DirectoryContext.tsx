// src/contexts/DirectoryContext.tsx
import React, { createContext, useState, useCallback, useContext } from 'react';
import type { DirectoryContextType } from './types';
import type { FileSystemDirectoryHandle } from '@/types/types';
import { InitializationModal } from '@/components/InitializationModal';
import { processDirectory } from '@/utils/file-utils';

export const WATCHER_HEARTBEAT = 1000; // 1 second heartbeat for directory polling

export const DirectoryContext = createContext<DirectoryContextType>({
  currentDirectory: null,
  directoryHandle: null,
  isWatching: false,
  recentChanges: [],
  WATCHER_HEARTBEAT,
  selectDirectory: async () => { },
  clearDirectory: () => { },
  watchDirectory: async () => { },
});

export function DirectoryProvider({ children }: { children: React.ReactNode }) {
  const [currentDirectory, setCurrentDirectory] = useState<string | null>(null);
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [showInitModal, setShowInitModal] = useState(false);
  const [recentChanges, setRecentChanges] = useState<Array<{
    kind: string;
    name: string;
    timestamp: Date;
  }>>([]);

  const watchDirectory = useCallback(async (handle: FileSystemDirectoryHandle) => {
    if (!handle) return;

    // First verify .cntx exists before starting to watch
    try {
      await handle.getDirectoryHandle('.cntx', { create: false });
    } catch (error) {
      console.log('Cannot start watching - directory not initialized');
      return;
    }

    setIsWatching(true);

    // Set up the watcher loop
    let lastKnownFiles = new Map<string, number>();
    const heartbeatId = setInterval(async () => {
      try {
        const currentFiles = new Map<string, number>();
        const snapshot = await processDirectory(handle);
        snapshot.forEach(file => {
          currentFiles.set(file.path, file.lastModified.getTime());
        });

        // Compare for changes
        for (const [path, currentTime] of currentFiles) {
          if (!lastKnownFiles.has(path)) {
            setRecentChanges(prev => [{
              kind: 'create',
              name: path,
              timestamp: new Date()
            }, ...prev].slice(0, 50));
          } else if (lastKnownFiles.get(path) !== currentTime) {
            setRecentChanges(prev => [{
              kind: 'modify',
              name: path,
              timestamp: new Date()
            }, ...prev].slice(0, 50));
          }
        }

        for (const [path] of lastKnownFiles) {
          if (!currentFiles.has(path)) {
            setRecentChanges(prev => [{
              kind: 'remove',
              name: path,
              timestamp: new Date()
            }, ...prev].slice(0, 50));
          }
        }

        lastKnownFiles = currentFiles;
      } catch (error) {
        console.error('Error in watcher heartbeat:', error);
        clearInterval(heartbeatId);
        setIsWatching(false);
      }
    }, WATCHER_HEARTBEAT);

    return () => {
      clearInterval(heartbeatId);
      setIsWatching(false);
    };
  }, []);

  const clearAllState = useCallback(() => {
    setCurrentDirectory(null);
    setDirectoryHandle(null);
    setIsWatching(false);
    setRecentChanges([]);
    setShowInitModal(false);
  }, []);

  const selectDirectory = useCallback(async () => {
    try {
      // Clear all state first
      clearAllState();

      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });

      // Only set new state after successful selection
      setDirectoryHandle(handle);
      setCurrentDirectory(handle.name);

      try {
        // Check if .cntx exists without creating it
        await handle.getDirectoryHandle('.cntx', { create: false });
        // Already initialized - safe to start watching
        watchDirectory(handle);
      } catch (error) {
        // Not initialized - show modal
        setIsWatching(false);
        setShowInitModal(true);
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
      clearAllState();
    }
  }, [watchDirectory, clearAllState]);

  const clearDirectory = useCallback(() => {
    clearAllState();
  }, [clearAllState]);

  return (
    <DirectoryContext.Provider value={{
      currentDirectory,
      directoryHandle,
      isWatching,
      recentChanges,
      WATCHER_HEARTBEAT,
      selectDirectory,
      clearDirectory,
      watchDirectory,
    }}>
      {children}
      <InitializationModal
        isOpen={showInitModal}
        onComplete={() => {
          setShowInitModal(false);
          if (directoryHandle) {
            // Now that initialization is complete, we can start watching
            watchDirectory(directoryHandle);
          }
        }}
        dirHandle={directoryHandle!}
      />
    </DirectoryContext.Provider>
  );
}

export function useDirectory() {
  const context = useContext(DirectoryContext);
  if (!context) {
    throw new Error('useDirectory must be used within a DirectoryProvider');
  }
  return context;
}
