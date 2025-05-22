import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import type { TagContextType } from './types';
import type { TagsConfig, WatchedFile } from '@/types/types';
import { DEFAULT_TAGS } from '@/constants';
import { useDirectory } from './DirectoryContext';
import { useFiles } from './FileContext';
import { loadState, saveState } from '@/utils/file-state';
import { loadTagsConfig, saveTagsConfig } from '@/utils/project-utils';

const TagContext = createContext<TagContextType>({
  tags: {},
  addTag: () => { },
  deleteTag: () => { },
  updateTag: () => { },
  getFilesWithTag: () => [],
  addTagToFiles: async () => { },
  removeTagFromFiles: async () => { },
});

export function TagProvider({ children }: { children: React.ReactNode }) {
  const [tags, setTags] = useState<TagsConfig>(DEFAULT_TAGS);
  const { directoryHandle, isWatching } = useDirectory();
  const { watchedFiles } = useFiles();

  useEffect(() => {
    const loadTags = async () => {
      if (!directoryHandle || !isWatching) return;

      try {
        const cntxDir = await directoryHandle.getDirectoryHandle('.cntx');
        const existingTags = await loadTagsConfig(cntxDir);
        setTags(existingTags);
      } catch (error) {
        console.error('Error loading tags:', error);
        setTags(DEFAULT_TAGS);
      }
    };

    loadTags();
  }, [directoryHandle, isWatching]);

  const addTag = useCallback(async (name: string, color: string, description: string) => {
    if (!directoryHandle) return;

    try {
      const cntxDir = await directoryHandle.getDirectoryHandle('.cntx');
      const newTags = {
        ...tags,
        [name]: { color, description }
      };

      await saveTagsConfig(cntxDir, newTags);
      setTags(newTags);
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  }, [directoryHandle, tags]);

  const deleteTag = useCallback(async (name: string) => {
    if (!directoryHandle) return;

    try {
      const cntxDir = await directoryHandle.getDirectoryHandle('.cntx');

      // Remove tag from tags config
      const { [name]: _, ...remainingTags } = tags;
      await saveTagsConfig(cntxDir, remainingTags);

      // Remove tag from all files in state
      const state = await loadState(cntxDir);
      Object.keys(state.files).forEach(path => {
        state.files[path].tags = state.files[path].tags.filter(t => t !== name);
      });
      await saveState(cntxDir, state);

      setTags(remainingTags);
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  }, [directoryHandle, tags]);

  const updateTag = useCallback(async (name: string, color: string, description: string) => {
    if (!directoryHandle) return;

    try {
      const cntxDir = await directoryHandle.getDirectoryHandle('.cntx');
      const updatedTags = {
        ...tags,
        [name]: { color, description }
      };

      await saveTagsConfig(cntxDir, updatedTags);
      setTags(updatedTags);
    } catch (error) {
      console.error('Error updating tag:', error);
    }
  }, [directoryHandle, tags]);

  const getFilesWithTag = useCallback((tag: string): WatchedFile[] => {
    return watchedFiles.filter(file => file.tags?.includes(tag));
  }, [watchedFiles]);

  const addTagToFiles = useCallback(async (tag: string, paths: string[]) => {
    if (!directoryHandle) return;

    try {
      const cntxDir = await directoryHandle.getDirectoryHandle('.cntx');
      const state = await loadState(cntxDir);

      paths.forEach(path => {
        if (!state.files[path]) {
          const pathParts = path.split('/');
          state.files[path] = {
            name: pathParts[pathParts.length - 1],
            directory: pathParts.slice(0, -1).join('/') || 'Root',
            lastModified: new Date().toISOString(),
            isChanged: false,
            isStaged: false,
            tags: [tag]
          };
        } else if (!state.files[path].tags.includes(tag)) {
          state.files[path].tags.push(tag);
        }
      });

      await saveState(cntxDir, state);
    } catch (error) {
      console.error('Error adding tags to files:', error);
    }
  }, [directoryHandle]);

  const removeTagFromFiles = useCallback(async (tag: string, paths: string[]) => {
    if (!directoryHandle) return;

    try {
      const cntxDir = await directoryHandle.getDirectoryHandle('.cntx');
      const state = await loadState(cntxDir);

      paths.forEach(path => {
        if (state.files[path]) {
          state.files[path].tags = state.files[path].tags.filter(t => t !== tag);
        }
      });

      await saveState(cntxDir, state);
    } catch (error) {
      console.error('Error removing tags from files:', error);
    }
  }, [directoryHandle]);

  const value = {
    tags,
    addTag,
    deleteTag,
    updateTag,
    getFilesWithTag,
    addTagToFiles,
    removeTagFromFiles,
  };

  return (
    <TagContext.Provider value={value}>
      {children}
    </TagContext.Provider>
  );
}

export function useTags() {
  const context = useContext(TagContext);
  if (!context) {
    throw new Error('useTags must be used within a TagProvider');
  }
  return context;
}
