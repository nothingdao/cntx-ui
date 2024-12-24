// src/components/FileRow.tsx
import { File, Clock, AlertCircle, History } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import type { WatchedFile } from '../contexts/DirectoryWatcherContext';

type FileRowProps = {
  file: WatchedFile;
  onToggleStage: () => void;
};

export function FileRow({ file, onToggleStage }: FileRowProps) {
  const hasChangedSinceLastBundle = file.lastBundled && file.lastModified > file.lastBundled;

  return (
    <div className={`p-2 rounded-md ${file.isChanged ? 'bg-yellow-50' : 'bg-white'} flex items-center space-x-3  transition-colors`}>
      <Checkbox
        checked={file.isStaged}
        onCheckedChange={onToggleStage}
        className="ml-1"
      />
      <File className="h-4 w-4 text-gray-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{file.name}</div>
        <div className="flex items-center text-sm text-gray-500 space-x-2">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{file.lastModified.toLocaleTimeString()}</span>
          </div>
          {file.lastBundled && (
            <div className="flex items-center space-x-1">
              <History className="h-3 w-3" />
              <span>{file.lastBundled.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {hasChangedSinceLastBundle && (
          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full flex items-center space-x-1">
            <History className="h-3 w-3" />
            <span>Changed since bundle</span>
          </span>
        )}
        {file.isChanged && (
          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full flex items-center space-x-1">
            <AlertCircle className="h-3 w-3" />
            <span>M</span>
          </span>
        )}
      </div>
    </div>
  );
}
