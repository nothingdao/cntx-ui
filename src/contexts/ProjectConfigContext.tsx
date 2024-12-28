// src/contexts/ProjectConfigContext.tsx
import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import type { ProjectConfigContextType } from './types';
import { DEFAULT_BUNDLE_IGNORE } from '@/constants';
import { initializeProject, loadPatternIgnore } from '@/utils/project-utils';

import { useDirectory } from './DirectoryContext';
import { useFiles } from './FileContext';

const ProjectConfigContext = createContext<ProjectConfigContextType>({
  ignorePatterns: DEFAULT_BUNDLE_IGNORE,
  updateIgnorePatterns: () => { },
  isProjectInitialized: false,
  initializeProject: async () => { },
});

export function ProjectConfigProvider({ children }: { children: React.ReactNode }) {
  const [ignorePatterns, setIgnorePatterns] = useState<string[]>(DEFAULT_BUNDLE_IGNORE);
  const [isProjectInitialized, setIsProjectInitialized] = useState(false);
  const { directoryHandle } = useDirectory();
  const { refreshFiles } = useFiles();  // Add this to trigger file refresh


  // Check if project is initialized when directory changes
  useEffect(() => {
    const checkInitialization = async () => {
      if (!directoryHandle) {
        setIsProjectInitialized(false);
        return;
      }

      try {
        const rufasDir = await directoryHandle.getDirectoryHandle('.rufas');
        const patterns = await loadPatternIgnore(rufasDir);
        setIgnorePatterns(patterns);
        setIsProjectInitialized(true);
      } catch (error) {
        console.log('Project not initialized:', error);
        setIsProjectInitialized(false);
      }
    };

    checkInitialization();
  }, [directoryHandle]);

  const updateIgnorePatterns = useCallback(async (patterns: string[]) => {
    if (!directoryHandle) return;

    try {
      // Update state
      setIgnorePatterns(patterns);

      // Get the config directory handle
      const rufasDir = await directoryHandle.getDirectoryHandle('.rufas');
      const configDir = await rufasDir.getDirectoryHandle('config');

      // Create the content for pattern-ignore.ts
      const content = `// .rufas/config/pattern-ignore.ts
export default ${JSON.stringify(patterns, null, 2)} as const;
`;

      // Write to file
      const ignoreHandle = await configDir.getFileHandle('pattern-ignore.ts', {
        create: true,
      });
      const writable = await ignoreHandle.createWritable();
      await writable.write(content);
      await writable.close();

      // After updating patterns, refresh files to apply new ignore rules
      await refreshFiles();

    } catch (error) {
      console.error('Error updating ignore patterns:', error);
      // Revert state on error
      setIgnorePatterns(ignorePatterns);
    }
  }, [directoryHandle, ignorePatterns, refreshFiles]);

  const initProject = useCallback(async () => {
    if (!directoryHandle) {
      throw new Error('No directory handle provided');
    }

    try {
      const { rufasDir } = await initializeProject(directoryHandle);

      // Load ignore patterns
      const patterns = await loadPatternIgnore(rufasDir);
      setIgnorePatterns(patterns);

      setIsProjectInitialized(true);
    } catch (error) {
      console.error('Project initialization failed:', error);
      setIsProjectInitialized(false);
      throw error;
    }
  }, [directoryHandle]);

  const value = {
    ignorePatterns,
    updateIgnorePatterns,
    isProjectInitialized,
    initializeProject: initProject,
  };

  return (
    <ProjectConfigContext.Provider value={value}>
      {children}
    </ProjectConfigContext.Provider>
  );
}

export function useProjectConfig() {
  const context = useContext(ProjectConfigContext);
  if (!context) {
    throw new Error('useProjectConfig must be used within a ProjectConfigProvider');
  }
  return context;
}
