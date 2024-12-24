import { useState, useRef } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileIcon, SquareDot } from 'lucide-react';
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import type { WatchedFile } from '@/contexts/DirectoryWatcherContext';
import { getAllDirectories } from '../utils/file-utils';

type DirectoryTreeProps = {
  files: WatchedFile[];
  onToggleStage: (paths: string[]) => void;
};

type TreeItem = JSX.Element;

function FileRow({
  file,
  onCheckboxClick,
  depth = 0
}: {
  file: WatchedFile;
  onCheckboxClick: (event: React.MouseEvent) => void;
  depth?: number;
}) {
  return (
    <div className="flex items-center space-x-2 py-1 px-2 hover:bg-muted/50 rounded-md"
      style={{ paddingLeft: `${(depth + 1) * 12}px` }}>
      <Checkbox
        checked={file.isStaged}
        onCheckedChange={() => { }} // Handled by onClick
        onClick={onCheckboxClick}
        className="cursor-pointer"
      />
      <FileIcon className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1 truncate text-sm">
        {file.name}
      </span>
      {file.isChanged && (
        <SquareDot size={16} className="text-primary" />
      )}
    </div>
  );
}

export function DirectoryTree({ files, onToggleStage }: DirectoryTreeProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['Root']));
  const [lastSelectedPath, setLastSelectedPath] = useState<string | null>(null);
  const visibleFilesRef = useRef<string[]>([]);

  // Get all directories except Root
  const directories = getAllDirectories(files.map(f => f.path))
    .filter(dir => dir !== 'Root');

  const toggleDirectory = (dir: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(dir)) {
      newExpanded.delete(dir);
    } else {
      newExpanded.add(dir);
    }
    setExpandedDirs(newExpanded);
  };

  const handleCheckboxClick = (path: string, event: React.MouseEvent) => {
    if (event.shiftKey && lastSelectedPath) {
      const currentIndex = visibleFilesRef.current.indexOf(path);
      const lastIndex = visibleFilesRef.current.indexOf(lastSelectedPath);

      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);
        const pathsToToggle = visibleFilesRef.current.slice(start, end + 1);

        onToggleStage(pathsToToggle);
      }
    } else {
      onToggleStage([path]);
    }

    setLastSelectedPath(path);
  };

  const renderTreeItems = (parentDir: string = 'Root', depth: number = 0): TreeItem[] => {
    const allItems: TreeItem[] = [];

    if (parentDir === 'Root') {
      visibleFilesRef.current = [];
    }

    // Get and render directories first
    const childDirs = directories.filter((dir: string) => {
      const parts = dir.split('/');
      const parentParts = parentDir === 'Root' ? [] : parentDir.split('/');
      return parts.length === parentParts.length + 1 &&
        dir.startsWith(parentDir === 'Root' ? '' : parentDir + '/');
    });

    // Add directories
    childDirs.forEach((dir) => {
      const dirName = dir.split('/').pop() || dir;
      const filesInDir = files.filter(f => f.directory === dir);
      const isExpanded = expandedDirs.has(dir);

      allItems.push(
        <div key={dir}>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start px-2 py-1 h-8"
            onClick={() => toggleDirectory(dir)}
            style={{ paddingLeft: `${depth * 12}px` }}
          >
            <span className="flex items-center space-x-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 text-zinc-500" />
              ) : (
                <Folder className="h-4 w-4 text-zinc-500" />
              )}
              <span className="text-sm">{dirName}</span>
              <span className="text-xs text-muted-foreground">
                ({filesInDir.length})
              </span>
            </span>
          </Button>
          {isExpanded && renderTreeItems(dir, depth + 1)}
        </div>
      );
    });

    // Then add files
    const dirFiles = files.filter(f => f.directory === parentDir);
    dirFiles.forEach((file) => {
      visibleFilesRef.current.push(file.path);
      allItems.push(
        <FileRow
          key={file.path}
          file={file}
          onCheckboxClick={(event) => handleCheckboxClick(file.path, event)}
          depth={depth}
        />
      );
    });

    return allItems;
  };

  return (
    <div className="space-y-2">
      <div className="space-y-0.5">
        {renderTreeItems()}
      </div>
    </div>
  );
}
