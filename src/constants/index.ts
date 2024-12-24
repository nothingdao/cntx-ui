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
