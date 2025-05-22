// src/utils/bundle-utils.ts
import type { Bundle, BundleManifest, WatchedFile } from '@/types/types'

export type BundleAnalysis = {
  bundle: Bundle
  staleFiles: string[] // List of file paths that have changed since bundle creation
  freshFiles: string[] // List of file paths that haven't changed since bundle creation
  missingFiles: string[] // List of file paths in bundle that no longer exist
  tags: Record<string, number> // Count of files with each tag
  staleness: number // Percentage of files that are stale (0-100)
  manifest?: BundleManifest // Original manifest if available
}

/**
 * Analyzes a bundle to determine its staleness, tags, and other metadata
 */
export async function analyzeBundleHealth(
  bundle: Bundle,
  manifest: BundleManifest | null,
  watchedFiles: WatchedFile[]
): Promise<BundleAnalysis> {
  // Default values if we can't find a manifest
  const staleFiles: string[] = []
  const freshFiles: string[] = []
  const missingFiles: string[] = []
  const tags: Record<string, number> = {}

  // If we don't have a manifest, we can't determine staleness accurately
  if (!manifest) {
    return {
      bundle,
      staleFiles,
      freshFiles,
      missingFiles,
      tags,
      staleness: 0,
      manifest: null,
    }
  }

  // Find which files in the bundle are stale
  manifest.files.forEach((manifestFile) => {
    const path = manifestFile.path
    const watchedFile = watchedFiles.find((f) => f.path === path)

    // If file exists in watched files
    if (watchedFile) {
      // Get file tags from the manifest or from current watchedFile
      const fileTags = manifestFile.tags || watchedFile.tags || []

      // Count tags
      if (fileTags.length > 0) {
        fileTags.forEach((tag) => {
          tags[tag] = (tags[tag] || 0) + 1
        })
      }

      // Check if file is newer than the manifest file
      const manifestTimestamp = new Date(manifestFile.lastModified).getTime()
      const fileTimestamp = watchedFile.lastModified.getTime()

      if (fileTimestamp > manifestTimestamp) {
        staleFiles.push(path)
      } else {
        freshFiles.push(path)
      }
    } else {
      // File in manifest but not in watched files (might have been deleted)
      missingFiles.push(path)

      // Count tags from manifest for missing files too
      if (manifestFile.tags && manifestFile.tags.length > 0) {
        manifestFile.tags.forEach((tag) => {
          tags[tag] = (tags[tag] || 0) + 1
        })
      }
    }
  })

  // Calculate staleness percentage
  const totalTrackedFiles = staleFiles.length + freshFiles.length
  const staleness =
    totalTrackedFiles > 0
      ? Math.round((staleFiles.length / totalTrackedFiles) * 100)
      : 0

  return {
    bundle,
    staleFiles,
    freshFiles,
    missingFiles,
    tags,
    staleness,
    manifest,
  }
}

/**
 * Get a color for staleness based on percentage
 */
export function getStalenessColor(staleness: number): string {
  if (staleness <= 20) return 'green'
  if (staleness <= 50) return 'yellow'
  if (staleness <= 80) return 'orange'
  return 'red'
}

/**
 * Sort tags by count in descending order
 */
export function getSortedTags(
  tags: Record<string, number>
): [string, number][] {
  return Object.entries(tags).sort((a, b) => b[1] - a[1])
}

/**
 * Load a manifest for a bundle
 */
export async function loadBundleManifest(
  cntxDir: FileSystemDirectoryHandle,
  bundleName: string
): Promise<BundleManifest | null> {
  try {
    console.log(`Attempting to load manifest for ${bundleName}...`)
    const bundlesDir = await cntxDir.getDirectoryHandle('bundles')

    // Extract bundle ID from the name
    // Bundle name format is usually bundleId.txt
    const bundleId = bundleName.replace(/\.txt$/, '')

    // Master bundles are in a subdirectory
    let manifestFile
    let manifestName = `${bundleId}-manifest.json`

    if (bundleName.startsWith('master-')) {
      try {
        console.log(`Looking for master manifest: ${manifestName}`)
        const masterDir = await bundlesDir.getDirectoryHandle('master', {
          create: true,
        })
        manifestFile = await masterDir.getFileHandle(manifestName)
        console.log('Master manifest file found')
      } catch (error) {
        console.error(
          `Error accessing master manifest for ${bundleName}:`,
          error
        )
        // Try alternate manifest name formatting
        manifestName = bundleName.replace('.txt', '-manifest.json')
        try {
          const masterDir = await bundlesDir.getDirectoryHandle('master', {
            create: true,
          })
          manifestFile = await masterDir.getFileHandle(manifestName)
          console.log(
            `Found master manifest with alternate name: ${manifestName}`
          )
        } catch (altError) {
          console.error(
            `Also failed with alternate master manifest name:`,
            altError
          )
          return null
        }
      }
    } else {
      // Regular bundles have their manifest in the bundles directory
      try {
        console.log(`Looking for regular manifest: ${manifestName}`)
        manifestFile = await bundlesDir.getFileHandle(manifestName)
        console.log('Regular manifest file found')
      } catch (error) {
        console.error(
          `Error accessing regular manifest for ${bundleName}:`,
          error
        )
        // Try alternate manifest name formatting
        manifestName = bundleName.replace('.txt', '-manifest.json')
        try {
          manifestFile = await bundlesDir.getFileHandle(manifestName)
          console.log(
            `Found regular manifest with alternate name: ${manifestName}`
          )
        } catch (altError) {
          console.error(
            `Also failed with alternate regular manifest name:`,
            altError
          )
          return null
        }
      }
    }

    if (!manifestFile) {
      console.error(`No manifest file found for ${bundleName}`)
      return null
    }

    // Load and parse the manifest content
    try {
      const file = await manifestFile.getFile()
      const content = await file.text()
      console.log(`Successfully loaded manifest content for ${bundleName}`)

      try {
        const manifest = JSON.parse(content)
        console.log(`Successfully parsed manifest for ${bundleName}`)
        return manifest
      } catch (parseError) {
        console.error(
          `Error parsing manifest content for ${bundleName}:`,
          parseError
        )
        console.error('Manifest content:', content.substring(0, 200) + '...')
        return null
      }
    } catch (fileError) {
      console.error(`Error reading manifest file for ${bundleName}:`, fileError)
      return null
    }
  } catch (error) {
    console.error('Error in loadBundleManifest:', error)
    return null
  }
}
