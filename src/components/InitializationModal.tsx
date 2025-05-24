// src/components/InitializationModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { Loader2, AlertCircle, CheckCircle, Zap, Settings, FolderOpen } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { FileSystemDirectoryHandle } from "@/types/types"
import { initializeProject } from '../utils/project-utils'

interface InitializationModalProps {
  isOpen: boolean;
  onComplete: () => void;
  dirHandle: FileSystemDirectoryHandle;
  forceAppUpdate: () => void;  // New prop to force parent update
}

type Status = 'idle' | 'loading' | 'error' | 'success' | 'loading-app';

export function InitializationModal({
  isOpen,
  onComplete,
  dirHandle,
  forceAppUpdate
}: InitializationModalProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setError('');
    }
  }, [isOpen]);

  const handleInitConfig = async () => {
    setStatus('loading');
    setError('');

    try {
      await initializeProject(dirHandle);
      setStatus('success');
    } catch (error) {
      console.error('Failed to initialize project:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize project configuration.');
      setStatus('error');
    }
  };

  const handleComplete = async () => {
    try {
      setStatus('loading-app');

      // Force parent component to update
      forceAppUpdate();

      // Close modal
      onComplete();
    } catch (error) {
      console.error('Error completing initialization:', error);
      setError('Failed to complete initialization.');
      setStatus('error');
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-2xl border-0 bg-transparent shadow-none p-0">
        <div className="bg-gradient-to-br from-background to-muted/20 rounded-lg p-8">
          <Card className="border-0 bg-background/95 backdrop-blur">
            <DialogHeader className="text-center pb-6 px-6 pt-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                {status === 'loading-app' ? (
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                ) : (
                  <FolderOpen className="w-8 h-8 text-primary" />
                )}
              </div>
              <DialogTitle className="text-2xl">
                {status === 'loading-app' ? 'Loading Application...' : 'Project Initialization'}
              </DialogTitle>
              <DialogDescription className="text-base">
                {status === 'loading-app'
                  ? 'Setting up your workspace and loading files...'
                  : 'Initialize this directory with Cntx to track file changes, manage tags, and create bundles for AI consumption.'}
              </DialogDescription>
            </DialogHeader>

            <CardContent className="space-y-6 px-6 pb-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {status !== 'loading-app' && (
                <>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-4 text-center">What This Will Do</h4>
                      <div className="grid gap-3">
                        <div className="flex items-center space-x-3 p-3 rounded-lg border bg-card/50">
                          <Settings className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Creates project structure</p>
                            <p className="text-xs text-muted-foreground">
                              Sets up a <code className="bg-muted px-1 rounded">.cntx</code> directory with configuration and state tracking
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 rounded-lg border bg-card/50">
                          <Zap className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Configures default settings</p>
                            <p className="text-xs text-muted-foreground">
                              Sets up file ignore patterns and initial tag system
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {status === 'success' ? (
                    <div className="space-y-4">
                      <Alert className="border-green-600 bg-green-50 dark:bg-green-900/20">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertTitle className="text-green-800 dark:text-green-200">Initialization Complete</AlertTitle>
                        <AlertDescription className="text-green-700 dark:text-green-300">
                          Project setup is complete. Remember to check the Config tab if you need to customize ignore patterns for your project.
                        </AlertDescription>
                      </Alert>
                      <Button
                        onClick={handleComplete}
                        className="w-full"
                        size="lg"
                      >
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Begin Using Cntx
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={handleInitConfig}
                      disabled={status === 'loading'}
                      className="w-full"
                      size="lg"
                    >
                      {status === 'loading' && (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      )}
                      {status === 'loading' ? 'Initializing Project...' : 'Initialize Project'}
                    </Button>
                  )}
                </>
              )}

              {status === 'loading-app' && (
                <div className="py-8 text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading your workspace...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
