#!/bin/bash

echo "🔍 Verifying Ubiquitous Language System Setup..."
echo ""

# Check Node.js version
echo "✓ Checking Node.js version..."
node --version

# Check npm version
echo "✓ Checking npm version..."
npm --version

# Check if package.json exists
if [ -f "package.json" ]; then
    echo "✓ Root package.json found"
else
    echo "✗ Root package.json not found"
    exit 1
fi

# Check if apps exist
if [ -d "apps/api" ] && [ -d "apps/web" ]; then
    echo "✓ Apps directories found (api, web)"
else
    echo "✗ Apps directories not found"
    exit 1
fi

# Check if packages exist
if [ -d "packages/types" ]; then
    echo "✓ Packages directory found (types)"
else
    echo "✗ Packages directory not found"
    exit 1
fi

# Check TypeScript config
if [ -f "tsconfig.json" ]; then
    echo "✓ TypeScript configuration found"
else
    echo "✗ TypeScript configuration not found"
    exit 1
fi

# Check Turbo config
if [ -f "turbo.json" ]; then
    echo "✓ Turborepo configuration found"
else
    echo "✗ Turborepo configuration not found"
    exit 1
fi

echo ""
echo "✅ Setup verification complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm install' to install dependencies"
echo "2. Copy .env.example files and configure environment variables"
echo "3. Run 'npm run build --workspace=@ubiquitous/types' to build shared types"
echo "4. Run 'npm run dev' to start development servers"
echo ""
echo "For detailed instructions, see PROJECT_SETUP.md"
