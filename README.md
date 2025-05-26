# cntx-ui

> File bundling and tagging tool for AI development workflows

cntx helps developers organize, tag, and bundle their codebase files for AI tools like ChatGPT, Claude, and Cursor. Create structured bundles with semantic tags to provide better context to AI systems.

## ✨ Features

- 📁 **Direct File System Access** - Work with your files without uploads
- 🏷️ **Smart Tagging System** - Organize files with semantic tags
- 📦 **Bundle Creation** - Package files for AI consumption with metadata
- 🔍 **Bundle Analysis** - Track file changes and staleness over time
- 🎯 **Master Bundles** - Create snapshots to track project evolution
- 🤝 **Cursor Integration** - Import and sync with existing Cursor AI rules
- 🎨 **Modern Interface** - Clean, responsive web UI
- ⚡ **Real-time Updates** - Watch for file changes automatically
- 👥 **Team AI Context** - Share AI-friendly project context via git

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
4. **Commit the `.cntx` directory** - this shares your project's AI context with your team!

### 2. Import Existing AI Rules (Optional)

If you're already using Cursor or other AI tools:

- Go to the **Config** tab → **Cursor Rules**
- Cntx will automatically detect existing `.cursorrules` files
- Import them to merge with cntx's semantic organization
- Creates unified AI context that works across tools

### 3. Organize with Tags

- Use the **Tags** tab to create semantic tags (e.g., "core", "ui-components", "utilities")
- Tag files using the paint brush icon in the file tree
- Tags help categorize files by their role in your project

### 4. Create Bundles

- Select files in the directory tree (checkbox selection)
- Click "Bundle" to create a package for AI tools
- Bundles include file content, metadata, and your tag organization

### 5. Master Bundles

- Create a "Master Bundle" to snapshot your entire project
- Use this as a reference point to track which files have changed
- Perfect for providing complete project context to AI tools

### 6. Bundle Analysis

- View bundle freshness and file staleness
- See which files have changed since the last bundle
- Analyze tag distribution and file types

## 🤝 Team Collaboration

**Commit Your `.cntx` Directory!** Unlike typical build artifacts, your `.cntx` directory contains valuable team context:

- **Shared semantic organization** - Everyone uses the same file tags
- **AI context standards** - Unified rules for AI tools across the team
- **Project understanding** - New team members get instant context
- **Documentation as code** - Your project describes itself

### What Gets Committed

```
your-project/
├── .cntx/
│   ├── config/
│   │   ├── tags.ts                  # Team's tag taxonomy
│   │   ├── project-metadata.json    # Project info for AI
│   │   ├── ai-instructions.json     # Imported AI rules
│   │   └── pattern-ignore.ts        # Agreed ignore patterns
│   ├── bundles/
│   │   ├── master/                  # Reference snapshots
│   │   └── [other-bundles]/         # Useful reference bundles
│   └── state/
│       └── file.json                # Current file tags & organization
└── your-code-files...
```

## 🔧 Browser Compatibility

Cntx uses the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API), which requires:

- ✅ Chrome 86+
- ✅ Edge 86+
- ✅ Opera 72+
- ✅ Other Chromium-based browsers
- ❌ Firefox (not yet supported)
- ❌ Safari (not yet supported)

## 🤖 AI Integration

Cntx bundles are designed for AI tools:

- **Structured XML format** with file metadata
- **Directory tree visualization**
- **Tag-based organization** for context
- **Change tracking** to highlight recent modifications
- **Ignore patterns** to exclude irrelevant files
- **Cursor Rules compatibility** for seamless AI workflow integration

### Universal AI Context

Cntx creates a **repository-first AI context system**:

- Import existing `.cursorrules` or `.cursor/` configurations
- Merge with cntx's semantic file organization
- Export unified context that works across AI tools
- Share via git for consistent team AI interactions

## 💡 Tips

- **Tag Strategy**: Use tags like "core", "ui-components", "utilities", "configuration"
- **Ignore Patterns**: Configure patterns to exclude `node_modules`, build files, etc.
- **Master Bundles**: Create these periodically to track project evolution
- **File Selection**: Use Shift+click for range selection in the file tree
- **Team Context**: Commit `.cntx` so your team shares the same AI context
- **Cursor Integration**: Import existing Cursor rules to bridge your current AI workflow

## 🚀 Workflow Examples

### For Individual Developers

1. Initialize project with cntx
2. Import existing Cursor rules
3. Tag files semantically
4. Create bundles for AI consumption
5. Commit `.cntx` for future reference

### For Teams

1. One team member initializes with cntx
2. Establishes tagging conventions and AI rules
3. Commits `.cntx` directory
4. Team members clone and get instant AI context
5. Collaborative tagging through pull requests
6. Shared understanding of codebase organization

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

**Cursor rules not detected**

- Verify `.cursorrules` file exists in project root
- Check for `.cursor/` directory with configuration files

## 📄 License

MIT

## 🤝 Contributing

See [DEVELOPMENT.md](./DEVELOPMENT.md) for local development setup.

---

**Made for AI-powered development workflows** 🤖✨  
**Now with team collaboration and universal AI context** 👥🌐
