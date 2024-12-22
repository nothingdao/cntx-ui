// src/utils/config-utils.ts
import { WatchConfig, DEFAULT_CONFIG } from '../types/watch-config'

export function shouldIgnorePath(
  path: string,
  config: { ignore: string[]; include?: string[] }
): boolean {
  return config.ignore.some((pattern) => {
    const normalizedPattern = pattern.replace(/^\.\//, '') // Remove leading ./
    return (
      path.startsWith(normalizedPattern) ||
      path.includes('/' + normalizedPattern + '/')
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
