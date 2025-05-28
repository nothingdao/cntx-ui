// src/components/FileTagsDisplay.tsx
import { Button } from '@/components/ui/button';
import { Paintbrush, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useTags } from '@/contexts/TagContext';
import { useFiles } from '@/contexts/FileContext';

interface FileTagsDisplayProps {
  filePath: string;
  className?: string;
}

export function FileTagsDisplay({ filePath, className = '' }: FileTagsDisplayProps) {
  const { tags, addTagToFiles, removeTagFromFiles } = useTags();
  const { watchedFiles, refreshFiles } = useFiles();

  // Get the file's current tags from watchedFiles
  const currentFile = watchedFiles.find(file => file.path === filePath);
  const fileTags = currentFile?.tags || [];

  const handleAddTag = async (tagName: string) => {
    try {
      await addTagToFiles(tagName, [filePath]);
      // Force a refresh of the files to update the UI
      await refreshFiles();
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  const handleRemoveTag = async (tagName: string) => {
    try {
      await removeTagFromFiles(tagName, [filePath]);
      // Force a refresh of the files to update the UI
      await refreshFiles();
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {fileTags.map(tagName => {
        const tagConfig = tags[tagName];
        return (
          <div
            key={tagName}
            className="h-1 w-1 rounded-full"
            style={{ backgroundColor: tagConfig?.color || '#94a3b8' }}
            title={tagName}
          />
        );
      })}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <Paintbrush className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <div className="p-2 space-y-1">
            {Object.entries(tags).length === 0 && (
              <div className="text-sm text-muted-foreground p-2">No available tags</div>
            )}
            {Object.entries(tags).map(([tagName, config]) => {
              const isTagged = fileTags.includes(tagName);

              return (
                <DropdownMenuItem
                  key={tagName}
                  className="flex items-center gap-2"
                  onClick={() => !isTagged && handleAddTag(tagName)}
                >
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  {tagName}
                  {isTagged && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTag(tagName);
                      }}
                      className="ml-auto"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </DropdownMenuItem>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
