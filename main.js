
const electron = require("electron");
const { ipcMain } = require("electron");
const jsmediatags = require("jsmediatags");
const fs = require("fs");
const path = require("path");
const url = require("url");
//const sqlite = require("sqlite3");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let window;
let repository;
let queue = [];

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

    /*repository = new sqlite.Database("./src/electron/repo.db", (err) => {
        if (err)
            console.log("Couldn't connect to DB");
        else
            console.log("Connected to DB");
    });*/

    var libraryPath = "C:/Users/adamb/OneDrive/Music";
    indexLibrary(libraryPath);
});

ipcMain.on("fetchQueue", (event, arg) => {
    window.webContents.send("queueFetched", queue);
});

ipcMain.on("fetchFile", (event, arg) => {
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
                window.webContents.send("fileFetched", returnData);
            },
            onError: (err) => {
                console.log (err);
            }
        });
    });    
});

function indexLibrary(path) {
    console.log (`Indexing: ${path}`)
    var regex = /^.*\.(mp3|flac|aac|m4a)$/;
    if (fs.existsSync(path)) {
        var files = fs.readdirSync(path);
        files.forEach(file => {
            if (regex.exec(file)) {
                indexTrack(path + `/${file}`)
            }
            else {                
                if (fs.lstatSync(path + `/${file}`).isDirectory()) {                    
                    console.log (`Path is a directory: ${path}/${file}`);
                    indexLibrary(path + `/${file}`)
                }
            }
        });
    }
}

function indexTrack(path) {
    //console.log (`Processing: ${path}`);
    queue.push(path);
}