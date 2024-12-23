// src/utils/init-utils.ts
export const DEFAULT_BUNDLE_IGNORE = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.cache',
  'package-lock.json',
  'yarn.lock',
  'example-project',
  '.DS_Store',
]

async function createDirectoryStructure(watchDir: FileSystemDirectoryHandle) {
  await watchDir.getDirectoryHandle('config', { create: true })
  const bundlesDir = await watchDir.getDirectoryHandle('bundles', {
    create: true,
  })
  await bundlesDir.getDirectoryHandle('initial', { create: true })
  await watchDir.getDirectoryHandle('sent', { create: true })
  await watchDir.getDirectoryHandle('state', { create: true })
}

async function createBundleIgnore(configDir: FileSystemDirectoryHandle) {
  const content = `// .sourcery/config/bundle-ignore.ts
export default ${JSON.stringify(DEFAULT_BUNDLE_IGNORE, null, 2)} as const;
`
  const ignoreHandle = await configDir.getFileHandle('bundle-ignore.ts', {
    create: true,
  })
  const writable = await ignoreHandle.createWritable()
  await writable.write(content)
  await writable.close()
}

export async function initializeProject(dirHandle: FileSystemDirectoryHandle) {
  try {
    // Create .sourcery directory
    const watchDir = await dirHandle.getDirectoryHandle('.sourcery', {
      create: true,
    })

    // Create directory structure
    await createDirectoryStructure(watchDir)

    // Create bundle-ignore.ts
    const configDir = await watchDir.getDirectoryHandle('config')
    await createBundleIgnore(configDir)

    // Create initial state file
    const stateDir = await watchDir.getDirectoryHandle('state')
    const stateHandle = await stateDir.getFileHandle('file-status.json', {
      create: true,
    })
    const writable = await stateHandle.createWritable()
    await writable.write(
      JSON.stringify({ files: {}, lastUpdated: new Date().toISOString() })
    )
    await writable.close()
  } catch (error) {
    console.error('Error initializing project:', error)
    throw error
  }
}

export async function createInitialBundle(
  dirHandle: FileSystemDirectoryHandle
) {
  try {
    // Get .sourcery directory
    const watchDir = await dirHandle.getDirectoryHandle('.sourcery')

    // Get initial bundle directory
    const bundlesDir = await watchDir.getDirectoryHandle('bundles')
    await bundlesDir.getDirectoryHandle('initial')

    // Update state file with initial bundle info
    const stateDir = await watchDir.getDirectoryHandle('state')
    const stateHandle = await stateDir.getFileHandle('file-status.json')
    const file = await stateHandle.getFile()
    const state = JSON.parse(await file.text())

    state.initialBundle = {
      created: new Date().toISOString(),
      fileCount: 0,
    }

    const writable = await stateHandle.createWritable()
    await writable.write(JSON.stringify(state, null, 2))
    await writable.close()
  } catch (error) {
    console.error('Error creating initial bundle:', error)
    throw error
  }
}
