/**
 * Electron main process for tenK.
 *
 * In production it loads the web app from a bundled `web-dist/` folder
 * that electron-builder copies in via extraResources. In dev it loads
 * the live Vite dev server at http://localhost:5173 so HMR works.
 *
 * Auto-update: electron-updater polls GitHub Releases at launch (then
 * every hour). When a new version is available it downloads in the
 * background and prompts the user to restart and apply it.
 */
import { app, BrowserWindow, shell, dialog, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'node:path';

const isDev = !app.isPackaged;

/* ── Single-instance lock: a second launch focuses the existing window
 *    instead of opening a duplicate. ─────────────────────────────── */
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width:           1280,
    height:          820,
    minWidth:        960,
    minHeight:       600,
    backgroundColor: '#f0f0f9', // matches light-theme --bg-deep
    title:           'tenK',
    titleBarStyle:   process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
  });

  /* External links open in the user's real browser, not a new Electron
   * window (which would have no chrome and feel broken). */
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    void mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    /* Production: load the static web build copied in as extraResources. */
    const indexHtml = path.join(process.resourcesPath, 'web-dist', 'index.html');
    void mainWindow.loadFile(indexHtml);
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

/* ── Auto-update wiring (electron-updater) ──────────────────────────
 *  Only runs in packaged builds — `app.isPackaged` is false in dev. */
function setupAutoUpdater(): void {
  if (isDev) return;
  autoUpdater.autoDownload          = true;
  autoUpdater.autoInstallOnAppQuit  = true;

  autoUpdater.on('update-available', (info) => {
    if (!mainWindow) return;
    mainWindow.webContents.send('updater:update-available', { version: info.version });
  });

  autoUpdater.on('update-downloaded', async (info) => {
    if (!mainWindow) return;
    const { response } = await dialog.showMessageBox(mainWindow, {
      type:    'info',
      buttons: ['Restart now', 'Later'],
      defaultId: 0,
      title:   'Update ready',
      message: `tenK ${info.version} is ready to install`,
      detail:  'Restart the app to apply it. Your in-progress session is saved.',
    });
    if (response === 0) autoUpdater.quitAndInstall();
  });

  autoUpdater.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('[autoUpdater]', err);
  });

  /* Initial check + recurring check every hour while the app stays open. */
  void autoUpdater.checkForUpdatesAndNotify();
  setInterval(() => { void autoUpdater.checkForUpdatesAndNotify(); }, 60 * 60 * 1000);
}

/* ── IPC: web-side code can request `app:version` to show in UI. ──── */
ipcMain.handle('app:version', () => app.getVersion());

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();

  app.on('activate', () => {
    /* macOS convention: clicking the dock icon with no windows opens one. */
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  /* macOS convention: app stays running even with no windows. */
  if (process.platform !== 'darwin') app.quit();
});
