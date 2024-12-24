// src/utils/config-utils.ts
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
      return normalizedPath.toLowerCase().endsWith(extension)
    }

    // Directory or exact file matches
    if (isDirectory) {
      return (
        normalizedPath === normalizedPattern ||
        normalizedPath.startsWith(normalizedPattern + '/') ||
        normalizedPath.endsWith('/' + normalizedPattern) ||
        normalizedPath.includes('/' + normalizedPattern + '/')
      )
    }

    // Exact file matches
    return (
      normalizedPath === normalizedPattern ||
      normalizedPath.endsWith('/' + normalizedPattern)
    )
  })
}
