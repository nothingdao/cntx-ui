// src/components/InitializationModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Loader2, AlertCircle, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { FileSystemDirectoryHandle } from "@/types/types"
import { initializeProject } from '../utils/project-utils'
import { Card, CardContent } from "@/components/ui/card"

interface InitializationModalProps {
  isOpen: boolean;
  onComplete: () => void;
  dirHandle: FileSystemDirectoryHandle;
}

type Status = 'idle' | 'loading' | 'error' | 'success';

export function InitializationModal({
  isOpen,
  onComplete,
  dirHandle,
}: InitializationModalProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');

  const handleInitConfig = async () => {
    setStatus('loading');
    setError('');

    try {
      await initializeProject(dirHandle);
      setStatus('success');
      // Note: Not calling onComplete here anymore
    } catch (error) {
      console.error('Failed to initialize project:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize project configuration.');
      setStatus('error');
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Project Initialization</DialogTitle>
          <DialogDescription>
            Initialize this directory with Rufas to track file changes and create bundles.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">What This Will Do</h4>
              <Card className="bg-muted">
                <CardContent className="p-4 space-y-2 text-sm">
                  <p>• Creates a <code className="text-xs">.rufas</code> directory in your project root</p>
                  <p>• Sets up initial configuration and state tracking</p>
                  <p>• Configures default file ignore patterns</p>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Important Note About Ignore Patterns</AlertTitle>
              <AlertDescription className="mt-2 text-sm">
                Default ignore patterns (node_modules, .git, etc.) will be configured, but your project may have additional directories that should be ignored (like .next, .output, etc.). You can update these patterns in the Config tab after initialization to prevent performance issues with large directories.
              </AlertDescription>
            </Alert>

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

          {status === 'success' ? (
            <div className="space-y-4">
              <Alert variant="default" className="border-green-600 bg-green-50 dark:bg-green-900/20">
                <AlertTitle className="text-green-800 dark:text-green-200">Initialization Complete</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-300">
                  Project setup is complete. Remember to check the Config tab if you need to customize ignore patterns for your project.
                </AlertDescription>
              </Alert>
              <Button
                onClick={onComplete}
                className="w-full"
                variant="default"
              >
                Begin Using Rufas
              </Button>
            </div>
          ) : (
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
