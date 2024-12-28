// src/contexts/RufasProvider.tsx
import React, { useEffect } from 'react';
import { DirectoryProvider, useDirectory } from './DirectoryContext';
import { FileProvider } from './FileContext';
import { BundleProvider } from './BundleContext';
import { TagProvider } from './TagContext';
import { ProjectConfigProvider } from './ProjectConfigContext';

// This component wraps all context providers that need to respond to directory changes
function ContextProviders({ children }: { children: React.ReactNode }) {
  const { directoryHandle } = useDirectory();

  // Reset all child contexts when directory handle changes
  useEffect(() => {
    // This will trigger when directory changes, including when it's set to null
  }, [directoryHandle]);

  return (

    <FileProvider>
      <BundleProvider>
        <TagProvider>
          <ProjectConfigProvider>
            {children}
          </ProjectConfigProvider >
        </TagProvider>
      </BundleProvider>
    </FileProvider>

  );
}

export function RufasProvider({ children }: { children: React.ReactNode }) {
  return (
    <DirectoryProvider>
      <ContextProviders>
        {children}
      </ContextProviders>
    </DirectoryProvider>
  );
}
