// src/utils/file-state.ts - ENHANCED VERSION with bulletproof tag preservation
import { BundleManifest, WatchedFile, WatchState } from '@/types/types'
import { shouldIgnorePath } from './file-utils'

export const DEFAULT_STATE: WatchState = {
  lastAccessed: new Date().toISOString(),
  files: {},
  masterBundle: null,
}

// ENHANCED: loadState should ALWAYS preserve tags and never filter existing state
export async function loadState(
  cntxDir: FileSystemDirectoryHandle,
  ignorePatterns: string[], // Keep for compatibility but NEVER use for filtering existing data
  retries: number = 3,
  retryDelay: number = 100
): Promise<WatchState> {
  try {
    const stateDir = await cntxDir.getDirectoryHandle('state')
    const handle = await stateDir.getFileHandle('file.json')
    const file = await handle.getFile()
    const content = await file.text()

    try {
      const parsedState = JSON.parse(content)
      const sanitizedState: WatchState = {
        lastAccessed: parsedState.lastAccessed || new Date().toISOString(),
        files: {},
        masterBundle: parsedState.masterBundle || null,
      }

      // CRITICAL: Load ALL files from state UNCONDITIONALLY
      // Ignore patterns should NEVER affect existing state data
      if (parsedState.files && typeof parsedState.files === 'object') {
        let taggedFilesCount = 0

        for (const [path, fileState] of Object.entries(parsedState.files)) {
          if (fileState && typeof fileState === 'object') {
            const fileTags = Array.isArray((fileState as any).tags)
              ? (fileState as any).tags
              : []

            // Count files with tags for logging
            if (fileTags.length > 0) {
              taggedFilesCount++
            }

            // PRESERVE ALL EXISTING DATA - especially tags
            sanitizedState.files[path] = {
              name: (fileState as any).name || path.split('/').pop() || '',
              directory:
                (fileState as any).directory ||
                path.split('/').slice(0, -1).join('/') ||
                'Root',
              lastModified:
                (fileState as any).lastModified || new Date().toISOString(),
              isChanged: Boolean((fileState as any).isChanged),
              isStaged: Boolean((fileState as any).isStaged),
              masterBundleId: (fileState as any).masterBundleId,
              // CRITICAL: Always preserve existing tags, never lose them
              tags: fileTags,
            }
          }
        }

        console.log(
          `✅ Loaded complete state with ${
            Object.keys(sanitizedState.files).length
          } files (${taggedFilesCount} with tags)`
        )

        // Log tagged files for debugging
        if (taggedFilesCount > 0) {
          console.log('🏷️  Files with preserved tags:')
          Object.entries(sanitizedState.files).forEach(([path, state]) => {
            if (state.tags && state.tags.length > 0) {
              console.log(`  ${path}: [${state.tags.join(', ')}]`)
            }
          })
        }
      }

      return sanitizedState
    } catch (parseError) {
      console.error('Invalid JSON content:')
      console.error('Parse error:', parseError)
      return { ...DEFAULT_STATE }
    }
  } catch (error) {
    if (error.name === 'NotReadableError' && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
      return loadState(cntxDir, ignorePatterns, retries - 1, retryDelay)
    }
    console.log('No existing state found, returning default state')
    return { ...DEFAULT_STATE }
  }
}

