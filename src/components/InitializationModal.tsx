import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import { initializeWatchDirectory, createInitialBundle, loadBundleIgnore } from '../utils/watch-utils'
import { scanAllFiles } from '../utils/scan-utils'
import type { WatchedFile } from "@/contexts/FileWatcherContext"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface InitializationModalProps {
  isOpen: boolean;
  onComplete: () => void;
  dirHandle: FileSystemDirectoryHandle;
  watchedFiles: WatchedFile[];
  createBundle: () => Promise<string>;
}

type Step = 'config' | 'bundle' | 'complete';
type Status = 'idle' | 'loading' | 'error' | 'success';

export function InitializationModal({
  isOpen,
  onComplete,
  dirHandle,
}: InitializationModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('config');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');

  const handleInitConfig = async () => {
    setStatus('loading');
    setError('');
    try {
      await initializeWatchDirectory(dirHandle);
      setCurrentStep('bundle');
      setStatus('success');
    } catch (error) {
      console.error('Failed to initialize project:', error);
      setError('Failed to initialize project configuration.');
      setStatus('error');
    }
  };

  const handleCreateInitialBundle = async () => {
    setStatus('loading');
    setError('');
    try {
      const watchDir = await dirHandle.getDirectoryHandle('.sourcery');
      const ignorePatterns = await loadBundleIgnore(watchDir);

      // Scan all files in the directory
      const allFiles = await scanAllFiles(
        dirHandle as import("/Users/pro/Desktop/sourcery/src/types/filesystem").FileSystemDirectoryHandle,
        ignorePatterns
      );
      // Create bundle content with all files
      const bundleContent = allFiles
        .map(file => `<document>\n<source>${file.path}</source>\n<content>${file.content}</content>\n</document>`)
        .join('\n\n');

      const result = await createInitialBundle(allFiles, watchDir, bundleContent);

      if (!result.success) {
        throw new Error(result.error);
      }

      await onComplete();
      setCurrentStep('complete');
      setStatus('success');
    } catch (error) {
      console.error('Failed to create initial bundle:', error);
      setError(error instanceof Error ? error.message : 'Failed to create initial bundle');
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
              Create watch configuration and directory structure
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
            <h4 className="font-medium">Step 2: Create Initial Bundle</h4>
            <p className="text-sm text-gray-500">
              Create first bundle with all files
            </p>
            <Button
              onClick={handleCreateInitialBundle}
              disabled={currentStep !== 'bundle' || status === 'loading'}
              className="w-full"
              variant={currentStep === 'bundle' ? 'default' : 'secondary'}
            >
              {status === 'loading' && currentStep === 'bundle' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Initial Bundle
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
