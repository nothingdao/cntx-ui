// src/utils/watch-utils.ts
export type WatchState = {
  lastAccessed: string
  files: {
    [path: string]: {
      lastBundled: string | null
      isStaged: boolean
    }
  }
}

export async function initializeWatchDirectory(
  dirHandle: FileSystemDirectoryHandle
) {
  try {
    const watchDir = await dirHandle.getDirectoryHandle('.watch', {
      create: true,
    })
    const initialState: WatchState = {
      lastAccessed: new Date().toISOString(),
      files: {},
    }

    // Create state.json if it doesn't exist
    try {
      await watchDir.getFileHandle('state.json')
    } catch {
      const stateHandle = await watchDir.getFileHandle('state.json', {
        create: true,
      })
      const writable = await stateHandle.createWritable()
      await writable.write(JSON.stringify(initialState, null, 2))
      await writable.close()
    }

    return { watchDir, stateContent: initialState }
  } catch (error) {
    console.error('Error initializing .watch directory:', error)
    throw error
  }
}

export async function saveState(
  watchDir: FileSystemDirectoryHandle,
  state: WatchState
) {
  const stateHandle = await watchDir.getFileHandle('state.json', {
    create: true,
  })
  const writable = await stateHandle.createWritable()
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

export async function loadState(
  watchDir: FileSystemDirectoryHandle
): Promise<WatchState> {
  const stateHandle = await watchDir.getFileHandle('state.json')
  const file = await stateHandle.getFile()
  const content = await file.text()
  return JSON.parse(content)
}
