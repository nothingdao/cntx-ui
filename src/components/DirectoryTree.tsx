// src/components/DirectoryTree.tsx
import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileIcon } from 'lucide-react';
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import type { WatchedFile } from '../contexts/FileWatcherContext';
import { getAllDirectories } from '../utils/file-utils';

type DirectoryTreeProps = {
  files: WatchedFile[];
  onToggleStage: (path: string) => void;
};

function getDirectoryFiles(dir: string, files: WatchedFile[]): WatchedFile[] {
  if (dir === 'Root') {
    return files.filter(f => !f.directory || f.directory === 'Root');
  }
  return files.filter(f => f.directory === dir);
}

function getDirectoryLabel(dir: string): string {
  if (dir === 'Root') return 'Root';
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
        <span className="text-xs bg-yellow-100 text-yellow-800 rounded-full px-2 py-0.5">
          Modified
        </span>
      )}
    </div>
  );
}

export function DirectoryTree({ files, onToggleStage }: DirectoryTreeProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['Root']));

  // Get all unique directories including parent directories
  const directories = getAllDirectories(files.map(f => f.path));

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
      {directories.map(dir => {
        const isExpanded = expandedDirs.has(dir);
        const dirFiles = getDirectoryFiles(dir, files);
        const displayName = getDirectoryLabel(dir);

        // Don't show empty directories
        if (dirFiles.length === 0) return null;

        const indent = dir === 'Root' ? 0 : dir.split('/').length;

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
