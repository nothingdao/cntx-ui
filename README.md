# Sourcery

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
cd sourcery
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

- `FileWatcherPanel`: UI for file monitoring and staging
- `ChatContainer`: Main chat interface
- `FileWatcherProvider`: Context provider for file state management
- `FileWatcherContext`: Context for sharing file state

### File States

Files can be in multiple states:

- Watched: File has not been added to the ignore list in the config
- Ignored or Unwatched: File is not being monitored having been added to the ignore list
- Modified: File has changed since it was last bundled
- Staged: This concept is not required and we should do away with it in the codebase.
- Bundled: File has been included in a bundle

The contents of the .watch directory should reflect our requriements to track the files according to the files states above.

## Example Project

The example-project directory provides a sample project for testing the application. Select it in the UI to explore file monitoring, and bundling. You can safely delete this directory without affecting the application or test using your own directory. It is included purely for convenience.

## Concepts / Roadmap

1. Project Initialization & Context

```
.watch/
  config/
    bundle-ignore.ts      # Like .gitignore but for bundles
    categories.ts         # User-defined file groupings/tags
    project-settings.ts   # Initial setup preferences
  state/
    bundles/
      initial/           # First-time full project bundle
      categories/        # Category-specific bundles
    sent/               # History of what's been sent to Claude
    file-status.json    # Tracks changes since last bundle/send
```

2. Main Features

- Project Initialization

  - First-time setup wizard
  - Bundle ignore patterns
  - Category/tag definitions
  - Initial full project bundle

- File Tracking

  - Changes since last bundle
  - Git status integration (if possible)
  - Category/tag assignments
  - File metadata (bundled state, sent state)

- Bundle Management

  - Initial project bundle
  - Category-based bundles
  - Abstract bundles (based on tags/categories)
  - Bundle history

- UI Views
  - File Tree with statuses
    - Bundle status (bundled/changed)
    - Git status (if available)
    - Category indicators
  - Category/Tag View
    - Files grouped by category
    - Bundle status per category
  - Bundle History
    - When bundles were created
    - When they were sent to Claude
