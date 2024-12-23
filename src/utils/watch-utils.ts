// src/utils/watch-utils.ts
import type { WatchedFile } from '../types/watcher'

export const DEFAULT_BUNDLE_IGNORE = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.cache',
  'package-lock.json',
  'yarn.lock',
  'example-project',
  '.DS_Store',
]

export type WatchState = {
  lastAccessed: string
  initialBundle?: {
    bundleId: string
    fileCount: number
  }
  files: {
    [path: string]: {
      lastBundleId: string | null
      lastSentId: string | null
      isStaged: boolean
      bundleTimestamp?: string
    }
  }
}

// Create a unique bundle ID with timestamp prefix for ordering
function generateBundleId(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const random = Math.random().toString(36).substring(2, 7)
  return `bundle-${timestamp}-${random}`
}

export async function loadBundleIgnore(
  watchDir: FileSystemDirectoryHandle
): Promise<string[]> {
  try {
    const configDir = await watchDir.getDirectoryHandle('config')
    const ignoreHandle = await configDir.getFileHandle('bundle-ignore.ts')
    const file = await ignoreHandle.getFile()
    const content = await file.text()

    const match = content.match(/\[([\s\S]*?)\]/)
    if (!match) {
      return DEFAULT_BUNDLE_IGNORE
    }

    const arrayContent = match[1]
      .split(',')
      .map((item) => item.trim().replace(/"/g, ''))
      .filter((item) => item.length > 0)

    return arrayContent
  } catch (error) {
    console.error('Error loading bundle ignore patterns:', error)
    return DEFAULT_BUNDLE_IGNORE
  }
}

export async function initializeWatchDirectory(
  dirHandle: FileSystemDirectoryHandle
) {
  // Create .sourcery directory
  const watchDir = await dirHandle.getDirectoryHandle('.sourcery', {
    create: true,
  })

  // Create config directory and bundle-ignore
  const configDir = await watchDir.getDirectoryHandle('config', {
    create: true,
  })
  await createBundleIgnore(configDir)

  // Create other directories
  await watchDir.getDirectoryHandle('state', { create: true })
  const bundlesDir = await watchDir.getDirectoryHandle('bundles', {
    create: true,
  })
  await bundlesDir.getDirectoryHandle('initial', { create: true })
  await watchDir.getDirectoryHandle('sent', { create: true })

  // Initialize state file
  const stateDir = await watchDir.getDirectoryHandle('state')
  await initializeState(stateDir)

  return { watchDir }
}

async function createBundleIgnore(configDir: FileSystemDirectoryHandle) {
  const content = `// .sourcery/config/bundle-ignore.ts
export default ${JSON.stringify(DEFAULT_BUNDLE_IGNORE, null, 2)} as const;
`
  const handle = await configDir.getFileHandle('bundle-ignore.ts', {
    create: true,
  })
  const writable = await handle.createWritable()
  await writable.write(content)
  await writable.close()
}

async function initializeState(stateDir: FileSystemDirectoryHandle) {
  const initialState: WatchState = {
    lastAccessed: new Date().toISOString(),
    files: {},
  }

  const handle = await stateDir.getFileHandle('file-status.json', {
    create: true,
  })
  const writable = await handle.createWritable()
  await writable.write(JSON.stringify(initialState, null, 2))
  await writable.close()
}

export async function saveState(
  watchDir: FileSystemDirectoryHandle,
  state: WatchState
) {
  const stateDir = await watchDir.getDirectoryHandle('state')
  const handle = await stateDir.getFileHandle('file-status.json', {
    create: true,
  })
  const writable = await handle.createWritable()
  await writable.write(
    JSON.stringify(
      {
        ...state,
        lastAccessed: new Date().toISOString(),
      },
      null,
      2
    )
  )
  await writable.close()
}

export async function createInitialBundle(
  watchedFiles: WatchedFile[],
  watchDir: FileSystemDirectoryHandle,
  bundleContent: string
): Promise<{ success: boolean; error?: string; bundleId?: string }> {
  try {
    const bundleId = generateBundleId()
    const timestamp = new Date().toISOString()
    const bundlesDir = await watchDir.getDirectoryHandle('bundles')
    const initialDir = await bundlesDir.getDirectoryHandle('initial')

    // Create the initial bundle file
    const bundleHandle = await initialDir.getFileHandle(`${bundleId}.txt`, {
      create: true,
    })
    const writable = await bundleHandle.createWritable()
    await writable.write(bundleContent)
    await writable.close()

    // Create a manifest file with metadata
    const manifestHandle = await initialDir.getFileHandle(
      `${bundleId}-manifest.json`,
      {
        create: true,
      }
    )
    const manifestWritable = await manifestHandle.createWritable()
    const manifest = {
      bundleId,
      created: timestamp,
      fileCount: watchedFiles.length,
      files: watchedFiles.map((file) => ({
        path: file.path,
        lastModified: file.lastModified.toISOString(),
      })),
    }
    await manifestWritable.write(JSON.stringify(manifest, null, 2))
    await manifestWritable.close()

    // Update state file
    const stateDir = await watchDir.getDirectoryHandle('state')
    const stateHandle = await stateDir.getFileHandle('file-status.json')
    const file = await stateHandle.getFile()
    const state: WatchState = JSON.parse(await file.text())

    // Update state with initial bundle info
    state.initialBundle = {
      bundleId,
      fileCount: watchedFiles.length,
    }

    // Update file statuses
    watchedFiles.forEach((file) => {
      state.files[file.path] = {
        lastBundleId: bundleId,
        lastSentId: null,
        isStaged: false,
        bundleTimestamp: timestamp,
      }
    })

    await saveState(watchDir, state)

    return { success: true, bundleId }
  } catch (error) {
    console.error('Error creating initial bundle:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create initial bundle',
    }
  }
}

export async function createBundle(
  watchedFiles: WatchedFile[],
  watchDir: FileSystemDirectoryHandle,
  bundleContent: string
): Promise<{ success: boolean; error?: string; bundleId?: string }> {
  try {
    const bundleId = generateBundleId()
    const timestamp = new Date().toISOString()
    const bundlesDir = await watchDir.getDirectoryHandle('bundles')

    // Create the bundle file
    const bundleHandle = await bundlesDir.getFileHandle(`${bundleId}.txt`, {
      create: true,
    })
    const writable = await bundleHandle.createWritable()
    await writable.write(bundleContent)
    await writable.close()

    // Update state
    const state = await loadState(watchDir)
    watchedFiles.forEach((file) => {
      state.files[file.path] = {
        ...state.files[file.path],
        lastBundleId: bundleId,
        isStaged: false,
        bundleTimestamp: timestamp,
      }
    })

    await saveState(watchDir, state)

    return { success: true, bundleId }
  } catch (error) {
    console.error('Error creating bundle:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create bundle',
    }
  }
}

export async function loadState(
  watchDir: FileSystemDirectoryHandle
): Promise<WatchState> {
  const stateDir = await watchDir.getDirectoryHandle('state')
  const handle = await stateDir.getFileHandle('file-status.json')
  const file = await handle.getFile()
  const content = await file.text()
  return JSON.parse(content)
}
