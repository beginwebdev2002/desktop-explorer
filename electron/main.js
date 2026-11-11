const { app, BrowserWindow, ipcMain, shell } = require('electron');
const os = require('os');
const path = require('path');
const fsApi = require('./fs-api');

// `electron . --serve` -> load the Angular dev server (live reload).
// `electron .`         -> load the built app from dist/.
const isServe = process.argv.includes('--serve');
const DEV_SERVER_URL = 'http://localhost:4200';
const DIST_INDEX = path.join(__dirname, '..', 'dist', 'electron', 'browser', 'index.html');

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    icon: path.join(__dirname, '..', 'public', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true,
    },
  });

  // Open target="_blank" / window.open links in the system browser, not in a new Electron window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isServe) {
    win.loadURL(DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: 'right' });
  } else {
    win.loadFile(DIST_INDEX);
  }

  win.on('closed', () => {
    win = null;
  });
}

// Renderer -> main example: window.electronAPI.ping() resolves to 'pong'.
ipcMain.handle('ping', (e) => {
  console.log('Ping: ', e)
  return e;
});

// ---- Explorer API: Angular calls these through window.electronAPI (see preload.js) ----

ipcMain.handle('fs:drives', () => fsApi.listDrives());

ipcMain.handle('fs:read-dir', (_e, dirPath) => fsApi.readDir(requirePath(dirPath)));

ipcMain.handle('fs:known-folders', () => ({
  home: app.getPath('home'),
  desktop: app.getPath('desktop'),
  documents: app.getPath('documents'),
  downloads: app.getPath('downloads'),
  pictures: app.getPath('pictures'),
  music: app.getPath('music'),
  videos: app.getPath('videos'),
}));

// Opens a file with its default program (like double-click in Explorer).
ipcMain.handle('fs:open', async (_e, filePath) => {
  const error = await shell.openPath(requirePath(filePath));
  if (error) throw new Error(error);
});

// All values in bytes.
ipcMain.handle('system:memory', () => {
  const total = os.totalmem();
  const free = os.freemem();
  // Sum over every Electron process (main, Angular renderer, GPU, ...); workingSetSize is in KB.
  const appUsed = app.getAppMetrics().reduce((sum, m) => sum + m.memory.workingSetSize, 0) * 1024;
  return { systemTotal: total, systemFree: free, systemUsed: total - free, appUsed };
});

function requirePath(value) {
  if (typeof value !== 'string' || value === '') {
    throw new Error('Path must be a non-empty string');
  }
  return value;
}

app.whenReady().then(() => {
  createWindow();

  // macOS: re-create a window when the dock icon is clicked and no windows are open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
  if (process.platform !== 'darwin') app.quit();
});
