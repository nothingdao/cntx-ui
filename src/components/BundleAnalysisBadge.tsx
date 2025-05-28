// src/components/BundleAnalysisBadge.tsx
// FIXED VERSION - Properly handles bundle content parsing and staleness calculation

import { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDirectory } from '@/contexts/DirectoryContext';
import { useFiles } from '@/contexts/FileContext';
import type { Bundle, BundleType } from '@/types/types';
import { FileEdit, FileCheck, Loader2, AlertCircle } from "lucide-react";

type BundleAnalysisBadgeProps = {
  bundle: Bundle;
};

export function BundleAnalysisBadge({ bundle }: BundleAnalysisBadgeProps) {
  const { directoryHandle } = useDirectory();
  const { watchedFiles } = useFiles();
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("Loading...");
  const [color, setColor] = useState("#888");
  const [tooltipText, setTooltipText] = useState("");
  const [Icon, setIcon] = useState(FileCheck);

  // FIXED: Safe bundle file access that handles all bundle types
  const getBundleFileHandle = async (bundle: Bundle): Promise<FileSystemFileHandle | null> => {
    if (!directoryHandle) return null;

    try {
      const cntxDir = await directoryHandle.getDirectoryHandle('.cntx');
      const bundlesDir = await cntxDir.getDirectoryHandle('bundles');

      // Determine bundle type with fallbacks for existing bundles
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

      // Handle different bundle types with proper path resolution
      switch (bundleType) {
        case 'master': {
          const masterDir = await bundlesDir.getDirectoryHandle('master', { create: true });
          return await masterDir.getFileHandle(bundle.name);
        }
        case 'tag-derived': {
          const tagName = bundle.derivedFromTag;
          if (!tagName) {
            console.error('Tag-derived bundle missing derivedFromTag:', bundle);
            throw new Error('Tag-derived bundle is missing tag information');
          }
          const tagBundlesDir = await bundlesDir.getDirectoryHandle('tag-bundles');
          const tagDir = await tagBundlesDir.getDirectoryHandle(tagName);
          return await tagDir.getFileHandle(bundle.name);
        }
        case 'custom':
        default: {
          return await bundlesDir.getFileHandle(bundle.name);
        }
      }
    } catch (error) {
      console.error(`Failed to get file handle for bundle ${bundle.name}:`, error);
      throw error;
    }
  };

  // FIXED: Improved bundle content parsing
  const extractFilePaths = (content: string): string[] => {
    const filePaths: string[] = [];

    // Try multiple formats to handle different bundle structures

    // 1. Try new XML format with <document><source> tags
    const documentRegex = /<document[^>]*>[\s\S]*?<source>(.*?)<\/source>[\s\S]*?<\/document>/g;
    let match;
    while ((match = documentRegex.exec(content)) !== null) {
      if (match[1] && match[1].trim()) {
        filePaths.push(match[1].trim());
      }
    }

    // 2. If no documents found, try simpler <source> tag format
    if (filePaths.length === 0) {
      const sourceRegex = /<source>(.*?)<\/source>/g;
      while ((match = sourceRegex.exec(content)) !== null) {
        if (match[1] && match[1].trim()) {
          filePaths.push(match[1].trim());
        }
      }
    }

    // 3. Debug logging
    console.log(`Bundle ${bundle.name}: Found ${filePaths.length} file paths`);
    if (filePaths.length > 0) {
      console.log(`Sample paths:`, filePaths.slice(0, 3));
    }

    return filePaths;
  };

  useEffect(() => {
    let isMounted = true;

    async function analyzeBundleStaleness() {
      if (!directoryHandle || !bundle || !isMounted) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        console.log(`🔍 Analyzing bundle: ${bundle.name} (type: ${bundle.type || 'unknown'})`);

        // Get bundle file handle using the same logic as BundleView
        const bundleHandle = await getBundleFileHandle(bundle);
        if (!bundleHandle) {
          throw new Error('Could not access bundle file');
        }

        // Read bundle content
        const file = await bundleHandle.getFile();
        const content = await file.text();
        console.log(`📄 Bundle content loaded: ${content.length} characters`);

        // Extract file paths from bundle content
        const bundleFilePaths = extractFilePaths(content);
        console.log(`📋 Extracted ${bundleFilePaths.length} file paths from bundle`);

        if (bundleFilePaths.length === 0) {
          console.warn(`⚠️ No file paths found in bundle ${bundle.name}`);
          setLabel("No Files");
          setColor("#94a3b8");
          setTooltipText("Bundle contains no traceable files");
          setIcon(AlertCircle);
          return;
        }

        // Calculate staleness by comparing with current watched files
        let staleCount = 0;
        let freshCount = 0;
        let missingCount = 0;

        bundleFilePaths.forEach(bundlePath => {
          const currentFile = watchedFiles.find(f => f.path === bundlePath);

          if (!currentFile) {
            // File in bundle but not in current watched files (might be deleted or filtered out)
            missingCount++;
          } else if (currentFile.isChanged) {
            // File exists and has been modified since last bundle
            staleCount++;
          } else {
            // File exists and hasn't been modified
            freshCount++;
          }
        });

        const totalTrackedFiles = staleCount + freshCount;
        const stalenessPercentage = totalTrackedFiles > 0 ? Math.round((staleCount / totalTrackedFiles) * 100) : 0;

        console.log(`📊 Bundle analysis: ${freshCount} fresh, ${staleCount} stale, ${missingCount} missing`);
        console.log(`📈 Staleness: ${stalenessPercentage}%`);

        // Determine display based on staleness
        if (totalTrackedFiles === 0) {
          setLabel("Unknown");
          setIcon(AlertCircle);
          setColor("#94a3b8");
          setTooltipText(`Cannot determine staleness (${missingCount} files not tracked)`);
        } else if (stalenessPercentage === 0) {
          setLabel("Fresh");
          setIcon(FileCheck);
          setColor("#22c55e");
          setTooltipText(`100% fresh - ${freshCount} files unchanged`);
        } else if (stalenessPercentage <= 25) {
          setLabel("Mostly Fresh");
          setIcon(FileCheck);
          setColor("#22c55e");
          setTooltipText(`${100 - stalenessPercentage}% fresh - ${staleCount} of ${totalTrackedFiles} files changed`);
        } else if (stalenessPercentage <= 50) {
          setLabel("Some Stale");
          setIcon(FileEdit);
          setColor("#f59e0b");
          setTooltipText(`${stalenessPercentage}% stale - ${staleCount} of ${totalTrackedFiles} files changed`);
        } else if (stalenessPercentage <= 75) {
          setLabel("Stale");
          setIcon(FileEdit);
          setColor("#f97316");
          setTooltipText(`${stalenessPercentage}% stale - ${staleCount} of ${totalTrackedFiles} files changed`);
        } else {
          setLabel("Very Stale");
          setIcon(AlertCircle);
          setColor("#ef4444");
          setTooltipText(`${stalenessPercentage}% stale - ${staleCount} of ${totalTrackedFiles} files changed`);
        }

        // Add missing files info to tooltip if relevant
        if (missingCount > 0) {
          setTooltipText(prev => `${prev} (${missingCount} files not tracked)`);
        }

      } catch (error) {
        console.error(`❌ Error analyzing bundle ${bundle.name}:`, error);
        setLabel("Error");
        setColor("#ef4444");
        setTooltipText(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIcon(AlertCircle);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    analyzeBundleStaleness();

    return () => {
      isMounted = false;
    };
  }, [bundle, directoryHandle, watchedFiles]);

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className="flex items-center gap-1 cursor-default"
            style={{
              borderColor: color,
              backgroundColor: `${color}15`,
              color: color
            }}
          >
            <Icon className="h-3 w-3" />
            <span>{label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs max-w-xs">
            <div className="font-medium">{bundle.name}</div>
            <div className="mt-1">{tooltipText}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
