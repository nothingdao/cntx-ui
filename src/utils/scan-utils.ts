// src/utils/scan-utils.ts
import type { WatchedFile } from '../types/watcher'
import { shouldIgnorePath } from './config-utils'
import { getPathParts } from './file-utils'
import type {
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

    // Check if path should be ignored
    if (
      shouldIgnorePath(
        entryPath,
        { ignore: ignorePatterns },
        entry.kind === 'directory'
      )
    ) {
      console.log(`[IGNORE] ${entryPath}`)
      continue
    }

    if (entry.kind === 'file') {
      const fileHandle = entry as FileSystemFileHandle
      const file = await fileHandle.getFile()
      const content = await file.text()
      const { name, directory } = getPathParts(entryPath)

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
      console.log(`[ADD] ${entryPath}`)
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
