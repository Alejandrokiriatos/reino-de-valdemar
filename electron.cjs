const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
function createWindow(){const win=new BrowserWindow({width:1440,height:900,minWidth:1000,minHeight:650,backgroundColor:'#10140f',autoHideMenuBar:true,webPreferences:{contextIsolation:true}});if(app.isPackaged)win.loadFile(path.join(__dirname,'dist','index.html'));else win.loadURL('http://localhost:5173');}
app.whenReady().then(()=>{createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()})});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});