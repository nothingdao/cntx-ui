# cntx-ui

> File bundling and tagging tool for AI development workflows

Cntx helps developers organize, tag, and bundle their codebase files for AI tools like ChatGPT, Claude, and Cursor. Create structured bundles with semantic tags to provide better context to AI systems.

## ✨ Features

- 📁 **Direct File System Access** - Work with your files without uploads
- 🏷️ **Smart Tagging System** - Organize files with semantic tags
- 📦 **Bundle Creation** - Package files for AI consumption with metadata
- 🔍 **Bundle Analysis** - Track file changes and staleness over time
- 🎯 **Master Bundles** - Create snapshots to track project evolution
- 🎨 **Modern Interface** - Clean, responsive web UI
- ⚡ **Real-time Updates** - Watch for file changes automatically

## 🚀 Quick Start

```bash
npx cntx-ui
```

That's it! Cntx will start a local server and open in your browser.

## 📋 Requirements

- **Node.js 16+**
- **Chromium-based browser** (Chrome, Edge, Opera, Brave)
  - Firefox and Safari don't support File System Access API yet

## 🎯 How to Use

### 1. Initialize Your Project

1. Run `npx cntx-ui`
2. Click "Select Directory" and choose your project folder
3. Initialize the project (creates a `.cntx` folder with configuration)

### 2. Organize with Tags

- Use the **Tags** tab to create semantic tags (e.g., "core", "ui-components", "utilities")
- Tag files using the paint brush icon in the file tree
- Tags help categorize files by their role in your project

### 3. Create Bundles

- Select files in the directory tree (checkbox selection)
- Click "Bundle" to create a package for AI tools
- Bundles include file content, metadata, and your tag organization

### 4. Master Bundles

- Create a "Master Bundle" to snapshot your entire project
- Use this as a reference point to track which files have changed
- Perfect for providing complete project context to AI tools

### 5. Bundle Analysis

- View bundle freshness and file staleness
- See which files have changed since the last bundle
- Analyze tag distribution and file types

## 🔧 Browser Compatibility

Cntx uses the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API), which requires:

- ✅ Chrome 86+
- ✅ Edge 86+
- ✅ Opera 72+
- ✅ Other Chromium-based browsers
- ❌ Firefox (not yet supported)
- ❌ Safari (not yet supported)

## 📁 Project Structure

When you initialize a project, Cntx creates a `.cntx` folder:

```
your-project/
├── .cntx/
│   ├── config/
│   │   ├── tags.ts          # Tag definitions
│   │   └── pattern-ignore.ts # Files to ignore
│   ├── bundles/             # Regular bundles
│   │   └── master/          # Master bundles
│   └── state/
│       └── file.json        # File tracking state
└── your-code-files...
```

## 🤖 AI Integration

Cntx bundles are designed for AI tools:

- **Structured XML format** with file metadata
- **Directory tree visualization**
- **Tag-based organization** for context
- **Change tracking** to highlight recent modifications
- **Ignore patterns** to exclude irrelevant files

## 💡 Tips

- **Tag Strategy**: Use tags like "core", "ui-components", "utilities", "configuration"
- **Ignore Patterns**: Configure patterns to exclude `node_modules`, build files, etc.
- **Master Bundles**: Create these periodically to track project evolution
- **File Selection**: Use Shift+click for range selection in the file tree

## 🐛 Troubleshooting

**"No files found"**

- Check your ignore patterns in the Config tab
- Ensure you're using a supported browser

**"Failed to access directory"**

- Grant file system permissions when prompted
- Try refreshing and re-selecting the directory

**Bundle creation fails**

- Ensure files are staged (selected with checkboxes)
- Check browser console for detailed errors

## 📄 License

MIT

## 🤝 Contributing

See [DEVELOPMENT.md](./DEVELOPMENT.md) for local development setup.

---

**Made for AI-powered development workflows** 🤖✨
