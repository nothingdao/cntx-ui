// src/utils/config-utils.ts
import { WatchConfig, DEFAULT_CONFIG } from '../types/watch-config'

// Simple glob matching (can be enhanced later)
export function matchesPattern(path: string, pattern: string): boolean {
  // Convert glob pattern to regex
  const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*')
  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(path)
}

export function shouldIgnorePath(
  path: string,
  config: WatchConfig,
  isDirectory: boolean = false
): boolean {
  // If it's a directory, only check exact matches in ignore list
  if (isDirectory) {
    return config.ignore.includes(path)
  }

  // For files, check both exact matches and patterns
  if (
    config.ignore.some((pattern) => {
      return path.includes(pattern) || matchesPattern(path, pattern)
    })
  ) {
    return true
  }

  // If include patterns exist, path must match one
  if (config.include && config.include.length > 0) {
    return !config.include.some((pattern) => matchesPattern(path, pattern))
  }

  return false
}

export function parseConfigFile(content: string): WatchConfig {
  try {
    // Simple approach: look for export default {} and parse as JSON
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

export function validateConfig(config: any): WatchConfig {
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