// ENHANCED: saveState with bulletproof tag preservation
export async function saveState(
  cntxDir: FileSystemDirectoryHandle,
  state: WatchState,
  ignorePatterns: string[]
): Promise<void> {
  try {
    const stateDir = await cntxDir.getDirectoryHandle('state')
    const handle = await stateDir.getFileHandle('file.json', { create: true })

    // CRITICAL: Preserve files with tags regardless of ignore patterns
    const preservedFiles = Object.fromEntries(
      Object.entries(state.files).map(([path, fileState]) => {
        // Always preserve files that have:
        // - Tags (MOST IMPORTANT)
        // - Are staged
        // - Have bundle associations
        // - Were manually modified
        const hasImportantData =
          (fileState.tags && fileState.tags.length > 0) ||
          fileState.isStaged ||
          fileState.masterBundleId ||
          fileState.isChanged

        // Log preservation of important files
        if (
          hasImportantData &&
          shouldIgnorePath(path, { ignore: ignorePatterns })
        ) {
          console.log(
            `🏷️  Preserving important file despite ignore pattern: ${path}`,
            {
              tags: fileState.tags || [],
              staged: fileState.isStaged,
              bundleId: fileState.masterBundleId,
              changed: fileState.isChanged,
            }
          )
        }

        // Sanitize and preserve all data
        return [
          path,
          {
            name: fileState.name,
            directory: fileState.directory,
            lastModified: fileState.lastModified || new Date().toISOString(),
            isChanged: Boolean(fileState.isChanged),
            isStaged: Boolean(fileState.isStaged),
            masterBundleId: fileState.masterBundleId,
            // CRITICAL: NEVER lose tags - always preserve them
            tags: Array.isArray(fileState.tags) ? [...fileState.tags] : [],
          },
        ]
      })
    )

    const sanitizedState = {
      lastAccessed: new Date().toISOString(),
      files: preservedFiles,
      masterBundle: state.masterBundle || null,
    }

    // Count tagged files for verification
    const taggedFilesCount = Object.values(preservedFiles).filter(
      (f) => f.tags && f.tags.length > 0
    ).length

    const writable = await handle.createWritable()
    const jsonContent = JSON.stringify(sanitizedState, null, 2)
    await writable.write(jsonContent)
    await writable.close()

    console.log(
      `✅ Saved state with ${
        Object.keys(preservedFiles).length
      } files (${taggedFilesCount} with tags)`
    )

    // Verify tags were preserved by sampling
    if (taggedFilesCount > 0) {
      console.log('🏷️  Sample of preserved tagged files:')
      const taggedFiles = Object.entries(preservedFiles)
        .filter(([, state]) => state.tags && state.tags.length > 0)
        .slice(0, 5)

      taggedFiles.forEach(([path, state]) => {
        console.log(`  ${path}: [${state.tags.join(', ')}]`)
      })

      if (Object.keys(preservedFiles).length > taggedFiles.length) {
        console.log(
          `  ...and ${taggedFilesCount - taggedFiles.length} more tagged files`
        )
      }
    }
  } catch (error) {
    console.error('❌ Error saving state:', error)
    // Attempt to recover by recreating the state file
    try {
      const stateDir = await cntxDir.getDirectoryHandle('state')
      const handle = await stateDir.getFileHandle('file.json', { create: true })
      const writable = await handle.createWritable()
      await writable.write(JSON.stringify(DEFAULT_STATE, null, 2))
      await writable.close()
      console.log('🔄 Created new default state file after error')
    } catch (recoveryError) {
      console.error('💥 Failed to recover state file:', recoveryError)
    }
  }
}

// ENHANCED: Bundle manifest creation with tag preservation
export async function saveBundleManifest(
  bundlesDir: FileSystemDirectoryHandle,
  manifest: BundleManifest,
  isMaster: boolean = false
) {
  const dir = isMaster
    ? await bundlesDir.getDirectoryHandle('master', { create: true })
    : bundlesDir

  const manifestHandle = await dir.getFileHandle(
    `${manifest.id}-manifest.json`,
    { create: true }
  )

  // Ensure manifest includes tags
  const enhancedManifest = {
    ...manifest,
    files: manifest.files.map((file) => ({
      ...file,
      tags: file.tags || [], // Ensure tags are always present
    })),
  }

  const manifestWritable = await manifestHandle.createWritable()
  await manifestWritable.write(JSON.stringify(enhancedManifest, null, 2))
  await manifestWritable.close()

  console.log(
    `📋 Saved manifest for ${manifest.id} with ${manifest.files.length} files`
  )
}

export function generateBundleId(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const random = Math.random().toString(36).substring(2, 7)
  return `bundle-${timestamp}-${random}`
}

