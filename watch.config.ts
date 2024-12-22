// watch.config.ts
//
// This is the configuration file for the watch utility.
// Customize the "ignore" and "include" patterns as needed.
//
// Patterns in "ignore" will be excluded from being watched.
// Patterns in "include" will be explicitly included for watching.
//
// You can safely delete this file if you don't need it. It can be recreated with the default configuration if needed any time you revisit this directory.
// hello

export default {
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
} as const
