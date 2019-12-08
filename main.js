const electron = require("electron");
const { ipcMain, dialog } = require("electron");
const jsmediatags = require("jsmediatags");
const fs = require("fs");
const path = require("path");
const url = require("url");
const sqlite = require("sqlite");
const uuidv1 = require("uuid/v1");
const Promise = require("bluebird");

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

const openSqlitePromise = sqlite.open("./src/electron/repo.db", { Promise });

async function init () {
    repository = await openSqlitePromise;
    //await sqlite.close(repository);
    // repository = new sqlite.Database("./src/electron/repo.db", (err) => {
    //     if (err)
    //         console.log("Couldn't connect to DB");
    //     else
    //         console.log("Connected to DB");
    // });

    //fetchSongs();

    if (fs.existsSync("./settings.json")) {
        settings = require("./settings.json");
        indexLibrary(settings.filePath);
    }
    else {
        setLocation();
    }
}

async function fetchSongs () {
    await openSqlite();
    repository.get(`SELECT *
        FROM Song`, (err, row) => {
            if (err) {
            console.error(err.message);
            }
            console.log(row);
    });
    
    await closeSqlite();
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

        var base64File = new Buffer(file, "binary").toString("base64");

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

async function indexLibrary(path) {
    console.log(`Indexing ${path}`);
    //var regex = /^.*\.(mp3|flac|aac|m4a)$/; -- M4A Not Working
    var regex = /^.*\.(mp3|flac|aac)$/;
    if (fs.existsSync(path)) {
        var files = fs.readdirSync(path);
        for (i = 0; i <= files.length - 1; i++) {
            var file = files[i]
            if (regex.exec(file)) {
                console.log("Indexing Track")
                await indexTrack(path + `/${file}`);
                console.log ("Track Indexed")
            }
            else {                
                if (fs.lstatSync(path + `/${file}`).isDirectory()) {
                    indexLibrary(path + `/${file}`);
                }
            }
        }
    }
}

async function indexTrack(path) {
    queue.push(path);
    var songData = await awaitableJsmediatags(path);
    await createSong(songData, path);
    return;
}

function awaitableJsmediatags(filename) {
    return new Promise(function(resolve, reject) {
      jsmediatags.read(filename, {
        onSuccess: function(tag) {
          resolve(tag);
        },
        onError: function(error) {
          reject(error);
        }
      });
    });
  }

async function checkArtistExists (artist) {
    console.log (`Checking Artist exists: ${artist}`);
    var query = `SELECT Id, Name
        FROM Artist
        WHERE Name = "${artist}"`;
    
    var artist = await repository.get(query);

    console.log (artist);
    return artist;
}

async function createArtist (artist) {
    console.log (`Creating Artist: ${artist}`);
    var artist = [uuidv1(), artist];

    await repository.run(`INSERT INTO Artist(Id, Name) VALUES(?, ?)`, artist);

    artist = {
        Id: artist[0],
        Name: artist[1]
    }
    return artist;
}

async function checkAlbumExists (album, artist) {
    // console.log (`Checking Album exists: ${album}`);

    var query = `SELECT Al.Id, Al.Title, Al.Artist, Al.Year
        FROM Album Al
        INNER JOIN Artist Ar ON Al.Artist = Ar.Id
        WHERE Al.Title = "${album}" AND Ar.Name = "${artist}"`;
    
    var album = await repository.get(query);
    return album;
}

async function createAlbum (album, artist, year) {
    // console.log (`Creating Album: ${album} - ${artist} - ${year}`);
    var album = [uuidv1(), album, artist, year];

    await repository.run(`INSERT INTO Album(Id, Title, Artist, Year) VALUES(?, ?, ?, ?)`, album);

    album = {
        Id: album[0],
        Title: album,
        Artist: artist,
        Year: year
    }
    return album;
}

async function checkSongExists (path) {
    // console.log (`Checking Song exists: ${path}`);
    var song = await repository.get(`SELECT *
                FROM Song
                WHERE Location = "${path}"`);

    if (song == null)
        return false;
    else
        return true;
}

async function createSong (songData, path) {
    path = path.replace(/\\/g,"/").toString();
    var songExists = await checkSongExists(path);
    if (!songExists) {
        // console.log (`Song doesn't exist ${path}`);
        var artistExists = await checkArtistExists(songData.tags.artist);
        var albumExists = await checkAlbumExists(songData.tags.album, songData.tags.artist);
        var artist;
        var album;

        if (artistExists == null)
            artist = await createArtist(songData.tags.artist);
        else
            artist = artistExists;

        if (albumExists == null && artist != null)
            album = await createAlbum(songData.tags.album, artist.Id, songData.tags.year);
        else
            album = albumExists;

        if (artist != null & album != null) {
            var song = [
                uuidv1(),
                songData.tags.title,
                album.Id,
                artist.Id,
                songData.tags.track,
                0,
                0,
                path
            ]

            console.log (`Creating Song: ${song}`);

            await repository.run(`INSERT INTO Song(Id, Title, Album, Artist, TrackNumber, Duration, PlayCount, Location) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`, song);
            var query = `INSERT INTO Song(Id, Title, Album, Artist, TrackNumber, Duration, PlayCount, Location) VALUES("${uuidv1()}", "${songData.tags.title}", "${album.Id}", "${artist.Id}", "${songData.tags.track}", 0, 0, "${path}")`;
            return song;
        }
    }
}