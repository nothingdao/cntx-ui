import { useDirectory } from '@/contexts/DirectoryContext';
import { useFiles } from '@/contexts/FileContext';
import { useBundles } from '@/contexts/BundleContext';
import { useTags } from '@/contexts/TagContext';
import { useProjectConfig } from '@/contexts/ProjectConfigContext';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileIcon, FolderIcon, TagIcon, Settings, Archive, AlertCircle } from "lucide-react";
import { useEffect, useState } from 'react';

export function StateWatcher() {
  const directoryState = useDirectory();
  const fileState = useFiles();
  const bundleState = useBundles();
  const tagState = useTags();
  const projectConfigState = useProjectConfig();

  const { recentChanges } = useDirectory();

  // Add effect to monitor recentChanges timestamp
  const [lastChangeTime, setLastChangeTime] = useState<number>(Date.now());

  useEffect(() => {
    if (recentChanges.length > 0) {
      const latestChange = recentChanges[0];
      if (latestChange.timestamp.getTime() > lastChangeTime) {
        setLastChangeTime(latestChange.timestamp.getTime());
      }
    }
  }, [recentChanges, lastChangeTime]);

  // Derive key state metrics
  const metrics = {
    watchedFilesCount: fileState.watchedFiles.length,
    stagedFilesCount: fileState.stagedFiles.length,
    bundlesCount: bundleState.bundles.length,
    tagsCount: Object.keys(tagState.tags).length,
    isWatching: directoryState.isWatching,
    currentDirectory: directoryState.currentDirectory,
    hasActiveMasterBundle: Boolean(bundleState.masterBundle),
    isInitialized: projectConfigState.isProjectInitialized
  };

  // Define state sections with metadata
  const states = [
    {
      id: 'directory',
      title: "Directory State",
      icon: <FolderIcon className="h-4 w-4" />,
      description: "Tracks current directory and file system changes",
      content: directoryState,
      keyMetrics: [
        { label: 'Current Directory', value: metrics.currentDirectory || 'None' },
        { label: 'Watching', value: metrics.isWatching ? 'Yes' : 'No' },
        { label: 'Recent Changes', value: recentChanges.length }
      ]
    },
    {
      id: 'files',
      title: "File State",
      icon: <FileIcon className="h-4 w-4" />,
      description: "Manages file tracking and staging status",
      content: fileState,
      keyMetrics: [
        { label: 'Watched Files', value: metrics.watchedFilesCount },
        { label: 'Staged Files', value: metrics.stagedFilesCount }
      ]
    },
    {
      id: 'bundles',
      title: "Bundle State",
      icon: <Archive className="h-4 w-4" />,
      description: "Tracks bundle creation and master bundle status",
      content: bundleState,
      keyMetrics: [
        { label: 'Total Bundles', value: metrics.bundlesCount },
        { label: 'Master Bundle', value: metrics.hasActiveMasterBundle ? 'Active' : 'None' }
      ]
    },
    {
      id: 'tags',
      title: "Tag State",
      icon: <TagIcon className="h-4 w-4" />,
      description: "Manages file tagging system",
      content: tagState,
      keyMetrics: [
        { label: 'Active Tags', value: metrics.tagsCount }
      ]
    },
    {
      id: 'config',
      title: "Project Config State",
      icon: <Settings className="h-4 w-4" />,
      description: "Handles project configuration",
      content: projectConfigState,
      keyMetrics: [
        { label: 'Initialized', value: metrics.isInitialized ? 'Yes' : 'No' },
        { label: 'Ignore Patterns', value: projectConfigState.ignorePatterns.length }
      ]
    }
  ];

  // Render recent changes section
  const RecentChangesSection = () => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Changes</CardTitle>
      </CardHeader>
      <CardContent>
        {recentChanges.length === 0 ? (
          <div className="text-sm text-muted-foreground">No changes detected yet</div>
        ) : (
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {recentChanges.map((change, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <Badge
                    variant={change.kind === 'create' ? 'success' :
                      change.kind === 'modify' ? 'default' : 'destructive'}
                  >
                    {change.kind}
                  </Badge>
                  <span className="truncate">{change.name}</span>
                  <span className="text-muted-foreground">
                    {change.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );

  // Main state display section
  const StateSection = ({ state }) => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {state.icon}
          {state.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Key Metrics Display */}
          <div className="grid grid-cols-2 gap-2">
            {state.keyMetrics.map((metric, idx) => (
              <div key={idx} className="flex flex-col">
                <span className="text-xs text-muted-foreground">{metric.label}</span>
                <span className="text-sm font-medium">{metric.value}</span>
              </div>
            ))}
          </div>

          {/* Raw State Data */}
          <details>
            <summary className="text-sm cursor-pointer hover:text-primary">
              View Raw State Data
            </summary>
            <ScrollArea className="h-48 mt-2">
              <pre className="text-xs whitespace-pre-wrap break-words">
                {JSON.stringify(state.content, null, 2)}
              </pre>
            </ScrollArea>
          </details>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold mb-2">State Watcher</h2>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Monitoring application state changes in real-time. Use this component to verify state updates are propagating correctly.
          </AlertDescription>
        </Alert>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <RecentChangesSection />
          {states.slice(0, 3).map(state => (
            <StateSection key={state.id} state={state} />
          ))}
        </div>
        <div className="space-y-4">
          {states.slice(3).map(state => (
            <StateSection key={state.id} state={state} />
          ))}
        </div>
      </div>
    </div>
  );
}
