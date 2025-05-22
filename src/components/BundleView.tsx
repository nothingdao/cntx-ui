// src/components/BundleView.tsx
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDirectory } from '@/contexts/DirectoryContext';
import { useFiles } from '@/contexts/FileContext';
import { useTags } from '@/contexts/TagContext';
import { Bundle, BundleManifest } from '@/types/types';
import {
  analyzeBundleHealth,
  loadBundleManifest,
  getStalenessColor,
  getSortedTags
} from '@/utils/bundle-utils';
import {
  Copy,
  Download,
  FileText,
  Tag,
  AlertCircle,
  RefreshCw,
  ListFilter,
  ChevronDown,
  AlertTriangle,
  FileCheck,
  FileEdit,
  FolderOpen
} from "lucide-react";

interface BundleViewProps {
  bundle: Bundle;
  onClose?: () => void;
}

export function BundleView({ bundle, onClose }: BundleViewProps) {
  const { directoryHandle } = useDirectory();
  const { watchedFiles } = useFiles();
  const { tags: allTags } = useTags();

  const [content, setContent] = useState<string | null>(null);
  const [manifest, setManifest] = useState<BundleManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('content');
  const [showFilter, setShowFilter] = useState(false);
  const [filePathFilter, setFilePathFilter] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  // Staleness metrics
  const [staleFiles, setStaleFiles] = useState<string[]>([]);
  const [freshFiles, setFreshFiles] = useState<string[]>([]);
  const [missingFiles, setMissingFiles] = useState<string[]>([]);
  const [staleness, setStaleness] = useState(0);
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});

  // Load bundle content and analyze it
  useEffect(() => {
    async function loadBundle() {
      if (!directoryHandle || !bundle) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Load bundle content
        const cntxDir = await directoryHandle.getDirectoryHandle('.cntx');
        const bundlesDir = await cntxDir.getDirectoryHandle('bundles');

        // Determine if it's a master bundle
        let bundleHandle;
        if (bundle.name.startsWith('master-')) {
          const masterDir = await bundlesDir.getDirectoryHandle('master', { create: true });
          bundleHandle = await masterDir.getFileHandle(bundle.name);
        } else {
          bundleHandle = await bundlesDir.getFileHandle(bundle.name);
        }

        const file = await bundleHandle.getFile();
        const content = await file.text();
        setContent(content);

        // Load manifest
        const loadedManifest = await loadBundleManifest(cntxDir, bundle.name);
        setManifest(loadedManifest);

        // Analyze bundle health
        if (loadedManifest) {
          const analysis = await analyzeBundleHealth(bundle, loadedManifest, watchedFiles);
          setStaleFiles(analysis.staleFiles);
          setFreshFiles(analysis.freshFiles);
          setMissingFiles(analysis.missingFiles);
          setStaleness(analysis.staleness);
          setTagCounts(analysis.tags);
        }
      } catch (error) {
        console.error('Error loading bundle:', error);
        setError(`Failed to load bundle: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLoading(false);
      }
    }

    loadBundle();
  }, [bundle, directoryHandle, watchedFiles]);

  // Extract all files from the content
  const extractFiles = () => {
    if (!content) return [];

    // Handle both old format (without tags) and new format (with tags)
    const newFormatRegex = /<document>\s*<source>(.*?)<\/source>\s*<tags>(.*?)<\/tags>/g;
    const oldFormatRegex = /<document>\s*<source>(.*?)<\/source>/g;

    // Try new format first
    const newMatches = Array.from(content.matchAll(newFormatRegex));
    if (newMatches.length > 0) {
      return newMatches.map(match => ({
        path: match[1],
        tags: match[2] ? match[2].split(',').filter(t => t.trim()) : []
      }));
    }

    // Fall back to old format
    const oldMatches = Array.from(content.matchAll(oldFormatRegex));
    return oldMatches.map(match => ({
      path: match[1],
      tags: []
    }));
  };

  const allFiles = extractFiles();

  // Update the filteredFiles function
  const filteredFiles = allFiles.filter(file => {
    const pathMatches = file.path.toLowerCase().includes(filePathFilter.toLowerCase());
    const tagMatches = !tagFilter || file.tags.includes(tagFilter);
    return pathMatches && tagMatches;
  });

  // Copy content to clipboard
  const copyContent = async () => {
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      console.log('Bundle content copied to clipboard');
    } catch (error) {
      console.error('Failed to copy content:', error);
    }
  };

  // Download bundle as a file
  const downloadBundle = () => {
    if (!content || !bundle) return;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = bundle.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get a readable creation date
  const creationDate = bundle.timestamp.toLocaleString();

  // Get the staleness color and label
  const stalenessColor = getStalenessColor(staleness);
  const stalenessLabel =
    staleness === 0 ? 'Fresh' :
      staleness < 25 ? 'Mostly Fresh' :
        staleness < 50 ? 'Somewhat Stale' :
          staleness < 75 ? 'Stale' :
            'Very Stale';

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading bundle...</span>
          </div>
        </CardContent>
      </Card>
    );
  }


  // Add these functions before the return statement in BundleView component:

  // Extract ASCII tree from bundle content
  const extractASCIITree = () => {
    if (!content) return null;

    const asciiMatch = content.match(/<asciiTree>([\s\S]*?)<\/asciiTree>/);
    return asciiMatch ? asciiMatch[1].trim() : null;
  };

  // Extract metadata from bundle content
  const extractMetadata = () => {
    if (!content) return null;

    const metadataMatch = content.match(/<metadata>([\s\S]*?)<\/metadata>/);
    if (!metadataMatch) return null;

    const metadataContent = metadataMatch[1];

    // Extract individual fields
    const projectNameMatch = metadataContent.match(/<projectName>(.*?)<\/projectName>/);
    const totalFilesMatch = metadataContent.match(/<totalFiles>(.*?)<\/totalFiles>/);
    const bundleTypeMatch = metadataContent.match(/<bundleType>(.*?)<\/bundleType>/);

    // Extract ignore patterns
    const ignorePatternsMatch = metadataContent.match(/<ignorePatterns>([\s\S]*?)<\/ignorePatterns>/);
    const ignorePatterns: string[] = [];

    if (ignorePatternsMatch) {
      const patternMatches = ignorePatternsMatch[1].matchAll(/<pattern>(.*?)<\/pattern>/g);
      for (const match of patternMatches) {
        ignorePatterns.push(match[1]);
      }
    }

    return {
      projectName: projectNameMatch?.[1] || 'Unknown',
      totalFiles: parseInt(totalFilesMatch?.[1] || '0'),
      bundleType: bundleTypeMatch?.[1] || 'unknown',
      ignorePatterns
    };
  };

  const asciiTree = extractASCIITree();
  const bundleMetadata = extractMetadata();

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-red-500">
            <AlertCircle className="mr-2 h-5 w-5" />
            Error Loading Bundle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
        <CardFooter>
          <Button onClick={onClose}>Close</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{bundle.name}</CardTitle>
            <CardDescription>
              Created on {creationDate} • {bundle.fileCount} files
              {manifest && ` • ${100 - staleness}% fresh`}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            {manifest && (
              <Badge
                className={`bg-${stalenessColor}-500 hover:bg-${stalenessColor}-600`}
                style={{ backgroundColor: stalenessColor }}
              >
                {stalenessLabel}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="content" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Files
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-1">
              <FileEdit className="h-4 w-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="tags" className="flex items-center gap-1">
              <Tag className="h-4 w-4" />
              Tags
            </TabsTrigger>
            <TabsTrigger value="tree" className="flex items-center gap-1">
              <FolderOpen className="h-4 w-4" />
              Tree
            </TabsTrigger>
          </TabsList>

          {/* Files Tab */}
          <TabsContent value="content">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilter(!showFilter)}
                    className="mr-2"
                  >
                    <ListFilter className="h-4 w-4 mr-1" />
                    Filter
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>

                  {showFilter && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={filePathFilter}
                        onChange={(e) => setFilePathFilter(e.target.value)}
                        placeholder="Filter by path..."
                        className="ml-2 px-2 py-1 text-sm border rounded"
                      />

                      <Select
                        value={tagFilter || "all"}
                        onValueChange={(value) => setTagFilter(value === "all" ? null : value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by tag" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All tags</SelectItem>
                          {Object.keys(allTags).map(tag => (
                            <SelectItem key={tag} value={tag}>
                              <div className="flex items-center">
                                <div
                                  className="w-2 h-2 rounded-full mr-2"
                                  style={{ backgroundColor: allTags[tag]?.color || '#888' }}
                                />
                                {tag}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyContent}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadBundle}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[400px] w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-4/5">Path</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFiles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          No files found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFiles.map((fileInfo) => {
                        let status = 'Unknown';
                        let icon = null;

                        if (staleFiles.includes(fileInfo.path)) {
                          status = 'Stale';
                          icon = <FileEdit className="h-4 w-4 text-amber-500" />;
                        } else if (freshFiles.includes(fileInfo.path)) {
                          status = 'Fresh';
                          icon = <FileCheck className="h-4 w-4 text-green-500" />;
                        } else if (missingFiles.includes(fileInfo.path)) {
                          status = 'Missing';
                          icon = <AlertTriangle className="h-4 w-4 text-red-500" />;
                        }

                        // Get tags from the extracted file info
                        const fileTags = fileInfo.tags || [];

                        return (
                          <TableRow key={fileInfo.path}>
                            <TableCell className="font-mono text-xs">
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span className="truncate">{fileInfo.path}</span>
                              </div>
                              {fileTags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1 ml-6">
                                  {fileTags.map(tag => (
                                    <Badge
                                      key={tag}
                                      variant="outline"
                                      className="text-xs"
                                      style={{
                                        borderColor: allTags[tag]?.color || '#888',
                                        backgroundColor: `${allTags[tag]?.color}11` || 'transparent'
                                      }}
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                {icon}
                                <span className="ml-1">{status}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis">
            <div className="space-y-6">
              {manifest ? (
                <>
                  {/* Staleness indicator */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Bundle Freshness</span>
                      <span>{100 - staleness}%</span>
                    </div>
                    <Progress
                      value={100 - staleness}
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {freshFiles.length} fresh, {staleFiles.length} stale
                        {missingFiles.length > 0 && `, ${missingFiles.length} missing`}
                      </span>
                      <span>
                        Created {bundle.timestamp.toLocaleDateString()},
                        {bundle.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* File statistics */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm flex items-center">
                          <FileCheck className="h-4 w-4 mr-2 text-green-500" />
                          Fresh Files
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="text-2xl font-bold">{freshFiles.length}</div>
                        <div className="text-xs text-muted-foreground">
                          {freshFiles.length > 0 && (
                            `${Math.round((freshFiles.length / (freshFiles.length + staleFiles.length)) * 100)}% of tracked files`
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm flex items-center">
                          <FileEdit className="h-4 w-4 mr-2 text-amber-500" />
                          Stale Files
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="text-2xl font-bold">{staleFiles.length}</div>
                        <div className="text-xs text-muted-foreground">
                          {staleFiles.length > 0 && (
                            `${Math.round((staleFiles.length / (freshFiles.length + staleFiles.length)) * 100)}% of tracked files`
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                          Missing Files
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="text-2xl font-bold">{missingFiles.length}</div>
                        <div className="text-xs text-muted-foreground">
                          {missingFiles.length > 0 && (
                            `${Math.round((missingFiles.length / bundle.fileCount) * 100)}% of bundle files`
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* File Extension Stats */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">File Types</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {manifest && Object.entries(
                        manifest.files.reduce((acc, file) => {
                          const ext = file.path.split('.').pop()?.toLowerCase() || 'unknown';
                          acc[ext] = (acc[ext] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      )
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 8)
                        .map(([ext, count]) => (
                          <Badge
                            key={ext}
                            variant="secondary"
                            className="flex items-center justify-between px-3 py-1.5"
                          >
                            <span>.{ext}</span>
                            <span className="ml-2 bg-muted rounded-full px-2 py-0.5 text-xs">
                              {count}
                            </span>
                          </Badge>
                        ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No manifest found for this bundle. Analysis is not available.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tags Tab */}
          <TabsContent value="tags">
            <div className="space-y-4">
              {Object.keys(tagCounts).length > 0 ? (
                <>
                  <h3 className="text-sm font-medium">Tags in Bundle</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getSortedTags(tagCounts).map(([tagName, count]) => (
                      <Card key={tagName}>
                        <CardHeader className="py-3">
                          <CardTitle className="text-sm flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: allTags[tagName]?.color || '#888' }}
                            />
                            {tagName}
                          </CardTitle>
                          <CardDescription>
                            {allTags[tagName]?.description || 'No description'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="py-2">
                          <div className="flex justify-between items-center">
                            <div className="text-2xl font-bold">{count}</div>
                            <div className="text-sm">
                              {Math.round((count / bundle.fileCount) * 100)}% of bundle
                            </div>
                          </div>

                          <div className="mt-2">
                            <Progress
                              value={(count / bundle.fileCount) * 100}
                              className="h-1"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Tag className="h-8 w-8 mx-auto mb-2" />
                  <p>No tags found in this bundle.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Directory Tree Tab */}
          <TabsContent value="tree">
            <div className="space-y-4">
              {bundleMetadata && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Bundle Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Project:</span> {bundleMetadata.projectName}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span> {bundleMetadata.bundleType}
                      </div>
                      <div>
                        <span className="font-medium">Total Files:</span> {bundleMetadata.totalFiles}
                      </div>
                      <div>
                        <span className="font-medium">Ignore Patterns:</span> {bundleMetadata.ignorePatterns.length}
                      </div>
                    </div>
                    {bundleMetadata.ignorePatterns.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs font-medium mb-1">Excluded Patterns:</div>
                        <div className="flex flex-wrap gap-1">
                          {bundleMetadata.ignorePatterns.map((pattern, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {pattern}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Directory Structure</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  {asciiTree ? (
                    <ScrollArea className="h-[500px] w-full">
                      <pre className="text-xs font-mono whitespace-pre leading-relaxed">
                        {asciiTree}
                      </pre>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FolderOpen className="h-8 w-8 mx-auto mb-2" />
                      <p>No directory tree found in this bundle.</p>
                      <p className="text-xs mt-1">This bundle was created with an older format.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          {bundle.fileCount} files • {content?.length.toLocaleString() || 0} bytes
        </div>
      </CardFooter>
    </Card>
  );
}
