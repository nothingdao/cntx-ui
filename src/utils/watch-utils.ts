// src/utils/watch-utils.ts
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
]

export type WatchState = {
  lastAccessed: string
  files: {
    [path: string]: {
      lastBundled: string | null
      isStaged: boolean
    }
  }
}

export async function loadBundleIgnore(
  watchDir: FileSystemDirectoryHandle
): Promise<string[]> {
  try {
    const configDir = await watchDir.getDirectoryHandle('config')
    const ignoreHandle = await configDir.getFileHandle('bundle-ignore.ts')
    const file = await ignoreHandle.getFile()
    const content = await file.text()

    // Extract the array from the default export
    const match = content.match(/export\s+default\s+(\[[\s\S]*?\])\s+as/)
    if (!match) {
      console.warn('Could not parse bundle-ignore.ts, using defaults')
      return DEFAULT_BUNDLE_IGNORE
    }

    try {
      const patterns = JSON.parse(match[1])
      return patterns
    } catch {
      console.warn('Could not parse ignore patterns, using defaults')
      return DEFAULT_BUNDLE_IGNORE
    }
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
  dirHandle: FileSystemDirectoryHandle,
  files: string[]
) {
  const watchDir = await dirHandle.getDirectoryHandle('.sourcery')
  const bundlesDir = await watchDir.getDirectoryHandle('bundles')
  const initialDir = await bundlesDir.getDirectoryHandle('initial')

  // Create the bundle file
  const bundleHandle = await initialDir.getFileHandle('initial-bundle.json', {
    create: true,
  })
  const writable = await bundleHandle.createWritable()
  await writable.write(
    JSON.stringify(
      {
        created: new Date().toISOString(),
        files,
      },
      null,
      2
    )
  )
  await writable.close()

  // Update state to reflect initial bundle
  const stateDir = await watchDir.getDirectoryHandle('state')
  const stateHandle = await stateDir.getFileHandle('file-status.json')
  const file = await stateHandle.getFile()
  const state: WatchState = JSON.parse(await file.text())

  // Mark all files as bundled
  files.forEach((filePath) => {
    state.files[filePath] = {
      lastBundled: new Date().toISOString(),
      isStaged: false,
    }
  })

  await saveState(watchDir, state)

  return files.length
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
