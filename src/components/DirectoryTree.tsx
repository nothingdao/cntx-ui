// src/components/DirectoryTree.tsx
import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileIcon, SquareDot } from 'lucide-react';
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import type { WatchedFile } from '../contexts/FileWatcherContext';
import { getAllDirectories } from '../utils/file-utils';

type DirectoryTreeProps = {
  files: WatchedFile[];
  onToggleStage: (path: string) => void;
};

function getDirectoryFiles(dir: string, files: WatchedFile[]): WatchedFile[] {
  return files.filter(f => f.directory === dir);
}

function getDirectoryLabel(dir: string): string {
  return dir.split('/').pop() || dir;
}

function FileRow({ file, onToggleStage }: { file: WatchedFile; onToggleStage: () => void }) {
  return (
    <div className="flex items-center space-x-2 py-1 px-2 hover:bg-gray-50 rounded">
      <Checkbox
        checked={file.isStaged}
        onCheckedChange={onToggleStage}
      />
      <FileIcon className="h-4 w-4 text-gray-500" />
      <span className="flex-1 truncate text-sm">
        {file.name}
      </span>
      {file.isChanged && (
        <SquareDot size={16} strokeWidth={0.5} />
      )}
    </div>
  );
}

export function DirectoryTree({ files, onToggleStage }: DirectoryTreeProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['Root']));

  // Get all directories except Root
  const directories = getAllDirectories(files.map(f => f.path))
    .filter(dir => dir !== 'Root');

  // Get files that are directly in the root (no directory)
  const rootFiles = files.filter(f => f.directory === 'Root');

  const toggleDirectory = (dir: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(dir)) {
      newExpanded.delete(dir);
    } else {
      newExpanded.add(dir);
    }
    setExpandedDirs(newExpanded);
  };

  return (
    <div className="space-y-1">
      {/* Render root files first */}
      {rootFiles.map(file => (
        <FileRow
          key={file.path}
          file={file}
          onToggleStage={() => onToggleStage(file.path)}
        />
      ))}

      {/* Then render the directory tree */}
      {directories.map(dir => {
        const isExpanded = expandedDirs.has(dir);
        const dirFiles = getDirectoryFiles(dir, files);
        const displayName = getDirectoryLabel(dir);

        if (dirFiles.length === 0) return null;

        const indent = dir.split('/').length - 1;

        return (
          <div key={dir} className="space-y-0.5" style={{ marginLeft: `${indent * 12}px` }}>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start px-2 py-1 h-8"
              onClick={() => toggleDirectory(dir)}
            >
              <span className="flex items-center space-x-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                {isExpanded ? (
                  <FolderOpen className="h-4 w-4 text-blue-500" />
                ) : (
                  <Folder className="h-4 w-4 text-blue-500" />
                )}
                <span className="text-sm">{displayName}</span>
                <span className="text-xs text-gray-500">({dirFiles.length})</span>
              </span>
            </Button>

            {isExpanded && (
              <div className="ml-6">
                {dirFiles.map(file => (
                  <FileRow
                    key={file.path}
                    file={file}
                    onToggleStage={() => onToggleStage(file.path)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
