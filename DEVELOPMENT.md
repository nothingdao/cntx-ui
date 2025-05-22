# Development Guide

This guide covers how to set up Cntx for local development, contribute to the project, and understand the codebase architecture.

## 🛠️ Local Development Setup

### Prerequisites

- Node.js 16+
- npm or yarn
- Git
- Chromium-based browser for testing

### Clone and Install

```bash
git clone https://github.com/nothingdao/cntx-ui.git
cd cntx-ui
npm install
```

### Development Commands

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run linting
npm run lint

# Test the NPX package locally
npm run start
```

### Development Workflow

1. **Start dev server**: `npm run dev`
2. **Open**: http://localhost:5173
3. **Make changes** - Hot reload is enabled
4. **Test with File System API** - Use Chrome/Edge for full functionality

## 🏗️ Project Architecture

### Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Lucide React** for icons
- **File System Access API** for file operations

### Folder Structure

```
src/
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── theme/           # Theme system
│   ├── Dashboard.tsx    # Main dashboard
│   ├── DirectoryTree.tsx # File tree component
│   ├── BundleView.tsx   # Bundle analysis
│   └── ...
├── contexts/            # React Context providers
│   ├── DirectoryContext.tsx  # File system state
│   ├── BundleContext.tsx     # Bundle management
│   ├── TagContext.tsx        # Tag system
│   └── ...
├── utils/               # Business logic
│   ├── file-utils.ts    # File system operations
│   ├── bundle-utils.ts  # Bundle creation/analysis
│   ├── project-utils.ts # Project initialization
│   └── ...
├── types/               # TypeScript definitions
├── constants/           # App constants
└── lib/                 # Utility libraries
```

### Key Components

#### Contexts (State Management)

- **DirectoryContext**: File system access and watching
- **FileContext**: File tracking and staging
- **BundleContext**: Bundle creation and management
- **TagContext**: Tag system and file tagging
- **ProjectConfigContext**: Project configuration

#### Core Components

- **DirectoryTree**: File browser with selection
- **Dashboard**: Overview and project metrics
- **BundleMainViewer**: Bundle list and management
- **BundleView**: Detailed bundle analysis
- **TagsMainViewer**: Tag management interface

#### Utilities

- **file-utils.ts**: File system operations, ignore patterns
- **bundle-utils.ts**: Bundle creation, analysis, manifest handling
- **project-utils.ts**: Project initialization, master bundles
- **directory-tree.ts**: Tree structure generation

## 🔧 File System Access API

This project heavily uses the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API):

### Key APIs Used

```typescript
// Directory picker
const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' })

// Read files
const fileHandle = await dirHandle.getFileHandle('file.txt')
const file = await fileHandle.getFile()
const content = await file.text()

// Write files
const writable = await fileHandle.createWritable()
await writable.write(content)
await writable.close()

// Iterate directory
for await (const entry of dirHandle.values()) {
  if (entry.kind === 'file') {
    // Handle file
  }
}
```

### Browser Support Limitations

- Only works in Chromium-based browsers
- Requires HTTPS in production (localhost is fine for dev)
- User must grant permissions for each directory

## 🏷️ Tag System

### Tag Configuration

Tags are defined in `.cntx/config/tags.ts`:

```typescript
export default {
  core: {
    color: '#dc2626',
    description: 'Essential application files',
  },
  'ui-components': {
    color: '#0ea5e9',
    description: 'Reusable UI components',
  },
} as const
```

### Tag Assignment

File tags are stored in `.cntx/state/file.json`:

```json
{
  "files": {
    "src/App.tsx": {
      "tags": ["core"],
      "lastModified": "2025-01-01T00:00:00.000Z",
      "isStaged": false
    }
  }
}
```

## 📦 Bundle System

### Bundle Format

Bundles are XML files with structured content:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bundle id="bundle-id" created="timestamp" fileCount="5">
  <metadata>
    <projectName>my-project</projectName>
    <ignorePatterns>
      <pattern>node_modules</pattern>
    </ignorePatterns>
  </metadata>

  <directoryTree><!-- ASCII tree --></directoryTree>

  <documents>
    <document>
      <source>src/App.tsx</source>
      <tags>core</tags>
      <content><!-- file content --></content>
    </document>
  </documents>
</bundle>
```

### Bundle Types

- **Regular Bundles**: Selected files for specific tasks
- **Master Bundles**: Complete project snapshots for tracking changes

## 🧪 Testing & Debugging

### Local Testing

```bash
# Test the built package locally
npm run build
npm pack
npm install -g cntx-ui-1.0.0.tgz
cntx-ui

# Or test without installing
node bin/cntx.mjs
```

### Debugging Tips

- Use Chrome DevTools for File System API debugging
- Check console for file operation errors
- Monitor network tab for bundle size issues
- Use React DevTools for component state

### Common Issues

- **CORS errors**: Ensure running on localhost or HTTPS
- **File access denied**: Check browser permissions
- **Bundle too large**: Review ignore patterns
- **Performance issues**: Optimize file watching

## 📝 Code Style

### TypeScript

- Strict mode enabled
- Explicit return types for public functions
- Proper error handling with try/catch

### React Patterns

- Functional components with hooks
- Context for state management
- Custom hooks for reusable logic
- Proper dependency arrays in useEffect

### File Naming

- PascalCase for components: `DirectoryTree.tsx`
- kebab-case for utilities: `file-utils.ts`
- camelCase for functions and variables

## 🚀 Building & Publishing

### Build Process

```bash
# Full build with type checking
npm run build

# Quick build (skips TypeScript for faster iteration)
vite build
```

### Publishing to NPM

```bash
# Bump version
npm version patch|minor|major

# Build and publish
npm run build
npm publish

# Push changes and tags
git push && git push --tags
```

### NPX Package Structure

```
dist/           # Built React app
bin/cntx.mjs   # NPX entry point (Express server)
package.json   # Package metadata
README.md      # User documentation
```

## 🤝 Contributing

### Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Submit a pull request

### Commit Message Format

```
feat: add new bundle analysis feature
fix: resolve file watching memory leak
docs: update API documentation
refactor: simplify bundle creation logic
```

### Areas for Contribution

- **Browser compatibility**: Firefox/Safari support when APIs available
- **Performance**: Large directory handling optimization
- **Features**: New bundle formats, advanced filtering
- **UI/UX**: Accessibility improvements, mobile support
- **Documentation**: Tutorials, examples, API docs

## 🐛 Known Issues

- File System Access API only works in Chromium browsers
- Large directories (>1000 files) may have performance issues
- Bundle sizes can grow large with many files
- No offline functionality (requires file system access)

## 📚 Resources

- [File System Access API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API)
- [React Context Best Practices](https://react.dev/reference/react/useContext)
- [Vite Build Configuration](https://vitejs.dev/config/)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

Happy glass eating! 🚀
