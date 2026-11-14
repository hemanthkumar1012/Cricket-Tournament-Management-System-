## Vercel deployment

This project must use the **repository root** as Vercel's Root Directory because `vercel.json` and the Python API entry point (`api/index.py`) are at the repository root. Do not set the Root Directory to `frontend`.

The Vercel configuration detects whether its build is running from the repository root or the frontend directory, installs the frontend dependencies, and builds the Vite app. For the configured output path (`frontend/dist`) and Python API rewrite to work together, set Root Directory to the repository root in Project Settings → Build and Development Settings.

After changing Root Directory, redeploy the `improve-frontend-top-notch` branch. If Vercel continues to show an old command, remove any dashboard Build Command and Install Command overrides so the repository's `vercel.json` is used.
