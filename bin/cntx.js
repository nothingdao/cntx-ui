#!/usr/bin/env node

const express = require('express');
const path = require('path');
const open = require('open');
const fs = require('fs');

const app = express();
const port = 3000;

// ASCII art banner
const banner = `
┌─────────────────────────────────────────┐
│                                         │
│   ██████╗███╗   ██╗████████╗██╗  ██╗    │
│  ██╔════╝████╗  ██║╚══██╔══╝╚██╗██╔╝    │
│  ██║     ██╔██╗ ██║   ██║    ╚███╔╝     │
│  ██║     ██║╚██╗██║   ██║    ██╔██╗     │
│  ╚██████╗██║ ╚████║   ██║   ██╔╝ ██╗    │
│   ╚═════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝    │
│                                         │
│    File bundling & tagging for AI      │
│                                         │
└─────────────────────────────────────────┘
`;

console.log(banner);
console.log('🚀 Starting Cntx...\n');

// Check if dist directory exists
const distPath = path.join(__dirname, '../dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ Error: Build files not found.');
  console.log('This usually means the package was not built properly.');
  console.log('If you\'re developing locally, run: npm run build');
  process.exit(1);
}

// Serve the built React app with proper headers for File System Access API
app.use((req, res, next) => {
  // Set headers needed for File System Access API
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});

app.use(express.static(distPath));

// Handle React Router routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Handle server shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down Cntx...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down Cntx...');
  process.exit(0);
});

const server = app.listen(port, () => {
  console.log(`🌐 Server running at http://localhost:${port}`);
  console.log('📁 Select a directory to get started!');
  console.log('\n💡 Tips:');
  console.log('   • Use Chromium-based browsers (Chrome, Edge, Opera)');
  console.log('   • File System Access API required for full functionality');
  console.log('   • Press Ctrl+C to stop the server\n');

  // Open browser
  console.log('🔗 Opening browser...');
  open(`http://localhost:${port}`).catch(() => {
    console.log('Could not open browser automatically.');
    console.log(`Please visit: http://localhost:${port}`);
  });
});

// Handle port already in use
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${port} is already in use.`);
    console.log('Either:');
    console.log(`  • Stop the process using port ${port}`);
    console.log(`  • Visit http://localhost:${port} if Cntx is already running`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err.message);
    process.exit(1);
  }
});
