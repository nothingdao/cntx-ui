#!/bin/bash

# test-local.sh - Script to test cntx-ui locally before publishing

set -e

echo "🧪 Testing cntx-ui locally..."

# Create a temporary test directory
TEST_DIR="/tmp/cntx-ui-test-$(date +%s)"
echo "📁 Creating test directory: $TEST_DIR"
mkdir -p "$TEST_DIR"

# Create a simple test project
cd "$TEST_DIR"
echo "📝 Creating test project files..."

# Create package.json
cat > package.json << 'EOF'
{
  "name": "test-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "echo 'dev script'"
  }
}
EOF

# Create some test files
mkdir -p src/components src/api docs
echo "export const hello = 'world'" > src/index.js
echo "export const Component = () => <div>Hello</div>" > src/components/App.jsx
echo "export const api = () => 'api'" > src/api/routes.js
echo "# Test Project" > README.md
echo "# Documentation" > docs/guide.md

echo "✅ Test project created with files:"
find . -type f -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.md" | sort

# Initialize cntx-ui
echo "🚀 Initializing cntx-ui..."
cntx-ui init

# Check if files were created
echo "🔍 Checking generated files..."
if [ -f ".cntx/config.json" ]; then
    echo "✅ Config file created"
    cat .cntx/config.json
else
    echo "❌ Config file not created"
    exit 1
fi

if [ -f ".cntxignore" ]; then
    echo "✅ Ignore file created"
else
    echo "❌ Ignore file not created"
    exit 1
fi

if [ -f ".cursorrules" ]; then
    echo "✅ Cursor rules created"
else
    echo "❌ Cursor rules not created"
    exit 1
fi

# Test bundle generation
echo "📦 Testing bundle generation..."
cntx-ui bundle master

if [ -f ".cntx/bundles.json" ]; then
    echo "✅ Bundles generated"
else
    echo "❌ Bundles not generated"
    exit 1
fi

# Test status command
echo "📊 Testing status command..."
cntx-ui status

# Start server in background and test web interface
echo "🌐 Testing web server..."
echo "Starting server on port 8899..."

# Kill any existing process on port 8899
lsof -ti:8899 | xargs kill -9 2>/dev/null || true

# Start server in background
cntx-ui watch 8899 &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Test API endpoints
echo "🔌 Testing API endpoints..."

# Test bundles endpoint
if curl -s http://localhost:8899/api/bundles > /dev/null; then
    echo "✅ API endpoint working"
else
    echo "❌ API endpoint not working"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Test web interface
if curl -s http://localhost:8899/ | grep -q "cntx-ui"; then
    echo "✅ Web interface accessible"
else
    echo "⚠️  Web interface not available (this is OK if web wasn't built)"
fi

# Stop server
echo "🛑 Stopping server..."
kill $SERVER_PID 2>/dev/null || true

# Cleanup
echo "🧹 Cleaning up..."
cd /
rm -rf "$TEST_DIR"

echo ""
echo "🎉 All tests passed!"
echo "✅ cntx-ui is working correctly"
echo ""
echo "🚀 Ready to publish!"
echo "   Run: npm publish"
echo "   Or: npm publish --tag beta"
echo ""
