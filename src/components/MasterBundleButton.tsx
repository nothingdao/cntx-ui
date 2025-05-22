// src/components/MasterBundleButton.tsx
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { useBundles } from '@/contexts/BundleContext';
import { useFiles } from '@/contexts/FileContext';
import { useProjectConfig } from '@/contexts/ProjectConfigContext'; // Added for ignore patterns
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertCircle, Loader2 } from "lucide-react";

export function MasterBundleButton() {
  const { createMasterBundle, masterBundle } = useBundles();
  const { watchedFiles } = useFiles();
  const { ignorePatterns } = useProjectConfig(); // Get ignore patterns
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Calculate how many files will be included in the bundle after applying ignore patterns
  const includedFileCount = watchedFiles.filter(file => {
    // Check if file path matches any ignore pattern
    return !ignorePatterns.some(pattern => {
      // Handle wildcard extension patterns (e.g., *.js)
      if (pattern.startsWith('*.')) {
        const extension = pattern.slice(1); // Include the dot
        return file.path.toLowerCase().endsWith(extension.toLowerCase());
      }

      // Handle directory/exact matches
      const normalizedPath = file.path.toLowerCase();
      const normalizedPattern = pattern.toLowerCase();

      return normalizedPath === normalizedPattern ||
        normalizedPath.includes(`/${normalizedPattern}/`) ||
        normalizedPath.endsWith(`/${normalizedPattern}`) ||
        normalizedPath.startsWith(`${normalizedPattern}/`);
    });
  }).length;

  const handleCreateMasterBundle = async () => {
    setIsCreating(true);
    setError(null);
    setSuccess(false);

    try {
      await createMasterBundle();
      setSuccess(true);
      // Close dialog after success
      setTimeout(() => {
        setIsDialogOpen(false);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error creating master bundle:', err);
      setError(err instanceof Error ? err.message : 'Failed to create master bundle');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsDialogOpen(true)}
        className="flex items-center gap-2"
      >
        <Package className="h-4 w-4" />
        {masterBundle ? "Update Master Bundle" : "Create Master Bundle"}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{masterBundle ? "Update Master Bundle" : "Create Master Bundle"}</DialogTitle>
            <DialogDescription>
              {masterBundle
                ? "Creating a new master bundle will update the reference point for tracking changes."
                : "A master bundle creates a snapshot of all files in your project and helps track changes."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This will create a bundle with {includedFileCount} files after applying your ignore patterns.
                {watchedFiles.length - includedFileCount > 0 && (
                  <span className="block mt-1 text-sm">
                    {watchedFiles.length - includedFileCount} files will be excluded based on your current ignore patterns.
                  </span>
                )}
              </AlertDescription>
            </Alert>

            {ignorePatterns.length > 0 && (
              <Alert variant="default" className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                <AlertTitle className="text-sm font-medium">Active Ignore Patterns</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 text-xs font-mono max-h-24 overflow-y-auto">
                    {ignorePatterns.map((pattern, i) => (
                      <div key={i} className="py-0.5">{pattern}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-600 bg-green-50 dark:bg-green-900/20">
                <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  Master bundle created successfully!
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={handleCreateMasterBundle} disabled={isCreating || success}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {masterBundle ? "Update Master Bundle" : "Create Master Bundle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
