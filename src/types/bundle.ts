// src/types/bundle.ts
export interface BundleManifest {
  id: string
  created: string
  fileCount: number
  files: {
    path: string
    lastModified: string
  }[]
}

export interface Bundle {
  name: string
  timestamp: Date
  fileCount: number
}
