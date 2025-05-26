// src/utils/cursor-rules.ts
import type { FileSystemDirectoryHandle } from '@/types/types'

export interface CursorRules {
  rules: string[]
  patterns?: string[]
  preferences?: Record<string, any>
  source?: 'cursorrules-file' | 'cursor-directory' | 'created-new'
}

// UPDATE: loadCursorRules to return simpler structure
export async function loadCursorRules(
  dirHandle: FileSystemDirectoryHandle
): Promise<{ content: string; location: string; filePath: string } | null> {
  console.log('🔍 Looking for Cursor rules...')

  // Try .cursorrules first
  try {
    const cursorRulesHandle = await dirHandle.getFileHandle('.cursorrules')
    const file = await cursorRulesHandle.getFile()
    const content = await file.text()

    return {
      content,
      location: 'cursorrules-file',
      filePath: '.cursorrules',
    }
  } catch (error) {
    console.log('No .cursorrules file found, checking .cursor directory...')
  }

  // Try .cursor/rules
  try {
    const cursorDir = await dirHandle.getDirectoryHandle('.cursor')
    const rulesHandle = await cursorDir.getFileHandle('rules')
    const file = await rulesHandle.getFile()
    const content = await file.text()

    return {
      content,
      location: 'cursor-directory',
      filePath: '.cursor/rules',
    }
  } catch (error) {
    console.log('No .cursor/rules file found')
  }

  console.log('ℹ️ No existing Cursor rules found')
  return null
}

// UPDATE: saveCursorRules to save to detected location
export async function saveCursorRules(
  dirHandle: FileSystemDirectoryHandle,
  content: string, // Just save raw content, not structured rules
  preferredLocation?: 'cursorrules-file' | 'cursor-directory'
): Promise<void> {
  console.log('💾 Saving Cursor rules...')

  // Determine where to save based on existing files or preference
  const location = await determineRulesLocation(dirHandle, preferredLocation)

  if (location === 'cursorrules-file') {
    const cursorRulesHandle = await dirHandle.getFileHandle('.cursorrules', {
      create: true,
    })
    const writable = await cursorRulesHandle.createWritable()
    await writable.write(content)
    await writable.close()
  } else {
    // Save to .cursor/rules
    const cursorDir = await dirHandle.getDirectoryHandle('.cursor', {
      create: true,
    })
    const rulesHandle = await cursorDir.getFileHandle('rules', { create: true })
    const writable = await rulesHandle.createWritable()
    await writable.write(content)
    await writable.close()
  }

  console.log(`✅ Cursor rules saved to ${location}`)
}

// Helper functions
async function fileExists(
  dirHandle: FileSystemDirectoryHandle,
  fileName: string
): Promise<boolean> {
  try {
    await dirHandle.getFileHandle(fileName)
    return true
  } catch {
    return false
  }
}

async function dirExists(
  dirHandle: FileSystemDirectoryHandle,
  dirName: string
): Promise<boolean> {
  try {
    await dirHandle.getDirectoryHandle(dirName)
    return true
  } catch {
    return false
  }
}

// NEW: Determine best location for rules
async function determineRulesLocation(
  dirHandle: FileSystemDirectoryHandle,
  preference?: 'cursorrules-file' | 'cursor-directory'
): Promise<'cursorrules-file' | 'cursor-directory'> {
  // Check what already exists
  const hasRulesFile = await fileExists(dirHandle, '.cursorrules')
  const hasCursorDir = await dirExists(dirHandle, '.cursor')

  // If user has preference and nothing exists, use preference
  if (!hasRulesFile && !hasCursorDir && preference) {
    return preference
  }

  // Use existing format
  if (hasRulesFile) return 'cursorrules-file'
  if (hasCursorDir) return 'cursor-directory'

  // Default to .cursor/rules for new projects
  return 'cursor-directory'
}

/**
 * Check if there are existing Cursor rules in the project
 */
export async function hasCursorRules(
  dirHandle: FileSystemDirectoryHandle
): Promise<boolean> {
  try {
    // Check for .cursorrules file
    await dirHandle.getFileHandle('.cursorrules')
    return true
  } catch {
    try {
      // Check for .cursor directory
      await dirHandle.getDirectoryHandle('.cursor')
      return true
    } catch {
      return false
    }
  }
}

/**
 * Create example Cursor rules for new projects
 */
export function getExampleCursorRules(): CursorRules {
  return {
    rules: [
      '# Project Coding Standards',
      '',
      '## General Guidelines',
      '- Use TypeScript for all new code',
      '- Follow existing code style and patterns',
      '- Write meaningful commit messages',
      '- Add comments for complex logic',
      '',
      '## React/Frontend',
      '- Use functional components with hooks',
      '- Prefer composition over inheritance',
      '- Use Tailwind CSS for styling',
      '- Follow accessible design principles',
      '',
      '## File Organization',
      '- Use semantic file naming',
      '- Group related files in directories',
      '- Export from index files when appropriate',
      '',
      '## Testing',
      '- Write tests for new features',
      '- Test edge cases and error conditions',
      '- Keep tests focused and readable',
    ],
    patterns: [],
    preferences: {},
    source: 'created-new',
  }
}
