// src/components/CNTXJSONLPanel.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Database,
  FileText,
  Tags,
  Play,
  Loader2,
  FolderTree,
  Archive
} from 'lucide-react';
import { useCNTXJSONL } from '@/hooks/useCNTXJSONL';

export const CNTXJSONLPanel: React.FC = () => {
  const {
    processAllJSONL,
    getStats,
    isProcessing
  } = useCNTXJSONL();

  const stats = getStats();

  const handleProcessAll = async () => {
    try {
      await processAllJSONL();
    } catch (error) {
      console.error('Processing failed:', error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Database className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">CNTX JSONL System</h2>
      </div>

      <p className="text-muted-foreground">
        Generate JSONL files in your .cntx directory for individual files, bundles, and tag-derived bundles.
      </p>

      {/* Statistics Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Project Overview</CardTitle>
          <CardDescription>Current state of your project for JSONL processing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalFiles}</div>
              <div className="text-sm text-muted-foreground">Total Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalBundles}</div>
              <div className="text-sm text-muted-foreground">Bundles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.uniqueTags}</div>
              <div className="text-sm text-muted-foreground">Unique Tags</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.taggedFiles}</div>
              <div className="text-sm text-muted-foreground">Tagged Files</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Section */}
      <Card>
        <CardHeader>
          <CardTitle>JSONL Processing</CardTitle>
          <CardDescription>
            Generate JSONL files for all your files, bundles, and create tag-derived bundles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Processing Status */}
          {isProcessing && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Processing JSONL files...</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Files processed:</span>
                  <span>{stats.processedFiles} / {Math.min(stats.totalFiles, 20)}</span>
                </div>
                <Progress value={(stats.processedFiles / Math.min(stats.totalFiles, 20)) * 100} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Bundles processed:</span>
                  <span>{stats.processedBundles} / {stats.totalBundles}</span>
                </div>
                <Progress value={stats.totalBundles > 0 ? (stats.processedBundles / stats.totalBundles) * 100 : 0} />
              </div>

              {stats.tagBundles > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tag bundles created:</span>
                  <span>{stats.tagBundles}</span>
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={handleProcessAll}
            disabled={isProcessing || (stats.totalFiles === 0 && stats.totalBundles === 0)}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Generate All JSONL Files
              </>
            )}
          </Button>

          {!isProcessing && (stats.processedFiles > 0 || stats.processedBundles > 0) && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-sm text-green-800 dark:text-green-200">
                ✅ Last processing completed successfully!
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* What Gets Created */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Individual Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Creates <code>.jsonl</code> files for each watched file
              </p>
              <div className="text-xs font-mono bg-muted p-2 rounded">
                .cntx/files/jsonl/<br />
                ├── src/App.tsx.jsonl<br />
                └── components/Header.tsx.jsonl
              </div>
              <Badge variant="outline" className="text-xs">
                {Math.min(stats.totalFiles, 20)} files to process
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Archive className="h-4 w-4" />
              Bundle JSONL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Creates JSONL for your curated bundles
              </p>
              <div className="text-xs font-mono bg-muted p-2 rounded">
                .cntx/bundles/<br />
                ├── master/bundle.jsonl<br />
                └── feature-auth/bundle.jsonl
              </div>
              <Badge variant="outline" className="text-xs">
                {stats.totalBundles} bundles
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Tags className="h-4 w-4" />
              Tag Bundles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Auto-creates bundles from your manual tags
              </p>
              <div className="text-xs font-mono bg-muted p-2 rounded">
                .cntx/bundles/tag-bundles/<br />
                ├── react/bundle.jsonl<br />
                └── typescript/bundle.jsonl
              </div>
              <Badge variant="outline" className="text-xs">
                {stats.uniqueTags} potential tag bundles
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* File Structure Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            Generated File Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm font-mono bg-muted p-4 rounded-lg">
            <div className="text-muted-foreground">
              .cntx/<br />
              ├── files/jsonl/           <span className="text-xs text-muted-foreground"># Per-file JSONL</span><br />
              │   ├── src/App.tsx.jsonl<br />
              │   └── components/Header.tsx.jsonl<br />
              ├── bundles/               <span className="text-xs text-muted-foreground"># Bundle JSONL</span><br />
              │   ├── master/bundle.jsonl<br />
              │   ├── custom-bundle/bundle.jsonl<br />
              │   └── tag-bundles/       <span className="text-xs text-muted-foreground"># Auto-generated</span><br />
              │       ├── react/bundle.jsonl<br />
              │       ├── typescript/bundle.jsonl<br />
              │       └── core/bundle.jsonl<br />
              └── exports/               <span className="text-xs text-muted-foreground"># Future: Combined exports</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
