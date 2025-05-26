// src/contexts/CursorRulesContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useDirectory } from './DirectoryContext';
import {
  loadCursorRules,
  saveCursorRules,
} from '@/utils/cursor-rules';

interface CursorRulesContextType {
  // Simplified state
  rulesContent: string;
  rulesLocation: string;
  filePath: string;
  hasExistingRules: boolean;
  isLoading: boolean;
  error: string | null;

  // Simplified actions
  loadRules: () => Promise<void>;
  saveRules: (content: string) => Promise<void>;
  createNewRules: (content: string, location?: 'cursorrules-file' | 'cursor-directory') => Promise<void>;
  clearError: () => void;
}

const CursorRulesContext = createContext<CursorRulesContextType>({
  rulesContent: '',
  rulesLocation: '',
  filePath: '',
  hasExistingRules: false,
  isLoading: false,
  error: null,
  loadRules: async () => { },
  saveRules: async () => { },
  createNewRules: async () => { },
  clearError: () => { }
});

export function CursorRulesProvider({ children }: { children: React.ReactNode }) {
  const [rulesContent, setRulesContent] = useState<string>('');
  const [rulesLocation, setRulesLocation] = useState<string>('');
  const [filePath, setFilePath] = useState<string>('');
  const [hasExistingRules, setHasExistingRules] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { directoryHandle, isWatching } = useDirectory();

  // Load rules when directory changes
  useEffect(() => {
    if (directoryHandle && isWatching) {
      loadRules();
    }
  }, [directoryHandle, isWatching]);

  const loadRules = useCallback(async () => {
    if (!directoryHandle) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Loading Cursor rules...');
      const rules = await loadCursorRules(directoryHandle);

      if (rules) {
        setRulesContent(rules.content);
        setRulesLocation(rules.location);
        setFilePath(rules.filePath);
        setHasExistingRules(true);
        console.log(`✅ Loaded rules from ${rules.filePath}`);
      } else {
        setRulesContent('');
        setRulesLocation('');
        setFilePath('');
        setHasExistingRules(false);
        console.log('ℹ️ No existing rules found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load Cursor rules';
      console.error('❌ Error loading Cursor rules:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [directoryHandle]);

  const saveRules = useCallback(async (content: string) => {
    if (!directoryHandle) {
      throw new Error('No directory selected');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('💾 Saving Cursor rules...');
      await saveCursorRules(directoryHandle, content);

      setRulesContent(content);
      setHasExistingRules(true);

      // Reload to get updated location info
      await loadRules();

      console.log('✅ Cursor rules saved successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save Cursor rules';
      console.error('❌ Error saving Cursor rules:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [directoryHandle, loadRules]);

  const createNewRules = useCallback(async (
    content: string,
    location?: 'cursorrules-file' | 'cursor-directory'
  ) => {
    if (!directoryHandle) {
      throw new Error('No directory selected');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🆕 Creating new Cursor rules...');
      await saveCursorRules(directoryHandle, content, location);

      setRulesContent(content);
      setHasExistingRules(true);

      // Reload to get updated location info
      await loadRules();

      console.log('✅ New Cursor rules created successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create Cursor rules';
      console.error('❌ Error creating Cursor rules:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [directoryHandle, loadRules]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    rulesContent,
    rulesLocation,
    filePath,
    hasExistingRules,
    isLoading,
    error,
    loadRules,
    saveRules,
    createNewRules,
    clearError
  };

  return (
    <CursorRulesContext.Provider value={value}>
      {children}
    </CursorRulesContext.Provider>
  );
}

export function useCursorRules() {
  const context = useContext(CursorRulesContext);
  if (!context) {
    throw new Error('useCursorRules must be used within a CursorRulesProvider');
  }
  return context;
}
