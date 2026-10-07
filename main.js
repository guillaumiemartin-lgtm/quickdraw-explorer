const { app, BrowserWindow, Menu } = require('electron');

const secureWebPrefs = { nodeIntegration: false, contextIsolation: true, sandbox: true };

function createWindow() {
  const win = new BrowserWindow({
    width: 760,
    height: 940,
    minWidth: 500,
    minHeight: 600,
    backgroundColor: '#ffffff',
    autoHideMenuBar: true,
    webPreferences: secureWebPrefs
  });
  win.loadFile('index.html');

  // Fenêtres Édition / Aperçu ouvertes via window.open
  win.webContents.setWindowOpenHandler(() => ({
    action: 'allow',
    overrideBrowserWindowOptions: {
      backgroundColor: '#ffffff',
      autoHideMenuBar: true,
      webPreferences: secureWebPrefs
    }
  }));
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
