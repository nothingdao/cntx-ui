// In src/contexts/CntxProvider.tsx
import React from 'react';
import { DirectoryProvider } from './DirectoryContext';
import { ProjectConfigProvider } from './ProjectConfigContext';
import { FileProvider } from './FileContext';
import { BundleProvider } from './BundleContext';
import { TagProvider } from './TagContext';

export function CntxProvider({ children }: { children: React.ReactNode }) {
  return (
    <DirectoryProvider>
      <ProjectConfigProvider>
        <FileProvider>
          <BundleProvider>
            <TagProvider>
              {children}
            </TagProvider>
          </BundleProvider>
        </FileProvider>
      </ProjectConfigProvider>
    </DirectoryProvider>
  );
}
