// src/constants/index.ts

export const DEFAULT_BUNDLE_IGNORE = [
  // Directories
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.cache',
  '.netlify',

  // Package files
  'package-lock.json',
  'yarn.lock',

  // System files
  '.DS_Store',
  'Thumbs.db',

  // Media files
  '*.mp3',
  '*.mp4',
  '*.wav',
  '*.ogg',
  '*.m4a',
  '*.flac',
  '*.jpg',
  '*.jpeg',
  '*.png',
  '*.gif',
  '*.webp',
  '*.svg',
  '*.ico',
  '*.pxd',

  // Documents and archives
  '*.pdf',
  '*.doc',
  '*.docx',
  '*.zip',
  '*.tar',
  '*.gz',
  '*.rar',

  // Other
  'example-project',
]

export const DEFAULT_TAGS: Record<
  string,
  { color: string; description: string }
> = {
  feature: {
    color: '#0ea5e9', // sky-500
    description: 'New features and enhancements',
  },
  bug: {
    color: '#ef4444', // red-500
    description: 'Bug fixes and patches',
  },
  docs: {
    color: '#8b5cf6', // violet-500
    description: 'Documentation and comments',
  },
  test: {
    color: '#22c55e', // green-500
    description: 'Test files and testing utilities',
  },
  core: {
    color: '#f59e0b', // amber-500
    description: 'Core application logic',
  },
  util: {
    color: '#64748b', // slate-500
    description: 'Utility functions and helpers',
  },
  component: {
    color: '#ec4899', // pink-500
    description: 'UI Components',
  },
  type: {
    color: '#6366f1', // indigo-500
    description: 'Type definitions and interfaces',
  },
  config: {
    color: '#94a3b8', // slate-400
    description: 'Configuration files',
  },
  asset: {
    color: '#78716c', // stone-500
    description: 'Static assets and resources',
  },
}
