
const electron = require("electron");
const { ipcMain } = require("electron");
const jsmediatags = require("jsmediatags");
const fs = require("fs");
const path = require("path");
const url = require("url");
const app = electron.app
const BrowserWindow = electron.BrowserWindow

let window; 

app.on("ready", () => {
    window = new BrowserWindow({ 
        width: 2000, 
        height: 1200,
        webPreferences: {
            nodeIntegration: true
        }
    });
    
    window.loadURL(
        url.format({
            pathname: path.join(__dirname, `/dist/index.html`),
            protocol: "file:",
            slashes: true
          })
    );
});

ipcMain.on("fetchFile", (event, arg) => {
    // jsmediatags.read("./src/electron/Lil Peep - Cut Myself (Slowed).mp3", {
    var filePath = arg.filePath;
    var returnData = {};

    fs.readFile (filePath, (err, file) => {
        if (err) {
            throw err;
        }

        var base64File = new Buffer(file, 'binary').toString('base64');

        returnData.fileContent = base64File;

        jsmediatags.read(filePath, {
            onSuccess: (idData) => {
                returnData.metaData = idData;

                window.webContents.send("filesFetched", returnData);
            },
            onError: (err) => {
                console.log (err);
            }
        });
    });    
});