// src/components/InitializationModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { FileSystemDirectoryHandle } from "@/types/filesystem"
import { initializeProject, loadBundleIgnore } from '../utils/project-utils'

interface InitializationModalProps {
  isOpen: boolean;
  onComplete: () => void;
  dirHandle: FileSystemDirectoryHandle;
  processDirectory: (dirHandle: FileSystemDirectoryHandle, relativePath?: string) => Promise<void>;
  setIgnorePatterns: (patterns: string[]) => void;
}

type Status = 'idle' | 'loading' | 'error' | 'success';

export function InitializationModal({
  isOpen,
  onComplete,
  dirHandle,
  processDirectory,
  setIgnorePatterns,
}: InitializationModalProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');

  const handleInitConfig = async () => {
    setStatus('loading');
    setError('');
    try {
      // Initialize and get the .sourcery directory
      const { sourceryDir: newSourceryDir } = await initializeProject(dirHandle);

      // Load ignore patterns
      const patterns = await loadBundleIgnore(newSourceryDir);
      setIgnorePatterns(patterns);

      // Process the directory to populate watchedFiles
      await processDirectory(dirHandle);

      setStatus('success');
      onComplete();
    } catch (error) {
      console.error('Failed to initialize project:', error);
      setError('Failed to initialize project configuration.');
      setStatus('error');
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Project Initialization</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <h4 className="font-medium">Initialize Project</h4>
            <p className="text-sm text-gray-500">
              Creates a .sourcery directory in the root of your project with default configuration files and file tracking data.
            </p>
            <Button
              onClick={handleInitConfig}
              disabled={status === 'loading'}
              className="w-full"
              variant="default"
            >
              {status === 'loading' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Initialize Project
            </Button>
          </div>

          {status === 'success' && (
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">
                Project initialization complete! You can now start tracking file changes.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
