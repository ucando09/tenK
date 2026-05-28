/**
 * Preload — runs before any renderer code, has access to a limited Node
 * API. Exposes a small `window.tenkDesktop` object so the web app can:
 *   - detect it's running inside the desktop wrapper
 *   - read the app version (handy for an "About" line in Settings)
 *
 * Anything you add here is the ONLY way the web side can talk to the
 * Node/Electron side, so the surface stays auditable.
 */
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('tenkDesktop', {
  isDesktop: true,
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:version'),
  onUpdateAvailable: (cb: (version: string) => void) => {
    const handler = (_: unknown, payload: { version: string }) => cb(payload.version);
    ipcRenderer.on('updater:update-available', handler);
    return () => ipcRenderer.removeListener('updater:update-available', handler);
  },
});

declare global {
  interface Window {
    tenkDesktop?: {
      isDesktop: true;
      getVersion: () => Promise<string>;
      onUpdateAvailable: (cb: (version: string) => void) => () => void;
    };
  }
}
