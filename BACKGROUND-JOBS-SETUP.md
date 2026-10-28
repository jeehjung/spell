# Cloudflare background Gemini jobs

The Pages app sends each Gemini request to the `spell-gemini-jobs` Worker Workflow. A Workflow continues if the browser closes. The personal Gemini key and request payload are stored in the Workflow only while it runs; the app deletes the Workflow state after reading the result. Uncollected jobs expire after 10 minutes. No Gemini key belongs in Worker environment variables or repository configuration.

## Deploy the Worker once

1. In Cloudflare, open **Workers & Pages** and create a Worker connected to GitHub repository `jeehjung/spell`.
2. Set the production branch to `main` and the **Root directory** to `workers/gemini-jobs`.
3. Set the Worker name to `spell-gemini-jobs` (it must match `wrangler.jsonc`). Use build command `npm install` and deploy command `npx wrangler deploy`.
4. Deploy. Wrangler creates the `spell-gemini-job-workflow` Workflow from the configuration.

## Connect the Pages project

1. Open the Cloudflare Pages project **spell**.
2. Go to **Settings → Bindings → Add → Service binding**.
3. Set the variable name to `GEMINI_JOBS` and select Worker `spell-gemini-jobs`.
4. Save, then redeploy the Pages project so the binding is available to Functions.

The Worker and Pages project do not need a Gemini API key secret or environment variable. Users continue entering their own keys in the app. The app sends each key with its job request to Cloudflare, then Cloudflare removes the Workflow state when the result is collected. If a browser is closed before the result is collected, the Workflow state expires automatically after 10 minutes.
