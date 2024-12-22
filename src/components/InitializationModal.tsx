import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { initializeWatchDirectory } from '../utils/watch-utils';


type Step = 'config' | 'bundle' | 'complete';

interface InitializationModalProps {
  isOpen: boolean;
  onComplete: () => void;
  dirHandle: FileSystemDirectoryHandle;
}

export function InitializationModal({ isOpen, onComplete, dirHandle }: InitializationModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('config');
  const [isLoading, setIsLoading] = useState(false);

  const handleInitConfig = async () => {
    setIsLoading(true);
    try {
      await initializeWatchDirectory(dirHandle);
      setCurrentStep('bundle');
    } catch (error) {
      console.error('Failed to initialize project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBundle = async () => {
    setIsLoading(true);
    try {
      await onComplete();
      setCurrentStep('complete');
    } catch (error) {
      console.error('Failed to create initial bundle:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Project Initialization</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">Step 1: Initialize Project</h4>
            <p className="text-sm text-gray-500">
              Create watch configuration and directory structure
            </p>
            <Button
              onClick={handleInitConfig}
              disabled={currentStep !== 'config' || isLoading}
              className="w-full"
              variant={currentStep === 'config' ? 'default' : 'secondary'}
            >
              {isLoading && currentStep === 'config' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Initialize Project
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Step 2: Create Initial Bundle</h4>
            <p className="text-sm text-gray-500">
              Create first bundle with all non-ignored files
            </p>
            <Button
              onClick={handleCreateBundle}
              disabled={currentStep !== 'bundle' || isLoading}
              className="w-full"
              variant={currentStep === 'bundle' ? 'default' : 'secondary'}
            >
              {isLoading && currentStep === 'bundle' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create First Bundle
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
