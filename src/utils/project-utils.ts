// src/utils/project-utils.ts
import { DEFAULT_BUNDLE_IGNORE, DEFAULT_TAGS } from '../constants'
import type {
  WatchedFile,
  WatchState,
  FileSystemDirectoryHandle,
  TagsConfig,
  BundleManifest,
} from '../types/types'
import { loadState, saveState, saveBundleManifest } from './file-state'
import { processDirectory } from './file-utils'

export async function initializeProject(dirHandle: FileSystemDirectoryHandle) {
  try {
    console.log('Starting initialization...')
    // Create .cntx directory first
    const cntxDir = await dirHandle.getDirectoryHandle('.cntx', {
      create: true,
    })

    console.log('Creating directory structure...')
    // Create directory structure
    await createDirectoryStructure(cntxDir)

    console.log('Creating initial configuration...')
    // Create initial configuration
    await createInitialConfig(cntxDir)

    console.log('Scanning directory...')
    // Now process directory AFTER we've created all the necessary structure
    await new Promise((resolve) => setTimeout(resolve, 100)) // Small delay to ensure FS is ready
    const initialFiles = await processDirectory(dirHandle)

    console.log(`Found ${initialFiles.length} files, creating state...`)
    // Initialize state file with processed files
    await initializeStateFile(cntxDir, initialFiles)

    // Ensure pattern-ignore.ts is created with default patterns
    await savePatternIgnore(cntxDir, DEFAULT_BUNDLE_IGNORE)

    console.log('Initialization complete')
    return { cntxDir }
  } catch (error) {
    console.error('Error initializing project:', error)
    throw error
  }
}

async function createDirectoryStructure(cntxDir: FileSystemDirectoryHandle) {
  // Create all required directories
  await cntxDir.getDirectoryHandle('config', { create: true })
  const bundlesDir = await cntxDir.getDirectoryHandle('bundles', {
    create: true,
  })
  // Explicitly create master directory with create: true
  await bundlesDir.getDirectoryHandle('master', { create: true })
  // await cntxDir.getDirectoryHandle('sent', { create: true })
  await cntxDir.getDirectoryHandle('state', { create: true })
}

async function createInitialConfig(cntxDir: FileSystemDirectoryHandle) {
  const configDir = await cntxDir.getDirectoryHandle('config')

  // Create bundle-ignore.ts
  const content = `// .cntx/config/bundle-ignore.ts
export default ${JSON.stringify(DEFAULT_BUNDLE_IGNORE, null, 2)} as const;
`
  const ignoreHandle = await configDir.getFileHandle('bundle-ignore.ts', {
    create: true,
  })
  const writable = await ignoreHandle.createWritable()
  await writable.write(content)
  await writable.close()

  // Create tags.ts with default tags
  const tagsContent = `// .cntx/config/tags.ts
export default ${JSON.stringify(DEFAULT_TAGS, null, 2)} as const;
`
  const tagsHandle = await configDir.getFileHandle('tags.ts', { create: true })
  const tagsWritable = await tagsHandle.createWritable()
  await tagsWritable.write(tagsContent)
  await tagsWritable.close()
}

async function initializeStateFile(
  cntxDir: FileSystemDirectoryHandle,
  initialFiles: WatchedFile[]
) {
  const stateDir = await cntxDir.getDirectoryHandle('state', { create: true })

  // Create initial state with processed files
  const initialState: WatchState = {
    lastAccessed: new Date().toISOString(),
    files: Object.fromEntries(
      initialFiles.map((file) => [
        file.path,
        {
          name: file.name,
          directory: file.directory,
          lastModified: file.lastModified.toISOString(),
          isChanged: false,
          isStaged: false,
          masterBundleId: undefined,
          tags: [],
        },
      ])
    ),
    masterBundle: null,
  }

  const stateHandle = await stateDir.getFileHandle('file.json', {
    create: true,
  })
  const writable = await stateHandle.createWritable()
  await writable.write(JSON.stringify(initialState, null, 2))
  await writable.close()
}

// src/utils/project-utils.ts - Updated createMasterBundle function

import { buildDirectoryTree, getFileExtension } from './directory-tree'

