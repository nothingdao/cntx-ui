// src/utils/config-utils.ts
import { WatchConfig, DEFAULT_CONFIG } from '../types/watch-config'

export function shouldIgnorePath(
  path: string,
  config: { ignore: string[]; include?: string[] },
  isDirectory: boolean = false
): boolean {
  // Debug log BEFORE any modifications
  console.log('shouldIgnorePath called with:', {
    originalPath: path,
    patterns: config.ignore,
    isDirectory,
  })

  // Normalize path for consistency
  const normalizedPath = path.toLowerCase().replace(/\\/g, '/')

  // Debug log AFTER normalization
  console.log('Normalized path:', normalizedPath)

  // Rest of your function stays exactly the same
  if (
    normalizedPath === '.sourcery' ||
    normalizedPath.startsWith('.sourcery/')
  ) {
    return true
  }

  return config.ignore.some((pattern) => {
    // Normalize pattern for consistency
    const normalizedPattern = pattern.toLowerCase().replace(/^\.\//, '')

    // Debug log for each pattern check
    console.log('Checking against pattern:', normalizedPattern)

    if (isDirectory) {
      // For directories, check if the path matches exactly or is a subdirectory
      return (
        normalizedPath === normalizedPattern ||
        normalizedPath.startsWith(normalizedPattern + '/') ||
        normalizedPath.endsWith('/' + normalizedPattern) ||
        normalizedPath.includes('/' + normalizedPattern + '/')
      )
    }

    // For files, check if the path matches the pattern
    return (
      normalizedPath === normalizedPattern ||
      normalizedPath.includes('/' + normalizedPattern) ||
      normalizedPath.startsWith(normalizedPattern + '/')
    )
  })
}

export function parseConfigFile(content: string): WatchConfig {
  try {
    const match = content.match(/export\s+default\s+({[\s\S]*?});/)
    if (!match) {
      console.warn('Could not parse config file, using defaults')
      return DEFAULT_CONFIG
    }

    const configObject = JSON.parse(match[1].replace(/\s+/g, ' '))

    return validateConfig(configObject)
  } catch (error) {
    console.error('Error parsing config:', error)
    return DEFAULT_CONFIG
  }
}

export function validateConfig(config: Partial<WatchConfig>): WatchConfig {
  const validatedConfig: WatchConfig = {
    ignore: Array.isArray(config.ignore)
      ? config.ignore
      : DEFAULT_CONFIG.ignore,
    include: Array.isArray(config.include)
      ? config.include
      : DEFAULT_CONFIG.include,
  }

  return validatedConfig
}

export function createConfigContent(config: WatchConfig): string {
  return `// watch.config.ts
// This is the configuration file for the watch utility.
// Customize the "ignore" and "include" patterns as needed.
//
// Patterns in "ignore" will be excluded from being watched.
// Patterns in "include" will be explicitly included for watching.

export default ${JSON.stringify(config, null, 2)} as const;
`
}
