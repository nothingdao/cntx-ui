#!/bin/bash

# build.sh - Script to build and test cntx-ui with web interface

set -e  # Exit on any error

echo "🏗️  Building cntx-ui with web interface..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "web" ]; then
    echo "❌ Error: Please run this script from the cntx-ui root directory"
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf web/dist
rm -rf *.tgz

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Build web interface
echo "🌐 Building web interface..."
cd web
npm install
npm run build
cd ..

# Verify build
if [ ! -d "web/dist" ]; then
    echo "❌ Error: Web build failed - dist directory not found"
    exit 1
fi

echo "✅ Web interface built successfully"
echo "📁 Files in web/dist:"
ls -la web/dist/

# Test build locally
echo "🧪 Testing local build..."
npm pack

# Get the package file name
PACKAGE_FILE=$(ls cntx-ui-*.tgz | head -n 1)

if [ -z "$PACKAGE_FILE" ]; then
    echo "❌ Error: Package file not found"
    exit 1
fi

echo "📦 Created package: $PACKAGE_FILE"
echo "📏 Package size: $(du -h $PACKAGE_FILE | cut -f1)"

# Optional: Test install locally
read -p "🤔 Test install locally? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔧 Installing locally for testing..."
    npm install -g ./$PACKAGE_FILE
    
    echo "✅ Installed! Test with:"
    echo "   mkdir test-project && cd test-project"
    echo "   cntx-ui init"
    echo "   cntx-ui watch"
    echo "   # Then visit http://localhost:3333"
fi

echo ""
echo "🎉 Build complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Test the package locally (if not done above)"
echo "   2. If everything works, publish with: npm publish"
echo "   3. Or publish as beta: npm publish --tag beta"
echo ""
echo "🔍 To test in another project:"
echo "   mkdir /tmp/test-project && cd /tmp/test-project"
echo "   npm install -g $PWD/$PACKAGE_FILE"
echo "   cntx-ui init && cntx-ui watch"
echo ""
