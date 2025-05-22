// src/components/Dashboard.tsx
import { useEffect } from 'react';
import { useDirectory } from '@/contexts/DirectoryContext';
import { useFiles } from '@/contexts/FileContext';
import { useBundles } from '@/contexts/BundleContext';
import { useTags } from '@/contexts/TagContext';
import { useProjectConfig } from '@/contexts/ProjectConfigContext';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MasterBundleButton } from './MasterBundleButton';

import {
  BarChart,
  FileText,
  FolderOpen,
  Tag,
  Clock,
  FileCheck,
  FileEdit,
  RefreshCw,
  Settings,
  AlertTriangle,
  Archive
} from "lucide-react";

export function Dashboard() {
  const { currentDirectory, isWatching, recentChanges } = useDirectory();
  const { watchedFiles, stagedFiles, refreshFiles } = useFiles();
  const { bundles, masterBundle, loadBundles } = useBundles();
  const { tags, getFilesWithTag } = useTags();
  const { isProjectInitialized } = useProjectConfig();

  // Calculate metrics for the dashboard
  const metrics = {
    totalFiles: watchedFiles.length,
    stagedFiles: stagedFiles.length,
    bundleCount: bundles.length,
    tagCount: Object.keys(tags).length,
    hasActiveMasterBundle: Boolean(masterBundle),
    changedFilesCount: watchedFiles.filter(file => file.isChanged).length,
    filesByExtension: watchedFiles.reduce((acc, file) => {
      const ext = file.path.split('.').pop()?.toLowerCase() || 'unknown';
      acc[ext] = (acc[ext] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    mostUsedTags: Object.entries(tags)
      .map(([name]) => ({
        name,
        count: getFilesWithTag(name).length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  };

  // Format timestamp for display
  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  useEffect(() => {
    if (isWatching) {
      refreshFiles();
      loadBundles();
    }
  }, [isWatching, refreshFiles, loadBundles]);

  // If project is not initialized, show setup guide
  if (!isProjectInitialized) {
    return (
      <div className="p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Setup Required</CardTitle>
            <CardDescription>
              Initialize your project to start tracking files and creating bundles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please select a directory and initialize it to use the full functionality.
              </AlertDescription>
            </Alert>
            <div className="flex justify-center">
              <Button onClick={() => window.location.reload()}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Select Directory
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no directory is being watched, show welcome screen
  if (!isWatching) {
    return (
      <div className="p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Cntx</CardTitle>
            <CardDescription>
              Select a directory to start tracking files and creating bundles
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-12">
            <Button size="lg" onClick={() => window.location.reload()}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Select Directory
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Project Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FolderOpen className="mr-2 h-4 w-4 text-muted-foreground" />
              Current Directory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate" title={currentDirectory || ''}>
              {currentDirectory || 'None'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.totalFiles} files being tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
              Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <div className="text-2xl font-bold">{metrics.totalFiles}</div>
              {metrics.stagedFiles > 0 && (
                <div className="ml-2 text-sm text-muted-foreground">
                  ({metrics.stagedFiles} staged)
                </div>
              )}
            </div>
            {metrics.changedFilesCount > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Changed Files</span>
                  <span>{metrics.changedFilesCount} of {metrics.totalFiles}</span>
                </div>
                <Progress
                  value={(metrics.changedFilesCount / metrics.totalFiles) * 100}
                  className="h-1"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Archive className="mr-2 h-4 w-4 text-muted-foreground" />
              Bundles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.bundleCount}</div>
            <div className="mt-2">
              <Badge variant={metrics.hasActiveMasterBundle ? "default" : "outline"}>
                {metrics.hasActiveMasterBundle ? "Master Bundle Active" : "No Master Bundle"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.tagCount}</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {metrics.mostUsedTags.slice(0, 3).map(tag => (
                <Badge key={tag.name} variant="secondary" className="text-xs">
                  {tag.name}: {tag.count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Recent Changes */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Recent Changes
              </span>
              <Button variant="ghost" size="sm" onClick={refreshFiles}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {recentChanges.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground">
                  No recent changes detected
                </div>
              ) : (
                <div className="space-y-2">
                  {recentChanges.slice(0, 20).map((change, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-muted last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        {change.kind === 'create' && <FileCheck className="h-4 w-4 text-green-500" />}
                        {change.kind === 'modify' && <FileEdit className="h-4 w-4 text-amber-500" />}
                        {change.kind === 'remove' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        <span className="text-sm truncate max-w-[160px]" title={change.name}>
                          {change.name.split('/').pop()}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(change.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Bundle Overview */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center">
                <Archive className="mr-2 h-5 w-5" />
                Bundle Overview
              </span>
              {/* <MasterBundleButton /> */}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {masterBundle ? (
              <div className="space-y-6">
                <div className="flex flex-col space-y-1.5">
                  <div className="text-sm font-medium">Master Bundle</div>
                  <div className="text-sm text-muted-foreground">
                    Last updated: {masterBundle.timestamp.toLocaleString()}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge>{masterBundle.fileCount} files</Badge>
                    {masterBundle.tagCount && (
                      <Badge variant="outline">{masterBundle.tagCount} tagged</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-sm">Recent Bundles</div>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {bundles.slice(0, 5).map(bundle => (
                        <Card key={bundle.name} className="p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium text-sm">{bundle.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {bundle.timestamp.toLocaleDateString()} • {bundle.fileCount} files
                              </div>
                            </div>
                            <Badge variant={bundle.name.startsWith('master-') ? "default" : "outline"}>
                              {bundle.name.startsWith('master-') ? "Master" : "Regular"}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="text-center space-y-2">
                  <AlertTriangle className="h-10 w-10 mx-auto text-amber-500" />
                  <h3 className="text-lg font-medium">No Master Bundle</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Create a master bundle to track file changes and establish a snapshot of your project.
                  </p>
                </div>
                <MasterBundleButton />
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Types & Tags Overview */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <BarChart className="mr-2 h-5 w-5" />
              Project Composition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* File Types */}
              <div>
                <h3 className="text-sm font-medium mb-3">File Types</h3>
                <div className="space-y-2">
                  {Object.entries(metrics.filesByExtension)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 7)
                    .map(([ext, count]) => (
                      <div key={ext} className="flex items-center">
                        <div className="w-24 text-sm">.{ext}</div>
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div
                              className="bg-primary/80 h-2 rounded-full"
                              style={{ width: `${(count / metrics.totalFiles) * 100}%` }}
                            />
                            <span className="ml-2 text-sm">{count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Tags Distribution */}
              <div>
                <h3 className="text-sm font-medium mb-3">Tag Usage</h3>
                {metrics.mostUsedTags.length > 0 ? (
                  <div className="space-y-2">
                    {metrics.mostUsedTags.map(tag => (
                      <div key={tag.name} className="flex items-center">
                        <div className="w-24 text-sm flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: tags[tag.name]?.color || '#888' }}
                          />
                          {tag.name}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${(tag.count / metrics.totalFiles) * 100}%`,
                                backgroundColor: tags[tag.name]?.color || '#888'
                              }}
                            />
                            <span className="ml-2 text-sm">{tag.count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Tag className="h-8 w-8 mx-auto mb-2" />
                    <p>No tags used yet</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-xs text-muted-foreground">
              Total: {metrics.totalFiles} files tracked
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" asChild>
                <a href="#" onClick={() => window.location.href = '#tags'}>
                  <Tag className="mr-2 h-4 w-4" />
                  Manage Tags
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="#" onClick={() => window.location.href = '#config'}>
                  <Settings className="mr-2 h-4 w-4" />
                  Project Config
                </a>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
