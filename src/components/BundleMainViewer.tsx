// src/components/BundleMainViewer.tsx - Enhanced with bundle type display
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Copy,
  Download,
  FolderOpen,
  Clock,
  FileText,
  ArrowUpDown,
  RefreshCw,
  Tag,
  ChevronRight,
  ArrowLeft,
  Archive,
  Crown,
  Palette
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBundles } from '@/contexts/BundleContext';
import { useDirectory } from '@/contexts/DirectoryContext';
import { useTags } from '@/contexts/TagContext';
import { MasterBundleButton } from './MasterBundleButton';
import { TagBundleCreator } from './TagBundleCreator';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { BundleAnalysisBadge } from './BundleAnalysisBadge';
import { BundleView } from './BundleView';
import type { Bundle, BundleType } from '@/types/types';

export function BundleMainViewer() {
  const { bundles, masterBundle, loadBundles } = useBundles();
  const { directoryHandle } = useDirectory();
  const { tags: allTags } = useTags();
  const [sortField, setSortField] = useState<'name' | 'timestamp' | 'fileCount'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<BundleType | 'all'>('all');
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBundles();
  }, [loadBundles]);

  // Helper function to get bundle type display information
  const getBundleTypeDisplay = (bundle: Bundle) => {
    // Determine bundle type with fallbacks for existing bundles
    let bundleType: BundleType = bundle.type;

    // Fallback logic for existing bundles without explicit type
    if (!bundleType) {
      if (bundle.name.startsWith('master-')) {
        bundleType = 'master';
      } else if (bundle.derivedFromTag) {
        bundleType = 'tag-derived';
      } else {
        bundleType = 'custom';
      }
    }

    switch (bundleType) {
      case 'master':
        return {
          badge: (
            <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
              <Crown className="h-3 w-3 mr-1" />
              Master
            </Badge>
          ),
          icon: <Crown className="h-4 w-4 text-blue-600" />,
          description: "Complete project snapshot",
          bgColor: "bg-blue-50 dark:bg-blue-950/20",
          rowStyle: {}
        };
      case 'tag-derived': {
        const tagName = bundle.derivedFromTag || 'Tag Bundle';
        const tagConfig = allTags[tagName];
        const tagColor = tagConfig?.color || '#22c55e'; // Default to green if tag color not found

        // Convert hex to rgba for background
        const hexToRgba = (hex: string, alpha: number) => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        return {
          badge: (
            <Badge
              variant="outline"
              style={{
                borderColor: tagColor,
                backgroundColor: hexToRgba(tagColor, 0.1),
                color: tagColor
              }}
            >
              <Tag className="h-3 w-3 mr-1" />
              {tagName}
            </Badge>
          ),
          icon: <Tag className="h-4 w-4" style={{ color: tagColor }} />,
          description: bundle.description || `Files tagged with "${tagName}"`,
          bgColor: "", // We'll use inline styles for the row background
          rowStyle: { backgroundColor: hexToRgba(tagColor, 0.05) }
        };
      }
      case 'custom':
      default:
        return {
          badge: (
            <Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-800">
              <Palette className="h-3 w-3 mr-1" />
              Custom
            </Badge>
          ),
          icon: <Palette className="h-4 w-4 text-gray-600" />,
          description: "Manually selected files",
          bgColor: "bg-gray-50 dark:bg-gray-950/20"
        };
    }
  };

  // Combine regular bundles with master bundle for display
  const allBundles = [...bundles];
  if (masterBundle) {
    const masterExists = allBundles.some(b => b.name === masterBundle.name);
    if (!masterExists) {
      allBundles.unshift(masterBundle);
    }
  }

  // Filter bundles based on search input and type
  const filteredBundles = allBundles.filter(bundle => {
    const matchesSearch = bundle.name.toLowerCase().includes(filter.toLowerCase()) ||
      bundle.description?.toLowerCase().includes(filter.toLowerCase());

    // Determine bundle type with fallbacks for type filtering
    let bundleType: BundleType = bundle.type;
    if (!bundleType) {
      if (bundle.name.startsWith('master-')) {
        bundleType = 'master';
      } else if (bundle.derivedFromTag) {
        bundleType = 'tag-derived';
      } else {
        bundleType = 'custom';
      }
    }

    const matchesType = typeFilter === 'all' || bundleType === typeFilter;
    return matchesSearch && matchesType;
  });

  // Sort bundles
  const sortedBundles = [...filteredBundles].sort((a, b) => {
    if (sortField === 'timestamp') {
      return sortDirection === 'asc'
        ? a.timestamp.getTime() - b.timestamp.getTime()
        : b.timestamp.getTime() - a.timestamp.getTime();
    } else if (sortField === 'fileCount') {
      return sortDirection === 'asc'
        ? a.fileCount - b.fileCount
        : b.fileCount - a.fileCount;
    } else {
      return sortDirection === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
  });

  // Toggle sort direction or change sort field
  const handleSort = (field: 'name' | 'timestamp' | 'fileCount') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Handle bundle selection
  const handleBundleSelect = (bundleName: string) => {
    setSelectedBundle(bundleName);
    setError(null);
  };

  // Handle going back to bundle list
  const handleBackToBundles = () => {
    setSelectedBundle(null);
    setError(null);
  };

  // Refresh bundles list
  const handleRefresh = async () => {
    await loadBundles();
  };

  // Copy bundle content to clipboard
  const copyBundleContent = async (bundleName: string) => {
    if (!directoryHandle) return;

    try {
      const cntxDir = await directoryHandle.getDirectoryHandle('.cntx');
      const bundlesDir = await cntxDir.getDirectoryHandle('bundles');

      let bundleHandle;
      if (bundleName.startsWith('master-')) {
        const masterDir = await bundlesDir.getDirectoryHandle('master', { create: true });
        bundleHandle = await masterDir.getFileHandle(bundleName);
      } else {
        bundleHandle = await bundlesDir.getFileHandle(bundleName);
      }

      const file = await bundleHandle.getFile();
      const content = await file.text();
      await navigator.clipboard.writeText(content);
      console.log('Bundle content copied to clipboard');
    } catch (error) {
      console.error('Failed to copy bundle content:', error);
    }
  };

  // Download bundle as a file
  const downloadBundle = async (bundleName: string) => {
    if (!directoryHandle) return;

    try {
      const cntxDir = await directoryHandle.getDirectoryHandle('.cntx');
      const bundlesDir = await cntxDir.getDirectoryHandle('bundles');

      let bundleHandle;
      if (bundleName.startsWith('master-')) {
        const masterDir = await bundlesDir.getDirectoryHandle('master', { create: true });
        bundleHandle = await masterDir.getFileHandle(bundleName);
      } else {
        bundleHandle = await bundlesDir.getFileHandle(bundleName);
      }

      const file = await bundleHandle.getFile();
      const content = await file.text();

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = bundleName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download bundle:', error);
    }
  };

  // Format timestamp for display
  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Get bundle statistics with fallback type detection
  const bundleStats = {
    total: allBundles.length,
    master: allBundles.filter(b => b.type === 'master' || (!b.type && b.name.startsWith('master-'))).length,
    tagDerived: allBundles.filter(b => b.type === 'tag-derived' || (!b.type && b.derivedFromTag)).length,
    custom: allBundles.filter(b => b.type === 'custom' || (!b.type && !b.name.startsWith('master-') && !b.derivedFromTag)).length,
  };

  // Get the selected bundle object
  const selectedBundleObj = selectedBundle
    ? sortedBundles.find(b => b.name === selectedBundle)
    : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              {selectedBundle ? (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    onClick={handleBackToBundles}
                    className="flex items-center px-2"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Bundles
                  </Button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-base">{selectedBundle}</CardTitle>
                    <CardDescription className="text-sm">
                      {selectedBundleObj && getBundleTypeDisplay(selectedBundleObj).description}
                    </CardDescription>
                  </div>
                </div>
              ) : (
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Archive className="h-5 w-5" />
                    Bundle Manager
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      ({bundleStats.total} total)
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Manage your file bundles • {bundleStats.master} Master • {bundleStats.tagDerived} Tag-derived • {bundleStats.custom} Custom
                  </CardDescription>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefresh} title="Refresh bundles">
                <RefreshCw className="h-4 w-4" />
              </Button>
              {!selectedBundle && <TagBundleCreator />}
              <MasterBundleButton />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {selectedBundle && selectedBundleObj ? (
            <BundleView
              bundle={selectedBundleObj}
              onClose={handleBackToBundles}
            />
          ) : (
            <>
              {/* Filters */}
              <div className="flex gap-4 mb-4">
                <Input
                  placeholder="Filter bundles..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="max-w-sm"
                />
                <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as BundleType | 'all')}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types ({bundleStats.total})</SelectItem>
                    <SelectItem value="master">
                      <div className="flex items-center">
                        <Crown className="h-4 w-4 mr-2 text-blue-600" />
                        Master ({bundleStats.master})
                      </div>
                    </SelectItem>
                    <SelectItem value="tag-derived">
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                        Tag-derived ({bundleStats.tagDerived})
                      </div>
                    </SelectItem>
                    <SelectItem value="custom">
                      <div className="flex items-center">
                        <Palette className="h-4 w-4 mr-2 text-gray-600" />
                        Custom ({bundleStats.custom})
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('name')}
                          className="flex items-center"
                        >
                          Bundle Name
                          {sortField === 'name' && (
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('timestamp')}
                          className="flex items-center"
                        >
                          Created
                          {sortField === 'timestamp' && (
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('fileCount')}
                          className="flex items-center"
                        >
                          Files
                          {sortField === 'fileCount' && (
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedBundles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          {typeFilter === 'all' ? 'No bundles found' : `No ${typeFilter} bundles found`}
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedBundles.map((bundle) => {
                        const typeDisplay = getBundleTypeDisplay(bundle);
                        return (
                          <TableRow
                            key={bundle.name}
                            className={`cursor-pointer hover:bg-muted/50 ${typeDisplay.bgColor}`}
                            onClick={() => handleBundleSelect(bundle.name)}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {typeDisplay.icon}
                                <div>
                                  <div className="font-medium">{bundle.name}</div>
                                  {bundle.description && (
                                    <div className="text-xs text-muted-foreground">
                                      {bundle.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {typeDisplay.badge}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                <div className="text-sm">
                                  {formatTimestamp(bundle.timestamp)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>{bundle.fileCount}</span>
                                {/* {(bundle.tagCount || 0) > 0 && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {bundle.tagCount} tagged
                                  </Badge>
                                )} */}
                              </div>
                            </TableCell>
                            <TableCell>
                              <BundleAnalysisBadge bundle={bundle} />
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyBundleContent(bundle.name);
                                  }}
                                  title="Copy to clipboard"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadBundle(bundle.name);
                                  }}
                                  title="Download bundle"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
