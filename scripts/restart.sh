#!/bin/bash

# Print header
echo "=== Cylestio UI Restart Script ==="
echo "This script will restart both the mock API server and the Next.js development server."
echo ""

# Kill any existing processes
echo "Stopping existing processes..."
pkill -f "node.*mock-api-server.js" || true
pkill -f "next dev" || true

# Clean Next.js cache
echo "Cleaning Next.js cache..."
npm run clean

# Ask which mode to start
echo ""
echo "Which mode would you like to start?"
echo "1) Real API mode (connects to API at http://localhost:8000)"
echo "2) Mock API mode (uses mock API at http://localhost:8080)"
read -p "Enter your choice (1/2): " choice

case $choice in
  1)
    echo ""
    echo "Starting in REAL API mode..."
    echo "You'll need to start your real API server separately."
    npm run dev
    ;;
  2)
    echo ""
    echo "Starting in MOCK API mode..."
    echo "The mock API server will be started automatically."
    
    if command -v osascript &> /dev/null; then
      # macOS - use osascript to open new terminal windows
      osascript -e 'tell application "Terminal" to do script "cd \"'$PWD'\" && npm run mock-api"'
      sleep 1
      osascript -e 'tell application "Terminal" to do script "cd \"'$PWD'\" && npm run dev:mock-simple"'
      echo "Started both services in separate terminal windows."
    else
      # Linux/other - use concurrently
      echo "Starting both services in this terminal..."
      npm run dev:mock
    fi
    ;;
  *)
    echo "Invalid choice. Exiting."
    exit 1
    ;;
esac 