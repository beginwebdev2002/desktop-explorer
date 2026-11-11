const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');

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
      nodeIntegration: false,
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
ipcMain.handle('ping', () => 'pong');

app.whenReady().then(() => {
  createWindow();

  // macOS: re-create a window when the dock icon is clicked and no windows are open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') app.quit();
});
