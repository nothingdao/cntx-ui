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
  const [ignorePatterns, setIgnorePatterns] = useState<string[]>([]);
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
        const cntxDir = await directoryHandle.getDirectoryHandle('.cntx');
        console.log("Loading patterns from pattern-ignore.ts...");
        const patterns = await loadPatternIgnore(cntxDir);
        console.log("ProjectConfigContext - Loaded patterns:", patterns);

        // Set the patterns in state
        setIgnorePatterns(patterns);
        setIsProjectInitialized(true);
      } catch (error) {
        console.error('Project not initialized or pattern file error:', error);
        setIsProjectInitialized(false);
      }
    };

    checkInitialization();
  }, [directoryHandle]);

  const updateIgnorePatterns = useCallback(async (patterns: string[]) => {
    if (!directoryHandle) return;

    try {
      // Update state immediately
      setIgnorePatterns(patterns);
      console.log("Setting ignorePatterns state to:", patterns);

      // Get the config directory handle
      const cntxDir = await directoryHandle.getDirectoryHandle('.cntx');
      const configDir = await cntxDir.getDirectoryHandle('config');

      // Create a very simple format that's easy to parse
      const content = `// .cntx/config/pattern-ignore.ts
export default [
  ${patterns.map(p => `'${p}'`).join(',\n  ')}
] as const;
`;

      console.log("Writing pattern file with content:", content);

      // Write to file
      const ignoreHandle = await configDir.getFileHandle('pattern-ignore.ts', {
        create: true,
      });
      const writable = await ignoreHandle.createWritable();
      await writable.write(content);
      await writable.close();

      // Force refresh files with the new patterns
      setTimeout(() => refreshFiles(), 100);
    } catch (error) {
      console.error('Error updating ignore patterns:', error);
    }
  }, [directoryHandle, refreshFiles]);

  const initProject = useCallback(async () => {
    if (!directoryHandle) {
      throw new Error('No directory handle provided');
    }

    try {
      const { cntxDir } = await initializeProject(directoryHandle);

      // Load ignore patterns
      const patterns = await loadPatternIgnore(cntxDir);
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
