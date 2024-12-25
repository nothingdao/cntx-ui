// src/components/FileTagsDisplay.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDirectoryWatcher } from '@/hooks/useDirectoryWatcher';

interface FileTagsDisplayProps {
  filePath: string;
  className?: string;
}

export function FileTagsDisplay({ filePath, className = '' }: FileTagsDisplayProps) {
  const { tags: availableTags, getTagsForFile, addTagToFiles, removeTagFromFiles } = useDirectoryWatcher();
  const fileTags = getTagsForFile(filePath);

  const handleAddTag = async (tagName: string) => {
    await addTagToFiles(tagName, [filePath]);
  };

  const handleRemoveTag = async (tagName: string) => {
    await removeTagFromFiles(tagName, [filePath]);
  };

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {fileTags.map(tagName => {
        const tagConfig = availableTags[tagName];
        return (
          <Badge
            key={tagName}
            style={{ backgroundColor: tagConfig?.color || '#94a3b8' }}
            className="text-white flex items-center gap-1"
          >
            {tagName}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 text-white hover:text-white hover:bg-black/20"
              onClick={() => handleRemoveTag(tagName)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        );
      })}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Tag
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {Object.entries(availableTags)
            .filter(([tagName]) => !fileTags.includes(tagName))
            .map(([tagName, config]) => (
              <DropdownMenuItem
                key={tagName}
                onClick={() => handleAddTag(tagName)}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  {tagName}
                </div>
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
