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
    // Create .rufas directory first
    const rufasDir = await dirHandle.getDirectoryHandle('.rufas', {
      create: true,
    })

    console.log('Creating directory structure...')
    // Create directory structure
    await createDirectoryStructure(rufasDir)

    console.log('Creating initial configuration...')
    // Create initial configuration
    await createInitialConfig(rufasDir)

    console.log('Scanning directory...')
    // Now process directory AFTER we've created all the necessary structure
    await new Promise((resolve) => setTimeout(resolve, 100)) // Small delay to ensure FS is ready
    const initialFiles = await processDirectory(dirHandle)

    console.log(`Found ${initialFiles.length} files, creating state...`)
    // Initialize state file with processed files
    await initializeStateFile(rufasDir, initialFiles)

    console.log('Initialization complete')
    return { rufasDir }
  } catch (error) {
    console.error('Error initializing project:', error)
    throw error
  }
}

async function createDirectoryStructure(rufasDir: FileSystemDirectoryHandle) {
  // Create all required directories
  await rufasDir.getDirectoryHandle('config', { create: true })
  const bundlesDir = await rufasDir.getDirectoryHandle('bundles', {
    create: true,
  })
  await bundlesDir.getDirectoryHandle('master', { create: true })
  await rufasDir.getDirectoryHandle('sent', { create: true })
  await rufasDir.getDirectoryHandle('state', { create: true })
}

async function createInitialConfig(rufasDir: FileSystemDirectoryHandle) {
  const configDir = await rufasDir.getDirectoryHandle('config')

  // Create bundle-ignore.ts
  const content = `// .rufas/config/bundle-ignore.ts
export default ${JSON.stringify(DEFAULT_BUNDLE_IGNORE, null, 2)} as const;
`
  const ignoreHandle = await configDir.getFileHandle('bundle-ignore.ts', {
    create: true,
  })
  const writable = await ignoreHandle.createWritable()
  await writable.write(content)
  await writable.close()

  // Create tags.ts with default tags
  const tagsContent = `// .rufas/config/tags.ts
export default ${JSON.stringify(DEFAULT_TAGS, null, 2)} as const;
`
  const tagsHandle = await configDir.getFileHandle('tags.ts', { create: true })
  const tagsWritable = await tagsHandle.createWritable()
  await tagsWritable.write(tagsContent)
  await tagsWritable.close()
}

async function initializeStateFile(
  rufasDir: FileSystemDirectoryHandle,
  initialFiles: WatchedFile[]
) {
  const stateDir = await rufasDir.getDirectoryHandle('state', { create: true })

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

export async function createMasterBundle(
  files: WatchedFile[],
  rufasDir: FileSystemDirectoryHandle
): Promise<{ success: boolean; error?: string; bundleId?: string }> {
  try {
    const state = await loadState(rufasDir)
    const bundleId = `master-${new Date().toISOString().replace(/[:.]/g, '-')}`
    const timestamp = new Date().toISOString()

    // Get the master bundle directory
    const bundlesDir = await rufasDir.getDirectoryHandle('bundles')
    const masterDir = await bundlesDir.getDirectoryHandle('master')

    // Create bundle content
    const bundleContent = files.map(async (file) => {
      const fileContent =
        (await file.handle?.getFile().then((f) => f.text())) || ''
      return `<document>\n<source>${file.path}</source>\n<content>${fileContent}</content>\n</document>`
    })
    const resolvedContent = await Promise.all(bundleContent)
    const finalContent = resolvedContent.join('\n\n')

    // Save the bundle
    const bundleHandle = await masterDir.getFileHandle(`${bundleId}.txt`, {
      create: true,
    })
    const writable = await bundleHandle.createWritable()
    await writable.write(finalContent)
    await writable.close()

    // Create and save manifest
    const manifest: BundleManifest = {
      id: bundleId,
      created: timestamp,
      fileCount: files.length,
      files: files.map((file) => ({
        path: file.path,
        lastModified: file.lastModified.toISOString(),
      })),
    }
    await saveBundleManifest(bundlesDir, manifest, true)

    // Update ALL files with their current state and masterBundleId
    files.forEach((file) => {
      state.files[file.path] = {
        name: file.name,
        directory: file.directory,
        lastModified: file.lastModified.toISOString(),
        isChanged: false,
        isStaged: false,
        masterBundleId: bundleId,
        tags: file.tags,
      }
    })

    state.masterBundle = {
      id: bundleId,
      created: timestamp,
      fileCount: files.length,
    }

    await saveState(rufasDir, state)
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

export async function loadBundleIgnore(
  rufasDir: FileSystemDirectoryHandle
): Promise<string[]> {
  try {
    const configDir = await rufasDir.getDirectoryHandle('config')
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
  rufasDir: FileSystemDirectoryHandle,
  tags: TagsConfig
) {
  try {
    const configDir = await rufasDir.getDirectoryHandle('config')
    const tagsHandle = await configDir.getFileHandle('tags.ts', {
      create: true,
    })
    const writable = await tagsHandle.createWritable()

    const content = `// .rufas/config/tags.ts
export default ${JSON.stringify(tags, null, 2)} as const;
`

    await writable.write(content)
    await writable.close()
  } catch (error) {
    console.error('Error saving tags config:', error)
  }
}

export async function loadTagsConfig(
  rufasDir: FileSystemDirectoryHandle
): Promise<TagsConfig> {
  try {
    const configDir = await rufasDir.getDirectoryHandle('config')
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

// Add these new functions to src/utils/project-utils.ts

export async function savePatternIgnore(
  rufasDir: FileSystemDirectoryHandle,
  patterns: string[]
): Promise<void> {
  try {
    const configDir = await rufasDir.getDirectoryHandle('config')
    const content = `// .rufas/config/pattern-ignore.ts
export default ${JSON.stringify(patterns, null, 2)} as const;
`

    const ignoreHandle = await configDir.getFileHandle('pattern-ignore.ts', {
      create: true,
    })
    const writable = await ignoreHandle.createWritable()
    await writable.write(content)
    await writable.close()

    // Try to remove the old file if it exists
    try {
      await configDir.removeEntry('bundle-ignore.ts')
    } catch (error) {
      // Ignore error if file doesn't exist
    }
  } catch (error) {
    console.error('Error saving pattern ignore:', error)
    throw error
  }
}

export async function loadPatternIgnore(
  rufasDir: FileSystemDirectoryHandle
): Promise<string[]> {
  try {
    const configDir = await rufasDir.getDirectoryHandle('config')

    // Prioritize pattern-ignore.ts over bundle-ignore.ts
    try {
      const ignoreHandle = await configDir.getFileHandle('pattern-ignore.ts')
      const file = await ignoreHandle.getFile()
      const content = await file.text()

      const match = content.match(/\[([\s\S]*?)\]/)
      if (match) {
        const arrayContent = match[1]
          .split(',')
          .map((item) => item.trim().replace(/["']/g, ''))
          .filter((item) => item.length > 0)

        // If custom patterns exist, return them
        if (arrayContent.length > 0) {
          return arrayContent
        }
      }
    } catch (customPatternError) {
      // If custom pattern file doesn't exist, continue to next check
    }

    // Fallback to default patterns only if no custom patterns are found
    return DEFAULT_BUNDLE_IGNORE
  } catch (error) {
    console.error('Error loading pattern ignore:', error)
    return DEFAULT_BUNDLE_IGNORE
  }
}
