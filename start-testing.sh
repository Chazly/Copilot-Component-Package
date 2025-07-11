#!/bin/bash

echo "🧪 Starting Copilot Package Testing Environment..."
echo ""
echo "🚀 This will:"
echo "   • Install dependencies (if needed)"
echo "   • Start the development server"
echo "   • Open your browser to localhost:3005"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the development server
echo "🌟 Starting development server..."
echo "📍 Opening http://localhost:3005"
echo ""
echo "🧪 Available Test Scenarios:"
echo "   📊 Dashboard - Component overview and quick tests"
echo "   🤖 Copilot Chat - Theme and response testing"
echo "   📐 Resizable Layout - Interactive layout testing"
echo "   🏢 Enterprise Features - Security and performance"
echo "   ⚙️ Configuration - Config format testing"
echo "   ⚡ Performance - Metrics and stress testing"
echo ""

npm run test:dev 