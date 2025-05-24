// src/contexts/TagContext.tsx - FIXED to ensure all tags load properly
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
  const [isLoading, setIsLoading] = useState(true);
  const { directoryHandle, isWatching } = useDirectory();
  const { watchedFiles } = useFiles();

  useEffect(() => {
    const loadTags = async () => {
      console.log('🏷️  TagContext: Loading tags...');
      setIsLoading(true);

      if (!directoryHandle || !isWatching) {
        console.log('🏷️  TagContext: No directory handle or not watching, using DEFAULT_TAGS');
        setTags(DEFAULT_TAGS);
        setIsLoading(false);
        return;
      }

      try {
        const cntxDir = await directoryHandle.getDirectoryHandle('.cntx');
        const existingTags = await loadTagsConfig(cntxDir);

        console.log('🏷️  TagContext: Loaded tags from config:', Object.keys(existingTags));
        console.log('🏷️  TagContext: Tag count:', Object.keys(existingTags).length);

        // Merge with defaults to ensure we have all standard tags plus custom ones
        const mergedTags = {
          ...DEFAULT_TAGS,
          ...existingTags
        };

        console.log('🏷️  TagContext: Final merged tags:', Object.keys(mergedTags));
        setTags(mergedTags);
      } catch (error) {
        console.error('🏷️  TagContext: Error loading tags:', error);
        console.log('🏷️  TagContext: Falling back to DEFAULT_TAGS');
        setTags(DEFAULT_TAGS);
      } finally {
        setIsLoading(false);
      }
    };

    loadTags();
  }, [directoryHandle, isWatching]);

  // Debug: Log whenever tags change
  useEffect(() => {
    console.log('🏷️  TagContext: Tags state updated:', {
      count: Object.keys(tags).length,
      tags: Object.keys(tags),
      isLoading
    });
  }, [tags, isLoading]);

  const addTag = useCallback(async (name: string, color: string, description: string) => {
    if (!directoryHandle) return;

    try {
      const cntxDir = await directoryHandle.getDirectoryHandle('.cntx');
      const newTags = {
        ...tags,
        [name]: { color, description }
      };

      console.log(`🏷️  TagContext: Adding new tag "${name}"`);
      await saveTagsConfig(cntxDir, newTags);
      setTags(newTags);
      console.log(`✅ TagContext: Successfully added tag "${name}"`);
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

      // CRITICAL FIX: Remove tag from all files in state safely
      // Load state without filtering to get ALL files including tagged ones
      const state = await loadState(cntxDir, []); // No filtering to preserve all files

      let removedFromCount = 0;
      Object.keys(state.files).forEach(path => {
        const originalTags = state.files[path].tags;
        state.files[path].tags = state.files[path].tags.filter(t => t !== name);

        if (originalTags.length !== state.files[path].tags.length) {
          removedFromCount++;
        }
      });

      console.log(`🗑️  Removed tag "${name}" from ${removedFromCount} files`);

      // Save state with tag preservation (other tags are kept)
      await saveState(cntxDir, state, []); // No filtering to preserve all files

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

      // CRITICAL FIX: Load state without filtering to preserve ALL existing files
      const state = await loadState(cntxDir, []); // No filtering

      let addedToCount = 0;

      paths.forEach(path => {
        if (!state.files[path]) {
          // Create new file entry if it doesn't exist
          const pathParts = path.split('/');
          state.files[path] = {
            name: pathParts[pathParts.length - 1],
            directory: pathParts.slice(0, -1).join('/') || 'Root',
            lastModified: new Date().toISOString(),
            isChanged: false,
            isStaged: false,
            tags: [tag]
          };
          addedToCount++;
        } else if (!state.files[path].tags.includes(tag)) {
          // Add tag to existing file if it doesn't already have it
          state.files[path].tags.push(tag);
          addedToCount++;
        }
      });

      console.log(`🏷️  Added tag "${tag}" to ${addedToCount} files`);

      // Save state with all file preservation
      await saveState(cntxDir, state, []); // No filtering to preserve all files
    } catch (error) {
      console.error('Error adding tags to files:', error);
    }
  }, [directoryHandle]);

  const removeTagFromFiles = useCallback(async (tag: string, paths: string[]) => {
    if (!directoryHandle) return;

    try {
      const cntxDir = await directoryHandle.getDirectoryHandle('.cntx');

      // CRITICAL FIX: Load state without filtering to preserve ALL existing files
      const state = await loadState(cntxDir, []); // No filtering

      let removedFromCount = 0;

      paths.forEach(path => {
        if (state.files[path]) {
          const originalLength = state.files[path].tags.length;
          state.files[path].tags = state.files[path].tags.filter(t => t !== tag);

          if (originalLength !== state.files[path].tags.length) {
            removedFromCount++;
          }
        }
      });

      console.log(`🗑️  Removed tag "${tag}" from ${removedFromCount} files`);

      // Save state with all file preservation
      await saveState(cntxDir, state, []); // No filtering to preserve all files
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
