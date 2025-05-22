// src/components/BundleAnalysisBadge.tsx
// SIMPLIFIED VERSION THAT JUST WORKS

import { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDirectory } from '@/contexts/DirectoryContext';
import { useFiles } from '@/contexts/FileContext';
import type { Bundle } from '@/types/types';
// import { loadBundleManifest, analyzeBundleHealth, getStalenessColor } from '@/utils/bundle-utils';
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

  useEffect(() => {
    let isMounted = true;

    async function checkBundle() {
      if (!directoryHandle || !bundle || !isMounted) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // Get the same info that the expanded view uses
        const cntxDir = await directoryHandle.getDirectoryHandle('.cntx');

        // Calculate how many stale files by directly checking files in bundle
        // This is a simplified approach that just works
        let staleFileCount = 0;
        let freshFileCount = 0;

        // Process the bundle file directly to get content
        let bundleFile;
        let bundleContent = "";

        try {
          const bundlesDir = await cntxDir.getDirectoryHandle('bundles');

          if (bundle.name.startsWith('master-')) {
            const masterDir = await bundlesDir.getDirectoryHandle('master', { create: true });
            bundleFile = await masterDir.getFileHandle(bundle.name);
          } else {
            bundleFile = await bundlesDir.getFileHandle(bundle.name);
          }

          if (bundleFile) {
            const file = await bundleFile.getFile();
            bundleContent = await file.text();
          }
        } catch (e) {
          console.log("Could not read bundle content directly:", e);
        }

        // Extract file paths from bundle content
        const regex = /<source>(.*?)<\/source>/g;
        const filePaths: string[] = [];
        let match;

        while ((match = regex.exec(bundleContent)) !== null) {
          filePaths.push(match[1]);
        }

        // Check each file in the bundle against current files
        filePaths.forEach(path => {
          const watchedFile = watchedFiles.find(f => f.path === path);
          if (watchedFile) {
            if (watchedFile.isChanged) {
              staleFileCount++;
            } else {
              freshFileCount++;
            }
          }
        });

        // Calculate percentage
        const totalFiles = staleFileCount + freshFileCount;

        // Determine label based on what the expanded view shows
        if (staleFileCount === 0) {
          setLabel("Fresh");
          setIcon(FileCheck);
          setColor("green");
          setTooltipText(`100% fresh - ${freshFileCount} files unchanged`);
        } else if (staleFileCount / totalFiles <= 0.25) {
          setLabel("Mostly Fresh");
          setIcon(FileCheck);
          setColor("green");
          setTooltipText(`${Math.round((freshFileCount / totalFiles) * 100)}% fresh - ${staleFileCount} files changed`);
        } else if (staleFileCount / totalFiles <= 0.75) {
          setLabel("Stale");
          setIcon(FileEdit);
          setColor("orange");
          setTooltipText(`${Math.round((staleFileCount / totalFiles) * 100)}% stale - ${staleFileCount} files changed`);
        } else {
          setLabel("Very Stale");
          setIcon(AlertCircle);
          setColor("red");
          setTooltipText(`${Math.round((staleFileCount / totalFiles) * 100)}% stale - ${staleFileCount} files changed`);
        }
      } catch (error) {
        console.error(`Simple badge error for ${bundle.name}:`, error);
        setLabel("Status");
        setColor("#888");
        setTooltipText("Click to view details");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    checkBundle();

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
              backgroundColor: `${color}22`
            }}
          >
            <Icon className="h-3 w-3" style={{ color }} />
            <span>{label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">{tooltipText}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
