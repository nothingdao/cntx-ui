// src/contexts/DirectoryContext.tsx
import React, { createContext, useState, useCallback, useContext, useRef } from 'react';
import type { DirectoryContextType } from './types';
import type { FileSystemDirectoryHandle } from '@/types/types';
import { InitializationModal } from '@/components/InitializationModal';
import { processDirectory } from '@/utils/file-utils';

export const WATCHER_HEARTBEAT = 1000;

type DirectoryState = {
  currentDirectory: string | null;
  directoryHandle: FileSystemDirectoryHandle | null;
  isWatching: boolean;
  recentChanges: Array<{
    kind: string;
    name: string;
    timestamp: Date;
  }>;
};

const initialState: DirectoryState = {
  currentDirectory: null,
  directoryHandle: null,
  isWatching: false,
  recentChanges: []
};

const DirectoryContext = createContext<DirectoryContextType>({
  ...initialState,
  WATCHER_HEARTBEAT,
  selectDirectory: async () => { },
  clearDirectory: () => { },
  watchDirectory: async () => { },
});

export function DirectoryProvider({ children }: { children: React.ReactNode }) {
  // Core state
  const [state, setState] = useState<DirectoryState>(initialState);
  const [showInitModal, setShowInitModal] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);  // Add this for force update

  // Refs for cleanup
  const watcherInterval = useRef<number | null>(null);
  const lastKnownFiles = useRef(new Map<string, number>());

  // Force update function
  const forceAppUpdate = useCallback(() => {
    console.log('Forcing app update');
    setUpdateTrigger(prev => prev + 1);
  }, []);

  // Helper to update state partially
  const updateState = useCallback((updates: Partial<DirectoryState>) => {
    setState(current => ({ ...current, ...updates }));
  }, []);

  // Clean up watcher
  const stopWatching = useCallback(() => {
    if (watcherInterval.current) {
      clearInterval(watcherInterval.current);
      watcherInterval.current = null;
    }
    updateState({ isWatching: false });
  }, [updateState]);

  // Start watching a directory
  const startWatching = useCallback(async (handle: FileSystemDirectoryHandle) => {
    // Stop any existing watcher
    stopWatching();

    console.log('Starting directory watch...');
    updateState({ isWatching: true });

    watcherInterval.current = window.setInterval(async () => {
      try {
        const currentFiles = new Map<string, number>();
        const snapshot = await processDirectory(handle);

        snapshot.forEach(file => {
          currentFiles.set(file.path, file.lastModified.getTime());
        });

        // Track changes
        for (const [path, currentTime] of currentFiles) {
          const previousTime = lastKnownFiles.current.get(path);

          if (!previousTime) {
            updateState({
              recentChanges: [{
                kind: 'create',
                name: path,
                timestamp: new Date()
              }, ...state.recentChanges].slice(0, 50)
            });
          } else if (previousTime !== currentTime) {
            updateState({
              recentChanges: [{
                kind: 'modify',
                name: path,
                timestamp: new Date()
              }, ...state.recentChanges].slice(0, 50)
            });
          }
        }

        // Check for deletions
        for (const [path] of lastKnownFiles.current) {
          if (!currentFiles.has(path)) {
            updateState({
              recentChanges: [{
                kind: 'remove',
                name: path,
                timestamp: new Date()
              }, ...state.recentChanges].slice(0, 50)
            });
          }
        }

        lastKnownFiles.current = currentFiles;
      } catch (error) {
        console.error('Error in watcher heartbeat:', error);
        stopWatching();
      }
    }, WATCHER_HEARTBEAT);
  }, [state.recentChanges, stopWatching, updateState]);

  // Initialize directory watching
  const watchDirectory = useCallback(async (handle: FileSystemDirectoryHandle) => {
    if (!handle) return;

    try {
      // Verify .cntx exists
      await handle.getDirectoryHandle('.cntx', { create: false });

      // Update state and start watching
      updateState({
        directoryHandle: handle,
        currentDirectory: handle.name
      });
      await startWatching(handle);

      // Force update after watching starts
      forceAppUpdate();
    } catch (error) {
      console.log('Cannot start watching - directory not initialized');
    }
  }, [startWatching, updateState, forceAppUpdate]);

  // Clear all state
  const clearDirectory = useCallback(() => {
    stopWatching();
    setState(initialState);
    setShowInitModal(false);
  }, [stopWatching]);

  // Handle directory selection
  const selectDirectory = useCallback(async () => {
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });

      // Update state with new handle
      updateState({
        directoryHandle: handle,
        currentDirectory: handle.name
      });

      try {
        // Check if directory is already initialized
        await handle.getDirectoryHandle('.cntx', { create: false });
        await startWatching(handle);
        forceAppUpdate();  // Force update after successful initialization
      } catch {
        // Not initialized - show modal
        setShowInitModal(true);
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
      clearDirectory();
    }
  }, [clearDirectory, startWatching, updateState, forceAppUpdate]);

  // Handle initialization completion
  const handleInitializationComplete = useCallback(async () => {
    if (!state.directoryHandle) {
      console.error('No directory handle available');
      return;
    }

    try {
      // Start watching with existing handle
      await startWatching(state.directoryHandle);
      setShowInitModal(false);
      forceAppUpdate();  // Force update after initialization completes
    } catch (error) {
      console.error('Error starting watch after initialization:', error);
      clearDirectory();
    }
  }, [state.directoryHandle, startWatching, clearDirectory, forceAppUpdate]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  // Include updateTrigger in the render to ensure updates propagate
  React.useEffect(() => {
    console.log('Update triggered:', updateTrigger);
  }, [updateTrigger]);

  return (
    <DirectoryContext.Provider value={{
      ...state,
      WATCHER_HEARTBEAT,
      selectDirectory,
      clearDirectory,
      watchDirectory,
    }}>
      {children}
      <InitializationModal
        isOpen={showInitModal}
        onComplete={handleInitializationComplete}
        dirHandle={state.directoryHandle!}
        forceAppUpdate={forceAppUpdate}  // Pass the force update function
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

export default DirectoryContext;
