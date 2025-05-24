// src/components/BatchTagButton.tsx - New component for batch file tagging
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Paintbrush, Tags, Plus, Check } from 'lucide-react';
import { useTags } from '@/contexts/TagContext';
import { useFiles } from '@/contexts/FileContext';
import type { WatchedFile } from '@/types/types';

interface BatchTagButtonProps {
  selectedFiles: WatchedFile[];
  onTagsApplied?: () => void;
}

export function BatchTagButton({ selectedFiles, onTagsApplied }: BatchTagButtonProps) {
  const { tags, addTagToFiles } = useTags();
  const { refreshFiles } = useFiles();
  const [showAdvancedDialog, setShowAdvancedDialog] = useState(false);
  const [selectedTagsForBatch, setSelectedTagsForBatch] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  const fileCount = selectedFiles.length;
  const filePaths = selectedFiles.map(f => f.path);

  // Debug: Log the tags to see what we're getting
  console.log('🏷️  BatchTagButton - Available tags:', Object.keys(tags));
  console.log('🏷️  BatchTagButton - Tag count:', Object.keys(tags).length);

  // Quick tag application (single tag)
  const handleQuickTag = async (tagName: string) => {
    try {
      setIsApplying(true);
      console.log(`🏷️  Applying tag "${tagName}" to ${fileCount} files...`);

      await addTagToFiles(tagName, filePaths);
      await refreshFiles(); // Refresh to show updated tags

      console.log(`✅ Successfully applied tag "${tagName}" to ${fileCount} files`);
      onTagsApplied?.();
    } catch (error) {
      console.error('Error applying tag:', error);
    } finally {
      setIsApplying(false);
    }
  };

  // Advanced batch tagging (multiple tags)
  const handleAdvancedTagging = () => {
    setSelectedTagsForBatch([]);
    setShowAdvancedDialog(true);
  };

  const handleBatchTagApplication = async () => {
    if (selectedTagsForBatch.length === 0) return;

    try {
      setIsApplying(true);
      console.log(`🏷️  Applying ${selectedTagsForBatch.length} tags to ${fileCount} files...`);

      // Apply each selected tag to all files
      for (const tagName of selectedTagsForBatch) {
        await addTagToFiles(tagName, filePaths);
      }

      await refreshFiles(); // Refresh to show updated tags

      console.log(`✅ Successfully applied ${selectedTagsForBatch.length} tags to ${fileCount} files`);
      setShowAdvancedDialog(false);
      setSelectedTagsForBatch([]);
      onTagsApplied?.();
    } catch (error) {
      console.error('Error applying batch tags:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const toggleTagSelection = (tagName: string) => {
    setSelectedTagsForBatch(prev =>
      prev.includes(tagName)
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  // Get current tags on selected files for display
  const getCurrentTags = () => {
    const tagCounts = new Map<string, number>();
    selectedFiles.forEach(file => {
      file.tags?.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    return tagCounts;
  };

  const currentTags = getCurrentTags();
  const availableTags = Object.entries(tags);

  // Add safety check for empty tags - this might indicate loading issue
  if (availableTags.length === 0) {
    console.warn('⚠️  BatchTagButton: No tags available - tags might not be loaded yet');
  }

  if (fileCount === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={true}
        title="Select files to tag them"
      >
        <Paintbrush className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isApplying}
            title={`Tag ${fileCount} selected file${fileCount > 1 ? 's' : ''}`}
          >
            <Paintbrush className="h-4 w-4" />
            {fileCount > 1 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                {fileCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="px-2 py-1.5 text-sm font-medium">
            Tag {fileCount} selected file{fileCount > 1 ? 's' : ''}
          </div>

          {currentTags.size > 0 && (
            <>
              <div className="px-2 py-1 text-xs text-muted-foreground">
                Current tags:
              </div>
              <div className="px-2 pb-2 flex flex-wrap gap-1">
                {Array.from(currentTags.entries()).map(([tag, count]) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs"
                    style={{
                      borderColor: tags[tag]?.color || '#888',
                      backgroundColor: `${tags[tag]?.color}22` || 'transparent'
                    }}
                  >
                    {tag}
                    {count < fileCount && (
                      <span className="ml-1 opacity-60">({count})</span>
                    )}
                    {count === fileCount && (
                      <Check className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
              <DropdownMenuSeparator />
            </>
          )}

          <div className="px-2 py-1 text-xs text-muted-foreground">
            Quick add tag:
          </div>

          <ScrollArea className="max-h-48">
            {availableTags.length === 0 ? (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                No tags available
              </div>
            ) : (
              availableTags.map(([tagName, config]) => {
                const isAlreadyOnAllFiles = currentTags.get(tagName) === fileCount;

                return (
                  <DropdownMenuItem
                    key={tagName}
                    className="flex items-center gap-2"
                    onClick={() => !isAlreadyOnAllFiles && handleQuickTag(tagName)}
                    disabled={isAlreadyOnAllFiles || isApplying}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="flex-1">{tagName}</span>
                    {isAlreadyOnAllFiles && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                  </DropdownMenuItem>
                );
              })
            )}
          </ScrollArea>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleAdvancedTagging}
            className="flex items-center gap-2"
          >
            <Tags className="h-4 w-4" />
            Advanced tagging...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Advanced Batch Tagging Dialog */}
      <Dialog open={showAdvancedDialog} onOpenChange={setShowAdvancedDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Batch Tag Files</DialogTitle>
            <DialogDescription>
              Select multiple tags to apply to {fileCount} selected file{fileCount > 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current tags display */}
            {currentTags.size > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Current tags:</div>
                <div className="flex flex-wrap gap-1">
                  {Array.from(currentTags.entries()).map(([tag, count]) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: tags[tag]?.color || '#888',
                        backgroundColor: `${tags[tag]?.color}22` || 'transparent'
                      }}
                    >
                      {tag}
                      {count < fileCount && (
                        <span className="ml-1 opacity-60">({count}/{fileCount})</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Tag selection */}
            <div>
              <div className="text-sm font-medium mb-2">Add tags:</div>
              <ScrollArea className="max-h-48 border rounded-md p-2">
                {availableTags.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No tags available
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableTags.map(([tagName, config]) => {
                      const isSelected = selectedTagsForBatch.includes(tagName);
                      const isAlreadyOnAllFiles = currentTags.get(tagName) === fileCount;

                      return (
                        <div
                          key={tagName}
                          className="flex items-center space-x-2 p-1 rounded hover:bg-muted"
                        >
                          <Checkbox
                            id={`tag-${tagName}`}
                            checked={isSelected}
                            disabled={isAlreadyOnAllFiles}
                            onCheckedChange={() => toggleTagSelection(tagName)}
                          />
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: config.color }}
                          />
                          <label
                            htmlFor={`tag-${tagName}`}
                            className="flex-1 text-sm cursor-pointer"
                          >
                            {tagName}
                            {isAlreadyOnAllFiles && (
                              <span className="ml-2 text-xs text-green-600">
                                (already applied)
                              </span>
                            )}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Selected files preview */}
            <div>
              <div className="text-sm font-medium mb-2">Selected files:</div>
              <ScrollArea className="max-h-32 text-xs text-muted-foreground bg-muted rounded p-2">
                {selectedFiles.map((file, index) => (
                  <div key={file.path}>
                    {index + 1}. {file.name}
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAdvancedDialog(false)}
              disabled={isApplying}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBatchTagApplication}
              disabled={selectedTagsForBatch.length === 0 || isApplying}
            >
              {isApplying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Applying...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Apply {selectedTagsForBatch.length} tag{selectedTagsForBatch.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
