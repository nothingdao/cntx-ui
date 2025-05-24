// src/types/cntx-jsonl.ts
export interface FileJSONLEntry {
  id: string
  file_path: string
  content: string
  metadata: {
    filename: string
    extension: string
    directory: string
    size: number
    last_modified: string
    manual_tags: string[]
    in_bundles: string[] // Which bundles contain this file
    is_staged: boolean
    is_changed: boolean
    created_at: string
    updated_at: string
  }
}

export interface BundleJSONLEntry {
  id: string
  bundle_name: string
  bundle_type: 'master' | 'custom' | 'tag-derived'
  bundle_description?: string
  derived_from_tag?: string // For tag-derived bundles
  files: Array<{
    path: string
    content: string
    size: number
    extension: string
    manual_tags: string[]
    last_modified: string
  }>
  metadata: {
    created_at: string
    updated_at: string
    total_files: number
    total_size: number
    manual_tags: string[]
    file_types: Record<string, number> // Extension counts
    directories: string[] // Unique directories
  }
}

export interface TagBundleManifest {
  id: string
  tag: string
  name: string
  description: string
  files: string[] // File paths with this tag
  created_at: string
  updated_at: string
  auto_generated: boolean
}

export interface JSONLStats {
  totalFiles: number
  totalBundles: number
  uniqueTags: number
  taggedFiles: number
  processedFiles: number
  processedBundles: number
  tagBundles: number
}