export async function createMasterBundle(
  files: WatchedFile[],
  cntxDir: FileSystemDirectoryHandle,
  ignorePatterns: string[] = []
): Promise<{ success: boolean; error?: string; bundleId?: string }> {
  try {
    console.log('Starting master bundle creation...')
    console.log('Applying ignore patterns:', ignorePatterns)

    const state = await loadState(cntxDir)
    const bundleId = `master-${new Date().toISOString().replace(/[:.]/g, '-')}`
    const timestamp = new Date().toISOString()

    // Filter files based on ignore patterns
    const filteredFiles = files.filter((file) => {
      return !ignorePatterns.some((pattern) => {
        if (pattern.startsWith('*.')) {
          const extension = pattern.slice(1)
          return file.path.toLowerCase().endsWith(extension.toLowerCase())
        }

        const normalizedPath = file.path.toLowerCase()
        const normalizedPattern = pattern.toLowerCase()

        return (
          normalizedPath === normalizedPattern ||
          normalizedPath.includes(`/${normalizedPattern}/`) ||
          normalizedPath.endsWith(`/${normalizedPattern}`) ||
          normalizedPath.startsWith(`${normalizedPattern}/`)
        )
      })
    })

    console.log(`Processing ${filteredFiles.length} files for master bundle...`)

    // Get the bundles directory
    const bundlesDir = await cntxDir.getDirectoryHandle('bundles', {
      create: true,
    })

    // Create master directory
    let masterDir
    try {
      masterDir = await bundlesDir.getDirectoryHandle('master', {
        create: true,
      })
    } catch (error) {
      console.error('Failed to get/create master directory:', error)
      return {
        success: false,
        error: `Failed to create master directory: ${
          error instanceof Error ? error.message : String(error)
        }`,
      }
    }

    // Build directory tree
    const projectName = 'project' // You could get this from directory name
    const { xmlTree, asciiTree } = buildDirectoryTree(
      filteredFiles,
      projectName
    )

    // Create document content for each file
    const documentStrings = await Promise.all(
      filteredFiles.map(async (file) => {
        try {
          if (!file.handle) {
            console.warn(`No file handle for ${file.path}`)
            return createDocumentString(
              file,
              '<!-- File content not available -->'
            )
          }

          const fileObj = await file.handle.getFile()
          const fileContent = await fileObj.text()
          return createDocumentString(file, fileContent)
        } catch (error) {
          console.error(`Error reading file ${file.path}:`, error)
          return createDocumentString(
            file,
            `<!-- Error reading file: ${
              error instanceof Error ? error.message : 'unknown error'
            } -->`
          )
        }
      })
    )

    // Create the complete bundle content with enhanced format
    const bundleContent = `<?xml version="1.0" encoding="UTF-8"?>
<bundle id="${bundleId}" created="${timestamp}" fileCount="${
      filteredFiles.length
    }">
  
  <metadata>
    <projectName>${projectName}</projectName>
    <totalFiles>${filteredFiles.length}</totalFiles>
    <bundleType>master</bundleType>
    <ignorePatterns>
${ignorePatterns
  .map((pattern) => `      <pattern>${escapeXML(pattern)}</pattern>`)
  .join('\n')}
    </ignorePatterns>
  </metadata>

  ${xmlTree}

  <asciiTree>
${asciiTree}
  </asciiTree>

  <documents>
    
${documentStrings.join('\n\n')}
    
  </documents>

</bundle>`

    console.log(`Master bundle content created (${bundleContent.length} bytes)`)

    // Save the bundle to a file
    try {
      const bundleHandle = await masterDir.getFileHandle(`${bundleId}.txt`, {
        create: true,
      })
      const writable = await bundleHandle.createWritable()
      await writable.write(bundleContent)
      await writable.close()
      console.log(`Master bundle file written: ${bundleId}.txt`)
    } catch (error) {
      console.error('Error writing master bundle file:', error)
      return {
        success: false,
        error: `Failed to write master bundle file: ${
          error instanceof Error ? error.message : String(error)
        }`,
      }
    }

    // Create and save manifest (existing logic)
    const manifest: BundleManifest = {
      id: bundleId,
      created: timestamp,
      fileCount: filteredFiles.length,
      files: filteredFiles.map((file) => ({
        path: file.path,
        lastModified: file.lastModified.toISOString(),
        tags: file.tags || [],
      })),
    }

    try {
      await saveBundleManifest(bundlesDir, manifest, true)
      console.log('Master bundle manifest saved')
    } catch (error) {
      console.error('Error saving master bundle manifest:', error)
      return {
        success: false,
        error: `Failed to save master bundle manifest: ${
          error instanceof Error ? error.message : String(error)
        }`,
      }
    }

    // Update state (existing logic)
    filteredFiles.forEach((file) => {
      state.files[file.path] = {
        name: file.name,
        directory: file.directory,
        lastModified: file.lastModified.toISOString(),
        isChanged: false,
        isStaged: false,
        masterBundleId: bundleId,
        tags: file.tags || [],
      }
    })

    state.masterBundle = {
      id: bundleId,
      created: timestamp,
      fileCount: filteredFiles.length,
    }

    try {
      await saveState(cntxDir, state)
      console.log('State updated with master bundle info')
    } catch (error) {
      console.error('Error saving state with master bundle info:', error)
      return {
        success: false,
        error: `Failed to update state: ${
          error instanceof Error ? error.message : String(error)
        }`,
      }
    }

    console.log('Master bundle creation completed successfully')
    return { success: true, bundleId }
  } catch (error) {
    console.error('Error creating master bundle:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create master bundle',
    }
  }
}

/**
 * Helper function to create document string with enhanced metadata
 */
