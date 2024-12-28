// src/components/MasterBundlePanel.tsx
import { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { HistoryIcon, SquareDot } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BundleManifest } from '@/types/types';
import { useDirectory } from '@/contexts/DirectoryContext';
import { useFiles } from '@/contexts/FileContext';
import { useBundles } from '@/contexts/BundleContext';

type MasterBundleStatus = {
  exists: boolean;
  lastCreated?: Date;
  fileCount?: number;
  modifiedFileCount?: number;
};

export function MasterBundlePanel() {
  const { directoryHandle, isWatching } = useDirectory();
  const { watchedFiles } = useFiles();
  const { createMasterBundle } = useBundles();

  const [status, setStatus] = useState<MasterBundleStatus>({ exists: false });
  const [isCreating, setIsCreating] = useState(false);

  const loadMasterBundleStatus = useCallback(async () => {
    if (!directoryHandle) return;

    try {
      // Look directly in the master bundles directory
      const rufasDir = await directoryHandle.getDirectoryHandle('.rufas');
      const bundlesDir = await rufasDir.getDirectoryHandle('bundles');
      const masterDir = await bundlesDir.getDirectoryHandle('master');

      // Get all entries in master dir
      const entries = [];
      for await (const entry of masterDir.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('-manifest.json')) {
          entries.push(entry);
        }
      }

      // If no manifest found, no master bundle exists
      if (entries.length === 0) {
        setStatus({ exists: false });
        return;
      }

      // Get the latest manifest
      const latestManifest = entries.sort((a, b) => b.name.localeCompare(a.name))[0];
      const manifestFile = await latestManifest.getFile();
      const manifest: BundleManifest = JSON.parse(await manifestFile.text());

      // Compare files against manifest
      const modifiedFiles = watchedFiles.filter(file => {
        const manifestFile = manifest.files.find(f => f.path === file.path);
        return manifestFile && new Date(file.lastModified) > new Date(manifestFile.lastModified);
      });

      setStatus({
        exists: true,
        lastCreated: new Date(manifest.created),
        fileCount: manifest.fileCount,
        modifiedFileCount: modifiedFiles.length
      });
    } catch (error) {
      console.error('Error loading master bundle status:', error);
      setStatus({ exists: false });
    }
  }, [directoryHandle, watchedFiles]);

  useEffect(() => {
    if (isWatching && directoryHandle) {
      loadMasterBundleStatus();
    }
  }, [isWatching, directoryHandle, loadMasterBundleStatus]);

  const handleCreateMasterBundle = async () => {
    setIsCreating(true);
    try {
      await createMasterBundle();
      await loadMasterBundleStatus();
    } catch (error) {
      console.error('Error creating master bundle:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isWatching) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <HistoryIcon className="h-5 w-5" />
          <span>Master Bundle</span>
        </CardTitle>
        <CardDescription>
          Project-wide snapshot
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            {status.exists ? (
              <>
                <div className="text-sm">
                  Last created: {status.lastCreated?.toLocaleString()}
                </div>
                <div className="text-sm">
                  Files included: {status.fileCount}
                </div>
                {status.modifiedFileCount !== undefined && status.modifiedFileCount > 0 && (
                  <div className="flex items-center space-x-2">
                    <SquareDot strokeWidth={0.5} />
                    <span className="text-sm">
                      {status.modifiedFileCount} files modified since creation
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                No master bundle created yet
              </div>
            )}
          </div>

          <Button
            onClick={handleCreateMasterBundle}
            disabled={isCreating}
            className="w-full"
          >
            {isCreating
              ? 'Creating Master Bundle...'
              : status.exists
                ? 'Recreate Master Bundle'
                : 'Create Master Bundle'
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
