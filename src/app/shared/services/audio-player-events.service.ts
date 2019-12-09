import { Injectable, EventEmitter } from "@angular/core";

@Injectable()
export class AudioPlayerEventsService {
    public playStateToggle: EventEmitter<boolean> = new EventEmitter();
    public playSong: EventEmitter<any> = new EventEmitter();
    public fetchQueue: EventEmitter<boolean> = new EventEmitter();
    public fetchTracks: EventEmitter<boolean> = new EventEmitter();

    public emitPlayStateToggle(playState: boolean): void {
        this.playStateToggle.emit(playState);
    }

    public emitFetchQueue(): void {
        this.fetchQueue.emit(true);
    }
    
    public emitFetchTracks(): void {
        this.fetchTracks.emit(true);
    }

    public emitPlaySong(songData: any) {
        this.playSong.emit(songData);
    }
}
