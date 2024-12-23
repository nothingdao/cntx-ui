// src/components/BundlesList.tsx
import { Clock, FileText } from "lucide-react";

type Bundle = {
  name: string;
  timestamp: Date;
  fileCount: number;
}

interface BundlesListProps {
  bundles: Bundle[];
}

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function BundleRow({ bundle }: { bundle: Bundle }) {
  return (
    <div className="flex items-center space-x-2 py-2 px-3 hover:bg-gray-50 rounded cursor-pointer">
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">{bundle.name}</div>
        <div className="flex items-center text-xs text-gray-500 space-x-4">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{formatTimestamp(bundle.timestamp)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <FileText className="h-3 w-3" />
            <span>{bundle.fileCount} files</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BundlesList({ bundles }: BundlesListProps) {
  if (bundles.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No bundles created yet
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {bundles.map((bundle) => (
        <BundleRow key={bundle.name} bundle={bundle} />
      ))}
    </div>
  );
}
