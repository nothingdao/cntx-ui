// src/utils/file-utils.ts
import { WatchedFile } from '@/types/types'
import { DEFAULT_BUNDLE_IGNORE } from '@/constants'

// src/utils/file-utils.ts
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/')
}

// export function shouldIgnorePath(
//   path: string,
//   config: { ignore: string[]; include?: string[] },
//   isDirectory: boolean = false
// ): boolean {
//   const normalizedPath = path.toLowerCase().replace(/\\/g, '/')

//   // Always ignore .cntx directory
//   if (normalizedPath === '.cntx' || normalizedPath.startsWith('.cntx/')) {
//     return true
//   }

//   // For debugging
//   let matchedPattern = ''
//   let shouldIgnore = false

//   shouldIgnore = config.ignore.some((pattern) => {
//     const normalizedPattern = pattern.toLowerCase().replace(/^\.\//, '')

//     // Wildcard file extension patterns (e.g., *.mp3)
//     if (pattern.startsWith('*.')) {
//       const extension = pattern.slice(1).toLowerCase() // Keep the dot
//       const result = normalizedPath.toLowerCase().endsWith(extension)
//       if (result) matchedPattern = pattern
//       return result
//     }

//     // Directory or exact file matches
//     if (isDirectory) {
//       const result =
//         normalizedPath === normalizedPattern ||
//         normalizedPath.startsWith(normalizedPattern + '/') ||
//         normalizedPath.endsWith('/' + normalizedPattern) ||
//         normalizedPath.includes('/' + normalizedPattern + '/')
//       if (result) matchedPattern = pattern
//       return result
//     }

//     // Exact file matches
//     const result =
//       normalizedPath === normalizedPattern ||
//       normalizedPath.endsWith('/' + normalizedPattern)
//     if (result) matchedPattern = pattern
//     return result
//   })

//   if (shouldIgnore) {
//     console.log(
//       `Ignoring ${
//         isDirectory ? 'directory' : 'file'
//       }: ${path} (matched pattern: ${matchedPattern})`
//     )
//   }

//   return shouldIgnore
// }

export function shouldIgnorePath(
  path: string,
  config: { ignore: string[] },
  isDirectory: boolean = false
): boolean {
  const normalizedPath = path.toLowerCase().replace(/\\/g, '/')

  // Always ignore .cntx directory and its contents
  if (normalizedPath === '.cntx' || normalizedPath.startsWith('.cntx/')) {
    return true
  }

  // Cache the normalized patterns for better performance
  const normalizedPatterns = config.ignore.map((pattern) => ({
    original: pattern,
    normalized: pattern.toLowerCase().replace(/^\.\//, ''),
  }))

  return normalizedPatterns.some(({ original, normalized }) => {
    // Handle wildcard file extension patterns (e.g., *.js)
    if (original.startsWith('*.')) {
      const extension = normalized.slice(1) // Keep the dot
      const result = normalizedPath.endsWith(extension)
      if (result) {
        console.log(`Path "${path}" matches extension pattern "${original}"`)
      }
      return result
    }

    // Handle directory matching
    if (isDirectory) {
      const result =
        normalizedPath === normalized ||
        normalizedPath.startsWith(normalized + '/') ||
        normalizedPath.endsWith('/' + normalized) ||
        normalizedPath.includes('/' + normalized + '/')

      if (result) {
        console.log(`Directory "${path}" matches pattern "${original}"`)
      }
      return result
    }

    // Handle exact file matches
    const result =
      normalizedPath === normalized || normalizedPath.endsWith('/' + normalized)

    if (result) {
      console.log(`File "${path}" matches pattern "${original}"`)
    }
    return result
  })
}

export function getPathParts(fullPath: string) {
  const normalizedPath = normalizePath(fullPath)
  const parts = normalizedPath.split('/')
  const name = parts.pop() || ''
  const directory = parts.length > 0 ? parts.join('/') : 'Root'

  return {
    name,
    directory,
    path: normalizedPath,
  }
}

export function getAllDirectories(paths: string[]): string[] {
  const directories = new Set<string>()
  directories.add('Root')

  paths.forEach((path) => {
    const parts = normalizePath(path).split('/')
    // Remove the file name
    parts.pop()

    // Add each level of directory
    let currentPath = ''
    parts.forEach((part) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part
      directories.add(currentPath)
    })
  })

  return Array.from(directories).sort((a, b) => a.localeCompare(b))
}