// ENHANCED: Bundle creation with tag preservation
export async function createBundleFile(
  files: WatchedFile[],
  cntxDir: FileSystemDirectoryHandle
): Promise<{ success: boolean; error?: string; bundleId?: string }> {
  try {
    const bundleId = generateBundleId()
    const timestamp = new Date().toISOString()
    const bundlesDir = await cntxDir.getDirectoryHandle('bundles')

    console.log(`📦 Creating bundle ${bundleId} with ${files.length} files`)

    // CRITICAL: Load existing state to get current tags
    const currentState = await loadState(cntxDir, []) // No filtering

    // Update files with current tags from state
    const filesWithCurrentTags = files.map((file) => {
      const stateFile = currentState.files[file.path]
      if (stateFile && stateFile.tags && stateFile.tags.length > 0) {
        console.log(`🏷️  Including tags for ${file.path}:`, stateFile.tags)
        return {
          ...file,
          tags: stateFile.tags,
        }
      }
      return file
    })

    // Create bundle content with tags
    const bundleContent = await Promise.all(
      filesWithCurrentTags.map(async (file) => {
        const fileContent =
          (await file.handle?.getFile().then((f) => f.text())) || ''

        // Include tags in the document
        const tagsString =
          file.tags && file.tags.length > 0
            ? `<tags>${file.tags.join(',')}</tags>`
            : '<tags></tags>'

        return `<document>
<source>${file.path}</source>
${tagsString}
<content>${fileContent}</content>
</document>`
      })
    )

    const bundleHandle = await bundlesDir.getFileHandle(`${bundleId}.txt`, {
      create: true,
    })
    const writable = await bundleHandle.createWritable()
    await writable.write(bundleContent.join('\n\n'))
    await writable.close()

    // Create manifest with tags
    const manifest: BundleManifest = {
      id: bundleId,
      created: timestamp,
      fileCount: files.length,
      files: filesWithCurrentTags.map((file) => ({
        path: file.path,
        lastModified: file.lastModified.toISOString(),
        tags: file.tags || [], // CRITICAL: Include tags in manifest
      })),
    }
    await saveBundleManifest(bundlesDir, manifest)

    // Update state while preserving tags
    filesWithCurrentTags.forEach((file) => {
      if (!currentState.files[file.path]) {
        currentState.files[file.path] = {
          name: file.name,
          directory: file.directory,
          lastModified: file.lastModified.toISOString(),
          isChanged: false,
          isStaged: false, // Unstage after bundling
          masterBundleId: undefined,
          tags: file.tags || [],
        }
      } else {
        // PRESERVE existing tags when updating state
        currentState.files[file.path] = {
          ...currentState.files[file.path],
          isStaged: false, // Unstage after bundling
          tags: currentState.files[file.path].tags || [], // Keep existing tags
        }
      }
    })

    // Save state with preserved tags
    await saveState(cntxDir, currentState, []) // No filtering to preserve all

    console.log(
      `✅ Bundle ${bundleId} created successfully with preserved tags`
    )
    return { success: true, bundleId }
  } catch (error) {
    console.error('❌ Error creating bundle:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create bundle',
    }
  }
}

