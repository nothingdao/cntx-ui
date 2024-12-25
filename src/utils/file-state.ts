// src/utils/file-state.ts
// nice
import { BundleManifest } from '@/types/bundle'
import type { WatchedFile, WatchState } from '../types/watcher'

export async function loadState(
  rufasDir: FileSystemDirectoryHandle,
  retries: number = 3,
  retryDelay: number = 100
): Promise<WatchState> {
  try {
    const stateDir = await rufasDir.getDirectoryHandle('state')
    const handle = await stateDir.getFileHandle('file-status.json')
    const file = await handle.getFile()
    const content = await file.text()

    try {
      return JSON.parse(content)
    } catch (parseError) {
      console.error('Invalid JSON content:', content)
      console.error('Parse error:', parseError)
      throw parseError
    }
  } catch (error) {
    if (error.name === 'NotReadableError' && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
      return loadState(rufasDir, retries - 1, retryDelay)
    }
    throw error
  }
}

export async function saveState(
  rufasDir: FileSystemDirectoryHandle,
  state: WatchState
) {
  try {
    const stateDir = await rufasDir.getDirectoryHandle('state')
    const handle = await stateDir.getFileHandle('file-status.json', {
      create: true,
    })

    const writable = await handle.createWritable()
    const sanitizedState = {
      ...state,
      lastAccessed: new Date().toISOString(),
      files: Object.fromEntries(
        Object.entries(state.files).map(([path, fileState]) => [
          path,
          {
            masterBundleId: fileState.masterBundleId,
            lastModified: fileState.lastModified || new Date().toISOString(),
            isStaged: fileState.isStaged || false,
          },
        ])
      ),
      masterBundle: state.masterBundle || null,
    }

    await writable.write(JSON.stringify(sanitizedState, null, 2))
    await writable.close()
  } catch (error) {
    console.error('Error saving state:', error)
  }
}

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
  const manifestWritable = await manifestHandle.createWritable()
  await manifestWritable.write(JSON.stringify(manifest, null, 2))
  await manifestWritable.close()
}

export function generateBundleId(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const random = Math.random().toString(36).substring(2, 7)
  return `bundle-${timestamp}-${random}`
}

export async function createBundleFile(
  files: WatchedFile[],
  rufasDir: FileSystemDirectoryHandle
): Promise<{ success: boolean; error?: string; bundleId?: string }> {
  try {
    const bundleId = generateBundleId()
    const timestamp = new Date().toISOString()
    const bundlesDir = await rufasDir.getDirectoryHandle('bundles')

    // Create bundle content
    const bundleContent = files
      .map(
        (file) =>
          `<document>\n<source>${file.path}</source>\n<content>${file.content}</content>\n</document>`
      )
      .join('\n\n')

    // Save bundle file
    const bundleHandle = await bundlesDir.getFileHandle(`${bundleId}.txt`, {
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
    await saveBundleManifest(bundlesDir, manifest)

    // Update state (just to unset staged flags)
    const state = await loadState(rufasDir)
    files.forEach((file) => {
      if (!state.files[file.path]) {
        state.files[file.path] = {
          lastModified: file.lastModified.toISOString(),
          isStaged: false,
        }
      }
      state.files[file.path].isStaged = false
    })
    await saveState(rufasDir, state)

    return { success: true, bundleId }
  } catch (error) {
    console.error('Error creating bundle:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create bundle',
    }
  }
}
