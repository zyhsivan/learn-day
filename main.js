// Modules to control application life and create native browser window
//https://www.electronjs.org/zh/docs/latest/api/browser-window
const { app, BrowserWindow,dialog,ipcRenderer,ipcMain,webFrame,Menu, shell} = require('electron')
const path = require('node:path')
const url = require("url");

// const {webContents} = require("@electron/remote/main");
const szIcon = path.join(__dirname,'/src/img/icon.ico')
let DEFAULT_WIDTH=1600,DEFAULT_HEIGHT=900;
const isMac = process.platform === 'darwin'

const template = [
  // { role: 'appMenu' }
  ...(isMac
      ? [{
        label: app.name,
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      }]
      : []),
  // { role: 'fileMenu' }
  {
    label: 'File',
    submenu: [
      {
        label: 'New' ,
        click:async () => {
          BrowserWindow.getAllWindows()[0].webContents.send("new-canvas","")
        }
      },
      {
        label: 'Open' ,
        click:async () => {
          let result = await dialog.showOpenDialog({
            title: '选择文件',
            filters: [{name: 'Canvas', extensions: ['pcanvas']}]
          })
          if(!result.canceled){
            BrowserWindow.getAllWindows()[0].webContents.send("open-canvas",result.filePaths[0])
          }
        }
      },
      {
        label: 'Save as',
        click:async ()=>{
          let result = await dialog.showSaveDialog({
            title:'选择保存路径',
            filters: [{name: 'Canvas', extensions: ['pcanvas']}]
          })
          console.log("send message -- save-canvas")
          if(!result.canceled){
            BrowserWindow.getAllWindows()[0].webContents.send("save-canvas",result.filePath);
          }
        }
      }
    ]
  },
  // { role: 'editMenu' }
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      ...(isMac
          ? [
            { role: 'pasteAndMatchStyle' },
            { role: 'delete' },
            { role: 'selectAll' },
            { type: 'separator' },
            {
              label: 'Speech',
              submenu: [
                { role: 'startSpeaking' },
                { role: 'stopSpeaking' }
              ]
            }
          ]
          : [
            { role: 'delete' },
            { type: 'separator' },
            { role: 'selectAll' }
          ])
    ]
  },
  // { role: 'viewMenu' }
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  // { role: 'windowMenu' }
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(isMac
          ? [
            { type: 'separator' },
            { role: 'front' },
            { type: 'separator' },
            { role: 'window' }
          ]
          : [
            { role: 'close' }
          ])
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal('https://electronjs.org')
        }
      }
    ]
  }
]
const mainMenu = Menu.buildFromTemplate(template);
if (process.env.MODE_ENV == 'development'){
  Menu.setApplicationMenu(mainMenu);
}else{
  Menu.setApplicationMenu(null);
}


function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    icon:szIcon,
    webPreferences: {
      //  渲染进程 开启node模块，使得JS中可以使用node的model
      nodeIntegration:true,
      // 控制上下文隔离
      contextIsolation:false,
      webSecurity:false,//访问本地资源
      webviewTag:true,
      nodeIntegrationInSubFrames: true, // 是否允许在子页面(iframe)或子窗口(child window)中集成Node.js
      // 开启 remote 模块
      // enableBlinkFeatures:true,
      preload: path.join(__dirname, './preload.js')
    }
  })

  // and load the index.html of the app.
  if (process.env.MODE_ENV == 'development'){
    mainWindow.loadURL("http://localhost:3000");
  }else{
    //打包使用
    mainWindow.loadURL(url.format({
      pathname:path.join(__dirname,'./excalidraw-app/build/index.html'),
      protocol:'file:',
      slashes:true
    }))
  }


  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
  // mainWindow.webContents.setVisualZoomLevelLimits(1,5);

  mainWindow.on("will-resize",function (event,newBounds) {
    // alert('resize');
  })

  mainWindow.on('zoom-changed',(e,zoomDirection)=>{
    // alert(zoomDirection)
  })

  mainWindow.on('rotate-gesture',(e,d)=>{
    // alert(d);
  })

  /*
  let view = new BrowserView({
    webPreferences:{
      //  渲染进程 开启node模块，使得JS中可以使用node的model
      nodeIntegration:true,
      // 控制上下文隔离
      contextIsolation:false,
      webSecurity:false,//访问本地资源
    }
  })
  mainWindow.addBrowserView(view);
  let x = 160,y=80;
  view.setBounds({
    x:x,
    y:y,
    width:DEFAULT_WIDTH-x,
    height:DEFAULT_HEIGHT-y
  });
  view.setAutoResize({
    width:true,
    height:true
  })
  view.webContents.loadFile("main-canvas.html")
  view.webContents.setVisualZoomLevelLimits(0.5,5);
  view.webContents.openDevTools();
   */
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // 打开一个文件对话框
  ipcMain.on("openFile", async (event, data) => {
    let result = dialog.showOpenDialogSync({
      title: '选择文件',
      // filters: [
      //   { name: 'Images', extensions: ['jpg', 'png', 'bmp','jpeg'] }
      //   // { name: 'All Files', extensions: ['*'] }
      // ]
      filters:data
    });
    console.log("文件", result, data)
    if(result && result.length > 0){
      event.sender.send("openFileResult",result[0]);
    }
  })

  ipcMain.on("saveFile",async (event,data)=>{
    let filePath = dialog.showSaveDialogSync({
      title:'保存文件',
      filters:data
      // filters: [
      //   { name: 'Images', extensions: ['png'] }
      //   { name: 'All Files', extensions: ['*'] }
      // ]
    });
    event.sender.send("saveFileResult",filePath);
  })

  //设置canvas大小
  ipcMain.on('dialogCanvaSize',(event, args) => {
      const childWin = new BrowserWindow({parent:BrowserWindow.getFocusedWindow(), modal:true,show:false});
      childWin.loadFile("pages/canvas-size.html");
      childWin.once('ready-to-show',()=>{
        childWin.show();
      })
  });

  ipcMain.on("webviewRegister",(event,subBusinessType)=>{
    const processId = event.processId;
    const frameId = event.frameId;
    event.sender.sendToFrame([processId,frameId],"MainToWebview","hello");
  })


  /**
   * 显示一个右键菜单
   */
  ipcMain.on("show-context-menu",(event)=>{
    const template = [
      {
        label:'menu item 1',
        click:()=>{event.sender.send('context-menu-command','menu-item-1')}
      },
      {
        label: 'menu item 2',
        type:'checkbox',
        checked:true
      }
    ]
    const menu = Menu.buildFromTemplate(template);
    menu.popup({window:BrowserWindow.fromWebContents(event.sender)})
  })

  /**
   * 外部打开链接
   */
  ipcMain.on("open-url",((event, args) => {
    shell.openExternal(args);
  }))
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.






















