// src/utils/directory-tree.ts
import type { WatchedFile } from '@/types/types'

interface TreeNode {
  name: string
  path: string
  isDirectory: boolean
  children: TreeNode[]
  file?: WatchedFile
}

/**
 * Builds both XML and ASCII representations of the directory tree
 */
export function buildDirectoryTree(files: WatchedFile[], projectName?: string) {
  const tree = buildTreeStructure(files)

  return {
    xmlTree: buildXMLTree(tree),
    asciiTree: buildASCIITree(tree, files.length, projectName),
  }
}

/**
 * Creates a hierarchical tree structure from flat file list
 */
function buildTreeStructure(files: WatchedFile[]): TreeNode {
  const root: TreeNode = {
    name: 'root',
    path: '',
    isDirectory: true,
    children: [],
  }

  // Sort files by path for consistent ordering
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path))

  sortedFiles.forEach((file) => {
    const pathParts = file.path.split('/')
    let currentNode = root

    // Navigate/create directory structure
    for (let i = 0; i < pathParts.length - 1; i++) {
      const dirName = pathParts[i]
      const dirPath = pathParts.slice(0, i + 1).join('/')

      let dirNode = currentNode.children.find(
        (child) => child.isDirectory && child.name === dirName
      )

      if (!dirNode) {
        dirNode = {
          name: dirName,
          path: dirPath,
          isDirectory: true,
          children: [],
        }
        currentNode.children.push(dirNode)
      }

      currentNode = dirNode
    }

    // Add the file
    const fileName = pathParts[pathParts.length - 1]
    currentNode.children.push({
      name: fileName,
      path: file.path,
      isDirectory: false,
      children: [],
      file: file,
    })
  })

  // Sort children: directories first, then files, both alphabetically
  sortTreeNode(root)

  return root
}

/**
 * Recursively sorts tree nodes
 */
function sortTreeNode(node: TreeNode) {
  node.children.sort((a, b) => {
    // Directories first
    if (a.isDirectory && !b.isDirectory) return -1
    if (!a.isDirectory && b.isDirectory) return 1

    // Then alphabetically
    return a.name.localeCompare(b.name)
  })

  // Recursively sort children
  node.children.forEach((child) => {
    if (child.isDirectory) {
      sortTreeNode(child)
    }
  })
}

/**
 * Generates XML tree structure
 */
function buildXMLTree(tree: TreeNode): string {
  const buildXMLNode = (node: TreeNode, depth: number = 0): string => {
    const indent = '  '.repeat(depth)

    if (node.isDirectory && node.name !== 'root') {
      const childrenXML = node.children
        .map((child) => buildXMLNode(child, depth + 1))
        .join('\n')

      return `${indent}<directory name="${escapeXML(
        node.name
      )}" path="${escapeXML(node.path)}">
${childrenXML}
${indent}</directory>`
    } else if (!node.isDirectory && node.file) {
      const file = node.file
      const tags = file.tags && file.tags.length > 0 ? file.tags.join(',') : ''

      return `${indent}<file name="${escapeXML(node.name)}" path="${escapeXML(
        node.path
      )}" size="${getFileSize(
        file
      )}" lastModified="${file.lastModified.toISOString()}">
${indent}  <tags>${escapeXML(tags)}</tags>
${indent}</file>`
    } else {
      // Root node - just return children
      return node.children.map((child) => buildXMLNode(child, depth)).join('\n')
    }
  }

  return `<directoryTree>
${buildXMLNode(tree, 1)}
</directoryTree>`
}

/**
 * Generates ASCII tree structure
 */
function buildASCIITree(
  tree: TreeNode,
  totalFiles: number,
  projectName?: string
): string {
  const lines: string[] = []

  // Add project header
  if (projectName) {
    lines.push(`${projectName}/`)
  }

  const buildASCIINode = (
    node: TreeNode,
    prefix: string = '',
    isLast: boolean = true
  ) => {
    if (node.name === 'root') {
      // Root node - just process children
      node.children.forEach((child, index) => {
        const isLastChild = index === node.children.length - 1
        buildASCIINode(child, '', isLastChild)
      })
      return
    }

    // Create the current line
    const connector = isLast ? '└── ' : '├── '
    const tagsStr =
      node.file?.tags && node.file.tags.length > 0
        ? ` [${node.file.tags.join(',')}]`
        : ''

    const displayName = node.isDirectory ? `${node.name}/` : node.name
    lines.push(`${prefix}${connector}${displayName}${tagsStr}`)

    // Process children if it's a directory
    if (node.isDirectory && node.children.length > 0) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ')

      node.children.forEach((child, index) => {
        const isLastChild = index === node.children.length - 1
        buildASCIINode(child, newPrefix, isLastChild)
      })
    }
  }

  buildASCIINode(tree)

  // Add summary
  const dirCount = countDirectories(tree)
  lines.push('')
  lines.push(`${totalFiles} files, ${dirCount} directories`)

  return lines.join('\n')
}

/**
 * Counts directories in the tree
 */
function countDirectories(node: TreeNode): number {
  let count = 0

  if (node.isDirectory && node.name !== 'root') {
    count = 1
  }

  node.children.forEach((child) => {
    count += countDirectories(child)
  })

  return count
}

/**
 * Gets file size (placeholder - you might want to get actual file size)
 */
function getFileSize(file: WatchedFile): number {
  // For now, return 0 - you could enhance this to get actual file size
  // by reading the file content length or using file.handle if available
  return 0
}

/**
 * Escapes XML special characters
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Helper function to get file extension
 */
export function getFileExtension(filePath: string): string {
  const lastDot = filePath.lastIndexOf('.')
  return lastDot === -1 ? '' : filePath.substring(lastDot + 1)
}
