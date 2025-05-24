// src/components/DirectoryTree.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileIcon, SquareDot } from 'lucide-react';
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import type { WatchedFile } from '@/types/types';
import { getAllDirectories } from '../utils/file-utils';
import { useDirectory } from '@/contexts/DirectoryContext';
import { useBundles } from '@/contexts/BundleContext';
import { BundleManifest } from '@/types/types';
import { FileTagsDisplay } from './FileTagsDisplay';
import { useProjectConfig } from '@/contexts/ProjectConfigContext';

import { ScrollArea } from "@/components/ui/scroll-area";
// import { useTags } from '@/contexts/TagContext';
type DirectoryTreeProps = {
  files: WatchedFile[];
  onToggleStage: (paths: string[]) => void;
};

// Build a flat index of files in display order
function buildFileIndex(
  files: WatchedFile[],
  expandedDirs: Set<string>
): WatchedFile[] {
  const result: WatchedFile[] = [];
  const directories = getAllDirectories(files.map(f => f.path))
    .filter(dir => dir !== 'Root');

  function processDirectory(currentDir: string = 'Root') {
    // Add files in current directory
    const dirFiles = files
      .filter(f => f.directory === currentDir)
      .sort((a, b) => a.name.localeCompare(b.name));

    result.push(...dirFiles);

    // Process subdirectories if expanded
    const childDirs = directories
      .filter(dir => {
        const parts = dir.split('/');
        const parentParts = currentDir === 'Root' ? [] : currentDir.split('/');
        return parts.length === parentParts.length + 1 &&
          dir.startsWith(currentDir === 'Root' ? '' : currentDir + '/');
      })
      .sort((a, b) => a.localeCompare(b));

    childDirs.forEach(dir => {
      if (expandedDirs.has(dir)) {
        processDirectory(dir);
      }
    });
  }

  processDirectory();
  return result;
}

function FileRow({
  file,
  onCheckboxClick,
  depth = 0,
  isSelected,
}: {
  file: WatchedFile;
  onCheckboxClick: (event: React.MouseEvent) => void;
  depth?: number;
  isSelected?: boolean;
}) {
  // const { tags } = useTags(); // Add this import at the top: import { useTags } from '@/contexts/TagContext';

  return (
    <div className="space-y-1">
      <div
        className={`flex items-center space-x-2 py-1 px-2 hover:bg-muted/50 rounded-md ${isSelected ? 'bg-muted/50' : ''
          }`}
        style={{ paddingLeft: `${(depth + 1) * 12}px` }}
      >
        <Checkbox
          checked={file.isStaged}
          onCheckedChange={() => { }}
          onClick={onCheckboxClick}
          className="cursor-pointer"
        />
        <FileIcon className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 truncate text-sm">
          {file.name}
        </span>

        {/* Enhanced tag display with colors */}
        {/* {file.tags && file.tags.length > 0 && (
          <div className="flex items-center gap-1">
            {file.tags.slice(0, 3).map(tagName => (
              <div
                key={tagName}
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: tags[tagName]?.color || '#94a3b8',
                }}
                title={`Tag: ${tagName}`}
              />
            ))}
            {file.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{file.tags.length - 3}
              </span>
            )}
          </div>
        )} */}

        {file.isChanged && (
          <SquareDot
            className="text-red-400"
            size={16}
            strokeWidth={1.5}
          />
        )}

        <FileTagsDisplay filePath={file.path} />
      </div>
    </div>
  );
}

