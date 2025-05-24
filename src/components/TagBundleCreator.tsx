// src/components/TagBundleCreator.tsx - Component to create tag-derived bundles
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tag, Plus, Loader2, FileText, AlertCircle } from 'lucide-react';
import { useTags } from '@/contexts/TagContext';
import { useBundles } from '@/contexts/BundleContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function TagBundleCreator() {
  const { tags, getFilesWithTag } = useTags();
  const { createTagBundle } = useBundles(); // This function needs to be added to BundleContext
  const [isCreating, setIsCreating] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreateTagBundle = async (tagName: string) => {
    setIsCreating(tagName);
    setError(null);
    setSuccess(null);

    try {
      console.log(`Creating tag bundle for "${tagName}"...`);
      const bundleId = await createTagBundle(tagName);
      setSuccess(`Tag bundle created successfully: ${bundleId}`);

      // Auto-close after success
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to create tag bundle:', error);
      setError(error instanceof Error ? error.message : 'Failed to create tag bundle');
    } finally {
      setIsCreating(null);
    }
  };

  // Get available tags that have files
  const availableTags = Object.entries(tags).filter(([tagName]) => {
    const filesWithTag = getFilesWithTag(tagName);
    return filesWithTag.length > 0;
  });

  const handleOpenChange = (open: boolean) => {
    if (!isCreating) {
      setIsOpen(open);
      if (!open) {
        setError(null);
        setSuccess(null);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center">
          <Tag className="mr-2 h-4 w-4" />
          Create Tag Bundle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-green-600" />
            Create Tag-Derived Bundle
          </DialogTitle>
          <DialogDescription>
            Select a tag to create a bundle containing all files with that tag.
            This creates an auto-updating bundle based on your file tagging.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-600 bg-green-50 dark:bg-green-950/20">
              <Tag className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {availableTags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">No tagged files found</p>
              <p className="text-sm">Tag some files first, then come back to create tag bundles.</p>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                Available tags with files ({availableTags.length}):
              </div>

              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {availableTags.map(([tagName, tagConfig]) => {
                    const filesWithTag = getFilesWithTag(tagName);
                    const fileCount = filesWithTag.length;
                    const isLoading = isCreating === tagName;

                    return (
                      <div
                        key={tagName}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: tagConfig.color }}
                            title={tagConfig.description || `Tag: ${tagName}`}
                          />
                          <div>
                            <div className="font-medium">{tagName}</div>
                            {tagConfig.description && (
                              <div className="text-xs text-muted-foreground">
                                {tagConfig.description}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {fileCount}
                          </Badge>

                          <Button
                            size="sm"
                            onClick={() => handleCreateTagBundle(tagName)}
                            disabled={isLoading || isCreating !== null}
                            className="min-w-[80px]"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-1" />
                                Create
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <strong>Tip:</strong> Tag-derived bundles automatically include all files
                with the selected tag. If you add or remove the tag from files later,
                you can recreate the bundle to get the updated file list.
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isCreating !== null}
          >
            {availableTags.length === 0 ? 'Close' : 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
