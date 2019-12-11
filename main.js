const electron = require("electron");
const { ipcMain, dialog, globalShortcut, systemPreferences } = require("electron");
const jsmediatags = require("jsmediatags");
const fs = require("fs");
const path = require("path");
const url = require("url");
const sqlite = require("sqlite");
const uuidv1 = require("uuid/v1");
const Promise = require("bluebird");
const btoa = require("btoa");
const imagemin = require("imagemin");
const imageminMozjpeg = require("imagemin-mozjpeg");
const Jimp = require("jimp")

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const openSqlitePromise = sqlite.open("./src/electron/repo.db", { Promise });

let window;
let repository;
let queue;
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

    // TO-DO - Add platform check for OS X here
    // const isTrusted = systemPreferences.isTrustedAccessibilityClient(true);
    // console.log("Is Trusted Accessibility Client: ", isTrusted);

    var previousRegistered = globalShortcut.register('MediaPreviousTrack', function () {
        window.webContents.send("mediaPreviousTrack", null);
    });

    var playRegistered = globalShortcut.register('MediaPlayPause', () => {
        window.webContents.send("mediaPlayPause", null);
    });

    var nextRegistered = globalShortcut.register('MediaNextTrack', () => {
        window.webContents.send("mediaNextTrack", null);
    });

    var stopRegistered = globalShortcut.register('MediaStop', function () {
        window.webContents.send("mediaStop", null);
    });

    init();

});

ipcMain.on("setLocation", (event, arg) => {
    setLocation();
});

ipcMain.on("fetchQueue", (event, arg) => {
    sendQueue();
});

ipcMain.on("fetchTracks", (event, arg) => {
    sendTracks();
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

        window.webContents.send("fileFetched", returnData);
    });    
});

async function init () {
    app.setAppUserModelId(process.execPath);
    repository = await openSqlitePromise;

    if (fs.existsSync("./settings.json")) {
        settings = require("./settings.json");
        if (await checkIndexRequired())
            indexLibrary(settings.filePath);
        else
            fetchSongs();
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
                indexLibrary(settings.filePath);
            }
        })
        .catch(err => {
            console.log(err);
        });
}

async function checkIndexRequired () {
    var songCount = await repository.all(`SELECT COUNT(Id) FROM Song`);
    if (songCount[0]['COUNT(Id)'] == 0)
        return true;
    else
        return false;
}

async function indexLibrary(path) {
    console.log(`Indexing ${path}`);
    
    var regex = /^.*\.(mp3|flac|aac)$/;
    if (fs.existsSync(path)) {
        var files = fs.readdirSync(path);
        for (i = 0; i <= files.length - 1; i++) {
            var file = files[i]
            if (regex.exec(file)) {
                await indexTrack(path + `/${file}`);
            }
            else {                
                if (fs.lstatSync(path + `/${file}`).isDirectory()) {
                    indexLibrary(path + `/${file}`);
                }
            }
        }
    }

    console.log ("Finished indexing");

    fetchSongs();
}

async function indexTrack(path) {
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


async function fetchTracks () {
    tracks = await repository.all(`
        SELECT S.Id, S.Title AS SongTitle , S.Album, Al.Title AS AlbumTitle, S.Artist, Ar.Name AS ArtistName, S.TrackNumber, S.PlayCount, Al.Year
        FROM Song S
        INNER JOIN Album Al on Al.Id = S.Album
        INNER JOIN Artist Ar on Ar.Id = S.Artist
        ORDER BY S.Artist, S.Album`
    );

    return tracks;
}

async function fetchSongs () {
    queue = await repository.all(`
        SELECT S.Id, S.Title AS SongTitle , S.Album, Al.Title AS AlbumTitle, S.Artist, Ar.Name AS ArtistName, S.TrackNumber, S.PlayCount, S.Location, Al.Year, Al.Artwork
        FROM Song S
        INNER JOIN Album Al on Al.Id = S.Album
        INNER JOIN Artist Ar on Ar.Id = S.Artist
        ORDER BY S.Artist, S.Album`
    );

    sendQueue();
}

async function checkArtistExists (artist) {
    // console.log (`Checking Artist exists: ${artist}`);
    var query = `SELECT Id, Name
        FROM Artist
        WHERE Name = "${artist}"`;
    
    var artist = await repository.get(query);
    return artist;
}

async function createArtist (artist) {
    // console.log (`Creating Artist: ${artist}`);
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

async function createAlbum (album, artist, year, albumArtData) {
    // console.log (`Creating Album: ${album} - ${artist} - ${year}`);
    var base64String = '';
    var imageData;
    var artLength = albumArtData.data.length;

    for (var i = 0; i < albumArtData.data.length; i++) {
        base64String += String.fromCharCode(albumArtData.data[i]);
    }

    if (artLength <= 150000) {
        imageData = 'data:' + albumArtData.format + ';base64,' + btoa(base64String);
    }
    else {
        minimisedImage = await minimiseImage(btoa(base64String), albumArtData.format, artLength);
        imageData = 'data:image/jpg;base64,' + minimisedImage;
    }
    
    var album = [uuidv1(), album, artist, year, imageData];

    await repository.run(`INSERT INTO Album(Id, Title, Artist, Year, Artwork) VALUES(?, ?, ?, ?, ?)`, album);

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
            album = await createAlbum(songData.tags.album, artist.Id, songData.tags.year, songData.tags.picture,);
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

            //console.log (`Creating Song: ${song}`);

            await repository.run(`INSERT INTO Song(Id, Title, Album, Artist, TrackNumber, Duration, PlayCount, Location) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`, song);
            var query = `INSERT INTO Song(Id, Title, Album, Artist, TrackNumber, Duration, PlayCount, Location) VALUES("${uuidv1()}", "${songData.tags.title}", "${album.Id}", "${artist.Id}", "${songData.tags.track}", 0, 0, "${path}")`;
            return song;
        }
    }
}

function sendQueue () {
    window.webContents.send("queueFetched", queue);
}

async function sendTracks () {
    var tracks = await fetchTracks();
    window.webContents.send("tracksFetched", tracks);
}

async function minimiseImage (albumArtData, format, length) {
    var fileExtension = format.split("/")[1];
    var tempFilePath = `./src/electron/temp.${fileExtension}`;

    var minificationFactor = length - 150000;
    minificationFactor = minificationFactor / length;
    minificationFactor = 1 - minificationFactor;
    
    fs.writeFileSync(tempFilePath, albumArtData, 'base64');

    if (fileExtension == "png") {
        const image = await Jimp.read(tempFilePath);
        image.write("./src/electron/temp.jpg");

        tempFilePath = "./src/electron/temp.jpg";
        await imagemin([tempFilePath], {
            destination: "./src/electron/finished",
            plugins: [
                imageminMozjpeg({
                    quality: 70,
                    maxMemory: 15
                })
            ]
        });
    
        fs.unlinkSync("./src/electron/temp.png");
    
        var bitmap = fs.readFileSync("./src/electron/finished/temp.jpg");
    
        fs.unlinkSync("./src/electron/finished/temp.jpg");
    
        return btoa(bitmap);
    }
    else {
        await imagemin([tempFilePath], {
            destination: "./src/electron",
            plugins: [
                imageminMozjpeg({
                    quality: 70,
                    maxMemory: 15
                })
            ]
        });

        var bitmap = fs.readFileSync(tempFilePath);

        fs.unlinkSync(tempFilePath);

        return btoa(bitmap);
    }
}