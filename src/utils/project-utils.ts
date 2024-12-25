// src/utils/project-utils.ts
// nice
import { DEFAULT_BUNDLE_IGNORE, DEFAULT_TAGS } from '../constants'
import type { WatchedFile, WatchState } from '../types/watcher'
import type { FileSystemDirectoryHandle } from '../types/filesystem'
import { TagsConfig } from '@/types/tags'
import { loadState, saveState, saveBundleManifest } from './file-state'
import { BundleManifest } from '@/types/bundle'

/**
 * Creates the initial .rufas directory structure and configuration
 * This is called once when a project is first set up
 */
export async function initializeProject(dirHandle: FileSystemDirectoryHandle) {
  try {
    // Create .rufas directory
    const rufasDir = await dirHandle.getDirectoryHandle('.rufas', {
      create: true,
    })

    // Create directory structure
    await createDirectoryStructure(rufasDir)

    // Create initial configuration
    await createInitialConfig(rufasDir)

    // Initialize state file
    await initializeStateFile(rufasDir)

    return { rufasDir }
  } catch (error) {
    console.error('Error initializing project:', error)
    throw new Error('Failed to initialize project: ' + (error as Error).message)
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

async function initializeStateFile(rufasDir: FileSystemDirectoryHandle) {
  const stateDir = await rufasDir.getDirectoryHandle('state', { create: true })

  // Create with new structure
  const initialState: WatchState = {
    lastAccessed: new Date().toISOString(),
    files: {}, // Will contain bundleHistory, lastModified, etc. per file
    tags: {},
    masterBundle: null, // No master bundle initially
  }

  const stateHandle = await stateDir.getFileHandle('file-status.json', {
    create: true,
  })
  const writable = await stateHandle.createWritable()
  await writable.write(JSON.stringify(initialState, null, 2))
  await writable.close()
}

/**
 * Creates an master bundle of all project files
 * This is typically called right after project initialization
 */
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
    const bundleContent = files
      .map(
        (file) =>
          `<document>\n<source>${file.path}</source>\n<content>${file.content}</content>\n</document>`
      )
      .join('\n\n')

    // Save the bundle
    const bundleHandle = await masterDir.getFileHandle(`${bundleId}.txt`, {
      create: true,
    })
    const writable = await bundleHandle.createWritable()
    await writable.write(bundleContent)
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

    // Update state
    state.masterBundle = {
      id: bundleId,
      created: timestamp,
      fileCount: files.length,
    }

    // Update file states
    files.forEach((file) => {
      if (!state.files[file.path]) {
        state.files[file.path] = {
          lastModified: file.lastModified.toISOString(),
          isStaged: false,
        }
      }
      state.files[file.path].masterBundleId = bundleId
    })

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

/**
 * Loads the bundle ignore patterns from the project configuration
 */
export async function loadBundleIgnore(
  rufasDir: FileSystemDirectoryHandle
): Promise<string[]> {
  try {
    const configDir = await rufasDir.getDirectoryHandle('config')
    const ignoreHandle = await configDir.getFileHandle('bundle-ignore.ts')
    const file = await ignoreHandle.getFile()
    const content = await file.text()
    // console.log('Loading bundle ignore content:', content)

    const match = content.match(/\[([\s\S]*?)\]/)
    if (!match) {
      console.log('No ignore patterns found, using defaults')
      return DEFAULT_BUNDLE_IGNORE
    }

    const arrayContent = match[1]
      .split(',')
      .map((item) => item.trim().replace(/["']/g, ''))
      .filter((item) => item.length > 0)

    // console.log('Loaded ignore patterns:', arrayContent)
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

    // Preserve the export default format
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

    // Extract the object part
    const match = content.match(/default\s*({[\s\S]*})\s*as const/)
    if (!match) return {}

    // Clean and evaluate the content directly
    const obj = eval('(' + match[1] + ')')
    return obj
  } catch (error) {
    console.error('Error loading tags:', error)
    return {}
  }
}
