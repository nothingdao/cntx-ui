// src/components/BundleDetailsView.tsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useTags } from '@/contexts/TagContext';
import { useFiles } from '@/contexts/FileContext';
import { useDirectory } from '@/contexts/DirectoryContext';
import { Bundle, BundleManifest } from '@/types/types';
import {
  analyzeBundleHealth,
  BundleAnalysis,
  getStalenessColor,
  getSortedTags,
  loadBundleManifest
} from '@/utils/bundle-utils';
import { CircleAlert, Clock, FileCheck, FileEdit, Tag, Trash } from 'lucide-react';

interface BundleDetailsViewProps {
  bundle: Bundle;
  bundleContent: string | null;
}

export function BundleDetailsView({ bundle, bundleContent }: BundleDetailsViewProps) {
  const { watchedFiles } = useFiles();
  const { directoryHandle } = useDirectory();
  const { tags: allTags } = useTags();

  const [manifest, setManifest] = useState<BundleManifest | null>(null);
  const [analysis, setAnalysis] = useState<BundleAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  // Load manifest and analyze bundle when bundle changes
  useEffect(() => {
    async function loadAndAnalyze() {
      if (!directoryHandle || !bundle) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Load manifest for bundle
        const loadedManifest = await loadBundleManifest(directoryHandle, bundle.name);
        setManifest(loadedManifest);

        // Analyze bundle health
        if (loadedManifest) {
          const analyzed = await analyzeBundleHealth(bundle, loadedManifest, watchedFiles);
          setAnalysis(analyzed);
        }
      } catch (error) {
        console.error('Error analyzing bundle:', error);
      } finally {
        setLoading(false);
      }
    }

    loadAndAnalyze();
  }, [bundle, directoryHandle, watchedFiles]);

  // Count file occurrences by extension
  const getFileExtensionStats = () => {
    if (!manifest) return {};

    const extensions: Record<string, number> = {};
    manifest.files.forEach(file => {
      const ext = file.path.split('.').pop()?.toLowerCase() || 'unknown';
      extensions[ext] = (extensions[ext] || 0) + 1;
    });

    return extensions;
  };

  const fileExtensions = getFileExtensionStats();

  // If still loading or no analysis available
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Clock className="h-6 w-6 animate-spin mr-2" />
            <span>Analyzing bundle...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no manifest found
  if (!manifest || !analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bundle Details</CardTitle>
          <CardDescription>
            No manifest found for this bundle. Some analysis features are not available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Bundle Information</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-muted-foreground">Created</span>
                  <div className="text-sm">{bundle.timestamp.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Files</span>
                  <div className="text-sm">{bundle.fileCount}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Staleness color and label
  const stalenessColor = getStalenessColor(analysis.staleness);
  const stalenessLabel =
    analysis.staleness === 0 ? 'Fresh' :
      analysis.staleness < 25 ? 'Mostly Fresh' :
        analysis.staleness < 50 ? 'Somewhat Stale' :
          analysis.staleness < 75 ? 'Stale' :
            'Very Stale';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div>Bundle Analysis</div>
          <Badge
            className={`bg-${stalenessColor}-500 hover:bg-${stalenessColor}-600`}
            style={{ backgroundColor: stalenessColor }}
          >
            {stalenessLabel}
          </Badge>
        </CardTitle>
        <CardDescription>
          Analysis of bundle contents, staleness, and tags
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Staleness indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Bundle Freshness</span>
              <span>{100 - analysis.staleness}%</span>
            </div>
            <Progress
              value={100 - analysis.staleness}
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {analysis.freshFiles.length} fresh, {analysis.staleFiles.length} stale
                {analysis.missingFiles.length > 0 && `, ${analysis.missingFiles.length} missing`}
              </span>
              <span>
                Created {bundle.timestamp.toLocaleDateString()},
                {bundle.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Bundle contents tabs */}
          <Tabs defaultValue="tags">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="tags" className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                <span>Tags</span>
              </TabsTrigger>
              <TabsTrigger value="stale" className="flex items-center gap-1">
                <FileEdit className="h-4 w-4" />
                <span>Stale</span>
              </TabsTrigger>
              <TabsTrigger value="fresh" className="flex items-center gap-1">
                <FileCheck className="h-4 w-4" />
                <span>Fresh</span>
              </TabsTrigger>
              <TabsTrigger value="missing" className="flex items-center gap-1">
                <Trash className="h-4 w-4" />
                <span>Missing</span>
              </TabsTrigger>
            </TabsList>

            {/* Tags tab */}
            <TabsContent value="tags" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Tags in Bundle</h3>
                  {Object.keys(analysis.tags).length === 0 ? (
                    <div className="text-sm text-muted-foreground">No tags found</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {getSortedTags(analysis.tags).map(([tagName, count]) => (
                        <Badge
                          key={tagName}
                          variant="outline"
                          className="flex items-center gap-1"
                          style={{
                            borderColor: allTags[tagName]?.color || '#888',
                            backgroundColor: `${allTags[tagName]?.color}22` || 'transparent'
                          }}
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: allTags[tagName]?.color || '#888' }}
                          />
                          {tagName} ({count})
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">File Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(fileExtensions)
                      .sort((a, b) => b[1] - a[1])
                      .map(([ext, count]) => (
                        <Badge
                          key={ext}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          .{ext} ({count})
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Stale files tab */}
            <TabsContent value="stale">
              <h3 className="text-sm font-medium mb-2">
                Stale Files ({analysis.staleFiles.length})
              </h3>
              <ScrollArea className="h-[200px] w-full rounded-md border">
                {analysis.staleFiles.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">No stale files found</div>
                ) : (
                  <div className="p-4">
                    {analysis.staleFiles.map(path => (
                      <div key={path} className="flex items-center py-1 text-sm">
                        <FileEdit className="h-4 w-4 mr-2 text-amber-500" />
                        <span className="truncate">{path}</span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Fresh files tab */}
            <TabsContent value="fresh">
              <h3 className="text-sm font-medium mb-2">
                Fresh Files ({analysis.freshFiles.length})
              </h3>
              <ScrollArea className="h-[200px] w-full rounded-md border">
                {analysis.freshFiles.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">No fresh files found</div>
                ) : (
                  <div className="p-4">
                    {analysis.freshFiles.map(path => (
                      <div key={path} className="flex items-center py-1 text-sm">
                        <FileCheck className="h-4 w-4 mr-2 text-green-500" />
                        <span className="truncate">{path}</span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Missing files tab */}
            <TabsContent value="missing">
              <h3 className="text-sm font-medium mb-2">
                Missing Files ({analysis.missingFiles.length})
              </h3>
              <ScrollArea className="h-[200px] w-full rounded-md border">
                {analysis.missingFiles.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">No missing files found</div>
                ) : (
                  <div className="p-4">
                    {analysis.missingFiles.map(path => (
                      <div key={path} className="flex items-center py-1 text-sm">
                        <CircleAlert className="h-4 w-4 mr-2 text-red-500" />
                        <span className="truncate">{path}</span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
