// Updated src/contexts/CntxProvider.tsx
import React from 'react';
import { DirectoryProvider } from './DirectoryContext';
import { ProjectConfigProvider } from './ProjectConfigContext';
import { FileProvider } from './FileContext';
import { BundleProvider } from './BundleContext';
import { TagProvider } from './TagContext';
import { CursorRulesProvider } from './CursorRulesContext';

export function CntxProvider({ children }: { children: React.ReactNode }) {
  return (
    <DirectoryProvider>
      <ProjectConfigProvider>
        <FileProvider>
          <BundleProvider>
            <TagProvider>
              <CursorRulesProvider>
                {children}
              </CursorRulesProvider>
            </TagProvider>
          </BundleProvider>
        </FileProvider>
      </ProjectConfigProvider>
    </DirectoryProvider>
  );
}
