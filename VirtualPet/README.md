# Virtual Pet Desktop

Virtual Pet Desktop is an Electron + React application that keeps your companion cat alive on the desktop and now performs automatic facial mood detection using the Hugging Face Inference API. The project is based on Electron React Boilerplate but has been customised to support webcam capture, secure IPC, and a mood-aware UI in the renderer.

## Prerequisites

- Node.js 18 or later (Node 20+ recommended)
- npm 8+
- A Hugging Face account with access to the `prithivMLmods/Facial-Emotion-Detection-SigLIP2` model
- A webcam (virtual or physical) for mood detection

## Getting Started

Clone the repository (or pull the VirtualPet folder) and install dependencies:

```bash
cd VirtualPet
npm install
```

## Environment Variables

Mood detection runs in the Electron **main** process and requires a Hugging Face token. Expose it via environment variables before launching the app:

- `HF_TOKEN` (required): Personal access token with rights to call the inference API.
- `HF_INFERENCE_URL` (optional): Override the inference base URL. Defaults to `https://router.huggingface.co/hf-inference` (the new Hugging Face Router endpoint).

### macOS/Linux (bash/zsh)

```bash
export HF_TOKEN=hf_your_token_here
# optional: only if you need a custom router endpoint
# export HF_INFERENCE_URL=https://router.huggingface.co/hf-inference
npm start
```

### Windows PowerShell

```powershell
setx HF_TOKEN "hf_your_token_here"
# optional: only if you need a custom router endpoint
# setx HF_INFERENCE_URL "https://router.huggingface.co/hf-inference"
# reopen the terminal so the variable is available, then
npm start
```

### Cloud / CI Environments

Add `HF_TOKEN` to the environment configuration (e.g. GitHub Actions secrets, Render, Fly.io, etc.) before starting the Electron process. The token is read at runtime, so no rebuild is required.

> **Security note:** keep the token in the Node/Electron environment only. It is never exposed to the renderer, and you should avoid committing it to source control or bundling it in the frontend.

## Development Workflow

Start all development watchers (main, preload, renderer) with hot reload:

```bash
npm start
```

- Renderer: available at `http://localhost:1212`
- Electron main process: automatically restarts on changes
- Preload bundle: rebuilt on changes

When the app launches, allow webcam access. The context panel will poll the camera every ~20 seconds, send a frame to Hugging Face, and surface the dominant mood alongside supporting scores.

## Production Builds

Create an optimized production bundle:

```bash
npm run build
```

Package the desktop app for your current platform:

```bash
npm run package
```

Generated installers/binaries are placed in `release/build`.

## Project Structure Highlights

- `src/main/` – Electron entry point, IPC handlers (`emotion-ipc.ts`)
- `src/main/preload.ts` – context bridge exposing safe APIs to the renderer
- `src/renderer/` – React UI including mood-aware context panel
- `src/shared/` – TypeScript types shared between processes

## Troubleshooting

- **Mood detection returns errors** – confirm `HF_TOKEN` is set and valid, that your network can reach `https://router.huggingface.co`, and that the model allows Inference API access.
- **HTTP 410 Gone** – you are hitting the deprecated `api-inference.huggingface.co` domain. Use the default router (`HF_INFERENCE_URL=https://router.huggingface.co/hf-inference`).
- **Camera access denied** – grant permissions in macOS System Preferences / Windows Privacy settings, then relaunch.
- **Build fails after dependency changes** – rerun `npm install` and `npm run build:dll` (automatically invoked during `npm install`).
- **HTTP 410 errors** – if you encounter this error, it might indicate an issue with the Hugging Face inference URL. Ensure `HF_INFERENCE_URL` is set correctly or remove it to use the default.

## Additional Scripts

| Command           | Description                                           |
| ----------------- | ----------------------------------------------------- |
| `npm run lint`    | Run ESLint across the project                         |
| `npm test`        | Execute Jest test suite                               |
| `npm run build`   | Create production bundles for main, preload, renderer |
| `npm run package` | Package the app into an installer                     |

---

MIT License © Virtual Pet Desktop contributors
