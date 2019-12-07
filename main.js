const electron = require("electron");
const { ipcMain, dialog } = require("electron");
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
let settings = {};

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

    init();

});

function init () {

    /*repository = new sqlite.Database("./src/electron/repo.db", (err) => {
        if (err)
            console.log("Couldn't connect to DB");
        else
            console.log("Connected to DB");
    });*/


    if (fs.existsSync("./settings.json")) {
        settings = require("./settings.json");

        console.log(settings);
        var libraryPath = "C:/Users/adamb/OneDrive/Music";
        indexLibrary(settings.filePath);
    }
    else {
        setLocation();
    }
}

function setLocation () {
    dialog.showOpenDialog({ properties: ["openDirectory"]})
        .then(result => {
            if (!result.canceled) {
                var path = result.filePaths[0];
                settings = {
                    filePath: path
                };

                let settingsData = JSON.stringify(settings);
                fs.writeFileSync("settings.json", settingsData);

                console.log(settings);
                indexLibrary(settings.filePath);
            }
        })
        .catch(err => {
            console.log(err);
        });
}

ipcMain.on("setLocation", (event, arg) => {
    setLocation();
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
    console.log(`Indexing ${path}`);
    //var regex = /^.*\.(mp3|flac|aac|m4a)$/; -- M4A Not Working
    var regex = /^.*\.(mp3|flac|aac)$/;
    if (fs.existsSync(path)) {
        var files = fs.readdirSync(path);
        files.forEach(file => {
            if (regex.exec(file)) {
                indexTrack(path + `/${file}`)
            }
            else {                
                if (fs.lstatSync(path + `/${file}`).isDirectory()) {
                    indexLibrary(path + `/${file}`)
                }
            }
        });
    }
}

function indexTrack(path) {
    queue.push(path);
}