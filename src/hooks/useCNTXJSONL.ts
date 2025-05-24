// src/hooks/useCNTXJSONL.ts
import { useState, useCallback } from 'react'
import { useDirectory } from '@/contexts/DirectoryContext'
import { useFiles } from '@/contexts/FileContext'
import { useBundles } from '@/contexts/BundleContext'
import {
  FileJSONLEntry,
  BundleJSONLEntry,
  TagBundleManifest,
  JSONLStats,
} from '@/types/cntx-jsonl'

export const useCNTXJSONL = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedFiles, setProcessedFiles] = useState(0)
  const [processedBundles, setProcessedBundles] = useState(0)
  const [tagBundles, setTagBundles] = useState(0)

  const { directoryHandle } = useDirectory()
  const { watchedFiles } = useFiles()
  const { bundles } = useBundles()

  // Helper: Read file content
  const readFileContent = useCallback(
    async (filePath: string): Promise<string> => {
      if (!directoryHandle) throw new Error('No directory handle')

      const pathParts = filePath.split('/').filter((part) => part !== '')
      let currentHandle = directoryHandle

      // Navigate through directories
      for (let i = 0; i < pathParts.length - 1; i++) {
        currentHandle = await currentHandle.getDirectoryHandle(pathParts[i])
      }

      // Get the file
      const fileName = pathParts[pathParts.length - 1]
      const fileHandle = await currentHandle.getFileHandle(fileName)
      const fileObject = await fileHandle.getFile()
      return await fileObject.text()
    },
    [directoryHandle]
  )

  // Write individual file JSONL
  const writeFileJSONL = useCallback(
    async (filePath: string): Promise<FileJSONLEntry | null> => {
      if (!directoryHandle) return null

      const watchedFile = watchedFiles.find((f) => f.path === filePath)
      if (!watchedFile) return null

      try {
        const content = await readFileContent(filePath)

        // Find which bundles contain this file
        const containingBundles = bundles
          .filter((bundle) => bundle.files?.includes(filePath))
          .map((bundle) => bundle.id)

        // Create file JSONL entry
        const fileEntry: FileJSONLEntry = {
          id: filePath,
          file_path: filePath,
          content: content,
          metadata: {
            filename: watchedFile.name,
            extension: filePath.split('.').pop() || 'unknown',
            directory: watchedFile.directory,
            size: content.length,
            last_modified: watchedFile.lastModified.toISOString(),
            manual_tags: watchedFile.tags || [],
            in_bundles: containingBundles,
            is_staged: watchedFile.isStaged,
            is_changed: watchedFile.isChanged,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }

        // Ensure .cntx/files/jsonl directory structure exists
        const cntxDir = await directoryHandle.getDirectoryHandle('.cntx')
        const filesDir = await cntxDir.getDirectoryHandle('files', {
          create: true,
        })
        const jsonlDir = await filesDir.getDirectoryHandle('jsonl', {
          create: true,
        })

        // Create directory structure for file
        let targetDir = jsonlDir
        const pathParts = filePath.split('/').filter((part) => part !== '')
        const fileDirParts = pathParts.slice(0, -1)

        for (const dirPart of fileDirParts) {
          targetDir = await targetDir.getDirectoryHandle(dirPart, {
            create: true,
          })
        }

        // Write JSONL file
        const jsonlFileName = `${pathParts[pathParts.length - 1]}.jsonl`
        const jsonlFileHandle = await targetDir.getFileHandle(jsonlFileName, {
          create: true,
        })
        const writable = await jsonlFileHandle.createWritable()
        await writable.write(JSON.stringify(fileEntry, null, 2))
        await writable.close()

        console.log(`✓ Wrote file JSONL: ${filePath}`)
        return fileEntry
      } catch (error) {
        console.error(`✗ Error writing file JSONL for ${filePath}:`, error)
        return null
      }
    },
    [directoryHandle, watchedFiles, bundles, readFileContent]
  )

  // Write bundle JSONL
  const writeBundleJSONL = useCallback(
    async (bundleId: string): Promise<BundleJSONLEntry | null> => {
      if (!directoryHandle) return null

      const bundle = bundles.find((b) => b.id === bundleId)
      if (!bundle || !bundle.files?.length) return null

      try {
        const bundleFiles = []
        const fileTypes: Record<string, number> = {}
        const directories = new Set<string>()

        // Process each file in bundle
        for (const filePath of bundle.files) {
          const watchedFile = watchedFiles.find((f) => f.path === filePath)
          if (!watchedFile) continue

          try {
            const content = await readFileContent(filePath)
            const extension = filePath.split('.').pop() || 'unknown'

            fileTypes[extension] = (fileTypes[extension] || 0) + 1
            directories.add(watchedFile.directory)

            bundleFiles.push({
              path: filePath,
              content: content,
              size: content.length,
              extension: extension,
              manual_tags: watchedFile.tags || [],
              last_modified: watchedFile.lastModified.toISOString(),
            })
          } catch (error) {
            console.error(
              `Error reading file ${filePath} for bundle ${bundleId}:`,
              error
            )
          }
        }

        if (bundleFiles.length === 0) return null

        // Create bundle JSONL entry
        const bundleEntry: BundleJSONLEntry = {
          id: bundle.id,
          bundle_name: bundle.name || `Bundle ${bundle.id}`,
          bundle_type: bundle.id === 'master' ? 'master' : 'custom',
          bundle_description: bundle.description,
          files: bundleFiles,
          metadata: {
            created_at: bundle.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            total_files: bundleFiles.length,
            total_size: bundleFiles.reduce((sum, f) => sum + f.size, 0),
            manual_tags: bundle.tags || [],
            file_types: fileTypes,
            directories: Array.from(directories),
          },
        }

        // Ensure .cntx/bundles/[bundle-id] directory exists
        const cntxDir = await directoryHandle.getDirectoryHandle('.cntx')
        const bundlesDir = await cntxDir.getDirectoryHandle('bundles', {
          create: true,
        })
        const bundleDir = await bundlesDir.getDirectoryHandle(bundle.id, {
          create: true,
        })

        // Write bundle JSONL
        const jsonlFileHandle = await bundleDir.getFileHandle('bundle.jsonl', {
          create: true,
        })
        const writable = await jsonlFileHandle.createWritable()
        await writable.write(JSON.stringify(bundleEntry, null, 2))
        await writable.close()

        console.log(
          `✓ Wrote bundle JSONL: ${bundle.id} (${bundleFiles.length} files)`
        )
        return bundleEntry
      } catch (error) {
        console.error(`✗ Error writing bundle JSONL for ${bundleId}:`, error)
        return null
      }
    },
    [directoryHandle, bundles, watchedFiles, readFileContent]
  )

  // Create tag-derived bundles
  const createTagBundles = useCallback(async (): Promise<number> => {
    if (!directoryHandle) return 0

    try {
      // Get all unique tags from files
      const allTags = new Set<string>()
      watchedFiles.forEach((file) => {
        file.tags?.forEach((tag) => allTags.add(tag))
      })

      if (allTags.size === 0) return 0

      const cntxDir = await directoryHandle.getDirectoryHandle('.cntx')
      const bundlesDir = await cntxDir.getDirectoryHandle('bundles', {
        create: true,
      })
      const tagBundlesDir = await bundlesDir.getDirectoryHandle('tag-bundles', {
        create: true,
      })

      let createdCount = 0

      // Create bundle for each tag
      for (const tag of allTags) {
        const filesWithTag = watchedFiles.filter((file) =>
          file.tags?.includes(tag)
        )

        if (filesWithTag.length === 0) continue

        const bundleFiles = []
        const fileTypes: Record<string, number> = {}
        const directories = new Set<string>()

        // Process files for this tag
        for (const watchedFile of filesWithTag) {
          try {
            const content = await readFileContent(watchedFile.path)
            const extension = watchedFile.path.split('.').pop() || 'unknown'

            fileTypes[extension] = (fileTypes[extension] || 0) + 1
            directories.add(watchedFile.directory)

            bundleFiles.push({
              path: watchedFile.path,
              content: content,
              size: content.length,
              extension: extension,
              manual_tags: watchedFile.tags || [],
              last_modified: watchedFile.lastModified.toISOString(),
            })
          } catch (error) {
            console.error(
              `Error reading file ${watchedFile.path} for tag ${tag}:`,
              error
            )
          }
        }

        if (bundleFiles.length === 0) continue

        // Create tag bundle entry
        const tagBundle: BundleJSONLEntry = {
          id: `tag-${tag}`,
          bundle_name: `Tag: ${tag}`,
          bundle_type: 'tag-derived',
          bundle_description: `Auto-generated bundle for files tagged with "${tag}"`,
          derived_from_tag: tag,
          files: bundleFiles,
          metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            total_files: bundleFiles.length,
            total_size: bundleFiles.reduce((sum, f) => sum + f.size, 0),
            manual_tags: [tag],
            file_types: fileTypes,
            directories: Array.from(directories),
          },
        }

        // Create tag directory
        const tagDir = await tagBundlesDir.getDirectoryHandle(tag, {
          create: true,
        })

        // Write manifest
        const manifest: TagBundleManifest = {
          id: `tag-${tag}`,
          tag: tag,
          name: `Tag: ${tag}`,
          description: `Files tagged with "${tag}"`,
          files: filesWithTag.map((f) => f.path),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          auto_generated: true,
        }

        const manifestHandle = await tagDir.getFileHandle(
          'bundle-manifest.json',
          { create: true }
        )
        const manifestWritable = await manifestHandle.createWritable()
        await manifestWritable.write(JSON.stringify(manifest, null, 2))
        await manifestWritable.close()

        // Write JSONL
        const jsonlHandle = await tagDir.getFileHandle('bundle.jsonl', {
          create: true,
        })
        const jsonlWritable = await jsonlHandle.createWritable()
        await jsonlWritable.write(JSON.stringify(tagBundle, null, 2))
        await jsonlWritable.close()

        createdCount++
        console.log(
          `✓ Created tag bundle: ${tag} (${bundleFiles.length} files)`
        )
      }

      return createdCount
    } catch (error) {
      console.error('✗ Error creating tag bundles:', error)
      return 0
    }
  }, [directoryHandle, watchedFiles, readFileContent])

  // Process all JSONL files
  const processAllJSONL = useCallback(async () => {
    setIsProcessing(true)
    setProcessedFiles(0)
    setProcessedBundles(0)
    setTagBundles(0)

    try {
      console.log('🚀 Starting CNTX JSONL processing...')

      // Process individual files (limit to avoid overwhelming)
      const filesToProcess = watchedFiles.slice(0, 20)
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i]
        await writeFileJSONL(file.path)
        setProcessedFiles(i + 1)
      }

      // Process bundles
      for (let i = 0; i < bundles.length; i++) {
        const bundle = bundles[i]
        await writeBundleJSONL(bundle.id)
        setProcessedBundles(i + 1)
      }

      // Create tag-derived bundles
      const tagBundleCount = await createTagBundles()
      setTagBundles(tagBundleCount)

      console.log('✅ CNTX JSONL processing complete!')
      console.log(`📁 Files processed: ${filesToProcess.length}`)
      console.log(`📦 Bundles processed: ${bundles.length}`)
      console.log(`🏷️  Tag bundles created: ${tagBundleCount}`)
    } catch (error) {
      console.error('❌ Error processing JSONL:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [
    watchedFiles,
    bundles,
    writeFileJSONL,
    writeBundleJSONL,
    createTagBundles,
  ])

  // Get statistics
  const getStats = useCallback((): JSONLStats => {
    const allTags = new Set<string>()
    watchedFiles.forEach((file) => {
      file.tags?.forEach((tag) => allTags.add(tag))
    })

    return {
      totalFiles: watchedFiles.length,
      totalBundles: bundles.length,
      uniqueTags: allTags.size,
      taggedFiles: watchedFiles.filter((f) => f.tags && f.tags.length > 0)
        .length,
      processedFiles,
      processedBundles,
      tagBundles,
    }
  }, [watchedFiles, bundles, processedFiles, processedBundles, tagBundles])

  return {
    // Core functions
    writeFileJSONL,
    writeBundleJSONL,
    createTagBundles,
    processAllJSONL,

    // State
    getStats,
    isProcessing,

    // Individual processors for selective processing
    processFiles: useCallback(
      async (filePaths: string[]) => {
        for (const path of filePaths) {
          await writeFileJSONL(path)
        }
      },
      [writeFileJSONL]
    ),

    processBundles: useCallback(
      async (bundleIds: string[]) => {
        for (const id of bundleIds) {
          await writeBundleJSONL(id)
        }
      },
      [writeBundleJSONL]
    ),
  }
}
