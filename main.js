// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const {dialog} = require('electron');
const xlsx = require('xlsx');
const { getToken, getReports } = require('./quickbooks');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    })
  );

  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function() {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('fetchReports', async (event, arg) => {
  try {
    const token = await getToken(); // Implement this function to get access token
    const reports = await getReports(token); // Implement this function to fetch reports
    mainWindow.webContents.send('reports', reports);
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    //Changes this path as needed
    const defaultPath = app.getPath('desktop');
    const filePath = dialog.showSaveDialogSync(mainWindow, {
        defaultPath,
        filters: [{ name : 'Excek workbook', extensions: ['xlsx']}]
    });

    if(filePath){
        xlsx.writeFile(workbook, filePath);
    }
  } catch (error) {
    console.error('Error fetching reports:', error);
  }
});
