// src/types/watch-config.ts
export type WatchConfig = {
  ignore: string[] // Patterns to ignore
  include?: string[] // Optional patterns to include
}

export const DEFAULT_CONFIG: WatchConfig = {
  ignore: [
    'node_modules',
    'dist',
    '.git',
    'build',
    'coverage',
    '.next',
    '.cache',
    'package-lock.json',
    'yarn.lock',
  ],
  include: ['*.ts', '*.tsx', '*.js', '*.jsx', '*.md', '*.json'],
}
