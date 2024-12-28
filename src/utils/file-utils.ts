// src/utils/file-utils.ts
import { WatchedFile } from '@/types/types'
import { DEFAULT_BUNDLE_IGNORE } from '@/constants'

// src/utils/file-utils.ts
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/')
}

export function shouldIgnorePath(
  path: string,
  config: { ignore: string[]; include?: string[] },
  isDirectory: boolean = false
): boolean {
  const normalizedPath = path.toLowerCase().replace(/\\/g, '/')

  // Always ignore .rufas directory
  if (normalizedPath === '.rufas' || normalizedPath.startsWith('.rufas/')) {
    return true
  }

  return config.ignore.some((pattern) => {
    const normalizedPattern = pattern.toLowerCase().replace(/^\.\//, '')

    // Wildcard file extension patterns (e.g., *.mp3)
    if (pattern.startsWith('*.')) {
      const extension = pattern.slice(1).toLowerCase() // Keep the dot
      const result = normalizedPath.toLowerCase().endsWith(extension)
      return result
    }

    // Directory or exact file matches
    if (isDirectory) {
      const result =
        normalizedPath === normalizedPattern ||
        normalizedPath.startsWith(normalizedPattern + '/') ||
        normalizedPath.endsWith('/' + normalizedPattern) ||
        normalizedPath.includes('/' + normalizedPattern + '/')
      return result
    }

    // Exact file matches
    const result =
      normalizedPath === normalizedPattern ||
      normalizedPath.endsWith('/' + normalizedPattern)
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

export async function processDirectory(
  dirHandle: FileSystemDirectoryHandle,
  relativePath: string = '',
  ignorePatterns?: string[]
): Promise<WatchedFile[]> {
  console.log('Processing directory with ignore patterns:', ignorePatterns)

  const files: WatchedFile[] = []

  try {
    // During initialization, we use DEFAULT_BUNDLE_IGNORE
    // During normal watching, we use passed in ignorePatterns
    const patternsToUse = ignorePatterns || DEFAULT_BUNDLE_IGNORE

    for await (const entry of dirHandle.values()) {
      const entryPath = relativePath
        ? `${relativePath}/${entry.name}`
        : entry.name

      if (
        shouldIgnorePath(
          entryPath,
          { ignore: patternsToUse },
          entry.kind === 'directory'
        )
      ) {
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
  }

  return files
}