// export async function processDirectory(
//   dirHandle: FileSystemDirectoryHandle,
//   relativePath: string = '',
//   ignorePatterns?: string[]
// ): Promise<WatchedFile[]> {
//   // console.log('Processing directory with ignore patterns:', ignorePatterns)
//   console.log('Processing directory with ignore patterns:', ignorePatterns)

//   const files: WatchedFile[] = []

//   try {
//     const patternsToUse = Array.isArray(ignorePatterns)
//       ? ignorePatterns
//       : DEFAULT_BUNDLE_IGNORE

//     // console.log('patternsToUse:', patternsToUse)
//     console.log('Using patterns:', patternsToUse)

//     for await (const entry of dirHandle.values()) {
//       const entryPath = relativePath
//         ? `${relativePath}/${entry.name}`
//         : entry.name

//       if (
//         shouldIgnorePath(
//           entryPath,
//           { ignore: patternsToUse },
//           entry.kind === 'directory'
//         )
//       ) {
//         // Log what's being ignored for debugging
//         if (entry.kind === 'directory') {
//           console.log(`Ignoring directory: ${entryPath}`)
//         }
//         continue
//       }

//       if (entry.kind === 'file') {
//         const handle = entry
//         const file = await handle.getFile()
//         const { name, directory, path } = getPathParts(entryPath)

//         files.push({
//           path,
//           name,
//           directory,
//           lastModified: new Date(file.lastModified),
//           isChanged: false,
//           isStaged: false,
//           handle,
//           tags: [],
//         })
//       } else if (entry.kind === 'directory') {
//         const subFiles = await processDirectory(
//           entry as FileSystemDirectoryHandle,
//           entryPath,
//           patternsToUse
//         )
//         files.push(...subFiles)
//       }
//     }
//   } catch (error) {
//     console.error('Error processing directory:', error)
//   }

//   return files
// }

export async function processDirectory(
  dirHandle: FileSystemDirectoryHandle,
  relativePath: string = '',
  ignorePatterns: string[] = []
): Promise<WatchedFile[]> {
  const files: WatchedFile[] = []

  // Ensure we have patterns to use
  const patternsToUse =
    Array.isArray(ignorePatterns) && ignorePatterns.length > 0
      ? ignorePatterns
      : DEFAULT_BUNDLE_IGNORE

  console.log(
    `Processing directory "${relativePath}" with patterns:`,
    patternsToUse
  )

  try {
    for await (const entry of dirHandle.values()) {
      const entryPath = relativePath
        ? `${relativePath}/${entry.name}`
        : entry.name

      // Check if path should be ignored
      if (
        shouldIgnorePath(
          entryPath,
          { ignore: patternsToUse },
          entry.kind === 'directory'
        )
      ) {
        console.log(`Ignoring path: ${entryPath}`)
        continue
      }

      if (entry.kind === 'file') {
        const handle = entry
        const file = await handle.getFile()
        const { name, directory, path } = getPathParts(entryPath)

        files.push({
          path,
          name,
          directory,
          lastModified: new Date(file.lastModified),
          isChanged: false,
          isStaged: false,
          handle,
          tags: [],
        })
      } else if (entry.kind === 'directory') {
        // Only process subdirectory if it's not ignored
        const subFiles = await processDirectory(
          entry as FileSystemDirectoryHandle,
          entryPath,
          patternsToUse
        )
        files.push(...subFiles)
      }
    }
  } catch (error) {
    console.error('Error processing directory:', error)
    console.error('Path:', relativePath)
    console.error('Patterns:', patternsToUse)
  }

  return files
}
