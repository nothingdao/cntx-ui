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
import type { WatchedFile } from "@/types/watcher"
import type { FileSystemDirectoryHandle } from "@/types/filesystem"
import { initializeProject, createMasterBundle } from '../utils/project-utils'

interface InitializationModalProps {
  isOpen: boolean;
  onComplete: () => void;
  dirHandle: FileSystemDirectoryHandle;
  watchedFiles: WatchedFile[];
  refreshFiles: () => Promise<void>;
}

type Step = 'config' | 'bundle' | 'complete';
type Status = 'idle' | 'loading' | 'error' | 'success';

export function InitializationModal({
  isOpen,
  onComplete,
  dirHandle,
  watchedFiles,
  refreshFiles,
}: InitializationModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('config');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');
  const [sourceryDir, setSourceryDir] = useState<FileSystemDirectoryHandle | null>(null);

  const handleInitConfig = async () => {
    setStatus('loading');
    setError('');
    try {
      // Initialize and get the .sourcery directory
      const { sourceryDir: newSourceryDir } = await initializeProject(dirHandle);
      setSourceryDir(newSourceryDir);

      // Have the FileWatcherProvider load all files
      await refreshFiles();

      setCurrentStep('bundle');
      setStatus('success');
    } catch (error) {
      console.error('Failed to initialize project:', error);
      setError('Failed to initialize project configuration.');
      setStatus('error');
    }
  };

  const handlecreateMasterBundle = async () => {
    setStatus('loading');
    setError('');

    try {
      if (!sourceryDir) throw new Error('Project not initialized');
      if (watchedFiles.length === 0) throw new Error('No files to bundle');

      // Just create the master bundle with our filtered files
      const result = await createMasterBundle(watchedFiles, sourceryDir);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create master bundle');
      }

      await onComplete();
      setCurrentStep('complete');
      setStatus('success');
    } catch (error) {
      console.error('Failed to create master bundle:', error);
      setError(error instanceof Error ? error.message : 'Failed to create master bundle');
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
            <h4 className="font-medium">Step 1: Initialize Project</h4>
            <p className="text-sm text-gray-500">
              Creates a .sourcery directory in the root of your project with default configuration files, file tracking data, and a bundle storage structure.
            </p>
            <Button
              onClick={handleInitConfig}
              disabled={currentStep !== 'config' || status === 'loading'}
              className="w-full"
              variant={currentStep === 'config' ? 'default' : 'secondary'}
            >
              {status === 'loading' && currentStep === 'config' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Initialize Project
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Step 2: Create Master Bundle</h4>
            <p className="text-sm text-gray-500">
              Create master bundle with all tracked files. The kitchen sink.
            </p>
            <Button
              onClick={handlecreateMasterBundle}
              disabled={currentStep !== 'bundle' || status === 'loading' || watchedFiles.length === 0}
              className="w-full"
              variant={currentStep === 'bundle' ? 'default' : 'secondary'}
            >
              {status === 'loading' && currentStep === 'bundle' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Master Bundle ({watchedFiles.length} files)
            </Button>
          </div>

          {currentStep === 'complete' && (
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
