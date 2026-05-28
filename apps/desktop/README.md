# tenK Desktop

Electron wrapper around the web build. Produces macOS `.dmg` (Apple
Silicon + Intel) and Windows `.exe` installers with built-in
auto-update.

## How it fits together

```
apps/web        ← React + Vite app (the actual UI)
apps/desktop    ← Electron shell that loads apps/web/dist
                  + auto-update via GitHub Releases
.github/...     ← CI workflow that builds installers on macOS + Windows
```

In production the desktop app reads `apps/web/dist/index.html` from
`Resources/web-dist/` inside the installer. In dev it loads
`http://localhost:5173` so HMR works.

## Local development

```bash
# From the repo root
npm install                        # installs everything across workspaces
npm run dev --workspace=@tenk/desktop
# Vite starts on :5173, Electron launches and points at it.
```

## Building installers locally

```bash
# macOS only on a Mac, Windows only on Windows. Cross-compile is
# fragile — let GitHub Actions do it for the other platform.
cd apps/desktop
npm run release:mac    # → release/tenK-X.Y.Z-mac.dmg
npm run release:win    # → release/tenK-X.Y.Z-setup.exe
```

The `release:*` scripts pass `--publish never` so they DON'T upload to
GitHub. Use them for smoke-testing the installer before tagging.

## Shipping a real release (the version-bump flow)

1. Decide what kind of change it is:
   - patch (1.0.0 → 1.0.1) — bugfix
   - minor (1.0.0 → 1.1.0) — new feature
   - major (1.0.0 → 2.0.0) — breaking change
2. From `apps/desktop/`, bump the version:
   ```bash
   cd apps/desktop
   npm version patch    # also creates a git commit + a `v1.0.1` tag
   ```
3. Push the tag to GitHub:
   ```bash
   git push --follow-tags
   ```
4. The `Desktop Release` workflow runs (~10 minutes). It builds macOS +
   Windows installers and uploads them to a new GitHub Release with the
   same tag name.
5. Once the release is live, existing users get auto-update on next
   launch.

## How auto-update reaches existing users

- `electron-updater` inside each running copy of the app pings GitHub
  Releases at launch (and every hour).
- It looks for `latest-mac.yml` / `latest.yml` files in the release —
  electron-builder generates these automatically.
- When the user's version is older than the release, the update
  downloads silently in the background.
- On completion, a system dialog asks **Restart now / Later**.
- "Restart now" → quits, applies the update, relaunches in the new
  version. No reinstall by the user.

## Sharing with friends (for now, unsigned)

Until you buy code-signing certificates, installers will trip OS
warnings on first run. They're not malicious — just unsigned. Each
friend does this once per install:

**macOS** — after dragging tenK to Applications, the first launch
shows *"tenK can't be opened because Apple cannot check it for malicious
software."* Fix:
1. Right-click (or Ctrl-click) the **tenK** app in Applications
2. Choose **Open**
3. Click **Open** in the warning dialog

**Windows** — running the installer shows *"Windows protected your
PC."* Fix:
1. Click **More info**
2. Click **Run anyway**

To remove these warnings entirely:
- macOS: enroll in [Apple Developer Program]($99/yr), add `identity` +
  `notarize` blocks in `electron-builder.yml`.
- Windows: buy an Authenticode certificate (~$200+/yr), point
  `electron-builder.yml` at it.

Skip both for the friends-and-family phase.

## Where to add icons

`build/icon.icns` (macOS) and `build/icon.ico` (Windows). Until you add
them, electron-builder uses its generic placeholder — the app still
builds and runs fine. Generate from a 1024×1024 PNG with:
- `iconutil` (built into macOS), or
- the online tool at https://iconverticons.com/

## Troubleshooting

**"electron-builder couldn't find a GitHub token"** — the GH Actions
workflow provides `secrets.GITHUB_TOKEN` automatically. For local
publishing, set `GH_TOKEN` in your environment.

**App opens to a blank window** — the web build wasn't bundled.
Confirm `apps/web/dist/index.html` exists. The desktop scripts run
`npm run build --workspace=@tenk/web` first; if that fails the desktop
build still runs but the resulting app has no UI to load.

**Auto-update doesn't trigger** — only packaged builds check for
updates (the code short-circuits in dev). To test the update flow,
build a v1.0.0 installer, install it, then tag v1.0.1 and let CI build
it. Open the installed v1.0.0 — it should prompt within a minute.