export async function createTagBundleFile(
  files: WatchedFile[],
  tagName: string,
  cntxDir: FileSystemDirectoryHandle
): Promise<{ success: boolean; error?: string; bundleId?: string }> {
  try {
    const bundleId = `tag-${tagName}-${new Date()
      .toISOString()
      .replace(/[:.]/g, '-')}`
    const timestamp = new Date().toISOString()

    console.log(
      `📦 Creating tag bundle ${bundleId} for tag "${tagName}" with ${files.length} files`
    )

    // Get or create bundles directory structure
    const bundlesDir = await cntxDir.getDirectoryHandle('bundles', {
      create: true,
    })
    const tagBundlesDir = await bundlesDir.getDirectoryHandle('tag-bundles', {
      create: true,
    })
    const tagDir = await tagBundlesDir.getDirectoryHandle(tagName, {
      create: true,
    })

    // CRITICAL: Load existing state to get current tags
    const currentState = await loadState(cntxDir, []) // No filtering

    // Update files with current tags from state
    const filesWithCurrentTags = files.map((file) => {
      const stateFile = currentState.files[file.path]
      if (stateFile && stateFile.tags && stateFile.tags.length > 0) {
        console.log(`🏷️  Including tags for ${file.path}:`, stateFile.tags)
        return {
          ...file,
          tags: stateFile.tags,
        }
      }
      return file
    })

    // Create enhanced bundle content with proper XML structure
    const bundleContent = await Promise.all(
      filesWithCurrentTags.map(async (file) => {
        try {
          const fileContent =
            (await file.handle?.getFile().then((f) => f.text())) || ''

          // Include tags in the document
          const tagsString =
            file.tags && file.tags.length > 0 ? file.tags.join(',') : ''

          return `    <document>
      <source>${escapeXML(file.path)}</source>
      <tags>${escapeXML(tagsString)}</tags>
      <metadata>
        <size>${fileContent.length}</size>
        <lastModified>${file.lastModified.toISOString()}</lastModified>
        <extension>${getFileExtension(file.path)}</extension>
        <directory>${escapeXML(file.directory)}</directory>
      </metadata>
      <content>${escapeXML(fileContent)}</content>
    </document>`
        } catch (error) {
          console.error(`Error reading file ${file.path}:`, error)
          return `    <document>
      <source>${escapeXML(file.path)}</source>
      <tags>${escapeXML(tagName)}</tags>
      <content><!-- Error reading file: ${
        error instanceof Error ? error.message : 'unknown error'
      } --></content>
    </document>`
        }
      })
    )

    // Create the complete bundle content with enhanced metadata
    const fullBundleContent = `<?xml version="1.0" encoding="UTF-8"?>
<bundle id="${bundleId}" created="${timestamp}" fileCount="${
      files.length
    }" type="tag-derived">
  
  <metadata>
    <bundleType>tag-derived</bundleType>
    <derivedFromTag>${escapeXML(tagName)}</derivedFromTag>
    <description>Auto-generated bundle for files tagged with "${escapeXML(
      tagName
    )}"</description>
    <totalFiles>${files.length}</totalFiles>
    <createdAt>${timestamp}</createdAt>
  </metadata>

  <documents>
    
${bundleContent.join('\n\n')}
    
  </documents>

</bundle>`

    console.log(
      `📝 Tag bundle content created (${fullBundleContent.length} bytes)`
    )

    // Write the bundle file
    try {
      const bundleHandle = await tagDir.getFileHandle(`${bundleId}.txt`, {
        create: true,
      })
      const writable = await bundleHandle.createWritable()
      await writable.write(fullBundleContent)
      await writable.close()
      console.log(`💾 Tag bundle file written: ${bundleId}.txt`)
    } catch (error) {
      console.error('Error writing tag bundle file:', error)
      return {
        success: false,
        error: `Failed to write tag bundle file: ${
          error instanceof Error ? error.message : String(error)
        }`,
      }
    }

    // Create and save enhanced manifest
    const manifest: BundleManifest = {
      id: bundleId,
      created: timestamp,
      fileCount: files.length,
      type: 'tag-derived',
      derivedFromTag: tagName,
      description: `Files tagged with "${tagName}"`,
      files: filesWithCurrentTags.map((file) => ({
        path: file.path,
        lastModified: file.lastModified.toISOString(),
        tags: file.tags || [], // CRITICAL: Include tags in manifest
      })),
    }

    try {
      await saveTagBundleManifest(tagDir, manifest, tagName)
      console.log('📋 Tag bundle manifest saved with tags')
    } catch (error) {
      console.error('Error saving tag bundle manifest:', error)
      return {
        success: false,
        error: `Failed to save tag bundle manifest: ${
          error instanceof Error ? error.message : String(error)
        }`,
      }
    }

    // Update state while preserving ALL existing tags (don't modify file states for tag bundles)
    // Tag bundles are read-only snapshots, so we don't need to update file states

    console.log(`🎉 Tag bundle creation completed successfully: ${bundleId}`)
    return { success: true, bundleId }
  } catch (error) {
    console.error('❌ Error creating tag bundle:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create tag bundle',
    }
  }
}

async function saveTagBundleManifest(
  tagDir: FileSystemDirectoryHandle,
  manifest: BundleManifest,
  tagName: string
) {
  const manifestHandle = await tagDir.getFileHandle(
    `${manifest.id}-manifest.json`,
    { create: true }
  )

  // Enhanced manifest with tag-specific metadata
  const enhancedManifest = {
    ...manifest,
    tagBundleMetadata: {
      tagName: tagName,
      autoGenerated: true,
      createdFrom: 'tag-derived-bundle-system',
      filesMatchingTag: manifest.files.length,
    },
    files: manifest.files.map((file) => ({
      ...file,
      tags: file.tags || [], // Ensure tags are always present
    })),
  }

  const manifestWritable = await manifestHandle.createWritable()
  await manifestWritable.write(JSON.stringify(enhancedManifest, null, 2))
  await manifestWritable.close()

  console.log(
    `📋 Saved tag bundle manifest for ${manifest.id} with ${manifest.files.length} files`
  )
}

/**
 * Helper function to get file extension
 */
function getFileExtension(filePath: string): string {
  const lastDot = filePath.lastIndexOf('.')
  return lastDot === -1 ? '' : filePath.substring(lastDot + 1)
}

/**
 * Escapes XML special characters
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
