// src/types/filesystem.ts
export interface FileSystemHandle {
  kind: 'file' | 'directory'
  name: string
}

export interface FileSystemCreateWritableOptions {
  keepExistingData?: boolean
}

export interface FileSystemFileHandle extends FileSystemHandle {
  kind: 'file'
  getFile: () => Promise<File>
  createWritable: (
    options?: FileSystemCreateWritableOptions
  ) => Promise<FileSystemWritableFileStream>
}

export interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: 'directory'
  getFileHandle: (
    name: string,
    options?: { create?: boolean }
  ) => Promise<FileSystemFileHandle>
  getDirectoryHandle: (
    name: string,
    options?: { create?: boolean }
  ) => Promise<FileSystemDirectoryHandle>
  values: () => AsyncIterableIterator<FileSystemHandle>
}

export interface FileSystemWritableFileStream extends WritableStream {
  write: (data: string | BufferSource | Blob) => Promise<void>
  seek: (position: number) => Promise<void>
  truncate: (size: number) => Promise<void>
}

declare global {
  interface Window {
    showDirectoryPicker(options?: {
      mode?: 'read' | 'readwrite'
    }): Promise<FileSystemDirectoryHandle>
  }
}
