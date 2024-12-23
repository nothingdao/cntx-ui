// src/utils/scan-utils.ts
import { WatchedFile } from '../types/watcher'
import { shouldIgnorePath } from './config-utils'
import {
  FileSystemDirectoryHandle,
  FileSystemFileHandle,
} from '../types/filesystem'

export async function scanAllFiles(
  dirHandle: FileSystemDirectoryHandle,
  ignorePatterns: string[],
  path: string = ''
): Promise<WatchedFile[]> {
  const files: WatchedFile[] = []

  for await (const entry of dirHandle.values()) {
    const entryPath = path ? `${path}/${entry.name}` : entry.name

    if (
      shouldIgnorePath(
        entryPath,
        { ignore: ignorePatterns },
        entry.kind === 'directory'
      )
    ) {
      continue
    }

    if (entry.kind === 'file') {
      const fileHandle = entry as FileSystemFileHandle
      const file = await fileHandle.getFile()
      const content = await file.text()
      const pathParts = entryPath.split('/')
      const name = pathParts.pop() || ''
      const directory = pathParts.join('/') || 'Root'

      files.push({
        path: entryPath,
        name,
        directory,
        content,
        lastModified: new Date(file.lastModified),
        isChanged: true,
        isStaged: true,
        lastBundled: null,
        handle: fileHandle,
      })
    } else if (entry.kind === 'directory') {
      const subDirHandle = await dirHandle.getDirectoryHandle(entry.name)
      const subFiles = await scanAllFiles(
        subDirHandle,
        ignorePatterns,
        entryPath
      )
      files.push(...subFiles)
    }
  }

  return files
}
