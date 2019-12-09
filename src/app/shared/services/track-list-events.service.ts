import { Injectable, EventEmitter } from "@angular/core";

@Injectable()
export class TrackListEventsService {
    public trackListReceived: EventEmitter<any> = new EventEmitter();
    public currentlyPlayingSongChanged: EventEmitter<string> = new EventEmitter();

    public emitTrackListReceived(trackList: any): void {
        this.trackListReceived.emit(trackList);
    }

    public emitCurrentlyPlayingSongChanged(currentlyPlayingSong: string): void {
        this.currentlyPlayingSongChanged.emit(currentlyPlayingSong);
    } 
}
