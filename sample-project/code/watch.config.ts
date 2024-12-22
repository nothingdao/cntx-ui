// watch.config.ts
// This is the configuration file for the watch utility.
// Customize the "ignore" and "include" patterns as needed.
//
// Patterns in "ignore" will be excluded from being watched.
// Patterns in "include" will be explicitly included for watching.

export default {
  "ignore": [
    "node_modules",
    "dist",
    ".git",
    "build",
    "coverage",
    ".next",
    ".cache",
    "package-lock.json",
    "yarn.lock"
  ],
  "include": [
    "*.ts",
    "*.tsx",
    "*.js",
    "*.jsx",
    "*.md",
    "*.json"
  ]
} as const;
