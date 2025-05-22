// src/components/BundleMainViewer.tsx - Enhanced with breadcrumb navigation
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
  ArrowLeft
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBundles } from '@/contexts/BundleContext';
import { useDirectory } from '@/contexts/DirectoryContext';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MasterBundleButton } from './MasterBundleButton';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { BundleAnalysisBadge } from './BundleAnalysisBadge';
import { BundleView } from './BundleView';

export function BundleMainViewer() {
  const { bundles, masterBundle, loadBundles } = useBundles();
  const { directoryHandle } = useDirectory();
  const [sortField, setSortField] = useState<'name' | 'timestamp' | 'fileCount'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState('');
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load bundles on component mount
    loadBundles();
  }, [loadBundles]);

  // Combine regular bundles with master bundle for display
  const allBundles = [...bundles];
  if (masterBundle) {
    // Check if masterBundle is already in the list to avoid duplicates
    const masterExists = allBundles.some(b => b.name === masterBundle.name);
    if (!masterExists) {
      // Insert master bundle at the top of the list
      allBundles.unshift(masterBundle);
    }
  }

  // Sort bundles based on current sort field and direction
  const sortedBundles = [...allBundles].sort((a, b) => {
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

  // Filter bundles based on search input
  const filteredBundles = sortedBundles.filter(bundle =>
    bundle.name.toLowerCase().includes(filter.toLowerCase())
  );

  // Toggle sort direction or change sort field
  const handleSort = (field: 'name' | 'timestamp' | 'fileCount') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to descending for new sort field
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

      // Check if it's a master bundle
      let bundleHandle;
      if (bundleName.startsWith('master-')) {
        try {
          const masterDir = await bundlesDir.getDirectoryHandle('master', { create: true });
          bundleHandle = await masterDir.getFileHandle(bundleName);
        } catch (err) {
          console.error('Error accessing master bundle:', err);
          return;
        }
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

      // Check if it's a master bundle
      let bundleHandle;
      if (bundleName.startsWith('master-')) {
        try {
          const masterDir = await bundlesDir.getDirectoryHandle('master', { create: true });
          bundleHandle = await masterDir.getFileHandle(bundleName);
        } catch (err) {
          console.error('Error accessing master bundle:', err);
          return;
        }
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

  // Open bundle in finder/explorer
  const openInFinder = async () => {
    if (!directoryHandle || !selectedBundle) return;

    try {
      alert('Note: Opening files in Finder/Explorer is not directly supported by the File System API. This functionality would require additional platform-specific integration.');
      // In a real implementation, you might use Electron's shell.showItemInFolder() or similar
    } catch (error) {
      console.error('Error opening bundle in finder:', error);
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

  // Get the selected bundle object
  const selectedBundleObj = selectedBundle
    ? filteredBundles.find(b => b.name === selectedBundle)
    : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              {/* Breadcrumb Navigation */}
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
                      {/* Bundle Details */}
                    </CardDescription>
                  </div>
                </div>
              ) : (
                <div>
                  <CardTitle>Bundle Manager</CardTitle>
                  <CardDescription>
                    View and manage your file bundles
                  </CardDescription>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefresh} title="Refresh bundles">
                <RefreshCw className="h-4 w-4" />
              </Button>
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

          {/* Show bundle list or selected bundle view */}
          {selectedBundle && selectedBundleObj ? (
            <BundleView
              bundle={selectedBundleObj}
              onClose={handleBackToBundles}
            />
          ) : (
            <>
              {/* Bundle List View */}
              <div className="mb-4">
                <Input
                  placeholder="Filter bundles..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">
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
                      <TableHead>
                        Tags
                      </TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBundles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No bundles found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBundles.map((bundle) => (
                        <TableRow
                          key={bundle.name}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleBundleSelect(bundle.name)}
                        >
                          <TableCell className="font-medium">{bundle.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                              {formatTimestamp(bundle.timestamp)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                              {bundle.fileCount}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                              {bundle.tagCount || 0}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {bundle.name.startsWith('master-') ? (
                                <Badge variant="secondary">Master</Badge>
                              ) : (
                                <Badge>Regular</Badge>
                              )}
                              <BundleAnalysisBadge bundle={bundle} />
                            </div>
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
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openInFinder();
                                }}
                              >
                                <FolderOpen className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
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
