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
  'issues',
]

export const DEFAULT_TAGS: Record<
  string,
  { color: string; description: string }
> = {
  application: {
    color: '#0ea5e9', // sky-500
    description: 'Main application code and logic',
  },
  infrastructure: {
    color: '#f97316', // orange-500
    description: 'Deployment, CI/CD, infrastructure-as-code',
  },
  configuration: {
    color: '#94a3b8', // slate-400
    description: 'Build, tooling, and environment configuration',
  },
  documentation: {
    color: '#8b5cf6', // violet-500
    description: 'Documentation, markdown files, and comments',
  },
  testing: {
    color: '#22c55e', // green-500
    description: 'Unit tests, integration tests, and mocks',
  },
  assets: {
    color: '#78716c', // stone-500
    description: 'Static files, images, media, and fonts',
  },
  libraries: {
    color: '#ec4899', // pink-500
    description: 'Shared utilities, helper functions, and internal packages',
  },
  types: {
    color: '#6366f1', // indigo-500
    description: 'Type definitions and interfaces',
  },
}
