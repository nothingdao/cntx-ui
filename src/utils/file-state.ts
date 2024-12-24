// src/utils/file-state.ts
import type { WatchedFile, WatchState } from '../types/watcher'

export async function loadState(
  sourceryDir: FileSystemDirectoryHandle
): Promise<WatchState> {
  const stateDir = await sourceryDir.getDirectoryHandle('state')
  const handle = await stateDir.getFileHandle('file-status.json')
  const file = await handle.getFile()
  const content = await file.text()
  return JSON.parse(content)
}

export async function saveState(
  sourceryDir: FileSystemDirectoryHandle,
  state: WatchState
) {
  const stateDir = await sourceryDir.getDirectoryHandle('state')
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

export function generateBundleId(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const random = Math.random().toString(36).substring(2, 7)
  return `bundle-${timestamp}-${random}`
}

export async function createBundleFile(
  files: WatchedFile[],
  sourceryDir: FileSystemDirectoryHandle
): Promise<{ success: boolean; error?: string; bundleId?: string }> {
  try {
    const bundleId = generateBundleId()
    const timestamp = new Date().toISOString()

    // Create bundle content
    const bundleContent = files
      .map(
        (file) =>
          `<document>\n<source>${file.path}</source>\n<content>${file.content}</content>\n</document>`
      )
      .join('\n\n')

    // Save bundle file
    const bundlesDir = await sourceryDir.getDirectoryHandle('bundles')
    const bundleHandle = await bundlesDir.getFileHandle(`${bundleId}.txt`, {
      create: true,
    })
    const writable = await bundleHandle.createWritable()
    await writable.write(bundleContent)
    await writable.close()

    // Update state
    const state = await loadState(sourceryDir)
    files.forEach((file) => {
      state.files[file.path] = {
        lastBundled: bundleId,
        isStaged: false,
        bundleTimestamp: timestamp,
      }
    })

    await saveState(sourceryDir, state)

    return { success: true, bundleId }
  } catch (error) {
    console.error('Error creating bundle:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create bundle',
    }
  }
}