function createDocumentString(file: WatchedFile, content: string): string {
  const tagsString =
    file.tags && file.tags.length > 0 ? file.tags.join(',') : ''

  return `    <document>
      <source>${escapeXML(file.path)}</source>
      <tags>${escapeXML(tagsString)}</tags>
      <metadata>
        <size>${content.length}</size>
        <lastModified>${file.lastModified.toISOString()}</lastModified>
        <extension>${getFileExtension(file.path)}</extension>
        <directory>${escapeXML(file.directory)}</directory>
      </metadata>
      <content>${escapeXML(content)}</content>
    </document>`
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

export async function loadBundleIgnore(
  cntxDir: FileSystemDirectoryHandle
): Promise<string[]> {
  try {
    const configDir = await cntxDir.getDirectoryHandle('config')
    const ignoreHandle = await configDir.getFileHandle('bundle-ignore.ts')
    const file = await ignoreHandle.getFile()
    const content = await file.text()

    const match = content.match(/\[([\s\S]*?)\]/)
    if (!match) {
      console.log('No ignore patterns found, using defaults')
      return DEFAULT_BUNDLE_IGNORE
    }

    const arrayContent = match[1]
      .split(',')
      .map((item) => item.trim().replace(/["']/g, ''))
      .filter((item) => item.length > 0)

    return arrayContent
  } catch (error) {
    console.error('Error loading bundle ignore patterns:', error)
    console.log('Using default ignore patterns:', DEFAULT_BUNDLE_IGNORE)
    return DEFAULT_BUNDLE_IGNORE
  }
}

export async function saveTagsConfig(
  cntxDir: FileSystemDirectoryHandle,
  tags: TagsConfig
) {
  try {
    const configDir = await cntxDir.getDirectoryHandle('config')
    const tagsHandle = await configDir.getFileHandle('tags.ts', {
      create: true,
    })
    const writable = await tagsHandle.createWritable()

    const content = `// .cntx/config/tags.ts
export default ${JSON.stringify(tags, null, 2)} as const;
`

    await writable.write(content)
    await writable.close()
  } catch (error) {
    console.error('Error saving tags config:', error)
  }
}

export async function loadTagsConfig(
  cntxDir: FileSystemDirectoryHandle
): Promise<TagsConfig> {
  try {
    const configDir = await cntxDir.getDirectoryHandle('config')
    const tagsHandle = await configDir.getFileHandle('tags.ts')
    const file = await tagsHandle.getFile()
    const content = await file.text()

    const match = content.match(/default\s*({[\s\S]*})\s*as const/)
    if (!match) return {}

    const obj = eval('(' + match[1] + ')')
    return obj
  } catch (error) {
    console.error('Error loading tags:', error)
    return {}
  }
}

export async function loadPatternIgnore(
  cntxDir: FileSystemDirectoryHandle
): Promise<string[]> {
  try {
    // First try to get the config directory
    const configDir = await cntxDir.getDirectoryHandle('config')
    console.log('Found config directory, looking for pattern-ignore.ts')

    try {
      // Try to load pattern-ignore.ts first (this should be the user's patterns)
      const patternIgnoreHandle = await configDir.getFileHandle(
        'pattern-ignore.ts'
      )
      const file = await patternIgnoreHandle.getFile()
      const content = await file.text()
      console.log('Loaded pattern-ignore.ts content:', content)

      // Use a simple regex to extract the pattern array
      const match = content.match(/\[([\s\S]*?)\]/)
      if (match && match[1]) {
        const patterns = match[1]
          .split(',')
          .map((line) => line.trim().replace(/['",]/g, ''))
          .filter((item) => item.length > 0)

        console.log(
          'Successfully parsed patterns from pattern-ignore.ts:',
          patterns
        )
        return patterns
      }

      console.log(
        'No patterns found in pattern-ignore.ts, falling back to defaults'
      )
      return DEFAULT_BUNDLE_IGNORE
    } catch (e) {
      console.error('Error loading pattern-ignore.ts:', e)
      return DEFAULT_BUNDLE_IGNORE
    }
  } catch (error) {
    console.error('Error in loadPatternIgnore:', error)
    return DEFAULT_BUNDLE_IGNORE
  }
}

export async function savePatternIgnore(
  cntxDir: FileSystemDirectoryHandle,
  patterns: string[]
): Promise<void> {
  try {
    const configDir = await cntxDir.getDirectoryHandle('config')
    console.log('Saving patterns to pattern-ignore.ts:', patterns)

    const content = `// .cntx/config/pattern-ignore.ts
export default [
  ${patterns.map((p) => `'${p}'`).join(',\n  ')}
] as const;
`

    const ignoreHandle = await configDir.getFileHandle('pattern-ignore.ts', {
      create: true,
    })
    const writable = await ignoreHandle.createWritable()
    await writable.write(content)
    await writable.close()

    console.log('Successfully saved patterns to pattern-ignore.ts')
  } catch (error) {
    console.error('Error saving pattern ignore:', error)
    throw error
  }
}
