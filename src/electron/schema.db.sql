BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "Song" (
	"Id"	TEXT NOT NULL,
	"Title"	TEXT NOT NULL,
	"Album"	TEXT NOT NULL,
	"Artist"	TEXT NOT NULL,
	"TrackNumber"	TEXT,
	"Duration"	INTEGER,
	"PlayCount"	INTEGER DEFAULT 0,
	"Location"	TEXT NOT NULL,
	FOREIGN KEY("Artist") REFERENCES "Artist"("Id") ON DELETE CASCADE,
	PRIMARY KEY("Id"),
	FOREIGN KEY("Album") REFERENCES "Album"("Id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "Playlist" (
	"Id"	TEXT NOT NULL,
	"Name"	TEXT NOT NULL,
	"Description"	TEXT,
	"CreatedOn"	TEXT,
	PRIMARY KEY("Id")
);
CREATE TABLE IF NOT EXISTS "PlaylistSong" (
	"Id"	TEXT NOT NULL,
	"SongId"	TEXT NOT NULL,
	"PlaylistId"	TEXT NOT NULL,
	"AddedOn"	TEXT,
	FOREIGN KEY("SongId") REFERENCES "Song"("Id"),
	PRIMARY KEY("Id"),
	FOREIGN KEY("PlaylistId") REFERENCES "Playlist"("Id")
);
CREATE TABLE IF NOT EXISTS "Album" (
	"Id"	TEXT NOT NULL,
	"Title"	TEXT NOT NULL,
	"Artist"	TEXT NOT NULL,
	"Year"	TEXT,
	"Artwork"	TEXT,
	PRIMARY KEY("Id"),
	FOREIGN KEY("Artist") REFERENCES "Artist"("Id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "Artist" (
	"Id"	TEXT NOT NULL,
	"Name"	TEXT NOT NULL,
	PRIMARY KEY("Id")
);
COMMIT;
