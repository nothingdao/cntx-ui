// src/utils/project-utils.ts
import { DEFAULT_BUNDLE_IGNORE, DEFAULT_TAGS } from '../constants'
import type { WatchedFile, WatchState } from '../types/watcher'
import type { FileSystemDirectoryHandle } from '../types/filesystem'
import { TagsConfig } from '@/types/tags'

/**
 * Creates the initial .sourcery directory structure and configuration
 * This is called once when a project is first set up
 */
export async function initializeProject(dirHandle: FileSystemDirectoryHandle) {
  try {
    // Create .sourcery directory
    const sourceryDir = await dirHandle.getDirectoryHandle('.sourcery', {
      create: true,
    })

    // Create directory structure
    await createDirectoryStructure(sourceryDir)

    // Create initial configuration
    await createInitialConfig(sourceryDir)

    // Initialize state file
    await initializeStateFile(sourceryDir)

    return { sourceryDir }
  } catch (error) {
    console.error('Error initializing project:', error)
    throw new Error('Failed to initialize project: ' + (error as Error).message)
  }
}

async function createDirectoryStructure(
  sourceryDir: FileSystemDirectoryHandle
) {
  // Create all required directories
  await sourceryDir.getDirectoryHandle('config', { create: true })
  const bundlesDir = await sourceryDir.getDirectoryHandle('bundles', {
    create: true,
  })
  await bundlesDir.getDirectoryHandle('master', { create: true })
  await sourceryDir.getDirectoryHandle('sent', { create: true })
  await sourceryDir.getDirectoryHandle('state', { create: true })
}

async function createInitialConfig(sourceryDir: FileSystemDirectoryHandle) {
  const configDir = await sourceryDir.getDirectoryHandle('config')

  // Create bundle-ignore.ts
  const content = `// .sourcery/config/bundle-ignore.ts
export default ${JSON.stringify(DEFAULT_BUNDLE_IGNORE, null, 2)} as const;
`
  const ignoreHandle = await configDir.getFileHandle('bundle-ignore.ts', {
    create: true,
  })
  const writable = await ignoreHandle.createWritable()
  await writable.write(content)
  await writable.close()

  // Create tags.ts with default tags
  const tagsContent = `// .sourcery/config/tags.ts
export default ${JSON.stringify(DEFAULT_TAGS, null, 2)} as const;
`
  const tagsHandle = await configDir.getFileHandle('tags.ts', { create: true })
  const tagsWritable = await tagsHandle.createWritable()
  await tagsWritable.write(tagsContent)
  await tagsWritable.close()
}

async function initializeStateFile(sourceryDir: FileSystemDirectoryHandle) {
  const stateDir = await sourceryDir.getDirectoryHandle('state')

  const initialState: WatchState = {
    lastAccessed: new Date().toISOString(),
    files: {},
    tags: {},
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
  sourceryDir: FileSystemDirectoryHandle
): Promise<{ success: boolean; error?: string; bundleId?: string }> {
  try {
    const bundleId = `master-${new Date().toISOString().replace(/[:.]/g, '-')}`
    const timestamp = new Date().toISOString()

    // Get the master bundle directory
    const bundlesDir = await sourceryDir.getDirectoryHandle('bundles')
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

    // Save manifest for reference
    const manifest = {
      bundleId,
      created: timestamp,
      fileCount: files.length,
      files: files.map((f) => ({ path: f.path })),
    }

    const manifestHandle = await masterDir.getFileHandle(
      `${bundleId}-manifest.json`,
      { create: true }
    )
    const manifestWritable = await manifestHandle.createWritable()
    await manifestWritable.write(JSON.stringify(manifest, null, 2))
    await manifestWritable.close()

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
  sourceryDir: FileSystemDirectoryHandle
): Promise<string[]> {
  try {
    const configDir = await sourceryDir.getDirectoryHandle('config')
    const ignoreHandle = await configDir.getFileHandle('bundle-ignore.ts')
    const file = await ignoreHandle.getFile()
    const content = await file.text()
    console.log('Loading bundle ignore content:', content)

    const match = content.match(/\[([\s\S]*?)\]/)
    if (!match) {
      console.log('No ignore patterns found, using defaults')
      return DEFAULT_BUNDLE_IGNORE
    }

    const arrayContent = match[1]
      .split(',')
      .map((item) => item.trim().replace(/["']/g, ''))
      .filter((item) => item.length > 0)

    console.log('Loaded ignore patterns:', arrayContent)
    return arrayContent
  } catch (error) {
    console.error('Error loading bundle ignore patterns:', error)
    console.log('Using default ignore patterns:', DEFAULT_BUNDLE_IGNORE)
    return DEFAULT_BUNDLE_IGNORE
  }
}

export async function saveTagsConfig(
  sourceryDir: FileSystemDirectoryHandle,
  tags: TagsConfig
) {
  try {
    const configDir = await sourceryDir.getDirectoryHandle('config')
    const tagsHandle = await configDir.getFileHandle('tags.ts', {
      create: true,
    })
    const writable = await tagsHandle.createWritable()

    // Preserve the export default format
    const content = `// .sourcery/config/tags.ts
export default ${JSON.stringify(tags, null, 2)} as const;
`

    await writable.write(content)
    await writable.close()
  } catch (error) {
    console.error('Error saving tags config:', error)
  }
}

export async function loadTagsConfig(
  sourceryDir: FileSystemDirectoryHandle
): Promise<TagsConfig> {
  try {
    const configDir = await sourceryDir.getDirectoryHandle('config')
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
