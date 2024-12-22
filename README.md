# Claude Chat with File Watcher

A web application for chatting with Claude while tracking and bundling local file changes.

## Features

- Chat interface for Claude with model selection
- File watcher for local directory monitoring
- Git-like staging system for files
- Bundle tracking per file
- Real-time file change detection
- File change history and bundle history

## Setup

1. Clone the repository

```bash
git clone <repository-url>
cd claude-chat
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

- Watched: File is being monitored
- Modified: File has changed
- Staged: File is selected for bundling
- Bundled: File has been included in a bundle

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[Add your license here]
