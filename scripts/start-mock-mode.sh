#!/bin/bash

# Print instructions
echo "=== Cylestio UI Mock Mode ==="
echo "This script will start two services in separate terminals:"
echo "1. Mock API server on port 8080"
echo "2. Next.js UI server on port 3000 (using mock API configuration)"
echo ""
echo "Press Ctrl+C in each terminal window to stop the services when done."
echo ""

# Check if osascript is available (macOS)
if command -v osascript &> /dev/null; then
    # macOS - use osascript to open new terminal windows
    osascript -e 'tell application "Terminal" to do script "cd \"'$PWD'\" && npm run mock-api"'
    osascript -e 'tell application "Terminal" to do script "cd \"'$PWD'\" && npm run dev:mock-simple"'
    echo "Started both services in separate terminal windows."
else
    # Linux/other - suggest manual approach
    echo "Please open two separate terminal windows and run:"
    echo ""
    echo "Terminal 1: npm run mock-api"
    echo "Terminal 2: npm run dev:mock-simple"
    echo ""
    echo "Script cannot automatically open terminal windows on this OS."
fi 