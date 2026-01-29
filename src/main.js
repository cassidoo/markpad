const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;
let currentFilePath = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('file-new')
        },
        {
          label: 'Open',
          accelerator: 'CmdOrCtrl+O',
          click: () => openFile()
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => saveFile()
        },
        {
          label: 'Save As',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => saveFileAs()
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'Gist',
      submenu: [
        {
          label: 'Publish to Gist',
          accelerator: 'CmdOrCtrl+G',
          click: () => mainWindow.webContents.send('publish-gist')
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

async function openFile() {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    try {
      const content = await fs.readFile(filePath, 'utf8');
      currentFilePath = filePath;
      mainWindow.webContents.send('file-opened', { path: filePath, content });
    } catch (error) {
      dialog.showErrorBox('Error', `Failed to open file: ${error.message}`);
    }
  }
}

async function saveFile() {
  if (currentFilePath) {
    mainWindow.webContents.send('request-content-for-save');
  } else {
    await saveFileAs();
  }
}

async function saveFileAs() {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'Markdown', extensions: ['md'] }
    ]
  });

  if (!result.canceled && result.filePath) {
    currentFilePath = result.filePath;
    mainWindow.webContents.send('request-content-for-save');
  }
}

ipcMain.handle('save-content', async (event, content) => {
  if (!currentFilePath) return { success: false, error: 'No file path' };
  
  try {
    await fs.writeFile(currentFilePath, content, 'utf8');
    return { success: true, path: currentFilePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-current-file-path', () => {
  return currentFilePath;
});

ipcMain.handle('publish-gist', async (event, { filename, content }) => {
  try {
    const { publishGist } = require('./gist-publisher');
    const result = await publishGist(filename, content);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-external', async (event, url) => {
  await shell.openExternal(url);
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
