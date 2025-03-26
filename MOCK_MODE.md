# Running Cylestio UI in Mock Mode

If you're having issues with the standard commands, follow these simpler instructions:

## Option 1: Simple Script (macOS only)

On macOS, you can use the included script to start both the mock API and UI servers:

```bash
./scripts/start-mock-mode.sh
```

This will open two terminal windows:
- One running the mock API server on port 8080
- One running the Next.js UI server configured to use the mock API

## Option 2: Manual Approach (Works on all platforms)

Start each server in a separate terminal window:

### Terminal 1 - Start the mock API server:

```bash
npm run mock-api
```

You should see output like:
```
Using mock API port: 8080 (override with MOCK_API_PORT env variable)
Mock API server running at http://localhost:8080
API documentation available at http://localhost:8080/docs
```

### Terminal 2 - Start the Next.js UI with mock configuration:

```bash
npm run dev:mock-simple
```

This will start the UI server configured to use the mock API.

## Verifying it's working

1. Open your browser to http://localhost:3000
2. Check the browser console for the message: `API Client Configuration: {...}`
3. Verify that `useMockApi` is `true` and `baseUrl` is `http://localhost:8080/api/v1`

## Troubleshooting

If you encounter errors:

1. Make sure you've installed the required dependencies:
   ```bash
   npm install concurrently env-cmd --save-dev
   ```

2. Check if port 8080 is already in use. If it is, you can change it by setting the environment variable:
   ```bash
   MOCK_API_PORT=8081 npm run mock-api
   ```
   Remember to also update the `.env.mock` file to point to the new port. 