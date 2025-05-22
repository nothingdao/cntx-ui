// src/utils/file-state.ts
import { BundleManifest, WatchedFile, WatchState } from '@/types/types'
import { shouldIgnorePath } from './file-utils'

export const DEFAULT_STATE: WatchState = {
  lastAccessed: new Date().toISOString(),
  files: {},
  masterBundle: null,
}

// export async function loadState(
//   cntxDir: FileSystemDirectoryHandle,
//   retries: number = 3,
//   retryDelay: number = 100
// ): Promise<WatchState> {
//   try {
//     const stateDir = await cntxDir.getDirectoryHandle('state')
//     const handle = await stateDir.getFileHandle('file.json')
//     const file = await handle.getFile()
//     const content = await file.text()

//     try {
//       // Attempt to parse the JSON content
//       const parsedState = JSON.parse(content)

//       // Validate and sanitize the state
//       const sanitizedState: WatchState = {
//         lastAccessed: parsedState.lastAccessed || new Date().toISOString(),
//         files: {},
//         masterBundle: parsedState.masterBundle || null,
//       }

//       // Sanitize file entries
//       if (parsedState.files && typeof parsedState.files === 'object') {
//         for (const [path, fileState] of Object.entries(parsedState.files)) {
//           if (fileState && typeof fileState === 'object') {
//             sanitizedState.files[path] = {
//               name: (fileState as any).name || path.split('/').pop() || '',
//               directory:
//                 (fileState as any).directory ||
//                 path.split('/').slice(0, -1).join('/') ||
//                 'Root',
//               lastModified:
//                 (fileState as any).lastModified || new Date().toISOString(),
//               isChanged: Boolean((fileState as any).isChanged),
//               isStaged: Boolean((fileState as any).isStaged),
//               masterBundleId: (fileState as any).masterBundleId,
//               tags: Array.isArray((fileState as any).tags)
//                 ? (fileState as any).tags
//                 : [],
//             }
//           }
//         }
//       }

//       return sanitizedState
//     } catch (parseError) {
//       console.error('Invalid JSON content:', content)
//       console.error('Parse error:', parseError)

//       // If parsing fails, return a fresh state
//       return { ...DEFAULT_STATE }
//     }
//   } catch (error) {
//     if (error.name === 'NotReadableError' && retries > 0) {
//       await new Promise((resolve) => setTimeout(resolve, retryDelay))
//       return loadState(cntxDir, retries - 1, retryDelay)
//     }

//     // If all retries fail, return a fresh state
//     return { ...DEFAULT_STATE }
//   }
// }

// export async function saveState(
//   cntxDir: FileSystemDirectoryHandle,
//   state: WatchState
// ) {
//   try {
//     const stateDir = await cntxDir.getDirectoryHandle('state')
//     const handle = await stateDir.getFileHandle('file.json', {
//       create: true,
//     })

//     // Create a sanitized copy of the state
//     const sanitizedState = {
//       lastAccessed: new Date().toISOString(),
//       files: Object.fromEntries(
//         Object.entries(state.files).map(([path, fileState]) => [
//           path,
//           {
//             name: fileState.name,
//             directory: fileState.directory,
//             lastModified: fileState.lastModified || new Date().toISOString(),
//             isChanged: Boolean(fileState.isChanged),
//             isStaged: Boolean(fileState.isStaged),
//             masterBundleId: fileState.masterBundleId,
//             tags: Array.isArray(fileState.tags) ? fileState.tags : [],
//           },
//         ])
//       ),
//       masterBundle: state.masterBundle || null,
//     }

//     const writable = await handle.createWritable()
//     const jsonContent = JSON.stringify(sanitizedState, null, 2)
//     await writable.write(jsonContent)
//     await writable.close()
//   } catch (error) {
//     console.error('Error saving state:', error)
//     // Attempt to recover by recreating the state file
//     try {
//       const stateDir = await cntxDir.getDirectoryHandle('state')
//       const handle = await stateDir.getFileHandle('file.json', {
//         create: true,
//       })
//       const writable = await handle.createWritable()
//       await writable.write(JSON.stringify(DEFAULT_STATE, null, 2))
//       await writable.close()
//     } catch (recoveryError) {
//       console.error('Failed to recover state file:', recoveryError)
//     }
//   }
// }

// New function to filter state based on ignore patterns
export function filterStateByPatterns(
  state: WatchState,
  ignorePatterns: string[]
): WatchState {
  const filteredFiles = Object.entries(state.files).reduce(
    (acc, [path, fileState]) => {
      if (!shouldIgnorePath(path, { ignore: ignorePatterns })) {
        acc[path] = fileState
      } else {
        console.log(
          `Filtering out ${path} from state file based on ignore patterns`
        )
      }
      return acc
    },
    {} as WatchState['files']
  )

  return {
    ...state,
    files: filteredFiles,
    lastAccessed: new Date().toISOString(),
  }
}

