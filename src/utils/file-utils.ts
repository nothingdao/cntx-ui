// src/utils/file-utils.ts
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/')
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

// Get all directories including parent directories
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
