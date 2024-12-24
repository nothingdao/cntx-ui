# Resource Unification Format for AI Systems

rufas

A web application for tracking and bundling local file changes in a manner that will be best for AI to consume.

## Features

- File watcher for local directory monitoring
- Bundle tracking per file
- Real-time file change detection
- File change history and bundle history
- Chat interface for Claude with model selection

## Setup

1. Clone the repository

```bash
git clone <repository-url>
cd rufas
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

```bash
cp .env.example .env
# Add your Anthropic API key to .env:
# VITE_ANTHROPIC_API_KEY=your-key-here
```

4. Run the development server

```bash
npm run dev
```

## Usage

### File Watching

1. Click "Select Directory" to choose a local directory to watch
2. Files will be monitored for changes in real-time
3. Modified files will show a "Modified" badge
4. Each file shows its last modified time and last bundle time

### Staging System

- Use checkboxes to stage/unstage files
- Files remain staged after bundling for tracking purposes
- "Changed since bundle" indicator shows when staged files have new modifications
- Bundle button shows count of currently staged files

### Chatting with Claude

- Select your preferred Claude model from the dropdown
- Type messages and send to Claude
- File context from staged files is automatically included in messages
- Chat history is maintained during the session

## Technical Details

### Built With

- React + TypeScript
- Vite
- shadcn/ui Components
- Anthropic Claude API
- File System Access API

### Key Components

- `DirectoryWatcherPanel`: UI for file monitoring and staging
- `ApplicationContainer`: Main application container
- `DirectoryWatcherProvider`: Context provider for file state management
- `DirectoryWatcherContext`: Context for sharing file state

### File States

Files can be in multiple states:

- Watched: File has not been added to the ignore list in the config
- Ignored or Unwatched: File is not being monitored having been added to the ignore list
- Modified: File has changed since it was last bundled
- Staged: This concept is not required and we should do away with it in the codebase.
- Bundled: File has been included in a bundle

The contents of the .watch directory should reflect our requriements to track the files according to the files states above.

## Concepts

1. Project Initialization & Context

```
.rufas/
  config/
    bundle-ignore.ts      # Like .gitignore but for bundles
    tags.ts         # User-defined file groupings/tags
    project-settings.ts   # Initial setup preferences
  state/
    bundles/
      initial/           # First-time full project bundle
      tags/        # Category-specific bundles
    sent/               # History of what's been sent to Claude
    file-status.json    # Tracks changes since last bundle/send
```

2. Main Features

- Project Initialization

  - First-time setup wizard
  - Bundle ignore patterns: defaults we have defined in the default config should be applied. User can add more manually. We are not building a UI for this.
  - Initial full project bundle: We need to bundle the entire project initially. This should inlude all files that are not being ignored. It should go in the `.rufas/bundles/initial` directory. It should be created when the user first sets up the project using the `InitializationModal.tsx`.

- File Tracking

  - Changes since last bundle: We need to track changes to files since the last bundle. This should be stored in the `.rufas/state/file-status.json` file. This file should be updated whenever a file is modified.
  - Tag assignments
  - File metadata (bundled state, sent state)...

- Bundle Management

  - Initial project bundle
  - Tag-based bundles
  - Abstract bundles (based on tags/tags)
  - Bundle history

- UI Views
  - File Tree with statuses
    - Bundle status (bundled/changed)
    - Git status (if available)
    - Tag indicators
  - Tag View
    - Files grouped by tag
    - Bundle status per tag
  - Bundle History
    - When bundles were created
    - When they were sent to Claude
