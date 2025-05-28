// src/components/BundleMainViewer.tsx - Fixed bundle counting and update actions
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Copy,
  Download,
  Clock,
  FileText,
  ArrowUpDown,
  RefreshCw,
  Tag,
  ArrowLeft,
  Archive,
  Crown,
  Palette,
  MoreVertical,
  RotateCcw,
  Plus
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBundles } from '@/contexts/BundleContext';
import { useDirectory } from '@/contexts/DirectoryContext';
import { useTags } from '@/contexts/TagContext';
import { useFiles } from '@/contexts/FileContext';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { BundleAnalysisBadge } from './BundleAnalysisBadge';
import { BundleView } from './BundleView';
import type { Bundle, BundleType } from '@/types/types';

export function BundleMainViewer() {
  const { bundles, masterBundle, loadBundles, createMasterBundle, createTagBundle } = useBundles();
  const { directoryHandle } = useDirectory();
  const { tags: allTags } = useTags();
  const { stagedFiles } = useFiles();
  const [sortField, setSortField] = useState<'name' | 'timestamp' | 'fileCount'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<BundleType | 'all'>('all');
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatingBundles, setUpdatingBundles] = useState<Set<string>>(new Set());

  // FIXED: Better bundle type detection function
  const getBundleType = (bundle: Bundle): BundleType => {
    // Add validation to prevent invalid bundle objects
    if (!bundle || typeof bundle !== 'object') {
      console.error('Invalid bundle object:', bundle);
      return 'custom';
    }

    // First check the explicit type property
    if (bundle.type && ['master', 'tag-derived', 'custom'].includes(bundle.type)) {
      return bundle.type;
    }

    // Fallback logic for older bundles without explicit type
    if (bundle.name && bundle.name.startsWith('master-')) {
      return 'master';
    }

    if (bundle.derivedFromTag && typeof bundle.derivedFromTag === 'string') {
      return 'tag-derived';
    }

    // Default to custom for anything else
    return 'custom';
  };

  // Bundle update handlers
  // 1. Fix Master Bundle Update - Replace instead of create new
  const handleUpdateMasterBundle = async () => {
    setUpdatingBundles(prev => new Set(prev).add('master'));
    try {
      // Delete existing master bundle first
      if (masterBundle) {
        await deleteBundleFiles(masterBundle, 'master');
      }

      await createMasterBundle();
      await loadBundles();
      console.log('✅ Master bundle updated successfully');
    } catch (error) {
      console.error('❌ Error updating master bundle:', error);
      setError(`Failed to update master bundle: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUpdatingBundles(prev => {
        const newSet = new Set(prev);
        newSet.delete('master');
        return newSet;
      });
    }
  };

  // 2. Fix Tag Bundle Update - Replace instead of create new
  const handleUpdateTagBundle = async (bundle: Bundle) => {
    if (!bundle.derivedFromTag) return;

    setUpdatingBundles(prev => new Set(prev).add(bundle.name));
    try {
      // Delete existing tag bundle first
      await deleteBundleFiles(bundle, 'tag-derived');

      // Create new bundle with same tag
      await createTagBundle(bundle.derivedFromTag);
      await loadBundles();
      console.log(`✅ Tag bundle "${bundle.derivedFromTag}" updated successfully`);
    } catch (error) {
      console.error('❌ Error updating tag bundle:', error);
      setError(`Failed to update tag bundle: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUpdatingBundles(prev => {
        const newSet = new Set(prev);
        newSet.delete(bundle.name);
        return newSet;
      });
    }
  };

  // 3. Add helper function to delete bundle files
  const deleteBundleFiles = async (bundle: Bundle, bundleType: BundleType) => {
    if (!directoryHandle) return;

    try {
      const cntxDir = await directoryHandle.getDirectoryHandle('.cntx');
      const bundlesDir = await cntxDir.getDirectoryHandle('bundles');

      let targetDir: FileSystemDirectoryHandle;

      switch (bundleType) {
        case 'master':
          targetDir = await bundlesDir.getDirectoryHandle('master');
          break;
        case 'tag-derived':
          const tagBundlesDir = await bundlesDir.getDirectoryHandle('tag-bundles');
          targetDir = await tagBundlesDir.getDirectoryHandle(bundle.derivedFromTag!);
          break;
        case 'custom':
        default:
          targetDir = bundlesDir;
          break;
      }

      // Delete bundle file
      try {
        await targetDir.removeEntry(bundle.name);
        console.log(`🗑️ Deleted bundle file: ${bundle.name}`);
      } catch (error) {
        console.warn(`Could not delete bundle file ${bundle.name}:`, error);
      }

      // Delete manifest file
      const manifestName = `${bundle.id || bundle.name.replace('.txt', '')}-manifest.json`;
      try {
        await targetDir.removeEntry(manifestName);
        console.log(`🗑️ Deleted manifest file: ${manifestName}`);
      } catch (error) {
        console.warn(`Could not delete manifest file ${manifestName}:`, error);
      }

    } catch (error) {
      console.error('Error deleting bundle files:', error);
      throw error;
    }
  };

  // 4. Fix Custom Bundle Update - Provide better UX
  const handleUpdateCustomBundle = async (bundle: Bundle) => {
    // For custom bundles, we need to ask user what to do since we don't know which files to include
    const message = `Custom bundle "${bundle.name}" requires manual recreation:

1. Select the files you want to include
2. Create a new bundle (this will replace the old one)
3. Or stage files and use "Bundle" button

Would you like to delete the old bundle now?`;

    if (confirm(message)) {
      try {
        await deleteBundleFiles(bundle, 'custom');
        await loadBundles();
        setError(`Old bundle "${bundle.name}" deleted. Create a new bundle with your selected files.`);
      } catch (error) {
        setError(`Failed to delete old bundle: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      setError(`To update "${bundle.name}": select files and create a new bundle. The old one will remain for reference.`);
    }
  };

  // Universal bundle update dispatcher
  const handleUpdateBundle = async (bundle: Bundle) => {
    const bundleType = getBundleType(bundle);

    switch (bundleType) {
      case 'master':
        await handleUpdateMasterBundle();
        break;
      case 'tag-derived':
        await handleUpdateTagBundle(bundle);
        break;
      case 'custom':
        await handleUpdateCustomBundle(bundle);
        break;
      default:
        setError(`Unknown bundle type: ${bundleType}`);
    }
  };

  useEffect(() => {
    loadBundles();
  }, [loadBundles]);

  // Helper function to get bundle type display information
  const getBundleTypeDisplay = (bundle: Bundle) => {
    const bundleType = getBundleType(bundle);

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
          canUpdate: true
        };
      case 'tag-derived': {
        const tagName = bundle.derivedFromTag || 'Tag Bundle';
        const tagConfig = allTags[tagName];
        const tagColor = tagConfig?.color || '#22c55e';
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
          canUpdate: true
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
          canUpdate: true // FIXED: Custom bundles can now show update option (with explanation)
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

  // Filter and sort bundles
  const filteredBundles = allBundles.filter(bundle => {
    const matchesSearch = bundle.name.toLowerCase().includes(filter.toLowerCase()) ||
      bundle.description?.toLowerCase().includes(filter.toLowerCase());

    const bundleType = getBundleType(bundle); // FIXED: Use the fixed type detection
    const matchesType = typeFilter === 'all' || bundleType === typeFilter;
    return matchesSearch && matchesType;
  });

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

  // Existing utility functions
  const handleSort = (field: 'name' | 'timestamp' | 'fileCount') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleBundleSelect = (bundleName: string) => {
    setSelectedBundle(bundleName);
    setError(null);
  };

  const handleBackToBundles = () => {
    setSelectedBundle(null);
    setError(null);
  };

  const handleRefresh = async () => {
    await loadBundles();
  };

  const copyBundleContent = async (bundleName: string) => {
    console.log('Copy bundle content for:', bundleName);
  };

  const downloadBundle = async (bundleName: string) => {
    console.log('Download bundle:', bundleName);
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // FIXED: Bundle statistics calculation with proper type detection
  const bundleStats = {
    total: allBundles.length,
    master: allBundles.filter(b => getBundleType(b) === 'master').length,
    tagDerived: allBundles.filter(b => getBundleType(b) === 'tag-derived').length,
    custom: allBundles.filter(b => getBundleType(b) === 'custom').length,
  };

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
              {!selectedBundle && (
                <Button onClick={handleUpdateMasterBundle} disabled={updatingBundles.has('master')}>
                  {updatingBundles.has('master') ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {masterBundle ? 'Update Master Bundle' : 'Create Master Bundle'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
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
                        const isUpdating = updatingBundles.has(bundle.name);

                        return (
                          <TableRow
                            key={bundle.name}
                            className="cursor-pointer hover:bg-muted/50"
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
                              </div>
                            </TableCell>
                            <TableCell>
                              <BundleAnalysisBadge bundle={bundle} />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {/* Quick actions */}
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

                                {/* More actions dropdown */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {/* FIXED: All bundle types can now show update option */}
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateBundle(bundle);
                                      }}
                                      disabled={isUpdating}
                                    >
                                      {isUpdating ? (
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                      )}
                                      Update Bundle
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyBundleContent(bundle.name);
                                      }}
                                    >
                                      <Copy className="h-4 w-4 mr-2" />
                                      Copy Content
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        downloadBundle(bundle.name);
                                      }}
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      Download
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
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