export function DirectoryTree({ files, onToggleStage }: DirectoryTreeProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['Root']));
  const [lastSelectedPath, setLastSelectedPath] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [manifest, setManifest] = useState<BundleManifest | null>(null);
  const [rangeSelectionState, setRangeSelectionState] = useState<boolean | null>(null);

  const { directoryHandle } = useDirectory();
  const { masterBundle } = useBundles();
  const { isProjectInitialized } = useProjectConfig();

  // Load manifest when masterBundle changes
  useEffect(() => {
    const loadManifest = async () => {
      if (!directoryHandle || !masterBundle || !isProjectInitialized) return;

      try {
        const bundlesDir = await directoryHandle.getDirectoryHandle('.cntx')
          .then(dir => dir.getDirectoryHandle('bundles'))
          .then(dir => dir.getDirectoryHandle('master'));

        for await (const entry of bundlesDir.values()) {
          if (entry.kind === 'file' &&
            entry.name === `${masterBundle.name}-manifest.json`) {
            const manifestFile = await entry.getFile();
            const manifestContent = await manifestFile.text();
            setManifest(JSON.parse(manifestContent));
            break;
          }
        }
      } catch (error) {
        console.error('Error loading master bundle manifest:', error);
        setManifest(null);
      }
    };

    loadManifest();
  }, [directoryHandle, masterBundle, isProjectInitialized]);

  // Get all directories once for the component
  const directories = useMemo(() =>
    getAllDirectories(files.map(f => f.path))
      .filter(dir => dir !== 'Root')
    , [files]);

  // Build and memoize the flat file index based on current expanded state
  const flatFileIndex = useMemo(() =>
    buildFileIndex(files, expandedDirs),
    [files, expandedDirs]
  );

  const toggleDirectory = useCallback((dir: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(dir)) {
        next.delete(dir);
      } else {
        next.add(dir);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allDirs = getAllDirectories(files.map(f => f.path));
    setExpandedDirs(new Set(allDirs));
  }, [files]);

  const collapseAll = useCallback(() => {
    setExpandedDirs(new Set(['Root']));
  }, []);

  const handleCheckboxClick = useCallback((path: string, event: React.MouseEvent) => {
    event.stopPropagation();

    const currentFile = files.find(f => f.path === path);
    if (!currentFile) return;

    if (event.shiftKey && lastSelectedPath) {
      const currentIndex = flatFileIndex.findIndex(f => f.path === path);
      const lastIndex = flatFileIndex.findIndex(f => f.path === lastSelectedPath);

      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);

        // Get paths in range based on flat index
        const pathsToToggle = flatFileIndex
          .slice(start, end + 1)
          .map(f => f.path);

        setSelectedItems(new Set(pathsToToggle));

        // Use the stored range selection state
        if (rangeSelectionState !== null) {
          const filesToToggle = pathsToToggle.filter(p => {
            const f = files.find(file => file.path === p);
            return f && f.isStaged !== rangeSelectionState;
          });
          if (filesToToggle.length > 0) {
            onToggleStage(filesToToggle);
          }
        }
      }
    } else {
      // Single selection - store the target state for future range selections
      setRangeSelectionState(!currentFile.isStaged);
      setSelectedItems(new Set([path]));
      onToggleStage([path]);
    }

    setLastSelectedPath(path);
  }, [lastSelectedPath, onToggleStage, flatFileIndex, files, rangeSelectionState]);

  const renderTreeItems = useCallback((parentDir: string = 'Root', depth: number = 0): JSX.Element[] => {
    const allItems: JSX.Element[] = [];

    // Add files for current directory
    const dirFiles = files
      .filter(f => f.directory === parentDir)
      .sort((a, b) => a.name.localeCompare(b.name));

    dirFiles.forEach((file) => {
      allItems.push(
        <FileRow
          key={file.path}
          file={file}
          onCheckboxClick={(event) => handleCheckboxClick(file.path, event)}
          depth={depth}
          isSelected={selectedItems.has(file.path)}
          manifest={manifest}
        />
      );
    });

    // Get immediate child directories only
    const childDirs = directories
      .filter(dir => {
        if (parentDir === 'Root') {
          return !dir.includes('/'); // Top-level dirs have no slashes
        }
        const parentParts = parentDir.split('/');
        const dirParts = dir.split('/');
        return dirParts.length === parentParts.length + 1 &&
          dir.startsWith(parentDir + '/');
      })
      .sort((a, b) => a.localeCompare(b));

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

    return allItems;
  }, [files, expandedDirs, handleCheckboxClick, selectedItems, toggleDirectory, manifest, directories]);

  return (
    <div className="flex flex-col space-y-2 h-full">
      {isProjectInitialized ? (
        <>
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              className="px-2 py-1 h-8"
              onClick={expandAll}
            >
              Expand All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="px-2 py-1 h-8"
              onClick={collapseAll}
            >
              Collapse All
            </Button>
          </div>
          <div className="h-screen">
            <ScrollArea className="h-3/5 w-full">
              {renderTreeItems()}
            </ScrollArea>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Project not initialized. Please initialize project first.
        </div>
      )}
    </div>

  );
}
