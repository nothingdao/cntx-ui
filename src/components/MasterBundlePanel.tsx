// src/components/MasterBundlePanel.tsx
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { useDirectoryWatcher } from '../hooks/useDirectoryWatcher';
import { HistoryIcon, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type MasterBundleStatus = {
  exists: boolean;
  lastCreated?: Date;
  fileCount?: number;
  modifiedFileCount?: number;
};

export function MasterBundlePanel() {
  const {
    watchedFiles,
    rufasDir,
    isWatching,
    createMasterBundle
  } = useDirectoryWatcher();

  const [status, setStatus] = useState<MasterBundleStatus>({ exists: false });
  const [isCreating, setIsCreating] = useState(false);

  const loadMasterBundleStatus = async () => {
    if (!rufasDir) return;

    try {
      const bundlesDir = await rufasDir.getDirectoryHandle('bundles');
      const masterDir = await bundlesDir.getDirectoryHandle('master');

      // Look for the latest master bundle manifest
      let latestManifest = null;
      for await (const entry of masterDir.values()) {
        if (entry.name.endsWith('-manifest.json')) {
          const file = await entry.getFile();
          const content = await file.text();
          const manifest = JSON.parse(content);

          if (!latestManifest || manifest.created > latestManifest.created) {
            latestManifest = manifest;
          }
        }
      }

      if (latestManifest) {
        const modifiedFiles = watchedFiles.filter(file =>
          file.lastModified > new Date(latestManifest.created)
        );

        setStatus({
          exists: true,
          lastCreated: new Date(latestManifest.created),
          fileCount: latestManifest.fileCount,
          modifiedFileCount: modifiedFiles.length
        });
      } else {
        setStatus({ exists: false });
      }
    } catch (error) {
      console.error('Error loading master bundle status:', error);
      setStatus({ exists: false });
    }
  };

  useEffect(() => {
    if (isWatching) {
      loadMasterBundleStatus();
    }
  }, [isWatching, watchedFiles]);

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
          Project-wide snapshot of all non-ignored files
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
                {status.modifiedFileCount > 0 && (
                  <div className="flex items-center space-x-2 text-amber-500">
                    <AlertCircle className="h-4 w-4" />
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