export async function loadState(
  cntxDir: FileSystemDirectoryHandle,
  ignorePatterns: string[],
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

      // Only include files that aren't ignored
      if (parsedState.files && typeof parsedState.files === 'object') {
        for (const [path, fileState] of Object.entries(parsedState.files)) {
          if (fileState && typeof fileState === 'object') {
            // Skip ignored files
            if (shouldIgnorePath(path, { ignore: ignorePatterns })) {
              console.log(`Skipping ignored file in state: ${path}`)
              continue
            }

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
              tags: Array.isArray((fileState as any).tags)
                ? (fileState as any).tags
                : [],
            }
          }
        }
      }

      return sanitizedState
    } catch (parseError) {
      console.error('Invalid JSON content:', content)
      console.error('Parse error:', parseError)
      return { ...DEFAULT_STATE }
    }
  } catch (error) {
    if (error.name === 'NotReadableError' && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
      return loadState(cntxDir, ignorePatterns, retries - 1, retryDelay)
    }
    return { ...DEFAULT_STATE }
  }
}

export async function saveState(
  cntxDir: FileSystemDirectoryHandle,
  state: WatchState,
  ignorePatterns: string[]
): Promise<void> {
  try {
    const stateDir = await cntxDir.getDirectoryHandle('state')
    const handle = await stateDir.getFileHandle('file.json', { create: true })

    // Filter the state before saving
    const filteredState = filterStateByPatterns(state, ignorePatterns)

    // Create a sanitized copy of the filtered state
    const sanitizedState = {
      lastAccessed: new Date().toISOString(),
      files: Object.fromEntries(
        Object.entries(filteredState.files).map(([path, fileState]) => [
          path,
          {
            name: fileState.name,
            directory: fileState.directory,
            lastModified: fileState.lastModified || new Date().toISOString(),
            isChanged: Boolean(fileState.isChanged),
            isStaged: Boolean(fileState.isStaged),
            masterBundleId: fileState.masterBundleId,
            tags: Array.isArray(fileState.tags) ? fileState.tags : [],
          },
        ])
      ),
      masterBundle: filteredState.masterBundle || null,
    }

    const writable = await handle.createWritable()
    const jsonContent = JSON.stringify(sanitizedState, null, 2)
    await writable.write(jsonContent)
    await writable.close()

    console.log(
      `Saved state file with ${Object.keys(sanitizedState.files).length} files`
    )
  } catch (error) {
    console.error('Error saving state:', error)
    // Attempt to recover by recreating the state file
    try {
      const stateDir = await cntxDir.getDirectoryHandle('state')
      const handle = await stateDir.getFileHandle('file.json', { create: true })
      const writable = await handle.createWritable()
      await writable.write(JSON.stringify(DEFAULT_STATE, null, 2))
      await writable.close()
    } catch (recoveryError) {
      console.error('Failed to recover state file:', recoveryError)
    }
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
  cntxDir: FileSystemDirectoryHandle
): Promise<{ success: boolean; error?: string; bundleId?: string }> {
  try {
    const bundleId = generateBundleId()
    const timestamp = new Date().toISOString()
    const bundlesDir = await cntxDir.getDirectoryHandle('bundles')

    // Update to use handle to read content and include tags
    const bundleContent = await Promise.all(
      files.map(async (file) => {
        const fileContent =
          (await file.handle?.getFile().then((f) => f.text())) || ''

        // Add tags element to the document
        const tagsString =
          file.tags && file.tags.length > 0
            ? `<tags>${file.tags.join(',')}</tags>`
            : '<tags></tags>'

        return `<document>\n<source>${file.path}</source>\n${tagsString}\n<content>${fileContent}</content>\n</document>`
      })
    )

    const bundleHandle = await bundlesDir.getFileHandle(`${bundleId}.txt`, {
      create: true,
    })
    const writable = await bundleHandle.createWritable()
    await writable.write(bundleContent.join('\n\n'))
    await writable.close()

    const manifest: BundleManifest = {
      id: bundleId,
      created: timestamp,
      fileCount: files.length,
      files: files.map((file) => ({
        path: file.path,
        lastModified: file.lastModified.toISOString(),
        // Consider updating the manifest to include tags as well
        tags: file.tags || [],
      })),
    }
    await saveBundleManifest(bundlesDir, manifest)

    const state = await loadState(cntxDir)
    files.forEach((file) => {
      if (!state.files[file.path]) {
        state.files[file.path] = {
          name: file.name,
          directory: file.directory,
          lastModified: file.lastModified.toISOString(),
          isChanged: false,
          isStaged: false,
          masterBundleId: undefined,
          tags: file.tags || [],
        }
      } else {
        state.files[file.path].isStaged = false
      }
    })
    await saveState(cntxDir, state)

    return { success: true, bundleId }
  } catch (error) {
    console.error('Error creating bundle:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create bundle',
    }
  }
}
