export class SongDataViewModel {
    public title: string;
    public artist: string;
    public album: string;
    public duration: number;
    public albumArt: any;

    constructor (title: string, artist: string, album: string, duration: number, albumArt: any) {
        this.title = title;
        this.artist = artist;
        this.album = album;
        this.duration = duration;
        this.albumArt = albumArt;
    }
}